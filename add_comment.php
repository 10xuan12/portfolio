<?php
session_start();
require '../includes/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['role'], $_SESSION['id'], $_POST['portfolio_id'], $_POST['content'])) {
    echo json_encode(['success' => false, 'message' => '未登入或資料不完整']);
    exit;
}

$portfolio_id = intval($_POST['portfolio_id']);
$content = trim($_POST['content']);
$user_id = $_SESSION['id'];
$role = $_SESSION['role'];
$name = $_SESSION['name'];

$stmt = $conn->prepare("INSERT INTO comments (portfolio_id, user_id, role, name, content, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
$stmt->bind_param("iisss", $portfolio_id, $user_id, $role, $name, $content);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => '留言成功']);
} else {
    echo json_encode(['success' => false, 'message' => '留言失敗']);
}
?>
