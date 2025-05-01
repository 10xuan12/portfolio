<?php
// 資料庫連線
session_start(); // 開啟 session
require '../includes/db_connect.php'; // 資料庫連線

// 假設網址是 ?portfolio_id=1
$portfolio_id = $_GET['portfolio_id'] ?? 0;

// 作品基本資料
$stmt = $conn->prepare("SELECT p.*, c.name AS category_name FROM portfolios p JOIN categories c ON p.category_id = c.category_id WHERE portfolio_id = ?");
$stmt->bind_param("i", $portfolio_id);
$stmt->execute();
$portfolio = $stmt->get_result()->fetch_assoc();

// 作品的檔案
$fileStmt = $conn->prepare("SELECT * FROM files WHERE portfolio_id = ?");
$fileStmt->bind_param("i", $portfolio_id);
$fileStmt->execute();
$fileResult = $fileStmt->get_result();

// 留言（簡化只查前10筆）
$commentStmt = $conn->prepare("SELECT * FROM comments WHERE portfolio_id = ? ORDER BY created_at DESC LIMIT 10");
$commentStmt->bind_param("i", $portfolio_id);
$commentStmt->execute();
$comments = $commentStmt->get_result();
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>作品詳細頁面</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/work_detail.css">
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
            <a href="student_dashboard.php" class="nav-link">
              <i class="bi bi-house"></i>
              <span>主頁</span>
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
    </div>

    <!-- 主內容 -->
    <div class="col content">
      <!-- 作品資訊區 -->
      <div class="card mb-4 p-4">
        <div class="row g-3">
          <div class="col-md-4">
            <img src="<?php echo htmlspecialchars($portfolio['image_url'] ?? '../images/placeholder.jpg'); ?>" alt="作品封面" class="img-fluid rounded" />
          </div>
          <div class="col-md-8 d-flex flex-column justify-content-center">
            <h3><?php echo htmlspecialchars($portfolio['title'] ?? '未知標題'); ?></h3>
            <p class="text-muted"><?php echo htmlspecialchars($portfolio['category_name'] ?? '未分類'); ?></p>
          </div>
        </div>
      </div>

      <!-- 簡介區塊 -->
      <div class="mb-4">
        <div class="bg-primary text-white px-3 py-2">簡介</div>
        <div class="p-3" style="background-color: #f4e7e7;">
          <p><?php echo nl2br(htmlspecialchars($portfolio['description'] ?? '暫無描述')); ?></p>
        </div>
      </div>

      <!-- 檔案區 -->
      <div class="card mb-4">
        <div class="card-header">檔案資料</div>
        <div class="card-body">
          <?php if($fileResult->num_rows > 0): ?>
            <?php while($file = $fileResult->fetch_assoc()): ?>
              <p><i class="bi bi-file-earmark"></i> <?php echo htmlspecialchars($file['file_name']); ?></p>
            <?php endwhile; ?>
          <?php else: ?>
            <p class="text-muted">暫無檔案</p>
          <?php endif; ?>
        </div>
      </div>

      <!-- 留言區 -->
      <div class="bg-info text-white px-3 py-2">留言</div>
      <div class="bg-light p-3" id="comment-section">
        <ul class="list-group bg-light">
          <?php if ($comments->num_rows > 0): ?>
            <?php while($comment = $comments->fetch_assoc()): ?>
              <li class="list-group-item bg-light">
                <span class="badge bg-secondary rounded-circle">A</span>
                <?php echo htmlspecialchars($comment['content']); ?>
              </li>
            <?php endwhile; ?>
          <?php else: ?>
            <li class="list-group-item">目前沒有留言。</li>
          <?php endif; ?>
        </ul>
      </div>

      <!-- 留言表單 -->
      <div class="mt-4" id="comments-section">
        <h4 class="mb-3">💬 留言</h4>
        <form id="commentForm" method="POST">
          <div class="mb-3">
            <textarea class="form-control" name="content" rows="3" placeholder="留下你的留言..." required></textarea>
          </div>
          <input type="hidden" name="portfolio_id" value="<?= $portfolio_id ?>">
          <button type="submit" class="btn btn-primary">送出留言</button>
        </form>
      </div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="../js/work_detail.js"></script>
<script src="../js/comment.js"></script>
</body>
</html>