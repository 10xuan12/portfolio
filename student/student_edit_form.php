<?php
session_start();
require '../includes/db_connect.php';

// 檢查是否已登入
if (!isset($_SESSION['student_id'])) {
    header("Location: ../login.php");
    exit();
}

$student_id = $_SESSION['student_id'];
$sql = "SELECT * FROM student_profiles WHERE student_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $student_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $student_data = $result->fetch_assoc();
} else {
    echo "找不到學生資料。";
    exit();
}

$conn->close();
?>

<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>編輯學生資料</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<div class="container py-5">
    <h2 class="text-center mb-4">編輯個人資料</h2>
    <form action="student_update.php" method="POST" class="p-4 bg-white rounded shadow-sm">
        <div class="mb-3">
            <label for="student_name" class="form-label">姓名</label>
            <input type="text" name="student_name" class="form-control" value="<?= htmlspecialchars($student_data['student_name']) ?>" required>
        </div>
        <div class="mb-3">
            <label for="department" class="form-label">系所</label>
            <input type="text" name="department" class="form-control" value="<?= htmlspecialchars($student_data['department']) ?>">
        </div>
        <div class="mb-3">
            <label for="grade" class="form-label">年級</label>
            <input type="text" name="grade" class="form-control" value="<?= htmlspecialchars($student_data['grade']) ?>">
        </div>
        <div class="mb-3">
            <label for="phone" class="form-label">聯絡電話</label>
            <input type="text" name="phone" class="form-control" value="<?= htmlspecialchars($student_data['phone']) ?>">
        </div>
        <div class="mb-3">
            <label for="email" class="form-label">電子郵件</label>
            <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($student_data['email']) ?>">
        </div>
        <button type="submit" class="btn btn-primary">儲存變更</button>
        <a href="student_dashboard.php" class="btn btn-secondary">返回</a>
    </form>
</div>
</body>
</html>
