<?php 
session_start();
require '../includes/db_connect.php';  // 連接資料庫

// 登入驗證
if (!isset($_SESSION['email'])) {
    header("Location: /portfolio/login.php");  // 請根據實際路徑修改
    exit();
}

$email = $_SESSION['email'];
$student_data = null;

// 查詢學生資料
$sql = "SELECT * FROM student_profiles WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $student_data = $result->fetch_assoc();
    var_dump($student_data);
    header("Location: /portfolio/student/student_dashboard_view.php");
    exit();
} else {
    // 若資料為空，導向填寫資料頁面
    header("Location: /portfolio/student/student.php?need_info=1");
    exit();
}

$stmt->close();
$conn->close();
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
        .alert {
            transition: opacity 0.5s ease;
        }
    </style>
</head>
<body class="bg-light">

<div class="container py-5">
    <h2 class="text-center text-primary mb-4">🎓 學生個人資料頁面</h2>

    <!-- ✅ 提示訊息 -->
    <?php if (isset($_GET['saved']) && $_GET['saved'] == 1): ?>
        <div class="alert alert-success text-center" id="successMessage">
            ✅ 資料儲存成功！
        </div>
    <?php elseif (isset($_GET['need_info']) && $_GET['need_info'] == 1): ?>
        <div class="alert alert-warning text-center" id="warningMessage">
            ⚠️ 尚未填寫完整資料，請先完成基本資料填寫。
        </div>
    <?php endif; ?>

    <!-- 🧾 資料卡片 -->
    <div class="card profile-card p-4 mx-auto" style="max-width: 600px;">
        <div class="text-center">
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
</div>

<!-- Bootstrap & 自動隱藏提示 -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
    // 3 秒後淡出提示訊息
    setTimeout(() => {
        const success = document.getElementById('successMessage');
        const warning = document.getElementById('warningMessage');
        if (success) success.style.opacity = 0;
        if (warning) warning.style.opacity = 0;
    }, 3000);
</script>
</body>
</html>
