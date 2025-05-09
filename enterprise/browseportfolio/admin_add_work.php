<?php
session_start();
ini_set('display_errors',1);
error_reporting(E_ALL);

// 載入 DB 類別
require __DIR__ . '/../config/enterprise.php';
$pdo = (new \Config\EnterpriseDB())->getConnection();

// 取得要編輯的作品 ID
$workId = (int)($_GET['work_id'] ?? 0);
if (!$workId) {
    exit('<p>缺少 work_id。請從作品列表連過來。<a href="enterprise_portfolio.php">返回列表</a></p>');
}

// 讀現有資料
$stmt = $pdo->prepare("SELECT title, thumb FROM works WHERE id = :id");
$stmt->execute([':id' => $workId]);
$work = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$work) {
    exit('<p>找不到這筆作品資料。<a href="enterprise_portfolio.php">返回列表</a></p>');
}

$error = '';
$success = '';

// 處理上傳
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($_FILES['thumb']['name'])) {
        $error = '請先選擇一張圖片。';
    } else {
        $allowExt = ['jpg','jpeg','png','gif','webp'];
        $ext      = strtolower(pathinfo($_FILES['thumb']['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowExt)) {
            $error = '只接受圖片檔 (jpg/png/gif/webp)。';
        } else {
            // 上傳目錄
            $uploadDir = __DIR__ . '/uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

            $filename = uniqid('w_') . '.' . $ext;
            $target   = $uploadDir . $filename;

            if (!move_uploaded_file($_FILES['thumb']['tmp_name'], $target)) {
                $error = '檔案移動失敗，請檢查資料夾權限。';
            } else {
                // 更新資料庫
                $thumbPath = '/portfolio/enterprise/browseportfolio/uploads/' . $filename;
                $uStmt = $pdo->prepare("UPDATE works SET thumb = :thumb WHERE id = :id");
                $uStmt->execute([':thumb'=>$thumbPath, ':id'=>$workId]);
                $success = '封面已更新！';
                // 重新讀取最新的 thumb
                $work['thumb'] = $thumbPath;
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <title>編輯作品封面</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 p-6 font-sans">
  <div class="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
    <h1 class="text-2xl font-semibold mb-4">編輯作品：<?= htmlspecialchars($work['title']) ?></h1>

    <?php if($error): ?>
      <div class="mb-4 p-3 bg-red-100 text-red-700 rounded"><?= htmlspecialchars($error) ?></div>
    <?php elseif($success): ?>
      <div class="mb-4 p-3 bg-green-100 text-green-700 rounded"><?= htmlspecialchars($success) ?></div>
    <?php endif; ?>

    <div class="mb-4">
      <p class="text-sm text-gray-600 mb-2">目前封面預覽：</p>
      <img src="<?= htmlspecialchars($work['thumb']) ?>"
           alt="當前封面"
           class="w-full h-40 object-cover rounded border" />
    </div>

    <form method="post" enctype="multipart/form-data">
      <label class="block mb-3">
        <span class="block text-sm font-medium text-gray-700">選擇新封面圖片：</span>
        <input type="file"
               name="thumb"
               accept="image/*"
               class="mt-1 block w-full text-sm text-gray-600" />
      </label>

      <div class="flex space-x-4">
        <button type="submit"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          上傳並更新
        </button>
        <a href="enterprise_portfolio.php"
           class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
          回作品列表
        </a>
      </div>
    </form>
  </div>
</body>
</html>
