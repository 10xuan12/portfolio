<?php
/**
 * Portfolio+ 監控數據接收端點
 * 處理前端發送的監控數據並存儲到資料庫
 */

require_once '../config.php';

// 設定 CORS 與回應格式
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// 預檢請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 只接受 POST 請求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendApiError('只接受 POST 請求', 405, 'METHOD_NOT_ALLOWED');
}

// 獲取請求數據
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendApiError('無效的 JSON 數據', 400, 'INVALID_JSON');
}

// 驗證必要欄位
if (!isset($input['type']) || !isset($input['data'])) {
    sendApiError('缺少必要欄位', 400, 'MISSING_FIELDS');
}

$type = $input['type'];
$data = $input['data'];
$timestamp = $input['timestamp'] ?? date('Y-m-d H:i:s');
$sessionId = $input['sessionId'] ?? null;
$userId = $input['userId'] ?? null;

try {
    switch ($type) {
        case 'error':
            handleErrorData($data, $timestamp, $sessionId, $userId);
            break;
        case 'performance':
            handlePerformanceData($data, $timestamp, $sessionId, $userId);
            break;
        case 'user_action':
            handleUserActionData($data, $timestamp, $sessionId, $userId);
            break;
        case 'api_call':
            handleApiCallData($data, $timestamp, $sessionId, $userId);
            break;
        case 'periodic_report':
            handlePeriodicReport($data, $timestamp, $sessionId, $userId);
            break;
        default:
            sendApiError('未知的監控數據類型', 400, 'UNKNOWN_TYPE');
    }
    
    sendApiResponse(['status' => 'success'], 200, '監控數據已接收');
    
} catch (Exception $e) {
    debugLog('監控數據處理失敗: ' . $e->getMessage());
    sendApiError('監控數據處理失敗', 500, 'PROCESSING_ERROR');
}

/**
 * 處理錯誤數據
 */
