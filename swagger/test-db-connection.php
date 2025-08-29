<?php
/**
 * 測試資料庫連接
 */

// 設定錯誤報告
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 如果收到測試請求
if (isset($_GET['run'])) {
    echo "<h1>🔍 測試資料庫連接</h1>";
    echo "<p><strong>⏰ 時間:</strong> " . date('Y-m-d H:i:s') . "</p>";
    echo "<hr>";
    
    // 測試不同的路徑
    $test_paths = [
        'dirname(__DIR__) . /includes/db_connect.php' => dirname(__DIR__) . '/includes/db_connect.php',
        'dirname(dirname(__DIR__)) . /includes/db_connect.php' => dirname(dirname(__DIR__)) . '/includes/db_connect.php',
        '__DIR__ . /../includes/db_connect.php' => __DIR__ . '/../includes/db_connect.php',
        '__DIR__ . /../../includes/db_connect.php' => __DIR__ . '/../../includes/db_connect.php'
    ];
    
    foreach ($test_paths as $name => $path) {
        echo "<div style='margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;'>";
        echo "<h3>🔍 測試路徑: $name</h3>";
        echo "<p><strong>📍 完整路徑:</strong> $path</p>";
        
        if (file_exists($path)) {
            echo "<p style='color: green;'><strong>✅ 檔案存在</strong></p>";
            
            // 嘗試包含檔案
            try {
                require_once $path;
                echo "<p style='color: green;'><strong>✅ 檔案包含成功</strong></p>";
                
                // 檢查是否有資料庫連接
                if (isset($GLOBALS['conn'])) {
                    echo "<p style='color: green;'><strong>✅ 資料庫連接變數存在</strong></p>";
                } else {
                    echo "<p style='color: red;'><strong>❌ 資料庫連接變數不存在</strong></p>";
                }
            } catch (Exception $e) {
                echo "<p style='color: red;'><strong>❌ 檔案包含失敗:</strong> " . $e->getMessage() . "</p>";
            }
        } else {
            echo "<p style='color: red;'><strong>❌ 檔案不存在</strong></p>";
        }
        
        echo "</div>";
    }
    
    // 顯示當前目錄信息
    echo "<div style='margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;'>";
    echo "<h3>📁 目錄信息</h3>";
    echo "<p><strong>當前目錄 (__DIR__):</strong> " . __DIR__ . "</p>";
    echo "<p><strong>上級目錄:</strong> " . dirname(__DIR__) . "</p>";
    echo "<p><strong>上上級目錄:</strong> " . dirname(dirname(__DIR__)) . "</p>";
    echo "</div>";
    
    exit();
}
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>測試資料庫連接</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: #f5f5f5; 
            line-height: 1.6;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }
        .test-btn { 
            background: #28a745; 
            color: white; 
            border: none; 
            padding: 15px 30px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 16px; 
            margin: 10px;
        }
        .test-btn:hover { 
            background: #218838; 
        }
        .results { 
            margin-top: 20px; 
            padding: 20px; 
            background: #f8f9fa; 
            border-radius: 5px; 
            border: 1px solid #dee2e6;
        }
        .info-box {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 測試資料庫連接</h1>
            <p>檢查資料庫連接檔案的路徑和包含情況</p>
        </div>
        
        <div class="info-box">
            <h3>📋 測試說明</h3>
            <p>這個工具會測試不同的路徑來找到資料庫連接檔案，並檢查：</p>
            <ul>
                <li>檔案是否存在</li>
                <li>檔案是否可以成功包含</li>
                <li>資料庫連接變數是否正確設定</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <button class="test-btn" onclick="runTest()">測試資料庫連接</button>
            <button class="test-btn" onclick="clearResults()" style="background: #6c757d;">清除結果</button>
        </div>
        
        <div id="results" class="results" style="display: none;"></div>
    </div>
    
    <script>
        function runTest() {
            const btn = document.querySelector('.test-btn');
            const results = document.getElementById('results');
            
            btn.disabled = true;
            btn.textContent = '測試中...';
            results.style.display = 'block';
            results.innerHTML = '<p>正在測試資料庫連接...</p>';
            
            fetch('test-db-connection.php?run=1')
                .then(response => response.text())
                .then(data => {
                    results.innerHTML = data;
                    btn.disabled = false;
                    btn.textContent = '重新測試資料庫連接';
                })
                .catch(error => {
                    results.innerHTML = '<p style="color: red;">測試執行失敗: ' + error.message + '</p>';
                    btn.disabled = false;
                    btn.textContent = '重新測試資料庫連接';
                });
        }
        
        function clearResults() {
            const results = document.getElementById('results');
            results.style.display = 'none';
            results.innerHTML = '';
        }
    </script>
</body>
</html>
