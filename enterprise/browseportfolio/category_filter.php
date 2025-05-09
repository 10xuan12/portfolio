<?php
session_start();
ini_set('display_errors',1);
error_reporting(E_ALL);

// 決定當前活躍的 tab
$activeTab = $_GET['tab'] ?? 'filter';

// 載入 DB 類別
require __DIR__ . '/../config/enterprise.php';
$db  = new \Config\EnterpriseDB();
$pdo = $db->getConnection();

// 取得篩選參數／分頁
$cats    = $_GET['cat']  ?? [];
$locs    = $_GET['loc']  ?? [];
$page    = max(1, (int)($_GET['page'] ?? 1));
$perPage = 5;
$offset  = ($page - 1) * $perPage;

// 撈清單
$categoryList = $pdo->query("SELECT id, name FROM categories")->fetchAll();
$locationList = $pdo->query("SELECT id, name FROM locations")->fetchAll();

// 撈作品
$where = [];
if($cats) $where[] = "w.category_id IN(".implode(',',$cats).")";
if($locs) $where[] = "w.location_id IN(".implode(',',$locs).")";
$whereSql = $where ? 'WHERE '.implode(' AND ',$where):'';
$total      = (int)$pdo->query("SELECT COUNT(*) FROM works w $whereSql")->fetchColumn();
$totalPages = ceil($total/$perPage);

$sql = <<<SQL
SELECT w.id,w.title,w.thumb,w.content,
       c.name AS category_name,
       l.name AS location_name
  FROM works w
  JOIN categories c ON w.category_id=c.id
  JOIN locations  l ON w.location_id=l.id
$whereSql
ORDER BY w.created_at DESC
LIMIT :lim OFFSET :off
SQL;
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':lim',$perPage,PDO::PARAM_INT);
$stmt->bindValue(':off',$offset,PDO::PARAM_INT);
$stmt->execute();
$works = $stmt->fetchAll();

// Tabs 定義
$tabs = [
  'home'   => '首頁',
  'filter' => '分類篩選',
  'recent' => '最近查看',
  'newest' => '最新作品',
  'random' => '作品隨心看',
];
?>
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>分類篩選｜瀏覽作品</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        rel="stylesheet"/>
</head>
<body class="bg-white font-sans text-gray-800">
  <div class="flex min-h-screen">
    <!-- 左側欄 -->
    <nav class="flex flex-col items-center bg-gray-300 w-14 py-6 space-y-6 shadow-md border-r">
      <button class="flex flex-col items-center w-14 h-14 justify-center text-black">
        <i class="fas fa-user-circle text-xl"></i>
        <span class="text-xs mt-1">主頁</span>
      </button>
      <button class="flex flex-col items-center w-14 h-14 justify-center text-white bg-blue-700">
        <i class="fas fa-folder text-xl"></i>
        <span class="text-xs mt-1">瀏覽</span>
      </button>
      <button class="flex flex-col items-center w-14 h-14 justify-center text-black">
        <i class="fas fa-bell text-xl"></i>
        <span class="text-xs mt-1">通知</span>
      </button>
      <button class="flex flex-col items-center w-14 h-14 justify-center text-black">
        <i class="fas fa-cog text-xl"></i>
        <span class="text-xs mt-1">設定</span>
      </button>
      <form method="post" action="logout.php">
        <button type="submit" class="flex flex-col items-center w-14 h-14 justify-center text-black">
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
  <li class="px-3 py-1 rounded-full border <?= $activeTab==='home' ? 'border-purple-700 text-purple-700 font-semibold' : 'border-gray-300 text-gray-700' ?>">
    <a href="enterprise_portfolio.php" class="block">首頁</a>
  </li>

  <!-- 分類篩選 -->
  <li class="px-3 py-1 rounded-full border <?= $activeTab==='filter' ? 'border-purple-700 text-purple-700 font-semibold' : 'border-gray-300 text-gray-700' ?>">
    <a href="category_filter.php?tab=filter" class="block">分類篩選</a>
  </li>

  <!-- 最近查看 -->
  <li class="px-3 py-1 rounded-full border <?= $activeTab==='recent' ? 'border-purple-700 text-purple-700 font-semibold' : 'border-gray-300 text-gray-700' ?>">
    <a href="recent_views.php?tab=recent" class="block">最近查看</a>
  </li>

  <!-- 最新作品 -->
  <li class="px-3 py-1 rounded-full border <?= $activeTab==='newest' ? 'border-purple-700 text-purple-700 font-semibold' : 'border-gray-300 text-gray-700' ?>">
    <a href="latest_works.php?tab=newest" class="block">最新作品</a>
  </li>

  <!-- 作品隨心看 -->
  <li class="px-3 py-1 rounded-full border <?= $activeTab==='random' ? 'border-purple-700 text-purple-700 font-semibold' : 'border-gray-300 text-gray-700' ?>">
    <a href="work_detail.php?tab=random" class="block">作品隨心看</a>
  </li>
