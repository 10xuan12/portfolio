<?php
session_start();

// 載入 EnterpriseDB 類別
require $_SERVER['DOCUMENT_ROOT']
    . '/portfolio/enterprise/config/enterprise.php';

$db  = new \Config\EnterpriseDB();
$pdo = $db->getConnection();

// 1. 讀取篩選參數 & 分頁設定
$cats    = $_GET['cat']  ?? [];
$locs    = $_GET['loc']  ?? [];
$page    = max(1, (int)($_GET['page'] ?? 1));
$perPage = 5;
$offset  = ($page - 1) * $perPage;

// 2. 撈分類與地區清單
$categoryList = $pdo->query("SELECT id, name FROM categories")->fetchAll();
$locationList = $pdo->query("SELECT id, name FROM locations")->fetchAll();

// 3. 準備動態 WHERE
$where = [];
if (!empty($cats)) {
  $in = implode(',', array_map('intval', $cats));
  $where[] = "w.category_id IN($in)";
}
if (!empty($locs)) {
  $in = implode(',', array_map('intval', $locs));
  $where[] = "w.location_id IN($in)";
}
$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// 4. 取得總筆數 & 計算總頁數
$total      = (int) $pdo->query("SELECT COUNT(*) FROM works w $whereSql")->fetchColumn();
$totalPages = (int) ceil($total / $perPage);

// 5. 撈當前頁的作品 (包含內容)
$sql = <<<SQL
SELECT w.id, w.title, w.thumb, w.content,
       c.name AS category_name,
       l.name AS location_name
  FROM works w
  JOIN categories c ON w.category_id = c.id
  JOIN locations  l ON w.location_id  = l.id
$whereSql
ORDER BY w.created_at DESC
LIMIT :lim OFFSET :off
SQL;
$stmt = $pdo->prepare($sql);
$stmt->bindValue(':lim', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':off', $offset, PDO::PARAM_INT);
$stmt->execute();
$works = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>分類篩選｜瀏覽作品</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet"/>
  <style>
    /* 自訂 scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 3px; }
  </style>
</head>
<body class="bg-white font-sans text-gray-800">
  <div class="flex min-h-screen">
    <!-- 側邊欄 -->
    <aside class="flex flex-col items-center bg-gray-100 w-16 py-4 space-y-6 select-none">
      <!-- 側邊欄按鈕略 -->
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col">
      <!-- 搜尋與篩選按鈕略 -->

      <!-- Tabs -->
      <div class="border border-gray-300 rounded-t-md w-full max-w-4xl mx-auto">
        <!-- 分頁按鈕略 -->
        <div class="mt-4"></div>
      </div>

      <main class="p-6 flex-1 overflow-y-auto">
        <!-- 篩選標籤區塊略 -->

        <!-- 作品卡片列表 -->
        <section class="max-w-4xl mx-auto space-y-4">
          <?php if (empty($works)): ?>
            <p class="text-center text-gray-500">找不到符合條件的作品。</p>
          <?php else: ?>
            <?php foreach ($works as $w): ?>
              <article class="border border-gray-300 rounded-md p-4 flex space-x-4">
                <img src="<?= htmlspecialchars($w['thumb'] ?: '/images/placeholder.png') ?>" alt="<?= htmlspecialchars($w['title']) ?>" class="w-20 h-20 bg-gray-200 flex-shrink-0 rounded"/>
                <div class="flex-1 text-xs text-gray-700">
                  <h4 class="font-semibold mb-1"><?= htmlspecialchars($w['title']) ?></h4>
                  <?php $firstPara = explode("\n", trim($w['content']))[0]; ?>
                  <p class="mb-2"><?= htmlspecialchars(mb_substr($firstPara, 0, 20)) ?>...</p>
                  <a href="edit_work.php?id=<?= $w['id'] ?>" class="inline-block bg-blue-600 text-white rounded px-2 py-1 text-xs">編輯</a>
                </div>
              </article>
            <?php endforeach; ?>
          <?php endif; ?>
        </section>

        <!-- 分頁導航 -->
        <nav class="max-w-4xl mx-auto mt-6">
          <ul class="inline-flex items-center space-x-2 text-sm">
            <?php if ($page > 1): ?>
              <li><a href="?<?= http_build_query(array_merge($_GET, ['page' => $page - 1])) ?>" class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100">← 上一頁</a></li>
            <?php endif; ?>

            <?php for ($i = 1; $i <= $totalPages; $i++): ?>
              <?php if ($i === $page): ?>
                <li><span class="px-3 py-1 bg-blue-600 text-white rounded"><?= $i ?></span></li>
              <?php else: ?>
                <li><a href="?<?= http_build_query(array_merge($_GET, ['page' => $i])) ?>" class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"><?= $i ?></a></li>
              <?php endif; ?>
            <?php endfor; ?>

            <?php if ($page < $totalPages): ?>
              <li><a href="?<?= http_build_query(array_merge($_GET, ['page' => $page + 1])) ?>" class="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100">下一頁 →</a></li>
            <?php endif; ?>
          </ul>
        </nav>

      </main>
    </div>
  </div>
</body>
</html>
