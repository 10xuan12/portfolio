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
	case 'password_reset_request':
		handlePasswordResetRequest($input);
		break;
	case 'password_reset_confirm':
		handlePasswordResetConfirm($input);
		break;
	default:
		sendError('缺少操作類型', 400);
}

// 處理登入
function handleLogin($data) {
	validateRequired($data, ['username', 'password']);
	
	$username = sanitizeInput($data['username']);
	$password = $data['password'];
	
	$stmt = $GLOBALS['conn']->prepare("SELECT id, username, email, password_hash, role, status FROM users WHERE username = ? AND role = 'admin'");
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
	
	if (!password_verify($password, $user['password_hash'])) {
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

// 發送管理員密碼重設請求（示意：寫入 password_resets 並回傳）
function handlePasswordResetRequest($data) {
	if (!isset($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
		sendError('請提供有效的電子郵件', 400);
	}
	$email = sanitizeInput($data['email']);

	// 確認管理員存在
	$stmt = $GLOBALS['conn']->prepare("SELECT id FROM users WHERE email = ? AND role = 'admin' LIMIT 1");
	$stmt->bind_param('s', $email);
	$stmt->execute();
	$res = $stmt->get_result();
	$user = $res->fetch_assoc();
	if (!$user) {
		// 為避免暴露帳號狀態，仍回 200
		sendResponse([], 200, '如果信箱存在，將寄送重設指示');
	}

	// 產生 token 並寫入 password_resets
	$token = bin2hex(random_bytes(16));
	$expires = date('Y-m-d H:i:s', time() + 3600);
	$ins = $GLOBALS['conn']->prepare("INSERT INTO password_resets (user_id, token, expires_at, used) VALUES (?, ?, ?, 0)");
	$ins->bind_param('iss', $user['id'], $token, $expires);
	$ins->execute();

	// 此處可整合寄信；先直接返回 token 供測試
	sendResponse(['token' => $token, 'expires_at' => $expires], 200, '如果信箱存在，將寄送重設指示');
}

// 確認重設密碼
function handlePasswordResetConfirm($data) {
	if (!isset($data['token']) || !isset($data['new_password'])) {
		sendError('缺少必要參數', 400);
	}
	$token = sanitizeInput($data['token']);
	$newPassword = $data['new_password'];
	if (strlen($newPassword) < 6) {
		sendError('密碼至少 6 碼', 400);
	}

	// 取得 token 記錄
	$stmt = $GLOBALS['conn']->prepare("SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ? LIMIT 1");
	$stmt->bind_param('s', $token);
	$stmt->execute();
	$res = $stmt->get_result();
	$row = $res->fetch_assoc();
	if (!$row) sendError('重設連結無效', 400);
	if ((int)$row['used'] === 1) sendError('重設連結已使用', 400);
	if (strtotime($row['expires_at']) < time()) sendError('重設連結已過期', 400);

	// 確認是 admin 帳戶
	$chk = $GLOBALS['conn']->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
	$chk->bind_param('i', $row['user_id']);
	$chk->execute();
	$roleRes = $chk->get_result()->fetch_assoc();
	if (!$roleRes || $roleRes['role'] !== 'admin') sendError('帳號類型不符', 400);

	// 更新密碼
	$hash = password_hash($newPassword, PASSWORD_DEFAULT);
	$up = $GLOBALS['conn']->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
	$up->bind_param('si', $hash, $row['user_id']);
	$up->execute();

	// 標記 token 已使用
	$upd = $GLOBALS['conn']->prepare("UPDATE password_resets SET used = 1 WHERE id = ?");
	$upd->bind_param('i', $row['id']);
	$upd->execute();

	sendResponse([], 200, '密碼已更新');
}

// 證明必填欄位
function validateRequired($data, $required_fields) {
	foreach ($required_fields as $field) {
		if (!isset($data[$field]) || empty($data[$field])) {
			sendError("缺少必填欄位: $field", 400);
		}
	}
}

// 注意：sanitizeInput、sendResponse 和 sendError 函數已在 config.php 中定義
?>

