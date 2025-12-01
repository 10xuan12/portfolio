<?php
require_once '../config.php';

// 學生 API 主要路由
header('Content-Type: application/json; charset=utf-8');

// 取得請求路徑
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// 找到 student 部分後的路徑
$student_index = array_search('student', $path_parts);
if ($student_index !== false) {
    $api_path = array_slice($path_parts, $student_index + 1);
} else {
    $api_path = [];
}

// 路由到對應的 API 檔案
if (empty($api_path)) {
    sendError('無效的 API 路徑', 404);
}

$endpoint = $api_path[0];
$action = $api_path[1] ?? '';

// 根據端點路由到對應的檔案
switch ($endpoint) {
    case 'auth':
        require_once 'auth.php';
        break;
    case 'profile':
        require_once 'profile.php';
        break;
    case 'portfolio':
        require_once 'portfolio.php';
        break;
    case 'resume':
        require_once 'resume.php';
        break;
    case 'notifications':
        require_once 'notifications.php';
        break;
    case 'activities':
        require_once 'activities.php';
        break;
    case 'badges':
        require_once 'badges.php';
        break;
    case 'ai-service':
        require_once 'ai-service.php';
        break;
    default:
        sendError('無效的 API 端點: ' . $endpoint, 404);
}
?>
