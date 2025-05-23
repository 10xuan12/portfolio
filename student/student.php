<?php
// 先檢查是否有傳遞 'need_info' 參數
if (isset($_GET['need_info'])) {
    $show_message = true;
} else {
    $show_message = false;
}
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>學生基本資料填寫</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <div class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto">
            <h2 class="text-2xl font-bold text-center text-gray-900 mb-8">學生基本資料填寫</h2>

            <?php if ($show_message): ?>
            <div class="mb-6 p-4 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-between" id="infoMessage">
                <div class="flex items-center">
                    <i class="fas fa-info-circle mr-2"></i>
                    <span>請先填寫您的個人資料～</span>
                </div>
                <button type="button" class="text-blue-700 hover:text-blue-900" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <?php endif; ?>

            <form id="studentForm" method="POST" action="submit_student.php" enctype="multipart/form-data" 
                  class="bg-white shadow-sm rounded-lg p-6 space-y-6">
                <!-- 基本資料區塊 -->
                <div class="space-y-6">
                    <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">基本資料</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                            <input type="text" id="name" name="name" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        
                        <div>
                            <label for="gender" class="block text-sm font-medium text-gray-700 mb-1">性別</label>
                            <select id="gender" name="gender" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                <option value="男">男</option>
                                <option value="女">女</option>
                                <option value="其他">其他</option>
                            </select>
                        </div>

                        <div>
                            <label for="birth" class="block text-sm font-medium text-gray-700 mb-1">生日</label>
                            <input type="date" id="birth" name="birth" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div>
                            <label for="student_id" class="block text-sm font-medium text-gray-700 mb-1">學號</label>
                            <input type="text" id="student_id" name="student_id" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div>
                            <label for="department" class="block text-sm font-medium text-gray-700 mb-1">科系</label>
                            <select id="department" name="department" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                <option value="資訊管理學系">資訊管理學系</option>
                                <option value="財務金融學系">財務金融學系</option>
                                <option value="國際企業學系">國際企業學系</option>
                            </select>
                        </div>

                        <div>
                            <label for="grade" class="block text-sm font-medium text-gray-700 mb-1">年級</label>
                            <select id="grade" name="grade" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                <option value="大學三年級">大學三年級</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 聯絡資訊區塊 -->
                <div class="space-y-6">
                    <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">聯絡資訊</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
                            <input type="tel" id="phone" name="phone" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                            <input type="email" id="email" name="email" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div class="md:col-span-2">
                            <label for="address" class="block text-sm font-medium text-gray-700 mb-1">聯絡地址</label>
                            <input type="text" id="address" name="address" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    </div>
                </div>

                <!-- 社群媒體區塊 -->
                <div class="space-y-6">
                    <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">社群媒體</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="github" class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fab fa-github mr-2"></i>GitHub
                            </label>
                            <input type="url" id="github" name="github"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div>
                            <label for="instagram" class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fab fa-instagram mr-2"></i>Instagram
                            </label>
                            <input type="text" id="instagram" name="instagram"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div>
                            <label for="facebook" class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fab fa-facebook mr-2"></i>Facebook
                            </label>
                            <input type="text" id="facebook" name="facebook"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    </div>
                </div>

                <!-- 專業資訊區塊 -->
                <div class="space-y-6">
                    <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">專業資訊</h3>
                    
                    <div class="space-y-6">
                        <div>
                            <label for="bio" class="block text-sm font-medium text-gray-700 mb-1">個人簡介</label>
                            <textarea id="bio" name="bio" rows="3"
                                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                        </div>

                        <div>
                            <label for="background" class="block text-sm font-medium text-gray-700 mb-1">專業背景</label>
                            <input type="text" id="background" name="background"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div>
                            <label for="skills" class="block text-sm font-medium text-gray-700 mb-1">技能</label>
                            <input type="text" id="skills" name="skills"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div>
                            <label for="languages" class="block text-sm font-medium text-gray-700 mb-1">語言能力</label>
                            <input type="text" id="languages" name="languages"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div>
                            <label for="school" class="block text-sm font-medium text-gray-700 mb-1">畢業學校</label>
                            <input type="text" id="school" name="school"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    </div>
                </div>

                <!-- 頭像上傳 -->
                <div class="space-y-6">
                    <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">個人照片</h3>
                    
                    <div>
                        <label for="profile_picture" class="block text-sm font-medium text-gray-700 mb-1">上傳頭像</label>
                        <input type="file" id="profile_picture" name="profile_picture" accept="image/*"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <p class="mt-1 text-sm text-gray-500">建議上傳正方形圖片，大小不超過 2MB</p>
                    </div>
                </div>

                <!-- 提交按鈕 -->
                <div class="flex justify-center pt-4">
                    <button type="submit" 
                            class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <i class="fas fa-save mr-2"></i>
                        提交資料
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // 自動消失的提示框效果
        setTimeout(function () {
            var alert = document.getElementById('infoMessage');
            if (alert) {
                alert.style.opacity = '0';
                alert.style.transition = 'opacity 1s';
                setTimeout(function () {
                    alert.remove();
                }, 1000);
            }
        }, 5000);
    </script>
</body>
</html>
