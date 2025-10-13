<?php
require_once '../config.php';

// 管理員職缺審核 API
// 解析 RESTful 路徑
$requestUri = $_SERVER['REQUEST_URI'];
$pathAction = '';

if (preg_match('#/admin/jobs/([^/?]+)#', $requestUri, $matches)) {
    $pathAction = $matches[1];
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getJobs();
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $action = $pathAction ?: ($input['action'] ?? '');
        
        if ($action) {
            switch ($action) {
                case 'approve':
                    approveJob($input);
                    break;
                case 'reject':
                    rejectJob($input);
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

// 取得職缺列表
function getJobs() {
    checkPermission('admin');
    
    $status = isset($_GET['status']) ? $_GET['status'] : 'pending';
    $search = isset($_GET['q']) ? sanitizeInput($_GET['q']) : '';
    $type = isset($_GET['type']) ? sanitizeInput($_GET['type']) : '';
    
    // 建立查詢條件
    $where = "WHERE 1=1";
    $params = [];
    $types = "";
    
    if ($status && $status !== 'all') {
        $where .= " AND j.status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    if ($search) {
        $where .= " AND (j.title LIKE ? OR j.description LIKE ? OR ep.company_name LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sss";
    }
    
    if ($type) {
        $where .= " AND j.job_type = ?";
        $params[] = $type;
        $types .= "s";
    }
    
    // 查詢職缺
    $sql = "
        SELECT 
            j.id, j.title, j.description, j.job_type as type, j.status,
            j.location, j.salary, j.created_at,
            ep.company_name as enterprise,
            u.id as enterprise_id
        FROM jobs j
        JOIN users u ON j.enterprise_id = u.id
        LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
        $where
        ORDER BY j.created_at DESC
    ";
    
    $stmt = $GLOBALS['conn']->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $jobs = [];
    
    while ($row = $result->fetch_assoc()) {
        // 取得職缺要求技能
        $reqStmt = $GLOBALS['conn']->prepare("
            SELECT skill_name 
            FROM job_requirements 
            WHERE job_id = ?
        ");
        $reqStmt->bind_param("i", $row['id']);
        $reqStmt->execute();
        $reqResult = $reqStmt->get_result();
        
        $requirements = [];
        while ($req = $reqResult->fetch_assoc()) {
            $requirements[] = $req['skill_name'];
        }
        
        $row['requirements'] = $requirements;
        $row['submitted_at'] = date('Y-m-d H:i', strtotime($row['created_at']));
        
        $jobs[] = $row;
    }
    
    sendResponse($jobs, 200, '取得職缺列表成功');
}

// 核准職缺
function approveJob($data) {
    checkPermission('admin');
    
    if (!isset($data['id'])) {
        sendError('缺少職缺 ID', 400);
    }
    
    $jobId = (int)$data['id'];
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE jobs 
        SET status = 'open', updated_at = NOW() 
        WHERE id = ?
    ");
    $stmt->bind_param("i", $jobId);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '職缺已核准');
    } else {
        sendError('核准失敗', 500);
    }
}

// 拒絕職缺
function rejectJob($data) {
    checkPermission('admin');
    
    if (!isset($data['id'])) {
        sendError('缺少職缺 ID', 400);
    }
    
    $jobId = (int)$data['id'];
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE jobs 
        SET status = 'rejected', updated_at = NOW() 
        WHERE id = ?
    ");
    $stmt->bind_param("i", $jobId);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '職缺已拒絕');
    } else {
        sendError('拒絕失敗', 500);
    }
}
?>

