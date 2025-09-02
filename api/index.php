<?php
// 主要的 API 路由檔案
require_once 'config.php';

// 備用路由處理（如果 .htaccess 不工作）
$requestUri = $_SERVER['REQUEST_URI'];
if (strpos($requestUri, '/api/') === 0) {
    $path = substr($requestUri, 5); // 移除 '/api/' 前綴
    $path = trim($path, '/');
    
    // 如果沒有 path 參數，手動設定
    if (!isset($_GET['path'])) {
        $_GET['path'] = $path;
    }
}

// 取得請求路徑
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$path = str_replace('/api/', '', $path);
$path = trim($path, '/');

// 優先使用 path 參數（來自 .htaccess 重寫）
if (isset($_GET['path'])) {
    $path = $_GET['path'];
}

// 如果路徑為空，檢查是否有 path 參數（來自 .htaccess 重寫）
if (empty($path) && isset($_GET['path'])) {
    $path = $_GET['path'];
}

// 分割路徑
$pathParts = explode('/', $path);

// 調試信息（暫時保留）
error_log("API Debug - Request URI: " . $requestUri);
error_log("API Debug - Parsed Path: " . $path);
error_log("API Debug - GET path param: " . (isset($_GET['path']) ? $_GET['path'] : 'not set'));
error_log("API Debug - Path Parts: " . print_r($pathParts, true));

// 路由到對應的 API 檔案
if (empty($pathParts[0])) {
    // API 根目錄
    sendResponse([
        'message' => 'Portfolio+ API',
        'version' => '1.0.0',
        'endpoints' => [
            'student' => [
                'auth' => '/api/student/auth.php',
                'profile' => '/api/student/profile.php',
                'portfolio' => '/api/student/portfolio.php',
                'resume' => '/api/student/resume.php'
            ],
            'enterprise' => [
                'auth' => '/api/enterprise/auth.php',
                'profile' => '/api/enterprise/profile.php',
                'jobs' => '/api/enterprise/jobs.php'
            ],
            'admin' => [
                'auth' => '/api/admin/auth.php',
                'users' => '/api/admin/users.php',
                'analytics' => '/api/admin/analytics.php'
            ]
        ]
    ], 200, 'API 資訊');
}

// 學生相關 API
if ($pathParts[0] === 'student') {
    if (isset($pathParts[1])) {
        switch ($pathParts[1]) {
            case 'auth':
                require_once 'student/auth.php';
                break;
            case 'profile':
                require_once 'student/profile.php';
                break;
            case 'portfolio':
                require_once 'student/portfolio.php';
                break;
            case 'resume':
                require_once 'student/resume.php';
                break;
            case 'notifications':
                require_once 'student/notifications.php';
                break;
            default:
                sendError('無效的學生 API 端點', 404);
        }
    } else {
        sendError('缺少學生 API 端點', 400);
    }
}

// 企業相關 API
elseif ($pathParts[0] === 'enterprise') {
    if (isset($pathParts[1])) {
        switch ($pathParts[1]) {
            case 'auth':
                // require_once 'enterprise/auth.php';
                sendError('企業 API 尚未實作', 501);
                break;
            case 'profile':
                // require_once 'enterprise/profile.php';
                sendError('企業 API 尚未實作', 501);
                break;
            case 'jobs':
                // require_once 'enterprise/jobs.php';
                sendError('企業 API 尚未實作', 501);
                break;
            default:
                sendError('無效的企業 API 端點', 404);
        }
    } else {
        sendError('缺少企業 API 端點', 400);
    }
}

// 管理員相關 API
elseif ($pathParts[0] === 'admin') {
    if (isset($pathParts[1])) {
        switch ($pathParts[1]) {
            case 'auth':
                // require_once 'admin/auth.php';
                sendError('管理員 API 尚未實作', 501);
                break;
            case 'users':
                // require_once 'admin/users.php';
                sendError('管理員 API 尚未實作', 501);
                break;
            case 'analytics':
                // require_once 'admin/analytics.php';
                sendError('管理員 API 尚未實作', 501);
                break;
            default:
                sendError('無效的管理員 API 端點', 404);
        }
    } else {
        sendError('缺少管理員 API 端點', 400);
    }
}

// 通用 API
elseif ($pathParts[0] === 'search') {
    handleSearch();
}
elseif ($pathParts[0] === 'categories') {
    handleCategories();
}
elseif ($pathParts[0] === 'upload') {
    handleUpload();
}

// 未知路徑
else {
    sendError('無效的 API 路徑', 404);
}

