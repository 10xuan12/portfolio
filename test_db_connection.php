<?php
// 設定執行時間限制為 10 秒
set_time_limit(10);

// 開啟錯誤顯示
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 設定資料庫連線超時時間（秒）
$timeout = 5;

echo "開始測試資料庫連線...<br>";
flush();

try {
    // 引入資料庫連線設定
    echo "正在載入資料庫設定...<br>";
    flush();
    
    if (!file_exists('includes/db_connect.php')) {
        throw new Exception("找不到資料庫設定檔案 (includes/db_connect.php)");
    }
    
    require_once 'includes/db_connect.php';
    echo "資料庫設定載入完成<br>";
    flush();

    // 顯示連線資訊
    echo "連線資訊：<br>";
    echo "伺服器：" . $servername . "<br>";
    echo "資料庫：" . $dbname . "<br>";
    echo "使用者：" . $username . "<br>";
    flush();

    // 正確建立資料庫連線
    echo "正在建立資料庫連線...<br>";
    flush();
    
    $conn = @mysqli_connect($servername, $username, $password, $dbname);
    
    if (!$conn) {
        throw new Exception("連線失敗：" . mysqli_connect_error() . " (錯誤代碼：" . mysqli_connect_errno() . ")");
    }

    // 設定連線超時
    mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, $timeout);
    
    echo "資料庫連線建立成功<br>";
    flush();

    // 測試查詢
    echo "正在執行測試查詢...<br>";
    flush();
    
    $test_query = "SELECT 1";
    $result = mysqli_query($conn, $test_query);
    
    if (!$result) {
        throw new Exception("查詢測試失敗：" . mysqli_error($conn));
    }

    echo "基本查詢測試成功<br>";
    flush();

    // 測試資料表查詢
    echo "正在查詢資料表...<br>";
    flush();
    
    $test_query = "SHOW TABLES LIKE 'student_profiles'";
    $result = mysqli_query($conn, $test_query);
    
    if (!$result) {
        throw new Exception("資料表查詢失敗：" . mysqli_error($conn));
    }

    if (mysqli_num_rows($result) == 0) {
        echo "警告：找不到 student_profiles 資料表<br>";
    } else {
        echo "找到 student_profiles 資料表<br>";
    }
    flush();

    echo "<br>資料庫連線測試完成！<br>";
    echo "狀態：成功<br>";
    echo "伺服器版本：" . mysqli_get_server_info($conn) . "<br>";
    echo "連線狀態：" . mysqli_stat($conn) . "<br>";

} catch (Exception $e) {
    echo "<br>錯誤：<br>";
    echo $e->getMessage() . "<br>";
    echo "檔案：" . $e->getFile() . "<br>";
    echo "行號：" . $e->getLine() . "<br>";
} finally {
    // 確保關閉連線
    if (isset($conn) && $conn instanceof mysqli) {
        mysqli_close($conn);
        echo "<br>資料庫連線已關閉<br>";
    } elseif (isset($conn) && is_resource($conn)) {
        mysqli_close($conn);
        echo "<br>資料庫連線已關閉<br>";
    }
}

// 顯示 PHP 資訊
echo "<br>PHP 版本：" . PHP_VERSION . "<br>";
echo "MySQL 擴充模組：" . (extension_loaded('mysqli') ? '已載入' : '未載入') . "<br>";
?> 