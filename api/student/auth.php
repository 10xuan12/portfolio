<?php
require_once '../config.php';

// 學生認證 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'login':
                    handleLogin($input);
                    break;
                case 'register':
                    handleRegister($input);
                    break;
                case 'logout':
                    handleLogout();
                    break;
                case 'refresh':
                    handleRefreshToken($input);
                    break;
                default:
                    sendApiError('無效的操作', 400, 'INVALID_ACTION');
            }
        } else {
            sendApiError('缺少操作類型', 400, 'MISSING_ACTION');
        }
        break;
        
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'check') {
            checkAuthStatus();
        } else {
            sendError('無效的請求', 400);
        }
        break;
        
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 處理登入
function handleLogin($data) {
    validateRequired($data, ['username', 'password']);
    
    $username = sanitizeInput($data['username']);
    $password = $data['password'];
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT u.id, u.username, u.email, u.password_hash, u.role, u.status,
               sp.first_name, sp.last_name, sp.display_name, sp.avatar_url
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.username = ? AND u.role = 'student'
    ");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        sendApiError('使用者名稱或密碼錯誤', 401, 'INVALID_CREDENTIALS');
    }
    
    if ($user['status'] !== 'active') {
        sendApiError('帳號已被停用', 403, 'ACCOUNT_DISABLED');
    }
    
    if (!password_verify($password, $user['password_hash'])) {
        sendApiError('使用者名稱或密碼錯誤', 401, 'INVALID_CREDENTIALS');
    }
    
    // 建立 session（向後兼容）
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    
    // 生成JWT Token
    $jwtToken = generateJWTToken($user['id'], [
        'username' => $user['username'],
        'role' => $user['role'],
        'email' => $user['email']
    ]);
    
    // 準備回應資料
    $response = [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'display_name' => $user['display_name'] ?: $user['username'],
        'avatar_url' => $user['avatar_url'],
        'token' => $jwtToken,
        'token_type' => 'Bearer',
        'expires_in' => 3600
    ];
    
    // 檢查並授予徽章
    require_once '../badge-manager.php';
    $awardedBadges = checkAndAwardBadges($user['id']);
    if (!empty($awardedBadges)) {
        $response['new_badges'] = $awardedBadges;
    }
    
    sendApiResponse($response, 200, '登入成功');
}

// 處理註冊
function handleRegister($data) {
    validateRequired($data, ['username', 'email', 'password', 'first_name', 'last_name']);
    
    $username = sanitizeInput($data['username']);
    $email = sanitizeInput($data['email']);
    $password = $data['password'];
    $firstName = sanitizeInput($data['first_name']);
    $lastName = sanitizeInput($data['last_name']);
    
    // 可選欄位
    $major = isset($data['department']) ? sanitizeInput($data['department']) : ''; // 使用 department 作為 major
    $grade = isset($data['grade']) ? sanitizeInput($data['grade']) : '';
    $phone = isset($data['phone']) ? sanitizeInput($data['phone']) : '';
    $address = isset($data['address']) ? sanitizeInput($data['address']) : '';
    
    // 驗證密碼強度
    if (strlen($password) < 6) {
        sendError('密碼長度至少需要 6 個字元', 400);
    }
    
    // 驗證電子郵件格式
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('無效的電子郵件格式', 400);
    }
    
    // 檢查使用者名稱是否已存在
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        sendError('使用者名稱已存在', 400);
    }
    
    // 檢查電子郵件是否已存在
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        sendError('電子郵件已被使用', 400);
    }
    
    // 開始交易
    $GLOBALS['conn']->begin_transaction();
    
    try {
        // 建立使用者帳號
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $GLOBALS['conn']->prepare("
            INSERT INTO users (username, email, password_hash, role) 
            VALUES (?, ?, ?, 'student')
        ");
        $stmt->bind_param("sss", $username, $email, $passwordHash);
        $stmt->execute();
        $userId = $GLOBALS['conn']->insert_id;
        
        // 建立學生資料
        $stmt = $GLOBALS['conn']->prepare("
            INSERT INTO student_profiles (user_id, first_name, last_name, display_name, major, grade, phone, address) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $displayName = $firstName . ' ' . $lastName;
        $stmt->bind_param("isssssss", $userId, $firstName, $lastName, $displayName, $major, $grade, $phone, $address);
        $stmt->execute();
        
        // 授予首次登入徽章
        require_once '../badge-manager.php';
        $badgeManager = new BadgeManager($GLOBALS['conn']);
        $badgeManager->awardBadge($userId, 1, '初次登入'); // badge_id = 1 是初次登入徽章
        
        $GLOBALS['conn']->commit();
        
        sendResponse([
            'user_id' => $userId,
            'username' => $username,
            'message' => '註冊成功',
            'new_badge' => '初次登入'
        ], 201, '註冊成功');
        
    } catch (Exception $e) {
        $GLOBALS['conn']->rollback();
        sendError('註冊: ' . $e->getMessage(), 500);
    }
}

// 處理登出
function handleLogout() {
    session_start();
    session_destroy();
    sendResponse(null, 200, '登出成功');
}

// 處理Token刷新
function handleRefreshToken($data) {
    if (!isset($data['token'])) {
        sendApiError('缺少Token', 400, 'MISSING_TOKEN');
    }
    
    try {
        $newToken = refreshJWTToken($data['token']);
        
        sendApiResponse([
            'token' => $newToken,
            'token_type' => 'Bearer',
            'expires_in' => 3600
        ], 200, 'Token刷新成功');
        
    } catch (Exception $e) {
        sendApiError('Token刷新失敗: ' . $e->getMessage(), 401, 'REFRESH_FAILED');
    }
}

// 檢查認證狀態
function checkAuthStatus() {
    session_start();
    
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['authenticated' => false], 200);
    }
    
    $userId = $_SESSION['user_id'];
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT u.id, u.username, u.email, u.role, u.status,
               sp.first_name, sp.last_name, sp.display_name, sp.avatar_url
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.id = ?
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        session_destroy();
        sendResponse(['authenticated' => false], 200);
    }
    
    $response = [
        'authenticated' => true,
        'user_id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'display_name' => $user['display_name'] ?: $user['username'],
        'avatar_url' => $user['avatar_url']
    ];
    
    sendResponse($response, 200);
}
?>
