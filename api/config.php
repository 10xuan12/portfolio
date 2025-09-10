<?php
// API 配置檔案
header('Content-Type: application/json; charset=utf-8');

// 啟用調試模式
define('DEBUG_MODE', true);

// 設定 CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');

// 處理 OPTIONS 請求
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 錯誤報告設定
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 時區設定
date_default_timezone_set('Asia/Taipei');

// 包含安全驗證器
require_once __DIR__ . '/security-validator.php';

// 全域安全驗證器實例
$GLOBALS['securityValidator'] = $securityValidator;

// 包含JWT管理器
require_once __DIR__ . '/jwt-manager.php';

// 全域JWT管理器實例
$GLOBALS['jwtManager'] = $jwtManager;

// API版本控制
define('API_VERSION', 'v1');
define('SUPPORTED_VERSIONS', ['v1', 'v2']);

// 獲取API版本
function getApiVersion() {
    $headers = getallheaders();
    
    // 從Accept標頭獲取版本
    if (isset($headers['Accept'])) {
        if (preg_match('/application\/vnd\.portfolio\.v(\d+)\+json/', $headers['Accept'], $matches)) {
            return 'v' . $matches[1];
        }
    }
    
    // 從URL路徑獲取版本
    $path = $_SERVER['REQUEST_URI'];
    if (preg_match('/\/api\/v(\d+)\//', $path, $matches)) {
        return 'v' . $matches[1];
    }
    
    // 從查詢參數獲取版本
    if (isset($_GET['version'])) {
        $version = 'v' . ltrim($_GET['version'], 'v');
        if (in_array($version, SUPPORTED_VERSIONS)) {
            return $version;
        }
    }
    
    // 預設版本
    return API_VERSION;
}

// 檢查API版本兼容性
function checkApiVersionCompatibility($version) {
    if (!in_array($version, SUPPORTED_VERSIONS)) {
        sendApiError(
            "不支援的API版本: {$version}。支援的版本: " . implode(', ', SUPPORTED_VERSIONS),
            400,
            'UNSUPPORTED_VERSION'
        );
    }
    
    return true;
}

