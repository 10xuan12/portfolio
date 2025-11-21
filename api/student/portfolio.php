<?php
require_once '../config.php';

header('X-Source-File: ' . __FILE__);
header('X-Source-MTime: ' . @date('c', @filemtime(__FILE__)));

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
        
        // 解析 JSON 輸入並儲存到全域變數
        global $parsedJsonInput;
        if (!$isMultipart) {
            $parsedJsonInput = json_decode(file_get_contents('php://input'), true);
            if (!is_array($parsedJsonInput)) { $parsedJsonInput = []; }
        } else {
            $parsedJsonInput = [];
        }
        
        $input = $parsedJsonInput;
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
            case 'upload_cover':
                // 上傳封面圖片
                uploadCoverImage();
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
            case 'get_file_url':
                getPortfolioFileUrl($input);
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
        // 查詢作品列表（使用 DISTINCT 避免重複）
        $stmt = $GLOBALS['conn']->prepare("
            SELECT DISTINCT
                p.id, p.title, p.description, p.status,
                c.slug AS category, p.tags,
                p.cover_image, p.portfolio_url AS url, p.view_count, p.like_count, p.comment_count, 
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
            // 處理 tags：可能是 JSON 或逗號分隔字符串
            $tagsArray = [];
            if (!empty($row['tags'])) {
                // 嘗試解析為 JSON
                $decoded = json_decode($row['tags'], true);
                if (is_array($decoded)) {
                    $tagsArray = $decoded;
                } else {
                    // 如果不是 JSON，按逗號分隔
                    $tagsArray = array_map('trim', explode(',', $row['tags']));
                }
            }
            
            $portfolios[] = [
                'id' => (int)$row['id'],
                'title' => $row['title'],
                'description' => $row['description'],
                'status' => $row['status'],
                'category' => $row['category'],
                'tags' => $tagsArray,
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
    $portfolioId = isset($_GET['portfolio_id']) ? (int)$_GET['portfolio_id'] : 0;
    if (!$portfolioId) { sendError('缺少作品 ID', 400); return; }

    $safeId = (int)$portfolioId;

    // 單筆詳情（不用 get_result，避免 mysqlnd 依賴）
    $sql = "SELECT 
                p.id, p.user_id AS author_id, p.title, p.description, p.status, p.tags, p.cover_image,
                p.portfolio_url AS url, p.view_count, p.like_count, p.comment_count, p.download_count, 
                p.created_at, p.published_at,
                u.username AS author_name,
                sp.major, sp.grade,
                c.slug AS category
            FROM portfolios p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN student_profiles sp ON sp.user_id = p.user_id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = {$safeId}
            LIMIT 1";
    $res = @$GLOBALS['conn']->query($sql);
    if (!$res || $res->num_rows === 0) {
        sendResponse(getDefaultPortfolioDetail($portfolioId), 200, '使用預設作品詳情（未找到或查詢失敗）');
        return;
    }
    $row = $res->fetch_assoc();

    // 檔案
    $files = [];
    $resFiles = @$GLOBALS['conn']->query("SELECT * FROM portfolio_files WHERE portfolio_id = {$safeId} ORDER BY sort_order, created_at");
    if ($resFiles) { while ($f = $resFiles->fetch_assoc()) { $files[] = $f; } }

    // 評論（簡化）
    $comments = [];
    $resComments = @$GLOBALS['conn']->query("SELECT c.*, u.username AS author_name
                                             FROM portfolio_comments c
                                             LEFT JOIN users u ON c.user_id = u.id
                                             WHERE c.portfolio_id = {$safeId}
                                             ORDER BY c.created_at DESC
                                             LIMIT 20");
    if ($resComments) {
        while ($c = $resComments->fetch_assoc()) {
            $comments[] = [
                'id' => (int)$c['id'],
                'author' => $c['author_name'] ?: '使用者',
                'avatar' => substr($c['author_name'] ?: '用', 0, 1),
                'text' => $c['content'] ?: '',
                'likes' => 0,
                'time' => formatTime($c['created_at'])
            ];
        }
    }

    // 直接使用資料庫中的計數欄位
    $likeCount = (int)($row['like_count'] ?? 0);
    $commentCount = (int)($row['comment_count'] ?? 0);

    // 處理 tags：可能是 JSON 或逗號分隔字符串
    $tagsArray = [];
    if (!empty($row['tags'])) {
        // 嘗試解析為 JSON
        $decoded = json_decode($row['tags'], true);
        if (is_array($decoded)) {
            $tagsArray = $decoded;
        } else {
            // 如果不是 JSON，按逗號分隔
            $tagsArray = array_map('trim', explode(',', $row['tags']));
        }
    }
    
    $portfolio = [
        'id' => (int)$row['id'],
        'author_id' => isset($row['author_id']) ? (int)$row['author_id'] : null,
        'title' => $row['title'] ?? '',
        'description' => $row['description'] ?? '',
        'status' => $row['status'] ?? 'draft',
        'category' => $row['category'] ?? null,
        'tags' => $tagsArray,
        'cover_image' => $row['cover_image'] ?? null,
        'views' => (int)($row['view_count'] ?? 0),
        'likes' => $likeCount,
        'comment_count' => $commentCount,
        'downloads' => (int)($row['download_count'] ?? 0),
        'created_at' => $row['created_at'] ?? null,
        'published_at' => $row['published_at'] ?? null,
        'author_name' => $row['author_name'] ?? '',
        'major' => $row['major'] ?? '',
        'grade' => $row['grade'] ?? '',
        'files' => $files,
        'comments' => $comments
    ];

    sendResponse($portfolio, 200, '成功獲取作品詳情');
}

// 取得相關作品
function getRelatedPortfolios() {
    $portfolioId = isset($_GET['portfolio_id']) ? (int)$_GET['portfolio_id'] : 0;

    $stmt = $GLOBALS['conn']->prepare("
        SELECT p.id, p.title, p.description
        FROM portfolios p
        WHERE p.id != ? AND p.status = 'published'
        ORDER BY RAND()
        LIMIT 3
    ");
    if (!$stmt) {
        sendResponse(getDefaultRelatedPortfolios(), 200, '使用預設相關作品（資料庫錯誤）');
        return;
    }
    $stmt->bind_param("i", $portfolioId);
    $stmt->execute();
    $res = $stmt->get_result();

    $related = [];
    while ($row = $res->fetch_assoc()) {
        $related[] = [
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'description' => $row['description']
        ];
    }
    if (empty($related)) $related = getDefaultRelatedPortfolios();
    sendResponse($related, 200, '成功獲取相關作品');
}

// 建立作品
function createPortfolio($data) {
    // 詳細調試信息
    error_log('=== createPortfolio 開始 ===');
    error_log('createPortfolio - 接收到的 $data: ' . json_encode($data, JSON_UNESCAPED_UNICODE));
    error_log('createPortfolio - Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
    error_log('createPortfolio - POST 資料: ' . json_encode($_POST, JSON_UNESCAPED_UNICODE));
    error_log('createPortfolio - FILES: ' . json_encode(array_keys($_FILES)));
    error_log('createPortfolio - GET user_id: ' . ($_GET['user_id'] ?? 'not set'));
    error_log('createPortfolio - POST user_id: ' . ($_POST['user_id'] ?? 'not set'));
    
    // 支援 multipart/form-data 和 JSON 兩種格式
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
    $isMultipart = stripos($contentType, 'multipart/form-data') !== false;
    
    // 如果是 multipart 請求，從 $_POST 讀取資料
    if ($isMultipart && !empty($_POST)) {
        $data = array_merge($data, $_POST);
        error_log('createPortfolio - Multipart 請求，$_POST 內容: ' . json_encode($_POST, JSON_UNESCAPED_UNICODE));
    }
    
    error_log('createPortfolio - 合併後的 $data: ' . json_encode($data, JSON_UNESCAPED_UNICODE));
    
    $userId = getUserId();
    error_log('createPortfolio - getUserId() 返回: ' . ($userId ?? 'null'));
    
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $title = sanitizeInput($data['title'] ?? '');
    $description = sanitizeInput($data['description'] ?? '');
    $category = sanitizeInput($data['category'] ?? '');
    
    // 記錄原始描述
    error_log('原始 description from $data: ' . var_export($data['description'] ?? 'UNDEFINED', true));
    error_log('處理後 description: ' . var_export($description, true));
    
    // 處理 tags - 如果是陣列，轉換為 JSON 字符串
    $tagsData = $data['tags'] ?? '';
    error_log('createPortfolio - 原始 tags 資料: ' . var_export($tagsData, true) . ' (type: ' . gettype($tagsData) . ')');
    
    if (is_array($tagsData)) {
        $tags = json_encode($tagsData, JSON_UNESCAPED_UNICODE);
    } else if (is_string($tagsData) && !empty($tagsData)) {
        // 如果是逗號分隔的字符串，轉換為 JSON 數組
        $tagsArray = array_map('trim', explode(',', $tagsData));
        $tags = json_encode($tagsArray, JSON_UNESCAPED_UNICODE);
    } else {
        $tags = '[]';
    }
    
    $status = sanitizeInput($data['status'] ?? 'draft');
    $coverImage = sanitizeInput($data['cover_image'] ?? '');
    
    error_log('createPortfolio - 原始 cover_image: ' . var_export($data['cover_image'] ?? 'UNDEFINED', true));
    error_log('createPortfolio - 處理後 tags: ' . $tags);
    error_log('最終要插入的: title=' . $title . ', description=' . $description . ', cover_image=' . $coverImage . ', tags=' . $tags);
    
    if (empty($title) || empty($description)) {
        error_log('驗證失敗: title=' . ($title ?: 'EMPTY') . ', description=' . ($description ?: 'EMPTY'));
        sendError('標題和描述不能為空', 400);
        return;
    }
    
    try {
        // 先取得分類 ID
        $categoryId = 1; // 預設分類
        if ($category) {
            $catStmt = $GLOBALS['conn']->prepare("SELECT id FROM categories WHERE slug = ?");
            if ($catStmt) {
                $catStmt->bind_param("s", $category);
                $catStmt->execute();
                $catResult = $catStmt->get_result();
                if ($catRow = $catResult->fetch_assoc()) {
                    $categoryId = $catRow['id'];
                }
            }
        }
        
        // 處理作品連結
        $portfolioUrl = sanitizeInput($data['url'] ?? '');
        if (!empty($portfolioUrl) && !preg_match('/^https?:\/\//', $portfolioUrl)) {
            sendError('URL 格式不正確，必須以 http:// 或 https:// 開頭', 400);
            return;
        }
        
        $stmt = $GLOBALS['conn']->prepare("
            INSERT INTO portfolios (
                user_id, title, description, category_id, tags, cover_image, portfolio_url, status, published_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $publishedAt = $status === 'published' ? date('Y-m-d H:i:s') : null;
        // i=int, s=string
        // user_id(i), title(s), description(s), category_id(i), tags(s), cover_image(s), portfolio_url(s), status(s), published_at(s)
        $stmt->bind_param("ississsss", $userId, $title, $description, $categoryId, $tags, $coverImage, $portfolioUrl, $status, $publishedAt);
        
        if ($stmt->execute()) {
            $portfolioId = $GLOBALS['conn']->insert_id;
            
            $response = [
                'portfolio_id' => $portfolioId,
                'message' => '作品建立成功'
            ];
            
            // 處理檔案上傳（如果有）
            if (isset($_FILES['files']) && is_array($_FILES['files']['name'])) {
                error_log('createPortfolio - 開始處理檔案上傳，檔案數量: ' . count($_FILES['files']['name']));
                
                $uploadedFiles = [];
                $errors = [];
                
                foreach ($_FILES['files']['tmp_name'] as $key => $tmpName) {
                    if ($_FILES['files']['error'][$key] === UPLOAD_ERR_OK) {
                        $fileName = $_FILES['files']['name'][$key];
                        $fileSize = $_FILES['files']['size'][$key];
                        $fileType = $_FILES['files']['type'][$key];
                        
                        // 生成唯一檔名
                        $extension = pathinfo($fileName, PATHINFO_EXTENSION);
                        $newFileName = 'portfolio_' . $portfolioId . '_' . time() . '_' . $key . '.' . $extension;
                        $uploadDir = __DIR__ . '/../uploads/portfolios/';
                        
                        // 確保上傳目錄存在
                        if (!is_dir($uploadDir)) {
                            mkdir($uploadDir, 0755, true);
                        }
                        
                        $filePath = $uploadDir . $newFileName;
                        
                        // 移動上傳的檔案
                        if (move_uploaded_file($tmpName, $filePath)) {
                            // 儲存到資料庫
                            $relativePath = 'uploads/portfolios/' . $newFileName;
                            $fileStmt = $GLOBALS['conn']->prepare("
                                INSERT INTO portfolio_files (
                                    portfolio_id, file_name, file_path, file_size, file_type
                                ) VALUES (?, ?, ?, ?, ?)
                            ");
                            $fileStmt->bind_param("issis", $portfolioId, $fileName, $relativePath, $fileSize, $fileType);
                            
                            if ($fileStmt->execute()) {
                                $uploadedFiles[] = [
                                    'original_name' => $fileName,
                                    'file_path' => $relativePath,
                                    'file_size' => $fileSize
                                ];
                            } else {
                                $errors[] = "檔案 $fileName 資料庫儲存失敗";
                                @unlink($filePath);
                            }
                        } else {
                            $errors[] = "檔案 $fileName 上傳失敗";
                        }
                    }
                }
                
                if (!empty($uploadedFiles)) {
                    $response['uploaded_files'] = $uploadedFiles;
                    error_log('createPortfolio - 成功上傳 ' . count($uploadedFiles) . ' 個檔案');
                }
                if (!empty($errors)) {
                    $response['file_errors'] = $errors;
                    error_log('createPortfolio - 檔案上傳錯誤: ' . implode(', ', $errors));
                }
            }
            
            // 檢查並授予徽章（失敗不影響作品創建）
            try {
                require_once __DIR__ . '/../badge-manager.php';
                $awardedBadges = checkSpecificBadge($userId, '首次上傳');
                if ($awardedBadges) {
                    $response['new_badge'] = '首次上傳';
                }
            } catch (Exception $e) {
                error_log('徽章檢查失敗: ' . $e->getMessage());
                // 繼續執行，不影響作品創建
            }
            
            sendResponse($response, 201, '建立成功');
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
    
    // 處理 tags - 如果是陣列，轉換為 JSON 字符串
    $tagsData = $data['tags'] ?? '';
    if (is_array($tagsData)) {
        $tags = json_encode($tagsData, JSON_UNESCAPED_UNICODE);
    } else if (is_string($tagsData) && !empty($tagsData)) {
        // 如果已經是 JSON 字符串或普通字符串，直接使用
        $tags = $tagsData;
    } else {
        $tags = '[]';
    }
    
    $status = sanitizeInput($data['status'] ?? 'draft');
    
    if (!$portfolioId || empty($title) || empty($description)) {
        sendError('缺少必要參數', 400);
        return;
    }
    
    try {
        // 先取得分類 ID
        $categoryId = 1; // 預設分類
        if ($category) {
            $catStmt = $GLOBALS['conn']->prepare("SELECT id FROM categories WHERE slug = ?");
            if ($catStmt) {
                $catStmt->bind_param("s", $category);
                $catStmt->execute();
                $catResult = $catStmt->get_result();
                if ($catRow = $catResult->fetch_assoc()) {
                    $categoryId = $catRow['id'];
                }
            }
        }
        
        // 處理作品連結
        $portfolioUrl = sanitizeInput($data['url'] ?? '');
        if (!empty($portfolioUrl) && !preg_match('/^https?:\/\//', $portfolioUrl)) {
            sendError('URL 格式不正確，必須以 http:// 或 https:// 開頭', 400);
            return;
        }
        
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE portfolios SET 
                title = ?, description = ?, category_id = ?, tags = ?, 
                portfolio_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP,
                published_at = CASE WHEN status = 'published' AND published_at IS NULL 
                                   THEN CURRENT_TIMESTAMP ELSE published_at END
            WHERE id = ? AND user_id = ?
        ");
        
        $stmt->bind_param("ssisssii", $title, $description, $categoryId, $tags, $portfolioUrl, $status, $portfolioId, $userId);
        
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
        return;
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
        return;
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

            // 同步更新 portfolios.like_count
            $upd = $GLOBALS['conn']->prepare("UPDATE portfolios SET like_count = ? WHERE id = ?");
            if ($upd) {
                $upd->bind_param("ii", $likeCountNow, $portfolioId);
                $upd->execute();
            }

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

            // 同步更新 portfolios.like_count
            $upd = $GLOBALS['conn']->prepare("UPDATE portfolios SET like_count = ? WHERE id = ?");
            if ($upd) {
                $upd->bind_param("ii", $likeCountNow, $portfolioId);
                $upd->execute();
            }

            sendResponse(['liked' => true, 'like_count' => $likeCountNow], 200, '已讚作品');
        }
    } catch (Exception $e) {
        sendError('操作失敗: ' . $e->getMessage(), 500);
    }
}

// 新增評論（使用 portfolio_comments 表）
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
        return;
    }
    
    try {
        $stmt = $GLOBALS['conn']->prepare(
            "INSERT INTO portfolio_comments (portfolio_id, user_id, content, like_count, is_approved, created_at, updated_at) VALUES (?, ?, ?, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        );
        $stmt->bind_param("iis", $portfolioId, $userId, $commentText);
        
        if ($stmt->execute()) {
            $commentId = $GLOBALS['conn']->insert_id;
            
            // 更新 portfolios 資料表中的 comment_count
            $updateStmt = $GLOBALS['conn']->prepare("UPDATE portfolios SET comment_count = comment_count + 1 WHERE id = ?");
            $updateStmt->bind_param("i", $portfolioId);
            $updateStmt->execute();
            
            sendResponse(['comment_id' => $commentId, 'message' => '評論發表成功'], 201, '發表成功');
        } else {
            sendError('發表失敗: ' . $stmt->error, 500);
        }
    } catch (Exception $e) {
        sendError('發表失敗: ' . $e->getMessage(), 500);
    }
}

// 讚評論：更新 portfolio_comments.like_count
function likePortfolioComment($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    $portfolioId = (int)($data['portfolio_id'] ?? 0);
    $commentId = (int)($data['comment_id'] ?? 0);
    if (!$portfolioId || !$commentId) { sendError('缺少必要參數', 400); return; }
    try {
        $stmt = $GLOBALS['conn']->prepare("UPDATE portfolio_comments SET like_count = like_count + 1 WHERE id = ? AND portfolio_id = ?");
        $stmt->bind_param("ii", $commentId, $portfolioId);
        if ($stmt->execute()) {
            $cntStmt = $GLOBALS['conn']->prepare("SELECT like_count FROM portfolio_comments WHERE id = ?");
            $cntStmt->bind_param("i", $commentId);
            $cntStmt->execute();
            $res = $cntStmt->get_result();
            $likeCountNow = (int)($res->fetch_assoc()['like_count'] ?? 0);
            sendResponse(['message' => '已讚評論', 'like_count' => $likeCountNow], 200, '讚成功');
        } else {
            sendError('操作失敗: ' . $stmt->error, 500);
        }
    } catch (Exception $e) {
        sendError('操作失敗: ' . $e->getMessage(), 500);
    }
}

// 獲取文件 URL（用於預覽）
function getPortfolioFileUrl($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $portfolioId = (int)($data['portfolio_id'] ?? 0);
    $filename = sanitizeInput($data['filename'] ?? '');
    
    if (!$portfolioId || empty($filename)) {
        sendError('缺少必要參數', 400);
        return;
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
            // 返回文件 URL（用於預覽，不更新下載次數）
            sendResponse([
                'file_url' => $file['file_path'],
                'message' => '文件 URL 獲取成功'
            ], 200, '成功');
        } else {
            sendError('檔案不存在', 404);
        }
    } catch (Exception $e) {
        sendError('獲取文件 URL 失敗: ' . $e->getMessage(), 500);
    }
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
        return;
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
        return;
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
        return;
    }
    
    $portfolioId = isset($_POST['portfolio_id']) ? (int)$_POST['portfolio_id'] : 0;
    
    if (!$portfolioId) {
        sendError('缺少作品 ID', 400);
        return;
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
            $uploadDir = '../uploads/portfolios/';
            
            // 確保上傳目錄存在
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            $filePath = $uploadDir . $newFileName;
            
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

// 上傳封面圖片（支援 Cloudinary 和本地儲存）
function uploadCoverImage() {
    require_once __DIR__ . '/../cloudinary-helper.php';
    
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    if (!isset($_FILES['cover_image']) || $_FILES['cover_image']['error'] !== UPLOAD_ERR_OK) {
        sendError('沒有上傳封面圖片或上傳失敗', 400);
        return;
    }
    
    $file = $_FILES['cover_image'];
    $fileName = $file['name'];
    $fileSize = $file['size'];
    $fileType = $file['type'];
    $tmpName = $file['tmp_name'];
    
    // 檢查檔案類型
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($fileType, $allowedTypes)) {
        sendError('不支援的圖片格式，請上傳 JPG、PNG、GIF 或 WebP 格式', 400);
        return;
    }
    
    // 檢查檔案大小（5MB）
    if ($fileSize > 5 * 1024 * 1024) {
        sendError('圖片檔案不能超過 5MB', 400);
        return;
    }
    
    // 智能上傳：優先 Cloudinary，降級本地（傳遞原始檔案名稱以獲取正確的副檔名）
    $uploadResult = smartUploadImage($tmpName, $userId, 'cover', $fileName);
    
    if ($uploadResult['success']) {
        $storageInfo = $uploadResult['storage'] === 'cloudinary' ? ' (雲端儲存)' : ' (本地儲存)';
        
        sendResponse([
            'cover_image_path' => $uploadResult['path'],
            'storage_type' => $uploadResult['storage'],
            'message' => '封面圖片上傳成功' . $storageInfo
        ], 200, '上傳成功');
    } else {
        sendError('封面圖片上傳失敗', 500);
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
        return;
    }
    
    $validStatuses = ['draft', 'published', 'archived'];
    if (!in_array($status, $validStatuses)) {
        sendError('無效的狀態', 400);
        return;
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
            'cover_image' => 'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="#667eea"/><text x="200" y="100" text-anchor="middle" fill="white" font-family="Arial" font-size="24">Web Design</text></svg>'),
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
            'cover_image' => 'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="#764ba2"/><text x="200" y="100" text-anchor="middle" fill="white" font-family="Arial" font-size="24">Mobile App</text></svg>'),
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
        'cover_image' => 'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="#667eea"/><text x="200" y="100" text-anchor="middle" fill="white" font-family="Arial" font-size="24">Web Design</text></svg>'),
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
    // 優先從 GET 參數獲取（前端傳遞）
    if (isset($_GET['user_id']) && !empty($_GET['user_id'])) {
        return (int)$_GET['user_id'];
    }
    
    // 從 POST 參數獲取
    if (isset($_POST['user_id']) && !empty($_POST['user_id'])) {
        return (int)$_POST['user_id'];
    }
    
    // 從 JSON 請求體獲取（針對 Content-Type: application/json）
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
    if (stripos($contentType, 'application/json') !== false) {
        // 檢查是否已經有解析過的 JSON 資料
        global $parsedJsonInput;
        if (!isset($parsedJsonInput)) {
            $parsedJsonInput = json_decode(file_get_contents('php://input'), true);
        }
        if (is_array($parsedJsonInput) && isset($parsedJsonInput['user_id']) && !empty($parsedJsonInput['user_id'])) {
            return (int)$parsedJsonInput['user_id'];
        }
    }
    
    // 從請求頭獲取
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (isset($headers['X-User-ID']) && !empty($headers['X-User-ID'])) {
        return (int)$headers['X-User-ID'];
    }
    
    // 從 session 獲取（最後選擇）
    if (isset($_SESSION['user_id'])) {
        return (int)$_SESSION['user_id'];
    }
    
    return null;
}

// 注意：sanitizeInput 函數已在 config.php 中定義

?>
