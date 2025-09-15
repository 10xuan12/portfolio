<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 資料庫連線設定
global $conn;

// 嘗試多種連線方式
$connection_configs = [
    // 優先嘗試本機預設埠（多數 XAMPP/MariaDB 安裝使用 3306）
    [
        'host' => 'localhost',
        'username' => 'root',
        'password' => '',
        'database' => 'eportfolio2'
    ],
    [
        'host' => '127.0.0.1',
        'username' => 'root',
        'password' => '',
        'database' => 'eportfolio2'
    ],
    // 明確嘗試 3306（某些環境需要顯式指定）
    [
        'host' => 'localhost:3306',
        'username' => 'root',
        'password' => '',
        'database' => 'eportfolio2'
    ],
];

$conn = null;
$connection_error = '';

foreach ($connection_configs as $config) {
    try {
        $conn = mysqli_init();
        mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 3);
        
        if (mysqli_real_connect($conn, $config['host'], $config['username'], $config['password'], $config['database'])) {
            // 設定字符集
            $conn->set_charset("utf8mb4");
            
            // 檢查連線
            if (!$conn->connect_error) {
                // 連線成功，跳出迴圈
                break;
            }
        }
    } catch (Exception $e) {
        $connection_error .= "連線 {$config['host']} 失敗: " . $e->getMessage() . "<br>";
        continue;
    }
}

// 如果所有連線都失敗
if (!$conn || $conn->connect_error) {
    // 創建一個簡單的錯誤頁面
    ?>
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>資料庫連線錯誤</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 50px; background: #f5f5f5; }
            .error-container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error-title { color: #e74c3c; font-size: 24px; margin-bottom: 20px; }
            .error-message { color: #555; line-height: 1.6; }
            .solution { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px; }
            .solution h3 { color: #2c3e50; margin-top: 0; }
        </style>
    </head>
    <body>
        <div class="error-container">
            <h1 class="error-title">⚠️ 資料庫連線錯誤</h1>
            <div class="error-message">
                <p>無法連線到資料庫，請檢查以下設定：</p>
                <div class="solution">
                    <h3>解決方案：</h3>
                    <ol>
                        <li><strong>啟動 XAMPP</strong>：確保 Apache 和 MySQL 服務都已啟動</li>
                        <li><strong>檢查資料庫</strong>：確認資料庫 'eportfolio2' 已創建</li>
                        <li><strong>檢查使用者權限</strong>：確認資料庫使用者有適當權限</li>
                        <li><strong>檢查網路連線</strong>：確認可以連線到資料庫伺服器</li>
                    </ol>
                    <p><strong>錯誤詳情：</strong></p>
                    <pre><?php echo $connection_error; ?></pre>
                </div>
                <p><a href="javascript:location.reload()">🔄 重新整理頁面</a></p>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit();
}
