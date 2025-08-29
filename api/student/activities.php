<?php
/**
 * 學生活動 API
 * 處理活動記錄相關的 CRUD 操作
 */

require_once '../config.php';

// 設定 CORS 標頭
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');
header('Content-Type: application/json; charset=utf-8');

// 處理 OPTIONS 請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 檢查請求方法
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('只支援 GET 請求', 405);
    exit();
}

// 獲取動作參數
$action = $_GET['action'] ?? '';

// 根據動作執行相應操作
switch ($action) {
    case 'get':
        getStudentActivities();
        break;
    default:
        sendError('無效的動作', 400);
        break;
}

/**
 * 獲取學生活動記錄
 */
function getStudentActivities() {
    global $conn;
    
    // 檢查權限
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    try {
        // 查詢學生的活動記錄
        $query = "
            SELECT 
                a.id,
                a.user_id,
                a.type,
                a.description,
                a.metadata,
                a.created_at,
                a.updated_at
            FROM user_activities a
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC
            LIMIT 20
        ";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $activities = [];
        while ($row = $result->fetch_assoc()) {
            $activities[] = [
                'id' => $row['id'],
                'type' => $row['type'],
                'text' => $row['description'],
                'time' => formatTimeAgo($row['created_at']),
                'metadata' => json_decode($row['metadata'], true) ?: []
            ];
        }
        
        // 如果沒有活動記錄，返回預設活動
        if (empty($activities)) {
            $activities = getDefaultActivities();
        }
        
        sendResponse('成功獲取活動記錄', $activities);
        
    } catch (Exception $e) {
        error_log("獲取活動記錄失敗: " . $e->getMessage());
        sendError('獲取活動記錄失敗', 500);
    }
}

/**
 * 獲取預設活動記錄
 */
function getDefaultActivities() {
    return [
        [
            'id' => 1,
            'type' => 'upload',
            'text' => '上傳了新作品「我的第一個專案」',
            'time' => '2 小時前',
            'metadata' => ['portfolio_id' => 1, 'portfolio_name' => '我的第一個專案']
        ],
        [
            'id' => 2,
            'type' => 'view',
            'text' => '作品「我的第一個專案」獲得瀏覽',
            'time' => '1 天前',
            'metadata' => ['portfolio_id' => 1, 'portfolio_name' => '我的第一個專案']
        ],
        [
            'id' => 3,
            'type' => 'like',
            'text' => '作品「我的第一個專案」獲得讚',
            'time' => '2 天前',
            'metadata' => ['portfolio_id' => 1, 'portfolio_name' => '我的第一個專案']
        ],
        [
            'id' => 4,
            'type' => 'comment',
            'text' => '在作品「我的第一個專案」下發表評論',
            'time' => '3 天前',
            'metadata' => ['portfolio_id' => 1, 'portfolio_name' => '我的第一個專案']
        ],
        [
            'id' => 5,
            'type' => 'badge',
            'text' => '獲得徽章「新手上傳者」',
            'time' => '1 週前',
            'metadata' => ['badge_id' => 1, 'badge_name' => '新手上傳者']
        ]
    ];
}

/**
 * 格式化時間為相對時間
 */
function formatTimeAgo($datetime) {
    $time = strtotime($datetime);
    $now = time();
    $diff = $now - $time;
    
    if ($diff < 60) {
        return '剛剛';
    } elseif ($diff < 3600) {
        $minutes = floor($diff / 60);
        return $minutes . ' 分鐘前';
    } elseif ($diff < 86400) {
        $hours = floor($diff / 3600);
        return $hours . ' 小時前';
    } elseif ($diff < 2592000) {
        $days = floor($diff / 86400);
        return $days . ' 天前';
    } elseif ($diff < 31536000) {
        $weeks = floor($diff / 604800);
        return $weeks . ' 週前';
    } else {
        $years = floor($diff / 31536000);
        return $years . ' 年前';
    }
}

/**
 * 獲取使用者 ID
 */
function getUserId() {
    // 從 session 獲取
    if (isset($_SESSION['user_id'])) {
        return $_SESSION['user_id'];
    }
    
    // 從 header 獲取
    $headers = getallheaders();
    if (isset($headers['X-User-ID'])) {
        return $headers['X-User-ID'];
    }
    
    // 從 GET 參數獲取
    if (isset($_GET['user_id'])) {
        return $_GET['user_id'];
    }
    
    // 從 POST 參數獲取
    if (isset($_POST['user_id'])) {
        return $_POST['user_id'];
    }
    
    return null;
}
?>
