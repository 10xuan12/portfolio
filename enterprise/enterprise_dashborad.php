<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

// 假設從資料庫撈資料
$user = [
    "name" => "企業名 NAME",
    "address" => "地址1234564",
    "email" => "mail@mail.mail",
    "phone" => "0987-654-321",
    "github" => "carsy99",
    "facebook" => "臉書 Facebook",
    "view_count" => 20
];
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <title>企業主頁</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="sidebar">
        <a href="dashboard.php">主頁</a>
        <a href="works.php">瀏覽作品</a>
        <a href="notifications.php">通知</a>
        <a href="settings.php">設定</a>
        <a href="logout.php">登出</a>
    </div>

    <div class="content">
        <img src="img/avatar.png" alt="大頭貼" class="avatar">
        <h1><?php echo $user['name']; ?></h1>
        <p><?php echo $user['address']; ?></p>
        
        <button onclick="editProfile()">編輯</button>

        <p>簡介 Lorem ipsum dolor sit amet consectetur...</p>

        <div class="contact">
            <p>GitHub: <?php echo $user['github']; ?></p>
            <p>Facebook: <?php echo $user['facebook']; ?></p>
            <p>Email: <?php echo $user['email']; ?></p>
            <p>Phone: <?php echo $user['phone']; ?></p>
        </div>

        <p>檔案瀏覽次數: <?php echo $user['view_count']; ?></p>
    </div>

    <script src="js/script.js"></script>
</body>
</html>
