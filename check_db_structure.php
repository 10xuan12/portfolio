<?php
// 檢查資料庫結構的腳本
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "檢查資料庫結構...\n";

// 連線到資料庫
$conn = mysqli_init();
mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 5);

if (mysqli_real_connect($conn, 'localhost:3307', 'root', '', 'eportfolio1')) {
    $conn->set_charset("utf8mb4");
    echo "成功連線到資料庫\n";
    
    // 檢查現有表格
    echo "\n現有表格：\n";
    $result = $conn->query("SHOW TABLES");
    if ($result) {
        while ($row = $result->fetch_array()) {
            echo "- " . $row[0] . "\n";
        }
    }
    
    // 檢查 users 表格結構
    echo "\nusers 表格結構：\n";
    $result = $conn->query("DESCRIBE users");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            echo "- {$row['Field']}: {$row['Type']} {$row['Null']} {$row['Key']} {$row['Default']}\n";
        }
    }
    
    // 檢查 portfolios 表格結構
    echo "\nportfolios 表格結構：\n";
    $result = $conn->query("DESCRIBE portfolios");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            echo "- {$row['Field']}: {$row['Type']} {$row['Null']} {$row['Key']} {$row['Default']}\n";
        }
    }
    
    // 檢查企業用戶
    echo "\n企業用戶：\n";
    $result = $conn->query("SELECT id, username, email, role FROM users WHERE role = 'enterprise'");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            echo "- ID: {$row['id']}, 用戶名: {$row['username']}, 郵箱: {$row['email']}, 角色: {$row['role']}\n";
        }
    }
    
} else {
    echo "資料庫連線失敗: " . mysqli_connect_error() . "\n";
}

$conn->close();
?>
