<?php 
session_start();
require '../includes/db_connect.php';

if (!isset($_SESSION['email'])) {
    header("Location: /portfolio/login.php");
    exit();
}

$email = $_SESSION['email'];
$sql = "SELECT * FROM student_profiles WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $student_data = $result->fetch_assoc();
    $required_fields = ['name', 'email'];
    foreach ($required_fields as $field) {
        if (empty($student_data[$field])) {
            header("Location: /portfolio/student/student.php?need_info=1");
            exit();
        }
    }
} else {
    header("Location: /portfolio/student/student.php?need_info=1");
    exit();
}
$conn->close();
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <title>學生主頁</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-white font-sans">
    <div class="flex min-h-screen">
        <!-- 左側欄 -->
        <nav class="flex flex-col items-center bg-gray-300 w-14 py-6 space-y-6 shadow-md border-r">
            <!-- 主頁 -->
            <a href="student_dashboard_view.php" class="flex flex-col items-center w-14 h-14 justify-center text-white bg-blue-700">
                <i class="fas fa-user-circle text-xl"></i>
                <span class="text-xs mt-1">主頁</span>
            </a>

            <!-- 作品集 -->
            <a href="student_file.php" class="flex flex-col items-center w-14 h-14 justify-center text-black hover:bg-gray-400">
                <i class="fas fa-folder text-xl"></i>
                <span class="text-xs mt-1">作品集</span>
            </a>

            <!-- 通知 -->
            <a href="#" class="flex flex-col items-center w-14 h-14 justify-center text-black hover:bg-gray-400">
                <i class="fas fa-bell text-xl"></i>
                <span class="text-xs mt-1">通知</span>
            </a>

            <!-- 設定 -->
            <a href="#" class="flex flex-col items-center w-14 h-14 justify-center text-black hover:bg-gray-400">
                <i class="fas fa-cog text-xl"></i>
                <span class="text-xs mt-1">設定</span>
            </a>

            <!-- 登出 -->
            <a href="../login.html" class="flex flex-col items-center w-14 h-14 justify-center text-black hover:bg-gray-400">
                <i class="fas fa-sign-out-alt text-xl"></i>
                <span class="text-xs mt-1">登出</span>
            </a>
        </nav>

        <!-- 右側主內容 -->
        <main class="flex-1 p-6 overflow-y-auto">
            <?php if (isset($_GET['saved']) && $_GET['saved'] == 1): ?>
                <div class="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-center" id="successMessage">
                    ✅ 資料儲存成功！
                </div>
            <?php elseif (isset($_GET['need_info']) && $_GET['need_info'] == 1): ?>
                <div class="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-lg text-center" id="warningMessage">
                    ⚠️ 尚未填寫完整資料，請先完成基本資料填寫。
                </div>
            <?php endif; ?>

            <!-- 基本資料卡 -->
            <div class="flex items-start space-x-6 mb-6">
                <div>
                    <?php if (!empty($student_data['profile_picture'])): ?>
                        <img src="uploads/<?php echo htmlspecialchars($student_data['profile_picture']); ?>" 
                             alt="頭像" 
                             class="w-24 h-24 rounded-full object-cover border-2 border-gray-300 shadow-md">
                    <?php else: ?>
                        <img src="https://via.placeholder.com/120" 
                             alt="預設頭像" 
                             class="w-24 h-24 rounded-full object-cover border-2 border-gray-300 shadow-md">
                    <?php endif; ?>
                </div>
                <div class="flex-1">
                    <h2 class="text-lg font-bold mb-1">
                        <?php echo htmlspecialchars($student_data['name']); ?>
                    </h2>
                    <p class="text-sm text-gray-600 mb-2">
                        <?php echo htmlspecialchars($student_data['department']); ?> | 
                        <?php echo htmlspecialchars($student_data['address']); ?>
                    </p>
                    <a href="student_edit_form.php" 
                       class="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2 px-4 rounded">
                        <i class="fas fa-edit"></i>
                        <span>編輯</span>
                    </a>
                </div>
            </div>

            <!-- 個人簡介 -->
            <div class="mb-6">
                <h3 class="text-base font-semibold mb-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg inline-block">
                    個人簡介
                </h3>
                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p class="text-gray-700">
                        <?php echo nl2br(htmlspecialchars($student_data['bio'] ?? '尚未填寫個人簡介')); ?>
                    </p>
                </div>
            </div>

            <!-- 聯絡資訊 -->
            <div class="mb-6">
                <h3 class="text-base font-semibold mb-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg inline-block">
                    聯絡方式與社群
                </h3>
                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center space-x-2">
                        <i class="fab fa-github text-gray-600"></i>
                        <span class="text-gray-700"><?php echo htmlspecialchars($student_data['github']); ?></span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <i class="fab fa-instagram text-gray-600"></i>
                        <span class="text-gray-700"><?php echo htmlspecialchars($student_data['instagram']); ?></span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <i class="fab fa-facebook text-gray-600"></i>
                        <span class="text-gray-700"><?php echo htmlspecialchars($student_data['facebook']); ?></span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-envelope text-gray-600"></i>
                        <span class="text-gray-700"><?php echo htmlspecialchars($student_data['email']); ?></span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-phone text-gray-600"></i>
                        <span class="text-gray-700"><?php echo htmlspecialchars($student_data['phone']); ?></span>
                    </div>
                </div>
            </div>

            <!-- 專業背景 -->
            <div>
                <h3 class="text-base font-semibold mb-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg inline-block">
                    專業背景
                </h3>
                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div class="space-y-2">
                        <p class="text-gray-700">
                            <span class="font-semibold">技能：</span>
                            <?php echo htmlspecialchars($student_data['skills']); ?>
                        </p>
                        <p class="text-gray-700">
                            <span class="font-semibold">語言能力：</span>
                            <?php echo htmlspecialchars($student_data['languages']); ?>
                        </p>
                        <p class="text-gray-700">
                            <span class="font-semibold">最高學歷：</span>
                            <?php echo htmlspecialchars($student_data['school']); ?>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        // 自動消失的提示框效果
        setTimeout(function () {
            var alerts = document.querySelectorAll('#successMessage, #warningMessage');
            alerts.forEach(function(alert) {
                if (alert) {
                    alert.style.opacity = '0';
                    alert.style.transition = 'opacity 1s';
                    setTimeout(function () {
                        alert.remove();
                    }, 1000);
                }
            });
        }, 5000);
    </script>
</body>
</html>
