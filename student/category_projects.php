<?php
// 資料庫連線
session_start(); // 開啟 session
require '../includes/db_connect.php'; // 資料庫連線

// 取得 category_id
$category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;

// 取得該分類的資訊
$category_sql = "SELECT * FROM categories WHERE category_id = ?";
$stmt = $conn->prepare($category_sql);
$stmt->bind_param("i", $category_id);
$stmt->execute();
$category_result = $stmt->get_result();
$category = $category_result->fetch_assoc();

$portfolio_sql = "SELECT p.* FROM portfolios p
JOIN categories c ON p.category_id = c.category_id
WHERE c.category_id = ?";
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
    <link href="../css/category_projects.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>
<div class="container-fluid">
  <div class="row">
    <!-- 側邊欄 -->
    <nav class="col-auto col-md-3 col-lg-2 sidebar">
        <ul class="nav nav-pills flex-column">
            <li class="nav-item">
               <a href="#" class="nav-link ">
                  <i class="bi bi-house"></i>
                  <span>主頁</span>
               </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link active">
                    <i class="bi bi-collection"></i>
                    <span>作品集</span>
                </a>
            </li>
            <li class="nav-item">
            <a href="#" class="nav-link">
              <i class="bi bi-bell"></i>
              <span>通知</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">
              <i class="bi bi-gear"></i>
              <span>設定</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">
              <i class="bi bi-box-arrow-right"></i>
              <span>登出</span>
            </a>
          </li>
        </ul>
    </nav>

    <!-- 主內容 -->
    <div class="col py-3 main-content">
        <!-- 分類資訊 -->
        <div class="card mb-4">
            <div class="row g-0">
                <div class="col-md-4">
                    <div class="placeholder-image"></div>
                </div>
                <div class="col-md-8 d-flex flex-column justify-content-center p-3">
                    <h4><?php echo htmlspecialchars($category['name']); ?></h4>
                    <h6 class="text-muted">Subheading</h6>
                    <p class="text-muted">Body text for your whole article or post. We'll put in some lorem ipsum to show how a filled-out page might look:</p>
                    <p class="text-muted">123</p>
                </div>
            </div>
        </div>

        <!-- 新建作品按鈕 -->
        <div class="text-end mb-3">
            <a href="create_portfolio.php" class="btn btn-primary rounded-pill">
            ＋ 新增作品
            </a>
        </div>

        <!-- 作品列表 -->
        <div class="portfolio-list">
            <?php while($portfolio = $portfolio_result->fetch_assoc()): ?>
                <div class="card mb-3">
                    <div class="row g-0">
                        <div class="col-md-2 d-flex align-items-center justify-content-center">
                            <div class="small-placeholder-image"></div>
                        </div>
                        <div class="col-md-8 d-flex flex-column justify-content-center p-3">
                            <h5><?php echo htmlspecialchars($portfolio['title']); ?></h5>
                            <p class="text-muted">Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very very short story.</p>
                        </div>
                        <div class="col-md-2 d-flex align-items-center justify-content-center">
                            <a href="edit_portfolio.php?id=<?php echo $portfolio['portfolio_id']; ?>" class="btn btn-outline-secondary btn-sm">編輯</a>
                        </div>
                    </div>
                </div>
            <?php endwhile; ?>
        </div>

        <!-- 分頁（可以之後加 JS 控制） -->
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
