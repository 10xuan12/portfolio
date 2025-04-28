<?php
// 資料庫連線
session_start();
require '../includes/db_connect.php'; // 資料庫連線

// 取得所有作品資料
$portfolio_sql = "SELECT * FROM portfolios";
$stmt = $conn->prepare($portfolio_sql);
$stmt->execute();
$portfolio_result = $stmt->get_result();

// 新增作品表單處理
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['add_work'])) {
    $title = $_POST['workTitle'];
    $description = $_POST['workDescription'];
    $image = $_FILES['workImage']['name'];
    $image_tmp = $_FILES['workImage']['tmp_name'];
    $image_folder = "../uploads/" . $image;

    // 移動圖片到指定資料夾
    move_uploaded_file($image_tmp, $image_folder);

    $insert_sql = "INSERT INTO portfolios (title, description, image) VALUES (?, ?, ?)";
    $stmt2 = $conn->prepare($insert_sql);
    $stmt2->bind_param("sss", $title, $description, $image);
    $stmt2->execute();

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
  <link rel="stylesheet" href="../css/works.css">
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>

<div class="container-fluid">
  <div class="row flex-nowrap">
      <!-- 側邊欄 -->
      <nav class="col-auto sidebar">
        <ul class="nav nav-pills flex-column">
          <li class="nav-item">
            <a href="#" class="nav-link "><i class="bi bi-house"></i><span>主頁</span></a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link active"><i class="bi bi-collection"></i><span>作品集</span></a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link"><i class="bi bi-bell"></i><span>通知</span></a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link"><i class="bi bi-gear"></i><span>設定</span></a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link"><i class="bi bi-box-arrow-right"></i><span>登出</span></a>
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
                <img src="../uploads/<?php echo htmlspecialchars($portfolio['image']); ?>" class="card-img-top" alt="作品圖片">
                <div class="card-body text-center">
                  <h5 class="card-title"><?php echo htmlspecialchars($portfolio['title']); ?></h5>
                  <p class="card-text"><?php echo htmlspecialchars($portfolio['description']); ?></p>
                  <a href="#" class="btn btn-outline-primary mt-2">查看詳細</a>
                </div>
              </div>
            </div>
            <?php endwhile; ?>
        </div>

        <!-- 分頁 -->
        <nav aria-label="Page navigation" class="mt-4">
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
<script src="../js/works.js"></script>
</body>
</html>
