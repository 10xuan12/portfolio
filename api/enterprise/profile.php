<?php
require_once '../config.php';

// 企業資料管理 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'get':
                    getEnterpriseProfile();
                    break;
                case 'get_student_public_profile':
                    getStudentPublicProfile();
                    break;
                case 'get_student_public_portfolios':
                    getStudentPublicPortfolios();
                    break;
                default:
                    sendError('無效的請求', 400);
            }
        } else {
            sendError('無效的請求', 400);
        }
        break;
        
    case 'POST':
        // 嘗試解析 JSON；若為 multipart/form-data，$input 可能為 null
        $input = json_decode(file_get_contents('php://input'), true);

        // 兼容 multipart/form-data 上傳：表單欄位 action 由 $_POST 提供
        $action = null;
        if (isset($input['action'])) {
            $action = $input['action'];
        } elseif (isset($_POST['action'])) {
            $action = $_POST['action'];
        } elseif (!empty($_FILES)) {
            // 沒有 action 但有檔案上傳，視為上傳 Logo
            $action = 'upload_logo';
        }

        if ($action) {
            switch ($action) {
                case 'update':
                    updateEnterpriseProfile(is_array($input) ? $input : $_POST);
                    break;
                case 'upload_logo':
                    uploadLogo();
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

// 取得企業資料
function getEnterpriseProfile() {
    $userId = checkPermission('enterprise');
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            u.id, u.username, u.email, u.created_at,
            ep.company_name, ep.company_type, ep.industry, ep.company_size,
            ep.founded_year, ep.employee_count, ep.revenue_range,
            ep.description, ep.logo_url, ep.website, ep.address, ep.phone,
            ep.contact_person, ep.contact_email, ep.social_media,
            ep.company_culture, ep.benefits_description, ep.is_verified,
            ep.verification_date, ep.created_at as profile_created_at,
            ep.updated_at as profile_updated_at
        FROM users u
        LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
        WHERE u.id = ?
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $profile = $result->fetch_assoc();
    
    // 檢查是否為首次登入（沒有企業資料）
    if (!$profile['company_name']) {
        // 首次登入，返回基本使用者資訊
        $profile['is_first_login'] = true;
        $profile['company_name'] = '';
        $profile['company_type'] = '';
        $profile['industry'] = '';
        $profile['company_size'] = '';
        $profile['founded_year'] = '';
        $profile['employee_count'] = '';
        $profile['revenue_range'] = '';
        $profile['description'] = '';
        $profile['logo_url'] = '';
        $profile['website'] = '';
        $profile['address'] = '';
        $profile['phone'] = '';
        $profile['contact_person'] = '';
        $profile['contact_email'] = '';
        $profile['social_media'] = '{}';
        $profile['company_culture'] = '';
        $profile['benefits_description'] = '';
        $profile['is_verified'] = false;
        $profile['verification_date'] = null;
    } else {
        $profile['is_first_login'] = false;
        
        // 處理社交媒體資料（從 JSON 轉為陣列）
        $profile['social_media'] = $profile['social_media'] ? json_decode($profile['social_media'], true) : [];
        
        // 處理 Logo 路徑
        if (!empty($profile['logo_url']) && strpos($profile['logo_url'], 'http') !== 0) {
            // 確保路徑以 / 開頭（適用於本地和 Railway）
            $profile['logo_url'] = '/' . ltrim($profile['logo_url'], '/');
        }
        
        // 計算統計資料
        $stats = getEnterpriseStats($userId);
        $profile['stats'] = $stats;
    }
    
    sendResponse($profile, 200, '取得企業資料成功');
}

// 企業端：取得學生公開個人資料（不需登入學生，只需企業登入）
function getStudentPublicProfile() {
    // 僅檢查呼叫者為企業
    $enterpriseId = checkPermission('enterprise');
    if (!$enterpriseId) { sendError('無權限', 403); }

    $studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
    if (!$studentId) { sendError('缺少 student_id', 400); }

    $stmt = $GLOBALS['conn']->prepare(
        "SELECT 
            u.id, u.username, u.email,
            sp.display_name, sp.first_name, sp.last_name,
            sp.school, sp.major, sp.grade, sp.graduation_year,
            sp.bio, sp.avatar_url
         FROM users u
         LEFT JOIN student_profiles sp ON u.id = sp.user_id
         WHERE u.id = ?"
    );
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $res = $stmt->get_result();
    $profile = $res->fetch_assoc();

    if (!$profile) { sendError('學生不存在', 404); }

    // 統計資料（公開）
    $statsStmt = $GLOBALS['conn']->prepare(
        "SELECT 
            COUNT(*) AS portfolio_count,
            COALESCE(SUM(view_count),0) AS total_views,
            COALESCE(SUM(like_count),0) AS total_likes
         FROM portfolios WHERE user_id = ? AND status = 'published'"
    );
    $statsStmt->bind_param("i", $studentId);
    $statsStmt->execute();
    $stats = $statsStmt->get_result()->fetch_assoc();

    $profile['stats'] = [
        'portfolio_count' => (int)($stats['portfolio_count'] ?? 0),
        'total_views' => (int)($stats['total_views'] ?? 0),
        'total_likes' => (int)($stats['total_likes'] ?? 0)
    ];

    // 處理頭像路徑
    if (empty($profile['avatar_url'])) {
        // 使用姓名生成頭像（DiceBear API）
        $name = $profile['display_name'] ?: ($profile['first_name'] . $profile['last_name']) ?: '學生';
        $initial = mb_substr($name, 0, 1, 'UTF-8');
        $profile['avatar_url'] = 'https://api.dicebear.com/7.x/initials/svg?seed=' . urlencode($initial);
    } elseif (strpos($profile['avatar_url'], 'http') !== 0) {
        // 確保路徑以 / 開頭（適用於本地和 Railway）
        $profile['avatar_url'] = '/' . ltrim($profile['avatar_url'], '/');
    }

    // 公開社群
    $sm = $GLOBALS['conn']->prepare("SELECT platform, url FROM user_social_media WHERE user_id = ? AND is_public = 1 ORDER BY platform");
    $sm->bind_param("i", $studentId);
    $sm->execute();
    $smRes = $sm->get_result();
    $social = [];
    while ($row = $smRes->fetch_assoc()) { $social[$row['platform']] = $row['url']; }
    $profile['social_media'] = $social;

    sendResponse($profile, 200, '取得學生公開資料成功');
}

// 企業端：取得學生公開作品（已發布）
function getStudentPublicPortfolios() {
    $enterpriseId = checkPermission('enterprise');
    if (!$enterpriseId) { sendError('無權限', 403); }

    $studentId = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
    if (!$studentId) { sendError('缺少 student_id', 400); }

    $stmt = $GLOBALS['conn']->prepare(
        "SELECT id, title, description, cover_image, view_count, like_count, comment_count, published_at
         FROM portfolios
         WHERE user_id = ? AND status = 'published'
         ORDER BY published_at DESC, id DESC"
    );
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $res = $stmt->get_result();
    $list = [];
    while ($row = $res->fetch_assoc()) {
        // 處理封面圖片路徑
        $coverImage = $row['cover_image'];
        if (!empty($coverImage) && strpos($coverImage, 'http') !== 0) {
            // 確保路徑以 / 開頭（適用於本地和 Railway）
            $coverImage = '/' . ltrim($coverImage, '/');
        }
        
        $list[] = [
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'cover_image' => $coverImage,
            'views' => (int)$row['view_count'],
            'likes' => (int)$row['like_count'],
            'comment_count' => (int)$row['comment_count'],
            'published_at' => $row['published_at']
        ];
    }
    sendResponse($list, 200, '取得學生公開作品成功');
}

// 更新企業資料
function updateEnterpriseProfile($data) {
    $userId = checkPermission('enterprise');
    
    // 基本驗證
    if (isset($data['company_name']) && empty(trim($data['company_name']))) {
        sendError('公司名稱不能為空', 400);
    }
    
    if (isset($data['contact_email']) && !filter_var($data['contact_email'], FILTER_VALIDATE_EMAIL)) {
        sendError('聯絡信箱格式不正確', 400);
    }
    
    // 準備更新資料
    $updateFields = [];
    $params = [];
    $types = '';
    
    $fields = [
        'company_name', 'company_type', 'industry', 'company_size',
        'founded_year', 'employee_count', 'revenue_range', 'description',
        'website', 'address', 'phone', 'contact_person', 'contact_email',
        'company_culture', 'benefits_description'
    ];
    
    foreach ($fields as $field) {
        if (isset($data[$field])) {
            $updateFields[] = "$field = ?";
            $params[] = sanitizeInput($data[$field]);
            $types .= 's';
        }
    }
    
    // 處理社交媒體資料
    if (isset($data['social_media']) && is_array($data['social_media'])) {
        $updateFields[] = "social_media = ?";
        $params[] = json_encode($data['social_media']);
        $types .= 's';
    }
    
    if (empty($updateFields)) {
        sendError('沒有要更新的資料', 400);
    }
    
    // 檢查企業資料是否存在
    $checkStmt = $GLOBALS['conn']->prepare("SELECT id FROM enterprise_profiles WHERE user_id = ?");
    $checkStmt->bind_param("i", $userId);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows > 0) {
        // 更新現有資料
        $updateFields[] = "updated_at = NOW()";
        $sql = "UPDATE enterprise_profiles SET " . implode(', ', $updateFields) . " WHERE user_id = ?";
        $params[] = $userId;
        $types .= 'i';
    } else {
        // 建立新資料
        $sql = "INSERT INTO enterprise_profiles (user_id, " . implode(', ', array_map(function($field) {
            return str_replace(' = ?', '', $field);
        }, $updateFields)) . ", created_at, updated_at) VALUES (?, " . str_repeat('?, ', count($updateFields) - 1) . "?, NOW(), NOW())";
        $params = array_merge([$userId], $params);
        $types = 'i' . $types;
    }
    
    $stmt = $GLOBALS['conn']->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '企業資料更新成功');
    } else {
        sendError('更新企業資料失敗', 500);
    }
}

