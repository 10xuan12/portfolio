<?php
include '../db_connect.php';
session_start();

$portfolio_id = $_POST['portfolio_id'];
$content = $_POST['content'];
$user_type = $_SESSION['role']; // 'student' or 'company'
$user_id = $_SESSION['id'];

$stmt = $conn->prepare("INSERT INTO comments (portfolio_id, user_type, user_id, content) VALUES (?, ?, ?, ?)");
$stmt->bind_param("isis", $portfolio_id, $user_type, $user_id, $content);
$stmt->execute();
?>
