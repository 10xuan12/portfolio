<?php
/**
 * Portfolio+ API 測試腳本
 * 用於快速測試後端 API 是否正常運作
 */

// 設定錯誤報告
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 測試配置
$base_urls = [
    'local' => 'http://localhost/portfolio',
    'team' => 'http://172.20.10.2/portfolio'
];

$test_accounts = [
    'student' => [
        'email' => 'student@example.com',
        'password' => 'password123'
    ],
    'admin' => [
        'email' => 'admin@portfolio.com',
        'password' => 'admin123'
    ]
];

// 測試結果存儲
$test_results = [];

/**
 * 執行 HTTP 請求
 */
function makeRequest($url, $method = 'GET', $data = null, $headers = []) {
    $ch = curl_init();
    
    $default_headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    
    $headers = array_merge($default_headers, $headers);
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    
    if ($method === 'POST' && $data) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } elseif ($method !== 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        return ['error' => $error, 'http_code' => 0];
    }
    
    // 分離標頭和主體
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $header = substr($response, 0, $header_size);
    $body = substr($response, $header_size);
    
    return [
        'http_code' => $http_code,
        'headers' => $header,
        'body' => $body,
        'error' => null
    ];
}

/**
 * 測試 API 端點
 */
function testEndpoint($name, $url, $method = 'GET', $data = null, $expected_code = 200) {
    global $test_results;
    
    echo "🧪 測試: $name\n";
    echo "📍 URL: $url\n";
    echo "🔧 方法: $method\n";
    
    if ($data) {
        echo "📤 資料: " . json_encode($data, JSON_UNESCAPED_UNICODE) . "\n";
    }
    
    $response = makeRequest($url, $method, $data);
    
    if ($response['error']) {
        echo "❌ 錯誤: " . $response['error'] . "\n";
        $test_results[$name] = false;
    } else {
        echo "📊 HTTP 狀態碼: " . $response['http_code'] . "\n";
        
        if ($response['http_code'] == $expected_code) {
            echo "✅ 測試通過\n";
            $test_results[$name] = true;
        } else {
            echo "❌ 測試失敗 (期望: $expected_code, 實際: " . $response['http_code'] . ")\n";
            $test_results[$name] = false;
        }
        
        // 顯示響應內容（如果是 JSON）
        if ($response['body']) {
            $json_response = json_decode($response['body'], true);
            if ($json_response) {
                echo "📥 響應: " . json_encode($json_response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
            } else {
                echo "📥 響應: " . substr($response['body'], 0, 200) . "\n";
            }
        }
    }
    
    echo str_repeat("-", 60) . "\n";
}

/**
 * 主測試函數
 */
function runTests() {
    global $base_urls, $test_accounts;
    
    echo "🚀 Portfolio+ API 測試開始\n";
    echo "⏰ 時間: " . date('Y-m-d H:i:s') . "\n";
    echo str_repeat("=", 60) . "\n\n";
    
    // 測試本地環境
    $local_url = $base_urls['local'];
    
    // 1. 測試 OPTIONS 請求（CORS）
    testEndpoint("CORS 預檢請求", "$local_url/api/student/auth", "OPTIONS");
    
    // 2. 測試學生註冊
    $register_data = [
        'email' => 'test_' . time() . '@example.com',
        'password' => 'testpass123',
        'confirm_password' => 'testpass123',
        'first_name' => '測試',
        'last_name' => '用戶'
    ];
    testEndpoint("學生註冊", "$local_url/api/student/auth", "POST", $register_data, 201);
    
    // 3. 測試學生登入
    $login_data = [
        'email' => $test_accounts['student']['email'],
        'password' => $test_accounts['student']['password']
    ];
    testEndpoint("學生登入", "$local_url/api/student/auth", "POST", $login_data);
    
    // 4. 測試獲取分類
    testEndpoint("獲取分類", "$local_url/api/student/portfolio?action=getCategories");
    
    // 5. 測試搜尋功能
    testEndpoint("搜尋功能", "$local_url/api/search?q=test&type=portfolio");
    
    // 6. 測試不存在的端點
    testEndpoint("404 錯誤處理", "$local_url/api/nonexistent", "GET", null, 404);
    
    // 顯示測試結果摘要
    echo "\n📋 測試結果摘要\n";
    echo str_repeat("=", 60) . "\n";
    
    $passed = 0;
    $total = count($test_results);
    
    foreach ($test_results as $test_name => $result) {
        $status = $result ? "✅ 通過" : "❌ 失敗";
        echo "$test_name: $status\n";
        if ($result) $passed++;
    }
    
    echo "\n📊 總計: $passed/$total 測試通過\n";
    
    if ($passed == $total) {
        echo "🎉 所有測試都通過了！您的 API 運作正常。\n";
    } else {
        echo "⚠️  有 " . ($total - $passed) . " 個測試失敗，請檢查相關配置。\n";
    }
}

// 檢查是否為命令行執行
if (php_sapi_name() === 'cli') {
    runTests();
} else {
    // 網頁版本
    ?>
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Portfolio+ API 測試腳本</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .test-btn { background: #007bff; color: white; border: none; padding: 15px 30px; border-radius: 5px; cursor: pointer; font-size: 16px; }
            .test-btn:hover { background: #0056b3; }
            .results { margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 5px; white-space: pre-wrap; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🧪 Portfolio+ API 測試腳本</h1>
                <p>點擊下方按鈕開始測試您的 API</p>
            </div>
            
            <button class="test-btn" onclick="runTests()">開始測試 API</button>
            
            <div id="results" class="results" style="display: none;"></div>
        </div>
        
        <script>
            function runTests() {
                const btn = document.querySelector('.test-btn');
                const results = document.getElementById('results');
                
                btn.disabled = true;
                btn.textContent = '測試中...';
                results.style.display = 'block';
                results.textContent = '正在執行測試...';
                
                // 使用 AJAX 調用測試腳本
                fetch('test-api.php?run=1')
                    .then(response => response.text())
                    .then(data => {
                        results.textContent = data;
                        btn.disabled = false;
                        btn.textContent = '重新測試';
                    })
                    .catch(error => {
                        results.textContent = '測試執行失敗: ' + error.message;
                        btn.disabled = false;
                        btn.textContent = '重新測試';
                    });
            }
        </script>
    </body>
    </html>
    <?php
    
    // 如果收到測試請求
    if (isset($_GET['run'])) {
        ob_start();
        runTests();
        $output = ob_get_clean();
        echo $output;
    }
}
?>