function handleErrorData($data, $timestamp, $sessionId, $userId) {
    $stmt = $GLOBALS['conn']->prepare("
        INSERT INTO monitoring_errors (
            user_id, session_id, error_type, error_message, 
            filename, line_number, column_number, stack_trace,
            url, user_agent, timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->bind_param("issssiissss",
        $userId,
        $sessionId,
        $data['type'] ?? 'unknown',
        $data['message'] ?? '',
        $data['filename'] ?? null,
        $data['lineno'] ?? null,
        $data['colno'] ?? null,
        $data['stack'] ?? null,
        $data['url'] ?? null,
        $data['userAgent'] ?? null,
        $timestamp
    );
    
    $stmt->execute();
    $stmt->close();
}

/**
 * 處理性能數據
 */
function handlePerformanceData($data, $timestamp, $sessionId, $userId) {
    $stmt = $GLOBALS['conn']->prepare("
        INSERT INTO monitoring_performance (
            user_id, session_id, performance_type, load_time,
            dom_content_loaded, first_paint, memory_usage,
            url, timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->bind_param("issdddisss",
        $userId,
        $sessionId,
        $data['type'] ?? 'unknown',
        $data['loadTime'] ?? null,
        $data['domContentLoaded'] ?? null,
        $data['firstPaint'] ?? null,
        $data['usedJSHeapSize'] ?? null,
        $data['url'] ?? null,
        $timestamp
    );
    
    $stmt->execute();
    $stmt->close();
}

/**
 * 處理用戶行為數據
 */
function handleUserActionData($data, $timestamp, $sessionId, $userId) {
    $stmt = $GLOBALS['conn']->prepare("
        INSERT INTO monitoring_user_actions (
            user_id, session_id, action_type, element_tag,
            element_id, element_class, element_text, form_id,
            url, referrer, timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->bind_param("isssssssssss",
        $userId,
        $sessionId,
        $data['type'] ?? 'unknown',
        $data['element'] ?? null,
        $data['id'] ?? null,
        $data['className'] ?? null,
        $data['text'] ?? null,
        $data['formId'] ?? null,
        $data['url'] ?? null,
        $data['referrer'] ?? null,
        $timestamp
    );
    
    $stmt->execute();
    $stmt->close();
}

/**
 * 處理API調用數據
 */
function handleApiCallData($data, $timestamp, $sessionId, $userId) {
    $stmt = $GLOBALS['conn']->prepare("
        INSERT INTO monitoring_api_calls (
            user_id, session_id, api_url, method, status_code,
            response_time, success, error_message, timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $success = $data['success'] ? 1 : 0;
    
    $stmt->bind_param("isssiissss",
        $userId,
        $sessionId,
        $data['url'] ?? '',
        $data['method'] ?? 'GET',
        $data['status'] ?? 0,
        $data['responseTime'] ?? 0,
        $success,
        $data['error'] ?? null,
        $timestamp
    );
    
    $stmt->execute();
    $stmt->close();
}

/**
 * 處理定期報告
 */
function handlePeriodicReport($data, $timestamp, $sessionId, $userId) {
    $stmt = $GLOBALS['conn']->prepare("
        INSERT INTO monitoring_reports (
            user_id, session_id, error_stats, performance_summary,
            user_action_summary, timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $errorStats = json_encode($data['errorStats'] ?? []);
    $performanceSummary = json_encode($data['performanceSummary'] ?? []);
    $userActionSummary = json_encode($data['userActionSummary'] ?? []);
    
    $stmt->bind_param("issssss",
        $userId,
        $sessionId,
        $errorStats,
        $performanceSummary,
        $userActionSummary,
        $timestamp
    );
    
    $stmt->execute();
    $stmt->close();
}

// 創建監控表（如果不存在）
function createMonitoringTables() {
    $queries = [
        "CREATE TABLE IF NOT EXISTS monitoring_errors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            session_id VARCHAR(100),
            error_type VARCHAR(50),
            error_message TEXT,
            filename VARCHAR(255),
            line_number INT,
            column_number INT,
            stack_trace TEXT,
            url VARCHAR(500),
            user_agent TEXT,
            timestamp DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_session_id (session_id),
            INDEX idx_error_type (error_type),
            INDEX idx_timestamp (timestamp)
        )",
        
        "CREATE TABLE IF NOT EXISTS monitoring_performance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            session_id VARCHAR(100),
            performance_type VARCHAR(50),
            load_time DECIMAL(10,3),
            dom_content_loaded DECIMAL(10,3),
            first_paint DECIMAL(10,3),
            memory_usage BIGINT,
            url VARCHAR(500),
            timestamp DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_session_id (session_id),
            INDEX idx_performance_type (performance_type),
            INDEX idx_timestamp (timestamp)
        )",
        
        "CREATE TABLE IF NOT EXISTS monitoring_user_actions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            session_id VARCHAR(100),
            action_type VARCHAR(50),
            element_tag VARCHAR(50),
            element_id VARCHAR(100),
            element_class VARCHAR(200),
            element_text VARCHAR(500),
            form_id VARCHAR(100),
            url VARCHAR(500),
            referrer VARCHAR(500),
            timestamp DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_session_id (session_id),
            INDEX idx_action_type (action_type),
            INDEX idx_timestamp (timestamp)
        )",
        
        "CREATE TABLE IF NOT EXISTS monitoring_api_calls (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            session_id VARCHAR(100),
            api_url VARCHAR(500),
            method VARCHAR(10),
            status_code INT,
            response_time DECIMAL(10,3),
            success BOOLEAN,
            error_message TEXT,
            timestamp DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_session_id (session_id),
            INDEX idx_api_url (api_url),
            INDEX idx_status_code (status_code),
            INDEX idx_timestamp (timestamp)
        )",
        
        "CREATE TABLE IF NOT EXISTS monitoring_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            session_id VARCHAR(100),
            error_stats JSON,
            performance_summary JSON,
            user_action_summary JSON,
            timestamp DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_session_id (session_id),
            INDEX idx_timestamp (timestamp)
        )"
    ];
    
    foreach ($queries as $query) {
        $GLOBALS['conn']->query($query);
    }
}

// 在處理請求前創建表
createMonitoringTables();
?>
