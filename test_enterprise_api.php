<?php
// 企業端 API 測試腳本
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "開始測試企業端 API...\n\n";

// 測試企業端登入
function testEnterpriseLogin() {
    echo "=== 測試企業端登入 ===\n";
    
    $url = 'http://localhost:8000/api/enterprise/auth.php';
    $data = [
        'action' => 'login',
        'username' => 'enterprise_test',
        'password' => 'password123'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen(json_encode($data))
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP 狀態碼: $httpCode\n";
    echo "回應內容: $response\n\n";
    
    $result = json_decode($response, true);
    if ($result && isset($result['status']) && $result['status'] == 200) {
        echo "✓ 企業端登入測試成功\n";
        return session_id();
    } else {
        echo "✗ 企業端登入測試失敗\n";
        return null;
    }
}

// 測試企業端儀表板
function testEnterpriseDashboard($sessionId) {
    echo "=== 測試企業端儀表板 ===\n";
    
    $url = 'http://localhost:8000/api/enterprise/dashboard.php';
    $data = [
        'action' => 'get_dashboard_data'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen(json_encode($data))
    ]);
    curl_setopt($ch, CURLOPT_COOKIE, "PHPSESSID=$sessionId");
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP 狀態碼: $httpCode\n";
    echo "回應內容: $response\n\n";
    
    $result = json_decode($response, true);
    if ($result && isset($result['status']) && $result['status'] == 200) {
        echo "✓ 企業端儀表板測試成功\n";
    } else {
        echo "✗ 企業端儀表板測試失敗\n";
    }
}

// 測試企業端職缺管理
function testEnterpriseJobs($sessionId) {
    echo "=== 測試企業端職缺管理 ===\n";
    
    $url = 'http://localhost:8000/api/enterprise/jobs.php';
    $data = [
        'action' => 'list_jobs'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen(json_encode($data))
    ]);
    curl_setopt($ch, CURLOPT_COOKIE, "PHPSESSID=$sessionId");
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP 狀態碼: $httpCode\n";
    echo "回應內容: $response\n\n";
    
    $result = json_decode($response, true);
    if ($result && isset($result['status']) && $result['status'] == 200) {
        echo "✓ 企業端職缺管理測試成功\n";
    } else {
        echo "✗ 企業端職缺管理測試失敗\n";
    }
}

// 測試企業端作品集瀏覽
function testEnterprisePortfolios($sessionId) {
    echo "=== 測試企業端作品集瀏覽 ===\n";
    
    $url = 'http://localhost:8000/api/enterprise/portfolios.php';
    $data = [
        'action' => 'list_portfolios'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen(json_encode($data))
    ]);
    curl_setopt($ch, CURLOPT_COOKIE, "PHPSESSID=$sessionId");
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP 狀態碼: $httpCode\n";
    echo "回應內容: $response\n\n";
    
    $result = json_decode($response, true);
    if ($result && isset($result['status']) && $result['status'] == 200) {
        echo "✓ 企業端作品集瀏覽測試成功\n";
    } else {
        echo "✗ 企業端作品集瀏覽測試失敗\n";
    }
}

// 執行測試
echo "開始執行 API 測試...\n\n";

$sessionId = testEnterpriseLogin();

if ($sessionId) {
    testEnterpriseDashboard($sessionId);
    testEnterpriseJobs($sessionId);
    testEnterprisePortfolios($sessionId);
} else {
    echo "登入失敗，跳過其他測試\n";
}

echo "\nAPI 測試完成！\n";
?>
