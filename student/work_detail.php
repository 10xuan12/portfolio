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
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body class="bg-gray-50">
    <div class="flex min-h-screen">
        <!-- 左側欄 -->
        <nav class="flex flex-col items-center bg-gray-300 w-14 py-6 space-y-6 shadow-md border-r">
            <!-- 主頁 -->
            <a href="student_dashboard_view.php" class="flex flex-col items-center w-14 h-14 justify-center text-black hover:bg-gray-400">
                <i class="fas fa-user-circle text-xl"></i>
                <span class="text-xs mt-1">主頁</span>
            </a>

            <!-- 作品集 -->
            <a href="student_file_category.php" class="flex flex-col items-center w-14 h-14 justify-center text-white bg-blue-700">
                <i class="fas fa-folder text-xl"></i>
                <span class="text-xs mt-1">作品集</span>
            </a>

            <!-- 通知 -->
            <a href="#" class="flex flex-col items-center w-14 h-14 justify-center text-black hover:bg-gray-400">
                <i class="fas fa-bell text-xl"></i>
                <span class="text-xs mt-1">通知</span>
            </a>

            <!-- 設定 -->
            <a href="#" class="flex flex-col items-center w-14 h-14 justify-center text-black hover:bg-gray-400">
                <i class="fas fa-cog text-xl"></i>
                <span class="text-xs mt-1">設定</span>
            </a>

            <!-- 登出 -->
            <a href="../login.html" class="flex flex-col items-center w-14 h-14 justify-center text-black hover:bg-gray-400">
                <i class="fas fa-sign-out-alt text-xl"></i>
                <span class="text-xs mt-1">登出</span>
            </a>
        </nav>

        <!-- 右側主內容 -->
        <main class="flex-1 p-6 overflow-y-auto">
            <!-- 作品資訊區 -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex flex-col md:flex-row gap-6">
                    <div class="md:w-1/3">
                        <img src="uploads/<?php echo htmlspecialchars($portfolio['cover_image']); ?>" 
                             class="w-full h-48 object-cover rounded-lg" 
                             alt="作品封面">
                    </div>
                    <div class="md:w-2/3 flex flex-col justify-center">
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">
                            <?php echo htmlspecialchars($portfolio['title'] ?? '未知標題'); ?>
                        </h2>
                        <p class="text-gray-600">
                            <?php echo htmlspecialchars($portfolio['category_name'] ?? '未分類'); ?>
                        </p>
                    </div>
                </div>
            </div>

            <!-- 簡介區塊 -->
            <div class="mb-6">
                <div class="bg-blue-700 text-white px-4 py-2 rounded-t-lg">
                    <h3 class="text-lg font-medium">簡介</h3>
                </div>
                <div class="bg-white p-4 rounded-b-lg shadow-md">
                    <p class="text-gray-700 whitespace-pre-line">
                        <?php echo nl2br(htmlspecialchars($portfolio['description'] ?? '暫無描述')); ?>
                    </p>
                </div>
            </div>

            <!-- 檔案區 -->
            <div class="bg-white rounded-lg shadow-md mb-6">
                <div class="border-b px-4 py-3">
                    <h3 class="text-lg font-medium text-gray-900">檔案資料</h3>
                </div>
                <div class="p-4">
                    <?php if($fileResult->num_rows > 0): ?>
                        <div class="space-y-2">
                            <?php while($file = $fileResult->fetch_assoc()): ?>
                                <div class="flex items-center text-gray-700">
                                    <i class="fas fa-file mr-2"></i>
                                    <span><?php echo htmlspecialchars($file['file_name']); ?></span>
                                </div>
                            <?php endwhile; ?>
                        </div>
                    <?php else: ?>
                        <p class="text-gray-500">暫無檔案</p>
                    <?php endif; ?>
                </div>
            </div>

            <!-- 留言區 -->
            <div class="bg-white rounded-lg shadow-md">
                <div class="bg-blue-700 text-white px-4 py-3 rounded-t-lg">
                    <h3 class="text-lg font-medium">💬 留言區</h3>
                </div>
                <div class="p-4">
                    <!-- 留言列表 -->
                    <div id="commentList" class="space-y-4 mb-6">
                        <!-- 留言將由 JavaScript 動態載入 -->
                    </div>

                    <!-- 分頁導航 -->
                    <div id="commentPagination" class="mt-6">
                        <!-- 分頁將由 JavaScript 動態載入 -->
                    </div>

                    <!-- 留言表單 -->
                    <form id="commentForm" class="mt-6 space-y-4">
                        <div>
                            <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                                      name="content" 
                                      rows="3" 
                                      placeholder="留下你的留言..." 
                                      required></textarea>
                        </div>
                        <div class="flex justify-end">
                            <button type="submit" 
                                    class="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                送出留言
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    </div>

    <!-- 編輯留言 Modal -->
    <div id="editCommentModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">編輯留言</h3>
                <button onclick="document.getElementById('editCommentModal').classList.add('hidden')"
                        class="text-gray-400 hover:text-gray-500">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="editCommentForm" class="space-y-4">
                <div>
                    <textarea id="editContent" 
                              name="content" 
                              rows="4" 
                              required
                              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                <input type="hidden" id="editCommentId" name="comment_id">
                <div class="flex justify-end gap-3">
                    <button type="button" 
                            onclick="document.getElementById('editCommentModal').classList.add('hidden')"
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        取消
                    </button>
                    <button type="submit"
                            class="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        儲存修改
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="../js/work_detail.js"></script>
    <script src="../js/comment.js"></script>
</body>
</html>