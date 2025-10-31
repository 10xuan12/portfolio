<?php
/**
 * 聯絡表單 API
 * 處理訪客的聯絡訊息並發送Email
 */

require_once 'config.php';
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// 載入環境變數（如果 .env 檔案存在）
if (class_exists('Dotenv\Dotenv')) {
    $dotenvPath = __DIR__ . '/..';
    if (file_exists($dotenvPath . '/.env')) {
        $dotenv = Dotenv\Dotenv::createImmutable($dotenvPath);
        $dotenv->load();
    }
}

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
        
        // 發送郵件通知
        $emailSent = sendEmailNotification($name, $email, $message);
        
        if ($emailSent) {
            sendResponse([
                'message_id' => $messageId,
                'message' => '感謝您的訊息！我們已收到您的來信，會盡快回覆您。'
            ], 200, '訊息發送成功');
        } else {
            // 即使郵件發送失敗，訊息已儲存到資料庫
            sendResponse([
                'message_id' => $messageId,
                'message' => '感謝您的訊息！我們已收到您的來信。'
            ], 200, '訊息已收到');
        }
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
 * 發送郵件通知
 * 使用 PHPMailer 發送郵件到指定的信箱
 */
function sendEmailNotification($name, $email, $message) {
    try {
        $mail = new PHPMailer(true);
        
        // SMTP 設定
        $mail->isSMTP();
        $mail->CharSet = 'UTF-8';
        $mail->Timeout = 10; // 設定 10 秒超時
        $mail->SMTPDebug = 0; // 關閉除錯模式以提升速度
        
        // Gmail SMTP 設定（如果使用 Gmail）
        // 您需要在 Gmail 設定中啟用「應用程式密碼」
        $mail->Host       = $_ENV['SMTP_HOST'] ?? getenv('SMTP_HOST') ?? 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = $_ENV['SMTP_USERNAME'] ?? getenv('SMTP_USERNAME') ?? 'portfolioplus2025@gmail.com';
        $mail->Password   = $_ENV['SMTP_PASSWORD'] ?? getenv('SMTP_PASSWORD') ?? 'zhdp nvtc aqzq hwuu'; // 請在 .env 設定
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $_ENV['SMTP_PORT'] ?? getenv('SMTP_PORT') ?? 587;
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );
        
        // 發件人資訊
        $fromEmail = $_ENV['SMTP_USERNAME'] ?? getenv('SMTP_USERNAME') ?? 'portfolioplus2025@gmail.com';
        $mail->setFrom($fromEmail, 'Portfolio Plus 聯絡表單');
        $mail->addReplyTo($email, $name);
        
        // 收件人（您的專屬電子郵件）
        $receiverEmail = $_ENV['CONTACT_EMAIL'] ?? getenv('CONTACT_EMAIL') ?? 'portfolioplus2025@gmail.com';
        $mail->addAddress($receiverEmail, 'Portfolio Plus');
        
        // 郵件內容
        $mail->isHTML(true);
        $mail->Subject = '【Portfolio Plus】新的聯絡訊息 - ' . $name;
        
        $htmlBody = "
        <html>
        <head>
            <style>
                body { font-family: Arial, '微軟正黑體', sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; }
                .header { background-color:rgb(26, 90, 154); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #ffffff; padding: 20px; border: 1px solid #e3f2fd; }
                .info-row { margin: 10px 0; padding: 10px; background: #f5f9ff; border-radius: 4px; border: 1px solid #e3f2fd; }
                .label { font-weight: bold; color:rgb(26, 90, 154); }
                .message-box { background: #f5f9ff; padding: 15px; margin-top: 15px; border-left: 4px solid #1976d2; border-radius: 4px; }
                .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; background-color: #f5f9ff; border-radius: 0 0 8px 8px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2 style='margin: 0;'>📧 新的聯絡訊息</h2>
                </div>
                <div class='content'>
                    <div class='info-row'>
                        <span class='label'>姓名：</span> {$name}
                    </div>
                    <div class='info-row'>
                        <span class='label'>電子郵件：</span> {$email}
                    </div>
                    <div class='message-box'>
                        <div class='label'>訊息內容：</div>
                        <p>" . nl2br(htmlspecialchars($message)) . "</p>
                    </div>
                    <div class='info-row' style='font-size: 12px; color: #666;'>
                        <span class='label'>收到時間：</span> " . date('Y-m-d H:i:s') . "
                    </div>
                </div>
                <div class='footer'>
                    此郵件由 Portfolio Plus 聯絡表單自動發送<br>
                    請直接回覆此郵件以聯繫來信者
                </div>
            </div>
        </body>
        </html>
        ";
        
        $mail->Body = $htmlBody;
        
        // 純文字版本（作為備用）
        $mail->AltBody = "新的聯絡訊息\n\n" .
                        "姓名：{$name}\n" .
                        "電子郵件：{$email}\n\n" .
                        "訊息內容：\n{$message}\n\n" .
                        "收到時間：" . date('Y-m-d H:i:s');
        
        $mail->send();
        return true;
        
    } catch (Exception $e) {
        debugLog("郵件發送失敗: " . $mail->ErrorInfo);
        return false;
    }
}
?>

