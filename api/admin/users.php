<?php
require_once __DIR__ . '/../config.php';

// 管理員使用者管理 API
// 檢查管理員權限
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    sendError('需要管理員權限', 403);
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getUsers();
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

// 取得使用者列表
function getUsers() {
    try {
        // 解析篩選條件
        $search = $_GET['q'] ?? '';
        $type = $_GET['type'] ?? '';
        $status = $_GET['status'] ?? '';
        $department = $_GET['department'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        // 建立基礎查詢
        $where = ['1=1'];
        $params = [];
        $types = '';
        
        // 搜尋條件
        if (!empty($search)) {
            $where[] = "(u.username LIKE ? OR u.email LIKE ? OR sp.first_name LIKE ? OR sp.last_name LIKE ? OR ep.company_name LIKE ?)";
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
            $types .= 'sssss';
        }
        
        // 使用者類型
        if (!empty($type) && in_array($type, ['student', 'enterprise', 'admin'])) {
            $where[] = "u.role = ?";
            $params[] = $type;
            $types .= 's';
        }
        
        // 狀態
        if (!empty($status) && in_array($status, ['active', 'inactive', 'suspended', 'pending', 'banned'])) {
            $where[] = "u.status = ?";
            $params[] = $status;
            $types .= 's';
        }
        
        // 科系（僅學生）
        if (!empty($department)) {
            $where[] = "sp.department = ?";
            $params[] = $department;
            $types .= 's';
        }
        
        $whereClause = implode(' AND ', $where);
        
        // 查詢總數
        $countSql = "
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            LEFT JOIN student_profiles sp ON u.id = sp.user_id AND u.role = 'student'
            LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id AND u.role = 'enterprise'
            WHERE $whereClause
        ";
        
        $countStmt = $GLOBALS['conn']->prepare($countSql);
        if (!empty($params)) {
            $countStmt->bind_param($types, ...$params);
        }
        $countStmt->execute();
        $total = $countStmt->get_result()->fetch_assoc()['total'];
        
        // 查詢使用者資料
        $sql = "
            SELECT 
                u.id,
                u.username,
                u.email,
                u.role,
                u.status,
                u.created_at,
                u.updated_at,
                sp.first_name,
                sp.last_name,
                sp.department,
                sp.student_id,
                sp.avatar_url,
                ep.company_name,
                ep.industry,
                ep.logo_url,
                (SELECT COUNT(*) FROM portfolios WHERE user_id = u.id) as portfolio_count,
                (SELECT COUNT(*) FROM jobs WHERE enterprise_id = u.id) as job_count,
                (SELECT SUM(views) FROM portfolios WHERE user_id = u.id) as total_views
            FROM users u
            LEFT JOIN student_profiles sp ON u.id = sp.user_id AND u.role = 'student'
            LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id AND u.role = 'enterprise'
            WHERE $whereClause
            ORDER BY u.created_at DESC
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
        
        $users = [];
        while ($row = $result->fetch_assoc()) {
            // 格式化使用者資料
            $user = [
                'id' => (int)$row['id'],
                'username' => $row['username'],
                'email' => $row['email'],
                'type' => $row['role'],
                'status' => $row['status'],
                'registered_at' => $row['created_at'],
                'updated_at' => $row['updated_at']
            ];
            
            // 根據角色添加額外資訊
            if ($row['role'] === 'student') {
                $user['name'] = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
                $user['department'] = $row['department'] ?? '';
                $user['student_id'] = $row['student_id'] ?? '';
                $user['avatar_url'] = $row['avatar_url'] ?? '';
                $user['stats'] = [
                    'portfolios' => (int)($row['portfolio_count'] ?? 0),
                    'views' => (int)($row['total_views'] ?? 0),
                    'likes' => 0 // TODO: 如果有 likes 表可以添加
                ];
            } elseif ($row['role'] === 'enterprise') {
                $user['name'] = $row['company_name'] ?? '';
                $user['department'] = $row['industry'] ?? '';
                $user['logo_url'] = $row['logo_url'] ?? '';
                $user['stats'] = [
                    'jobs' => (int)($row['job_count'] ?? 0),
                    'applications' => 0, // TODO: 如果有 applications 表可以添加
                    'views' => 0
                ];
            } else {
                $user['name'] = $row['username'];
                $user['department'] = '管理員';
                $user['stats'] = [
                    'actions' => 0,
                    'reviews' => 0
                ];
            }
            
            $users[] = $user;
        }
        
        $response = [
            'users' => $users,
            'pagination' => [
                'total' => (int)$total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]
        ];
        
        sendResponse($response, 200, '取得使用者列表成功');
        
    } catch (Exception $e) {
        sendError('取得使用者列表失敗: ' . $e->getMessage(), 500);
    }
}

// 處理 POST 請求（批量操作）
function handlePost() {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'bulk_update':
            bulkUpdateUsers($input);
            break;
        case 'create':
            createUser($input);
            break;
        default:
            sendError('未知的操作', 400);
    }
}