// 通用搜尋功能
function handleSearch() {
    $query = isset($_GET['q']) ? $_GET['q'] : '';
    $category = isset($_GET['category']) ? $_GET['category'] : '';
    $tags = isset($_GET['tags']) ? $_GET['tags'] : '';
    $author = isset($_GET['author']) ? $_GET['author'] : '';
    $time = isset($_GET['time']) ? $_GET['time'] : '';
    $sort = isset($_GET['sort']) ? $_GET['sort'] : 'relevance';
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    
    $offset = ($page - 1) * $limit;
    
    // 建立搜尋查詢
    $where = "WHERE p.status = 'published'";
    $params = [];
    $types = "";
    
    // 關鍵字搜尋
    if (!empty($query)) {
        $where .= " AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)";
        $searchTerm = "%$query%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sss";
    }
    
    // 分類篩選
    if (!empty($category)) {
        $where .= " AND p.category = ?";
        $params[] = $category;
        $types .= "s";
    }
    
    // 標籤篩選
    if (!empty($tags)) {
        $where .= " AND p.tags LIKE ?";
        $params[] = "%$tags%";
        $types .= "s";
    }
    
    // 作者篩選
    if (!empty($author)) {
        $where .= " AND u.name LIKE ?";
        $params[] = "%$author%";
        $types .= "s";
    }
    
    // 時間篩選
    if (!empty($time)) {
        switch ($time) {
            case 'week':
                $where .= " AND p.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)";
                break;
            case 'month':
                $where .= " AND p.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
                break;
            case 'year':
                $where .= " AND p.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
                break;
        }
    }
    
    // 排序
    $orderBy = "ORDER BY ";
    switch ($sort) {
        case 'date':
            $orderBy .= "p.created_at DESC";
            break;
        case 'views':
            $orderBy .= "p.view_count DESC";
            break;
        case 'likes':
            $orderBy .= "p.like_count DESC";
            break;
        case 'relevance':
        default:
            if (!empty($query)) {
                $orderBy .= "CASE 
                    WHEN p.title LIKE ? THEN 1
                    WHEN p.description LIKE ? THEN 2
                    WHEN p.tags LIKE ? THEN 3
                    ELSE 4
                END, p.created_at DESC";
                $titleMatch = "%$query%";
                $params[] = $titleMatch;
                $params[] = $titleMatch;
                $params[] = $titleMatch;
                $types .= "sss";
            } else {
                $orderBy .= "p.created_at DESC";
            }
            break;
    }
    
    // 搜尋作品
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            p.id, p.title, p.description, p.status, p.category, p.tags,
            p.cover_image, p.view_count, p.like_count, p.comment_count, 
            p.created_at, p.published_at,
            u.name as author_name, u.department, u.grade
        FROM portfolios p
        LEFT JOIN users u ON p.user_id = u.id
        $where
        $orderBy
        LIMIT ? OFFSET ?
    ");
    
    $params[] = $limit;
    $params[] = $offset;
    $types .= "ii";
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $results = [];
    while ($row = $result->fetch_assoc()) {
        $results[] = [
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'status' => $row['status'],
            'category' => $row['category'],
            'tags' => $row['tags'] ? explode(',', $row['tags']) : [],
            'cover_image' => $row['cover_image'],
            'views' => (int)$row['view_count'],
            'likes' => (int)$row['like_count'],
            'comments' => (int)$row['comment_count'],
            'created_at' => $row['created_at'],
            'published_at' => $row['published_at'],
            'author_name' => $row['author_name'],
            'department' => $row['department'],
            'grade' => $row['grade']
        ];
    }
    
    // 查詢總數
    $countStmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as total FROM portfolios p
        LEFT JOIN users u ON p.user_id = u.id
        $where
    ");
    
    $countParams = array_slice($params, 0, -2);
    $countTypes = substr($types, 0, -2);
    
    if (!empty($countParams)) {
        $countStmt->bind_param($countTypes, ...$countParams);
    }
    $countStmt->execute();
    $total = $countStmt->get_result()->fetch_assoc()['total'];
    
    sendResponse($results, 200, '搜尋成功');
}

// 取得分類列表
function handleCategories() {
    $stmt = $GLOBALS['conn']->prepare("
        SELECT id, name, slug, description, icon, color, 
               (SELECT COUNT(*) FROM portfolios WHERE category_id = c.id AND status = 'published') as portfolio_count
        FROM categories c
        WHERE is_active = 1
        ORDER BY sort_order, name
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
    
    sendResponse($categories, 200);
}

// 處理檔案上傳
function handleUpload() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('只允許 POST 請求', 405);
    }
    
    if (!isset($_FILES['file'])) {
        sendError('沒有上傳檔案', 400);
    }
    
    $file = $_FILES['file'];
    $type = isset($_POST['type']) ? $_POST['type'] : 'general';
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        sendError('檔案上傳失敗', 400);
    }
    
    // 驗證檔案類型
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ALLOWED_EXTENSIONS)) {
        sendError('檔案類型不支援', 400);
    }
    
    // 驗證檔案大小
    if ($file['size'] > UPLOAD_MAX_SIZE) {
        sendError('檔案大小超過限制', 400);
    }
    
    // 生成唯一檔名
    $filename = $type . '_' . time() . '_' . uniqid() . '.' . $extension;
    $filepath = UPLOAD_PATH . $type . 's/' . $filename;
    
    // 移動上傳的檔案
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        $relativePath = 'uploads/' . $type . 's/' . $filename;
        
        sendResponse([
            'file_path' => $relativePath,
            'file_name' => $file['name'],
            'file_size' => $file['size'],
            'message' => '檔案上傳成功'
        ], 200, '上傳成功');
    } else {
        sendError('檔案儲存失敗', 500);
    }
}
?>
