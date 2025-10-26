<?php
// 主要入口點 - 處理路由
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');

// 處理 OPTIONS 請求
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 獲取請求路徑
$requestUri = $_SERVER['REQUEST_URI'];
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// 移除前導斜線
$requestPath = ltrim($requestPath, '/');

// 靜態檔案處理
if (file_exists($requestPath) && !is_dir($requestPath)) {
    // 根據檔案類型設定 Content-Type
    $extension = pathinfo($requestPath, PATHINFO_EXTENSION);
    $contentTypes = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'pdf' => 'application/pdf',
    ];
    
    if (isset($contentTypes[$extension])) {
        header('Content-Type: ' . $contentTypes[$extension]);
    }
    
    readfile($requestPath);
    exit();
}

// API 路由
if (strpos($requestPath, 'api/') === 0) {
    $apiPath = substr($requestPath, 4); // 移除 'api/' 前綴
    $apiFile = __DIR__ . '/api/' . $apiPath;
    
    if (file_exists($apiFile)) {
        require $apiFile;
        exit();
    } else {
        // API 端點不存在
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode([
            'status' => 404,
            'message' => 'API 端點不存在',
            'path' => $requestPath
        ]);
        exit();
    }
}

// 前端路由 - 預設返回 index.html
if (empty($requestPath) || $requestPath === 'index.php') {
    if (file_exists('frontend/index.html')) {
        header('Content-Type: text/html');
        readfile('frontend/index.html');
        exit();
    }
}

// 處理前端路由
$frontendPath = 'frontend/' . $requestPath;
if (file_exists($frontendPath)) {
    if (is_dir($frontendPath)) {
        // 如果是目錄，嘗試讀取 index.html
        if (file_exists($frontendPath . '/index.html')) {
            header('Content-Type: text/html');
            readfile($frontendPath . '/index.html');
            exit();
        }
    } else {
        // 根據檔案類型設定 Content-Type
        $extension = pathinfo($frontendPath, PATHINFO_EXTENSION);
        $contentTypes = [
            'html' => 'text/html',
            'css' => 'text/css',
            'js' => 'application/javascript',
            'json' => 'application/json',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
        ];
        
        if (isset($contentTypes[$extension])) {
            header('Content-Type: ' . $contentTypes[$extension]);
        }
        
        readfile($frontendPath);
        exit();
    }
}

// 404 - 檔案不存在
if (file_exists('frontend/404.html')) {
    header('Content-Type: text/html');
    http_response_code(404);
    readfile('frontend/404.html');
} else {
    http_response_code(404);
    echo '404 - 頁面不存在';
}
?>

