<?php
// index.php
$page = $_GET['page'] ?? 'dashboard';
?>
<?php include('includes/header.php'); ?>
<div class="flex min-h-screen">
  <?php include('includes/sidebar.php'); ?>

  <!-- 主內容區塊 -->
  <div class="flex-1 bg-gray-50 p-6 ml-16 sm:ml-20 overflow-y-auto">
    <?php
      $pagePath = "pages/{$page}.php";
      if (file_exists($pagePath)) {
        include($pagePath);
      } else {
        echo '<p class="text-red-500">找不到此頁面。</p>';
      }
    ?>
  </div>
</div>
<?php include('includes/footer.php'); ?>

<?php
// ... session, db, 撈 $tab 變數 ...
include __DIR__ . '/../partials/sidebar.php';
include __DIR__ . '/../partials/header.php';
include __DIR__ . '/../partials/tabs.php';

switch($tab) {
  case 'category':
    include __DIR__ . '/../partials/category_filter.php';
    break;
  case 'recent':
    include __DIR__ . '/../partials/recent_views.php';
    break;
  case 'latest':
    include __DIR__ . '/../partials/latest_works.php';
    break;
  case 'random':
    include __DIR__ . '/../partials/work_detail.php';
    break;
  default:
    include __DIR__ . '/../partials/home.php';
}

