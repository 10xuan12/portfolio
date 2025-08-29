<?php
/**
 * 學生徽章 API
 * 處理徽章相關的 CRUD 操作
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
        getStudentBadges();
        break;
    case 'earn':
        earnBadge();
        break;
    default:
        sendError('無效的動作', 400);
        break;
}

/**
 * 獲取學生徽章
 */
function getStudentBadges() {
    global $conn;
    
    // 檢查權限
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    try {
        // 查詢學生的徽章
        $query = "
            SELECT 
                b.id,
                b.name,
                b.description,
                b.icon,
                b.category,
                b.required_points,
                CASE WHEN ub.user_id IS NOT NULL THEN 1 ELSE 0 END as earned,
                ub.achieved_at
            FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
            ORDER BY b.required_points ASC, b.name ASC
        ";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            // 資料表不存在或 SQL 錯誤，回預設徽章
            sendResponse(getDefaultBadges(), 200, '使用預設徽章');
            return;
        }
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $badges = [];
        while ($row = $result->fetch_assoc()) {
            $badges[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'description' => $row['description'],
                'icon' => $row['icon'],
                'category' => $row['category'],
                'required_points' => (int)$row['required_points'],
                'earned' => (bool)$row['earned'],
                'earned_at' => $row['achieved_at']
            ];
        }
        
        if (empty($badges)) {
            $badges = getDefaultBadges();
        }
        
        sendResponse($badges, 200, '成功獲取徽章資料');
        
    } catch (Exception $e) {
        // 出現例外時回預設徽章
        sendResponse(getDefaultBadges(), 200, '使用預設徽章');
    }
}

/**
 * 獲得徽章
 */
function earnBadge() {
    global $conn;
    
    // 檢查權限
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    // 獲取徽章 ID
    $badgeId = $_POST['badge_id'] ?? null;
    if (!$badgeId) {
        sendError('缺少徽章 ID', 400);
        return;
    }
    
    try {
        // 檢查是否已經獲得該徽章
        $checkQuery = "SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param('ii', $userId, $badgeId);
        $checkStmt->execute();
        
        if ($checkStmt->get_result()->num_rows > 0) {
            sendError('已經獲得該徽章', 400);
            return;
        }
        
        // 插入徽章獲得記錄
        $insertQuery = "INSERT INTO user_badges (user_id, badge_id, achieved_at, notes) VALUES (?, ?, NOW(), NULL)";
        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bind_param('ii', $userId, $badgeId);

        if ($insertStmt->execute()) {
            sendResponse(['badge_id' => $badgeId], 200, '成功獲得徽章');
        } else {
            sendError('獲得徽章失敗', 500);
        }
        
    } catch (Exception $e) {
        error_log("獲得徽章失敗: " . $e->getMessage());
        sendError('獲得徽章失敗', 500);
    }
}

/**
 * 獲取預設徽章
 */
function getDefaultBadges() {
    return [
        [
            'id' => 1,
            'name' => '新手上傳者',
            'description' => '上傳第一個作品',
            'icon' => 'fas fa-star',
            'category' => 'achievement',
            'required_points' => 10,
            'earned' => false,
            'earned_at' => null,
            'points_earned' => 0
        ],
        [
            'id' => 2,
            'name' => '瀏覽達人',
            'description' => '作品獲得 100 次瀏覽',
            'icon' => 'fas fa-eye',
            'category' => 'engagement',
            'required_points' => 100,
            'earned' => false,
            'earned_at' => null,
            'points_earned' => 0
        ],
        [
            'id' => 3,
            'name' => '受歡迎',
            'description' => '作品獲得 50 個讚',
            'icon' => 'fas fa-heart',
            'category' => 'engagement',
            'required_points' => 50,
            'earned' => false,
            'earned_at' => null,
            'points_earned' => 0
        ],
        [
            'id' => 4,
            'name' => '作品大師',
            'description' => '上傳 10 個作品',
            'icon' => 'fas fa-trophy',
            'category' => 'achievement',
            'required_points' => 100,
            'earned' => false,
            'earned_at' => null,
            'points_earned' => 0
        ],
        [
            'id' => 5,
            'name' => '互動王',
            'description' => '發表 20 則評論',
            'icon' => 'fas fa-comment',
            'category' => 'engagement',
            'required_points' => 20,
            'earned' => false,
            'earned_at' => null,
            'points_earned' => 0
        ],
        [
            'id' => 6,
            'name' => '超級明星',
            'description' => '達到 1000 積分',
            'icon' => 'fas fa-crown',
            'category' => 'achievement',
            'required_points' => 1000,
            'earned' => false,
            'earned_at' => null,
            'points_earned' => 0
        ]
    ];
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
