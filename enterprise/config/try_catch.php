<?php
// 確保這行在最上面
ini_set('display_startup_errors',1);
ini_set('display_errors',1);
error_reporting(E_ALL);

echo '— 開始測試 StudentDB 連線 —<br>';

// 因為 try_catch.php 已經在 enterprise/config，直接引同資料夾下的 student_portal.php
require __DIR__ . '/student_portal.php';
echo '✔ student_portal.php 已載入<br>';

try {
    // 建立連線
    $pdo = (new \Config\StudentDB())->getConnection();
    echo '✔ getConnection() 執行完畢<br>';
    
    // 執行極簡查詢確認
    $pdo->query('SELECT 1')->fetch();
    echo '✅ 資料庫連線成功！';
} catch (\PDOException $e) {
    echo '❌ 連線失敗：' . htmlspecialchars($e->getMessage());
}
