<?php
require_once __DIR__ . '/../config.php';

// 管理員內容審核 API
// 檢查管理員權限
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    sendError('需要管理員權限', 403);
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getReviews();
        break;
    case 'POST':
        handlePost();
        break;
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得待審核內容列表
function getReviews() {
    try {
        $tab = $_GET['tab'] ?? 'portfolios'; // portfolios, jobs, users, reports
        $status = $_GET['status'] ?? 'pending';
        $search = $_GET['q'] ?? '';
        $type = $_GET['type'] ?? '';
        $date = $_GET['date'] ?? '';
        
        $data = [];
        
        switch ($tab) {
            case 'portfolios':
                $data = getPortfolioReviews($status, $search, $type, $date);
                break;
            case 'jobs':
                $data = getJobReviews($status, $search, $date);
                break;
            case 'users':
                $data = getUserReviews($status, $search);
                break;
            case 'reports':
                $data = getReportReviews($status, $search, $date);
                break;
            default:
                sendError('無效的標籤', 400);
        }
        
        sendResponse($data, 200, '取得審核列表成功');
        
    } catch (Exception $e) {
        sendError('取得審核列表失敗: ' . $e->getMessage(), 500);
    }
}

// 作品審核列表
function getPortfolioReviews($status, $search, $type, $date) {
    $where = ['1=1'];
    $params = [];
    $types = '';
    
    if ($status !== 'all' && in_array($status, ['pending', 'approved', 'rejected'])) {
        $where[] = "p.status = ?";
        $params[] = $status;
        $types .= 's';
    }
    
    if (!empty($search)) {
        $where[] = "(p.title LIKE ? OR p.description LIKE ? OR u.username LIKE ?)";
        $searchTerm = "%$search%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
        $types .= 'sss';
    }
    
    if (!empty($type)) {
        $where[] = "p.category = ?";
        $params[] = $type;
        $types .= 's';
    }
    
    if (!empty($date)) {
        switch ($date) {
            case 'today':
                $where[] = "DATE(p.created_at) = CURDATE()";
                break;
            case 'week':
                $where[] = "p.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
                break;
            case 'month':
                $where[] = "p.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                break;
        }
    }
    
    $whereClause = implode(' AND ', $where);
    
    $sql = "
        SELECT 
            p.id,
            p.title,
            p.description,
            p.category,
            p.status,
            p.created_at,
            p.views,
            p.likes,
            u.username as author,
            u.id as author_id,
            sp.avatar_url
        FROM portfolios p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE $whereClause
        ORDER BY p.created_at DESC
        LIMIT 50
    ";
    
    $stmt = $GLOBALS['conn']->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $portfolios = [];
    while ($row = $result->fetch_assoc()) {
        $portfolios[] = [
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'category' => $row['category'],
            'status' => $row['status'],
            'author' => $row['author'],
            'author_id' => (int)$row['author_id'],
            'avatar_url' => $row['avatar_url'],
            'created_at' => $row['created_at'],
            'views' => (int)$row['views'],
            'likes' => (int)$row['likes']
        ];
    }
    
    return [
        'items' => $portfolios,
        'total' => count($portfolios)
    ];
}

// 職缺審核列表
function getJobReviews($status, $search, $date) {
    $where = ['1=1'];
    $params = [];
    $types = '';
    
    if ($status !== 'all' && in_array($status, ['pending', 'approved', 'rejected'])) {
        $where[] = "j.status = ?";
        $params[] = $status;
        $types .= 's';
    }
    
    if (!empty($search)) {
        $where[] = "(j.title LIKE ? OR j.description LIKE ? OR ep.company_name LIKE ?)";
        $searchTerm = "%$search%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
        $types .= 'sss';
    }
    
    if (!empty($date)) {
        switch ($date) {
            case 'today':
                $where[] = "DATE(j.created_at) = CURDATE()";
                break;
            case 'week':
                $where[] = "j.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
                break;
            case 'month':
                $where[] = "j.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                break;
        }
    }
    
    $whereClause = implode(' AND ', $where);
    
    $sql = "
        SELECT 
            j.id,
            j.title,
            j.description,
            j.job_type,
            j.salary_min,
            j.salary_max,
            j.status,
            j.created_at,
            ep.company_name,
            u.id as enterprise_id
        FROM jobs j
        LEFT JOIN users u ON j.enterprise_id = u.id
        LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
        WHERE $whereClause
        ORDER BY j.created_at DESC
        LIMIT 50
    ";
    
    $stmt = $GLOBALS['conn']->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $jobs = [];
    while ($row = $result->fetch_assoc()) {
        $jobs[] = [
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'job_type' => $row['job_type'],
            'salary_range' => $row['salary_min'] && $row['salary_max'] 
                ? $row['salary_min'] . '-' . $row['salary_max'] 
                : '面議',
            'status' => $row['status'],
            'company' => $row['company_name'],
            'enterprise_id' => (int)$row['enterprise_id'],
            'created_at' => $row['created_at']
        ];
    }
    
    return [
        'items' => $jobs,
        'total' => count($jobs)
    ];
}

