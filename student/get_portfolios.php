<?php
require '../includes/db_connect.php';

$category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$limit = 5; // 每頁顯示數量
$offset = ($page - 1) * $limit;

// 取得總筆數
$count_sql = "SELECT COUNT(*) as count FROM portfolios WHERE category_id = ?";
$stmt_count = $conn->prepare($count_sql);
$stmt_count->bind_param("i", $category_id);
$stmt_count->execute();
$count_result = $stmt_count->get_result()->fetch_assoc();
$total = $count_result['count'];
$total_pages = ceil($total / $limit);

// 撈作品
$sql = "SELECT * FROM portfolios WHERE category_id = ? ORDER BY portfolio_id DESC LIMIT ?, ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iii", $category_id, $offset, $limit);
$stmt->execute();
$result = $stmt->get_result();

$portfolios = [];
while ($portfolio = $result->fetch_assoc()) {
    $portfolios[] = $portfolio;
}

// 回傳 JSON 格式的資料
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'data' => [
        'portfolios' => $portfolios,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $total_pages,
            'total_items' => $total,
            'items_per_page' => $limit
        ]
    ]
]);
