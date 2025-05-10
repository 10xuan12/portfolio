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

// 新增作品表單處理
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['add_work'])) {
    $title = $_POST['workTitle'];
    $description = $_POST['workDescription'];
    $cover_image = $_FILES['workImage']['name'];
    $image_tmp = $_FILES['workImage']['tmp_name'];

    // 安全性檢查
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    $file_type = mime_content_type($image_tmp);

    if (!in_array($file_type, $allowed_types)) {
        echo "<script>alert('只允許上傳圖片類型的文件！');</script>";
        exit;
    }

    // 生成唯一文件名
    $image_name = uniqid() . "_" . basename($cover_image);
    $image_folder = "../uploads/" . $image_name;

    // 移動圖片到指定資料夾
    if (!move_uploaded_file($image_tmp, $image_folder)) {
        echo "<script>alert('文件上傳失敗！');</script>";
        exit;
    }

    // 插入資料庫
    $insert_sql = "INSERT INTO portfolios (title, description, cover_image) VALUES (?, ?, ?)";
    $stmt2 = $conn->prepare($insert_sql);
    $stmt2->bind_param("sss", $title, $description, $image_name);

    if (!$stmt2->execute()) {
        error_log("Database error: " . $stmt2->error, 3, '../logs/error.log');
        echo "<script>alert('新增作品失敗！');</script>";
        exit;
    }

    // 重定向到作品集頁面
    header("Location: works.php");
    exit;
}
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

        <div class="mb-4 d-flex flex-wrap align-items-center gap-2">
          <div>
            <a href="student_file_category.php" class="btn btn-outline-secondary">分類</a>
            <a href="works.php" class="btn btn-primary ms-2">全部作品</a>
          </div>
          <button class="btn btn-success ms-auto" data-bs-toggle="modal" data-bs-target="#addWorkModal">
            ＋ 新增作品
          </button>
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
                  <a href="work_detail.php" class="btn btn-outline-primary mt-2">查看作品 !</a>
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

  <!-- 新增作品 Modal -->
  <div class="modal fade" id="addWorkModal" tabindex="-1" aria-labelledby="addWorkModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <form id="addWorkForm" class="modal-content" method="POST" enctype="multipart/form-data">
        <div class="modal-header">
          <h5 class="modal-title" id="addWorkModalLabel">新增作品</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="workImage" class="form-label">作品圖片</label>
            <input class="form-control" type="file" id="workImage" name="workImage" accept="image/*" required>
          </div>
          <div class="mb-3">
            <label for="workTitle" class="form-label">作品標題</label>
            <input type="text" class="form-control" id="workTitle" name="workTitle" required>
          </div>
          <div class="mb-3">
            <label for="workDescription" class="form-label">作品描述</label>
            <textarea class="form-control" id="workDescription" name="workDescription" rows="3" required></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary" name="add_work">新增</button>
        </div>
      </form>
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