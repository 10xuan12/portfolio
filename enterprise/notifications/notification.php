<?php
// notifications.php
require __DIR__ . '/config/db.php';
$pdo = (new \Config\DB())->getConnection();

// UTF-8 字元轉 code point
function uniord(string $ch): int {
    $h = ord($ch[0]);
    if ($h <= 0x7F) return $h;
    if ($h < 0xC2) return 0;
    if ($h <= 0xDF) return ($h & 0x1F) << 6 | (ord($ch[1]) & 0x3F);
    if ($h <= 0xEF) {
        return ($h & 0x0F) << 12
             | (ord($ch[1]) & 0x3F) << 6
             | (ord($ch[2]) & 0x3F);
    }
    return ($h & 0x07) << 18
         | (ord($ch[1]) & 0x3F) << 12
         | (ord($ch[2]) & 0x3F) << 6
         | (ord($ch[3]) & 0x3F);
}

// 配色調色盤
$palette = [
  ['bg'=>'bg-red-100',    'text'=>'text-red-600'],
  ['bg'=>'bg-yellow-100', 'text'=>'text-yellow-600'],
  ['bg'=>'bg-green-100',  'text'=>'text-green-600'],
  ['bg'=>'bg-blue-100',   'text'=>'text-blue-600'],
  ['bg'=>'bg-indigo-100', 'text'=>'text-indigo-600'],
  ['bg'=>'bg-purple-100', 'text'=>'text-purple-600'],
];

// 讀 filter 參數
$validFilters = ['focus','social','promo','other'];
$filter = $_GET['filter'] ?? 'focus';
if (!in_array($filter, $validFilters, true)) {
    $filter = 'focus';
}

// 取得社群 badge 數
$socialCount = (int)$pdo
    ->query("SELECT COUNT(*) FROM notifications WHERE category = 'social'")
    ->fetchColumn();

// 分頁設定
$perPage = 10;
$page    = max(1, intval($_GET['page'] ?? 1));
$offset  = ($page - 1) * $perPage;

// 計算總筆數與總頁數
if ($filter === 'other') {
    $totalCount = (int)$pdo
        ->query("SELECT COUNT(*) FROM notifications WHERE category NOT IN ('focus','social','promo')")
        ->fetchColumn();
} else {
    $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE category = :cat");
    $stmtCount->execute([':cat' => $filter]);
    $totalCount = (int)$stmtCount->fetchColumn();
}
$totalPages = (int)ceil($totalCount / $perPage);

// 撈分頁後資料
if ($filter === 'other') {
    $sql = "SELECT id, title
              FROM notifications
             WHERE category NOT IN ('focus','social','promo')
             ORDER BY id DESC
             LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
} else {
    $sql = "SELECT id, title
              FROM notifications
             WHERE category = :cat
             ORDER BY id DESC
             LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':cat', $filter);
}
$stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
$stmt->execute();
$notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>通知頁面</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
    rel="stylesheet"
  />
