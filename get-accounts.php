<?php
header('Content-Type: application/json');

// 連線資料庫
$host = '10.0.10.247';
$user = 'teammate2';
$pass = 'securepasss123';
$db   = 'ephortfolio';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(['error' => '連線失敗']);
  exit;
}

// 撈學生帳號資料
$sql = "SELECT student_id, email, name, created_at, password_hash FROM students";
$result = $conn->query($sql);

$students = [];
if ($result) {
  while ($row = $result->fetch_assoc()) {
    $students[] = $row;
  }
  echo json_encode($students);
} else {
  http_response_code(500);
  echo json_encode(['error' => 'SQL 查詢失敗', 'sql' => $sql, 'db_error' => $conn->error]);
}

$conn->close();
?>