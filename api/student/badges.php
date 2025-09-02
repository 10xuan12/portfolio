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

// 徽章 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'get') {
            getUserBadges();
        } else {
            sendError('無效的請求', 400);
        }
        break;
        
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得使用者徽章
function getUserBadges() {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    try {
        // 取得所有徽章和用戶已獲得的徽章
        $stmt = $GLOBALS['conn']->prepare(
            "SELECT 
                b.id, b.name, b.description, b.icon, b.category, b.required_points,
                CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as earned,
                ub.achieved_at, ub.notes
            FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
            ORDER BY b.required_points ASC, b.name ASC"
        );
        $stmt->bind_param("i", $userId);
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
                'achieved_at' => $row['achieved_at'],
                'notes' => $row['notes']
            ];
        }
        
        // 計算徽章統計
        $totalBadges = count($badges);
        $earnedBadges = array_filter($badges, function($badge) {
            return $badge['earned'];
        });
        $earnedCount = count($earnedBadges);
        
        $badgeStats = [
            'total' => $totalBadges,
            'earned' => $earnedCount,
            'progress' => $totalBadges > 0 ? round(($earnedCount / $totalBadges) * 100, 1) : 0
        ];
        
        sendResponse([
            'badges' => $badges,
            'stats' => $badgeStats
        ], 200);
        
    } catch (Exception $e) {
        sendError('取得徽章失敗: ' . $e->getMessage(), 500);
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
