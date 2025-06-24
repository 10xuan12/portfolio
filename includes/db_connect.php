<?php
// 資料庫連線設定
$servername = "172.20.10.2";  // 遠端資料庫伺服器 IP
$username = "teammate1";      // 資料庫使用者名稱
$password = "securepass123";              // 無密碼
$dbname = "ephortfolio"; // 資料庫名稱
$charset = "utf8mb4";        // 字符集

// 建立資料庫連線
try {
    // 使用 mysqli_connect 替代 new mysqli，並加入更多連線選項
    $conn = mysqli_init();
    mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 5);
    mysqli_real_connect($conn, $servername, $username, $password, $dbname);
    
    // 設定字符集
    $conn->set_charset($charset);
    
    // 檢查連線
    if ($conn->connect_error) {
        throw new Exception("連線失敗: " . $conn->connect_error);
    }
} catch (Exception $e) {
    die("資料庫連線錯誤: " . $e->getMessage() . "<br>請確認：<br>1. 遠端伺服器允許 teammate1 無密碼連線<br>2. teammate1 使用者有從您的 IP (172.20.10.3) 連線的權限");
}
?>