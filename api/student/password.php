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

// 密碼管理 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'change_password':
                    changePassword($input);
                    break;
                case 'reset_password':
                    resetPassword($input);
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

// 修改密碼
function changePassword($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    // 驗證必填欄位
    validateRequired($data, ['current_password', 'new_password']);
    
    $currentPassword = $data['current_password'];
    $newPassword = $data['new_password'];
    
    // 驗證新密碼長度
    if (strlen($newPassword) < 8) {
        sendError('新密碼至少需要 8 個字元', 400);
    }
    
    // 驗證新密碼強度
    if (!validatePasswordStrength($newPassword)) {
        sendError('密碼強度不足，建議包含大小寫字母、數字和特殊符號', 400);
    }
    
    // 檢查新密碼是否與目前密碼相同
    if ($currentPassword === $newPassword) {
        sendError('新密碼不能與目前密碼相同', 400);
    }
    
    try {
        // 取得目前密碼雜湊
        $stmt = $GLOBALS['conn']->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        if (!$user) {
            sendError('使用者不存在', 404);
        }
        
        // 驗證目前密碼
        if (!password_verify($currentPassword, $user['password_hash'])) {
            sendError('目前密碼錯誤', 400);
        }
        
        // 產生新密碼雜湊
        $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        
        // 更新密碼
        $stmt = $GLOBALS['conn']->prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->bind_param("si", $newPasswordHash, $userId);
        
        if ($stmt->execute()) {
            // 記錄密碼變更活動
            logPasswordChange($userId);
            
            sendResponse(['message' => '密碼修改成功'], 200, '密碼已成功修改');
        } else {
            sendError('密碼更新失敗', 500);
        }
        
    } catch (Exception $e) {
        sendError('密碼修改失敗: ' . $e->getMessage(), 500);
    }
}

// 重置密碼（忘記密碼功能）
function resetPassword($data) {
    // 驗證必填欄位
    validateRequired($data, ['email']);
    
    $email = sanitizeInput($data['email']);
    
    // 驗證電子郵件格式
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('無效的電子郵件格式', 400);
    }
    
    try {
        // 檢查使用者是否存在
        $stmt = $GLOBALS['conn']->prepare("SELECT id, username FROM users WHERE email = ? AND role = 'student'");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        if (!$user) {
            sendError('找不到該電子郵件的使用者帳號', 404);
        }
        
        // 產生重置密碼的 token
        $resetToken = bin2hex(random_bytes(32));
        $resetExpiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // 儲存重置 token（這裡需要建立 password_resets 表格）
        $stmt = $GLOBALS['conn']->prepare(
            "INSERT INTO password_resets (user_id, token, expires_at) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)"
        );
        $stmt->bind_param("iss", $user['id'], $resetToken, $resetExpiry);
        $stmt->execute();
        
        // 發送重置密碼電子郵件
        $resetLink = "https://yourdomain.com/reset-password?token=" . $resetToken;
        $emailSent = sendPasswordResetEmail($email, $user['username'], $resetLink);
        
        if ($emailSent) {
            sendResponse(['message' => '密碼重置連結已發送到您的電子郵件'], 200, '重置連結已發送');
        } else {
            sendError('無法發送重置電子郵件，請稍後再試', 500);
        }
        
    } catch (Exception $e) {
        sendError('密碼重置失敗: ' . $e->getMessage(), 500);
    }
}

// 驗證密碼強度
function validatePasswordStrength($password) {
    // 至少包含一個小寫字母
    if (!preg_match('/[a-z]/', $password)) {
        return false;
    }
    
    // 至少包含一個大寫字母
    if (!preg_match('/[A-Z]/', $password)) {
        return false;
    }
    
    // 至少包含一個數字
    if (!preg_match('/\d/', $password)) {
        return false;
    }
    
    // 至少包含一個特殊符號
    if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/', $password)) {
        return false;
    }
    
    return true;
}

// 記錄密碼變更活動
function logPasswordChange($userId) {
    try {
        $stmt = $GLOBALS['conn']->prepare(
            "INSERT INTO user_activities (user_id, type, description, metadata) 
             VALUES (?, 'password_change', '密碼已修改', ?)"
        );
        $metadata = json_encode(['timestamp' => date('Y-m-d H:i:s')]);
        $stmt->bind_param("is", $userId, $metadata);
        $stmt->execute();
    } catch (Exception $e) {
        // 記錄失敗不影響主要功能
        error_log('Failed to log password change: ' . $e->getMessage());
    }
}

// 發送密碼重置電子郵件
function sendPasswordResetEmail($email, $username, $resetLink) {
    // 這裡應該實作實際的電子郵件發送功能
    // 可以使用 PHPMailer 或其他電子郵件函式庫
    
    $subject = '密碼重置請求 - Portfolio+';
    $message = "
    <html>
    <body>
        <h2>密碼重置請求</h2>
        <p>親愛的 {$username}，</p>
        <p>我們收到了您的密碼重置請求。請點擊以下連結來重置您的密碼：</p>
        <p><a href='{$resetLink}'>{$resetLink}</a></p>
        <p>此連結將在 1 小時後失效。</p>
        <p>如果您沒有請求重置密碼，請忽略此電子郵件。</p>
        <p>謝謝！<br>Portfolio+ 團隊</p>
    </body>
    </html>
    ";
    
    // 這裡應該實作實際的電子郵件發送
    // 目前返回 true 表示發送成功
    return true;
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
