<?php
require_once '../config.php';

// 學生作品管理 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'list':
                    getPortfolioList();
                    break;
                case 'detail':
                    getPortfolioDetail();
                    break;
                case 'categories':
                    getCategories();
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
                case 'create':
                    createPortfolio($input);
                    break;
                case 'update':
                    updatePortfolio($input);
                    break;
                case 'delete':
                    deletePortfolio($input);
                    break;
                case 'upload_files':
                    uploadPortfolioFiles();
                    break;
                case 'toggle_status':
                    togglePortfolioStatus($input);
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

// 取得作品列表
function getPortfolioList() {
    $userId = checkPermission('student');
    
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    $category = isset($_GET['category']) ? $_GET['category'] : '';
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    
    $offset = ($page - 1) * $limit;
    
    // 建立查詢條件
    $where = "WHERE p.user_id = ?";
    $params = [$userId];
    $types = "i";
    
    if ($status) {
        $where .= " AND p.status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    if ($category) {
        $where .= " AND p.category_id = ?";
        $params[] = $category;
        $types .= "i";
    }
    
    if ($search) {
        $where .= " AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sss";
    }
    
    // 查詢作品列表
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            p.id, p.title, p.description, p.status, p.cover_image,
            p.view_count, p.like_count, p.comment_count, p.download_count,
            p.created_at, p.published_at,
            c.name as category_name, c.slug as category_slug
        FROM portfolios p
        LEFT JOIN categories c ON p.category_id = c.id
        $where
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    ");
    
    $params[] = $limit;
    $params[] = $offset;
    $types .= "ii";
    
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $portfolios = [];
    while ($row = $result->fetch_assoc()) {
        $portfolios[] = $row;
    }
    
    // 查詢總數
    $countStmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as total FROM portfolios p $where
    ");
    
    $countParams = array_slice($params, 0, -2);
    $countTypes = substr($types, 0, -2);
    
    if (!empty($countParams)) {
        $countStmt->bind_param($countTypes, ...$countParams);
    }
    $countStmt->execute();
    $total = $countStmt->get_result()->fetch_assoc()['total'];
    
    sendResponse([
        'portfolios' => $portfolios,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ], 200);
}

