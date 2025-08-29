<?php
require_once '../config.php';

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
    $userId = checkPermission('student');
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            u.id, u.username, u.email, u.created_at,
            sp.first_name, sp.last_name, sp.display_name, sp.gender, 
            sp.birth_date, sp.phone, sp.address, sp.bio, sp.avatar_url,
            sp.student_id, sp.major, sp.school, sp.grade, 
            sp.graduation_year, sp.skills, sp.interests,
            sp.github, sp.linkedin, sp.instagram, sp.facebook,
            sp.languages, sp.portfolio_count, sp.view_count, sp.like_count, sp.badge_count,
            sp.website, sp.resume_url, sp.is_public, sp.last_login
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.id = ?
    ");
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
        $profile['github'] = '';
        $profile['linkedin'] = '';
        $profile['instagram'] = '';
        $profile['facebook'] = '';
        $profile['languages'] = '';
        $profile['portfolio_count'] = 0;
        $profile['view_count'] = 0;
        $profile['like_count'] = 0;
        $profile['badge_count'] = 0;
        $profile['website'] = '';
        $profile['resume_url'] = '';
        $profile['is_public'] = true;
        $profile['last_login'] = date('Y-m-d H:i:s');
    } else {
        $profile['is_first_login'] = false;
        
        // 處理技能和興趣（從文字轉為陣列）
        $profile['skills'] = $profile['skills'] ? explode(',', $profile['skills']) : [];
        $profile['interests'] = $profile['interests'] ? explode(',', $profile['interests']) : [];
        
        // 計算統計資料
        $stats = getStudentStats($userId);
        $profile['stats'] = $stats;
    }
    
    sendResponse($profile, 200);
}

// 更新學生個人資料
function updateStudentProfile($data) {
    $userId = checkPermission('student');
    
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
    
    // 檢查是否已有個人資料
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM student_profiles WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $exists = $stmt->get_result()->num_rows > 0;
    
    if ($exists) {
        // 更新現有資料
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE student_profiles SET 
                first_name = ?, last_name = ?, display_name = ?, gender = ?,
                birth_date = ?, phone = ?, address = ?, bio = ?, student_id = ?,
                major = ?, school = ?, grade = ?, graduation_year = ?, 
                skills = ?, interests = ?, 
                github = ?, linkedin = ?, instagram = ?, facebook = ?,
                languages = ?, portfolio_count = ?, view_count = ?, like_count = ?, badge_count = ?,
                website = ?, resume_url = ?, is_public = ?, last_login = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        ");
        
        // 設定新欄位的預設值
        $github = $data['github'] ?? '';
        $linkedin = $data['linkedin'] ?? '';
        $instagram = $data['instagram'] ?? '';
        $facebook = $data['facebook'] ?? '';
        $languages = $data['languages'] ?? '';
        $portfolioCount = (int)($data['portfolio_count'] ?? 0);
        $viewCount = (int)($data['view_count'] ?? 0);
        $likeCount = (int)($data['like_count'] ?? 0);
        $badgeCount = (int)($data['badge_count'] ?? 0);
        $website = $data['website'] ?? '';
        $resumeUrl = $data['resume_url'] ?? '';
        $isPublic = (bool)($data['is_public'] ?? true);
        $lastLogin = date('Y-m-d H:i:s');
        
        $stmt->bind_param("sssssssssssssssssssiiissis", 
            $firstName, $lastName, $displayName, $gender, $birthDate, 
            $phone, $address, $bio, $studentId, $major, $school, 
            $grade, $graduationYear, $skills, $interests, 
            $github, $linkedin, $instagram, $facebook,
            $languages, $portfolioCount, $viewCount, $likeCount, $badgeCount,
            $website, $resumeUrl, $isPublic, $lastLogin, $userId
        );
    } else {
        // 建立新資料
        $stmt = $GLOBALS['conn']->prepare("
            INSERT INTO student_profiles (
                user_id, first_name, last_name, display_name, gender,
                birth_date, phone, address, bio, student_id,
                major, school, grade, graduation_year, skills, interests,
                github, linkedin, instagram, facebook, languages,
                portfolio_count, view_count, like_count, badge_count,
                website, resume_url, is_public, last_login
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        // 設定新欄位的預設值
        $github = $data['github'] ?? '';
        $linkedin = $data['linkedin'] ?? '';
        $instagram = $data['instagram'] ?? '';
        $facebook = $data['facebook'] ?? '';
        $languages = $data['languages'] ?? '';
        $portfolioCount = (int)($data['portfolio_count'] ?? 0);
        $viewCount = (int)($data['view_count'] ?? 0);
        $likeCount = (int)($data['like_count'] ?? 0);
        $badgeCount = (int)($data['badge_count'] ?? 0);
        $website = $data['website'] ?? '';
        $resumeUrl = $data['resume_url'] ?? '';
        $isPublic = (bool)($data['is_public'] ?? true);
        $lastLogin = date('Y-m-d H:i:s');
        
        $stmt->bind_param("issssssssssssssssssssiiissis", 
            $userId, $firstName, $lastName, $displayName, $gender, $birthDate, 
            $phone, $address, $bio, $studentId, $major, $school, 
            $grade, $graduationYear, $skills, $interests,
            $github, $linkedin, $instagram, $facebook, $languages,
            $portfolioCount, $viewCount, $likeCount, $badgeCount,
            $website, $resumeUrl, $isPublic, $lastLogin
        );
    }
    
    if ($stmt->execute()) {
        sendResponse(['message' => '個人資料更新成功'], 200, '更新成功');
    } else {
        sendError('更新失敗: ' . $stmt->error, 500);
    }
}

// 上傳頭像
function uploadAvatar() {
    $userId = checkPermission('student');
    
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
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE student_profiles SET avatar_url = ? WHERE user_id = ?
    ");
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
    $stmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as count FROM portfolios WHERE user_id = ? AND status = 'published'
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $portfolioCount = $stmt->get_result()->fetch_assoc()['count'];
    
    // 總瀏覽次數
    $stmt = $GLOBALS['conn']->prepare("
        SELECT SUM(view_count) as total FROM portfolios WHERE user_id = ?
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $totalViews = $stmt->get_result()->fetch_assoc()['total'] ?: 0;
    
    // 總讚數
    $stmt = $GLOBALS['conn']->prepare("
        SELECT SUM(like_count) as total FROM portfolios WHERE user_id = ?
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $totalLikes = $stmt->get_result()->fetch_assoc()['total'] ?: 0;
    
    // 評論數量
    $stmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as count FROM comments c
        JOIN portfolios p ON c.portfolio_id = p.id
        WHERE p.user_id = ? AND c.is_approved = 1
    ");
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
?>
