<?php
session_start();
require '../includes/db_connect.php';

if (!isset($_SESSION['email'])) {
    header("Location: ../login.php");
    exit();
}

$email = $_SESSION['email'];
$sql = "SELECT * FROM student_profiles WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
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
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <title>編輯學生資料</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto">
            <div class="flex items-center justify-between mb-8">
                <h2 class="text-2xl font-bold text-gray-900">
                    <i class="fas fa-edit mr-2"></i>編輯個人資料
                </h2>
                <a href="student_dashboard_view.php" 
                   class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <i class="fas fa-arrow-left mr-2"></i>
                    返回
                </a>
            </div>

            <form action="student_update.php" method="POST" enctype="multipart/form-data" 
                  class="bg-white shadow-sm rounded-lg p-6 space-y-6">
                <!-- 基本資料區塊 -->
                <div class="space-y-6">
                    <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">基本資料</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                            <input type="text" id="name" name="name" required
                                   value="<?= htmlspecialchars($student_data['name']) ?>"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div>
                            <label for="department" class="block text-sm font-medium text-gray-700 mb-1">系所</label>
                            <input type="text" id="department" name="department"
                                   value="<?= htmlspecialchars($student_data['department']) ?>"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div>
                            <label for="grade" class="block text-sm font-medium text-gray-700 mb-1">年級</label>
                            <input type="text" id="grade" name="grade"
                                   value="<?= htmlspecialchars($student_data['grade']) ?>"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div>
                            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
                            <input type="tel" id="phone" name="phone"
                                   value="<?= htmlspecialchars($student_data['phone']) ?>"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                            <input type="email" id="email" name="email"
                                   value="<?= htmlspecialchars($student_data['email']) ?>"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    </div>
                </div>

                <!-- 頭像區塊 -->
                <div class="space-y-6">
                    <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">個人照片</h3>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">目前頭像</label>
                            <?php if (!empty($student_data['profile_picture'])): ?>
                                <img src="uploads/<?= htmlspecialchars($student_data['profile_picture']) ?>" 
                                     alt="頭像" 
                                     class="w-32 h-32 rounded-full object-cover border-2 border-gray-300 shadow-sm">
                            <?php else: ?>
                                <div class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                                    <i class="fas fa-user text-gray-400 text-4xl"></i>
                                </div>
                            <?php endif; ?>
                        </div>

                        <div>
                            <label for="profile_picture" class="block text-sm font-medium text-gray-700 mb-1">上傳新頭像</label>
                            <input type="file" id="profile_picture" name="profile_picture" accept="image/*"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            <p class="mt-1 text-sm text-gray-500">建議上傳正方形圖片，大小不超過 2MB</p>
                        </div>
                    </div>
                </div>

                <!-- 提交按鈕 -->
                <div class="flex justify-end pt-4">
                    <button type="submit" 
                            class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <i class="fas fa-save mr-2"></i>
                        儲存變更
                    </button>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
