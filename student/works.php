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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>作品集 - 全部作品</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="../css/works.css?v=2<?php echo time(); ?>" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="d-flex min-vh-100">
        <!-- 側邊欄 -->
        <nav class="d-flex flex-column bg-secondary text-white p-3 shadow">
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

        <!-- 右側主內容 -->
        <main class="flex-grow-1 p-4">
            <!-- 搜尋列 -->
            <div class="input-group mb-4">
                <span class="input-group-text"><i class="fas fa-search"></i></span>
                <input type="text" class="form-control" id="search" placeholder="搜尋作品...">
            </div>

            <!-- 按鈕區 -->
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <a href="student_file.php" class="btn btn-outline-secondary me-2">分類</a>
                    <a href="works.php" class="btn btn-primary">全部作品</a>
                </div>
                <button class="btn btn-success"
                        onclick="document.getElementById('addPortfolioModal').classList.remove('d-none')">
                    <i class="fas fa-plus me-2"></i>新增作品
                </button>
            </div>

            <!-- 卡片列表 -->
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4" id="portfolio-list">
                <!-- 作品卡片將由 JavaScript 動態生成 -->
            </div>

            <!-- 分頁 -->
            <nav class="mt-4 d-flex justify-content-center" aria-label="Page navigation">
                <ul class="pagination" id="pagination">
                    <!-- 分頁將由 JavaScript 動態生成 -->
                </ul>
            </nav>
        </main>
    </div>

    <!-- 新增作品 Modal -->
    <div id="addPortfolioModal" class="d-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center">
        <div class="bg-white rounded shadow p-4" style="width: 600px;">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">新增作品</h5>
                <button type="button" class="btn-close" onclick="document.getElementById('addPortfolioModal').classList.add('d-none')"></button>
            </div>
            <form id="addPortfolioForm" enctype="multipart/form-data" novalidate>
                <div class="mb-3">
                    <label for="category_id" class="form-label">選擇分類 <span class="text-danger">*</span></label>
                    <select id="category_id" name="category_id" required class="form-select">
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
                    <div class="invalid-feedback">請選擇作品分類</div>
                </div>

                <div class="mb-3">
                    <label for="title" class="form-label">作品標題 <span class="text-danger">*</span></label>
                    <input type="text" id="title" name="title" required minlength="2" maxlength="100" placeholder="請輸入作品標題（2-100字）" class="form-control">
                    <div class="invalid-feedback">請輸入作品標題（2-100字）</div>
                </div>

                <div class="mb-3">
                    <label for="description" class="form-label">作品描述 <span class="text-danger">*</span></label>
                    <textarea id="description" name="description" rows="4" required minlength="10" maxlength="1000" placeholder="請輸入作品描述（10-1000字）" class="form-control"></textarea>
                    <div class="invalid-feedback">請輸入作品描述（10-1000字）</div>
                </div>

                <div class="mb-3">
                    <label for="cover_image" class="form-label">封面圖片</label>
                    <input type="file" id="cover_image" name="cover_image" accept="image/jpeg,image/png,image/gif,image/webp" class="form-control">
                    <div class="form-text">支援 JPG、PNG、GIF、WEBP 格式，檔案大小不超過 5MB</div>
                    <div class="invalid-feedback">請選擇正確的圖片格式，且檔案大小不超過 5MB</div>
                </div>

                <div class="mb-3">
                    <label for="project_files" class="form-label">作品檔案（可多選）</label>
                    <input type="file" id="project_files" name="project_files[]" multiple class="form-control">
                    <div class="form-text">可以上傳多個檔案，每個檔案大小不超過 10MB</div>
                    <div class="invalid-feedback">檔案大小不能超過 10MB</div>
                </div>

                <div class="d-flex justify-content-end gap-2">
                    <button type="button" onclick="document.getElementById('addPortfolioModal').classList.add('d-none')" class="btn btn-secondary">
                        取消
                    </button>
                    <button type="submit" class="btn btn-primary">
                        新增
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../js/works.js?v=<?php echo time(); ?>"></script>
</body>
</html>