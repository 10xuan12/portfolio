<?php
/**
 * 聯絡表單 API
 * 處理訪客的聯絡訊息
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 預檢請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 只接受 POST 請求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('只允許 POST 請求', 405);
}

try {
    // 解析 JSON 輸入
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendError('無效的請求資料', 400);
    }
    
    // 驗證必填欄位
    $name = sanitizeInput($input['name'] ?? '');
    $email = sanitizeInput($input['email'] ?? '');
    $message = sanitizeInput($input['message'] ?? '');
    
    if (empty($name)) {
        sendError('請輸入您的姓名', 400);
    }
    
    if (empty($email)) {
        sendError('請輸入您的電子郵件', 400);
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('請輸入有效的電子郵件地址', 400);
    }
    
    if (empty($message)) {
        sendError('請輸入您的訊息', 400);
    }
    
    // 訊息長度限制
    if (strlen($message) > 2000) {
        sendError('訊息內容不能超過 2000 字', 400);
    }
    
    // 檢查資料表是否存在，如果不存在則建立
    createContactMessagesTableIfNotExists();
    
    // 儲存訊息到資料庫
    $stmt = $conn->prepare("
        INSERT INTO contact_messages (name, email, message, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $stmt->bind_param("sssss", $name, $email, $message, $ipAddress, $userAgent);
    
    if ($stmt->execute()) {
        $messageId = $stmt->insert_id;
        
        // 可選：發送郵件通知（需要配置郵件服務）
        // sendEmailNotification($name, $email, $message);
        
        sendResponse([
            'message_id' => $messageId,
            'message' => '感謝您的訊息！我們會盡快回覆您。'
        ], 200, '訊息發送成功');
    } else {
        throw new Exception('訊息儲存失敗');
    }
    
} catch (Exception $e) {
    debugLog("聯絡表單錯誤: " . $e->getMessage());
    sendError('訊息發送失敗，請稍後再試', 500);
}

/**
 * 建立聯絡訊息資料表（如果不存在）
 */
function createContactMessagesTableIfNotExists() {
    global $conn;
    
    $sql = "
    CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
        created_at DATETIME NOT NULL,
        read_at DATETIME NULL,
        replied_at DATETIME NULL,
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $conn->query($sql);
}

/**
 * 發送郵件通知（可選功能）
 * 需要配置 SMTP 設定才能使用
 */
function sendEmailNotification($name, $email, $message) {
    // 這裡可以整合郵件服務，例如 PHPMailer
    // 暫時不實作，可以之後添加
}
?>

