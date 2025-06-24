<?php
session_start();
require '../includes/db_connect.php';

// 取得 category_id
$category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;

// 取得該分類資訊
$category_sql = "SELECT * FROM categories WHERE category_id = ?";
$stmt = $conn->prepare($category_sql);
$stmt->bind_param("i", $category_id);
$stmt->execute();
$category_result = $stmt->get_result();
$category = $category_result->fetch_assoc();

// 取得該分類的所有作品
$portfolio_sql = "SELECT * FROM portfolios WHERE category_id = ?";
$stmt2 = $conn->prepare($portfolio_sql);
$stmt2->bind_param("i", $category_id);
$stmt2->execute();
$portfolio_result = $stmt2->get_result();
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>分類細項 - 作品集</title>
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
            <!-- 分類資訊 -->
            <div class="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
                <div class="flex flex-col md:flex-row">
                    <div class="md:w-1/3">
                        <?php if (!empty($category['image'])): ?>
                            <img src="uploads/<?php echo htmlspecialchars($category['image']); ?>" 
                                 class="w-full h-48 object-cover" 
                                 alt="分類圖片">
                        <?php else: ?>
                            <div class="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                                無分類圖片
                            </div>
                        <?php endif; ?>
                    </div>
                    <div class="md:w-2/3 p-6 flex flex-col justify-center">
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">
                            <?php echo htmlspecialchars($category['name']); ?>
                        </h2>
                        <h3 class="text-lg font-medium text-gray-700 mb-2">分類介紹</h3>
                        <p class="text-gray-600">
                            <?php echo !empty($category['description']) ? htmlspecialchars($category['description']) : '尚未填寫分類說明'; ?>
                        </p>
                    </div>
                </div>
            </div>

            <!-- 新增作品按鈕 -->
            <div class="flex justify-end mb-6">
                <button type="button" 
                        onclick="document.getElementById('addPortfolioModal').classList.remove('hidden')"
                        class="px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <i class="fas fa-plus mr-2"></i>
                    新增作品
                </button>
            </div>

            <!-- 作品列表 -->
            <input type="hidden" id="category-id" value="<?php echo $category_id; ?>">
            <div class="space-y-4">
                <?php if ($portfolio_result->num_rows > 0): ?>
                    <?php while($portfolio = $portfolio_result->fetch_assoc()): ?>
                        <div class="bg-white rounded-lg shadow-md overflow-hidden">
                            <div class="flex flex-col md:flex-row">
                                <div class="md:w-1/6 p-4 flex items-center justify-center">
                                    <?php if (!empty($portfolio['cover_image'])): ?>
                                        <img src="uploads/<?php echo htmlspecialchars($portfolio['cover_image']); ?>" 
                                             class="w-24 h-24 object-cover rounded-lg" 
                                             alt="作品封面">
                                    <?php else: ?>
                                        <div class="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                            無封面
                                        </div>
                                    <?php endif; ?>
                                </div>
                                <div class="md:w-2/3 p-4 flex flex-col justify-center">
                                    <h3 class="text-xl font-semibold text-gray-900 mb-2">
                                        <?php echo htmlspecialchars($portfolio['title']); ?>
                                    </h3>
                                    <p class="text-gray-600 line-clamp-2">
                                        <?php echo htmlspecialchars($portfolio['description']); ?>
                                    </p>
                                </div>
                                <div class="md:w-1/6 p-4 flex flex-col items-center justify-center gap-2">
                                    <a href="work_detail.php?portfolio_id=<?php echo $portfolio['portfolio_id']; ?>" 
                                       class="w-full px-4 py-2 bg-blue-700 text-white text-center rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        查看
                                    </a>
                                    <a href="edit_portfolio.php?id=<?php echo $portfolio['portfolio_id']; ?>" 
                                       class="w-full px-4 py-2 border border-gray-300 text-gray-700 text-center rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        編輯
                                    </a>
                                </div>
                            </div>
                        </div>
                    <?php endwhile; ?>
                <?php else: ?>
                    <div class="text-center py-8">
                        <p class="text-gray-500">這個分類還沒有任何作品。</p>
                    </div>
                <?php endif; ?>
            </div>

            <!-- 分頁 -->
            <nav class="mt-8 flex justify-center" aria-label="Page navigation">
                <ul class="inline-flex items-center -space-x-px" id="pagination">
                    <!-- 分頁將由 JavaScript 動態生成 -->
                </ul>
            </nav>
        </main>
    </div>

    <!-- 新增作品 Modal -->
    <div id="addPortfolioModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">新增作品</h3>
                <button onclick="document.getElementById('addPortfolioModal').classList.add('hidden')"
                        class="text-gray-400 hover:text-gray-500">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="addPortfolioForm" enctype="multipart/form-data" class="space-y-4">
                <input type="hidden" name="category_id" value="<?php echo $category_id; ?>">
                <div>
                    <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                        作品標題 <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="title" name="title" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                        作品描述 <span class="text-red-500">*</span>
                    </label>
                    <textarea id="description" name="description" rows="4" required
                              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                <div>
                    <label for="cover_image" class="block text-sm font-medium text-gray-700 mb-1">
                        封面圖片
                    </label>
                    <input type="file" id="cover_image" name="cover_image" accept="image/*"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label for="project_files" class="block text-sm font-medium text-gray-700 mb-1">
                        作品檔案（可多選）
                    </label>
                    <input type="file" id="project_files" name="project_files[]" multiple
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <p class="mt-1 text-sm text-gray-500">可以上傳多個檔案，例如：程式碼、文件、壓縮檔等</p>
                </div>
                <div class="flex justify-end gap-3 pt-4">
                    <button type="button" 
                            onclick="document.getElementById('addPortfolioModal').classList.add('hidden')"
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        取消
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        新增
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="../js/category_projects.js"></script>
</body>
</html>
