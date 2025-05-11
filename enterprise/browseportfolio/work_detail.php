<?php
session_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 1. 載入資料庫連線設定
require __DIR__ . '/../config/enterprise.php';
$db  = new \Config\EnterpriseDB();
$pdo = $db->getConnection();

// 2. 取得並驗證 id —— 一定要在任何使用 $id 之前
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if ($id === null || $id === false) {
    exit('<p class="text-red-600">缺少或錯誤的 id 參數。</p>');
}

// 3. 決定當前活躍的 tab
$activeTab = $_GET['tab'] ?? 'random';

// 4. 查作品
$stmt = $pdo->prepare("SELECT * FROM works WHERE id = :id");
$stmt->execute([':id' => $id]);
$w = $stmt->fetch();
if (!$w) {
    exit('<p class="text-red-600">找不到這件作品。</p>');
}

// 2. 撈作品列表
$stmt  = $pdo->query("SELECT * FROM works ORDER BY created_at DESC");
$works = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 5. 抓檔案列表（可選）
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