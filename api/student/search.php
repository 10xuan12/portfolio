<?php
require_once '../config.php';

// CORS 與回應格式
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('不支援的 HTTP 方法', 405);
}

// 搜尋作品（跨使用者）
try {
    $q = isset($_GET['q']) ? trim($_GET['q']) : '';
    $category = isset($_GET['category']) ? trim($_GET['category']) : '';
    $tags = isset($_GET['tags']) ? trim($_GET['tags']) : '';
    $author = isset($_GET['author']) ? trim($_GET['author']) : '';
    $time = isset($_GET['time']) ? trim($_GET['time']) : '';
    $sort = isset($_GET['sort']) ? trim($_GET['sort']) : 'relevance';

    $where = "WHERE p.status = 'published'";
    $params = [];
    $types = '';

    if ($q !== '') {
        $where .= " AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ? OR u.username LIKE ? OR sp.display_name LIKE ?)";
        $keyword = "%$q%";
        array_push($params, $keyword, $keyword, $keyword, $keyword, $keyword);
        $types .= 'sssss';
    }

    if ($category !== '') {
        // 使用分類 slug 篩選，需要連接 categories 表
        $where .= ' AND c.slug = ?';
        $params[] = $category;
        $types .= 's';
    }

    if ($tags !== '') {
        $where .= ' AND p.tags LIKE ?';
        $params[] = "%$tags%";
        $types .= 's';
    }

    if ($author !== '') {
        $where .= ' AND (u.username LIKE ? OR sp.display_name LIKE ?)';
        $like = "%$author%";
        $params[] = $like;
        $params[] = $like;
        $types .= 'ss';
    }

    // 時間篩選（與前端一致：week/month/year）
    if ($time === 'week') {
        $where .= " AND p.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)";
    } elseif ($time === 'month') {
        $where .= " AND p.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
    } elseif ($time === 'year') {
        $where .= " AND p.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
    }

    // 排序
    $orderBy = 'p.created_at DESC';
    switch ($sort) {
        case 'date':
            $orderBy = 'p.created_at DESC';
            break;
        case 'views':
            $orderBy = 'p.view_count DESC';
            break;
        case 'likes':
            $orderBy = 'p.like_count DESC';
            break;
        default:
            // relevance: 以簡化版相關性（likes + views 權重）
            $orderBy = '(p.like_count * 3 + p.view_count) DESC, p.created_at DESC';
            break;
    }

    $sql = "
        SELECT DISTINCT
            p.id, p.title, p.description, p.category_id, c.slug AS category, p.tags, p.cover_image,
            p.view_count, p.like_count, p.created_at,
            COALESCE(sp.display_name, u.username) AS author_name
        FROM portfolios p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN student_profiles sp ON sp.user_id = p.user_id
        LEFT JOIN categories c ON p.category_id = c.id
        $where
        ORDER BY $orderBy
        LIMIT 100
    ";

    $stmt = $GLOBALS['conn']->prepare($sql);

    if ($stmt) {
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $row['tags'] = $row['tags'] ? explode(',', $row['tags']) : [];
            $rows[] = $row;
        }
        if (empty($rows)) {
            // 若資料表尚未建好，回傳空陣列即可（前端已處理無結果 UI）
            sendResponse([], 200, '無結果');
        } else {
            sendResponse($rows, 200, '成功');
        }
    } else {
        // 資料表尚未準備，回傳空集合
        sendResponse([], 200, '使用預設空結果');
    }
} catch (Exception $e) {
    sendError('搜尋失敗: ' . $e->getMessage(), 500);
}

?>

