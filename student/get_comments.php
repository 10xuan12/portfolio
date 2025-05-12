<?php
require '../includes/db_connect.php';

header('Content-Type: application/json');

$portfolio_id = isset($_GET['portfolio_id']) ? intval($_GET['portfolio_id']) : 0;
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$limit = 10; // 每頁顯示 10 條留言
$offset = ($page - 1) * $limit;

try {
    // 檢查作品是否存在
    $check_stmt = $conn->prepare("SELECT portfolio_id FROM portfolios WHERE portfolio_id = ?");
    $check_stmt->bind_param("i", $portfolio_id);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("找不到指定的作品");
    }

    // 取得總留言數
    $count_sql = "SELECT COUNT(*) as total FROM comments WHERE portfolio_id = ?";
    $count_stmt = $conn->prepare($count_sql);
    $count_stmt->bind_param("i", $portfolio_id);
    $count_stmt->execute();
    $total = $count_stmt->get_result()->fetch_assoc()['total'];
    $total_pages = ceil($total / $limit);

    // 根據 user_type 取得不同的使用者資訊
    $sql = "SELECT c.*, 
            CASE 
                WHEN c.user_type = 'student' THEN sp.name
                WHEN c.user_type = 'company' THEN cp.name
                ELSE '訪客'
            END as username
            FROM comments c
            LEFT JOIN student_profiles sp ON c.user_type = 'student' AND c.user_id = sp.student_id
            LEFT JOIN company_profiles cp ON c.user_type = 'company' AND c.user_id = cp.company_id
            WHERE c.portfolio_id = ? 
            ORDER BY c.created_at DESC 
            LIMIT ?, ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iii", $portfolio_id, $offset, $limit);
    $stmt->execute();
    $result = $stmt->get_result();

    $comments = [];
    while ($row = $result->fetch_assoc()) {
        // 處理頭像路徑
        $avatar = 'https://placehold.co/40x40/e9ecef/495057?text=' . substr($row['username'] ?? '訪', 0, 1);
        if (!empty($row['avatar'])) {
            if (str_starts_with($row['avatar'], 'http')) {
                $avatar = $row['avatar'];
            } else {
                $avatar = '/portfolio/uploads/' . ($row['user_type'] === 'student' ? 'students/' : 'companies/') . $row['avatar'];
            }
        }
        
        $comments[] = [
            'comment_id' => $row['comment_id'],
            'content' => $row['content'],
            'created_at' => $row['created_at'],
            'username' => $row['username'] ?? '訪客',
            'avatar' => $avatar,
            'user_type' => $row['user_type']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'comments' => $comments,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $total_pages,
                'total_items' => $total,
                'items_per_page' => $limit
            ]
        ]
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} 