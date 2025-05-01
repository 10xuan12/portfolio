<?php
session_start();
require '../includes/db_connect.php';

header('Content-Type: application/json');

$portfolio_id = intval($_GET['portfolio_id'] ?? 0);
$page = intval($_GET['page'] ?? 1);
$limit = 5;
$offset = ($page - 1) * $limit;

$stmt = $conn->prepare("SELECT comment_id, user_id, role, name, content, created_at FROM comments WHERE portfolio_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?");
$stmt->bind_param("iii", $portfolio_id, $limit, $offset);
$stmt->execute();
$result = $stmt->get_result();

$comments = [];
while ($row = $result->fetch_assoc()) {
    $comments[] = $row;
}

echo json_encode($comments);
?>