</ul>


      <!-- 學群／地區 篩選（filter 頁） -->
      <?php if($activeTab==='filter'): ?>
        <div class="bg-white p-4 rounded-lg shadow mb-6">
          <div class="flex items-center mb-2">
            <span class="w-12 font-semibold">學群</span>
            <div class="flex flex-wrap gap-2">
              <?php foreach($categoryList as $cat): ?>
                <a href="?tab=filter&cat[]=<?= $cat['id'] ?>&page=1"
                   class="px-2 py-1 rounded-full border <?= in_array($cat['id'],$cats)?'bg-purple-200 font-semibold':'bg-white' ?>">
                  <?= $cat['name'] ?>
                </a>
              <?php endforeach; ?>
            </div>
          </div>
          <div class="flex items-center">
            <span class="w-12 font-semibold">地區</span>
            <div class="flex flex-wrap gap-2">
              <?php foreach($locationList as $loc): ?>
                <a href="?tab=filter&loc[]=<?= $loc['id'] ?>&page=1"
                   class="px-2 py-1 rounded-full border <?= in_array($loc['id'],$locs)?'bg-purple-200 font-semibold':'bg-white' ?>">
                  <?= $loc['name'] ?>
                </a>
              <?php endforeach; ?>
            </div>
          </div>
        </div>
      <?php endif; ?>


      <?php if ($activeTab === 'filter'): ?>
  <!-- 作品卡片列表 -->
  <section class="space-y-6 max-w-4xl mx-auto mt-4">
    <?php if (empty($works)): ?>
      <p class="text-center text-gray-500 py-8">
        找不到符合條件的作品。
      </p>
    <?php else: ?>
      <?php foreach ($works as $w): ?>
        <article class="flex items-start bg-white p-6 rounded-lg shadow-md">
          <img
            src="<?= htmlspecialchars($w['thumb'] ?: '/images/placeholder.png') ?>"
            alt="<?= htmlspecialchars($w['title']) ?> 縮圖"
            class="w-16 h-16 bg-gray-100 rounded mr-4 object-cover"
          />
          <div>
            <h4 class="text-lg font-semibold">
              <?= htmlspecialchars($w['title']) ?>
            </h4>
            <p class="text-sm text-gray-500">
              <?= htmlspecialchars(
                   mb_substr(
                     explode("\n", $w['content'])[0],
                     0,
                     40
                   )
                 ) ?>…
            </p>
          </div>
        </article>
      <?php endforeach; ?>
    <?php endif; ?>
  </section>

  <!-- 分頁 -->
  <nav class="flex justify-center mt-8">
    <ul class="inline-flex items-center space-x-2 text-sm">
      <!-- 上一頁 -->
      <?php if ($page > 1): ?>
        <li>
          <a
            href="?<?= http_build_query(array_merge($_GET, ['page' => $page - 1])) ?>"
            class="px-3 py-1 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
          >
            ← 上一頁
          </a>
        </li>
      <?php endif; ?>

      <!-- 頁碼 -->
      <?php for ($i = 1; $i <= $totalPages; $i++): ?>
        <li>
          <a
            href="?<?= http_build_query(array_merge($_GET, ['page' => $i])) ?>"
            class="px-3 py-1 rounded
                   <?= $i === $page
                       ? 'bg-purple-600 text-white'
                       : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50' ?>"
          >
            <?= $i ?>
          </a>
        </li>
      <?php endfor; ?>

      <!-- 下一頁 -->
      <?php if ($page < $totalPages): ?>
        <li>
          <a
            href="?<?= http_build_query(array_merge($_GET, ['page' => $page + 1])) ?>"
            class="px-3 py-1 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
          >
            下一頁 →
          </a>
        </li>
      <?php endif; ?>
    </ul>
  </nav>
<?php endif; ?>

    </main>
  </div>
</body>
</html>
