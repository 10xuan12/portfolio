<?php
$servername = "localhost";
$username = "root";  // 請確認你的 MySQL 帳號
$password = "";       // 請確認你的 MySQL 密碼
$dbname = "eportfolio";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "資料庫連線失敗: " . $conn->connect_error]));
}
?>

