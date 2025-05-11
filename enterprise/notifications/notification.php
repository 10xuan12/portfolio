<?php
session_start();
require $_SERVER['DOCUMENT_ROOT'] . '/portfolio/enterprise/config/enterprise.php';
$db    = new \Config\EnterpriseDB();
$pdo   = $db->getConnection();

// 1. 讀 filter 參數
$valid      = ['focus','social','promo','other'];
$filter     = $_GET['filter'] ?? 'focus';
if (! in_array($filter, $valid, true)) {
    $filter = 'focus';
}

// 2. 取得社群 badge 數
$socialCount = (int)$pdo
    ->query("SELECT COUNT(*) FROM notifications WHERE category='social'")
    ->fetchColumn();

// 3. 分頁設定
$perPage     = 10;
$page        = max(1, intval($_GET['page'] ?? 1));
$offset      = ($page - 1) * $perPage;

// 4. 計算總筆數 & 總頁數
$stmtCnt     = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE category = :cat");
$stmtCnt->execute([':cat' => $filter]);
$totalCount  = (int)$stmtCnt->fetchColumn();
$totalPages  = max(1, (int)ceil($totalCount / $perPage));

// 5. 拉出當前頁的通知
$stmt = $pdo->prepare("
  SELECT id, title, message, created_at
    FROM notifications
   WHERE category = :cat
ORDER BY id DESC
   LIMIT :lim OFFSET :off
");
$stmt->bindValue(':cat', $filter, PDO::PARAM_STR);
$stmt->bindValue(':lim', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':off', $offset, PDO::PARAM_INT);
$stmt->execute();
$notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 6. 顏色與分頁函式
$palette = [
  ['bg'=>'bg-purple-100','text'=>'text-purple-600'],
  ['bg'=>'bg-pink-100','text'=>'text-pink-600'],
  ['bg'=>'bg-indigo-100','text'=>'text-indigo-600'],
  ['bg'=>'bg-green-100','text'=>'text-green-600'],
  ['bg'=>'bg-yellow-100','text'=>'text-yellow-600'],
  ['bg'=>'bg-blue-100','text'=>'text-blue-600'],
];
function uniord(string $ch): int {
    $h = ord($ch[0]);
    if ($h <= 0x7F) return $h;
    if ($h < 0xC2) return 0;
    if ($h <= 0xDF) {
        return ($h & 0x1F) << 6
             | (ord($ch[1]) & 0x3F);
    }
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
function renderPagination($page, $totalPages, $filter) {
    echo '<div class="mt-4 text-center">';
    if ($page > 1) {
        echo '<a href="?filter='.$filter.'&page='.($page-1).'" class="mx-1">&laquo; 上一頁</a>';
    }
    for ($i = 1; $i <= $totalPages; $i++) {
        $cls = $i === $page ? 'font-bold underline' : '';
        echo '<a href="?filter='.$filter.'&page='.$i.'" class="mx-1 '.$cls.'">'.$i.'</a>';
    }
    if ($page < $totalPages) {
        echo '<a href="?filter='.$filter.'&page='.($page+1).'" class="mx-1">下一頁 &raquo;</a>';
    }
    echo '</div>';
}

$labels = ['focus'=>'焦點','social'=>'社群','promo'=>'促銷','other'=>'其他'];
$current = basename($_SERVER['PHP_SELF']);
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
<body class="bg-white font-sans text-gray-800">
  <div class="flex min-h-screen">
    <!-- 側邊欄 -->
    <nav class="flex flex-col items-center bg-gray-300 w-14 py-6 space-y-6 shadow-md border-r">
      <!-- 主頁 -->
      <a href="/portfolio/enterprise/homepage/enterprise_dashboard.php"
         class="flex flex-col items-center w-14 h-14 justify-center
           <?= $current === 'enterprise_dashboard.php' ? 'text-white bg-blue-700' : 'text-black hover:bg-gray-400' ?>">
        <i class="fas fa-user-circle text-xl"></i>
        <span class="text-xs mt-1">主頁</span>
      </a>
      <!-- 瀏覽 -->
      <a href="/portfolio/enterprise/browseportfolio/enterprise_portfolio.php"
         class="flex flex-col items-center w-14 h-14 justify-center
           <?= in_array($current, ['enterprise_portfolio.php','category_filter.php','latest_works.php','recent_views.php','work_detail.php'])
               ? 'text-white bg-blue-700'
               : 'text-black hover:bg-gray-400' ?>">
        <i class="fas fa-folder text-xl"></i>
        <span class="text-xs mt-1">瀏覽</span>
      </a>
      <!-- 通知 -->
      <a href="/portfolio/enterprise/notifications/notification.php"
         class="flex flex-col items-center w-14 h-14 justify-center
           <?= $current === 'notification.php' ? 'text-white bg-blue-700' : 'text-black hover:bg-gray-400' ?>">
        <i class="fas fa-bell text-xl"></i>
        <span class="text-xs mt-1">通知</span>
      </a>
      <!-- 設定 -->
      <a href="/portfolio/enterprise/setting.php"
         class="flex flex-col items-center w-14 h-14 justify-center
           <?= $current === 'setting.php' ? 'text-white bg-blue-700' : 'text-black hover:bg-gray-400' ?>">
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

    <!-- Main content -->
    <main class="flex-1 p-6 overflow-y-auto">
      <!-- Filter + Search -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 space-x-1">
            <?php foreach ($labels as $key => $label): 
              $active = ($filter === $key);
              $baseCls = 'flex items-center px-4 py-2 rounded-full ';
              $cls = $active
                ? $baseCls . 'bg-purple-50 text-purple-700 font-medium'
                : $baseCls . 'text-gray-600 hover:bg-gray-100';
              if ($key === 'social') {
                  $cls = 'relative ' . $cls;
              }
            ?>
              <a href="?filter=<?= $key ?>" class="<?= $cls ?>">
                <?php if ($active): ?><i class="fas fa-check mr-1 text-sm"></i><?php endif; ?>
                <?= $label ?>
                <?php if ($key === 'social'): ?>
                  <span class="absolute -top-1 -right-1 inline-block bg-red-500 text-white text-xs rounded-full px-1.5">
                    <?= $socialCount ?>
                  </span>
                <?php endif; ?>
              </a>
            <?php endforeach; ?>
          </div>
        </div>

        <div class="relative">
          <input
            type="text"
            placeholder="Hinted search text"
            class="pl-10 pr-4 py-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
        </div>
      </div>

      <!-- Notification 卡片 -->
      <section class="bg-purple-50 rounded-xl p-6 mb-10 mt-8">
        <h3 class="text-xl font-semibold mb-4 bg-purple-200 px-4 py-2 rounded-t-lg text-purple-800">
          通知
        </h3>

        <ul id="notification-list" class="divide-y divide-dotted divide-purple-300">
          <?php if (empty($notifications)): ?>
            <li class="py-3 text-center text-gray-700">目前沒有任何通知。</li>
          <?php else: foreach ($notifications as $n):
            $first  = mb_substr($n['title'], 0, 1, 'UTF-8');
            $ch     = mb_strtoupper($first, 'UTF-8');
            $idx    = uniord($ch) % count($palette);
            $colors = $palette[$idx];
          ?>
            <li class="py-3">
              <div class="flex items-start space-x-3">
                <div class="w-10 h-10 <?= $colors['bg'] ?> <?= $colors['text'] ?>
                            rounded-full flex items-center justify-center font-bold text-lg">
                  <?= htmlspecialchars($ch, ENT_QUOTES) ?>
                </div>
                <div class="flex-1 text-gray-800">
                  <div class="font-semibold text-sm text-gray-700">
                    <?= htmlspecialchars($n['title'], ENT_QUOTES) ?>
                  </div>
                  <div class="text-sm text-gray-700 mt-1">
                    <?= nl2br(htmlspecialchars($n['message'], ENT_QUOTES)) ?>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    <?= htmlspecialchars($n['created_at'], ENT_QUOTES) ?>
                  </div>
                </div>
              </div>
            </li>
          <?php endforeach; endif; ?>
        </ul>

        <?php renderPagination($page, $totalPages, $filter); ?>
      </section>
    </main>
  </div>
</body>
</html>