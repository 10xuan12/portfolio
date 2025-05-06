<?php
// 資料庫連線
session_start(); // 開啟 session
require '../includes/db_connect.php'; // 資料庫連線

// 查詢所有分類
$category_sql = "SELECT * FROM categories";
$category_result = $conn->query($category_sql);
?>

<!DOCTYPE html>
<html lang="zh-Hant">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>作品集分類管理</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="../css/student_file_category.css?v=2">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    </head>
<body>

<div class="container-fluid">
  <div class="row">
    <!-- 側邊欄 -->
    <nav class="col-auto col-md-3 col-lg-2 sidebar">
        <ul class="nav nav-pills flex-column">
          <li class="nav-item">
            <a href="student_dashboard_view.php" class="nav-link ">
              <i class="bi bi-house"></i>
              <span>個人主頁</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="student_file_category.php" class="nav-link active">
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
            <a href="../login.php" class="nav-link">
              <i class="bi bi-box-arrow-right"></i>
              <span>登出</span>
            </a>
          </li>
        </ul>
    </nav>
    <!-- 主內容 -->
    <div class="col py-3 main-content">
      <!-- 搜尋列 -->
      <div class="mb-4 position-relative">
        <input type="text" class="form-control ps-5 rounded-pill" placeholder="搜尋分類..." id="search">
        <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-primary"></i>
      </div>

      <!-- 分類按鈕 -->
      <div class="mb-4 d-flex flex-wrap align-items-center gap-2">
        <div>
            <a href="student_file_category.php" class="btn btn-outline-secondary">分類</a>
            <a href="works.php" class="btn btn-primary ms-2">全部作品</a>
        </div>
        <button class="btn btn-success ms-auto" data-bs-toggle="modal" data-bs-target="#addCategoryModal">
            ＋ 新增分類
        </button>
      </div>

      <!-- 卡片列表 -->
<div class="row g-4" id="category-list">
    <?php while($category = $category_result->fetch_assoc()): ?>
    <div class="col-12 col-sm-6 col-md-4 col-lg-3"> <!-- 這裡調整為更小的列數 -->
      <div class="card h-100 shadow-sm">
      <img src="<?php echo !empty($category['image']) ? 'uploads/' . $category['image'] : 'https://via.placeholder.com/300x150'; ?>" class="card-img-top" alt="...">
        <div class="card-body text-center">
          <h5 class="card-title"><?php echo htmlspecialchars($category['name']); ?></h5>
          <p class="card-text"><?php echo htmlspecialchars($category['description']); ?></p>
          <a href="category_projects.php?category_id=<?php echo $category['category_id']; ?>" class="btn btn-outline-primary mt-2">查看作品</a>
        </div>
      </div>
    </div>
    <?php endwhile; ?>
</div>
    </div>
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

<!-- 新增分類 Modal -->
<div class="modal fade" id="addCategoryModal" tabindex="-1" aria-labelledby="addCategoryModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <form action="add_category.php" method="POST" enctype="multipart/form-data" class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="addCategoryModalLabel">新增分類</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label for="name" class="form-label">分類名稱</label>
          <input type="text" class="form-control" id="name" name="name" required>
        </div>
        <div class="mb-3">
          <label for="description" class="form-label">描述</label>
          <textarea class="form-control" id="description" name="description" rows="3"></textarea>
        </div>
        <div class="mb-3">
          <label for="image" class="form-label">上傳圖片</label>
          <input class="form-control" type="file" id="image" name="image">
        </div>
      </div>
      <div class="modal-footer">
        <button type="submit" class="btn btn-primary">儲存</button>
      </div>
    </form>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="../js/student_file_category.js"></script>
</body>
</html>
