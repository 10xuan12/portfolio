<?php
// loginout.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();

require_once $_SERVER['DOCUMENT_ROOT'] . '/portfolio/enterprise/config/enterprise.php';
$db  = new \Config\EnterpriseDB();
$pdo = $db->getConnection();

// 處理真正登出
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    session_destroy();
    header('Location: loginout.php'); // ← 登出後跳轉的頁面
    exit;
}

$current = basename($_SERVER['PHP_SELF']);
?>
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>登出</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
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
         <?= $current === 'enterprise_portfolio.php' ? 'text-white bg-blue-700' : 'text-black hover:bg-gray-400' ?>">
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
    <a href="/portfolio/enterprise/loginout.php"
       class="flex flex-col items-center w-14 h-14 justify-center
         <?= $current === 'loginout.php' ? 'text-white bg-blue-700' : 'text-black hover:bg-gray-400' ?>">
      <i class="fas fa-sign-out-alt text-xl"></i>
      <span class="text-xs mt-1">登出</span>
    </a>
  </nav>

  <!-- 主內容區（置中） -->
  <main class="flex-1 flex items-center justify-center bg-gray-50 p-6 pl-14" style="min-height: 100vh;">
    <div class="max-w-md w-full bg-white p-10 rounded-xl shadow-lg">
      <h1 class="text-3xl font-bold text-center mb-4">登出</h1>
      <p class="text-center text-gray-600 mb-8">你確定要登出嗎？</p>
      <div class="flex justify-center space-x-4">
        <a href="javascript:history.back()" class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-200 transition">返回</a>
        <form method="post">
          <button type="submit" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">確認登出</button>
        </form>
      </div>
    </div>
  </main>
</div>
</body>
</html>
