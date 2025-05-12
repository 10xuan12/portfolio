<?php
require_once '../includes/db_connect.php';
require_once '../includes/auth_check.php';

header('Content-Type: application/json');

try {
    // 檢查是否已登入
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_type'])) {
        throw new Exception('請先登入後再留言');
    }

    // 取得並驗證輸入
    $portfolio_id = filter_input(INPUT_POST, 'portfolio_id', FILTER_VALIDATE_INT);
    $content = trim(filter_input(INPUT_POST, 'content', FILTER_SANITIZE_STRING));
    $user_id = $_SESSION['user_id'];
    $user_type = $_SESSION['user_type'];

    if (!$portfolio_id) {
        throw new Exception('無效的作品 ID');
    }

    if (empty($content)) {
        throw new Exception('留言內容不能為空');
    }

    // 檢查作品是否存在
    $stmt = $conn->prepare("SELECT portfolio_id FROM portfolios WHERE portfolio_id = ?");
    $stmt->bind_param("i", $portfolio_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception('找不到指定的作品');
    }

    // 新增留言
    $stmt = $conn->prepare("
        INSERT INTO comments (portfolio_id, user_id, user_type, content, created_at, updated_at) 
        VALUES (?, ?, ?, ?, NOW(), NOW())
    ");
    $stmt->bind_param("iiss", $portfolio_id, $user_id, $user_type, $content);

    if (!$stmt->execute()) {
        throw new Exception('新增留言失敗');
    }

    $comment_id = $conn->insert_id;

    // 取得新增的留言資料（包含使用者資訊）
    $sql = "SELECT c.*, 
            CASE 
                WHEN c.user_type = 'student' THEN sp.name
                WHEN c.user_type = 'company' THEN cp.name
                ELSE '訪客'
            END as username,
            CASE 
                WHEN c.user_type = 'student' THEN sp.profile_picture
                WHEN c.user_type = 'company' THEN cp.logo
                ELSE NULL
            END as avatar
            FROM comments c
            LEFT JOIN student_profiles sp ON c.user_type = 'student' AND c.user_id = sp.student_id
            LEFT JOIN company_profiles cp ON c.user_type = 'company' AND c.user_id = cp.company_id
            WHERE c.comment_id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $comment_id);
    $stmt->execute();
    $comment = $stmt->get_result()->fetch_assoc();

    // 處理頭像路徑
    $avatar = 'https://placehold.co/40x40/e9ecef/495057?text=' . substr($comment['username'] ?? '訪', 0, 1);
    if (!empty($comment['avatar'])) {
        if (str_starts_with($comment['avatar'], 'http')) {
            $avatar = $comment['avatar'];
        } else {
            $avatar = '/portfolio/uploads/' . ($comment['user_type'] === 'student' ? 'students/' : 'companies/') . $comment['avatar'];
        }
    }
    
    $comment['avatar'] = $avatar;

    echo json_encode([
        'success' => true,
        'message' => '留言成功',
        'data' => $comment
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}