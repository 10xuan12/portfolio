<?php
require_once '../config.php';

// 企業認證 API
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
                case 'password_reset_request':
                    handlePasswordResetRequest($input);
                    break;
                default:
                    sendError('無效的操作', 400);
            }
        } else {
            sendError('缺少操作類型', 400);
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
    // 支援用戶名或電子郵件登入
    if (isset($data['email'])) {
        validateRequired($data, ['email', 'password']);
        $email = sanitizeInput($data['email']);
        $password = $data['password'];
        
        $stmt = $GLOBALS['conn']->prepare("
            SELECT u.id, u.username, u.email, u.password_hash, u.role, u.status,
                   ep.company_name, ep.logo_url
            FROM users u
            LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
            WHERE u.email = ? AND u.role = 'enterprise'
        ");
        $stmt->bind_param("s", $email);
    } else {
        validateRequired($data, ['username', 'password']);
        $username = sanitizeInput($data['username']);
        $password = $data['password'];
        
        $stmt = $GLOBALS['conn']->prepare("
            SELECT u.id, u.username, u.email, u.password_hash, u.role, u.status,
                   ep.company_name, ep.logo_url
            FROM users u
            LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
            WHERE u.username = ? AND u.role = 'enterprise'
        ");
        $stmt->bind_param("s", $username);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        sendError('電子郵件或密碼錯誤', 401);
    }
    
    if (!password_verify($password, $user['password_hash'])) {
        sendError('電子郵件或密碼錯誤', 401);
    }
    
    // 檢查帳號狀態
    if ($user['status'] === 'pending') {
        sendError('您的帳號正在審核中，請等待管理員審核通過', 403);
    }
    
    if ($user['status'] !== 'active') {
        sendError('帳號已被停用或拒絕', 403);
    }
    
    // 建立 session
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    
    // 更新最後登入時間
    $updateStmt = $GLOBALS['conn']->prepare("
        UPDATE enterprise_profiles 
        SET updated_at = NOW() 
        WHERE user_id = ?
    ");
    $updateStmt->bind_param("i", $user['id']);
    $updateStmt->execute();
    
    // 準備回應資料
    $response = [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'company_name' => $user['company_name'] ?: '未設定公司名稱',
        'logo_url' => $user['logo_url']
    ];
    
    sendResponse($response, 200, '登入成功');
}

// 處理註冊
function handleRegister($data) {
    validateRequired($data, ['username', 'email', 'password', 'company_name']);
    
    $username = sanitizeInput($data['username']);
    $email = sanitizeInput($data['email']);
    $password = $data['password'];
    $companyName = sanitizeInput($data['company_name']);
    $contactPerson = isset($data['contact_person']) ? sanitizeInput($data['contact_person']) : '';
    $phone = isset($data['phone']) ? sanitizeInput($data['phone']) : '';
    $address = isset($data['address']) ? sanitizeInput($data['address']) : '';
    $industry = isset($data['industry']) ? sanitizeInput($data['industry']) : '';
    $companySize = isset($data['company_size']) ? sanitizeInput($data['company_size']) : '';
    $description = isset($data['description']) ? sanitizeInput($data['description']) : '';
    
    // 檢查使用者名稱是否已存在
    $checkStmt = $GLOBALS['conn']->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $checkStmt->bind_param("ss", $username, $email);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows > 0) {
        sendError('使用者名稱或電子郵件已存在', 400);
    }
    
    // 密碼驗證
    if (strlen($password) < 6) {
        sendError('密碼長度至少需要6個字元', 400);
    }
    
    // 開始交易
    $GLOBALS['conn']->begin_transaction();
    
    try {
        // 建立使用者帳號（預設狀態為待審核）
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $userStmt = $GLOBALS['conn']->prepare("
            INSERT INTO users (username, email, password_hash, role, status) 
            VALUES (?, ?, ?, 'enterprise', 'pending')
        ");
        $userStmt->bind_param("sss", $username, $email, $passwordHash);
        $userStmt->execute();
        $userId = $GLOBALS['conn']->insert_id;
        
        // 建立企業資料
        $profileStmt = $GLOBALS['conn']->prepare("
            INSERT INTO enterprise_profiles (
                user_id, company_name, contact_person, phone, address, 
                industry, company_size, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $profileStmt->bind_param("isssssss", 
            $userId, $companyName, $contactPerson, $phone, $address, 
            $industry, $companySize, $description
        );
        $profileStmt->execute();
        
        $GLOBALS['conn']->commit();
        
        // 準備回應資料（註冊後需等待審核，不自動登入）
        $response = [
            'user_id' => $userId,
            'username' => $username,
            'email' => $email,
            'role' => 'enterprise',
            'company_name' => $companyName,
            'contact_person' => $contactPerson,
            'status' => 'pending',
            'message' => '註冊成功，您的帳號正在審核中，審核通過後將發送通知。'
        ];
        
        sendResponse($response, 201, '註冊成功，請等待管理員審核');
        
    } catch (Exception $e) {
        $GLOBALS['conn']->rollback();
        sendError('註冊失敗：' . $e->getMessage(), 500);
    }
}

// 處理登出
function handleLogout() {
    session_start();
    session_destroy();
    sendResponse([], 200, '登出成功');
}

// 發送企業密碼重設請求（示意：寫入 password_resets 並回傳）
function handlePasswordResetRequest($data) {
    if (!isset($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        sendError('請提供有效的電子郵件', 400);
    }
    $email = sanitizeInput($data['email']);

    // 確認企業用戶存在
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM users WHERE email = ? AND role = 'enterprise' LIMIT 1");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $user = $res->fetch_assoc();
    if (!$user) {
        sendResponse([], 200, '如果信箱存在，將寄送重設指示');
    }

    // 產生 token 並寫入 password_resets
    $token = bin2hex(random_bytes(16));
    $expires = date('Y-m-d H:i:s', time() + 3600);
    $ins = $GLOBALS['conn']->prepare("INSERT INTO password_resets (user_id, token, expires_at, used) VALUES (?, ?, ?, 0)");
    $ins->bind_param('iss', $user['id'], $token, $expires);
    $ins->execute();

    sendResponse(['token' => $token, 'expires_at' => $expires], 200, '如果信箱存在，將寄送重設指示');
}

// 檢查認證狀態
function checkAuthStatus() {
    session_start();
    
    if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'enterprise') {
        sendError('未登入或權限不足', 401);
    }
    
    $userId = $_SESSION['user_id'];
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT u.id, u.username, u.email, u.role, u.status,
               ep.company_name, ep.logo_url, ep.contact_person
        FROM users u
        LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
        WHERE u.id = ? AND u.role = 'enterprise'
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        sendError('使用者不存在', 404);
    }
    
    if ($user['status'] !== 'active') {
        sendError('帳號已被停用', 403);
    }
    
    $response = [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'company_name' => $user['company_name'] ?: '未設定公司名稱',
        'contact_person' => $user['contact_person'] ?: '',
        'logo_url' => $user['logo_url']
    ];
    
    sendResponse($response, 200, '認證有效');
}
