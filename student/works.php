<?php
// 資料庫連線
session_start();
require '../includes/db_connect.php'; // 資料庫連線

// 取得所有作品資料
$search = $_GET['search'] ?? '';
$page = $_GET['page'] ?? 1;
$limit = 9; // 每頁顯示 9 個作品
$offset = ($page - 1) * $limit;

$portfolio_sql = "SELECT * FROM portfolios WHERE title LIKE ? OR description LIKE ? LIMIT ? OFFSET ?";
$stmt = $conn->prepare($portfolio_sql);
$search_param = "%" . $search . "%";
$stmt->bind_param("ssii", $search_param, $search_param, $limit, $offset);
$stmt->execute();
$portfolio_result = $stmt->get_result();

// 獲取總數據量
$total_sql = "SELECT COUNT(*) AS total FROM portfolios WHERE title LIKE ? OR description LIKE ?";
$total_stmt = $conn->prepare($total_sql);
$total_stmt->bind_param("ss", $search_param, $search_param);
$total_stmt->execute();
$total_result = $total_stmt->get_result();
$total = $total_result->fetch_assoc()['total'];
$total_pages = ceil($total / $limit);
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>作品集 - 全部作品</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
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
                       placeholder="搜尋作品..." 
                       id="search">
                <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>

            <!-- 按鈕區 -->
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
                        onclick="document.getElementById('addPortfolioModal').classList.remove('hidden')">
                    <i class="fas fa-plus mr-2"></i>
                    新增作品
                </button>
            </div>

            <!-- 卡片列表 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="portfolio-list">
                <!-- 作品卡片將由 JavaScript 動態生成 -->
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
            <form id="addPortfolioForm" enctype="multipart/form-data" class="space-y-4" novalidate>
                <div>
                    <label for="category_id" class="block text-sm font-medium text-gray-700 mb-1">
                        選擇分類 <span class="text-red-500">*</span>
                    </label>
                    <select id="category_id" name="category_id" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="">請選擇分類</option>
                        <?php
                        $category_sql = "SELECT * FROM categories ORDER BY name";
                        $category_result = $conn->query($category_sql);
                        while($category = $category_result->fetch_assoc()):
                        ?>
                        <option value="<?php echo $category['category_id']; ?>">
                            <?php echo htmlspecialchars($category['name']); ?>
                        </option>
                        <?php endwhile; ?>
                    </select>
                    <p class="mt-1 text-sm text-red-600 hidden">請選擇作品分類</p>
                </div>

                <div>
                    <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                        作品標題 <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="title" name="title" required 
                           minlength="2" maxlength="100" 
                           placeholder="請輸入作品標題（2-100字）"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <p class="mt-1 text-sm text-red-600 hidden">請輸入作品標題（2-100字）</p>
                </div>

                <div>
                    <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                        作品描述 <span class="text-red-500">*</span>
                    </label>
                    <textarea id="description" name="description" rows="4" required
                              minlength="10" maxlength="1000" 
                              placeholder="請輸入作品描述（10-1000字）"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                    <p class="mt-1 text-sm text-red-600 hidden">請輸入作品描述（10-1000字）</p>
                </div>

                <div>
                    <label for="cover_image" class="block text-sm font-medium text-gray-700 mb-1">
                        封面圖片
                    </label>
                    <input type="file" id="cover_image" name="cover_image" 
                           accept="image/jpeg,image/png,image/gif,image/webp"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <p class="mt-1 text-sm text-gray-500">支援 JPG、PNG、GIF、WEBP 格式，檔案大小不超過 5MB</p>
                    <p class="mt-1 text-sm text-red-600 hidden">請選擇正確的圖片格式，且檔案大小不超過 5MB</p>
                </div>

                <div>
                    <label for="project_files" class="block text-sm font-medium text-gray-700 mb-1">
                        作品檔案（可多選）
                    </label>
                    <input type="file" id="project_files" name="project_files[]" multiple
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <p class="mt-1 text-sm text-gray-500">可以上傳多個檔案，每個檔案大小不超過 10MB</p>
                    <p class="mt-1 text-sm text-red-600 hidden">檔案大小不能超過 10MB</p>
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

    <script src="../js/works.js?v=<?php echo time(); ?>"></script>
</body>
</html>