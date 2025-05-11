<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();

$activeTab = $_GET['tab'] ?? 'recent';
// 載入 EnterpriseDB 類別
require_once $_SERVER['DOCUMENT_ROOT'] . '/portfolio/enterprise/config/enterprise.php';

$db  = new \Config\EnterpriseDB();
$pdo = $db->getConnection();

try {
  // 先載入、session 啟動、DB 連線等已在外頭做過，就不重覆

  // 1. 處理 view_logs
  $userId = $_SESSION['user_id'] ?? 0;
  $workId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
  if ($userId && $workId) {
    $logStmt = $pdo->prepare("
      INSERT INTO view_logs (user_id, work_id)
      VALUES (?, ?)
    ");
    $logStmt->execute([$userId, $workId]);
  }

  // 2. 分頁、搜尋、排序參數
  $keyword     = trim($_GET['keyword'] ?? '');
  $keywordWild = '%' . $keyword . '%';
  $sortOrder   = (($_GET['sort'] ?? '') === 'newest') ? 'DESC' : 'ASC';
  $page        = max(1, intval($_GET['page'] ?? 1));
  $perPage     = 5;
  $offset      = ($page - 1) * $perPage;

  // 3. 計算總筆數
  $countSql = "
    SELECT COUNT(DISTINCT w.id)
      FROM view_logs v
      JOIN works w ON v.work_id = w.id
     WHERE v.user_id = ?
  ";
  $countParams = [$userId];
  if ($keyword !== '') {
    $countSql .= " AND (w.title LIKE ? OR w.content LIKE ?)";
    $countParams[] = $keywordWild;
    $countParams[] = $keywordWild;
  }
  $countStmt = $pdo->prepare($countSql);
  $countStmt->execute($countParams);
  $totalItems = (int)$countStmt->fetchColumn();
  $totalPages = (int)ceil($totalItems / $perPage);

  // 4. 撈本頁資料（全部用位置參數示範）
  $sql = "
    SELECT w.id, w.title, w.content AS description, w.thumb
      FROM view_logs v
      JOIN works w ON v.work_id = w.id
     WHERE v.user_id = ?
  ";
  $params = [$userId];
  if ($keyword !== '') {
    $sql .= " AND (w.title LIKE ? OR w.content LIKE ?)";
    $params[] = $keywordWild;
    $params[] = $keywordWild;
  }
  $sql .= "
    GROUP BY w.id
    ORDER BY MAX(v.viewed_at) $sortOrder
    LIMIT ? OFFSET ?
  ";
  $params[] = $perPage;
  $params[] = $offset;

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  $recentWorks = $stmt->fetchAll(PDO::FETCH_ASSOC);

} catch (\Throwable $e) {
  // 有任何例外就顯示錯誤並結束
  echo '<pre style="color:red">';
  echo 'Error: ' . htmlspecialchars($e->getMessage());
  echo '</pre>';
  exit;
}
// 隨機選一筆作品的 ID
$randStmt  = $pdo->query("SELECT id FROM works ORDER BY RAND() LIMIT 1");
$randomId  = $randStmt->fetchColumn();

$fullPath = $_SERVER['PHP_SELF'];
$current = basename($fullPath);
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>最近查看</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        rel="stylesheet"/>
</head>
<body class="bg-white font-sans text-gray-800">
<div class="flex min-h-screen">
  <!-- 左側欄 -->
<nav class="flex flex-col items-center bg-gray-300 w-14 py-6 space-y-6 shadow-md border-r">
  <!-- 主頁 -->
  <a href="/portfolio/enterprise/homepage/enterprise_dashboard.php"
     class="flex flex-col items-center w-14 h-14 justify-center
       <?= $current === 'enterprise_dashboard.php'
           ? 'text-white bg-blue-700'
           : 'text-black hover:bg-gray-400' ?>">
    <i class="fas fa-user-circle text-xl"></i>
    <span class="text-xs mt-1">主頁</span>
  </a>

  <!-- 瀏覽 -->
<a href="/portfolio/enterprise/browseportfolio/enterprise_portfolio.php"
   class="flex flex-col items-center w-14 h-14 justify-center
     <?= in_array(
          $current,
          [
            'enterprise_portfolio.php',
            'category_filter.php',     // 新增：分类筛选页
            'latest_works.php',        // 如果还有最新作品页
            'recent_views.php',        // 如果还有最近查看页
            'work_detail.php'          // 如果详情页也要高亮
          ]
        )
         ? 'text-white bg-blue-700'
         : 'text-black hover:bg-gray-400' ?>">
  <i class="fas fa-folder text-xl"></i>
  <span class="text-xs mt-1">瀏覽</span>
</a>

  <!-- 通知 -->
  <a href="/portfolio/enterprise/notifications/notification.php"
     class="flex flex-col items-center w-14 h-14 justify-center
       <?= $current === 'notification.php'
           ? 'text-white bg-blue-700'
           : 'text-black hover:bg-gray-400' ?>">
    <i class="fas fa-bell text-xl"></i>
    <span class="text-xs mt-1">通知</span>
  </a>

  <!-- 設定 -->
  <a href="/portfolio/enterprise/setting.php"
     class="flex flex-col items-center w-14 h-14 justify-center
       <?= $current === 'setting.php'
           ? 'text-white bg-blue-700'
           : 'text-black hover:bg-gray-400' ?>">
    <i class="fas fa-cog text-xl"></i>
    <span class="text-xs mt-1">設定</span>
  </a>

  <!-- 登出（不需要 active 樣式）-->
  <form method="post" action="/portfolio/enterprise/loginout.php">
    <button type="submit"
            class="flex flex-col items-center w-14 h-14 justify-center text-black hover:bg-gray-400">
      <i class="fas fa-sign-out-alt text-xl"></i>
      <span class="text-xs mt-1">登出</span>
    </button>
  </form>
</nav>


    <!-- 右側主內容 -->
    <main class="flex-1 p-6 overflow-y-auto">
      <!-- Top 篩選+搜尋（如需） -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full cursor-pointer">
          <span>篩選條件</span><i class="fas fa-chevron-down text-sm"></i>
        </div>
        <input type="search" placeholder="search"
               class="w-1/3 min-w-[200px] px-3 py-2 bg-gray-100 border border-gray-300 rounded"/>
      </div>

     
     
<!-- Tabs Bar -->
<ul class="flex gap-4 text-sm mb-4 border-b pb-2">
  <!-- 首頁 -->
  <li class="px-3 py-1 rounded-full border <?= $activeTab==='home'
       ? 'border-purple-700 text-purple-700 font-semibold'
       : 'border-gray-300 text-gray-700' ?>">
    <a href="enterprise_portfolio.php" class="block">首頁</a>
  </li>

  <!-- 分類篩選 -->
  <li class="px-3 py-1 rounded-full border <?= $activeTab==='filter'
       ? 'border-purple-700 text-purple-700 font-semibold'
       : 'border-gray-300 text-gray-700' ?>">
    <a href="category_filter.php?tab=filter" class="block">分類篩選</a>
  </li>

  <!-- 最近查看 -->
  <li class="px-3 py-1 rounded-full border <?= $activeTab==='recent'
       ? 'border-purple-700 text-purple-700 font-semibold'
       : 'border-gray-300 text-gray-700' ?>">
    <a href="recent_views.php?tab=recent" class="block">最近查看</a>
  </li>

  <!-- 最新作品 -->
  <li class="px-3 py-1 rounded-full border <?= $activeTab==='newest'
       ? 'border-purple-700 text-purple-700 font-semibold'
       : 'border-gray-300 text-gray-700' ?>">
    <a href="latest_works.php?tab=newest" class="block">最新作品</a>
  </li>

  <!-- 作品隨心看 -->
  <li class="px-3 py-1 rounded-full border <?= $activeTab==='random'
     ? 'border-purple-700 text-purple-700 font-semibold'
     : 'border-gray-300 text-gray-700' ?>">
  <a href="work_detail.php?id=<?= $randomId ?>&tab=random" class="block">
    作品隨心看
  </a>
</li>

</ul>

      <!-- 搜尋 + 排序 -->
      <div class="flex items-center justify-between mb-4">
        <form method="get" class="flex items-center space-x-2">
          
        </form>
        <a href="?sort=newest&keyword=<?= urlencode($keyword) ?>"
           class="px-3 py-1 bg-purple-700 text-white rounded-full text-xs">
          由新到舊
        </a>
      </div>

      <!-- 列表 -->
      <div class="space-y-4">
        <?php if (empty($recentWorks)): ?>
          <p class="text-center text-gray-500">沒有符合的作品。</p>
        <?php else: ?>
          <?php foreach ($recentWorks as $w): ?>
            <div class="flex border border-gray-200 rounded-md p-3 space-x-4">
              <img src="<?= htmlspecialchars($w['thumb']) ?>"
                   alt="<?= htmlspecialchars($w['title']) ?>"
                   class="w-20 h-20 bg-gray-100 rounded object-cover flex-shrink-0"/>
              <div class="flex-1 text-sm text-gray-700">
                <strong class="block text-base mb-1"><?= htmlspecialchars($w['title']) ?></strong>
                <p class="mb-2"><?= nl2br(htmlspecialchars($w['description'])) ?></p>
                <a href="work_detail.php?id=<?= $w['id'] ?>"
                   class="inline-block px-2 py-0.5 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300">
                  查看
                </a>
              </div>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>

      <!-- 分頁 -->
      <div class="mt-8 flex justify-center space-x-2 text-sm text-gray-600">
        <?php if ($page > 1): ?>
          <a href="?page=<?= $page-1 ?>&keyword=<?= urlencode($keyword) ?>&sort=<?= htmlspecialchars($_GET['sort'] ?? '') ?>"
             class="px-2 py-1 hover:underline">&larr; 上一頁</a>
        <?php endif; ?>
        <?php
          $start = max(1, $page - 2);
          $end   = min($totalPages, $start + 4);
          if ($end - $start < 4) $start = max(1, $end - 4);
          for ($i = $start; $i <= $end; $i++):
        ?>
          <a href="?page=<?= $i ?>&keyword=<?= urlencode($keyword) ?>&sort=<?= htmlspecialchars($_GET['sort'] ?? '') ?>"
             class="px-2 py-1 rounded <?= $i === $page ? 'bg-gray-800 text-white' : 'hover:underline' ?>">
            <?= $i ?>
          </a>
        <?php endfor; ?>
        <?php if ($page < $totalPages): ?>
          <a href="?page=<?= $page+1 ?>&keyword=<?= urlencode($keyword) ?>&sort=<?= htmlspecialchars($_GET['sort'] ?? '') ?>"
             class="px-2 py-1 hover:underline">下一頁 &rarr;</a>
        <?php endif; ?>
      </div>
    </main>
  </div>
</body>
</html>
