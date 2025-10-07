<?php
require_once '../config.php';

// 管理員企業管理 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'list':
                    getEnterprises();
                    break;
                case 'pending':
                    getPendingEnterprises();
                    break;
                case 'detail':
                    getEnterpriseDetail();
                    break;
                default:
                    sendError('無效的操作', 400);
            }
        } else {
            sendError('缺少操作類型', 400);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'approve':
                    approveEnterprise($input);
                    break;
                case 'reject':
                    rejectEnterprise($input);
                    break;
                case 'suspend':
                    suspendEnterprise($input);
                    break;
                case 'activate':
                    activateEnterprise($input);
                    break;
                default:
                    sendError('無效的操作', 400);
            }
        } else {
            sendError('缺少操作類型', 400);
        }
        break;
        
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得企業列表
function getEnterprises() {
    checkPermission('admin');
    
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    $search = isset($_GET['search']) ? sanitizeInput($_GET['search']) : '';
    
    $offset = ($page - 1) * $limit;
    
    // 建立查詢條件
    $where = "WHERE u.role = 'enterprise'";
    $params = [];
    $types = "";
    
    if ($status && $status !== 'all') {
        $where .= " AND u.status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    if ($search) {
        $where .= " AND (ep.company_name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sss";
    }
    
    // 查詢企業列表
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            u.id, u.username, u.email, u.status, u.created_at,
            ep.company_name, ep.company_type, ep.industry, 
            ep.contact_person, ep.phone, ep.is_verified, ep.verification_date
        FROM users u
        LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
        $where
        ORDER BY u.created_at DESC
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
    $enterprises = $result->fetch_all(MYSQLI_ASSOC);
    
    // 查詢總數
    $countStmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as total
        FROM users u
        LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
        $where
    ");
    
    if (!empty($params) && count($params) > 2) {
        $countParams = array_slice($params, 0, -2);
        $countTypes = substr($types, 0, -2);
        $countStmt->bind_param($countTypes, ...$countParams);
    }
    
    $countStmt->execute();
    $total = $countStmt->get_result()->fetch_assoc()['total'];
    
    $response = [
        'enterprises' => $enterprises,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ];
    
    sendResponse($response, 200, '取得企業列表成功');
}

// 取得待審核企業列表
function getPendingEnterprises() {
    checkPermission('admin');
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            u.id, u.username, u.email, u.created_at,
            ep.company_name, ep.company_type, ep.industry, 
            ep.contact_person, ep.phone, ep.website, ep.address, ep.description
        FROM users u
        LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
        WHERE u.role = 'enterprise' AND u.status = 'pending'
        ORDER BY u.created_at ASC
    ");
    
    $stmt->execute();
    $result = $stmt->get_result();
    $pending = $result->fetch_all(MYSQLI_ASSOC);
    
    sendResponse(['enterprises' => $pending], 200, '取得待審核企業列表成功');
}

// 取得企業詳情
function getEnterpriseDetail() {
    checkPermission('admin');
    
    if (!isset($_GET['id'])) {
        sendError('缺少企業 ID', 400);
    }
    
    $enterpriseId = (int)$_GET['id'];
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            u.id, u.username, u.email, u.status, u.created_at, u.updated_at,
            ep.*
        FROM users u
        LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
        WHERE u.id = ? AND u.role = 'enterprise'
    ");
    
    $stmt->bind_param("i", $enterpriseId);
    $stmt->execute();
    $result = $stmt->get_result();
    $enterprise = $result->fetch_assoc();
    
    if (!$enterprise) {
        sendError('企業不存在', 404);
    }
    
    sendResponse($enterprise, 200, '取得企業詳情成功');
}

