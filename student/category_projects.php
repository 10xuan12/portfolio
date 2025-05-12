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
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <link href="../css/category_projects.css?v=4" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <!-- 加入 animate.css -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
</head>
<body>
<div class="container-fluid p-0">
  <div class="row g-0">
    <!-- 側邊欄 -->
    <div class="col-auto">  
      <nav class="sidebar">
        <ul class="nav nav-pills flex-column">
          <li class="nav-item">
            <a href="student_dashboard_view.php" class="nav-link">
                <i class="bi bi-house fs-4 d-block"></i>
                <span>個人主頁</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="student_file_category.php" class="nav-link active">
                <i class="bi bi-collection fs-4 d-block"></i>
                <span>作品集</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">
                <i class="bi bi-bell fs-4 d-block"></i>
                <span>通知</span>
                </a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">
                <i class="bi bi-gear fs-4 d-block"></i>
                <span>設定</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="../login.html" class="nav-link">
                <i class="bi bi-box-arrow-right fs-4 d-block"></i>
                <strong>登出</strong>
            </a>
          </li>
        </ul>
     </nav>
    </div>
        <!-- 主內容 -->
    <div class="col content">
        <!-- 分類資訊 -->
        <div class="card mb-4 shadow-sm">
            <div class="row g-0">
                <div class="col-md-4">
                    <?php if (!empty($category['image'])): ?>
                        <img src="uploads/<?php echo htmlspecialchars($category['image']); ?>" class="img-fluid rounded-start" alt="分類圖片">
                    <?php else: ?>
                        <div class="bg-secondary text-white d-flex align-items-center justify-content-center" style="height: 100%; min-height: 150px;">
                            無分類圖片
                        </div>
                    <?php endif; ?>
                </div>
                <div class="col-md-8 d-flex flex-column justify-content-center p-3">
                    <h4><?php echo htmlspecialchars($category['name']); ?></h4>
                    <h6 class="text-muted">分類介紹</h6>
                    <p class="text-muted">
                        <?php echo !empty($category['description']) ? htmlspecialchars($category['description']) : '尚未填寫分類說明'; ?>
                    </p>
                </div>
            </div>
        </div>

        <!-- 新增作品按鈕 -->
        <div class="text-end mb-3">
            <button type="button" class="btn btn-primary rounded-pill" data-bs-toggle="modal" data-bs-target="#addPortfolioModal">
                ＋ 新增作品
            </button>
        </div>

        <!-- 作品列表 -->
        <input type="hidden" id="category-id" value="<?php echo $category_id; ?>">
        <div class="portfolio-list">
            <?php if ($portfolio_result->num_rows > 0): ?>
                <?php while($portfolio = $portfolio_result->fetch_assoc()): ?>
                    <div class="card mb-3 shadow-sm">
                        <div class="row g-0">
                            <div class="col-md-2 d-flex align-items-center justify-content-center">
                                <?php if (!empty($portfolio['cover_image'])): ?>
                                    <img src="uploads/<?php echo htmlspecialchars($portfolio['cover_image']); ?>" class="img-fluid rounded" alt="作品封面" style="max-height: 100px;">
                                <?php else: ?>
                                    <div class="bg-light text-muted d-flex align-items-center justify-content-center" style="height: 100px; width: 100px;">
                                        無封面
                                    </div>
                                <?php endif; ?>
                            </div>
                            <div class="col-md-8 d-flex flex-column justify-content-center p-3">
                                <h5><?php echo htmlspecialchars($portfolio['title']); ?></h5>
                                <p class="text-muted"><?php echo htmlspecialchars($portfolio['description']); ?></p>
                            </div>
                            <div class="col-md-2 d-flex flex-column justify-content-center align-items-center gap-2">
                                <a href="work_detail.php?portfolio_id=<?php echo $portfolio['portfolio_id']; ?>" class="btn btn-primary btn-sm">查看</a>
                                <a href="edit_portfolio.php?id=<?php echo $portfolio['portfolio_id']; ?>" class="btn btn-outline-secondary btn-sm">編輯</a>
                            </div>
                        </div>
                    </div>
                <?php endwhile; ?>
            <?php else: ?>
                <p class="text-muted text-center">這個分類還沒有任何作品。</p>
            <?php endif; ?>
        </div>

        <!-- 分頁 -->
        <nav aria-label="Page navigation">
            <ul class="pagination justify-content-center">
                <!-- 分頁將由 JavaScript 動態生成 -->
            </ul>
        </nav>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="../js/category_projects.js"></script>

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
                    <input type="hidden" name="category_id" value="<?php echo $category_id; ?>">
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
