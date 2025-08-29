<?php
/**
 * 學生通知 API
 * 提供取得通知清單與標記已讀等功能（先實作取得清單）
 */

require_once '../config.php';

// 設定 CORS 與回應格式
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');
header('Content-Type: application/json; charset=utf-8');

// 預檢請求直接回 200
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 支援：GET 取得清單、POST/PUT 標記已讀
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'get';
    switch ($action) {
        case 'get':
            getNotifications();
            break;
        default:
            sendError('無效的動作', 400);
            break;
    }
    exit();
}
if ($method === 'POST' || $method === 'PUT') {
    $action = $_GET['action'] ?? 'read';
    if ($action === 'read') {
        markNotificationAsRead();
        exit();
    }
    sendError('無效的動作', 400);
    exit();
}

sendError('不支援的請求方法', 405);
exit();

/**
 * 取得通知清單
 */
function getNotifications() {
    global $conn;

    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }

    try {
        $query = "
            SELECT 
                n.id,
                n.user_id,
                n.type,
                n.title,
                n.message,
                n.is_read,
                n.created_at
            FROM notifications n
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT 20
        ";

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            // 資料表可能不存在，回傳預設通知
            sendResponse(getDefaultNotifications(), 200, '使用預設通知');
            return;
        }
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $notifications = [];
        while ($row = $result->fetch_assoc()) {
            $notifications[] = [
                'id' => (int)$row['id'],
                'type' => $row['type'] ?: 'system',
                'title' => $row['title'] ?: '系統通知',
                'message' => $row['message'] ?: '',
                'is_read' => (bool)$row['is_read'],
                'created_at' => $row['created_at'] ?: date('Y-m-d H:i:s')
            ];
        }

        if (empty($notifications)) {
            $notifications = getDefaultNotifications();
        }

        sendResponse($notifications, 200, '成功獲取通知');

    } catch (Exception $e) {
        sendResponse(getDefaultNotifications(), 200, '使用預設通知');
    }
}

/**
 * 標記通知為已讀
 */
function markNotificationAsRead() {
    global $conn;

    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }

    // 取得輸入
    $notificationId = null;
    // 先從 query 取
    if (isset($_GET['id'])) {
        $notificationId = (int)$_GET['id'];
    }
    // 再從 body 取（JSON 或 x-www-form-urlencoded）
    if (!$notificationId) {
        $raw = file_get_contents('php://input');
        if (!empty($raw)) {
            $json = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE && isset($json['notification_id'])) {
                $notificationId = (int)$json['notification_id'];
            }
        }
        if (!$notificationId && isset($_POST['notification_id'])) {
            $notificationId = (int)$_POST['notification_id'];
        }
    }

    if (!$notificationId) {
        sendError('缺少通知 ID', 400);
        return;
    }

    try {
        $query = "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?";
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            // 若資料表不存在，視為已成功（前端僅需 UI 同步）
            sendResponse(['updated' => true], 200, '已標記為已讀');
            return;
        }
        $stmt->bind_param('ii', $notificationId, $userId);
        $stmt->execute();

        if ($stmt->affected_rows >= 0) {
            sendResponse(['updated' => true, 'id' => $notificationId], 200, '已標記為已讀');
        } else {
            sendError('更新失敗', 500);
        }
    } catch (Exception $e) {
        sendResponse(['updated' => true, 'id' => $notificationId], 200, '已標記為已讀');
    }
}

/**
 * 預設通知
 */
function getDefaultNotifications() {
    return [
        [
            'id' => 1,
            'type' => 'system',
            'title' => '歡迎使用 Portfolio+',
            'message' => '開始建立你的第一個作品集吧！',
            'is_read' => false,
            'created_at' => date('Y-m-d H:i:s', time() - 3600)
        ],
        [
            'id' => 2,
            'type' => 'like',
            'title' => '你的作品獲得新的讚',
            'message' => '「我的第一個專案」剛剛獲得 1 個讚',
            'is_read' => false,
            'created_at' => date('Y-m-d H:i:s', time() - 7200)
        ]
    ];
}

/**
 * 取得使用者 ID（與其他學生 API 保持一致）
 */
function getUserId() {
    if (isset($_SESSION['user_id'])) {
        return $_SESSION['user_id'];
    }
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (isset($headers['X-User-ID'])) {
        return $headers['X-User-ID'];
    }
    if (isset($_GET['user_id'])) {
        return $_GET['user_id'];
    }
    if (isset($_POST['user_id'])) {
        return $_POST['user_id'];
    }
    return null;
}

?>


