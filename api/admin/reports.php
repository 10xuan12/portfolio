<?php
require_once '../config.php';

// 管理員報告管理 API
// 解析 RESTful 路徑
$requestUri = $_SERVER['REQUEST_URI'];
$pathAction = '';

if (preg_match('#/admin/reports/([^/?]+)#', $requestUri, $matches)) {
    $pathAction = $matches[1];
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getReports();
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $action = $pathAction ?: ($input['action'] ?? '');
        
        if ($action) {
            switch ($action) {
                case 'resolve':
                    resolveReport($input);
                    break;
                case 'dismiss':
                    dismissReport($input);
                    break;
                case 'reopen':
                    reopenReport($input);
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

// 取得報告列表
function getReports() {
    checkPermission('admin');
    
    // 注意：reports 表可能還沒建立，這裡提供示意結構
    // 如果資料庫沒有 reports 表，返回空資料
    
    try {
        $status = isset($_GET['status']) ? $_GET['status'] : '';
        $type = isset($_GET['type']) ? sanitizeInput($_GET['type']) : '';
        $search = isset($_GET['q']) ? sanitizeInput($_GET['q']) : '';
        
        // 建立查詢條件
        $where = "WHERE 1=1";
        $params = [];
        $types = "";
        
        if ($status && $status !== 'all') {
            $where .= " AND r.status = ?";
            $params[] = $status;
            $types .= "s";
        }
        
        if ($type) {
            $where .= " AND r.report_type = ?";
            $params[] = $type;
            $types .= "s";
        }
        
        if ($search) {
            $where .= " AND (r.reason LIKE ? OR r.description LIKE ?)";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $types .= "ss";
        }
        
        // 檢查 reports 表是否存在
        $tableCheck = $GLOBALS['conn']->query("SHOW TABLES LIKE 'reports'");
        if ($tableCheck->num_rows === 0) {
            // 表不存在，返回空資料
            sendResponse([], 200, '取得報告列表成功（尚無報告資料）');
            return;
        }
        
        // 查詢報告
        $sql = "
            SELECT 
                r.id, r.report_type as type, r.reason, r.description, r.status,
                r.content_type, r.content_id,
                r.created_at as submitted_at,
                u1.username as reporter,
                u2.username as reported
            FROM reports r
            JOIN users u1 ON r.reporter_id = u1.id
            LEFT JOIN users u2 ON r.reported_user_id = u2.id
            $where
            ORDER BY r.created_at DESC
        ";
        
        $stmt = $GLOBALS['conn']->prepare($sql);
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $reports = [];
        
        while ($row = $result->fetch_assoc()) {
            $row['details'] = $row['description'];
            $reports[] = $row;
        }
        
        sendResponse($reports, 200, '取得報告列表成功');
    } catch (Exception $e) {
        // 如果查詢失敗，返回空資料
        sendResponse([], 200, '取得報告列表成功（尚無報告資料）');
    }
}

// 處理報告
function resolveReport($data) {
    checkPermission('admin');
    
    if (!isset($data['id'])) {
        sendError('缺少報告 ID', 400);
    }
    
    $reportId = (int)$data['id'];
    
    try {
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE reports 
            SET status = 'resolved', 
                resolved_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->bind_param("i", $reportId);
        
        if ($stmt->execute()) {
            sendResponse([], 200, '報告已處理');
        } else {
            sendError('處理失敗', 500);
        }
    } catch (Exception $e) {
        sendError('處理失敗：' . $e->getMessage(), 500);
    }
}

// 駁回報告
function dismissReport($data) {
    checkPermission('admin');
    
    if (!isset($data['id'])) {
        sendError('缺少報告 ID', 400);
    }
    
    $reportId = (int)$data['id'];
    $reason = isset($data['reason']) ? sanitizeInput($data['reason']) : '';
    
    try {
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE reports 
            SET status = 'dismissed',
                dismiss_reason = ?,
                dismissed_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->bind_param("si", $reason, $reportId);
        
        if ($stmt->execute()) {
            sendResponse([], 200, '報告已駁回');
        } else {
            sendError('駁回失敗', 500);
        }
    } catch (Exception $e) {
        sendError('駁回失敗：' . $e->getMessage(), 500);
    }
}

// 重新開啟報告
function reopenReport($data) {
    checkPermission('admin');
    
    if (!isset($data['id'])) {
        sendError('缺少報告 ID', 400);
    }
    
    $reportId = (int)$data['id'];
    
    try {
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE reports 
            SET status = 'pending',
                resolved_at = NULL,
                dismissed_at = NULL,
                dismiss_reason = NULL,
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->bind_param("i", $reportId);
        
        if ($stmt->execute()) {
            sendResponse([], 200, '報告已重新開啟');
        } else {
            sendError('重新開啟失敗', 500);
        }
    } catch (Exception $e) {
        sendError('重新開啟失敗：' . $e->getMessage(), 500);
    }
}
?>