// 批量更新使用者
function bulkUpdateUsers($data) {
    try {
        $userIds = $data['user_ids'] ?? [];
        $operation = $data['operation'] ?? '';
        
        if (empty($userIds) || !is_array($userIds)) {
            sendError('缺少使用者 ID 列表', 400);
        }
        
        $placeholders = str_repeat('?,', count($userIds) - 1) . '?';
        
        switch ($operation) {
            case 'activate':
                $sql = "UPDATE users SET status = 'active', updated_at = NOW() WHERE id IN ($placeholders)";
                break;
            case 'deactivate':
                $sql = "UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id IN ($placeholders)";
                break;
            case 'suspend':
                $sql = "UPDATE users SET status = 'suspended', updated_at = NOW() WHERE id IN ($placeholders)";
                break;
            case 'delete':
                $sql = "DELETE FROM users WHERE id IN ($placeholders) AND role != 'admin'";
                break;
            default:
                sendError('未知的操作類型', 400);
        }
        
        $stmt = $GLOBALS['conn']->prepare($sql);
        $types = str_repeat('i', count($userIds));
        $stmt->bind_param($types, ...$userIds);
        $stmt->execute();
        
        $affected = $stmt->affected_rows;
        
        sendResponse([
            'affected' => $affected,
            'operation' => $operation
        ], 200, "批量操作成功，影響 $affected 個使用者");
        
    } catch (Exception $e) {
        sendError('批量操作失敗: ' . $e->getMessage(), 500);
    }
}

// 處理 PUT 請求（更新單個使用者）
function handlePut() {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? 0;
    $status = $input['status'] ?? '';
    
    if (!$userId) {
        sendError('缺少使用者 ID', 400);
    }
    
    if (!in_array($status, ['active', 'inactive', 'suspended', 'pending', 'banned'])) {
        sendError('無效的狀態', 400);
    }
    
    try {
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE users 
            SET status = ?, updated_at = NOW() 
            WHERE id = ? AND role != 'admin'
        ");
        $stmt->bind_param('si', $status, $userId);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            sendError('使用者不存在或無法更新', 404);
        }
        
        sendResponse([
            'user_id' => $userId,
            'status' => $status
        ], 200, '使用者狀態更新成功');
        
    } catch (Exception $e) {
        sendError('更新使用者失敗: ' . $e->getMessage(), 500);
    }
}

// 處理 DELETE 請求（刪除使用者）
function handleDelete() {
    $userId = $_GET['user_id'] ?? 0;
    
    if (!$userId) {
        sendError('缺少使用者 ID', 400);
    }
    
    try {
        // 不允許刪除管理員
        $stmt = $GLOBALS['conn']->prepare("
            DELETE FROM users 
            WHERE id = ? AND role != 'admin'
        ");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            sendError('使用者不存在或無法刪除', 404);
        }
        
        sendResponse([
            'user_id' => $userId
        ], 200, '使用者刪除成功');
        
    } catch (Exception $e) {
        sendError('刪除使用者失敗: ' . $e->getMessage(), 500);
    }
}

// 創建新使用者
function createUser($data) {
    try {
        $username = $data['username'] ?? '';
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $role = $data['role'] ?? 'student';
        
        if (empty($username) || empty($email) || empty($password)) {
            sendError('缺少必填欄位', 400);
        }
        
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $GLOBALS['conn']->prepare("
            INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'active', NOW(), NOW())
        ");
        $stmt->bind_param('ssss', $username, $email, $passwordHash, $role);
        $stmt->execute();
        
        $userId = $GLOBALS['conn']->insert_id;
        
        sendResponse([
            'user_id' => $userId,
            'username' => $username,
            'email' => $email,
            'role' => $role
        ], 201, '使用者創建成功');
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            sendError('使用者名稱或信箱已存在', 409);
        }
        sendError('創建使用者失敗: ' . $e->getMessage(), 500);
    }
}
?>
