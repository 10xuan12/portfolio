<?php
// 隨機作品 API 端點
// 設定基本環境變數
if (!isset($_SERVER['REQUEST_METHOD'])) {
    $_SERVER['REQUEST_METHOD'] = 'GET';
}

require_once __DIR__ . '/config.php';

// 設定 JSON 回應標頭
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

try {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 6;
    
    // 查詢隨機作品（使用 DISTINCT 避免重複）
    $stmt = $GLOBALS['conn']->prepare("
        SELECT DISTINCT
            p.id,
            p.user_id,
            p.title,
            p.description,
            p.cover_image as thumbnail_url,
            c.name as category,
            p.tags,
            p.view_count,
            p.like_count,
            p.comment_count,
            p.created_at,
            u.username as author_name,
            sp.display_name as author_display_name,
            sp.bio as author_bio,
            sp.major as department,
            sp.avatar_url as author_avatar
        FROM portfolios p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'published'
        ORDER BY RAND()
        LIMIT ?
    ");
    
    $stmt->bind_param('i', $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    $portfolios = $result->fetch_all(MYSQLI_ASSOC);
    
    // 處理標籤（從文字轉為陣列）
    foreach ($portfolios as &$portfolio) {
        $portfolio['tags'] = $portfolio['tags'] ? explode(',', $portfolio['tags']) : [];
        $portfolio['author_name'] = $portfolio['author_display_name'] ?: $portfolio['author_name'];
    }
    
    // 回傳 JSON 回應
    echo json_encode([
        'status' => 200,
        'message' => '取得隨機作品成功',
        'data' => $portfolios,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log("取得隨機作品錯誤: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => '取得隨機作品失敗: ' . $e->getMessage(),
        'data' => null,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
}
?>
