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
          <a href="create_portfolio.php" class="btn btn-success">
            ＋ 新增作品
          </a>
        </div>

        <!-- 作品列表 -->
        <div class="row" id="portfolioContainer">
            <?php while ($portfolio = $portfolio_result->fetch_assoc()): ?>
            <div class="col-12 col-sm-6 col-lg-4">
              <div class="card h-100 shadow-sm">
                <img src="uploads/<?php echo htmlspecialchars($portfolio['cover_image']); ?>" class="card-img-top" alt="作品圖片">
                <div class="card-body text-center">
                  <h5 class="card-title"><?php echo htmlspecialchars($portfolio['title']); ?></h5>
                  <p class="card-text"><?php echo htmlspecialchars($portfolio['description']); ?></p>
                  <a href="work_detail.php?portfolio_id=<?php echo $portfolio['portfolio_id']; ?>" class="btn btn-outline-primary mt-2">查看作品</a>
                </div>
              </div>
            </div>
            <?php endwhile; ?>
        </div>

        <!-- 分頁 -->
        <nav aria-label="Page navigation" class="mt-4">
          <ul class="pagination justify-content-center">
            <?php for ($i = 1; $i <= $total_pages; $i++): ?>
              <li class="page-item <?php echo ($i == $page) ? 'active' : ''; ?>">
                <a class="page-link" href="works.php?page=<?php echo $i; ?>&search=<?php echo htmlspecialchars($search); ?>"><?php echo $i; ?></a>
              </li>
            <?php endfor; ?>
          </ul>
        </nav>
      </div>
    </div>
  </div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script>
  document.getElementById('search').addEventListener('input', function () {
      const query = this.value;
      window.location.href = `works.php?search=${encodeURIComponent(query)}`;
  });
</script>
</body>
</html>