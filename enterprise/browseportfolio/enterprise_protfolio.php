<?php
session_start();

// 載入 EnterpriseDB 類別
require $_SERVER['DOCUMENT_ROOT']
    . '/portfolio/enterprise/config/enterprise.php';

$db  = new \Config\EnterpriseDB();
$pdo = $db->getConnection();


// --- 各 tab 所需資料 ---
// 首頁（輪播 + 公告）
$carouselItems    = $pdo->query("SELECT * FROM works WHERE featured=1")->fetchAll();
$announcements    = $pdo->query("SELECT * FROM announcements ORDER BY created_at DESC LIMIT 10")->fetchAll();

// 分類篩選清單
$categoryList     = $pdo->query("SELECT * FROM categories")->fetchAll();
$locationList     = $pdo->query("SELECT * FROM locations")->fetchAll();

// 最近查看
$userId        = $_SESSION['user_id'] ?? 0;
$recentIdsStmt = $pdo->prepare("SELECT work_id FROM user_views WHERE user_id=? ORDER BY viewed_at DESC LIMIT 10");
$recentIdsStmt->execute([$userId]);
$ids = array_column($recentIdsStmt->fetchAll(), 'work_id');
$recentWorks = $ids
    ? $pdo->query("SELECT * FROM works WHERE id IN(".implode(',',$ids).")")->fetchAll()
    : [];

// 最新作品
$latestWorks = $pdo->query("SELECT * FROM works ORDER BY created_at DESC LIMIT 10")->fetchAll();

// 隨機一件
$randomWork = $pdo->query("SELECT * FROM works ORDER BY RAND() LIMIT 1")->fetch();

// 公告分頁設定
$annsPerPage      = 10;
$annPage          = max(1, (int)($_GET['ann_page']  ?? 1));
$totalAnns        = (int)$pdo->query("SELECT COUNT(*) FROM announcements")->fetchColumn();
$annTotalPages    = (int)ceil($totalAnns / $annsPerPage);
$annOffset        = ($annPage - 1) * $annsPerPage;

//最新的第一筆
$annStmt = $pdo->prepare("
  SELECT title, content
    FROM announcements
   ORDER BY created_at DESC      
   LIMIT :limit OFFSET :offset
");
$annStmt->bindValue(':limit',  $annsPerPage, PDO::PARAM_INT);
$annStmt->bindValue(':offset', $annOffset,   PDO::PARAM_INT);
$annStmt->execute();
$announcements = $annStmt->fetchAll();

// 撈當前頁的公告
$annStmt = $pdo->prepare("
  SELECT title, content 
  FROM announcements 
  ORDER BY created_at DESC 
  LIMIT :limit OFFSET :offset
");
$annStmt->bindValue(':limit',  $annsPerPage, PDO::PARAM_INT);
$annStmt->bindValue(':offset', $annOffset,   PDO::PARAM_INT);
$annStmt->execute();
$announcements = $annStmt->fetchAll();

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
    <!-- 側邊欄 -->
    <?php include __DIR__ . '/../partials/sidebar.php'; ?>

    <!-- 主內容 -->
    <main class="flex-1 p-6">
      <!-- 搜尋列 -->
      <?php include __DIR__ . '/../partials/header.php'; ?>

      <!-- Tabs -->
      <nav id="tabs" class="max-w-4xl mx-auto flex border-b bg-white text-xs">
        <button data-tab="home" class="tab-btn px-6 py-3 border-b-2 border-blue-600 text-blue-600">首頁</button>
        <button data-tab="filter" class="tab-btn px-6 py-3 hover:text-blue-600">分類篩選</button>
        <button data-tab="recent" class="tab-btn px-6 py-3 hover:text-blue-600">最近查看</button>
        <button data-tab="latest" class="tab-btn px-6 py-3 hover:text-blue-600">最新作品</button>
        <button data-tab="random" class="tab-btn px-6 py-3 hover:text-blue-600">作品隨心看</button>
      </nav>

      <div class="max-w-4xl mx-auto">
        <!-- 首頁 -->
        <section id="home" class="tab-content mt-8">
          <!-- 作品輪播 -->
<section aria-label="作品輪播"
         class="max-w-4xl mx-auto mt-8 flex items-center">
  <!-- 左鍵 -->
  <button id="prevBtn"
          aria-label="上一頁"
          class="bg-blue-600 text-white rounded-full w-8 h-16 flex items-center justify-center mr-2">
    &lt;
  </button>

  <!-- 滑動容器 (tabindex 接收鍵盤事件) -->
  <div id="carousel"
       tabindex="0"
       class="flex overflow-x-auto scrollbar-hide space-x-4"
       style="scroll-snap-type: x mandatory; outline: none;">
    <?php foreach($carouselItems as $w): ?>
      <article class="flex-shrink-0 w-56 h-32 bg-gray-200 rounded-lg p-3 scroll-snap-align-start">
        <img src="<?= htmlspecialchars($w['thumb']) ?>"
             class="w-full h-full object-cover rounded"
             alt="">
        <h3 class="mt-2 text-sm"><?= htmlspecialchars($w['title']) ?></h3>
      </article>
    <?php endforeach; ?>
  </div>

  <!-- 右鍵 -->
  <button id="nextBtn"
          aria-label="下一頁"
          class="bg-blue-600 text-white rounded-full w-8 h-16 flex items-center justify-center ml-2">
    &gt;
  </button>
</section>

<script>
  (function(){
    const carousel     = document.getElementById('carousel');
    const prevBtn      = document.getElementById('prevBtn');
    const nextBtn      = document.getElementById('nextBtn');
    const scrollAmount = 300; // 每次滑動的像素，可依 card 寬度調整

    // 按鈕事件
    prevBtn.addEventListener('click', ()=> {
      carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      carousel.focus();
    });
    nextBtn.addEventListener('click', ()=> {
      carousel.scrollBy({ left:  scrollAmount, behavior: 'smooth' });
      carousel.focus();
    });

    // 鍵盤事件：左右鍵
    carousel.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    });
  })();
