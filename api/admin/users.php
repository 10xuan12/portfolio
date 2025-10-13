<?php
require_once '../config.php';

// 管理員使用者管理 API
// 解析 RESTful 路徑
$requestUri = $_SERVER['REQUEST_URI'];
$pathAction = '';

// 從 URL 中提取 action（例如：/admin/users/approve -> approve）
if (preg_match('#/admin/users/([^/?]+)#', $requestUri, $matches)) {
    $pathAction = $matches[1];
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getUsers();
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        // 優先使用路徑中的 action，其次使用 body 中的 action
        $action = $pathAction ?: ($input['action'] ?? '');
        
        // 將連字符轉換為下劃線（bulk-activate -> bulk_activate）
        $action = str_replace('-', '_', $action);
        
        if ($action) {
            switch ($action) {
                case 'approve':
                    approveUser($input);
                    break;
                case 'reject':
                    rejectUser($input);
                    break;
                case 'suspend':
                    suspendUser($input);
                    break;
                case 'resume':
                    resumeUser($input);
                    break;
                case 'bulk_activate':
                    bulkActivateUsers($input);
                    break;
                case 'bulk_deactivate':
                    bulkDeactivateUsers($input);
                    break;
                case 'bulk_delete':
                    bulkDeleteUsers($input);
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

// 取得使用者列表
function getUsers() {
    checkPermission('admin');
    
    $type = isset($_GET['type']) ? $_GET['type'] : '';
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    $search = isset($_GET['q']) ? sanitizeInput($_GET['q']) : '';
    $department = isset($_GET['department']) ? sanitizeInput($_GET['department']) : '';
    
    // 建立查詢條件
    $where = "WHERE 1=1";
    $params = [];
    $types = "";
    
    if ($type && $type !== 'all') {
        $where .= " AND u.role = ?";
        $params[] = $type;
        $types .= "s";
    }
    
    if ($status && $status !== 'all') {
        $where .= " AND u.status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    if ($search) {
        $where .= " AND (u.username LIKE ? OR u.email LIKE ? OR sp.department LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sss";
    }
    
    if ($department) {
        $where .= " AND sp.department = ?";
        $params[] = $department;
        $types .= "s";
    }
    
    // 查詢使用者
    $sql = "
        SELECT 
            u.id, u.username, u.email, u.role, u.status, 
            u.created_at, u.updated_at,
            sp.full_name, sp.department, sp.student_id,
            ep.company_name, ep.company_type, ep.industry
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
        $where
        ORDER BY u.created_at DESC
    ";
    
    $stmt = $GLOBALS['conn']->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $users = [];
    
    while ($row = $result->fetch_assoc()) {
        // 取得統計資料
        if ($row['role'] === 'student') {
            $statsStmt = $GLOBALS['conn']->prepare("
                SELECT 
                    COUNT(p.id) as portfolios,
                    COALESCE(SUM(p.views), 0) as views,
                    COALESCE(SUM(p.likes), 0) as likes
                FROM portfolios p
                WHERE p.user_id = ?
            ");
            $statsStmt->bind_param("i", $row['id']);
            $statsStmt->execute();
            $stats = $statsStmt->fetch_assoc();
            
            $row['name'] = $row['full_name'] ?: $row['username'];
            $row['department'] = $row['department'] ?: '未填寫';
            $row['stats'] = [
                'portfolios' => (int)$stats['portfolios'],
                'views' => (int)$stats['views'],
                'likes' => (int)$stats['likes']
            ];
        } else if ($row['role'] === 'enterprise') {
            $statsStmt = $GLOBALS['conn']->prepare("
                SELECT 
                    COUNT(j.id) as jobs,
                    COUNT(DISTINCT a.id) as applications
                FROM jobs j
                LEFT JOIN applications a ON j.id = a.job_id
                WHERE j.enterprise_id = ?
            ");
            $statsStmt->bind_param("i", $row['id']);
            $statsStmt->execute();
            $stats = $statsStmt->fetch_assoc();
            
            $row['name'] = $row['company_name'] ?: $row['username'];
            $row['department'] = $row['industry'] ?: $row['company_type'] ?: '未填寫';
            $row['stats'] = [
                'jobs' => (int)$stats['jobs'],
                'applications' => (int)$stats['applications'],
                'views' => 0
            ];
        } else {
            $row['name'] = $row['username'];
            $row['department'] = '管理員';
            $row['stats'] = [
                'portfolios' => 0,
                'views' => 0,
                'likes' => 0
            ];
        }
        
        $row['registered_at'] = date('Y-m-d', strtotime($row['created_at']));
        $row['last_login'] = date('Y-m-d H:i', strtotime($row['updated_at']));
        
        $users[] = $row;
    }
    
    sendResponse($users, 200, '取得使用者列表成功');
}

// 核准使用者
function approveUser($data) {
    checkPermission('admin');
    
    if (!isset($data['id'])) {
        sendError('缺少使用者 ID', 400);
    }
    
    $userId = (int)$data['id'];
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE users 
        SET status = 'active', updated_at = NOW() 
        WHERE id = ?
    ");
    $stmt->bind_param("i", $userId);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '使用者已核准');
    } else {
        sendError('核准失敗', 500);
    }
}

// 拒絕使用者
function rejectUser($data) {
    checkPermission('admin');
    
    if (!isset($data['id'])) {
        sendError('缺少使用者 ID', 400);
    }
    
    $userId = (int)$data['id'];
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE users 
        SET status = 'inactive', updated_at = NOW() 
        WHERE id = ?
    ");
    $stmt->bind_param("i", $userId);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '使用者已拒絕');
    } else {
        sendError('拒絕失敗', 500);
    }
}

// 暫停使用者
function suspendUser($data) {
    checkPermission('admin');
    
    if (!isset($data['id'])) {
        sendError('缺少使用者 ID', 400);
    }
    
    $userId = (int)$data['id'];
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE users 
        SET status = 'banned', updated_at = NOW() 
        WHERE id = ?
    ");
    $stmt->bind_param("i", $userId);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '使用者已暫停');
    } else {
        sendError('暫停失敗', 500);
    }
}

