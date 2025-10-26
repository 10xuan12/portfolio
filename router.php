<?php
/**
 * Railway 路由器
 * 用於 PHP 內建伺服器的路由處理
 * 因為 PHP 內建伺服器不支援 .htaccess
 */

// 設置 CORS 標頭
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID, Accept');

// 處理 OPTIONS 請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 獲取請求 URI
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$query = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY);

// 移除前導斜線
$uri = ltrim($uri, '/');

// 記錄請求用於調試
error_log("Router: Original URI = " . $_SERVER['REQUEST_URI']);
error_log("Router: Parsed URI = " . $uri);

// 處理 /portfolio/ 前綴（如果存在）
if (strpos($uri, 'portfolio/') === 0) {
    $uri = substr($uri, 10); // 移除 'portfolio/' 前綴
    error_log("Router: Removed portfolio prefix, new URI = " . $uri);
}

// 如果請求的是靜態文件且存在，直接返回
$file_path = __DIR__ . '/' . $uri;
if (is_file($file_path)) {
    error_log("Router: Serving static file: " . $file_path);
    return false; // 讓 PHP 內建伺服器處理
}

// 處理健康檢查
if ($uri === 'health.php' || $uri === 'health') {
    require_once __DIR__ . '/health.php';
    exit;
}

// 處理 API 請求
if (strpos($uri, 'api/') === 0) {
    // 提取 API 路徑
    $api_path = substr($uri, 4); // 移除 'api/' 前綴
    
    error_log("Router: API path = " . $api_path);
    
    // 檢查是否為直接的 PHP 文件請求
    if (preg_match('/^(student|admin|enterprise)\/([a-z-]+)\.php$/', $api_path, $matches)) {
        $folder = $matches[1];
        $file = $matches[2];
        $target_file = __DIR__ . "/api/{$folder}/{$file}.php";
        
        error_log("Router: Looking for file: " . $target_file);
        
        if (file_exists($target_file)) {
            error_log("Router: Serving API file: " . $target_file);
            require_once $target_file;
            exit;
        }
    }
    
    // 檢查根目錄下的 PHP 文件
    if (preg_match('/^([a-z-]+)\.php$/', $api_path, $matches)) {
        $file = $matches[1];
        $target_file = __DIR__ . "/api/{$file}.php";
        
        error_log("Router: Looking for root file: " . $target_file);
        
        if (file_exists($target_file)) {
            error_log("Router: Serving root API file: " . $target_file);
            require_once $target_file;
            exit;
        }
    }
    
    // 如果沒有找到特定文件，使用 api/index.php
    error_log("Router: No specific file found, using api/index.php");
    $_GET['path'] = $api_path;
    require_once __DIR__ . '/api/index.php';
    exit;
}

// 處理前端路由（SPA）
// 檢查是否為靜態資源
$extension = pathinfo($uri, PATHINFO_EXTENSION);
$static_extensions = ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'json', 'xml', 'txt'];

if (in_array($extension, $static_extensions)) {
    error_log("Router: Static resource not found: " . $uri);
    http_response_code(404);
    echo "File not found: " . htmlspecialchars($uri);
    exit;
}

// 所有其他請求返回 index.html（SPA 支援）
if ($uri === '' || $uri === 'index.html') {
    require_once __DIR__ . '/frontend/index.html';
} else {
    // 檢查是否為前端頁面請求
    $frontend_file = __DIR__ . '/frontend/' . $uri;
    if (file_exists($frontend_file) && is_file($frontend_file)) {
        error_log("Router: Serving frontend file: " . $frontend_file);
        require_once $frontend_file;
    } else {
        error_log("Router: Serving default index.html for SPA routing");
        require_once __DIR__ . '/frontend/index.html';
    }
}
exit;

