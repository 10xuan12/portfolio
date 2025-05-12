<?php
require '../includes/db_connect.php';

$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$limit = 9; // 每頁顯示 9 個作品
$offset = ($page - 1) * $limit;

// 準備搜尋條件
$search_condition = '';
$params = [];
$types = '';

if (!empty($search)) {
    $search_condition = "WHERE title LIKE ? OR description LIKE ?";
    $search_param = "%{$search}%";
    $params = [$search_param, $search_param];
    $types = "ss";
}

// 取得總筆數
$count_sql = "SELECT COUNT(*) as count FROM portfolios " . $search_condition;
$stmt_count = $conn->prepare($count_sql);
if (!empty($params)) {
    $stmt_count->bind_param($types, ...$params);
}
$stmt_count->execute();
$count_result = $stmt_count->get_result()->fetch_assoc();
$total = $count_result['count'];
$total_pages = ceil($total / $limit);

// 撈作品資料
$sql = "SELECT p.*, c.name as category_name 
        FROM portfolios p 
        LEFT JOIN categories c ON p.category_id = c.category_id 
        " . $search_condition . " 
        ORDER BY p.portfolio_id DESC 
        LIMIT ?, ?";

$stmt = $conn->prepare($sql);

// 加入分頁參數
$params[] = $offset;
$params[] = $limit;
$types .= "ii";

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
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