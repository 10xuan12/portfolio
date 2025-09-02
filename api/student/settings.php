<?php
require_once '../config.php';

// 設定 CORS 與回應格式
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');
header('Content-Type: application/json; charset=utf-8');

// 預檢請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 使用者設定 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'get') {
            getUserSettings();
        } else {
            sendError('無效的請求', 400);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'update_settings':
                    updateUserSettings($input);
                    break;
                default:
                    sendError('無效的操作', 400);
            }
        } else {
            sendError('缺少操作類型', 400);
        }
        break;
        
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得使用者設定
function getUserSettings() {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $stmt = $GLOBALS['conn']->prepare(
        "SELECT setting_key, setting_value, setting_type 
         FROM user_settings 
         WHERE user_id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $settings = [];
    while ($row = $result->fetch_assoc()) {
        $value = $row['setting_value'];
        
        // 根據設定類型轉換值
        switch ($row['setting_type']) {
            case 'boolean':
                $value = (bool)$value;
                break;
            case 'number':
                $value = is_numeric($value) ? (float)$value : $value;
                break;
            case 'json':
                $value = json_decode($value, true);
                break;
        }
        
        $settings[$row['setting_key']] = $value;
    }
    
    // 如果沒有設定，使用預設值
    if (empty($settings)) {
        $settings = getDefaultSettings();
    }
    
    sendResponse($settings, 200);
}

// 更新使用者設定
function updateUserSettings($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    // 驗證必填欄位
    if (!isset($data['email_notification']) || !isset($data['public_profile']) || !isset($data['two_factor_auth'])) {
        sendError('缺少必要的設定欄位', 400);
    }
    
    $emailNotification = (int)$data['email_notification'];
    $publicProfile = (int)$data['public_profile'];
    $twoFactorAuth = (int)$data['two_factor_auth'];
    
    // 開始交易
    $GLOBALS['conn']->begin_transaction();
    
    try {
        // 更新或插入設定
        $settings = [
            'email_notification' => $emailNotification,
            'public_profile' => $publicProfile,
            'two_factor_auth' => $twoFactorAuth
        ];
        
        foreach ($settings as $key => $value) {
            $stmt = $GLOBALS['conn']->prepare(
                "INSERT INTO user_settings (user_id, setting_key, setting_value, setting_type) 
                 VALUES (?, ?, ?, 'boolean') 
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
            );
            $stmt->bind_param("iss", $userId, $key, $value);
            $stmt->execute();
        }
        
        $GLOBALS['conn']->commit();
        sendResponse(['message' => '設定更新成功'], 200, '更新成功');
        
    } catch (Exception $e) {
        $GLOBALS['conn']->rollback();
        sendError('更新失敗: ' . $e->getMessage(), 500);
    }
}

// 取得預設設定
function getDefaultSettings() {
    return [
        'email_notification' => true,
        'public_profile' => true,
        'two_factor_auth' => false,
        'profile_visibility' => 'public',
        'notification_frequency' => 'daily'
    ];
}

// 取得使用者 ID（統一邏輯）
function getUserId() {
    if (isset($_SESSION['user_id'])) {
        return (int)$_SESSION['user_id'];
    }
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (isset($headers['X-User-ID'])) {
        return (int)$headers['X-User-ID'];
    }
    if (isset($_GET['user_id'])) {
        return (int)$_GET['user_id'];
    }
    if (isset($_POST['user_id'])) {
        return (int)$_POST['user_id'];
    }
    return null;
}

// 注意：sendResponse 和 sendError 函數已在 config.php 中定義

// 驗證必填欄位
function validateRequired($data, $requiredFields) {
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            sendError("缺少必填欄位: {$field}", 400);
        }
    }
}

// 注意：sanitizeInput 函數已在 config.php 中定義
?>