// 上傳企業標誌
function uploadLogo() {
    $userId = checkPermission('enterprise');
    
    if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
        sendError('檔案上傳失敗', 400);
    }
    
    $file = $_FILES['logo'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    
    // 驗證檔案類型
    if (!in_array($file['type'], $allowedTypes)) {
        sendError('只允許上傳 JPG、PNG 或 GIF 格式的圖片', 400);
    }
    
    // 驗證檔案大小
    if ($file['size'] > $maxSize) {
        sendError('檔案大小不能超過 5MB', 400);
    }
    
    // 建立上傳目錄
    $uploadDir = '../uploads/enterprise/logos/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // 產生檔案名稱
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'logo_' . $userId . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // 移動上傳的檔案
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        sendError('檔案儲存失敗', 500);
    }
    
    // 更新資料庫
    $logoUrl = '/uploads/enterprise/logos/' . $filename;
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE enterprise_profiles 
        SET logo_url = ?, updated_at = NOW() 
        WHERE user_id = ?
    ");
    $stmt->bind_param("si", $logoUrl, $userId);
    
    if ($stmt->execute()) {
        sendResponse(['logo_url' => $logoUrl], 200, '標誌上傳成功');
    } else {
        sendError('更新標誌失敗', 500);
    }
}

// 取得企業統計資料
function getEnterpriseStats($userId) {
    // 職缺統計
    $jobStmt = $GLOBALS['conn']->prepare("
        SELECT 
            COUNT(*) as total_jobs,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs,
            SUM(view_count) as total_job_views,
            SUM(application_count) as total_applications
        FROM jobs 
        WHERE enterprise_id = ?
    ");
    $jobStmt->bind_param("i", $userId);
    $jobStmt->execute();
    $jobStats = $jobStmt->get_result()->fetch_assoc();
    
    // 作品瀏覽統計
    $viewStmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as total_portfolio_views
        FROM enterprise_views 
        WHERE enterprise_id = ?
    ");
    $viewStmt->bind_param("i", $userId);
    $viewStmt->execute();
    $viewStats = $viewStmt->get_result()->fetch_assoc();
    
    // 收藏統計
    $bookmarkStmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as total_bookmarks
        FROM enterprise_bookmarks 
        WHERE enterprise_id = ?
    ");
    $bookmarkStmt->bind_param("i", $userId);
    $bookmarkStmt->execute();
    $bookmarkStats = $bookmarkStmt->get_result()->fetch_assoc();
    
    // 聯絡統計
    $contactStmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as total_contacts
        FROM enterprise_contacts 
        WHERE enterprise_id = ?
    ");
    $contactStmt->bind_param("i", $userId);
    $contactStmt->execute();
    $contactStats = $contactStmt->get_result()->fetch_assoc();
    
    return [
        'total_jobs' => (int)$jobStats['total_jobs'],
        'active_jobs' => (int)$jobStats['active_jobs'],
        'total_job_views' => (int)$jobStats['total_job_views'],
        'total_applications' => (int)$jobStats['total_applications'],
        'total_portfolio_views' => (int)$viewStats['total_portfolio_views'],
        'total_bookmarks' => (int)$bookmarkStats['total_bookmarks'],
        'total_contacts' => (int)$contactStats['total_contacts']
    ];
}
