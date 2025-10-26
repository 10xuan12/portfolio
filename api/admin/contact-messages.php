<?php
/**
 * 管理員查看聯絡訊息 API
 */

require_once '../config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 預檢請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 驗證管理員權限（簡單版本，您可以加強驗證）
// $userId = getUserId();
// if (!$userId || !isAdmin($userId)) {
//     sendError('無權限訪問', 403);
// }

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getContactMessages();
        break;
    case 'PUT':
        updateMessageStatus();
        break;
    case 'DELETE':
        deleteMessage();
        break;
    default:
        sendError('不支援的 HTTP 方法', 405);
}

/**
 * 獲取聯絡訊息列表
 */
function getContactMessages() {
    global $conn;
    
    $status = $_GET['status'] ?? 'all';
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;
    
    // 建立查詢條件
    $where = '';
    if ($status !== 'all') {
        $where = "WHERE status = '" . $conn->real_escape_string($status) . "'";
    }
    
    // 查詢訊息
    $query = "
        SELECT 
            id, name, email, message, status, ip_address,
            created_at, read_at, replied_at
        FROM contact_messages
        $where
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $messages = [];
    while ($row = $result->fetch_assoc()) {
        $messages[] = $row;
    }
    
    // 查詢總數
    $countQuery = "SELECT COUNT(*) as total FROM contact_messages $where";
    $totalResult = $conn->query($countQuery);
    $total = $totalResult->fetch_assoc()['total'];
    
    // 統計各狀態數量
    $statsQuery = "
        SELECT 
            status,
            COUNT(*) as count
        FROM contact_messages
        GROUP BY status
    ";
    $statsResult = $conn->query($statsQuery);
    $stats = [];
    while ($row = $statsResult->fetch_assoc()) {
        $stats[$row['status']] = (int)$row['count'];
    }
    
    sendResponse([
        'messages' => $messages,
        'pagination' => [
            'total' => (int)$total,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($total / $limit)
        ],
        'stats' => $stats
    ], 200, '獲取訊息成功');
}

/**
 * 更新訊息狀態
 */
function updateMessageStatus() {
    global $conn;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $messageId = $input['id'] ?? 0;
    $newStatus = $input['status'] ?? '';
    
    if (!$messageId || !in_array($newStatus, ['unread', 'read', 'replied'])) {
        sendError('無效的參數', 400);
    }
    
    $updateField = '';
    if ($newStatus === 'read' || $newStatus === 'replied') {
        $updateField = $newStatus === 'read' ? ', read_at = NOW()' : ', replied_at = NOW()';
    }
    
    $query = "UPDATE contact_messages SET status = ? $updateField WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("si", $newStatus, $messageId);
    
    if ($stmt->execute()) {
        sendResponse(['message' => '狀態更新成功'], 200, '更新成功');
    } else {
        sendError('更新失敗', 500);
    }
}

/**
 * 刪除訊息
 */
function deleteMessage() {
    global $conn;
    
    $messageId = $_GET['id'] ?? 0;
    
    if (!$messageId) {
        sendError('缺少訊息 ID', 400);
    }
    
    $stmt = $conn->prepare("DELETE FROM contact_messages WHERE id = ?");
    $stmt->bind_param("i", $messageId);
    
    if ($stmt->execute()) {
        sendResponse(['message' => '訊息已刪除'], 200, '刪除成功');
    } else {
        sendError('刪除失敗', 500);
    }
}
?>

