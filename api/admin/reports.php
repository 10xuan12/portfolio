<?php
require_once __DIR__ . '/../config.php';

// 管理員報告管理 API
// 檢查管理員權限
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    sendError('需要管理員權限', 403);
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getReports();
        break;
    case 'POST':
        handlePost();
        break;
    case 'PUT':
        handlePut();
        break;
    case 'DELETE':
        handleDelete();
        break;
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得報告列表
function getReports() {
    try {
        // 解析篩選條件
        $search = $_GET['q'] ?? '';
        $type = $_GET['type'] ?? '';
        $status = $_GET['status'] ?? '';
        $date = $_GET['date'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        // 建立查詢條件
        $where = ['1=1'];
        $params = [];
        $types = '';
        
        // 搜尋條件
        if (!empty($search)) {
            $where[] = "(r.reason LIKE ? OR r.description LIKE ? OR reporter.username LIKE ? OR reported.username LIKE ?)";
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
            $types .= 'ssss';
        }
        
        // 報告類型
        if (!empty($type)) {
            $where[] = "r.type = ?";
            $params[] = $type;
            $types .= 's';
        }
        
        // 狀態
        if (!empty($status)) {
            $where[] = "r.status = ?";
            $params[] = $status;
            $types .= 's';
        }
        
        // 日期篩選
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
        
        // 查詢總數
        $countSql = "
            SELECT COUNT(*) as total
            FROM reports r
            LEFT JOIN users reporter ON r.reporter_id = reporter.id
            LEFT JOIN users reported ON r.reported_user_id = reported.id
            WHERE $whereClause
        ";
        
        $countStmt = $GLOBALS['conn']->prepare($countSql);
        if (!empty($params)) {
            $countStmt->bind_param($types, ...$params);
        }
        $countStmt->execute();
        $total = $countStmt->get_result()->fetch_assoc()['total'];
        
        // 查詢報告資料
        $sql = "
            SELECT 
                r.id,
                r.type,
                r.reason,
                r.description,
                r.status,
                r.content_type,
                r.content_id,
                r.created_at,
                r.resolved_at,
                r.resolved_by,
                r.resolution_note,
                reporter.username as reporter_username,
                reporter.id as reporter_id,
                reported.username as reported_username,
                reported.id as reported_user_id
            FROM reports r
            LEFT JOIN users reporter ON r.reporter_id = reporter.id
            LEFT JOIN users reported ON r.reported_user_id = reported.id
            WHERE $whereClause
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $stmt = $GLOBALS['conn']->prepare($sql);
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';
        
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
                'content_type' => $row['content_type'],
                'content_id' => (int)$row['content_id'],
                'reporter' => $row['reporter_username'] ?? '系統',
                'reporter_id' => (int)($row['reporter_id'] ?? 0),
                'reported' => $row['reported_username'] ?? '未知',
                'reported_user_id' => (int)($row['reported_user_id'] ?? 0),
                'submitted_at' => $row['created_at'],
                'resolved_at' => $row['resolved_at'],
                'resolved_by' => $row['resolved_by'],
                'resolution_note' => $row['resolution_note']
            ];
        }
        
        // 統計數據
        $stats = getReportStats();
        
        $response = [
            'reports' => $reports,
            'stats' => $stats,
            'pagination' => [
                'total' => (int)$total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]
        ];
        
        sendResponse($response, 200, '取得報告列表成功');
        
    } catch (Exception $e) {
        sendError('取得報告列表失敗: ' . $e->getMessage(), 500);
    }
}

// 報告統計
function getReportStats() {
    $sql = "
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed
        FROM reports
    ";
    
    $result = $GLOBALS['conn']->query($sql);
    $row = $result->fetch_assoc();
    
    return [
        'total' => (int)$row['total'],
        'pending' => (int)$row['pending'],
        'resolved' => (int)$row['resolved'],
        'dismissed' => (int)$row['dismissed']
    ];
}

// 處理 POST 請求
function handlePost() {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'resolve':
            resolveReport($input);
            break;
        case 'dismiss':
            dismissReport($input);
            break;
        default:
            sendError('未知的操作', 400);
    }
}

// 處理報告
function resolveReport($data) {
    try {
        $reportId = $data['report_id'] ?? 0;
        $action = $data['resolution_action'] ?? '';
        $note = $data['note'] ?? '';
        
        if (!$reportId) {
            sendError('缺少報告 ID', 400);
        }
        
        $adminId = $_SESSION['user_id'];
        $adminUsername = $_SESSION['username'] ?? 'admin';
        
        // 更新報告狀態
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE reports 
            SET status = 'resolved',
                resolved_at = NOW(),
                resolved_by = ?,
                resolution_note = ?
            WHERE id = ?
        ");
        $stmt->bind_param('ssi', $adminUsername, $note, $reportId);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            sendError('報告不存在', 404);
        }
        
        sendResponse([
            'report_id' => $reportId,
            'status' => 'resolved'
        ], 200, '報告已處理');
        
    } catch (Exception $e) {
        sendError('處理報告失敗: ' . $e->getMessage(), 500);
    }
}

// 駁回報告
function dismissReport($data) {
    try {
        $reportId = $data['report_id'] ?? 0;
        $reason = $data['reason'] ?? '';
        
        if (!$reportId) {
            sendError('缺少報告 ID', 400);
        }
        
        $adminUsername = $_SESSION['username'] ?? 'admin';
        
        // 更新報告狀態
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE reports 
            SET status = 'dismissed',
                resolved_at = NOW(),
                resolved_by = ?,
                resolution_note = ?
            WHERE id = ?
        ");
        $stmt->bind_param('ssi', $adminUsername, $reason, $reportId);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            sendError('報告不存在', 404);
        }
        
        sendResponse([
            'report_id' => $reportId,
            'status' => 'dismissed'
        ], 200, '報告已駁回');
        
    } catch (Exception $e) {
        sendError('駁回報告失敗: ' . $e->getMessage(), 500);
    }
}

// 處理 PUT 請求（更新報告狀態）
function handlePut() {
    $input = json_decode(file_get_contents('php://input'), true);
    $reportId = $input['report_id'] ?? 0;
    $status = $input['status'] ?? '';
    
    if (!$reportId) {
        sendError('缺少報告 ID', 400);
    }
    
    if (!in_array($status, ['pending', 'resolved', 'dismissed'])) {
        sendError('無效的狀態', 400);
    }
    
    try {
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE reports 
            SET status = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmt->bind_param('si', $status, $reportId);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            sendError('報告不存在', 404);
        }
        
        sendResponse([
            'report_id' => $reportId,
            'status' => $status
        ], 200, '報告狀態更新成功');
        
    } catch (Exception $e) {
        sendError('更新報告失敗: ' . $e->getMessage(), 500);
    }
}

// 處理 DELETE 請求（刪除報告）
function handleDelete() {
    $reportId = $_GET['report_id'] ?? 0;
    
    if (!$reportId) {
        sendError('缺少報告 ID', 400);
    }
    
    try {
        $stmt = $GLOBALS['conn']->prepare("DELETE FROM reports WHERE id = ?");
        $stmt->bind_param('i', $reportId);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            sendError('報告不存在', 404);
        }
        
        sendResponse([
            'report_id' => $reportId
        ], 200, '報告刪除成功');
        
    } catch (Exception $e) {
        sendError('刪除報告失敗: ' . $e->getMessage(), 500);
    }
}
?>
