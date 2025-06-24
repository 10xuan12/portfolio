<?php
// 資料庫連線
session_start(); // 開啟 session
require '../includes/db_connect.php'; // 資料庫連線

// 查詢所有分類
$category_sql = "SELECT * FROM categories";
$category_result = $conn->query($category_sql);
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>作品集分類管理</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
</head>
<body class="bg-gray-50">
    <div class="flex min-h-screen">
        <!-- 左側欄 -->
        <nav class="flex flex-col items-center bg-gray-300 w-14 py-6 space-y-6 shadow-md border-r">
            <!-- 主頁 -->
            <a href="student_dashboard_view.php" class="flex flex-col items-center w-14 h-14 justify-center text-black hover:bg-gray-400">
                <i class="fas fa-user-circle text-xl"></i>
                <span class="text-xs mt-1">主頁</span>
            </a>

            <!-- 作品集 -->
            <a href="student_file_category.php" class="flex flex-col items-center w-14 h-14 justify-center text-white bg-blue-700">
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
            <!-- 搜尋列 -->
            <div class="mb-6 relative">
                <input type="text" 
                       class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                       placeholder="搜尋分類..." 
                       id="search">
                <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>

            <!-- 分類按鈕 -->
            <div class="mb-6 flex flex-wrap items-center gap-4">
                <div class="flex gap-2">
                    <a href="student_file_category.php" 
                       class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        分類
                    </a>
                    <a href="works.php" 
                       class="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        全部作品
                    </a>
                </div>
                <button class="ml-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        onclick="document.getElementById('addCategoryModal').classList.remove('hidden')">
                    <i class="fas fa-plus mr-2"></i>
                    新增分類
                </button>
            </div>

            <!-- 卡片列表 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="category-list">
                <!-- 分類卡片將由 JavaScript 動態生成 -->
            </div>

            <!-- 分頁 -->
            <nav class="mt-8 flex justify-center" aria-label="Page navigation">
                <ul class="inline-flex items-center -space-x-px" id="pagination">
                    <!-- 分頁將由 JavaScript 動態生成 -->
                </ul>
            </nav>
        </main>
    </div>

    <!-- 新增分類 Modal -->
    <div id="addCategoryModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">新增分類</h3>
                <button onclick="document.getElementById('addCategoryModal').classList.add('hidden')"
                        class="text-gray-400 hover:text-gray-500">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form action="add_category.php" method="POST" enctype="multipart/form-data" class="space-y-4">
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-1">分類名稱</label>
                    <input type="text" id="name" name="name" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label for="description" class="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea id="description" name="description" rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                <div>
                    <label for="image" class="block text-sm font-medium text-gray-700 mb-1">上傳圖片</label>
                    <input type="file" id="image" name="image" accept="image/*"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div class="flex justify-end gap-3 pt-4">
                    <button type="button" 
                            onclick="document.getElementById('addCategoryModal').classList.add('hidden')"
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        取消
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        儲存
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="../js/student_file_category.js?v=<?php echo time(); ?>"></script>
</body>
</html>