</script>

         
          <!-- 公告 -->
  <section class="bg-indigo-50 rounded-xl p-6 mb-10 relative">
  <h3 class="text-xl font-semibold mb-4">公告</h3>
  <ul class="space-y-2">
    <?php
    // 調色盤（可共用職缺用的）
    $palette = [
      ['bg'=>'bg-red-100',    'text'=>'text-red-600'],
      ['bg'=>'bg-orange-100', 'text'=>'text-orange-600'],
      ['bg'=>'bg-amber-100',  'text'=>'text-amber-600'],
      ['bg'=>'bg-yellow-100', 'text'=>'text-yellow-600'],
      ['bg'=>'bg-lime-100',   'text'=>'text-lime-600'],
      ['bg'=>'bg-green-100',  'text'=>'text-green-600'],
      ['bg'=>'bg-emerald-100','text'=>'text-emerald-600'],
      ['bg'=>'bg-teal-100',   'text'=>'text-teal-600'],
      ['bg'=>'bg-cyan-100',   'text'=>'text-cyan-600'],
      ['bg'=>'bg-blue-100',   'text'=>'text-blue-600'],
      ['bg'=>'bg-indigo-100', 'text'=>'text-indigo-600'],
      ['bg'=>'bg-purple-100', 'text'=>'text-purple-600'],
    ];
    foreach ($announcements as $ann):
      // 取標題第一字母
      $first  = mb_substr($ann['title'], 0, 1, 'UTF-8');
      $letter = strtoupper($first);
      $idx    = ord($letter) % count($palette);
      $c      = $palette[$idx];
    ?>
    <li class="bg-white rounded-md p-3 shadow flex items-start space-x-3">
      <div class="w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg <?= $c['bg'].' '.$c['text'] ?>">
        <?= htmlspecialchars($letter) ?>
      </div>
      <div class="text-gray-800">
        <div class="font-semibold text-sm"><?= htmlspecialchars($ann['title']) ?></div>
        <p class="text-xs text-gray-500"><?= htmlspecialchars($ann['content']) ?></p>
      </div>
    </li>
    <?php endforeach; ?>
  </ul>

  <!-- 分頁導航 -->
  <div class="mt-4 flex justify-center text-sm text-gray-500 space-x-2">
    <?php if($annPage > 1): ?>
      <a href="?ann_page=<?= $annPage-1 ?>" class="hover:underline">← 上一頁</a>
    <?php endif; ?>

    <?php for($i=1; $i<=$annTotalPages; $i++): ?>
      <?php if($i === $annPage): ?>
        <span class="font-bold text-indigo-600"><?= $i ?></span>
      <?php else: ?>
        <a href="?ann_page=<?= $i ?>" class="hover:underline"><?= $i ?></a>
      <?php endif; ?>
    <?php endfor; ?>

    <?php if($annPage < $annTotalPages): ?>
      <a href="?ann_page=<?= $annPage+1 ?>" class="hover:underline">下一頁 →</a>
    <?php endif; ?>
  </div>

  <!-- 查看全部按鈕（選用） -->
  <button id="loadAllAnnsBtn" class="absolute bottom-2 left-2 text-blue-900 hover:underline">
    查看全部 &gt;&gt;
  </button>
