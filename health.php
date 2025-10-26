<?php
// 簡單的健康檢查端點，不依賴資料庫
header('Content-Type: application/json');
http_response_code(200);
echo json_encode([
    'status' => 'ok',
    'message' => 'Service is healthy',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION
]);

