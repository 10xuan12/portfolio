<?php
session_start();
require '../includes/db_connect.php';

if (!isset($_SESSION['student_id'])) {
    header("Location: ../login.php");
    exit();
}

$student_id = $_SESSION['student_id'];

// 取得 POST 的資料
$student_name = $_POST['student_name'];
$department = $_POST['department'];
$grade = $_POST['grade'];
$phone = $_POST['phone'];
$email = $_POST['email'];

// 更新資料庫
$sql = "UPDATE student_profiles SET student_name = ?, department = ?, grade = ?, phone = ?, email = ? WHERE student_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssss", $student_name, $department, $grade, $phone, $email, $student_id);

if ($stmt->execute()) {
    header("Location: student_dashboard.php?updated=true");
} else {
    echo "更新失敗：" . $conn->error;
}

$stmt->close();
$conn->close();
?>
