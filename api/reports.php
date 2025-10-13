<?php
/**
 * 檢舉系統 API
 * 處理用戶檢舉功能
 */

require_once 'config.php';

// 檢查用戶權限
$userId = checkPermission();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'list':
                    // 管理員：查看所有檢舉
                    checkPermission('admin');
                    listReports();
                    break;
                case 'my_reports':
                    // 查看我的檢舉
                    getMyReports($userId);
                    break;
                case 'detail':
                    // 查看檢舉詳情
                    getReportDetail();
                    break;
                case 'stats':
                    // 管理員：檢舉統計
                    checkPermission('admin');
                    getReportStats();
                    break;
                default:
                    sendApiError('無效的操作', 400, 'INVALID_ACTION');
            }
        } else {
            sendApiError('缺少 action 參數', 400, 'MISSING_ACTION');
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'create':
                    // 建立檢舉
                    createReport($userId, $input);
                    break;
                case 'update_status':
                    // 管理員：更新檢舉狀態
                    checkPermission('admin');
                    updateReportStatus($userId, $input);
                    break;
                case 'resolve':
                    // 管理員：處理檢舉
                    checkPermission('admin');
                    resolveReport($userId, $input);
                    break;
                default:
                    sendApiError('無效的操作', 400, 'INVALID_ACTION');
            }
        } else {
            sendApiError('缺少 action 參數', 400, 'MISSING_ACTION');
        }
        break;
        
    default:
        sendApiError('不支援的 HTTP 方法', 405, 'METHOD_NOT_ALLOWED');
}

/**
 * 建立檢舉
 */
