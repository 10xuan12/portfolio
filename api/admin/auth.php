<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 處理 OPTIONS 請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';

// 檢查資料庫連接
if (!isset($GLOBALS['conn']) || !$GLOBALS['conn']) {
    sendError('資料庫連接失敗', 500);
}

// 獲取請求資料
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

// 路由處理
switch ($action) {
    case 'login':
        handleLogin($input);
        break;
    case 'logout':
        handleLogout();
        break;
    case 'check_session':
        handleCheckSession();
        break;
    default:
        sendError('缺少操作類型', 400);
}

// 處理登入
function handleLogin($data) {
    validateRequired($data, ['username', 'password']);
    
    $username = sanitizeInput($data['username']);
    $password = $data['password'];
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT id, username, email, password, role, status
        FROM users
        WHERE username = ? AND role = 'admin'
    ");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        sendError('用戶名或密碼錯誤', 401);
    }
    
    if ($user['status'] !== 'active') {
        sendError('帳號已被停用', 403);
    }
    
    if (!password_verify($password, $user['password'])) {
        sendError('用戶名或密碼錯誤', 401);
    }
    
    // 建立 session
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    
    // 準備回應資料
    $response = [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role']
    ];
    
    sendResponse($response, 200, '登入成功');
}

// 處理登出
function handleLogout() {
    session_start();
    session_destroy();
    sendResponse([], 200, '登出成功');
}

// 檢查 session 狀態
function handleCheckSession() {
    session_start();
    
    if (isset($_SESSION['user_id']) && isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
        $response = [
            'logged_in' => true,
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role']
        ];
        sendResponse($response, 200, 'Session 有效');
    } else {
        sendResponse(['logged_in' => false], 401, 'Session 無效');
    }
}

// 驗證必填欄位
function validateRequired($data, $required_fields) {
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendError("缺少必填欄位: $field", 400);
        }
    }
}

// 注意：sanitizeInput、sendResponse 和 sendError 函數已在 config.php 中定義
?>

