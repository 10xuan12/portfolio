<?php
session_start();

$activeTab = $_GET['tab'] ?? 'newest';
// 載入 EnterpriseDB 類別
require $_SERVER['DOCUMENT_ROOT']
    . '/portfolio/enterprise/config/enterprise.php';

$db  = new \Config\EnterpriseDB();
$pdo = $db->getConnection();

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
  SELECT 
    w.id,
    w.title,
    w.content     AS description,
    w.thumb,
    w.created_at,
    c.name AS category_name,
    l.name AS location_name
  FROM works AS w
  JOIN categories AS c ON w.category_id = c.id
  JOIN locations  AS l ON w.location_id = l.id
  WHERE w.created_at >= :weekAgo
  ORDER BY w.created_at DESC
  LIMIT :lim OFFSET :off
");

// 綁定參數
$stmt->bindValue(':weekAgo', $weekAgo);
$stmt->bindValue(':lim',     $perPage, PDO::PARAM_INT);
$stmt->bindValue(':off',     $offset,  PDO::PARAM_INT);

// **執行 SQL**
$stmt->execute();

// **抓出結果**
$works = $stmt->fetchAll(PDO::FETCH_ASSOC);
// Tabs 定義（給前端迴圈用）
$tabs = [
  'home'   => '首頁',
  'filter' => '分類篩選',
  'recent' => '最近查看',
  'newest' => '最新作品',
  'random' => '作品隨心看',
];

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
  <title>近期新作品</title>
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

  <!-- 登出 -->
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

      <!-- 作品列表 -->
      <div class="p-4 flex-1 space-y-4 overflow-auto">
  <?php if (empty($works)): ?>
    <p class="text-center text-gray-500">一週內沒有新作品。</p>
  <?php else: ?>
    <?php foreach ($works as $w): ?>
      <div class="flex items-center bg-white shadow rounded-md p-4 space-x-4">
        <!-- 左側縮圖 -->
        <div class="w-24 h-24 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
          <?php if ($w['thumb']): ?>
            <img src="<?= htmlspecialchars($w['thumb']) ?>"
                 class="w-full h-full object-cover">
          <?php else: ?>
            <div class="w-full h-full flex items-center justify-center text-gray-400">
              <i class="fas fa-image fa-2x"></i>
            </div>
          <?php endif; ?>
        </div>

        <!-- 中間文字區 -->
        <div class="flex-1">
          <h3 class="font-semibold text-lg mb-1"><?= htmlspecialchars($w['title']) ?></h3>
          <p class="text-sm text-gray-600 mb-1">
            <?= nl2br(htmlspecialchars($w['description'])) ?>
          </p>
          <p class="text-xs text-gray-400">
            <?= date('Y-m-d', strtotime($w['created_at'])) ?>
          </p>
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