function createReport($userId, $data) {
    global $conn;
    
    // 驗證必填欄位
    validateRequired($data, ['reported_type', 'reported_id', 'reason']);
    
    $reportedType = sanitizeInput($data['reported_type']);
    $reportedId = (int)$data['reported_id'];
    $reason = sanitizeInput($data['reason']);
    $description = isset($data['description']) ? sanitizeInput($data['description']) : '';
    $evidenceUrl = isset($data['evidence_url']) ? sanitizeInput($data['evidence_url']) : null;
    
    // 驗證檢舉類型
    $validTypes = ['portfolio', 'comment', 'job', 'user', 'message'];
    if (!in_array($reportedType, $validTypes)) {
        sendApiError('無效的檢舉類型', 400, 'INVALID_TYPE');
    }
    
    // 驗證檢舉原因
    $validReasons = ['inappropriate', 'spam', 'harassment', 'copyright', 'other'];
    if (!in_array($reason, $validReasons)) {
        sendApiError('無效的檢舉原因', 400, 'INVALID_REASON');
    }
    
    // 檢查是否重複檢舉（同一用戶對同一對象的相同原因）
    $checkStmt = $conn->prepare("
        SELECT id FROM reports 
        WHERE reporter_id = ? 
        AND reported_type = ? 
        AND reported_id = ? 
        AND reason = ?
        AND status IN ('pending', 'reviewing')
        AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
    ");
    $checkStmt->bind_param("isis", $userId, $reportedType, $reportedId, $reason);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows > 0) {
        sendApiError('您已經檢舉過此內容，請勿重複檢舉', 400, 'DUPLICATE_REPORT');
    }
    
    // 取得被檢舉用戶的 ID
    $reportedUserId = null;
    switch ($reportedType) {
        case 'portfolio':
            $stmt = $conn->prepare("SELECT user_id FROM portfolios WHERE id = ?");
            $stmt->bind_param("i", $reportedId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $reportedUserId = $row['user_id'];
            }
            break;
        case 'comment':
            $stmt = $conn->prepare("SELECT user_id FROM comments WHERE id = ?");
            $stmt->bind_param("i", $reportedId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $reportedUserId = $row['user_id'];
            }
            break;
        case 'job':
            $stmt = $conn->prepare("SELECT enterprise_id as user_id FROM jobs WHERE id = ?");
            $stmt->bind_param("i", $reportedId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $reportedUserId = $row['user_id'];
            }
            break;
        case 'user':
            $reportedUserId = $reportedId;
            break;
    }
    
    // 插入檢舉記錄
    $stmt = $conn->prepare("
        INSERT INTO reports 
        (reporter_id, reported_type, reported_id, reported_user_id, reason, description, evidence_url, status, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'medium')
    ");
    $stmt->bind_param("isiisss", 
        $userId, 
        $reportedType, 
        $reportedId, 
        $reportedUserId,
        $reason, 
        $description, 
        $evidenceUrl
    );
    
    if ($stmt->execute()) {
        $reportId = $conn->insert_id;
        
        // 更新被檢舉對象的檢舉計數
        updateReportCount($reportedType, $reportedId);
        
        // 通知管理員
        notifyAdminsAboutReport($reportId);
        
        sendApiResponse([
            'report_id' => $reportId,
            'message' => '檢舉已提交，管理員將盡快處理'
        ], 201, '檢舉提交成功');
    } else {
        sendApiError('檢舉提交失敗：' . $conn->error, 500, 'DATABASE_ERROR');
    }
}

/**
 * 查看所有檢舉（管理員）
 */
function listReports() {
    global $conn;
    
    $status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : null;
    $type = isset($_GET['type']) ? sanitizeInput($_GET['type']) : null;
    $priority = isset($_GET['priority']) ? sanitizeInput($_GET['priority']) : null;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 20;
    $offset = ($page - 1) * $limit;
    
    // 建立查詢條件
    $where = [];
    $params = [];
    $types = '';
    
    if ($status) {
        $where[] = "r.status = ?";
        $params[] = $status;
        $types .= 's';
    }
    
    if ($type) {
        $where[] = "r.reported_type = ?";
        $params[] = $type;
        $types .= 's';
    }
    
    if ($priority) {
        $where[] = "r.priority = ?";
        $params[] = $priority;
        $types .= 's';
    }
    
    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // 查詢總數
    $countQuery = "SELECT COUNT(*) as total FROM reports r $whereClause";
    $countStmt = $conn->prepare($countQuery);
    if (!empty($params)) {
        $countStmt->bind_param($types, ...$params);
    }
    $countStmt->execute();
    $total = $countStmt->get_result()->fetch_assoc()['total'];
    
    // 查詢檢舉列表
    $query = "
        SELECT 
            r.*,
            reporter.username as reporter_username,
            reporter_profile.display_name as reporter_name,
            reported_user.username as reported_username,
            reported_user_profile.display_name as reported_user_name,
            admin.username as admin_username
        FROM reports r
        LEFT JOIN users reporter ON r.reporter_id = reporter.id
        LEFT JOIN student_profiles reporter_profile ON reporter.id = reporter_profile.user_id
        LEFT JOIN users reported_user ON r.reported_user_id = reported_user.id
        LEFT JOIN student_profiles reported_user_profile ON reported_user.id = reported_user_profile.user_id
        LEFT JOIN users admin ON r.admin_id = admin.id
        $whereClause
        ORDER BY 
            FIELD(r.priority, 'urgent', 'high', 'medium', 'low'),
            FIELD(r.status, 'pending', 'reviewing', 'resolved', 'rejected'),
            r.created_at DESC
        LIMIT ? OFFSET ?
    ";
    
    $stmt = $conn->prepare($query);
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reports = [];
    while ($row = $result->fetch_assoc()) {
        $reports[] = $row;
    }
    
    sendApiResponse([
        'reports' => $reports,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ], 200, '查詢成功');
}

/**
 * 查看我的檢舉
 */
function getMyReports($userId) {
    global $conn;
    
    $stmt = $conn->prepare("
        SELECT 
            r.*,
            admin.username as admin_username
        FROM reports r
        LEFT JOIN users admin ON r.admin_id = admin.id
        WHERE r.reporter_id = ?
        ORDER BY r.created_at DESC
        LIMIT 50
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reports = [];
    while ($row = $result->fetch_assoc()) {
        $reports[] = $row;
    }
    
    sendApiResponse(['reports' => $reports], 200, '查詢成功');
}

/**
 * 更新檢舉狀態（管理員）
 */
function updateReportStatus($adminId, $data) {
    global $conn;
    
    validateRequired($data, ['report_id', 'status']);
    
    $reportId = (int)$data['report_id'];
    $status = sanitizeInput($data['status']);
    $adminNotes = isset($data['admin_notes']) ? sanitizeInput($data['admin_notes']) : null;
    
    // 驗證狀態
    $validStatuses = ['pending', 'reviewing', 'resolved', 'rejected'];
    if (!in_array($status, $validStatuses)) {
        sendApiError('無效的狀態', 400, 'INVALID_STATUS');
    }
    
    $stmt = $conn->prepare("
        UPDATE reports 
        SET status = ?, 
            admin_id = ?,
            admin_notes = COALESCE(?, admin_notes),
            resolved_at = IF(? IN ('resolved', 'rejected'), NOW(), NULL),
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->bind_param("sissi", $status, $adminId, $adminNotes, $status, $reportId);
    
    if ($stmt->execute()) {
        // 記錄審核日誌
        logAdminAction($adminId, 'update', 'report', $reportId, null, '更新檢舉狀態為：' . $status);
        
        sendApiResponse(['message' => '狀態已更新'], 200, '更新成功');
    } else {
        sendApiError('狀態更新失敗', 500, 'UPDATE_FAILED');
    }
}

/**
 * 處理檢舉（管理員）
 */
function resolveReport($adminId, $data) {
    global $conn;
    
    validateRequired($data, ['report_id', 'resolution']);
    
    $reportId = (int)$data['report_id'];
    $resolution = sanitizeInput($data['resolution']);
    $adminNotes = isset($data['admin_notes']) ? sanitizeInput($data['admin_notes']) : '';
    
    // 驗證處置方式
    $validResolutions = ['warning', 'content_removed', 'user_suspended', 'user_banned', 'no_action'];
    if (!in_array($resolution, $validResolutions)) {
        sendApiError('無效的處置方式', 400, 'INVALID_RESOLUTION');
    }
    
    $conn->begin_transaction();
    
    try {
        // 更新檢舉記錄
        $stmt = $conn->prepare("
            UPDATE reports 
            SET status = 'resolved',
                resolution = ?,
                admin_id = ?,
                admin_notes = ?,
                resolved_at = NOW()
            WHERE id = ?
        ");
        $stmt->bind_param("sisi", $resolution, $adminId, $adminNotes, $reportId);
        $stmt->execute();
        
        // 取得檢舉詳情
        $stmt = $conn->prepare("
            SELECT reported_type, reported_id, reported_user_id, reason
            FROM reports 
            WHERE id = ?
        ");
        $stmt->bind_param("i", $reportId);
        $stmt->execute();
        $report = $stmt->get_result()->fetch_assoc();
        
        // 根據處置方式執行相應操作
        switch ($resolution) {
            case 'content_removed':
                // 刪除內容
                deleteReportedContent($report['reported_type'], $report['reported_id']);
                break;
            case 'user_suspended':
                // 停用用戶
                suspendUser($report['reported_user_id'], 30); // 停用 30 天
                break;
            case 'user_banned':
                // 封鎖用戶
                banUser($report['reported_user_id']);
                break;
            case 'warning':
                // 發出警告
                issueWarning($report['reported_user_id'], $adminId, $report['reason'], $adminNotes, $reportId);
                break;
        }
        
        // 記錄審核日誌
        logAdminAction($adminId, 'resolve', 'report', $reportId, $report['reported_user_id'], 
            "處理檢舉：{$resolution}，原因：{$adminNotes}");
        
        $conn->commit();
        
        sendApiResponse(['message' => '檢舉已處理'], 200, '處理成功');
        
    } catch (Exception $e) {
        $conn->rollback();
        sendApiError('處理失敗：' . $e->getMessage(), 500, 'RESOLVE_FAILED');
    }
}

/**
 * 更新被檢舉對象的檢舉計數
 */
function updateReportCount($type, $id) {
    global $conn;
    
    $table = '';
    switch ($type) {
        case 'portfolio':
            $table = 'portfolios';
            break;
        case 'job':
            $table = 'jobs';
            break;
        case 'comment':
            $table = 'comments';
            break;
        default:
            return;
    }
    
    $stmt = $conn->prepare("UPDATE $table SET report_count = report_count + 1 WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    
    // 如果檢舉次數超過閾值，標記為需注意
    $stmt = $conn->prepare("UPDATE $table SET is_flagged = 1 WHERE id = ? AND report_count >= 3");
    $stmt->bind_param("i", $id);
    $stmt->execute();
}

/**
 * 刪除被檢舉的內容
 */
function deleteReportedContent($type, $id) {
    global $conn;
    
    switch ($type) {
        case 'portfolio':
            $stmt = $conn->prepare("UPDATE portfolios SET status = 'archived' WHERE id = ?");
            break;
        case 'job':
            $stmt = $conn->prepare("UPDATE jobs SET status = 'closed' WHERE id = ?");
            break;
        case 'comment':
            $stmt = $conn->prepare("DELETE FROM comments WHERE id = ?");
            break;
        default:
            return;
    }
    
    $stmt->bind_param("i", $id);
    $stmt->execute();
}

/**
 * 停用用戶
 */
function suspendUser($userId, $days = 30) {
    global $conn;
    
    $stmt = $conn->prepare("UPDATE users SET status = 'inactive' WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
}

/**
 * 封鎖用戶
 */
function banUser($userId) {
    global $conn;
    
    $stmt = $conn->prepare("UPDATE users SET status = 'banned' WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
}

/**
 * 發出警告
 */
function issueWarning($userId, $adminId, $reason, $details, $reportId) {
    global $conn;
    
    $reasonMap = [
        'inappropriate' => '發布不當內容',
        'spam' => '發送垃圾訊息',
        'harassment' => '騷擾他人',
        'copyright' => '侵犯版權',
        'other' => '違反使用規範'
    ];
    
    $reasonText = $reasonMap[$reason] ?? $reason;
    
    $stmt = $conn->prepare("
        INSERT INTO user_warnings 
        (user_id, admin_id, reason, severity, details, related_report_id, expires_at)
        VALUES (?, ?, ?, 'moderate', ?, ?, DATE_ADD(NOW(), INTERVAL 90 DAY))
    ");
    $stmt->bind_param("iissi", $userId, $adminId, $reasonText, $details, $reportId);
    $stmt->execute();
}

/**
 * 記錄管理員操作
 */
function logAdminAction($adminId, $actionType, $targetType, $targetId, $targetUserId, $details) {
    global $conn;
    
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
    
    $stmt = $conn->prepare("
        INSERT INTO audit_logs 
        (admin_id, action_type, target_type, target_id, target_user_id, details, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("isssisss", $adminId, $actionType, $targetType, $targetId, $targetUserId, $details, $ipAddress, $userAgent);
    $stmt->execute();
}

/**
 * 通知管理員有新檢舉
 */
function notifyAdminsAboutReport($reportId) {
    global $conn;
    
    // 取得所有管理員
    $stmt = $conn->prepare("SELECT id FROM users WHERE role = 'admin' AND status = 'active'");
    $stmt->execute();
    $result = $stmt->get_result();
    
    // 取得檢舉資訊
    $reportStmt = $conn->prepare("
        SELECT reported_type, reason 
        FROM reports 
        WHERE id = ?
    ");
    $reportStmt->bind_param("i", $reportId);
    $reportStmt->execute();
    $report = $reportStmt->get_result()->fetch_assoc();
    
    $typeMap = [
        'portfolio' => '作品',
        'comment' => '評論',
        'job' => '職缺',
        'user' => '用戶',
        'message' => '訊息'
    ];
    
    $reasonMap = [
        'inappropriate' => '不當內容',
        'spam' => '垃圾訊息',
        'harassment' => '騷擾',
        'copyright' => '侵犯版權',
        'other' => '其他'
    ];
    
    $typeName = $typeMap[$report['reported_type']] ?? $report['reported_type'];
    $reasonName = $reasonMap[$report['reason']] ?? $report['reason'];
    
    // 發送通知給所有管理員
    $notifyStmt = $conn->prepare("
        INSERT INTO notifications (user_id, type, title, message, data, is_read)
        VALUES (?, 'system', '新檢舉待處理', ?, ?, 0)
    ");
    
    while ($admin = $result->fetch_assoc()) {
        $message = "收到新的{$typeName}檢舉（原因：{$reasonName}），請盡快處理。";
        $data = json_encode(['report_id' => $reportId, 'type' => $report['reported_type']]);
        
        $notifyStmt->bind_param("iss", $admin['id'], $message, $data);
        $notifyStmt->execute();
    }
}

/**
 * 檢舉統計（管理員）
 */
function getReportStats() {
    global $conn;
    
    // 各狀態統計
    $statusStats = [];
    $stmt = $conn->prepare("
        SELECT status, COUNT(*) as count 
        FROM reports 
        GROUP BY status
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $statusStats[$row['status']] = (int)$row['count'];
    }
    
    // 各類型統計
    $typeStats = [];
    $stmt = $conn->prepare("
        SELECT reported_type, COUNT(*) as count 
        FROM reports 
        GROUP BY reported_type
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $typeStats[$row['reported_type']] = (int)$row['count'];
    }
    
    // 今日新增
    $stmt = $conn->prepare("
        SELECT COUNT(*) as count 
        FROM reports 
        WHERE DATE(created_at) = CURDATE()
    ");
    $stmt->execute();
    $todayCount = (int)$stmt->get_result()->fetch_assoc()['count'];
    
    // 待處理數量
    $stmt = $conn->prepare("
        SELECT COUNT(*) as count 
        FROM reports 
        WHERE status IN ('pending', 'reviewing')
    ");
    $stmt->execute();
    $pendingCount = (int)$stmt->get_result()->fetch_assoc()['count'];
    
    sendApiResponse([
        'status_stats' => $statusStats,
        'type_stats' => $typeStats,
        'today_count' => $todayCount,
        'pending_count' => $pendingCount
    ], 200, '統計查詢成功');
}
?>

