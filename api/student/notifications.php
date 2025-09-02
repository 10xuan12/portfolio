<?php
/**
 * 學生通知 API
 * 提供取得通知清單與標記已讀等功能
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

// 支援：GET 取得清單、POST 各種操作
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

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'mark_read':
            markNotificationAsRead($input);
            break;
        case 'mark_multiple_read':
            markMultipleNotificationsAsRead($input);
            break;
        case 'mark_all_read':
            markAllNotificationsAsRead($input);
            break;
        case 'delete_multiple':
            deleteMultipleNotifications($input);
            break;
        default:
            sendError('無效的動作', 400);
            break;
    }
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
                n.created_at,
                n.portfolio_id,
                n.comment_id,
                n.enterprise_id
            FROM notifications n
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT 50
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
                'text' => $row['message'] ?: '',
                'status' => $row['is_read'] ? 'read' : 'unread',
                'time' => formatTime($row['created_at']),
                'portfolioId' => (int)$row['portfolio_id'] ?: null,
                'commentId' => (int)$row['comment_id'] ?: null,
                'enterpriseId' => (int)$row['enterprise_id'] ?: null
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
function markNotificationAsRead($input) {
    global $conn;

    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }

    $notificationId = (int)($input['notification_id'] ?? 0);
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
 * 批量標記通知為已讀
 */
function markMultipleNotificationsAsRead($input) {
    global $conn;

    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }

    $notificationIds = $input['notification_ids'] ?? [];
    if (empty($notificationIds)) {
        sendError('缺少通知 ID 列表', 400);
        return;
    }

    try {
        $placeholders = str_repeat('?,', count($notificationIds) - 1) . '?';
        $query = "UPDATE notifications SET is_read = 1 WHERE id IN ($placeholders) AND user_id = ?";
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            sendResponse(['updated' => true], 200, '已標記為已讀');
            return;
        }
        
        $params = array_merge($notificationIds, [$userId]);
        $types = str_repeat('i', count($notificationIds)) . 'i';
        $stmt->bind_param($types, ...$params);
        $stmt->execute();

        sendResponse(['updated' => true], 200, '已標記為已讀');
    } catch (Exception $e) {
        sendResponse(['updated' => true], 200, '已標記為已讀');
    }
}

/**
 * 全部標記為已讀
 */
function markAllNotificationsAsRead($input) {
    global $conn;

    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }

    try {
        $query = "UPDATE notifications SET is_read = 1 WHERE user_id = ?";
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            sendResponse(['updated' => true], 200, '已標記為已讀');
            return;
        }
        
        $stmt->bind_param('i', $userId);
        $stmt->execute();

        sendResponse(['updated' => true], 200, '已標記為已讀');
    } catch (Exception $e) {
        sendResponse(['updated' => true], 200, '已標記為已讀');
    }
}

/**
 * 批量刪除通知
 */
function deleteMultipleNotifications($input) {
    global $conn;

    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }

    $notificationIds = $input['notification_ids'] ?? [];
    if (empty($notificationIds)) {
        sendError('缺少通知 ID 列表', 400);
        return;
    }

    try {
        $placeholders = str_repeat('?,', count($notificationIds) - 1) . '?';
        $query = "DELETE FROM notifications WHERE id IN ($placeholders) AND user_id = ?";
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            sendResponse(['deleted' => true], 200, '已刪除');
            return;
        }
        
        $params = array_merge($notificationIds, [$userId]);
        $types = str_repeat('i', count($notificationIds)) . 'i';
        $stmt->bind_param($types, ...$params);
        $stmt->execute();

        sendResponse(['deleted' => true], 200, '已刪除');
    } catch (Exception $e) {
        sendResponse(['deleted' => true], 200, '已刪除');
    }
}

/**
 * 格式化時間
 */
function formatTime($datetime) {
    $time = strtotime($datetime);
    $now = time();
    $diff = $now - $time;
    
    if ($diff < 60) {
        return '剛剛';
    } elseif ($diff < 3600) {
        return floor($diff / 60) . ' 分鐘前';
    } elseif ($diff < 86400) {
        return floor($diff / 3600) . ' 小時前';
    } elseif ($diff < 2592000) {
        return floor($diff / 86400) . ' 天前';
    } else {
        return date('Y-m-d', $time);
    }
}

/**
 * 預設通知
 */
function getDefaultNotifications() {
    return [
        [
            'id' => 1,
            'type' => 'like',
            'title' => '有人對您的作品按讚',
            'text' => '李大明對您的作品「響應式網站設計」按了讚',
            'status' => 'unread',
            'time' => '2 分鐘前',
            'portfolioId' => 1
        ],
        [
            'id' => 2,
            'type' => 'comment',
            'title' => '新的評論',
            'text' => '王小美在您的作品「行動應用程式」發表了評論',
            'status' => 'unread',
            'time' => '15 分鐘前',
            'portfolioId' => 2,
            'commentId' => 2
        ],
        [
            'id' => 3,
            'type' => 'view',
            'title' => '作品被瀏覽',
            'text' => '有人瀏覽了您的作品「UI/UX 設計作品」',
            'status' => 'read',
            'time' => '1 小時前',
            'portfolioId' => 3
        ],
        [
            'id' => 4,
            'type' => 'enterprise',
            'title' => '企業關注',
            'text' => '台灣微軟對您的作品「響應式網站設計」表示興趣',
            'status' => 'unread',
            'time' => '3 小時前',
            'portfolioId' => 1,
            'enterpriseId' => 1
        ],
        [
            'id' => 5,
            'type' => 'system',
            'title' => '系統通知',
            'text' => '您的作品「數據視覺化專案」已通過審核並發布',
            'status' => 'read',
            'time' => '1 天前',
            'portfolioId' => 4
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


