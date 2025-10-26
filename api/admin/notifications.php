<?php
require_once __DIR__ . '/../config.php';

// 管理員通知 API
// 檢查管理員權限
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    sendError('需要管理員權限', 403);
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getNotifications();
        break;
    case 'PUT':
        markAsRead();
        break;
    case 'DELETE':
        deleteNotification();
        break;
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得通知列表
function getNotifications() {
    try {
        $status = $_GET['status'] ?? 'all'; // all, unread, read
        $limit = min(50, max(1, intval($_GET['limit'] ?? 20)));
        
        // 建立查詢條件
        $where = ['1=1'];
        $params = [];
        $types = '';
        
        if ($status === 'unread') {
            $where[] = "is_read = 0";
        } elseif ($status === 'read') {
            $where[] = "is_read = 1";
        }
        
        $whereClause = implode(' AND ', $where);
        
        // 查詢通知
        // 如果 notifications 表不存在，返回空數組
        $tableExists = $GLOBALS['conn']->query("SHOW TABLES LIKE 'admin_notifications'");
        
        if ($tableExists && $tableExists->num_rows > 0) {
            $sql = "
                SELECT 
                    id,
                    type,
                    title,
                    message,
                    data,
                    is_read,
                    created_at
                FROM admin_notifications
                WHERE $whereClause
                ORDER BY created_at DESC
                LIMIT ?
            ";
            
            $stmt = $GLOBALS['conn']->prepare($sql);
            $stmt->bind_param('i', $limit);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $notifications = [];
            while ($row = $result->fetch_assoc()) {
                $notifications[] = [
                    'id' => (int)$row['id'],
                    'type' => $row['type'],
                    'title' => $row['title'],
                    'message' => $row['message'],
                    'data' => json_decode($row['data'] ?? '{}', true),
                    'is_read' => (bool)$row['is_read'],
                    'created_at' => $row['created_at']
                ];
            }
        } else {
            // 表不存在，返回示範通知
            $notifications = generateSampleNotifications();
        }
        
        // 計算未讀數量
        $unreadCount = 0;
        if ($tableExists && $tableExists->num_rows > 0) {
            $countResult = $GLOBALS['conn']->query("SELECT COUNT(*) as count FROM admin_notifications WHERE is_read = 0");
            if ($countResult) {
                $unreadCount = (int)$countResult->fetch_assoc()['count'];
            }
        } else {
            $unreadCount = count(array_filter($notifications, function($n) {
                return !$n['is_read'];
            }));
        }
        
        sendResponse([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
            'total' => count($notifications)
        ], 200, '取得通知列表成功');
        
    } catch (Exception $e) {
        sendError('取得通知列表失敗: ' . $e->getMessage(), 500);
    }
}

// 生成示範通知（當資料表不存在時）
function generateSampleNotifications() {
    $now = date('Y-m-d H:i:s');
    
    return [
        [
            'id' => 1,
            'type' => 'new_user',
            'title' => '新使用者註冊',
            'message' => '有新的學生註冊，等待審核',
            'data' => ['user_id' => 0, 'username' => '新使用者'],
            'is_read' => false,
            'created_at' => date('Y-m-d H:i:s', strtotime('-10 minutes'))
        ],
        [
            'id' => 2,
            'type' => 'new_portfolio',
            'title' => '新作品上傳',
            'message' => '有新的作品等待審核',
            'data' => ['portfolio_id' => 0],
            'is_read' => false,
            'created_at' => date('Y-m-d H:i:s', strtotime('-30 minutes'))
        ],
        [
            'id' => 3,
            'type' => 'new_report',
            'title' => '新檢舉報告',
            'message' => '有新的內容被檢舉',
            'data' => ['report_id' => 0],
            'is_read' => false,
            'created_at' => date('Y-m-d H:i:s', strtotime('-1 hour'))
        ]
    ];
}

// 標記為已讀
function markAsRead() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $notificationId = $input['notification_id'] ?? 0;
        
        if (!$notificationId) {
            sendError('缺少通知 ID', 400);
        }
        
        // 檢查表是否存在
        $tableExists = $GLOBALS['conn']->query("SHOW TABLES LIKE 'admin_notifications'");
        
        if ($tableExists && $tableExists->num_rows > 0) {
            $stmt = $GLOBALS['conn']->prepare("
                UPDATE admin_notifications 
                SET is_read = 1, updated_at = NOW() 
                WHERE id = ?
            ");
            $stmt->bind_param('i', $notificationId);
            $stmt->execute();
            
            if ($stmt->affected_rows === 0) {
                sendError('通知不存在', 404);
            }
        }
        
        sendResponse([
            'notification_id' => $notificationId
        ], 200, '標記為已讀成功');
        
    } catch (Exception $e) {
        sendError('標記失敗: ' . $e->getMessage(), 500);
    }
}

// 刪除通知
function deleteNotification() {
    try {
        $notificationId = $_GET['notification_id'] ?? 0;
        
        if (!$notificationId) {
            sendError('缺少通知 ID', 400);
        }
        
        // 檢查表是否存在
        $tableExists = $GLOBALS['conn']->query("SHOW TABLES LIKE 'admin_notifications'");
        
        if ($tableExists && $tableExists->num_rows > 0) {
            $stmt = $GLOBALS['conn']->prepare("DELETE FROM admin_notifications WHERE id = ?");
            $stmt->bind_param('i', $notificationId);
            $stmt->execute();
            
            if ($stmt->affected_rows === 0) {
                sendError('通知不存在', 404);
            }
        }
        
        sendResponse([
            'notification_id' => $notificationId
        ], 200, '通知刪除成功');
        
    } catch (Exception $e) {
        sendError('刪除失敗: ' . $e->getMessage(), 500);
    }
}
?>

