<?php
// latest.php
session_start();
require __DIR__ . '/config/db.php';
$pdo = (new \Config\DB())->getConnection();

// 1. 讀分頁
$page    = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$perPage = 5;
$offset  = ($page - 1) * $perPage;

// 2. 一週前
$weekAgo = date('Y-m-d H:i:s', strtotime('-7 days'));

// 3. 總筆數
$stmtCount = $pdo->prepare("
  SELECT COUNT(*) FROM works
   WHERE created_at >= :weekAgo
");
$stmtCount->execute([':weekAgo' => $weekAgo]);
$total      = (int)$stmtCount->fetchColumn();
$totalPages = (int)ceil($total / $perPage);

// 4. 取本頁資料
$stmt = $pdo->prepare("
  SELECT id, title, description, thumb, created_at
    FROM works
   WHERE created_at >= :weekAgo
ORDER BY created_at DESC
   LIMIT :lim OFFSET :off
");
$stmt->bindValue(':weekAgo', $weekAgo);
$stmt->bindValue(':lim',     $perPage, \PDO::PARAM_INT);
$stmt->bindValue(':off',     $offset,  \PDO::PARAM_INT);
$stmt->execute();
$works = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>近期新作品（一週內）</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
    rel="stylesheet"
  />
  <style>
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.2); border-radius: 3px; }
  </style>
</head>
<body class="bg-white font-sans text-gray-800">
  <div class="flex min-h-screen">
    <!-- 側邊欄 -->
    <aside class="flex flex-col items-center bg-gray-100 w-16 py-4 space-y-6">
      <a href="latest.php" class="text-blue-600"><i class="fas fa-folder fa-lg"></i></a>
      <a href="#" class="text-gray-600 hover:text-blue-600"><i class="fas fa-home fa-lg"></i></a>
      <a href="#" class="text-gray-600 hover:text-blue-600"><i class="fas fa-bell fa-lg"></i></a>
      <a href="#" class="text-gray-600 hover:text-blue-600"><i class="fas fa-cog fa-lg"></i></a>
      <a href="#" class="mt-auto text-gray-600 hover:text-red-600"><i class="fas fa-sign-out-alt fa-lg"></i></a>
    </aside>

    <div class="flex-1 flex flex-col">
      <!-- 標題 -->
      <header class="p-4 bg-gray-50 border-b">
        <h1 class="text-xl font-semibold">近期新作品（一週內）</h1>
      </header>

      <!-- 搜尋／篩選列 -->
      <div class="flex items-center p-4 bg-gray-50">
        <button
          id="filterBtn"
          class="flex items-center bg-purple-100 text-purple-700 px-3 py-1 rounded-full mr-4"
        >
          <i class="fas fa-filter mr-2"></i>搜尋條件
        </button>
        <form id="searchForm" method="get" class="flex items-center">
          <input
            type="text"
            name="search"
            placeholder="search"
            class="border border-gray-300 rounded px-3 py-1 mr-2"
          />
          <button
            type="submit"
            class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >搜尋</button>
        </form>
      </div>

      <!-- 分頁選單（Tabs） -->
      <nav class="flex border-b border-gray-200">
        <a href="#" class="px-4 py-2 hover:text-purple-600">首頁</a>
        <a href="#" class="px-4 py-2 hover:text-purple-600">分類篩選</a>
        <a href="#" class="px-4 py-2 hover:text-purple-600">最近查看</a>
        <a
          href="latest.php"
          class="px-4 py-2 text-purple-600 border-b-2 border-purple-600"
        >最新作品</a>
        <a href="work_detail.php" class="px-4 py-2 hover:text-purple-600">作品隨心看</a>
      </nav>

      <!-- 作品列表 -->
      <div class="p-4 flex-1 space-y-4 overflow-auto">
        <?php if (empty($works)): ?>
          <p class="text-center text-gray-500">一週內沒有新作品。</p>
        <?php else: ?>
          <?php foreach ($works as $w): ?>
            <div class="flex bg-white shadow rounded p-4">
              <div
                class="w-24 h-24 bg-gray-200 rounded mr-4 flex-shrink-0"
                <?php if ($w['thumb']): ?>
                  style="background-image:url('<?= htmlspecialchars($w['thumb']) ?>');background-size:cover;"
                <?php endif; ?>
              ></div>
              <div class="flex-1">
                <h3 class="font-semibold text-lg"><?= htmlspecialchars($w['title']) ?></h3>
                <p class="text-sm text-gray-500 mb-1"><?= date('Y-m-d', strtotime($w['created_at'])) ?></p>
                <p class="text-gray-600"><?= nl2br(htmlspecialchars($w['description'])) ?></p>
                <a
                  href="work_detail.php?id=<?= $w['id'] ?>"
                  class="mt-2 inline-block px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100"
                >查看作品</a>
              </div>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>

      <!-- 分頁按鈕 -->
      <nav class="flex justify-center items-center space-x-1 mt-4 mb-4 text-gray-600">
        <?php if ($page > 1): ?>
          <a href="?page=<?= $page-1 ?>" class="flex items-center px-3 py-1 hover:text-gray-800">
            <i class="fas fa-chevron-left mr-1"></i>上一頁
          </a>
        <?php endif; ?>

        <?php
        // 動態產生最多 5 個頁碼
        $start = max(1, $page - 2);
        $end   = min($totalPages, $start + 4);
        if ($end - $start < 4) { $start = max(1, $end - 4); }
        for ($i = $start; $i <= $end; $i++): ?>
          <a
            href="?page=<?= $i ?>"
            class="px-3 py-1 rounded <?= $i === $page ? 'bg-purple-600 text-white' : 'hover:bg-gray-200' ?>"
          ><?= $i ?></a>
        <?php endfor; ?>

        <?php if ($page < $totalPages): ?>
          <a href="?page=<?= $page+1 ?>" class="flex items-center px-3 py-1 hover:text-gray-800">
            下一頁<i class="fas fa-chevron-right ml-1"></i>
          </a>
        <?php endif; ?>
      </nav>
    </div>
  </div>

  <script>
    document.getElementById('filterBtn').addEventListener('click', () => {
      alert('在這裡添加更多篩選選項');
    });
  </script>
</body>
</html>
