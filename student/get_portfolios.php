<?php
require '../includes/db_connect.php';

$category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$limit = 5;
$offset = ($page - 1) * $limit;

// 取得總筆數
$count_sql = "SELECT COUNT(*) as count FROM portfolios WHERE category_id = ?";
$stmt_count = $conn->prepare($count_sql);
$stmt_count->bind_param("i", $category_id);
$stmt_count->execute();
$count_result = $stmt_count->get_result()->fetch_assoc();
$total = $count_result['count'];
$total_pages = ceil($total / $limit);

// 撈作品
$sql = "SELECT * FROM portfolios WHERE category_id = ? ORDER BY portfolio_id DESC LIMIT ?, ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iii", $category_id, $offset, $limit);
$stmt->execute();
$result = $stmt->get_result();

// 輸出 HTML
while ($portfolio = $result->fetch_assoc()):
?>
    <div class="card mb-3 shadow-sm portfolio-card animate__animated animate__fadeIn">
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
                <a href="work_detail.php?id=<?php echo urlencode($portfolio['title']); ?>" class="btn btn-primary btn-sm">查看</a>
                <a href="edit_portfolio.php?id=<?php echo $portfolio['portfolio_id']; ?>" class="btn btn-outline-secondary btn-sm">編輯</a>
            </div>
        </div>
    </div>
<?php endwhile; ?>

<!-- 分頁 -->
<nav aria-label="Page navigation">
  <ul class="pagination justify-content-center">
    <?php for ($i = 1; $i <= $total_pages; $i++): ?>
        <li class="page-item <?php echo $i == $page ? 'active' : ''; ?>">
            <a class="page-link page-link-btn" href="#" data-page="<?php echo $i; ?>"><?php echo $i; ?></a>
        </li>
    <?php endfor; ?>
  </ul>
</nav>