// 使用者審核列表
function getUserReviews($status, $search) {
    $where = ['1=1'];
    $params = [];
    $types = '';
    
    if ($status !== 'all' && in_array($status, ['pending', 'approved', 'rejected'])) {
        $where[] = "u.status = ?";
        $params[] = $status;
        $types .= 's';
    }
    
    if (!empty($search)) {
        $where[] = "(u.username LIKE ? OR u.email LIKE ?)";
        $searchTerm = "%$search%";
        $params = array_merge($params, [$searchTerm, $searchTerm]);
        $types .= 'ss';
    }
    
    $whereClause = implode(' AND ', $where);
    
    $sql = "
        SELECT 
            u.id,
            u.username,
            u.email,
            u.role,
            u.status,
            u.created_at,
            sp.first_name,
            sp.last_name,
            sp.department,
            ep.company_name
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id AND u.role = 'student'
        LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id AND u.role = 'enterprise'
        WHERE $whereClause
        ORDER BY u.created_at DESC
        LIMIT 50
    ";
    
    $stmt = $GLOBALS['conn']->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $name = $row['role'] === 'student' 
            ? trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''))
            : ($row['company_name'] ?? $row['username']);
            
        $users[] = [
            'id' => (int)$row['id'],
            'name' => $name ?: $row['username'],
            'email' => $row['email'],
            'type' => $row['role'],
            'department' => $row['department'] ?? '',
            'status' => $row['status'],
            'created_at' => $row['created_at']
        ];
    }
    
    return [
        'items' => $users,
        'total' => count($users)
    ];
}

// 報告審核列表
function getReportReviews($status, $search, $date) {
    $where = ['1=1'];
    $params = [];
    $types = '';
    
    if ($status !== 'all' && in_array($status, ['pending', 'resolved', 'dismissed'])) {
        $where[] = "r.status = ?";
        $params[] = $status;
        $types .= 's';
    }
    
    if (!empty($search)) {
        $where[] = "(r.reason LIKE ? OR r.description LIKE ?)";
        $searchTerm = "%$search%";
        $params = array_merge($params, [$searchTerm, $searchTerm]);
        $types .= 'ss';
    }
    
    if (!empty($date)) {
        switch ($date) {
            case 'today':
                $where[] = "DATE(r.created_at) = CURDATE()";
                break;
            case 'week':
                $where[] = "r.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
                break;
            case 'month':
                $where[] = "r.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                break;
        }
    }
    
    $whereClause = implode(' AND ', $where);
    
    $sql = "
        SELECT 
            r.id,
            r.type,
            r.reason,
            r.description,
            r.status,
            r.created_at,
            reporter.username as reporter,
            reported.username as reported_user
        FROM reports r
        LEFT JOIN users reporter ON r.reporter_id = reporter.id
        LEFT JOIN users reported ON r.reported_user_id = reported.id
        WHERE $whereClause
        ORDER BY r.created_at DESC
        LIMIT 50
    ";
    
    $stmt = $GLOBALS['conn']->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reports = [];
    while ($row = $result->fetch_assoc()) {
        $reports[] = [
            'id' => (int)$row['id'],
            'type' => $row['type'],
            'reason' => $row['reason'],
            'description' => $row['description'],
            'status' => $row['status'],
            'reporter' => $row['reporter'] ?? '系統',
            'reported_user' => $row['reported_user'] ?? '未知',
            'created_at' => $row['created_at']
        ];
    }
    
    return [
        'items' => $reports,
        'total' => count($reports)
    ];
}

// 處理 POST 請求
function handlePost() {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $type = $input['type'] ?? '';
    
    switch ($action) {
        case 'approve':
            approveContent($input);
            break;
        case 'reject':
            rejectContent($input);
            break;
        default:
            sendError('未知的操作', 400);
    }
}

// 審核通過
function approveContent($data) {
    try {
        $id = $data['id'] ?? 0;
        $type = $data['type'] ?? '';
        
        if (!$id || !$type) {
            sendError('缺少必要參數', 400);
        }
        
        $table = '';
        switch ($type) {
            case 'portfolio':
                $table = 'portfolios';
                break;
            case 'job':
                $table = 'jobs';
                break;
            case 'user':
                $table = 'users';
                break;
            default:
                sendError('無效的類型', 400);
        }
        
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE $table 
            SET status = 'approved', updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            sendError('內容不存在', 404);
        }
        
        sendResponse([
            'id' => $id,
            'type' => $type,
            'status' => 'approved'
        ], 200, '審核通過');
        
    } catch (Exception $e) {
        sendError('審核失敗: ' . $e->getMessage(), 500);
    }
}

// 拒絕審核
function rejectContent($data) {
    try {
        $id = $data['id'] ?? 0;
        $type = $data['type'] ?? '';
        $reason = $data['reason'] ?? '';
        
        if (!$id || !$type) {
            sendError('缺少必要參數', 400);
        }
        
        $table = '';
        switch ($type) {
            case 'portfolio':
                $table = 'portfolios';
                break;
            case 'job':
                $table = 'jobs';
                break;
            case 'user':
                $table = 'users';
                break;
            default:
                sendError('無效的類型', 400);
        }
        
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE $table 
            SET status = 'rejected', updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            sendError('內容不存在', 404);
        }
        
        // TODO: 可以記錄拒絕原因到單獨的表
        
        sendResponse([
            'id' => $id,
            'type' => $type,
            'status' => 'rejected',
            'reason' => $reason
        ], 200, '已拒絕');
        
    } catch (Exception $e) {
        sendError('操作失敗: ' . $e->getMessage(), 500);
    }
}
?>
