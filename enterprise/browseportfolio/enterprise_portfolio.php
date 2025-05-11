<?php
session_start();
ini_set('display_errors',1);
error_reporting(E_ALL);

// 取得當前 activeTab
$activeTab = $_GET['tab'] ?? 'home';

// 載入 EnterpriseDB 類別並取得 PDO
require __DIR__ . '/../config/enterprise.php';
$db  = new \Config\EnterpriseDB();
$pdo = $db->getConnection();

// 隨機選一筆 works 表的 ID，給「作品隨心看」用
$randStmt = $pdo->query("SELECT id FROM works ORDER BY RAND() LIMIT 1");
$randomId = $randStmt->fetchColumn();

// --- 各 tab 所需資料 ---
// 1. 首頁（輪播 + 公告）
$carouselItems = $pdo
    ->query("SELECT * FROM works WHERE featured = 1")
    ->fetchAll();

/// --- 公告分頁邏輯完整版 ---
$annsPerPage = 5;
$annPageRaw  = $_GET['ann_page'] ?? 1;

if ($annPageRaw === 'all') {
    $announcements = $pdo
        ->query("SELECT id, message, created_at
                  FROM announcements
                 ORDER BY created_at DESC")
        ->fetchAll(PDO::FETCH_ASSOC);
    $annPage       = 'all';
    $annTotalPages = 1;
} else {
    $annPage       = max(1, (int)$annPageRaw);
    $totalAnns     = (int)$pdo->query("SELECT COUNT(*) FROM announcements")->fetchColumn();
    $annTotalPages = (int)ceil($totalAnns / $annsPerPage);
    $annOffset     = ($annPage - 1) * $annsPerPage;

    $annStmt = $pdo->prepare(
        "SELECT id, message, created_at
          FROM announcements
         ORDER BY created_at DESC
         LIMIT :limit OFFSET :offset"
    );
    $annStmt->bindValue(':limit',  $annsPerPage, PDO::PARAM_INT);
    $annStmt->bindValue(':offset', $annOffset,   PDO::PARAM_INT);
    $annStmt->execute();
    $announcements = $annStmt->fetchAll(PDO::FETCH_ASSOC);
}

// Tabs 定義（給前端迴圈用）
$tabs = [
    'home'   => '首頁',
    'filter' => '分類篩選',
    'recent' => '最近查看',
    'newest' => '最新作品',
    'random' => '作品隨心看',
];

// 取出 URL 中的路徑（從 /portfolio/enterprise/... 開始）
$fullPath = $_SERVER['PHP_SELF'];
$current = basename($fullPath);
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>企業瀏覽作品集</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        rel="stylesheet"/>
  <style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
</head>
<body class="bg-white font-sans">
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
       <?= $current === 'enterprise_portfolio.php'
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


      <div class="max-w-4xl mx-auto">
       <!-- 首頁 -->
<section id="home" class="tab-content mt-8">
  <section aria-label="作品輪播"
           class="max-w-4xl mx-auto mt-8 flex items-center relative">
    <!-- 左鍵 -->
    <button id="prevBtn"
            aria-label="上一頁"
            class="absolute left-0 z-30 bg-blue-600 text-white rounded-full w-8 h-16 flex items-center justify-center">
      &lt;
    </button>

    <!-- 重疊容器 -->
    <div id="carousel"
         tabindex="0"
         class="flex overflow-x-auto scrollbar-hide pl-4"
         style="scroll-snap-type: x mandatory; outline: none;">
      <?php foreach($carouselItems as $w): ?>
        <article
  class="
    relative flex-shrink-0 w-56 h-32 bg-gray-200 rounded-lg
    p-0 flex flex-col border border-gray-300
  "
>
  <!-- 上半區：只留 80% 高度，並水平垂直置中圖片 -->
  <div class="flex-1 flex items-center justify-center overflow-hidden rounded-t-lg">
    <img src="<?= htmlspecialchars($w['thumb']) ?>"
         class="h-full w-full object-cover">
  </div>

  <!-- 下半區：20% 高度，放標題 -->
  <div class="h-1/5 flex items-center justify-center bg-white rounded-b-lg">
    <span class="text-xs text-gray-700">
      <?= htmlspecialchars($w['title']) ?>
    </span>
  </div>
</article>
      <?php endforeach; ?>
    </div>

    <!-- 右鍵 -->
    <button id="nextBtn"
            aria-label="下一頁"
            class="absolute right-0 z-30 bg-blue-600 text-white rounded-full w-8 h-16 flex items-center justify-center">
      &gt;
    </button>
  </section>
</section>


         
<!-- 公告 -->
 <section class="bg-indigo-50 rounded-xl p-6 mb-10 mt-8 relative">
 <h3 class="text-xl font-semibold mb-4 bg-indigo-200 px-4 py-2 rounded-t-lg">
    公告
  </h3>

  <ul id="announcement-list" class="divide-y divide-dotted divide-indigo-300">
    <?php if (empty($announcements)): ?>
      <li class="py-3 text-center text-gray-500">
        目前沒有公告。
      </li>
    <?php else: ?>
      <?php foreach ($announcements as $ann): ?>
        <li class="py-3">
          <div class="flex items-start space-x-3">
            <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
              <?= htmlspecialchars(mb_strtoupper(mb_substr($ann['message'], 0, 1, 'UTF-8'))) ?>
            </div>
            <div class="flex-1 text-gray-800">
              <div class="font-semibold text-sm text-gray-700">
                <?= htmlspecialchars($ann['message']) ?>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                <?= htmlspecialchars($ann['created_at']) ?>
              </div>
            </div>
          </div>
        </li>
      <?php endforeach; ?>
    <?php endif; ?>
  </ul>

  <?php if ($annPage !== 'all'): ?>
    <div class="flex justify-end bg-indigo-200 px-4 py-2 rounded-b-lg mt-4 text-indigo-800">
      <?php if ($annPage > 1): ?>
        <a href="?ann_page=<?= $annPage-1 ?>" class="hover:underline mr-4">← 上一頁</a>
      <?php endif; ?>
      <?php for ($i = 1; $i <= $annTotalPages; $i++): ?>
        <?php if ($i === $annPage): ?>
          <span class="font-bold px-2"><?= $i ?></span>
        <?php else: ?>
          <a href="?ann_page=<?= $i ?>" class="hover:underline px-2"><?= $i ?></a>
        <?php endif; ?>
      <?php endfor; ?>
      <?php if ($annPage < $annTotalPages): ?>
        <a href="?ann_page=<?= $annPage+1 ?>" class="hover:underline ml-4">下一頁 →</a>
      <?php endif; ?>
      <a href="?ann_page=all" class="font-semibold hover:underline ml-6">查看全部 &gt;&gt;</a>
    </div>
  <?php else: ?>
    <div class="flex justify-end bg-indigo-200 px-4 py-2 rounded-b-lg mt-4 text-indigo-800">
      <a href="?ann_page=1" class="font-semibold hover:underline">回分頁模式</a>
    </div>
  <?php endif; ?>
</section>

       

  
  <!-- Tab 切換邏輯 -->
<script>
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('border-purple-700','text-purple-700','font-semibold');
        b.classList.add('border-gray-300','text-gray-700');
      });
      btn.classList.add('border-purple-700','text-purple-700','font-semibold');
      btn.classList.remove('border-gray-300','text-gray-700');

      const tgt = btn.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(sec => {
        sec.id === tgt ? sec.classList.remove('hidden') : sec.classList.add('hidden');
      });
    });
  });
</script>

<!-- Carousel 滑動邏輯 -->
<script>
  (function(){
    const carousel = document.getElementById('carousel');
    const prevBtn  = document.getElementById('prevBtn');
    const nextBtn  = document.getElementById('nextBtn');
    if (!carousel || !prevBtn || !nextBtn) return;

    // 計算滑動量
    const firstCard   = carousel.querySelector('article');
    const style       = getComputedStyle(firstCard);
    const cardWidth   = firstCard.offsetWidth;
    const overlap     = Math.abs(parseInt(style.marginLeft, 10)); 
    const scrollAmt   = cardWidth - overlap;

    prevBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: -scrollAmt, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      carousel.scrollBy({ left:  scrollAmt, behavior: 'smooth' });
    });
    carousel.addEventListener('keydown', e => {
      if (e.key==='ArrowLeft')  carousel.scrollBy({ left: -scrollAmt, behavior: 'smooth' });
      if (e.key==='ArrowRight') carousel.scrollBy({ left:  scrollAmt, behavior: 'smooth' });
    });
  })();
</script>

</body>
</html>