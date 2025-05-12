<?php
// settings.php
session_start();
// 確保有登入（如果需要）
// if (!isset($_SESSION['user_id'])) { header('Location: login.php'); exit; }



$fullPath = $_SERVER['PHP_SELF'];
$current = basename($fullPath);
?>
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>設定</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Font Awesome -->
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
  />
</head>
<body class="flex min-h-screen bg-gray-50">
 
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




  <!-- 右側主區域：完全空白 -->
  <div class="flex-1 bg-white"></div>

  
</body>
</html>

