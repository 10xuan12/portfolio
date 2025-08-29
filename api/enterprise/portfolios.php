<?php
require_once '../config.php';

// 企業作品瀏覽 API
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
                case 'search':
                    searchPortfolios();
                    break;
                case 'categories':
                    getCategories();
                    break;
                case 'bookmarks':
                    getBookmarks();
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
                case 'bookmark':
                    toggleBookmark($input);
                    break;
                case 'contact':
                    contactStudent($input);
                    break;
                case 'view':
                    recordView($input);
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
    $userId = checkPermission('enterprise');
    
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
    $category = isset($_GET['category']) ? $_GET['category'] : '';
    $department = isset($_GET['department']) ? $_GET['department'] : '';
    $sort = isset($_GET['sort']) ? $_GET['sort'] : 'relevance';
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    
    $offset = ($page - 1) * $limit;
    
    // 建立查詢條件
    $where = "WHERE p.status = 'published'";
    $params = [];
    $types = '';
    
    if ($category) {
        $where .= " AND c.slug = ?";
        $params[] = $category;
        $types .= "s";
    }
    
    if ($department) {
        $where .= " AND sp.major LIKE ?";
        $params[] = "%$department%";
        $types .= "s";
    }
    
    if ($search) {
        $where .= " AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ? OR sp.first_name LIKE ? OR sp.last_name LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sssss";
    }
    
    // 建立排序條件
    $orderBy = "ORDER BY ";
    switch ($sort) {
        case 'date':
            $orderBy .= "p.published_at DESC";
            break;
        case 'views':
            $orderBy .= "p.view_count DESC";
            break;
        case 'likes':
            $orderBy .= "p.like_count DESC";
            break;
        case 'relevance':
        default:
            $orderBy .= "p.is_featured DESC, p.view_count DESC, p.published_at DESC";
            break;
    }
    
    // 查詢作品列表
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            p.id, p.title, p.description, p.cover_image, p.status,
            p.view_count, p.like_count, p.comment_count, p.download_count,
            p.is_featured, p.published_at, p.created_at, p.tags,
            c.name as category_name, c.slug as category_slug, c.color as category_color,
            sp.first_name, sp.last_name, sp.display_name, sp.avatar_url,
            sp.major, sp.school, sp.grade, sp.skills,
            u.username,
            CASE WHEN eb.id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked
        FROM portfolios p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN enterprise_bookmarks eb ON p.id = eb.portfolio_id AND eb.enterprise_id = ?
        $where
        $orderBy
        LIMIT ? OFFSET ?
    ");
    
    $params = array_merge([$userId], $params, [$limit, $offset]);
    $types = "i" . $types . "ii";
    
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    $portfolios = $result->fetch_all(MYSQLI_ASSOC);
    
    // 查詢總數
    $countStmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as total
        FROM portfolios p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        $where
    ");
    
    if (!empty($params)) {
        $countParams = array_slice($params, 1, -2); // 移除 userId, limit, offset
        $countTypes = substr($types, 1, -2);
        if (!empty($countParams)) {
            $countStmt->bind_param($countTypes, ...$countParams);
        }
    }
    $countStmt->execute();
    $total = $countStmt->get_result()->fetch_assoc()['total'];
    
    // 處理資料
    foreach ($portfolios as &$portfolio) {
        $portfolio['tags'] = $portfolio['tags'] ? explode(',', $portfolio['tags']) : [];
        $portfolio['skills'] = $portfolio['skills'] ? explode(',', $portfolio['skills']) : [];
        $portfolio['student_name'] = $portfolio['display_name'] ?: ($portfolio['first_name'] . ' ' . $portfolio['last_name']);
        $portfolio['is_bookmarked'] = (bool)$portfolio['is_bookmarked'];
    }
    
    $response = [
        'portfolios' => $portfolios,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ];
    
    sendResponse($response, 200, '取得作品列表成功');
}

