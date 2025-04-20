<?php
session_start();
require '../includes/db_connect.php';  // 連接資料庫

// 檢查是否已登入
if (!isset($_SESSION['student_id'])) {
    // 如果沒有登入，重定向到登入頁面
    header("Location: login.php");  // 根據實際的登入頁面路徑修改
    exit();
}

// 如果已登入，取得學生 ID
$student_id = $_SESSION['student_id'];

// 查詢學生資料
$sql = "SELECT * FROM student_profiles WHERE student_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $student_id);
$stmt->execute();
$result = $stmt->get_result();

// 檢查是否有資料
if ($result->num_rows > 0) {
    // 取得學生資料
    $student_data = $result->fetch_assoc();
} else {
    $student_data = null;  // 沒有找到資料
}

$stmt->close();
$conn->close();

// 將資料傳遞給 student_dashboard_view.php
include 'student_dashboard_view.php';
?>