</section>
  <!-- 分頁導航 -->
  <div class="mt-4 flex justify-center text-sm text-gray-500 space-x-2">
    <?php if($annPage>1): ?>
      <a href="?ann_page=<?= $annPage-1 ?>" class="hover:underline">← 上一頁</a>
    <?php endif; ?>
    <?php for($i=1;$i<=$annTotalPages;$i++): ?>
      <?php if($i===$annPage): ?>
        <span class="font-bold text-indigo-600"><?= $i ?></span>
      <?php else: ?>
        <a href="?ann_page=<?= $i ?>" class="hover:underline"><?= $i ?></a>
      <?php endif; ?>
    <?php endfor; ?>
    <?php if($annPage<$annTotalPages): ?>
      <a href="?ann_page=<?= $annPage+1 ?>" class="hover:underline">下一頁 →</a>
    <?php endif; ?>
  </div>

  <button id="loadAllAnnsBtn" class="absolute bottom-2 left-2 text-blue-900 hover:underline">
    查看全部 &gt;&gt;
  </button>
</section>


        <!-- 分類篩選 -->
        <section id="filter" class="tab-content hidden mt-8">
          <form id="filterForm" class="flex space-x-4 mb-6" method="get">
            <select name="cat[]" multiple class="border p-2 rounded flex-1">
              <?php foreach($categoryList as $c): ?>
                <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['name']) ?></option>
              <?php endforeach; ?>
            </select>
            <select name="loc[]" multiple class="border p-2 rounded flex-1">
              <?php foreach($locationList as $l): ?>
                <option value="<?= $l['id'] ?>"><?= htmlspecialchars($l['name']) ?></option>
              <?php endforeach; ?>
            </select>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">篩選</button>
          </form>
          <div class="grid grid-cols-2 gap-4">
            <?php
              // 示範：若有帶篩選條件就用它，否則預設最新10筆
              if(!empty($_GET['cat'])||!empty($_GET['loc'])) {
                $inCats = implode(',', array_map('intval', $_GET['cat'] ?? []));
                $inLocs = implode(',', array_map('intval', $_GET['loc'] ?? []));
                $sql = "SELECT * FROM works WHERE 1"
                     . ($inCats?" AND category_id IN($inCats)":"")
                     . ($inLocs?" AND location_id IN($inLocs)":"")
                     ." LIMIT 20";
                $works = $pdo->query($sql)->fetchAll();
              } else {
                $works = $pdo->query("SELECT * FROM works ORDER BY created_at DESC LIMIT 10")->fetchAll();
              }
              foreach($works as $w):
            ?>
              <div class="bg-white p-4 rounded shadow">
                <h3 class="font-medium"><?= htmlspecialchars($w['title']) ?></h3>
                <p class="text-xs text-gray-500"><?= htmlspecialchars($w['category_name']) ?> / <?= htmlspecialchars($w['location_name']) ?></p>
              </div>
            <?php endforeach; ?>
          </div>
        </section>

        <!-- 最近查看 -->
        <section id="recent" class="tab-content hidden mt-8">
          <?php if($recentWorks): ?>
            <?php foreach($recentWorks as $w): ?>
              <div class="bg-white p-4 mb-3 rounded shadow">
                <?= htmlspecialchars($w['title']) ?>
              </div>
            <?php endforeach; ?>
          <?php else: ?>
            <p class="text-gray-500">尚無最近查看記錄。</p>
          <?php endif; ?>
        </section>

        <!-- 最新作品 -->
        <section id="latest" class="tab-content hidden mt-8">
          <?php foreach($latestWorks as $w): ?>
            <div class="bg-white p-4 mb-3 rounded shadow">
              <?= htmlspecialchars($w['title']) ?>
            </div>
          <?php endforeach; ?>
        </section>

        <!-- 作品隨心看 -->
        <section id="random" class="tab-content hidden mt-8">
          <?php if($randomWork): ?>
            <h3 class="text-xl font-semibold"><?= htmlspecialchars($randomWork['title']) ?></h3>
            <p class="mt-2 text-sm"><?= nl2br(htmlspecialchars($randomWork['description'])) ?></p>
          <?php endif; ?>
        </section>
      </div>
    </main>
  </div>

  <!-- Tab 切換邏輯 -->
  <script>
    const tabs     = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(btn => {
      btn.addEventListener('click', ()=>{
        tabs.forEach(b=>{
          b.classList.remove('border-blue-600','text-blue-600');
          b.classList.add('hover:text-blue-600');
        });
        btn.classList.add('border-blue-600','text-blue-600');
        btn.classList.remove('hover:text-blue-600');
        const tgt = btn.dataset.tab;
        contents.forEach(sec=>{
          sec.id===tgt ? sec.classList.remove('hidden') : sec.classList.add('hidden');
        });
      });
    });
  </script>
</body>
</html>