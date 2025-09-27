<?php
require_once '../config.php';

// 企業通知 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'list':
                    getNotifications();
                    break;
                case 'count':
                    getNotificationCount();
                    break;
                default:
                    sendError('無效的操作', 400);
            }
        } else {
            sendError('缺少操作類型', 400);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'mark_read':
                    markAsRead($input);
                    break;
                case 'mark_all_read':
                    markAllAsRead();
                    break;
                case 'delete':
                    deleteNotification($input);
                    break;
                case 'clear_all':
                    clearAllNotifications();
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

// 取得通知列表
function getNotifications() {
    $userId = checkPermission('enterprise');
    
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $type = isset($_GET['type']) ? $_GET['type'] : '';
    $unreadOnly = isset($_GET['unread_only']) ? (bool)$_GET['unread_only'] : false;
    
    $offset = ($page - 1) * $limit;
    
    // 建立查詢條件
    $where = "WHERE n.user_id = ?";
    $params = [$userId];
    $types = "i";
    
    if ($type && $type !== 'all') {
        $where .= " AND n.type = ?";
        $params[] = $type;
        $types .= "s";
    }
    
    if ($unreadOnly) {
        $where .= " AND n.is_read = 0";
    }
    
    // 查詢通知列表
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            n.id, n.type, n.title, n.message, n.data, n.is_read, n.created_at,
            CASE 
                WHEN n.type = 'enterprise' THEN ec.id
                ELSE NULL
            END as related_id
        FROM notifications n
        LEFT JOIN enterprise_contacts ec ON n.data LIKE CONCAT('%\"contact_id\":', ec.id, '%')
        $where
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
    ");
    
    $params[] = $limit;
    $params[] = $offset;
    $types .= "ii";
    
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    $notifications = $result->fetch_all(MYSQLI_ASSOC);
    
    // 查詢總數
    $countStmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as total
        FROM notifications n
        $where
    ");
    
    $countParams = array_slice($params, 0, -2);
    $countTypes = substr($types, 0, -2);
    
    if (!empty($countParams)) {
        $countStmt->bind_param($countTypes, ...$countParams);
    }
    $countStmt->execute();
    $total = $countStmt->get_result()->fetch_assoc()['total'];
    
    // 處理通知資料
    foreach ($notifications as &$notification) {
        $notification['data'] = $notification['data'] ? json_decode($notification['data'], true) : [];
        $notification['time_ago'] = getTimeAgo($notification['created_at']);
        $notification['type_icon'] = getNotificationIcon($notification['type']);
        $notification['type_color'] = getNotificationColor($notification['type']);
    }
    
    $response = [
        'notifications' => $notifications,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ];
    
    sendResponse($response, 200, '取得通知列表成功');
}

// 取得未讀通知數量
function getNotificationCount() {
    $userId = checkPermission('enterprise');
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            COUNT(*) as total_unread,
            SUM(CASE WHEN type = 'enterprise' THEN 1 ELSE 0 END) as enterprise_contacts,
            SUM(CASE WHEN type = 'system' THEN 1 ELSE 0 END) as system_notifications,
            SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END) as likes,
            SUM(CASE WHEN type = 'comment' THEN 1 ELSE 0 END) as comments,
            SUM(CASE WHEN type = 'view' THEN 1 ELSE 0 END) as views
        FROM notifications 
        WHERE user_id = ? AND is_read = 0
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $counts = $result->fetch_assoc();
    
    sendResponse($counts, 200, '取得通知數量成功');
}

// 標記通知為已讀
function markAsRead($data) {
    $userId = checkPermission('enterprise');
    
    if (!isset($data['notification_id'])) {
        sendError('缺少通知ID', 400);
    }
    
    $notificationId = (int)$data['notification_id'];
    
    // 檢查通知是否屬於該企業
    $checkStmt = $GLOBALS['conn']->prepare("SELECT id FROM notifications WHERE id = ? AND user_id = ?");
    $checkStmt->bind_param("ii", $notificationId, $userId);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows === 0) {
        sendError('通知不存在或無權限修改', 404);
    }
    
    $stmt = $GLOBALS['conn']->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $notificationId, $userId);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '通知已標記為已讀');
    } else {
        sendError('標記通知失敗', 500);
    }
}

// 標記所有通知為已讀
function markAllAsRead() {
    $userId = checkPermission('enterprise');
    
    $stmt = $GLOBALS['conn']->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0");
    $stmt->bind_param("i", $userId);
    
    if ($stmt->execute()) {
        $affectedRows = $stmt->affected_rows;
        sendResponse(['affected_count' => $affectedRows], 200, "已標記 {$affectedRows} 個通知為已讀");
    } else {
        sendError('標記通知失敗', 500);
    }
}

// 刪除通知
function deleteNotification($data) {
    $userId = checkPermission('enterprise');
    
    if (!isset($data['notification_id'])) {
        sendError('缺少通知ID', 400);
    }
    
    $notificationId = (int)$data['notification_id'];
    
    // 檢查通知是否屬於該企業
    $checkStmt = $GLOBALS['conn']->prepare("SELECT id FROM notifications WHERE id = ? AND user_id = ?");
    $checkStmt->bind_param("ii", $notificationId, $userId);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows === 0) {
        sendError('通知不存在或無權限刪除', 404);
    }
    
    $stmt = $GLOBALS['conn']->prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $notificationId, $userId);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '通知已刪除');
    } else {
        sendError('刪除通知失敗', 500);
    }
}

// 清除所有通知
function clearAllNotifications() {
    $userId = checkPermission('enterprise');
    
    $stmt = $GLOBALS['conn']->prepare("DELETE FROM notifications WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    
    if ($stmt->execute()) {
        $affectedRows = $stmt->affected_rows;
        sendResponse(['affected_count' => $affectedRows], 200, "已清除 {$affectedRows} 個通知");
    } else {
        sendError('清除通知失敗', 500);
    }
}

// 輔助函數：取得時間差
function getTimeAgo($datetime) {
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
        return floor($diff / 2592000) . ' 個月前';
    }
}

// 輔助函數：取得通知圖示
function getNotificationIcon($type) {
    $iconMap = [
        'enterprise' => 'fas fa-building',
        'system' => 'fas fa-cog',
        'like' => 'fas fa-heart',
        'comment' => 'fas fa-comment',
        'view' => 'fas fa-eye'
    ];
    return $iconMap[$type] ?? 'fas fa-bell';
}

// 輔助函數：取得通知顏色
function getNotificationColor($type) {
    $colorMap = [
        'enterprise' => '#28a745',
        'system' => '#6c757d',
        'like' => '#dc3545',
        'comment' => '#ffc107',
        'view' => '#17a2b8'
    ];
    return $colorMap[$type] ?? '#6c757d';
}
