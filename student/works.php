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
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
  <link rel="stylesheet" href="../css/works.css?v=3">
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>

<div class="container-fluid">
  <div class="row">
      <!-- 側邊欄 -->
    <nav class="col-auto col-md-3 col-lg-2 sidebar bg-light py-4">
        <ul class="nav nav-pills flex-column text-center">
            <li class="nav-item">
               <a href="student_dashboard_view.php" class="nav-link text-gray">
                  <i class="bi bi-house fs-4 d-block"></i>
                  <strong>個人主頁</strong>
               </a>
            </li>
            <li class="nav-item">
                <a href="student_file_category.php" class="nav-link active">
                    <i class="bi bi-collection fs-4 d-block"></i>
                    <strong>作品集</strong>
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link text-gray">
                  <i class="bi bi-bell fs-4 d-block"></i>
                  <strong>通知</strong>
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link text-gray">
                  <i class="bi bi-gear fs-4 d-block"></i>
                  <strong>設定</strong>
                </a>
            </li>
            <li class="nav-item">
                <a href="../login.html" class="nav-link text-gray">
                  <i class="bi bi-box-arrow-right fs-4 d-block"></i>
                  <strong>登出</strong>
                </a>
            </li>
        </ul>
    </nav>

      <!-- 主內容 -->
      <div class="col py-3 main-content">
        <!-- 搜尋列 -->
        <div class="mb-4 position-relative">
          <input type="text" class="form-control ps-5 rounded-pill" placeholder="搜尋作品..." id="search">
          <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-primary"></i>
        </div>

        <!-- 按鈕區 -->
        <div class="mb-4 d-flex justify-content-between align-items-center">
          <div class="d-flex gap-2">
            <a href="student_file_category.php" class="btn btn-outline-secondary">分類</a>
            <a href="works.php" class="btn btn-primary">全部作品</a>
          </div>
          <button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addPortfolioModal">
            ＋ 新增作品
          </button>
        </div>

        <!-- 卡片列表 -->
        <div class="row g-4" id="portfolio-list">
            <!-- 作品卡片將由 JavaScript 動態生成 -->
        </div>

        <!-- 分頁 -->
        <nav aria-label="Page navigation" class="mt-4">
          <ul class="pagination justify-content-center">
              <!-- 分頁將由 JavaScript 動態生成 -->
          </ul>
        </nav>
      </div>
    </div>
  </div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="../js/works.js?v=<?php echo time(); ?>"></script>

<!-- 新增作品 Modal -->
<div class="modal fade" id="addPortfolioModal" tabindex="-1" aria-labelledby="addPortfolioModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="addPortfolioModalLabel">新增作品</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
            </div>
            <div class="modal-body">
                <form id="addPortfolioForm" enctype="multipart/form-data">
                    <div class="mb-3">
                        <label for="category_id" class="form-label">選擇分類</label>
                        <select class="form-select" id="category_id" name="category_id" required>
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
                    </div>
                    <div class="mb-3">
                        <label for="title" class="form-label">作品標題</label>
                        <input type="text" class="form-control" id="title" name="title" required>
                    </div>
                    <div class="mb-3">
                        <label for="description" class="form-label">作品描述</label>
                        <textarea class="form-control" id="description" name="description" rows="4" required></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="cover_image" class="form-label">封面圖片</label>
                        <input class="form-control" type="file" id="cover_image" name="cover_image" accept="image/*">
                    </div>
                    <div class="mb-3">
                        <label for="project_files" class="form-label">作品檔案（可多選）</label>
                        <input class="form-control" type="file" id="project_files" name="project_files[]" multiple>
                        <small class="text-muted">可以上傳多個檔案，例如：程式碼、文件、壓縮檔等</small>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="button" class="btn btn-primary" id="submitPortfolio">新增</button>
            </div>
        </div>
    </div>
</div>
</body>
</html>