// 恢復使用者
function resumeUser($data) {
    checkPermission('admin');
    
    if (!isset($data['id'])) {
        sendError('缺少使用者 ID', 400);
    }
    
    $userId = (int)$data['id'];
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE users 
        SET status = 'active', updated_at = NOW() 
        WHERE id = ?
    ");
    $stmt->bind_param("i", $userId);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '使用者已恢復');
    } else {
        sendError('恢復失敗', 500);
    }
}

// 批量啟用使用者
function bulkActivateUsers($data) {
    checkPermission('admin');
    
    if (!isset($data['ids']) || !is_array($data['ids'])) {
        sendError('缺少使用者 ID 列表', 400);
    }
    
    $ids = array_map('intval', $data['ids']);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE users 
        SET status = 'active', updated_at = NOW() 
        WHERE id IN ($placeholders)
    ");
    
    $types = str_repeat('i', count($ids));
    $stmt->bind_param($types, ...$ids);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '批量啟用成功');
    } else {
        sendError('批量啟用失敗', 500);
    }
}

// 批量停用使用者
function bulkDeactivateUsers($data) {
    checkPermission('admin');
    
    if (!isset($data['ids']) || !is_array($data['ids'])) {
        sendError('缺少使用者 ID 列表', 400);
    }
    
    $ids = array_map('intval', $data['ids']);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE users 
        SET status = 'inactive', updated_at = NOW() 
        WHERE id IN ($placeholders)
    ");
    
    $types = str_repeat('i', count($ids));
    $stmt->bind_param($types, ...$ids);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '批量停用成功');
    } else {
        sendError('批量停用失敗', 500);
    }
}

// 批量刪除使用者
function bulkDeleteUsers($data) {
    checkPermission('admin');
    
    if (!isset($data['ids']) || !is_array($data['ids'])) {
        sendError('缺少使用者 ID 列表', 400);
    }
    
    $ids = array_map('intval', $data['ids']);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    
    $stmt = $GLOBALS['conn']->prepare("
        DELETE FROM users 
        WHERE id IN ($placeholders)
    ");
    
    $types = str_repeat('i', count($ids));
    $stmt->bind_param($types, ...$ids);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '批量刪除成功');
    } else {
        sendError('批量刪除失敗', 500);
    }
}
?>

