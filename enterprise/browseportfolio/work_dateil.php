<?php
// work_detail.php
session_start();
require __DIR__ . '/config/db.php';
$pdo = (new \Config\DB())->getConnection();

// 取得並驗證 id
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) {
  header('Location: latest.php');
  exit;
}

// 查單筆作品
$stmt = $pdo->prepare("SELECT * FROM works WHERE id = :id");
$stmt->execute([':id' => $id]);
$w = $stmt->fetch();
if (!$w) {
  echo '<p class="p-4 text-center text-red-600">找不到這件作品。</p>';
  exit;
}

// （可選）抓檔案列表
$stmt2 = $pdo->prepare("SELECT file_name, file_path FROM work_files WHERE work_id = :id");
$stmt2->execute([':id' => $id]);
$files = $stmt2->fetchAll();
?>
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title><?= htmlspecialchars($w['title']) ?>｜作品隨心看</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
    rel="stylesheet"
  />
  <style>
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb {
      background-color: rgba(0,0,0,0.1);
      border-radius: 3px;
    }
  </style>
</head>
<body class="bg-white font-sans text-gray-800">
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="flex flex-col items-center bg-gray-100 w-16 py-6 space-y-8">
      <a href="index.php" class="text-gray-600 hover:text-purple-600">
        <i class="fas fa-home fa-lg"></i><span class="sr-only">主頁</span>
      </a>
      <a href="latest.php" class="text-gray-600 hover:text-purple-600">
        <i class="fas fa-folder fa-lg"></i><span class="sr-only">瀏覽作品</span>
      </a>
      <a href="notifications.php" class="text-gray-600 hover:text-purple-600">
        <i class="fas fa-bell fa-lg"></i><span class="sr-only">通知</span>
      </a>
      <a href="settings.php" class="text-gray-600 hover:text-purple-600">
        <i class="fas fa-cog fa-lg"></i><span class="sr-only">設定</span>
      </a>
      <a href="logout.php" class="text-gray-600 hover:text-purple-600 mt-auto">
        <i class="fas fa-sign-out-alt fa-lg"></i><span class="sr-only">登出</span>
      </a>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- 搜尋列 -->
      <div class="flex items-center bg-gray-50 p-4 border-b space-x-4">
        <button class="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
          <i class="fas fa-chevron-left mr-2"></i>搜尋條件
        </button>
        <div class="flex-1 relative">
          <input
            type="text"
            placeholder="search"
            class="w-full border rounded-full pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <i class="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      <!-- 分頁 Tabs -->
      <nav class="flex space-x-4 bg-white p-4 border-b">
        <a href="index.php" class="px-4 py-2 hover:text-purple-600">首頁</a>
        <a href="filter.php" class="px-4 py-2 hover:text-purple-600">分類篩選</a>
        <a href="recent.php" class="px-4 py-2 hover:text-purple-600">最近查看</a>
        <a href="latest.php" class="px-4 py-2 hover:text-purple-600">最新作品</a>
        <a href="random.php" class="px-4 py-2 bg-purple-100 text-purple-700 rounded-full">作品隨心看</a>
      </nav>

      <!-- 作品詳情 -->
      <div class="p-6 space-y-6">
        <div class="flex space-x-6">
          <div class="w-1/2 bg-gray-200 rounded-lg h-48 overflow-hidden flex items-center justify-center">
            <?php if ($w['thumb']): ?>
              <img src="<?= htmlspecialchars($w['thumb']) ?>" alt="" class="object-cover w-full h-full"/>
            <?php else: ?>
              <i class="fas fa-image fa-3x text-gray-400"></i>
            <?php endif; ?>
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold"><?= htmlspecialchars($w['title']) ?></h2>
            <p class="text-gray-500"><?= htmlspecialchars($w['category'] ?? '') ?></p>
          </div>
        </div>

        <!-- 簡介 -->
        <div>
          <h3 class="inline-block bg-blue-700 text-white px-4 py-2 rounded-t">簡介</h3>
          <div class="bg-pink-100 p-4 rounded-b">
            <?= nl2br(htmlspecialchars($w['description'])) ?>
          </div>
        </div>

        <!-- 檔案列表 -->
        <?php if ($files): ?>
        <ul class="space-y-2">
          <?php foreach($files as $f): ?>
          <li class="flex items-center space-x-2">
            <i class="fas fa-folder text-gray-600"></i>
            <a href="<?= htmlspecialchars($f['file_path']) ?>" download class="hover:underline">
              <?= htmlspecialchars($f['file_name']) ?>
            </a>
          </li>
          <?php endforeach; ?>
        </ul>
        <?php endif; ?>
      </div>
    </div>
  </div>
</body>
</html>