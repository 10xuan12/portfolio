<?php
session_start();
require '../includes/db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['id'], $_SESSION['role'], $_POST['comment_id'], $_POST['content'])) {
    echo json_encode(['success' => false, 'message' => '資料不完整']);
    exit;
}

$comment_id = intval($_POST['comment_id']);
$user_id = $_SESSION['id'];
$role = $_SESSION['role'];
$content = trim($_POST['content']);

$stmt = $conn->prepare("UPDATE comments SET content = ? WHERE comment_id = ? AND user_id = ? AND role = ?");
$stmt->bind_param("siis", $content, $comment_id, $user_id, $role);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    echo json_encode(['success' => true, 'message' => '編輯成功']);
} else {
    echo json_encode(['success' => false, 'message' => '無權限或資料錯誤']);
}
?>
