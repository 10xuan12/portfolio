<?php
session_start();
require __DIR__ . '/../config/db.php';

if (!isset($_SESSION['user_id'])) {
  header("Location: login.php");
  exit();
}

$user_id = $_SESSION['user_id'];
$pdo = (new \Config\DB())->getConnection();

$keyword = trim($_GET['keyword'] ?? '');
$sortOrder = ($_GET['sort'] ?? '') === 'newest' ? 'DESC' : 'ASC';
$page = max(1, intval($_GET['page'] ?? 1));
$perPage = 5;
$offset = ($page - 1) * $perPage;
$keywordWildcard = '%' . $keyword . '%';

// 計算總筆數
$countSql = "
  SELECT COUNT(DISTINCT w.id)
  FROM view_logs v
  JOIN works w ON v.work_id = w.id
  WHERE v.user_id = ?
";
$countParams = [$user_id];

if (!empty($keyword)) {
  $countSql .= " AND (w.title LIKE ? OR w.description LIKE ?)";
  $countParams[] = $keywordWildcard;
  $countParams[] = $keywordWildcard;
}

$stmt = $pdo->prepare($countSql);
$stmt->execute($countParams);
$totalItems = $stmt->fetchColumn();
$totalPages = ceil($totalItems / $perPage);

// 撈最近查看作品
$sql = "
  SELECT w.id, w.title, w.thumb, w.description
  FROM view_logs v
  JOIN works w ON v.work_id = w.id
  WHERE v.user_id = ?
";
$params = [$user_id];

if (!empty($keyword)) {
  $sql .= " AND (w.title LIKE ? OR w.description LIKE ?)";
  $params[] = $keywordWildcard;
  $params[] = $keywordWildcard;
}

$sql .= " GROUP BY w.id ORDER BY MAX(v.viewed_at) $sortOrder LIMIT $perPage OFFSET $offset";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$recentWorks = $stmt->fetchAll();
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>瀏覽作品頁面 – 最近查看</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet"/>
  <style>
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.2); border-radius: 3px; }
  </style>
</head>
<body class="bg-white font-sans text-gray-800">
  <div class="flex min-h-screen space-x-8">
    <!-- Sidebar -->
    <aside class="flex flex-col bg-gray-300 w-16 select-none">
      <button class="flex items-center justify-center h-16 w-16 border-b border-gray-400 hover:bg-gray-400" aria-label="主頁">
        <i class="fas fa-user-circle text-2xl text-black"></i>
      </button>
      <button class="flex items-center justify-center h-16 w-16 bg-blue-700 border-b border-gray-400 text-white" aria-label="瀏覽作品">
        <i class="fas fa-folder text-xl"></i>
      </button>
      <button class="flex items-center justify-center h-16 w-16 border-b border-gray-400 hover:bg-gray-400" aria-label="通知">
        <i class="fas fa-bell text-xl text-black"></i>
      </button>
      <button class="flex items-center justify-center h-16 w-16 border-b border-gray-400 hover:bg-gray-400" aria-label="設定">
        <i class="fas fa-cog text-xl text-black"></i>
      </button>
      <button class="flex items-center justify-center h-16 w-16 border-b border-gray-400 hover:bg-gray-400 mt-auto" aria-label="登出">
        <i class="fas fa-sign-out-alt text-xl text-black"></i>
      </button>
    </aside>

    <!-- Main -->
    <main class="flex-1 py-6 px-4">
      <!-- 搜尋表單 -->
      <div class="flex justify-end mb-6">
        <form method="get" class="flex items-center bg-gray-200 rounded-md px-3 py-2 space-x-2 text-gray-600 text-sm">
          <input type="text" name="keyword" placeholder="輸入關鍵字..." value="<?= htmlspecialchars($keyword) ?>" class="bg-transparent outline-none text-sm w-40" />
          <input type="hidden" name="sort" value="<?= htmlspecialchars($_GET['sort'] ?? '') ?>" />
          <button type="submit" class="text-purple-700 text-xs px-2 py-1 rounded hover:underline">搜尋</button>
        </form>
      </div>

      <!-- Tabs -->
      <div class="max-w-lg mx-auto mb-4 border border-gray-300 rounded-full flex text-xs font-medium text-gray-700">
        <button class="flex-1 py-1 rounded-full border-r border-gray-300 hover:bg-gray-100">首頁</button>
        <button class="flex-1 py-1 rounded-full hover:bg-gray-100 border-r border-gray-300">分類篩選</button>
        <button class="flex-1 py-1 rounded-full bg-gray-300 text-gray-900 border-r border-gray-300">最近查看</button>
        <button class="flex-1 py-1 rounded-full hover:bg-gray-100 border-r border-gray-300">最新作品</button>
        <button class="flex-1 py-1 rounded-full hover:bg-gray-100">作品關心榜</button>
      </div>

      <!-- 排序按鈕 -->
      <div class="max-w-lg mx-auto mb-4">
        <a href="?sort=newest&keyword=<?= urlencode($keyword) ?>" class="bg-purple-700 text-white text-xs rounded-full px-3 py-1">
          由新到舊
        </a>
      </div>

      <!-- 作品列表 -->
      <div class="max-w-lg mx-auto space-y-4">
        <?php if (empty($recentWorks)): ?>
          <p class="text-center text-gray-500">沒有符合的作品。</p>
        <?php else: ?>
          <?php foreach ($recentWorks as $work): ?>
            <div class="flex border border-gray-200 rounded-md p-3 space-x-4">
              <img src="<?= htmlspecialchars($work['thumb']) ?>" alt="作品縮圖" class="w-20 h-20 bg-gray-200 flex-shrink-0 rounded" />
              <div class="flex flex-col justify-start text-xs text-gray-700">
                <strong class="text-sm mb-1"><?= htmlspecialchars($work['title']) ?></strong>
                <p class="mb-2 leading-tight"><?= nl2br(htmlspecialchars($work['description'])) ?></p>
                <a href="work_detail.php?id=<?= $work['id'] ?>" class="bg-gray-300 text-gray-700 text-xs rounded px-2 py-0.5 w-max">查看</a>
              </div>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>

      <!-- 分頁元件（最多6頁） -->
      <?php
        $start = max(1, $page - 2);
        $end = min($totalPages, $start + 5);
        $start = max(1, $end - 5); // 若靠近尾頁，往前補
      ?>
      <div class="max-w-lg mx-auto mt-8 flex justify-center space-x-2 text-sm text-gray-600">
        <?php if ($page > 1): ?>
          <a href="?page=<?= $page - 1 ?>&keyword=<?= urlencode($keyword) ?>&sort=<?= htmlspecialchars($_GET['sort'] ?? '') ?>" class="px-2 py-1 hover:underline">&larr; Previous</a>
        <?php endif; ?>
        <?php for ($i = $start; $i <= $end; $i++): ?>
          <a href="?page=<?= $i ?>&keyword=<?= urlencode($keyword) ?>&sort=<?= htmlspecialchars($_GET['sort'] ?? '') ?>" class="px-2 py-1 rounded <?= $i === $page ? 'bg-gray-800 text-white' : 'hover:underline' ?>"><?= $i ?></a>
        <?php endfor; ?>
        <?php if ($page < $totalPages): ?>
          <a href="?page=<?= $page + 1 ?>&keyword=<?= urlencode($keyword) ?>&sort=<?= htmlspecialchars($_GET['sort'] ?? '') ?>" class="px-2 py-1 hover:underline">Next &rarr;</a>
        <?php endif; ?>
      </div>
    </main>
  </div>
</body>
</html>