// 版本化回應
function sendVersionedResponse($data, $status = 200, $message = 'success', $meta = []) {
    $version = getApiVersion();
    checkApiVersionCompatibility($version);
    
    $response = [
        'status' => $status,
        'message' => $message,
        'version' => $version,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if (!empty($meta)) {
        $response['meta'] = $meta;
    }
    
    // 根據版本調整回應格式
    switch ($version) {
        case 'v2':
            // v2版本可能包含額外的元數據
            $response['api_info'] = [
                'version' => $version,
                'deprecated' => false,
                'sunset_date' => null
            ];
            break;
        case 'v1':
        default:
            // v1版本保持原有格式
            break;
    }
    
    http_response_code($status);
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

// 版本化錯誤回應
function sendVersionedError($message, $status = 400, $code = null, $details = null) {
    $version = getApiVersion();
    checkApiVersionCompatibility($version);
    
    $response = [
        'status' => $status,
        'message' => $message,
        'version' => $version,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($code) {
        $response['code'] = $code;
    }
    
    if ($details) {
        $response['details'] = $details;
    }
    
    // 根據版本調整錯誤格式
    switch ($version) {
        case 'v2':
            $response['error_info'] = [
                'code' => $code,
                'type' => 'client_error',
                'help_url' => 'https://docs.portfolio.com/errors/' . $code
            ];
            break;
    }
    
    http_response_code($status);
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

// 向後兼容性處理
function handleBackwardCompatibility($data, $fromVersion, $toVersion) {
    if ($fromVersion === $toVersion) {
        return $data;
    }
    
    // 處理從v1到v2的轉換
    if ($fromVersion === 'v1' && $toVersion === 'v2') {
        return upgradeToV2($data);
    }
    
    // 處理從v2到v1的轉換
    if ($fromVersion === 'v2' && $toVersion === 'v1') {
        return downgradeToV1($data);
    }
    
    return $data;
}

// 升級到v2格式
function upgradeToV2($data) {
    if (is_array($data)) {
        // 添加v2特有的欄位
        if (isset($data['user_id'])) {
            $data['id'] = $data['user_id'];
            unset($data['user_id']);
        }
        
        // 添加時間戳
        if (!isset($data['created_at'])) {
            $data['created_at'] = date('Y-m-d H:i:s');
        }
        
        if (!isset($data['updated_at'])) {
            $data['updated_at'] = date('Y-m-d H:i:s');
        }
    }
    
    return $data;
}

// 降級到v1格式
function downgradeToV1($data) {
    if (is_array($data)) {
        // 移除v2特有的欄位
        if (isset($data['id']) && !isset($data['user_id'])) {
            $data['user_id'] = $data['id'];
        }
        
        // 移除時間戳
        unset($data['created_at'], $data['updated_at']);
    }
    
    return $data;
}

// 包含資料庫連接 - 使用絕對路徑
$db_path = dirname(__DIR__) . '/includes/db_connect.php';
if (file_exists($db_path)) {
    require_once $db_path;
} else {
    // 如果找不到檔案，嘗試其他路徑
    $alternative_paths = [
        dirname(__DIR__) . '/includes/db_connect.php',
        dirname(dirname(__DIR__)) . '/includes/db_connect.php',
        __DIR__ . '/../includes/db_connect.php',
        __DIR__ . '/../../includes/db_connect.php'
    ];
    
    $found = false;
    foreach ($alternative_paths as $path) {
        if (file_exists($path)) {
            require_once $path;
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        // 如果都找不到，創建一個基本的資料庫連接
        error_log("無法找到資料庫連接檔案: $db_path");
        error_log("嘗試的路徑: " . implode(', ', $alternative_paths));
        error_log("當前目錄: " . __DIR__);
        http_response_code(500);
        echo json_encode([
            'status' => 500,
            'message' => '資料庫連接配置錯誤',
            'error' => '找不到資料庫連接檔案'
        ]);
        exit();
    }
}

// 回應函數
function sendResponse($data, $status = 200, $message = 'success') {
    http_response_code($status);
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

function sendError($message, $status = 400) {
    sendResponse(null, $status, $message);
}

// 驗證 JWT Token 函數
function validateToken() {
    global $jwtManager;
    
    $headers = getallheaders();
    $token = null;
    
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
    } elseif (isset($_GET['token'])) {
        $token = $_GET['token'];
    } elseif (isset($_POST['token'])) {
        $token = $_POST['token'];
    }
    
    if (!$token) {
        sendApiError('未提供認證 Token', 401, 'NO_TOKEN');
    }
    
    // 驗證JWT Token
    $validation = $jwtManager->validateToken($token);
    
    if (!$validation['valid']) {
        $errorCode = 'INVALID_TOKEN';
        if ($validation['error'] === 'Token expired') {
            $errorCode = 'TOKEN_EXPIRED';
        }
        sendApiError('認證失敗: ' . $validation['error'], 401, $errorCode);
    }
    
    $payload = $validation['payload'];
    
    // 驗證用戶是否存在且活躍
    $stmt = $GLOBALS['conn']->prepare("SELECT id, role, status FROM users WHERE id = ?");
    $stmt->bind_param("i", $payload['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        sendApiError('用戶不存在', 404, 'USER_NOT_FOUND');
    }
    
    if ($user['status'] !== 'active') {
        sendApiError('帳號已被停用', 403, 'ACCOUNT_DISABLED');
    }
    
    return $payload['user_id'];
}

// 生成JWT Token
function generateJWTToken($userId, $additionalData = []) {
    global $jwtManager;
    
    $payload = [
        'user_id' => $userId,
        'type' => 'access_token'
    ];
    
    $payload = array_merge($payload, $additionalData);
    
    return $jwtManager->generateToken($payload);
}

// 刷新JWT Token
function refreshJWTToken($token) {
    global $jwtManager;
    
    $result = $jwtManager->refreshToken($token);
    
    if (!$result['success']) {
        sendApiError('Token刷新失敗: ' . $result['error'], 401, 'REFRESH_FAILED');
    }
    
    return $result['token'];
}

// 統一的API回應格式
function sendApiResponse($data = null, $status = 200, $message = 'success', $meta = []) {
    http_response_code($status);
    
    $response = [
        'status' => $status,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if (!empty($meta)) {
        $response['meta'] = $meta;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

// 統一的錯誤回應格式
function sendApiError($message, $status = 400, $code = null, $details = null) {
    http_response_code($status);
    
    $response = [
        'status' => $status,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($code) {
        $response['code'] = $code;
    }
    
    if ($details) {
        $response['details'] = $details;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

// 驗證使用者權限
function checkPermission($requiredRole = null) {
    // 首先嘗試從 session 獲取使用者 ID
    session_start();
    $userId = null;
    
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
        debugLog("從 session 獲取使用者 ID: " . $userId);
    } else {
        // 如果 session 沒有，嘗試從請求標頭或參數獲取
        $headers = getallheaders();
        
        // 檢查是否有 X-User-ID 標頭
        if (isset($headers['X-User-ID'])) {
            $userId = (int)$headers['X-User-ID'];
            debugLog("從 X-User-ID 標頭獲取使用者 ID: " . $userId);
        } 
        // 檢查是否有 user_id 參數
        elseif (isset($_GET['user_id'])) {
            $userId = (int)$_GET['user_id'];
            debugLog("從 GET 參數獲取使用者 ID: " . $userId);
        }
        // 檢查 POST 資料中是否有 user_id
        elseif (isset($_POST['user_id'])) {
            $userId = (int)$_POST['user_id'];
            debugLog("從 POST 參數獲取使用者 ID: " . $userId);
        }
        // 檢查 JSON 請求體中是否有 user_id
        else {
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['user_id'])) {
                $userId = (int)$input['user_id'];
                debugLog("從 JSON 請求體獲取使用者 ID: " . $userId);
            }
        }
    }
    
    if (!$userId) {
        debugLog("無法獲取使用者 ID，權限驗證失敗");
        sendError('未提供使用者認證資訊', 401);
    }
    
    // 驗證使用者是否存在
    $stmt = $GLOBALS['conn']->prepare("SELECT id, role, status FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        debugLog("使用者不存在，ID: " . $userId);
        sendError('使用者不存在', 404);
    }
    
    if ($user['status'] !== 'active') {
        debugLog("使用者帳號已被停用，ID: " . $userId);
        sendError('帳號已被停用', 403);
    }
    
    // 如果指定了角色要求，檢查角色權限
    if ($requiredRole && $user['role'] !== $requiredRole) {
        debugLog("使用者角色不符，需要: " . $requiredRole . "，實際: " . $user['role']);
        sendError('權限不足，需要 ' . $requiredRole . ' 角色', 403);
    }
    
    debugLog("權限驗證成功，使用者 ID: " . $userId . "，角色: " . $user['role']);
    return $userId;
}

// 調試日誌函數
function debugLog($message) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        error_log("[DEBUG] " . $message);
    }
}

// 清理輸入資料
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

// 驗證必填欄位
function validateRequired($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        sendError('缺少必填欄位: ' . implode(', ', $missing), 400);
    }
    
    return true;
}

// 檔案上傳設定
define('UPLOAD_MAX_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'zip', 'rar']);
define('UPLOAD_PATH', '../uploads/');

// 檢查上傳目錄
if (!is_dir(UPLOAD_PATH)) {
    mkdir(UPLOAD_PATH, 0755, true);
}
if (!is_dir(UPLOAD_PATH . 'portfolios/')) {
    mkdir(UPLOAD_PATH . 'portfolios/', 0755, true);
}
if (!is_dir(UPLOAD_PATH . 'avatars/')) {
    mkdir(UPLOAD_PATH . 'avatars/', 0755, true);
}
if (!is_dir(UPLOAD_PATH . 'resumes/')) {
    mkdir(UPLOAD_PATH . 'resumes/', 0755, true);
}
?>
