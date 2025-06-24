<?php
// 資料庫連線
session_start(); // 開啟 session
require '../includes/db_connect.php'; // 資料庫連線

// 取得作品ID
$portfolio_id = isset($_GET['portfolio_id']) ? intval($_GET['portfolio_id']) : 0;
if ($portfolio_id <= 0) {
    die("錯誤：無效的作品ID");
}

// 作品基本資料
$stmt = $conn->prepare("SELECT p.*, c.name AS category_name FROM portfolios p JOIN categories c ON p.category_id = c.category_id WHERE p.portfolio_id = ?");
$stmt->bind_param("i", $portfolio_id);
$stmt->execute();
$portfolio = $stmt->get_result()->fetch_assoc();

if (!$portfolio) {
    die("錯誤：找不到作品");
}

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
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="../css/work_detail.css?v=2<?php echo time(); ?>" rel="stylesheet">
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
            <!-- 作品資訊區 -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <img src="uploads/<?php echo htmlspecialchars($portfolio['cover_image']); ?>" class="img-fluid rounded" alt="作品封面">
                        </div>
                        <div class="col-md-8 d-flex flex-column justify-content-center">
                            <h2 class="card-title h3">
                                <?php echo htmlspecialchars($portfolio['title'] ?? '未知標題'); ?>
                            </h2>
                            <p class="card-text text-muted">
                                <?php echo htmlspecialchars($portfolio['category_name'] ?? '未分類'); ?>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 簡介區塊 -->
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h3 class="h5 mb-0">簡介</h3>
                </div>
                <div class="card-body">
                    <p class="card-text" style="white-space: pre-line;">
                        <?php echo nl2br(htmlspecialchars($portfolio['description'] ?? '暫無描述')); ?>
                    </p>
                </div>
            </div>

            <!-- 檔案區 -->
            <div class="card mb-4">
                <div class="card-header">
                    <h3 class="h5 mb-0">檔案資料</h3>
                </div>
                <div class="card-body">
                    <?php if($fileResult->num_rows > 0): ?>
                        <ul class="list-unstyled">
                            <?php while($file = $fileResult->fetch_assoc()): ?>
                                <li>
                                    <i class="fas fa-file me-2 text-muted"></i>
                                    <span><?php echo htmlspecialchars($file['file_name']); ?></span>
                                </li>
                            <?php endwhile; ?>
                        </ul>
                    <?php else: ?>
                        <p class="text-muted">暫無檔案</p>
                    <?php endif; ?>
                </div>
            </div>

            <!-- 留言區 -->
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h3 class="h5 mb-0">💬 留言區</h3>
                </div>
                <div class="card-body">
                    <!-- 留言列表 -->
                    <div id="commentList" class="mb-4">
                        <!-- 留言將由 JavaScript 動態載入 -->
                    </div>

                    <!-- 分頁導航 -->
                    <div id="commentPagination" class="mb-4">
                        <!-- 分頁將由 JavaScript 動態載入 -->
                    </div>

                    <!-- 留言表單 -->
                    <form id="commentForm">
                        <div class="mb-3">
                            <textarea class="form-control" name="content" rows="3" placeholder="留下你的留言..." required></textarea>
                        </div>
                        <div class="d-flex justify-content-end">
                            <button type="submit" class="btn btn-primary">
                                送出留言
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    </div>

    <!-- 編輯留言 Modal -->
    <div id="editCommentModal" class="d-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center">
        <div class="bg-white rounded shadow p-4" style="width: 500px;">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">編輯留言</h5>
                <button type="button" class="btn-close" onclick="document.getElementById('editCommentModal').classList.add('d-none')"></button>
            </div>
            <form id="editCommentForm">
                <div class="mb-3">
                    <textarea id="editContent" name="content" rows="4" required class="form-control"></textarea>
                </div>
                <input type="hidden" id="editCommentId" name="comment_id">
                <div class="d-flex justify-content-end gap-2">
                    <button type="button" onclick="document.getElementById('editCommentModal').classList.add('d-none')" class="btn btn-secondary">
                        取消
                    </button>
                    <button type="submit" class="btn btn-primary">
                        儲存修改
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../js/work_detail.js"></script>
    <script src="../js/comment.js"></script>
</body>
</html>