// 審核通過企業
function approveEnterprise($data) {
    checkPermission('admin');
    
    if (!isset($data['enterprise_id'])) {
        sendError('缺少企業 ID', 400);
    }
    
    $enterpriseId = (int)$data['enterprise_id'];
    $notes = isset($data['notes']) ? sanitizeInput($data['notes']) : '';
    
    // 開始交易
    $GLOBALS['conn']->begin_transaction();
    
    try {
        // 更新用戶狀態
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE users 
            SET status = 'active', updated_at = NOW() 
            WHERE id = ? AND role = 'enterprise'
        ");
        $stmt->bind_param("i", $enterpriseId);
        $stmt->execute();
        
        // 更新企業驗證狀態
        $verifyStmt = $GLOBALS['conn']->prepare("
            UPDATE enterprise_profiles 
            SET is_verified = 1, verification_date = NOW() 
            WHERE user_id = ?
        ");
        $verifyStmt->bind_param("i", $enterpriseId);
        $verifyStmt->execute();
        
        // 發送通知給企業
        $notificationStmt = $GLOBALS['conn']->prepare("
            INSERT INTO notifications (user_id, type, title, message, data) 
            VALUES (?, 'system', '帳號審核通過', '您的企業帳號已通過審核，現在可以開始使用所有功能。', ?)
        ");
        $notificationData = json_encode(['approved_at' => date('Y-m-d H:i:s'), 'notes' => $notes]);
        $notificationStmt->bind_param("is", $enterpriseId, $notificationData);
        $notificationStmt->execute();
        
        $GLOBALS['conn']->commit();
        sendResponse([], 200, '企業審核通過');
    } catch (Exception $e) {
        $GLOBALS['conn']->rollback();
        sendError('審核失敗: ' . $e->getMessage(), 500);
    }
}

// 拒絕企業
function rejectEnterprise($data) {
    checkPermission('admin');
    
    if (!isset($data['enterprise_id'])) {
        sendError('缺少企業 ID', 400);
    }
    
    $enterpriseId = (int)$data['enterprise_id'];
    $reason = isset($data['reason']) ? sanitizeInput($data['reason']) : '未通過審核';
    
    // 開始交易
    $GLOBALS['conn']->begin_transaction();
    
    try {
        // 更新用戶狀態為 inactive
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE users 
            SET status = 'inactive', updated_at = NOW() 
            WHERE id = ? AND role = 'enterprise'
        ");
        $stmt->bind_param("i", $enterpriseId);
        $stmt->execute();
        
        // 發送通知給企業
        $notificationStmt = $GLOBALS['conn']->prepare("
            INSERT INTO notifications (user_id, type, title, message, data) 
            VALUES (?, 'system', '帳號審核未通過', ?, ?)
        ");
        $message = '很抱歉，您的企業帳號未通過審核。原因：' . $reason;
        $notificationData = json_encode(['rejected_at' => date('Y-m-d H:i:s'), 'reason' => $reason]);
        $notificationStmt->bind_param("iss", $enterpriseId, $message, $notificationData);
        $notificationStmt->execute();
        
        $GLOBALS['conn']->commit();
        sendResponse([], 200, '企業已拒絕');
    } catch (Exception $e) {
        $GLOBALS['conn']->rollback();
        sendError('操作失敗: ' . $e->getMessage(), 500);
    }
}

// 暫停企業
function suspendEnterprise($data) {
    checkPermission('admin');
    
    if (!isset($data['enterprise_id'])) {
        sendError('缺少企業 ID', 400);
    }
    
    $enterpriseId = (int)$data['enterprise_id'];
    $reason = isset($data['reason']) ? sanitizeInput($data['reason']) : '帳號已暫停';
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE users 
        SET status = 'banned', updated_at = NOW() 
        WHERE id = ? AND role = 'enterprise'
    ");
    $stmt->bind_param("i", $enterpriseId);
    
    if ($stmt->execute()) {
        // 發送通知
        $notificationStmt = $GLOBALS['conn']->prepare("
            INSERT INTO notifications (user_id, type, title, message) 
            VALUES (?, 'system', '帳號已暫停', ?)
        ");
        $message = '您的企業帳號已被暫停使用。原因：' . $reason;
        $notificationStmt->bind_param("is", $enterpriseId, $message);
        $notificationStmt->execute();
        
        sendResponse([], 200, '企業已暫停');
    } else {
        sendError('暫停失敗', 500);
    }
}

// 啟用企業
function activateEnterprise($data) {
    checkPermission('admin');
    
    if (!isset($data['enterprise_id'])) {
        sendError('缺少企業 ID', 400);
    }
    
    $enterpriseId = (int)$data['enterprise_id'];
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE users 
        SET status = 'active', updated_at = NOW() 
        WHERE id = ? AND role = 'enterprise'
    ");
    $stmt->bind_param("i", $enterpriseId);
    
    if ($stmt->execute()) {
        // 發送通知
        $notificationStmt = $GLOBALS['conn']->prepare("
            INSERT INTO notifications (user_id, type, title, message) 
            VALUES (?, 'system', '帳號已啟用', '您的企業帳號已重新啟用，可以正常使用所有功能。')
        ");
        $notificationStmt->bind_param("i", $enterpriseId);
        $notificationStmt->execute();
        
        sendResponse([], 200, '企業已啟用');
    } else {
        sendError('啟用失敗', 500);
    }
}
?>

