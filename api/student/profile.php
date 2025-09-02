<?php
require_once '../config.php';

// 設定 CORS 與回應格式
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');
header('Content-Type: application/json; charset=utf-8');

// 預檢請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 學生個人資料 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'get') {
            getStudentProfile();
        } else {
            sendError('無效的請求', 400);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'update':
                    updateStudentProfile($input);
                    break;
                case 'upload_avatar':
                    uploadAvatar();
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

// 取得學生個人資料
function getStudentProfile() {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    $stmt = $GLOBALS['conn']->prepare(
        "SELECT 
            u.id, u.username, u.email, u.created_at,
            sp.first_name, sp.last_name, sp.display_name, sp.gender, 
            sp.birth_date, sp.phone, sp.address, sp.bio, sp.avatar_url,
            sp.student_id, sp.major, sp.school, sp.grade, 
            sp.graduation_year, sp.skills, sp.interests
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $profile = $result->fetch_assoc();
    
    // 檢查是否為首次登入（沒有個人資料）
    if (!$profile['first_name'] && !$profile['last_name']) {
        // 首次登入，返回基本使用者資訊
        $profile['is_first_login'] = true;
        $profile['first_name'] = '';
        $profile['last_name'] = '';
        $profile['display_name'] = '';
        $profile['gender'] = '';
        $profile['birth_date'] = '';
        $profile['phone'] = '';
        $profile['address'] = '';
        $profile['bio'] = '';
        $profile['student_id'] = '';
        $profile['major'] = '';
        $profile['school'] = '';
        $profile['grade'] = '';
        $profile['graduation_year'] = '';
        $profile['skills'] = '';
        $profile['interests'] = '';
        $profile['portfolio_count'] = 0;
        $profile['view_count'] = 0;
        $profile['like_count'] = 0;
        $profile['badge_count'] = 0;
    } else {
        $profile['is_first_login'] = false;
        
        // 處理技能和興趣（從文字轉為陣列）
        $profile['skills'] = $profile['skills'] ? explode(',', $profile['skills']) : [];
        $profile['interests'] = $profile['interests'] ? explode(',', $profile['interests']) : [];
        
        // 計算統計資料
        $stats = getStudentStats($userId);
        $profile['stats'] = $stats;
    }
    
    // 取得社群媒體連結
    $socialMedia = getSocialMedia($userId);
    $profile['social_media'] = $socialMedia;
    
    sendResponse($profile, 200);
}

// 取得社群媒體連結
function getSocialMedia($userId) {
    $stmt = $GLOBALS['conn']->prepare(
        "SELECT platform, url, is_public 
         FROM user_social_media 
         WHERE user_id = ? 
         ORDER BY platform"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $socialMedia = [];
    while ($row = $result->fetch_assoc()) {
        $socialMedia[$row['platform']] = [
            'url' => $row['url'],
            'is_public' => (bool)$row['is_public']
        ];
    }
    
    return $socialMedia;
}

// 更新學生個人資料
function updateStudentProfile($data) {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    // 驗證必填欄位
    validateRequired($data, ['first_name', 'last_name']);
    
    $firstName = sanitizeInput($data['first_name']);
    $lastName = sanitizeInput($data['last_name']);
    $displayName = sanitizeInput($data['display_name'] ?? '');
    $gender = sanitizeInput($data['gender'] ?? '');
    $birthDate = sanitizeInput($data['birth_date'] ?? '');
    $phone = sanitizeInput($data['phone'] ?? '');
    $address = sanitizeInput($data['address'] ?? '');
    $bio = sanitizeInput($data['bio'] ?? '');
    $studentId = sanitizeInput($data['student_id'] ?? '');
    $major = sanitizeInput($data['major'] ?? '');
    $school = sanitizeInput($data['school'] ?? '');
    $grade = sanitizeInput($data['grade'] ?? '');
    $graduationYear = sanitizeInput($data['graduation_year'] ?? '');
    $skills = sanitizeInput($data['skills'] ?? '');
    $interests = sanitizeInput($data['interests'] ?? '');
    
    // 處理技能和興趣（從陣列轉為文字）
    if (is_array($skills)) {
        $skills = implode(',', $skills);
    }
    if (is_array($interests)) {
        $interests = implode(',', $interests);
    }
    
    // 驗證日期格式
    if ($birthDate && !strtotime($birthDate)) {
        sendError('無效的出生日期格式', 400);
    }
    
    // 驗證畢業年份
    if ($graduationYear && (!is_numeric($graduationYear) || $graduationYear < 1900 || $graduationYear > 2100)) {
        sendError('無效的畢業年份', 400);
    }
    
    // 開始交易
    $GLOBALS['conn']->begin_transaction();
    
    try {
        // 檢查是否已有個人資料
        $stmt = $GLOBALS['conn']->prepare("SELECT id FROM student_profiles WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $exists = $stmt->get_result()->num_rows > 0;
        
        if ($exists) {
            // 更新現有資料
            $stmt = $GLOBALS['conn']->prepare(
                "UPDATE student_profiles SET 
                    first_name = ?, last_name = ?, display_name = ?, gender = ?,
                    birth_date = ?, phone = ?, address = ?, bio = ?, student_id = ?,
                    major = ?, school = ?, grade = ?, graduation_year = ?, 
                    skills = ?, interests = ?, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?"
            );
            $stmt->bind_param("ssssssssssssssi", 
                $firstName, $lastName, $displayName, $gender, $birthDate, 
                $phone, $address, $bio, $studentId, $major, $school, 
                $grade, $graduationYear, $skills, $interests, $userId
            );
        } else {
            // 建立新資料
            $stmt = $GLOBALS['conn']->prepare(
                "INSERT INTO student_profiles (
                    user_id, first_name, last_name, display_name, gender,
                    birth_date, phone, address, bio, student_id,
                    major, school, grade, graduation_year, skills, interests
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->bind_param("isssssssssssssss", 
                $userId, $firstName, $lastName, $displayName, $gender, $birthDate, 
                $phone, $address, $bio, $studentId, $major, $school, 
                $grade, $graduationYear, $skills, $interests
            );
        }
        
        if (!$stmt->execute()) {
            throw new Exception('更新個人資料失敗: ' . $stmt->error);
        }
        
        // 更新社群媒體連結
        if (isset($data['social_media']) && is_array($data['social_media'])) {
            updateSocialMedia($userId, $data['social_media']);
        }
        
        $GLOBALS['conn']->commit();
        sendResponse(['message' => '個人資料更新成功'], 200, '更新成功');
        
    } catch (Exception $e) {
        $GLOBALS['conn']->rollback();
        sendError('更新失敗: ' . $e->getMessage(), 500);
    }
}

// 更新社群媒體連結
function updateSocialMedia($userId, $socialMedia) {
    // 先刪除現有的社群媒體連結
    $stmt = $GLOBALS['conn']->prepare("DELETE FROM user_social_media WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    
    // 插入新的社群媒體連結
    $allowedPlatforms = ['github', 'linkedin', 'instagram', 'facebook', 'twitter', 'youtube', 'blog'];
    
    foreach ($socialMedia as $platform => $data) {
        if (!in_array($platform, $allowedPlatforms)) {
            continue;
        }
        
        $url = sanitizeInput($data['url'] ?? '');
        $isPublic = isset($data['is_public']) ? (int)$data['is_public'] : 1;
        
        if (!empty($url)) {
            $stmt = $GLOBALS['conn']->prepare(
                "INSERT INTO user_social_media (user_id, platform, url, is_public) 
                 VALUES (?, ?, ?, ?)"
            );
            $stmt->bind_param("issi", $userId, $platform, $url, $isPublic);
            $stmt->execute();
        }
    }
}

// 上傳頭像
function uploadAvatar() {
    $userId = getUserId();
    if (!$userId) {
        sendError('無法獲取使用者資訊', 401);
        return;
    }
    
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
        sendError('檔案上傳失敗', 400);
    }
    
    $file = $_FILES['avatar'];
    
    // 驗證檔案類型
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowedTypes)) {
        sendError('只允許上傳 JPG、PNG 或 GIF 格式的圖片', 400);
    }
    
    // 驗證檔案大小
    if ($file['size'] > UPLOAD_MAX_SIZE) {
        sendError('檔案大小不能超過 10MB', 400);
    }
    
    // 生成唯一檔名
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'avatar_' . $userId . '_' . time() . '.' . $extension;
    $filepath = UPLOAD_PATH . 'avatars/' . $filename;
    
    // 移動上傳的檔案
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        sendError('檔案儲存失敗', 500);
    }
    
    // 更新資料庫中的頭像路徑
    $avatarUrl = 'uploads/avatars/' . $filename;
    
    $stmt = $GLOBALS['conn']->prepare(
        "UPDATE student_profiles SET avatar_url = ? WHERE user_id = ?"
    );
    $stmt->bind_param("si", $avatarUrl, $userId);
    
    if ($stmt->execute()) {
        sendResponse([
            'avatar_url' => $avatarUrl,
            'message' => '頭像上傳成功'
        ], 200, '上傳成功');
    } else {
        // 如果資料庫更新失敗，刪除已上傳的檔案
        unlink($filepath);
        sendError('頭像更新失敗', 500);
    }
}

// 取得學生統計資料
function getStudentStats($userId) {
    // 作品數量
    $stmt = $GLOBALS['conn']->prepare(
        "SELECT COUNT(*) as count FROM portfolios WHERE user_id = ? AND status = 'published'"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $portfolioCount = $stmt->get_result()->fetch_assoc()['count'];
    
    // 總瀏覽次數
    $stmt = $GLOBALS['conn']->prepare(
        "SELECT SUM(view_count) as total FROM portfolios WHERE user_id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $totalViews = $stmt->get_result()->fetch_assoc()['total'] ?: 0;
    
    // 總讚數
    $stmt = $GLOBALS['conn']->prepare(
        "SELECT SUM(like_count) as total FROM portfolios WHERE user_id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $totalLikes = $stmt->get_result()->fetch_assoc()['total'] ?: 0;
    
    // 評論數量
    $stmt = $GLOBALS['conn']->prepare(
        "SELECT COUNT(*) as count FROM comments c
        JOIN portfolios p ON c.portfolio_id = p.id
        WHERE p.user_id = ? AND c.is_approved = 1"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $commentCount = $stmt->get_result()->fetch_assoc()['count'];
    
    return [
        'portfolio_count' => (int)$portfolioCount,
        'total_views' => (int)$totalViews,
        'total_likes' => (int)$totalLikes,
        'comment_count' => (int)$commentCount
    ];
}

// 取得使用者 ID（統一邏輯）
function getUserId() {
    if (isset($_SESSION['user_id'])) {
        return (int)$_SESSION['user_id'];
    }
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (isset($headers['X-User-ID'])) {
        return (int)$headers['X-User-ID'];
    }
    if (isset($_GET['user_id'])) {
        return (int)$_GET['user_id'];
    }
    if (isset($_POST['user_id'])) {
        return (int)$_POST['user_id'];
    }
    return null;
}
?>
