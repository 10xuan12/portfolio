<?php
$servername = "localhost";
$username = "root";
$password = ""; // 預設 XAMPP 是空密碼
$dbname = "ephortfolio";

// 建立連線
$conn = new mysqli($servername, $username, $password, $dbname);

// 檢查連線
if ($conn->connect_error) {
    die(json_encode([
        "status" => "error",
        "message" => "資料庫連線失敗: " . $conn->connect_error
    ]));
}
?>