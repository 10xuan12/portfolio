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
            <a href="create_portfolio.php?category_id=<?php echo $category_id; ?>" class="btn btn-primary rounded-pill">
                ＋ 新增作品
            </a>
        </div>

        <!-- 作品列表 -->
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
                                <a href="work_detail.php?id=<?php echo $portfolio['title']; ?>" class="btn btn-primary btn-sm">查看</a>
                                <a href="edit_portfolio.php?id=<?php echo $portfolio['portfolio_id']; ?>" class="btn btn-outline-secondary btn-sm">編輯</a>
                            </div>
                        </div>
                    </div>
                <?php endwhile; ?>
            <?php else: ?>
                <p class="text-muted text-center">這個分類還沒有任何作品。</p>
            <?php endif; ?>
        </div>

        <!-- 分頁（可用 JS 改進） -->
        <nav aria-label="Page navigation">
            <ul class="pagination justify-content-center">
                <li class="page-item disabled"><a class="page-link" href="#">上一頁</a></li>
                <li class="page-item active"><a class="page-link" href="#">1</a></li>
                <li class="page-item"><a class="page-link" href="#">2</a></li>
                <li class="page-item"><a class="page-link" href="#">3</a></li>
                <li class="page-item"><a class="page-link" href="#">下一頁</a></li>
            </ul>
        </nav>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="../js/category_projects.js"></script>
</body>
</html>
