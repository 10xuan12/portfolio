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

// 活動記錄 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'get') {
            getUserActivities();
        } else {
            sendError('無效的請求', 400);
        }
        break;
        
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得使用者活動記錄
function getUserActivities() {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    // 取得分頁參數
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;
    
    try {
        // 取得活動記錄
        $stmt = $GLOBALS['conn']->prepare(
            "SELECT 
                ua.id, ua.type, ua.description, ua.metadata, ua.created_at
            FROM user_activities ua
            WHERE ua.user_id = ?
            ORDER BY ua.created_at DESC
            LIMIT ? OFFSET ?"
        );
        $stmt->bind_param("iii", $userId, $limit, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $activities = [];
        while ($row = $result->fetch_assoc()) {
            $metadata = json_decode($row['metadata'], true) ?: [];
            
            $activities[] = [
                'id' => $row['id'],
                'type' => $row['type'],
                'text' => $row['description'],
                'metadata' => $metadata,
                'time' => formatTimeAgo($row['created_at']),
                'timestamp' => $row['created_at']
            ];
        }
        
        // 取得總數
        $countStmt = $GLOBALS['conn']->prepare(
            "SELECT COUNT(*) as total FROM user_activities WHERE user_id = ?"
        );
        $countStmt->bind_param("i", $userId);
        $countStmt->execute();
        $total = $countStmt->get_result()->fetch_assoc()['total'];
        
        // 計算分頁資訊
        $totalPages = ceil($total / $limit);
        
        sendResponse([
            'activities' => $activities,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $totalPages,
                'total_items' => $total,
                'items_per_page' => $limit,
                'has_next' => $page < $totalPages,
                'has_prev' => $page > 1
            ]
        ], 200);
        
    } catch (Exception $e) {
        sendError('取得活動記錄失敗: ' . $e->getMessage(), 500);
    }
}

// 格式化時間為相對時間
function formatTimeAgo($timestamp) {
    $now = new DateTime();
    $time = new DateTime($timestamp);
    $diff = $now->diff($time);
    
    if ($diff->y > 0) {
        return $diff->y . ' 年前';
    } elseif ($diff->m > 0) {
        return $diff->m . ' 個月前';
    } elseif ($diff->d > 0) {
        return $diff->d . ' 天前';
    } elseif ($diff->h > 0) {
        return $diff->h . ' 小時前';
    } elseif ($diff->i > 0) {
        return $diff->i . ' 分鐘前';
    } else {
        return '剛剛';
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

// 注意：sendResponse 和 sendError 函數已在 config.php 中定義
?>
