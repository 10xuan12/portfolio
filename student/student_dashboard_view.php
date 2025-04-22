<?php
session_start();
require('../includes/db_connect.php');

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION["role"]) || $_SESSION["role"] !== 'student') {
    echo "您尚未登入或權限不足，請重新登入。";
    exit;
}

$student_id = $_SESSION['student_id'];
$student_data = null;

$sql = "SELECT * FROM student_profiles WHERE student_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $student_data = $result->fetch_assoc();
}

if ($result->num_rows === 0) {
    header("Location: student.php?need_info=1");
    exit;
}
?>


<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>學生主頁</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Bootstrap + Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        .profile-card {
            border-radius: 20px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .avatar {
            width: 150px;
            height: 150px;
            object-fit: cover;
            border-radius: 50%;
            border: 3px solid #0d6efd;
            margin-bottom: 1rem;
        }
        .btn-edit {
            border-radius: 30px;
        }
    </style>
</head>
<body class="bg-light">

<div class="container py-5">
    <h2 class="text-center text-primary mb-5">🎓 學生個人資料頁面</h2>

    <?php if ($student_data): ?>
        <div class="card profile-card p-4 mx-auto" style="max-width: 600px;">
            <div class="text-center">
                <!-- 頭像區塊：若無圖片則使用預設 -->
                <?php if (!empty($student_data['avatar'])): ?>
                    <img src="../uploads/<?php echo htmlspecialchars($student_data['avatar']); ?>" alt="頭像" class="avatar">
                <?php else: ?>
                    <img src="https://via.placeholder.com/150x150.png?text=Avatar" alt="預設頭像" class="avatar">
                <?php endif; ?>
                <h4 class="mt-3"><?php echo htmlspecialchars($student_data['student_name']); ?></h4>
                <p class="text-muted">學號：<?php echo htmlspecialchars($student_data['student_id']); ?></p>
            </div>
            <hr>
            <div>
                <p><i class="bi bi-buildings"></i> 系所：<?php echo htmlspecialchars($student_data['department']); ?></p>
                <p><i class="bi bi-mortarboard-fill"></i> 年級：<?php echo htmlspecialchars($student_data['grade']); ?></p>
                <p><i class="bi bi-telephone"></i> 電話：<?php echo htmlspecialchars($student_data['phone']); ?></p>
                <p><i class="bi bi-envelope"></i> 信箱：<?php echo htmlspecialchars($student_data['email']); ?></p>
            </div>
            <div class="text-center mt-4">
                <a href="student_edit_form.php" class="btn btn-outline-primary btn-edit px-4">
                    <i class="bi bi-pencil-square"></i> 修改資料
                </a>
            </div>
        </div>
    <?php else: ?>
        <p class="text-danger text-center">找不到資料，請確認您的帳號是否正確。</p>
    <?php endif; ?>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
