<?php
require_once '../config.php';

// CORS 與回應格式
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('不支援的 HTTP 方法', 405);
}

try {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
    }

    // 作品數量與總和
    $totalPortfolios = 0;
    $totalViews = 0;
    $totalLikes = 0;
    $totalComments = 0;
    $recentActivities = 0;

    // 作品總數
    $stmt = $GLOBALS["conn"]->prepare("SELECT COUNT(*) AS cnt FROM portfolios WHERE user_id = ?");
    if ($stmt) {
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        $totalPortfolios = (int)($res['cnt'] ?? 0);
    }

    // 總瀏覽/讚數
    $stmt = $GLOBALS["conn"]->prepare("SELECT SUM(view_count) AS v, SUM(like_count) AS l, SUM(comment_count) AS c FROM portfolios WHERE user_id = ?");
    if ($stmt) {
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        $totalViews = (int)($res['v'] ?? 0);
        $totalLikes = (int)($res['l'] ?? 0);
        $totalComments = (int)($res['c'] ?? 0);
    }

    // 近期活動數（近 7 天）
    $stmt = $GLOBALS["conn"]->prepare("SELECT COUNT(*) AS cnt FROM user_activities WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
    if ($stmt) {
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        $recentActivities = (int)($res['cnt'] ?? 0);
    }

    $data = [
        'total_portfolios' => $totalPortfolios,
        'total_views' => $totalViews,
        'total_likes' => $totalLikes,
        'total_comments' => $totalComments,
        'recent_activities' => $recentActivities
    ];

    sendResponse($data, 200, '成功');
} catch (Exception $e) {
    sendError('統計失敗: ' . $e->getMessage(), 500);
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