</head>
<body class="flex h-screen bg-white font-sans text-gray-800">
  <!-- Sidebar -->
  <aside class="bg-gray-200 w-20 flex flex-col items-center py-4 space-y-4 text-gray-600">
    <a href="notifications.php?filter=focus" class="flex flex-col items-center text-sm hover:text-purple-600">
      <i class="fas fa-user-circle fa-lg"></i><span class="mt-1">主頁</span>
    </a>
    <a href="notifications.php?filter=promo" class="flex flex-col items-center text-sm hover:text-purple-600">
      <i class="fas fa-folder fa-lg"></i><span class="mt-1">瀏覽作品</span>
    </a>
    <a href="notifications.php?filter=social" class="flex flex-col items-center text-sm text-white bg-blue-600 rounded-md px-2 py-1">
      <i class="fas fa-bell fa-lg"></i><span class="mt-1">通知</span>
    </a>
    <a href="#" class="flex flex-col items-center text-sm hover:text-purple-600">
      <i class="fas fa-cog fa-lg"></i><span class="mt-1">設定</span>
    </a>
    <a href="#" class="flex flex-col items-center text-sm hover:text-purple-600 mt-auto">
      <i class="fas fa-sign-out-alt fa-lg"></i><span class="mt-1">登出</span>
    </a>
  </aside>

  <!-- Main content -->
  <main class="flex-1 p-8 overflow-y-auto">
    <!-- Filter + Search -->
    <div class="flex items-center justify-between mb-6">
      <!-- 四合一 Filter 圖片框 -->
      <div>
        <div class="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 space-x-1">
          <?php
          $labels = ['focus'=>'焦點','social'=>'社群','promo'=>'促銷','other'=>'其他'];
          foreach ($labels as $key => $label):
            $active = $filter === $key;
            $classes = $active
              ? 'flex items-center px-4 py-2 bg-purple-50 text-purple-700 rounded-full font-medium'
              : 'flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full';
            if ($key === 'social') {
              $classes = 'relative ' . $classes;
            }
          ?>
            <a href="?filter=<?= $key ?>" class="<?= $classes ?>">
              <?php if ($active): ?><i class="fas fa-check mr-1 text-sm"></i><?php endif; ?>
              <?= $label ?>
              <?php if ($key === 'social'): ?>
                <span class="absolute -top-1 -right-1 inline-block bg-red-500 text-white text-xs rounded-full px-1.5"><?= $socialCount ?></span>
              <?php endif; ?>
            </a>
          <?php endforeach; ?>
        </div>
      </div>

      <!-- Search -->
      <div class="relative">
        <input
          type="text"
          placeholder="Hinted search text"
          class="pl-10 pr-4 py-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
      </div>
    </div>

    <!-- Notification list -->
    <div class="border border-gray-200 rounded-lg bg-white">
      <ul>
        <?php if (empty($notifications)): ?>
          <li class="p-4 text-center text-gray-500">目前沒有任何通知</li>
        <?php else: ?>
          <?php foreach ($notifications as $n):
            $first = mb_substr($n['title'], 0, 1, 'UTF-8');
            $ch    = mb_strtoupper($first, 'UTF-8');
            $idx   = uniord($ch) % count($palette);
            $colors= $palette[$idx];
          ?>
            <li class="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
              <div class="flex items-center">
                <div class="w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg <?= $colors['bg'] . ' ' . $colors['text'] ?>">
                  <?= htmlspecialchars($ch, ENT_QUOTES) ?>
                </div>
                <span class="ml-4"><?= htmlspecialchars($n['title'], ENT_QUOTES) ?></span>
              </div>
              <input type="checkbox" checked class="form-checkbox h-5 w-5 text-purple-600" />
            </li>
          <?php endforeach; ?>
        <?php endif; ?>
      </ul>
    </div>

    <!-- Pagination -->
    <nav class="flex items-center justify-center space-x-2 mt-6 text-gray-600" aria-label="Pagination">
      <?php if ($page > 1): ?>
        <a href="?filter=<?= $filter ?>&page=<?= $page - 1 ?>" class="px-3 py-1 hover:underline">← Previous</a>
      <?php endif; ?>
      <?php for ($i = 1; $i <= $totalPages; $i++): ?>
        <?php if ($i === $page): ?>
          <span class="px-3 py-1 rounded-full bg-gray-800 text-white font-medium"><?= $i ?></span>
        <?php else: ?>
          <a href="?filter=<?= $filter ?>&page=<?= $i ?>" class="px-3 py-1 rounded-full hover:bg-gray-100"><?= $i ?></a>
        <?php endif; ?>
      <?php endfor; ?>
      <?php if ($page < $totalPages): ?>
        <a href="?filter=<?= $filter ?>&page=<?= $page + 1 ?>" class="px-3 py-1 hover:underline">Next →</a>
      <?php endif; ?>
    </nav>
  </main>
</body>
</html>