// 取得作品詳情
function getPortfolioDetail() {
    $userId = checkPermission('student');
    $portfolioId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if (!$portfolioId) {
        sendError('缺少作品 ID', 400);
    }
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            p.*, c.name as category_name, c.slug as category_slug
        FROM portfolios p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.user_id = ?
    ");
    $stmt->bind_param("ii", $portfolioId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $portfolio = $result->fetch_assoc();
    
    if (!$portfolio) {
        sendError('找不到作品或無權限存取', 404);
    }
    
    // 取得作品檔案
    $stmt = $GLOBALS['conn']->prepare("
        SELECT * FROM portfolio_files 
        WHERE portfolio_id = ? 
        ORDER BY sort_order, created_at
    ");
    $stmt->bind_param("i", $portfolioId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $files = [];
    while ($row = $result->fetch_assoc()) {
        $files[] = $row;
    }
    
    $portfolio['files'] = $files;
    
    sendResponse($portfolio, 200);
}

// 取得分類列表
function getCategories() {
    $stmt = $GLOBALS['conn']->prepare("
        SELECT id, name, slug, description, icon, color 
        FROM categories 
        WHERE is_active = 1 
        ORDER BY sort_order, name
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
    
    sendResponse($categories, 200);
}

// 建立作品
function createPortfolio($data) {
    $userId = checkPermission('student');
    
    validateRequired($data, ['title', 'description', 'category_id']);
    
    $title = sanitizeInput($data['title']);
    $description = sanitizeInput($data['description']);
    $categoryId = (int)$data['category_id'];
    $tags = sanitizeInput($data['tags'] ?? '');
    $status = sanitizeInput($data['status'] ?? 'draft');
    $content = sanitizeInput($data['content'] ?? '');
    
    // 驗證分類 ID
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM categories WHERE id = ? AND is_active = 1");
    $stmt->bind_param("i", $categoryId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        sendError('無效的分類', 400);
    }
    
    // 驗證狀態
    $validStatuses = ['draft', 'published', 'review'];
    if (!in_array($status, $validStatuses)) {
        sendError('無效的狀態', 400);
    }
    
    $stmt = $GLOBALS['conn']->prepare("
        INSERT INTO portfolios (
            user_id, title, description, category_id, tags, status, content, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $publishedAt = $status === 'published' ? date('Y-m-d H:i:s') : null;
    $stmt->bind_param("ississs", $userId, $title, $description, $categoryId, $tags, $status, $content, $publishedAt);
    
    if ($stmt->execute()) {
        $portfolioId = $GLOBALS['conn']->insert_id;
        
        sendResponse([
            'portfolio_id' => $portfolioId,
            'message' => '作品建立成功'
        ], 201, '建立成功');
    } else {
        sendError('建立失敗: ' . $stmt->error, 500);
    }
}

// 更新作品
function updatePortfolio($data) {
    $userId = checkPermission('student');
    
    validateRequired($data, ['id', 'title', 'description', 'category_id']);
    
    $portfolioId = (int)$data['id'];
    $title = sanitizeInput($data['title']);
    $description = sanitizeInput($data['description']);
    $categoryId = (int)$data['category_id'];
    $tags = sanitizeInput($data['tags'] ?? '');
    $status = sanitizeInput($data['status'] ?? 'draft');
    $content = sanitizeInput($data['content'] ?? '');
    
    // 檢查作品是否存在且屬於該使用者
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM portfolios WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $portfolioId, $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        sendError('找不到作品或無權限編輯', 404);
    }
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE portfolios SET 
            title = ?, description = ?, category_id = ?, tags = ?, 
            status = ?, content = ?, updated_at = CURRENT_TIMESTAMP,
            published_at = CASE WHEN status = 'published' AND published_at IS NULL 
                               THEN CURRENT_TIMESTAMP ELSE published_at END
        WHERE id = ? AND user_id = ?
    ");
    
    $stmt->bind_param("ssisssii", $title, $description, $categoryId, $tags, $status, $content, $portfolioId, $userId);
    
    if ($stmt->execute()) {
        sendResponse(['message' => '作品更新成功'], 200, '更新成功');
    } else {
        sendError('更新失敗: ' . $stmt->error, 500);
    }
}

// 刪除作品
function deletePortfolio($data) {
    $userId = checkPermission('student');
    
    validateRequired($data, ['id']);
    
    $portfolioId = (int)$data['id'];
    
    // 檢查作品是否存在且屬於該使用者
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM portfolios WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $portfolioId, $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        sendError('找不到作品或無權限刪除', 404);
    }
    
    // 開始交易
    $GLOBALS['conn']->begin_transaction();
    
    try {
        // 刪除相關的檔案記錄
        $stmt = $GLOBALS['conn']->prepare("DELETE FROM portfolio_files WHERE portfolio_id = ?");
        $stmt->bind_param("i", $portfolioId);
        $stmt->execute();
        
        // 刪除作品
        $stmt = $GLOBALS['conn']->prepare("DELETE FROM portfolios WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $portfolioId, $userId);
        $stmt->execute();
        
        $GLOBALS['conn']->commit();
        
        sendResponse(['message' => '作品刪除成功'], 200, '刪除成功');
        
    } catch (Exception $e) {
        $GLOBALS['conn']->rollback();
        sendError('刪除失敗: ' . $e->getMessage(), 500);
    }
}

// 上傳作品檔案
function uploadPortfolioFiles() {
    $userId = checkPermission('student');
    
    if (!isset($_FILES['files']) || !is_array($_FILES['files']['name'])) {
        sendError('沒有上傳檔案', 400);
    }
    
    $portfolioId = isset($_POST['portfolio_id']) ? (int)$_POST['portfolio_id'] : 0;
    
    if (!$portfolioId) {
        sendError('缺少作品 ID', 400);
    }
    
    // 檢查作品是否存在且屬於該使用者
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM portfolios WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $portfolioId, $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        sendError('找不到作品或無權限上傳', 404);
    }
    
    $uploadedFiles = [];
    $errors = [];
    
    foreach ($_FILES['files']['tmp_name'] as $key => $tmpName) {
        if ($_FILES['files']['error'][$key] === UPLOAD_ERR_OK) {
            $fileName = $_FILES['files']['name'][$key];
            $fileSize = $_FILES['files']['size'][$key];
            $fileType = $_FILES['files']['type'][$key];
            
            // 驗證檔案類型
            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            if (!in_array($extension, ALLOWED_EXTENSIONS)) {
                $errors[] = "檔案 $fileName 類型不支援";
                continue;
            }
            
            // 驗證檔案大小
            if ($fileSize > UPLOAD_MAX_SIZE) {
                $errors[] = "檔案 $fileName 超過大小限制";
                continue;
            }
            
            // 生成唯一檔名
            $newFileName = 'portfolio_' . $portfolioId . '_' . time() . '_' . $key . '.' . $extension;
            $filePath = UPLOAD_PATH . 'portfolios/' . $newFileName;
            
            // 移動上傳的檔案
            if (move_uploaded_file($tmpName, $filePath)) {
                // 儲存到資料庫
                $relativePath = 'uploads/portfolios/' . $newFileName;
                $stmt = $GLOBALS['conn']->prepare("
                    INSERT INTO portfolio_files (
                        portfolio_id, file_name, file_path, file_size, file_type, file_extension
                    ) VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->bind_param("ississ", $portfolioId, $fileName, $relativePath, $fileSize, $fileType, $extension);
                
                if ($stmt->execute()) {
                    $uploadedFiles[] = [
                        'original_name' => $fileName,
                        'file_path' => $relativePath,
                        'file_size' => $fileSize
                    ];
                } else {
                    $errors[] = "檔案 $fileName 資料庫儲存失敗";
                    unlink($filePath);
                }
            } else {
                $errors[] = "檔案 $fileName 上傳失敗";
            }
        }
    }
    
    if (!empty($uploadedFiles)) {
        sendResponse([
            'uploaded_files' => $uploadedFiles,
            'errors' => $errors,
            'message' => '檔案上傳完成'
        ], 200, '上傳成功');
    } else {
        sendError('所有檔案上傳失敗: ' . implode(', ', $errors), 500);
    }
}

// 切換作品狀態
function togglePortfolioStatus($data) {
    $userId = checkPermission('student');
    
    validateRequired($data, ['id', 'status']);
    
    $portfolioId = (int)$data['id'];
    $status = sanitizeInput($data['status']);
    
    $validStatuses = ['draft', 'published', 'archived'];
    if (!in_array($status, $validStatuses)) {
        sendError('無效的狀態', 400);
    }
    
    // 檢查作品是否存在且屬於該使用者
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM portfolios WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $portfolioId, $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        sendError('找不到作品或無權限編輯', 404);
    }
    
    $publishedAt = $status === 'published' ? date('Y-m-d H:i:s') : null;
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE portfolios SET 
            status = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    ");
    
    $stmt->bind_param("ssii", $status, $publishedAt, $portfolioId, $userId);
    
    if ($stmt->execute()) {
        sendResponse(['message' => '狀態更新成功'], 200, '更新成功');
    } else {
        sendError('更新失敗: ' . $stmt->error, 500);
    }
}
?>