// 取得作品詳細資料
function getPortfolioDetail() {
    $userId = checkPermission('enterprise');
    $portfolioId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if (!$portfolioId) {
        sendError('缺少作品ID', 400);
    }
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
            sp.first_name, sp.last_name, sp.display_name, sp.avatar_url,
            sp.major, sp.school, sp.grade, sp.skills, sp.bio, sp.github, sp.linkedin,
            sp.website, sp.email as student_email,
            u.username,
            CASE WHEN eb.id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked,
            eb.notes as bookmark_notes
        FROM portfolios p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN enterprise_bookmarks eb ON p.id = eb.portfolio_id AND eb.enterprise_id = ?
        WHERE p.id = ? AND p.status = 'published'
    ");
    $stmt->bind_param("ii", $userId, $portfolioId);
    $stmt->execute();
    $result = $stmt->get_result();
    $portfolio = $result->fetch_assoc();
    
    if (!$portfolio) {
        sendError('作品不存在或未公開', 404);
    }
    
    // 處理資料
    $portfolio['tags'] = $portfolio['tags'] ? explode(',', $portfolio['tags']) : [];
    $portfolio['skills'] = $portfolio['skills'] ? explode(',', $portfolio['skills']) : [];
    $portfolio['student_name'] = $portfolio['display_name'] ?: ($portfolio['first_name'] . ' ' . $portfolio['last_name']);
    $portfolio['is_bookmarked'] = (bool)$portfolio['is_bookmarked'];
    
    // 取得作品檔案
    $filesStmt = $GLOBALS['conn']->prepare("
        SELECT id, file_name, file_path, file_size, file_type, file_extension, is_primary, sort_order
        FROM portfolio_files 
        WHERE portfolio_id = ? 
        ORDER BY is_primary DESC, sort_order ASC
    ");
    $filesStmt->bind_param("i", $portfolioId);
    $filesStmt->execute();
    $portfolio['files'] = $filesStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // 取得評論
    $commentsStmt = $GLOBALS['conn']->prepare("
        SELECT 
            c.id, c.content, c.rating, c.created_at,
            sp.first_name, sp.last_name, sp.display_name, sp.avatar_url
        FROM comments c
        LEFT JOIN student_profiles sp ON c.user_id = sp.user_id
        WHERE c.portfolio_id = ? AND c.is_approved = 1 AND c.parent_id IS NULL
        ORDER BY c.created_at DESC
        LIMIT 10
    ");
    $commentsStmt->bind_param("i", $portfolioId);
    $commentsStmt->execute();
    $portfolio['comments'] = $commentsStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // 處理評論資料
    foreach ($portfolio['comments'] as &$comment) {
        $comment['student_name'] = $comment['display_name'] ?: ($comment['first_name'] . ' ' . $comment['last_name']);
    }
    
    sendResponse($portfolio, 200, '取得作品詳細資料成功');
}

// 搜尋作品
function searchPortfolios() {
    $userId = checkPermission('enterprise');
    
    $query = isset($_GET['q']) ? $_GET['q'] : '';
    $skills = isset($_GET['skills']) ? $_GET['skills'] : '';
    $department = isset($_GET['department']) ? $_GET['department'] : '';
    $grade = isset($_GET['grade']) ? $_GET['grade'] : '';
    $matchThreshold = isset($_GET['match_threshold']) ? (int)$_GET['match_threshold'] : 0;
    
    if (empty($query) && empty($skills) && empty($department) && empty($grade)) {
        sendError('請提供搜尋條件', 400);
    }
    
    // 建立搜尋條件
    $where = "WHERE p.status = 'published'";
    $params = [];
    $types = '';
    
    if ($query) {
        $where .= " AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ? OR sp.first_name LIKE ? OR sp.last_name LIKE ?)";
        $searchTerm = "%$query%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sssss";
    }
    
    if ($skills) {
        $skillArray = explode(',', $skills);
        $skillConditions = [];
        foreach ($skillArray as $skill) {
            $skillConditions[] = "p.tags LIKE ? OR sp.skills LIKE ?";
            $skillTerm = "%$skill%";
            $params[] = $skillTerm;
            $params[] = $skillTerm;
            $types .= "ss";
        }
        $where .= " AND (" . implode(' OR ', $skillConditions) . ")";
    }
    
    if ($department) {
        $where .= " AND sp.major LIKE ?";
        $params[] = "%$department%";
        $types .= "s";
    }
    
    if ($grade) {
        $where .= " AND sp.grade = ?";
        $params[] = $grade;
        $types .= "s";
    }
    
    // 查詢作品
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            p.id, p.title, p.description, p.cover_image, p.status,
            p.view_count, p.like_count, p.comment_count, p.download_count,
            p.is_featured, p.published_at, p.created_at, p.tags,
            c.name as category_name, c.slug as category_slug, c.color as category_color,
            sp.first_name, sp.last_name, sp.display_name, sp.avatar_url,
            sp.major, sp.school, sp.grade, sp.skills,
            u.username,
            CASE WHEN eb.id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked
        FROM portfolios p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        LEFT JOIN enterprise_bookmarks eb ON p.id = eb.portfolio_id AND eb.enterprise_id = ?
        $where
        ORDER BY p.is_featured DESC, p.view_count DESC, p.published_at DESC
        LIMIT 50
    ");
    
    $params = array_merge([$userId], $params);
    $types = "i" . $types;
    
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    $portfolios = $result->fetch_all(MYSQLI_ASSOC);
    
    // 處理資料並計算匹配度
    foreach ($portfolios as &$portfolio) {
        $portfolio['tags'] = $portfolio['tags'] ? explode(',', $portfolio['tags']) : [];
        $portfolio['skills'] = $portfolio['skills'] ? explode(',', $portfolio['skills']) : [];
        $portfolio['student_name'] = $portfolio['display_name'] ?: ($portfolio['first_name'] . ' ' . $portfolio['last_name']);
        $portfolio['is_bookmarked'] = (bool)$portfolio['is_bookmarked'];
        
        // 計算匹配度
        $portfolio['match_score'] = calculateMatchScore($portfolio, $query, $skills, $department, $grade);
    }
    
    // 根據匹配度篩選和排序
    if ($matchThreshold > 0) {
        $portfolios = array_filter($portfolios, function($portfolio) use ($matchThreshold) {
            return $portfolio['match_score'] >= $matchThreshold;
        });
    }
    
    // 按匹配度排序
    usort($portfolios, function($a, $b) {
        return $b['match_score'] <=> $a['match_score'];
    });
    
    sendResponse($portfolios, 200, '搜尋完成');
}

// 取得分類列表
function getCategories() {
    $stmt = $GLOBALS['conn']->prepare("
        SELECT id, name, slug, description, icon, color, sort_order
        FROM categories 
        WHERE is_active = 1 
        ORDER BY sort_order ASC, name ASC
    ");
    $stmt->execute();
    $categories = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    sendResponse($categories, 200, '取得分類列表成功');
}

// 取得收藏列表
function getBookmarks() {
    $userId = checkPermission('enterprise');
    
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
    $offset = ($page - 1) * $limit;
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            p.id, p.title, p.description, p.cover_image, p.status,
            p.view_count, p.like_count, p.comment_count, p.download_count,
            p.is_featured, p.published_at, p.created_at, p.tags,
            c.name as category_name, c.slug as category_slug, c.color as category_color,
            sp.first_name, sp.last_name, sp.display_name, sp.avatar_url,
            sp.major, sp.school, sp.grade, sp.skills,
            u.username,
            eb.notes as bookmark_notes, eb.created_at as bookmarked_at
        FROM enterprise_bookmarks eb
        JOIN portfolios p ON eb.portfolio_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE eb.enterprise_id = ? AND p.status = 'published'
        ORDER BY eb.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->bind_param("iii", $userId, $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();
    $bookmarks = $result->fetch_all(MYSQLI_ASSOC);
    
    // 處理資料
    foreach ($bookmarks as &$bookmark) {
        $bookmark['tags'] = $bookmark['tags'] ? explode(',', $bookmark['tags']) : [];
        $bookmark['skills'] = $bookmark['skills'] ? explode(',', $bookmark['skills']) : [];
        $bookmark['student_name'] = $bookmark['display_name'] ?: ($bookmark['first_name'] . ' ' . $bookmark['last_name']);
        $bookmark['is_bookmarked'] = true;
    }
    
    sendResponse($bookmarks, 200, '取得收藏列表成功');
}

// 切換收藏狀態
function toggleBookmark($data) {
    $userId = checkPermission('enterprise');
    
    if (!isset($data['portfolio_id'])) {
        sendError('缺少作品ID', 400);
    }
    
    $portfolioId = (int)$data['portfolio_id'];
    $notes = isset($data['notes']) ? sanitizeInput($data['notes']) : '';
    
    // 檢查是否已收藏
    $checkStmt = $GLOBALS['conn']->prepare("
        SELECT id FROM enterprise_bookmarks 
        WHERE enterprise_id = ? AND portfolio_id = ?
    ");
    $checkStmt->bind_param("ii", $userId, $portfolioId);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows > 0) {
        // 取消收藏
        $deleteStmt = $GLOBALS['conn']->prepare("
            DELETE FROM enterprise_bookmarks 
            WHERE enterprise_id = ? AND portfolio_id = ?
        ");
        $deleteStmt->bind_param("ii", $userId, $portfolioId);
        
        if ($deleteStmt->execute()) {
            sendResponse(['is_bookmarked' => false], 200, '取消收藏成功');
        } else {
            sendError('取消收藏失敗', 500);
        }
    } else {
        // 新增收藏
        $insertStmt = $GLOBALS['conn']->prepare("
            INSERT INTO enterprise_bookmarks (enterprise_id, portfolio_id, notes) 
            VALUES (?, ?, ?)
        ");
        $insertStmt->bind_param("iis", $userId, $portfolioId, $notes);
        
        if ($insertStmt->execute()) {
            sendResponse(['is_bookmarked' => true], 200, '收藏成功');
        } else {
            sendError('收藏失敗', 500);
        }
    }
}

// 聯絡學生
function contactStudent($data) {
    $userId = checkPermission('enterprise');
    
    if (!isset($data['student_id']) || !isset($data['message'])) {
        sendError('缺少必要參數', 400);
    }
    
    $studentId = (int)$data['student_id'];
    $subject = isset($data['subject']) ? sanitizeInput($data['subject']) : '企業聯絡';
    $message = sanitizeInput($data['message']);
    $contactType = isset($data['contact_type']) ? sanitizeInput($data['contact_type']) : 'message';
    
    // 檢查學生是否存在
    $checkStmt = $GLOBALS['conn']->prepare("SELECT id FROM users WHERE id = ? AND role = 'student'");
    $checkStmt->bind_param("i", $studentId);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows === 0) {
        sendError('學生不存在', 404);
    }
    
    // 記錄聯絡
    $stmt = $GLOBALS['conn']->prepare("
        INSERT INTO enterprise_contacts (enterprise_id, student_id, contact_type, subject, message) 
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("iisss", $userId, $studentId, $contactType, $subject, $message);
    
    if ($stmt->execute()) {
        // 建立通知
        $enterpriseStmt = $GLOBALS['conn']->prepare("
            SELECT company_name FROM enterprise_profiles WHERE user_id = ?
        ");
        $enterpriseStmt->bind_param("i", $userId);
        $enterpriseStmt->execute();
        $enterprise = $enterpriseStmt->get_result()->fetch_assoc();
        
        $notificationStmt = $GLOBALS['conn']->prepare("
            INSERT INTO notifications (user_id, type, title, message, data) 
            VALUES (?, 'enterprise', ?, ?, ?)
        ");
        $notificationTitle = $enterprise['company_name'] . ' 聯絡了您';
        $notificationMessage = '有企業對您的作品感興趣，請查看聯絡內容。';
        $notificationData = json_encode(['contact_id' => $GLOBALS['conn']->insert_id]);
        $notificationStmt->bind_param("isss", $studentId, $notificationTitle, $notificationMessage, $notificationData);
        $notificationStmt->execute();
        
        sendResponse([], 200, '聯絡訊息已發送');
    } else {
        sendError('發送聯絡訊息失敗', 500);
    }
}

// 記錄瀏覽
function recordView($data) {
    $userId = checkPermission('enterprise');
    
    if (!isset($data['portfolio_id'])) {
        sendError('缺少作品ID', 400);
    }
    
    $portfolioId = (int)$data['portfolio_id'];
    
    // 檢查是否已瀏覽過（避免重複記錄）
    $checkStmt = $GLOBALS['conn']->prepare("
        SELECT id FROM enterprise_views 
        WHERE enterprise_id = ? AND portfolio_id = ? AND DATE(view_date) = CURDATE()
    ");
    $checkStmt->bind_param("ii", $userId, $portfolioId);
    $checkStmt->execute();
    
    if ($checkStmt->get_result()->num_rows === 0) {
        // 記錄瀏覽
        $viewStmt = $GLOBALS['conn']->prepare("
            INSERT INTO enterprise_views (enterprise_id, portfolio_id) 
            VALUES (?, ?)
        ");
        $viewStmt->bind_param("ii", $userId, $portfolioId);
        $viewStmt->execute();
        
        // 更新作品瀏覽數
        $updateStmt = $GLOBALS['conn']->prepare("
            UPDATE portfolios SET view_count = view_count + 1 WHERE id = ?
        ");
        $updateStmt->bind_param("i", $portfolioId);
        $updateStmt->execute();
    }
    
    sendResponse([], 200, '瀏覽記錄已更新');
}

// 計算匹配度
function calculateMatchScore($portfolio, $query, $skills, $department, $grade) {
    $score = 0;
    
    // 標題匹配
    if ($query && stripos($portfolio['title'], $query) !== false) {
        $score += 30;
    }
    
    // 描述匹配
    if ($query && stripos($portfolio['description'], $query) !== false) {
        $score += 20;
    }
    
    // 標籤匹配
    if ($query && $portfolio['tags']) {
        foreach ($portfolio['tags'] as $tag) {
            if (stripos($tag, $query) !== false) {
                $score += 15;
                break;
            }
        }
    }
    
    // 技能匹配
    if ($skills && $portfolio['skills']) {
        $skillArray = explode(',', $skills);
        foreach ($skillArray as $skill) {
            foreach ($portfolio['skills'] as $portfolioSkill) {
                if (stripos($portfolioSkill, trim($skill)) !== false) {
                    $score += 25;
                    break;
                }
            }
        }
    }
    
    // 科系匹配
    if ($department && stripos($portfolio['major'], $department) !== false) {
        $score += 10;
    }
    
    // 年級匹配
    if ($grade && $portfolio['grade'] === $grade) {
        $score += 5;
    }
    
    // 熱門度加分
    $score += min($portfolio['view_count'] / 100, 10);
    $score += min($portfolio['like_count'] / 10, 10);
    
    return min($score, 100);
}
