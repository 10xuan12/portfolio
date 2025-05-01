<?php
session_start();
require '../includes/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['role'], $_SESSION['user_id'], $_SESSION['name'])) {
    echo json_encode(['status' => 'error', 'message' => '未登入']);
    exit;
}

$role = $_SESSION['role'];
$user_id = $_SESSION['user_id'];
$name = $_SESSION['name'];

$content = trim($_POST['content'] ?? '');
$portfolio_id = intval($_POST['portfolio_id'] ?? 0);

if ($content === '' || $portfolio_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => '請填寫留言']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO comments (portfolio_id, role, user_id, name, content, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
$stmt->bind_param("isiss", $portfolio_id, $role, $user_id, $name, $content);

if ($stmt->execute()) {
    echo json_encode([
        'status' => 'success',
        'comment' => [
            'comment_id' => $stmt->insert_id,
            'name' => $name,
            'content' => $content,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => '資料庫錯誤']);
}
