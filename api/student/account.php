<?php
require_once '../config.php';

// 設定 CORS 與回應格式
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');
header('Content-Type: application/json; charset=utf-8');

// 預檢請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('不支援的 HTTP 方法', 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $input['action'] ?? '';

switch ($action) {
    case 'deactivate':
        deactivateAccount();
        break;
    case 'delete':
        deleteAccount($input);
        break;
    default:
        sendError('無效的操作', 400);
}

// 停用帳號：將使用者狀態設為 inactive
function deactivateAccount() {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }

    try {
        $stmt = $GLOBALS['conn']->prepare("UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        if (!$stmt) {
            sendError('資料庫錯誤', 500);
        }
        $stmt->bind_param('i', $userId);
        if ($stmt->execute()) {
            sendResponse(['message' => '帳號已停用'], 200, '成功');
        } else {
            sendError('停用失敗', 500);
        }
    } catch (Exception $e) {
        sendError('停用失敗: ' . $e->getMessage(), 500);
    }
}

// 刪除帳號：驗證密碼後，刪除關聯資料與使用者
function deleteAccount($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }

    if (!isset($data['password']) || trim($data['password']) === '') {
        sendError('缺少必填欄位: password', 400);
    }

    $password = $data['password'];

    try {
        // 先驗證密碼
        $stmt = $GLOBALS['conn']->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            sendError('密碼不正確', 400);
        }

        $GLOBALS['conn']->begin_transaction();

        // 依序刪除可能的關聯資料（各表不存在時將由 prepare 回傳 false，忽略即可）
        $tables = [
            // 互動與內容
            ['sql' => 'DELETE FROM portfolio_likes WHERE user_id = ?', 'type' => 'i'],
            ['sql' => 'DELETE FROM portfolio_comments WHERE user_id = ?', 'type' => 'i'],
            ['sql' => 'DELETE FROM portfolio_files WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = ?)', 'type' => 'i'],
            ['sql' => 'DELETE FROM portfolios WHERE user_id = ?', 'type' => 'i'],
            // 個人資料與社群
            ['sql' => 'DELETE FROM user_social_media WHERE user_id = ?', 'type' => 'i'],
            ['sql' => 'DELETE FROM student_profiles WHERE user_id = ?', 'type' => 'i'],
            // 徽章與活動
            ['sql' => 'DELETE FROM user_badges WHERE user_id = ?', 'type' => 'i'],
            ['sql' => 'DELETE FROM user_activities WHERE user_id = ?', 'type' => 'i'],
            // 通知（如有）
            ['sql' => 'DELETE FROM notifications WHERE user_id = ?', 'type' => 'i']
        ];

        foreach ($tables as $job) {
            $stmt = $GLOBALS['conn']->prepare($job['sql']);
            if ($stmt) {
                $stmt->bind_param($job['type'], $userId);
                $stmt->execute();
            }
        }

        // 最後刪除使用者
        $stmt = $GLOBALS['conn']->prepare('DELETE FROM users WHERE id = ?');
        if (!$stmt) {
            throw new Exception('刪除使用者失敗');
        }
        $stmt->bind_param('i', $userId);
        $stmt->execute();

        $GLOBALS['conn']->commit();
        sendResponse(['message' => '帳號已刪除'], 200, '成功');
    } catch (Exception $e) {
        $GLOBALS['conn']->rollback();
        sendError('刪除失敗: ' . $e->getMessage(), 500);
    }
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

?>

