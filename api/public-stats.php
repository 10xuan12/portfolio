<?php
/**
 * 公開統計數據 API
 * 用於首頁展示平台整體統計數據
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // 獲取所有已發布作品的統計數據
    $query = "
        SELECT 
            COUNT(DISTINCT p.id) as total_portfolios,
            COALESCE(SUM(p.view_count), 0) as total_views,
            COALESCE(SUM(p.like_count), 0) as total_likes,
            COALESCE(SUM(p.comment_count), 0) as total_comments
        FROM portfolios p
        WHERE p.status = 'published'
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->get_result();
    $stats = $result->fetch_assoc();
    
    // 格式化數據，確保返回數字類型
    $data = [
        'total_portfolios' => (int)$stats['total_portfolios'],
        'total_views' => (int)$stats['total_views'],
        'total_likes' => (int)$stats['total_likes'],
        'total_comments' => (int)$stats['total_comments'],
        'last_updated' => date('Y-m-d H:i:s')
    ];
    
    sendResponse($data, 200, '統計數據獲取成功');
    
} catch (Exception $e) {
    debugLog("獲取統計數據錯誤: " . $e->getMessage());
    sendError('獲取統計數據失敗', 500);
}
?>

