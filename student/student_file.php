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
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="../css/student_file_category.css?v=2<?php echo time(); ?>" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="d-flex min-vh-100">
        <!-- 側邊欄 -->
         
        <nav class="d-flex flex-column bg-secondary text-white p-3" shadow">
            <a href="student_dashboard_view.php" class="d-flex align-items-center gap-2 nav-link px-3 py-2">
                <i class="fas fa-user-circle"></i>
                <span class="sidebar-label">主頁</span>
            </a>
            <a href="student_file.php" class="text-white text-center bg-primary rounded mb-3">
                <i class="fas fa-folder fs-4"></i>
                <span class="sidebar-label">作品集</span>
            </a>
            <a href="#" class="text-white text-center mb-3">
                <i class="fas fa-bell fs-4"></i>
                <span class="sidebar-label">通知</span>
            </a>
            <a href="#" class="text-white text-center mb-3">
                <i class="fas fa-cog fs-4"></i>
                <span class="sidebar-label">設定</span>
            </a>
            <a href="../login.html" class="text-white text-center">
                <i class="fas fa-sign-out-alt fs-4"></i>
                <span class="sidebar-label">登出</span>
            </a>
        </nav>

        <!-- 主內容區域 -->
        <main class="flex-grow-1 p-4">
            <!-- 搜尋欄 -->
            <div class="input-group mb-4">
                <span class="input-group-text"><i class="fas fa-search"></i></span>
                <input type="text" class="form-control" id="search" placeholder="搜尋分類...">
            </div>

            <!-- 按鈕列 -->
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <a href="student_file.php" class="btn btn-outline-secondary me-2">分類</a>
                    <a href="works.php" class="btn btn-primary">全部作品</a>
                </div>
                <button class="btn btn-success" onclick="document.getElementById('addCategoryModal').classList.remove('d-none')">
                    <i class="fas fa-plus me-2"></i>新增分類
                </button>
            </div>

            <!-- 分類卡片區 -->
            <div class="row g-4" id="category-list">
                <!-- JavaScript 生成卡片 -->
            </div>

            <!-- 分頁 -->
            <nav class="mt-4 d-flex justify-content-center" aria-label="Page navigation">
                <ul class="pagination" id="pagination">
                    <!-- JavaScript 生成分頁 -->
                </ul>
            </nav>
        </main>
    </div>

    <!-- Modal：新增分類 -->
    <div id="addCategoryModal" class="d-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center">
        <div class="bg-white rounded shadow p-4" style="width: 400px;">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">新增分類</h5>
                <button type="button" class="btn-close" onclick="document.getElementById('addCategoryModal').classList.add('d-none')"></button>
            </div>
            <form action="add_category.php" method="POST" enctype="multipart/form-data">
                <div class="mb-3">
                    <label for="name" class="form-label">分類名稱</label>
                    <input type="text" class="form-control" id="name" name="name" required>
                </div>
                <div class="mb-3">
                    <label for="description" class="form-label">描述</label>
                    <textarea class="form-control" id="description" name="description" rows="3"></textarea>
                </div>
                <div class="mb-3">
                    <label for="image" class="form-label">上傳圖片</label>
                    <input class="form-control" type="file" id="image" name="image" accept="image/*">
                </div>
                <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-secondary me-2" onclick="document.getElementById('addCategoryModal').classList.add('d-none')">取消</button>
                    <button type="submit" class="btn btn-primary">儲存</button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../js/student_file_category.js?v=<?php echo time(); ?>"></script>
</body>
</html>
