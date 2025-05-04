<?php
// settings.php
session_start();
// 確保有登入（如果需要）
// if (!isset($_SESSION['user_id'])) { header('Location: login.php'); exit; }

// 取得當前頁面給 sidebar 用
$currentPage = basename($_SERVER['PHP_SELF']);
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
  <!-- 側邊欄 -->
  <?php include __DIR__ . '/templates/sidebar.php'; ?>

  <!-- 右側主區域：完全空白 -->
  <div class="flex-1 bg-white"></div>
</body>
</html>

