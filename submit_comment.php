<?php
require 'includes/db_connect.php';

$content = trim($_POST['content'] ?? '');
$portfolio_id = $_POST['portfolio_id'] ?? 0;

if ($content && $portfolio_id) {
    $stmt = $conn->prepare("INSERT INTO comments (portfolio_id, content, created_at) VALUES (?, ?, NOW())");
    $stmt->bind_param("is", $portfolio_id, $content);
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => '寫入失敗']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => '欄位不可為空']);
}
?>
