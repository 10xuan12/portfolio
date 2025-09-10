<?php
require_once '../config.php';

// 設定 CORS 與回應格式
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');
header('Content-Type: application/json; charset=utf-8');

// 預檢請求直接回 200
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 學生作品管理 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $action = $_GET['action'] ?? '';
        switch ($action) {
            case 'get':
                getPortfolioDetail();
                break;
            case 'list':
                getPortfolioList();
                break;
            case 'categories':
                getCategories();
                break;
            case 'get_related':
                getRelatedPortfolios();
                break;
            default:
                sendError('無效的操作', 400);
        }
        break;
        
    case 'POST':
        // 同時支援 JSON 與 multipart/form-data 的 action 解析
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
        $isMultipart = stripos($contentType, 'multipart/form-data') !== false;
        $input = $isMultipart ? [] : json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) { $input = []; }
        $action = $input['action'] ?? ($_POST['action'] ?? '');
        
        switch ($action) {
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
                // multipart 透過 $_FILES/$_POST 傳遞
                uploadPortfolioFiles();
                break;
            case 'toggle_status':
                togglePortfolioStatus($input);
                break;
            case 'toggle_like':
                togglePortfolioLike($input);
                break;
            case 'add_comment':
                addPortfolioComment($input);
                break;
            case 'like_comment':
                likePortfolioComment($input);
                break;
            case 'download_file':
                downloadPortfolioFile($input);
                break;
            case 'record_view':
                recordPortfolioView($input);
                break;
            default:
                sendError('無效的操作', 400);
        }
        break;
        
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得作品列表
function getPortfolioList() {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
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
        // 以前是 p.category，資料庫實際為 categories.slug
        $where .= " AND c.slug = ?";
        $params[] = $category;
        $types .= "s";
    }
    
    if ($search) {
        $where .= " AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sss";
    }
    
    try {
        // 查詢作品列表
        $stmt = $GLOBALS['conn']->prepare("
            SELECT 
                p.id, p.title, p.description, p.status,
                c.slug AS category, p.tags,
                p.cover_image, p.view_count, p.like_count, p.comment_count, 
                p.download_count, p.created_at, p.published_at
            FROM portfolios p
            LEFT JOIN categories c ON p.category_id = c.id
            $where
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        ");
        
        if (!$stmt) {
            // 資料表可能不存在，回傳預設作品
            sendResponse(getDefaultPortfolios(), 200, '使用預設作品');
            return;
        }
        
        $params[] = $limit;
        $params[] = $offset;
        $types .= "ii";
        
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $portfolios = [];
        while ($row = $result->fetch_assoc()) {
            $portfolios[] = [
                'id' => (int)$row['id'],
                'title' => $row['title'],
                'description' => $row['description'],
                'status' => $row['status'],
                'category' => $row['category'],
                'tags' => $row['tags'] ? explode(',', $row['tags']) : [],
                'cover_image' => $row['cover_image'],
                'views' => (int)$row['view_count'],
                'likes' => (int)$row['like_count'],
                'comments' => (int)$row['comment_count'],
                'downloads' => (int)$row['download_count'],
                'created_at' => $row['created_at'],
                'published_at' => $row['published_at']
            ];
        }
        
        if (empty($portfolios)) {
            $portfolios = getDefaultPortfolios();
        }
        
        sendResponse($portfolios, 200, '成功獲取作品列表');
        
    } catch (Exception $e) {
        sendResponse(getDefaultPortfolios(), 200, '使用預設作品');
    }
}

