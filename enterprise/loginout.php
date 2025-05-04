<?php
// logout.php
session_start();

// 按下「登出」按鈕後真正銷毀 session 並導回登入頁
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    session_destroy();
    header('Location: login.php');
    exit;
}

// 給 sidebar 決定哪個選單是 active
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>登出</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Font Awesome（sidebar 已經用到） -->
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
  />
</head>
<body class="flex min-h-screen bg-gray-50 text-gray-800">
  <!-- 側邊欄 -->
  <?php include __DIR__ . '/templates/sidebar.php'; ?>

  <!-- 右側主內容 -->
  <main class="flex-1 p-6">
    <div class="max-w-2xl mx-auto bg-gray-100 p-12 rounded-lg">
      <h1 class="text-3xl font-bold text-center mb-4">登出</h1>
      <p class="text-center text-gray-600 mb-8">確定要登出嗎？</p>
      <div class="flex justify-center space-x-4">
        <!-- 返回按鈕 -->
        <a
          href="javascript:history.back()"
          class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-200 transition"
        >
          返回
        </a>
        <!-- 真正登出按鈕 -->
        <form method="post">
          <button
            type="submit"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            登出
          </button>
        </form>
      </div>
    </div>
  </main>
</body>
</html>
