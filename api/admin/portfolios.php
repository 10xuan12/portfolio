<?php
require_once '../config.php';

// 管理員作品審核 API
// 解析 RESTful 路徑
$requestUri = $_SERVER['REQUEST_URI'];
$pathAction = '';

if (preg_match('#/admin/portfolios/([^/?]+)#', $requestUri, $matches)) {
    $pathAction = $matches[1];
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getPortfolios();
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $action = $pathAction ?: ($input['action'] ?? '');
        
        if ($action) {
            switch ($action) {
                case 'approve':
                    approvePortfolio($input);
                    break;
                case 'reject':
                    rejectPortfolio($input);
                    break;
                default:
                    sendError('無效的操作: ' . $action, 400);
            }
        } else {
            sendError('缺少操作類型', 400);
        }
        break;
        
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得作品列表
function getPortfolios() {
    checkPermission('admin');
    
    $status = isset($_GET['status']) ? $_GET['status'] : 'pending';
    $search = isset($_GET['q']) ? sanitizeInput($_GET['q']) : '';
    $type = isset($_GET['type']) ? sanitizeInput($_GET['type']) : '';
    
    // 建立查詢條件
    $where = "WHERE 1=1";
    $params = [];
    $types = "";
    
    if ($status && $status !== 'all') {
        $where .= " AND p.status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    if ($search) {
        $where .= " AND (p.title LIKE ? OR p.description LIKE ? OR u.username LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sss";
    }
    
    if ($type) {
        $where .= " AND p.category = ?";
        $params[] = $type;
        $types .= "s";
    }
    
    // 查詢作品
    $sql = "
        SELECT 
            p.id, p.title, p.description, p.category, p.status,
            p.created_at, p.views, p.likes,
            u.username as author,
            u.id as user_id
        FROM portfolios p
        JOIN users u ON p.user_id = u.id
        $where
        ORDER BY p.created_at DESC
    ";
    
    $stmt = $GLOBALS['conn']->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $portfolios = [];
    
    while ($row = $result->fetch_assoc()) {
        // 取得技能標籤
        $tagsStmt = $GLOBALS['conn']->prepare("
            SELECT pt.tag_name 
            FROM portfolio_tags pt 
            WHERE pt.portfolio_id = ?
        ");
        $tagsStmt->bind_param("i", $row['id']);
        $tagsStmt->execute();
        $tagsResult = $tagsStmt->get_result();
        
        $skills = [];
        while ($tag = $tagsResult->fetch_assoc()) {
            $skills[] = $tag['tag_name'];
        }
        
        // 取得封面圖片
        $imageStmt = $GLOBALS['conn']->prepare("
            SELECT file_path 
            FROM portfolio_files 
            WHERE portfolio_id = ? AND file_type LIKE 'image/%'
            LIMIT 1
        ");
        $imageStmt->bind_param("i", $row['id']);
        $imageStmt->execute();
        $imageResult = $imageStmt->get_result();
        $imageRow = $imageResult->fetch_assoc();
        
        $row['skills'] = $skills;
        $row['image'] = $imageRow ? '../' . $imageRow['file_path'] : 'https://via.placeholder.com/400x200';
        $row['submitted_at'] = date('Y-m-d H:i', strtotime($row['created_at']));
        
        $portfolios[] = $row;
    }
    
    sendResponse($portfolios, 200, '取得作品列表成功');
}

// 核准作品
function approvePortfolio($data) {
    checkPermission('admin');
    
    if (!isset($data['id'])) {
        sendError('缺少作品 ID', 400);
    }
    
    $portfolioId = (int)$data['id'];
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE portfolios 
        SET status = 'published', updated_at = NOW() 
        WHERE id = ?
    ");
    $stmt->bind_param("i", $portfolioId);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '作品已核准');
    } else {
        sendError('核准失敗', 500);
    }
}

// 拒絕作品
function rejectPortfolio($data) {
    checkPermission('admin');
    
    if (!isset($data['id'])) {
        sendError('缺少作品 ID', 400);
    }
    
    $portfolioId = (int)$data['id'];
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE portfolios 
        SET status = 'rejected', updated_at = NOW() 
        WHERE id = ?
    ");
    $stmt->bind_param("i", $portfolioId);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '作品已拒絕');
    } else {
        sendError('拒絕失敗', 500);
    }
}
?>