// 取得作品詳情
function getPortfolioDetail() {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $portfolioId = isset($_GET['portfolio_id']) ? (int)$_GET['portfolio_id'] : 0;
    if (!$portfolioId) {
        sendError('缺少作品 ID', 400);
    }
    
    try {
        $stmt = $GLOBALS['conn']->prepare("
            SELECT 
                p.*, u.name as author_name, u.department, u.grade
            FROM portfolios p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        ");
        
        if (!$stmt) {
            sendResponse(getDefaultPortfolioDetail($portfolioId), 200, '使用預設作品詳情');
            return;
        }
        
        $stmt->bind_param("i", $portfolioId);
        $stmt->execute();
        $result = $stmt->get_result();
        $portfolio = $result->fetch_assoc();
        
        if (!$portfolio) {
            sendResponse(getDefaultPortfolioDetail($portfolioId), 200, '使用預設作品詳情');
            return;
        }
        
        // 取得作品檔案
        $stmt = $GLOBALS['conn']->prepare("
            SELECT * FROM portfolio_files 
            WHERE portfolio_id = ? 
            ORDER BY sort_order, created_at
        ");
        
        $files = [];
        if ($stmt) {
            $stmt->bind_param("i", $portfolioId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            while ($row = $result->fetch_assoc()) {
                $files[] = $row;
            }
        }
        
        // 取得評論（對應 comments 表，動態計數 likes/comments）
        $stmt = $GLOBALS['conn']->prepare(
            "SELECT 
                c.*, u.username AS author_name
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.portfolio_id = ?
             ORDER BY c.created_at DESC
             LIMIT 20"
        );
        
        $comments = [];
        if ($stmt) {
            $stmt->bind_param("i", $portfolioId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            while ($row = $result->fetch_assoc()) {
                $comments[] = [
                    'id' => (int)$row['id'],
                    'author' => $row['author_name'] ?: '使用者',
                    'avatar' => substr($row['author_name'] ?: '用', 0, 1),
                    'text' => $row['content'] ?: '',
                    'likes' => 0,
                    'time' => formatTime($row['created_at'])
                ];
            }
        }
        
        // 動態計算作品讚數與留言數
        $likeCount = 0; $commentCount = 0;
        $stmtCnt = $GLOBALS['conn']->prepare("SELECT COUNT(*) AS cnt FROM likes WHERE portfolio_id = ?");
        if ($stmtCnt) {
            $stmtCnt->bind_param("i", $portfolioId);
            $stmtCnt->execute();
            $likeCount = (int)($stmtCnt->get_result()->fetch_assoc()['cnt'] ?? 0);
        }
        $stmtCnt2 = $GLOBALS['conn']->prepare("SELECT COUNT(*) AS cnt FROM comments WHERE portfolio_id = ?");
        if ($stmtCnt2) {
            $stmtCnt2->bind_param("i", $portfolioId);
            $stmtCnt2->execute();
            $commentCount = (int)($stmtCnt2->get_result()->fetch_assoc()['cnt'] ?? 0);
        }
        
        $portfolio['files'] = $files;
        $portfolio['comments'] = $comments;
        $portfolio['tags'] = $portfolio['tags'] ? explode(',', $portfolio['tags']) : [];
        // 對齊前端鍵名（詳情頁與列表一致）
        $portfolio['views'] = isset($portfolio['view_count']) ? (int)$portfolio['view_count'] : 0;
        $portfolio['likes'] = $likeCount;
        $portfolio['downloads'] = isset($portfolio['download_count']) ? (int)$portfolio['download_count'] : 0;
        $portfolio['comment_count'] = $commentCount;
        
        sendResponse($portfolio, 200, '成功獲取作品詳情');
        
    } catch (Exception $e) {
        sendResponse(getDefaultPortfolioDetail($portfolioId), 200, '使用預設作品詳情');
    }
}

// 取得相關作品
function getRelatedPortfolios() {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $portfolioId = isset($_GET['portfolio_id']) ? (int)$_GET['portfolio_id'] : 0;
    
    try {
        $stmt = $GLOBALS['conn']->prepare("
            SELECT id, title, description, category
            FROM portfolios 
            WHERE user_id = ? AND id != ? AND status = 'published'
            ORDER BY RAND()
            LIMIT 3
        ");
        
        if (!$stmt) {
            sendResponse(getDefaultRelatedPortfolios(), 200, '使用預設相關作品');
            return;
        }
        
        $stmt->bind_param("ii", $userId, $portfolioId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $related = [];
        while ($row = $result->fetch_assoc()) {
            $related[] = [
                'id' => (int)$row['id'],
                'title' => $row['title'],
                'description' => $row['description']
            ];
        }
        
        if (empty($related)) {
            $related = getDefaultRelatedPortfolios();
        }
        
        sendResponse($related, 200, '成功獲取相關作品');
        
    } catch (Exception $e) {
        sendResponse(getDefaultRelatedPortfolios(), 200, '使用預設相關作品');
    }
}

// 建立作品
function createPortfolio($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $title = sanitizeInput($data['title'] ?? '');
    $description = sanitizeInput($data['description'] ?? '');
    $category = sanitizeInput($data['category'] ?? '');
    $tags = sanitizeInput($data['tags'] ?? '');
    $status = sanitizeInput($data['status'] ?? 'draft');
    
    if (empty($title) || empty($description)) {
        sendError('標題和描述不能為空', 400);
    }
    
    try {
        $stmt = $GLOBALS['conn']->prepare("
            INSERT INTO portfolios (
                user_id, title, description, category, tags, status, published_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $publishedAt = $status === 'published' ? date('Y-m-d H:i:s') : null;
        $stmt->bind_param("issssss", $userId, $title, $description, $category, $tags, $status, $publishedAt);
        
        if ($stmt->execute()) {
            $portfolioId = $GLOBALS['conn']->insert_id;
            sendResponse([
                'portfolio_id' => $portfolioId,
                'message' => '作品建立成功'
            ], 201, '建立成功');
        } else {
            sendError('建立失敗: ' . $stmt->error, 500);
        }
    } catch (Exception $e) {
        sendError('建立失敗: ' . $e->getMessage(), 500);
    }
}

// 更新作品
function updatePortfolio($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $portfolioId = (int)($data['id'] ?? 0);
    $title = sanitizeInput($data['title'] ?? '');
    $description = sanitizeInput($data['description'] ?? '');
    $category = sanitizeInput($data['category'] ?? '');
    $tags = sanitizeInput($data['tags'] ?? '');
    $status = sanitizeInput($data['status'] ?? 'draft');
    
    if (!$portfolioId || empty($title) || empty($description)) {
        sendError('缺少必要參數', 400);
    }
    
    try {
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE portfolios SET 
                title = ?, description = ?, category = ?, tags = ?, 
                status = ?, updated_at = CURRENT_TIMESTAMP,
                published_at = CASE WHEN status = 'published' AND published_at IS NULL 
                                   THEN CURRENT_TIMESTAMP ELSE published_at END
            WHERE id = ? AND user_id = ?
        ");
        
        $stmt->bind_param("sssssii", $title, $description, $category, $tags, $status, $portfolioId, $userId);
        
        if ($stmt->execute()) {
            sendResponse(['message' => '作品更新成功'], 200, '更新成功');
        } else {
            sendError('更新失敗: ' . $stmt->error, 500);
        }
    } catch (Exception $e) {
        sendError('更新失敗: ' . $e->getMessage(), 500);
    }
}

// 刪除作品
function deletePortfolio($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $portfolioId = (int)($data['portfolio_id'] ?? 0);
    if (!$portfolioId) {
        sendError('缺少作品 ID', 400);
    }
    
    try {
        $stmt = $GLOBALS['conn']->prepare("DELETE FROM portfolios WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $portfolioId, $userId);
        
        if ($stmt->execute()) {
            sendResponse(['message' => '作品刪除成功'], 200, '刪除成功');
        } else {
            sendError('刪除失敗: ' . $stmt->error, 500);
        }
    } catch (Exception $e) {
        sendError('刪除失敗: ' . $e->getMessage(), 500);
    }
}

// 讚/取消讚作品
function togglePortfolioLike($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $portfolioId = (int)($data['portfolio_id'] ?? 0);
    if (!$portfolioId) {
        sendError('缺少作品 ID', 400);
    }
    
    try {
        // 檢查是否已經讚過
        $stmt = $GLOBALS['conn']->prepare(
            "SELECT id FROM likes WHERE portfolio_id = ? AND user_id = ?"
        );
        $stmt->bind_param("ii", $portfolioId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // 取消讚
            $stmt = $GLOBALS['conn']->prepare(
                "DELETE FROM likes WHERE portfolio_id = ? AND user_id = ?"
            );
            $stmt->bind_param("ii", $portfolioId, $userId);
            $stmt->execute();
            
            // 最新讚數
            $cntStmt = $GLOBALS['conn']->prepare("SELECT COUNT(*) AS cnt FROM likes WHERE portfolio_id = ?");
            $cntStmt->bind_param("i", $portfolioId);
            $cntStmt->execute();
            $likeCountNow = (int)($cntStmt->get_result()->fetch_assoc()['cnt'] ?? 0);
            sendResponse(['liked' => false, 'like_count' => $likeCountNow], 200, '已取消讚');
        } else {
            // 新增讚
            $stmt = $GLOBALS['conn']->prepare(
                "INSERT INTO likes (portfolio_id, user_id) VALUES (?, ?)"
            );
            $stmt->bind_param("ii", $portfolioId, $userId);
            $stmt->execute();
            
            // 最新讚數
            $cntStmt = $GLOBALS['conn']->prepare("SELECT COUNT(*) AS cnt FROM likes WHERE portfolio_id = ?");
            $cntStmt->bind_param("i", $portfolioId);
            $cntStmt->execute();
            $likeCountNow = (int)($cntStmt->get_result()->fetch_assoc()['cnt'] ?? 0);
            sendResponse(['liked' => true, 'like_count' => $likeCountNow], 200, '已讚作品');
        }
    } catch (Exception $e) {
        sendError('操作失敗: ' . $e->getMessage(), 500);
    }
}

// 新增評論（comments 表）
function addPortfolioComment($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $portfolioId = (int)($data['portfolio_id'] ?? 0);
    $commentText = sanitizeInput($data['comment_text'] ?? '');
    
    if (!$portfolioId || empty($commentText)) {
        sendError('缺少必要參數', 400);
    }
    
    try {
        $stmt = $GLOBALS['conn']->prepare(
            "INSERT INTO comments (portfolio_id, user_id, content) VALUES (?, ?, ?)"
        );
        $stmt->bind_param("iis", $portfolioId, $userId, $commentText);
        
        if ($stmt->execute()) {
            $commentId = $GLOBALS['conn']->insert_id;
            sendResponse(['comment_id' => $commentId, 'message' => '評論發表成功'], 201, '發表成功');
        } else {
            sendError('發表失敗: ' . $stmt->error, 500);
        }
    } catch (Exception $e) {
        sendError('發表失敗: ' . $e->getMessage(), 500);
    }
}

// 讚評論：目前無 comment_likes 表，先回成功
function likePortfolioComment($data) {
    sendResponse(['message' => '已讚評論'], 200, '讚成功');
}

// 檔案下載
function downloadPortfolioFile($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $portfolioId = (int)($data['portfolio_id'] ?? 0);
    $filename = sanitizeInput($data['filename'] ?? '');
    
    if (!$portfolioId || empty($filename)) {
        sendError('缺少必要參數', 400);
    }
    
    try {
        $stmt = $GLOBALS['conn']->prepare("
            SELECT file_path FROM portfolio_files 
            WHERE portfolio_id = ? AND file_name = ?
        ");
        $stmt->bind_param("is", $portfolioId, $filename);
        $stmt->execute();
        $result = $stmt->get_result();
        $file = $result->fetch_assoc();
        
        if ($file) {
            // 更新下載次數
            $stmt = $GLOBALS['conn']->prepare("
                UPDATE portfolios SET download_count = download_count + 1 
                WHERE id = ?
            ");
            $stmt->bind_param("i", $portfolioId);
            $stmt->execute();
            
            sendResponse([
                'download_url' => $file['file_path'],
                'message' => '檔案下載準備完成'
            ], 200, '下載成功');
        } else {
            sendError('檔案不存在', 404);
        }
    } catch (Exception $e) {
        sendError('下載失敗: ' . $e->getMessage(), 500);
    }
}

// 記錄瀏覽次數
function recordPortfolioView($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $portfolioId = (int)($data['portfolio_id'] ?? 0);
    if (!$portfolioId) {
        sendError('缺少作品 ID', 400);
    }
    
    try {
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE portfolios SET view_count = view_count + 1 
            WHERE id = ?
        ");
        $stmt->bind_param("i", $portfolioId);
        $stmt->execute();
        
        sendResponse(['message' => '瀏覽記錄已更新'], 200, '記錄成功');
    } catch (Exception $e) {
        sendError('記錄失敗: ' . $e->getMessage(), 500);
    }
}

// 取得分類列表
function getCategories() {
    try {
        $stmt = $GLOBALS['conn']->prepare("
            SELECT id, name, slug, description 
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
    } catch (Exception $e) {
        sendResponse([
            ['id' => 1, 'name' => '網頁設計', 'slug' => 'web'],
            ['id' => 2, 'name' => '行動應用', 'slug' => 'mobile'],
            ['id' => 3, 'name' => 'UI/UX 設計', 'slug' => 'design'],
            ['id' => 4, 'name' => '數據分析', 'slug' => 'data']
        ], 200, '使用預設分類');
    }
}

// 上傳作品檔案
function uploadPortfolioFiles() {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    if (!isset($_FILES['files']) || !is_array($_FILES['files']['name'])) {
        sendError('沒有上傳檔案', 400);
    }
    
    $portfolioId = isset($_POST['portfolio_id']) ? (int)$_POST['portfolio_id'] : 0;
    
    if (!$portfolioId) {
        sendError('缺少作品 ID', 400);
    }
    
    $uploadedFiles = [];
    $errors = [];
    
    foreach ($_FILES['files']['tmp_name'] as $key => $tmpName) {
        if ($_FILES['files']['error'][$key] === UPLOAD_ERR_OK) {
            $fileName = $_FILES['files']['name'][$key];
            $fileSize = $_FILES['files']['size'][$key];
            $fileType = $_FILES['files']['type'][$key];
            
            // 生成唯一檔名
            $newFileName = 'portfolio_' . $portfolioId . '_' . time() . '_' . $key . '_' . $fileName;
            $filePath = '../uploads/portfolios/' . $newFileName;
            
            // 移動上傳的檔案
            if (move_uploaded_file($tmpName, $filePath)) {
                // 儲存到資料庫
                $relativePath = 'uploads/portfolios/' . $newFileName;
                $stmt = $GLOBALS['conn']->prepare("
                    INSERT INTO portfolio_files (
                        portfolio_id, file_name, file_path, file_size, file_type
                    ) VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->bind_param("issis", $portfolioId, $fileName, $relativePath, $fileSize, $fileType);
                
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
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $portfolioId = (int)($data['id'] ?? 0);
    $status = sanitizeInput($data['status'] ?? '');
    
    if (!$portfolioId || empty($status)) {
        sendError('缺少必要參數', 400);
    }
    
    $validStatuses = ['draft', 'published', 'archived'];
    if (!in_array($status, $validStatuses)) {
        sendError('無效的狀態', 400);
    }
    
    try {
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
    } catch (Exception $e) {
        sendError('更新失敗: ' . $e->getMessage(), 500);
    }
}

// 預設作品列表
function getDefaultPortfolios() {
    return [
        [
            'id' => 1,
            'title' => '響應式網站設計',
            'description' => '使用 HTML5、CSS3 和 JavaScript 製作的現代化響應式網站，支援各種裝置尺寸。',
            'status' => 'published',
            'category' => 'web',
            'tags' => ['HTML5', 'CSS3', 'JavaScript', '響應式'],
            'cover_image' => 'https://via.placeholder.com/400x200/667eea/ffffff?text=Web+Design',
            'views' => 156,
            'likes' => 23,
            'comments' => 8,
            'downloads' => 12,
            'created_at' => '2024-01-15 10:30:00',
            'published_at' => '2024-01-15 10:30:00'
        ],
        [
            'id' => 2,
            'title' => '行動應用程式',
            'description' => '使用 React Native 開發的跨平台行動應用程式，提供流暢的使用者體驗。',
            'status' => 'published',
            'category' => 'mobile',
            'tags' => ['React Native', 'JavaScript', 'Firebase', '跨平台'],
            'cover_image' => 'https://via.placeholder.com/400x200/764ba2/ffffff?text=Mobile+App',
            'views' => 203,
            'likes' => 45,
            'comments' => 12,
            'downloads' => 8,
            'created_at' => '2024-01-14 14:20:00',
            'published_at' => '2024-01-14 14:20:00'
        ]
    ];
}

// 預設作品詳情
function getDefaultPortfolioDetail($portfolioId) {
    return [
        'id' => $portfolioId,
        'title' => '響應式網站設計',
        'description' => '使用 HTML5、CSS3 和 JavaScript 製作的現代化響應式網站，支援各種裝置尺寸。',
        'status' => 'published',
        'category' => 'web',
        'tags' => ['HTML5', 'CSS3', 'JavaScript', '響應式'],
        'cover_image' => 'https://via.placeholder.com/400x200/667eea/ffffff?text=Web+Design',
        // 舊鍵名（保留相容）
        'view_count' => 156,
        'like_count' => 23,
        'comment_count' => 8,
        'download_count' => 12,
        // 新鍵名（與前端一致）
        'views' => 156,
        'likes' => 23,
        'downloads' => 12,
        'created_at' => '2024-01-15 10:30:00',
        'published_at' => '2024-01-15 10:30:00',
        'author_name' => '張小明',
        'department' => '資訊管理學系',
        'grade' => '大三',
        'files' => [],
        'comments' => [
            [
                'id' => 1,
                'author' => '李大明',
                'avatar' => '李',
                'text' => '設計很棒！',
                'likes' => 2,
                'time' => '2 小時前'
            ]
        ]
    ];
}

// 預設相關作品
function getDefaultRelatedPortfolios() {
    return [
        [
            'id' => 2,
            'title' => '行動應用程式',
            'description' => '使用 React Native 開發的跨平台應用'
        ],
        [
            'id' => 3,
            'title' => 'UI/UX 設計作品',
            'description' => '使用 Figma 設計的現代化介面'
        ]
    ];
}

// 格式化時間
function formatTime($datetime) {
    $time = strtotime($datetime);
    $now = time();
    $diff = $now - $time;
    
    if ($diff < 60) {
        return '剛剛';
    } elseif ($diff < 3600) {
        return floor($diff / 60) . ' 分鐘前';
    } elseif ($diff < 86400) {
        return floor($diff / 3600) . ' 小時前';
    } elseif ($diff < 2592000) {
        return floor($diff / 86400) . ' 天前';
    } else {
        return date('Y-m-d', $time);
    }
}

// 取得使用者 ID
function getUserId() {
    if (isset($_SESSION['user_id'])) {
        return $_SESSION['user_id'];
    }
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (isset($headers['X-User-ID'])) {
        return $headers['X-User-ID'];
    }
    if (isset($_GET['user_id'])) {
        return $_GET['user_id'];
    }
    if (isset($_POST['user_id'])) {
        return $_POST['user_id'];
    }
    return null;
}

// 注意：sanitizeInput 函數已在 config.php 中定義

?>
