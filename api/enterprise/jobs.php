<?php
require_once '../config.php';

// 企業職缺管理 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'list':
                    getJobList();
                    break;
                case 'detail':
                    getJobDetail();
                    break;
                case 'applications':
                    getJobApplications();
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
                    createJob($input);
                    break;
                case 'update':
                    updateJob($input);
                    break;
                case 'delete':
                    deleteJob($input);
                    break;
                case 'toggle_status':
                    toggleJobStatus($input);
                    break;
                case 'update_application':
                    updateApplicationStatus($input);
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

// 取得職缺列表
function getJobList() {
    $userId = checkPermission('enterprise');
    
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    $jobType = isset($_GET['job_type']) ? $_GET['job_type'] : '';
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    
    $offset = ($page - 1) * $limit;
    
    // 建立查詢條件
    $where = "WHERE j.enterprise_id = ?";
    $params = [$userId];
    $types = "i";
    
    if ($status) {
        $where .= " AND j.status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    if ($jobType) {
        $where .= " AND j.job_type = ?";
        $params[] = $jobType;
        $types .= "s";
    }
    
    if ($search) {
        $where .= " AND (j.title LIKE ? OR j.description LIKE ? OR j.requirements LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sss";
    }
    
    // 查詢職缺列表
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            j.id, j.title, j.description, j.status, j.job_type, j.location,
            j.department, j.salary_min, j.salary_max, j.salary_type,
            j.experience_level, j.education_level, j.skills_required,
            j.view_count, j.application_count, j.bookmark_count,
            j.is_featured, j.published_at, j.deadline, j.created_at,
            ep.company_name, ep.logo_url
        FROM jobs j
        LEFT JOIN enterprise_profiles ep ON j.enterprise_id = ep.user_id
        $where
        ORDER BY j.created_at DESC
        LIMIT ? OFFSET ?
    ");
    
    $params[] = $limit;
    $params[] = $offset;
    $types .= "ii";
    
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    $jobs = $result->fetch_all(MYSQLI_ASSOC);
    
    // 查詢總數
    $countStmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as total
        FROM jobs j
        $where
    ");
    
    $countParams = array_slice($params, 0, -2);
    $countTypes = substr($types, 0, -2);
    
    if (!empty($countParams)) {
        $countStmt->bind_param($countTypes, ...$countParams);
    }
    $countStmt->execute();
    $total = $countStmt->get_result()->fetch_assoc()['total'];
    
    // 處理技能要求（從文字轉為陣列）
    foreach ($jobs as &$job) {
        $job['skills_required'] = $job['skills_required'] ? explode(',', $job['skills_required']) : [];
        $job['salary_range'] = formatSalaryRange($job['salary_min'], $job['salary_max'], $job['salary_type']);
    }
    
    $response = [
        'jobs' => $jobs,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ];
    
    sendResponse($response, 200, '取得職缺列表成功');
}

// 取得職缺詳細資料
function getJobDetail() {
    $userId = checkPermission('enterprise');
    $jobId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if (!$jobId) {
        sendError('缺少職缺ID', 400);
    }
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            j.*, ep.company_name, ep.logo_url, ep.contact_person, ep.contact_email
        FROM jobs j
        LEFT JOIN enterprise_profiles ep ON j.enterprise_id = ep.user_id
        WHERE j.id = ? AND j.enterprise_id = ?
    ");
    $stmt->bind_param("ii", $jobId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $job = $result->fetch_assoc();
    
    if (!$job) {
        sendError('職缺不存在或無權限存取', 404);
    }
    
    // 處理技能要求
    $job['skills_required'] = $job['skills_required'] ? explode(',', $job['skills_required']) : [];
    $job['salary_range'] = formatSalaryRange($job['salary_min'], $job['salary_max'], $job['salary_type']);
    
    sendResponse($job, 200, '取得職缺詳細資料成功');
}

// 建立新職缺
function createJob($data) {
    $userId = checkPermission('enterprise');
    
    validateRequired($data, ['title', 'description', 'job_type']);
    
    $title = sanitizeInput($data['title']);
    $description = sanitizeInput($data['description']);
    $requirements = isset($data['requirements']) ? sanitizeInput($data['requirements']) : '';
    $responsibilities = isset($data['responsibilities']) ? sanitizeInput($data['responsibilities']) : '';
    $jobType = sanitizeInput($data['job_type']);
    $location = isset($data['location']) ? sanitizeInput($data['location']) : '';
    $department = isset($data['department']) ? sanitizeInput($data['department']) : '';
    $experienceLevel = isset($data['experience_level']) ? sanitizeInput($data['experience_level']) : '無經驗';
    $educationLevel = isset($data['education_level']) ? sanitizeInput($data['education_level']) : '不拘';
    $skillsRequired = isset($data['skills_required']) ? sanitizeInput($data['skills_required']) : '';
    $benefits = isset($data['benefits']) ? sanitizeInput($data['benefits']) : '';
    $salaryMin = isset($data['salary_min']) ? (float)$data['salary_min'] : null;
    $salaryMax = isset($data['salary_max']) ? (float)$data['salary_max'] : null;
    $salaryType = isset($data['salary_type']) ? sanitizeInput($data['salary_type']) : '面議';
    $deadline = isset($data['deadline']) ? sanitizeInput($data['deadline']) : null;
    $status = isset($data['status']) ? sanitizeInput($data['status']) : 'draft';
    
    $stmt = $GLOBALS['conn']->prepare("
        INSERT INTO jobs (
            enterprise_id, title, description, requirements, responsibilities,
            salary_min, salary_max, salary_type, job_type, location, department,
            experience_level, education_level, skills_required, benefits,
            status, deadline, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $publishedAt = $status === 'active' ? date('Y-m-d H:i:s') : null;
    
    $stmt->bind_param("issssddsssssssssss", 
        $userId, $title, $description, $requirements, $responsibilities,
        $salaryMin, $salaryMax, $salaryType, $jobType, $location, $department,
        $experienceLevel, $educationLevel, $skillsRequired, $benefits,
        $status, $deadline, $publishedAt
    );
    
    if ($stmt->execute()) {
        $jobId = $GLOBALS['conn']->insert_id;
        sendResponse(['job_id' => $jobId], 201, '職缺建立成功');
    } else {
        sendError('建立職缺失敗', 500);
    }
}

// 更新職缺
function updateJob($data) {
    $userId = checkPermission('enterprise');
    
    if (!isset($data['id'])) {
        sendError('缺少職缺ID', 400);
    }
    
    $jobId = (int)$data['id'];
    
    // 檢查職缺是否屬於該企業
    $checkStmt = $GLOBALS['conn']->prepare("SELECT id FROM jobs WHERE id = ? AND enterprise_id = ?");
    $checkStmt->bind_param("ii", $jobId, $userId);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows === 0) {
        sendError('職缺不存在或無權限修改', 404);
    }
    
    // 準備更新資料
    $updateFields = [];
    $params = [];
    $types = '';
    
    $fields = [
        'title', 'description', 'requirements', 'responsibilities',
        'salary_min', 'salary_max', 'salary_type', 'job_type', 'location',
        'department', 'experience_level', 'education_level', 'skills_required',
        'benefits', 'deadline'
    ];
    
    foreach ($fields as $field) {
        if (isset($data[$field])) {
            $updateFields[] = "$field = ?";
            $params[] = sanitizeInput($data[$field]);
            $types .= 's';
        }
    }
    
    // 處理狀態變更
    if (isset($data['status'])) {
        $updateFields[] = "status = ?";
        $params[] = sanitizeInput($data['status']);
        $types .= 's';
        
        // 如果狀態變為 active，設定發布時間
        if ($data['status'] === 'active') {
            $updateFields[] = "published_at = NOW()";
        }
    }
    
    if (empty($updateFields)) {
        sendError('沒有要更新的資料', 400);
    }
    
    $updateFields[] = "updated_at = NOW()";
    $params[] = $jobId;
    $types .= 'i';
    
    $sql = "UPDATE jobs SET " . implode(', ', $updateFields) . " WHERE id = ? AND enterprise_id = ?";
    $params[] = $userId;
    $types .= 'i';
    
    $stmt = $GLOBALS['conn']->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '職缺更新成功');
    } else {
        sendError('更新職缺失敗', 500);
    }
}

// 刪除職缺
function deleteJob($data) {
    $userId = checkPermission('enterprise');
    
    if (!isset($data['id'])) {
        sendError('缺少職缺ID', 400);
    }
    
    $jobId = (int)$data['id'];
    
    // 檢查職缺是否屬於該企業
    $checkStmt = $GLOBALS['conn']->prepare("SELECT id FROM jobs WHERE id = ? AND enterprise_id = ?");
    $checkStmt->bind_param("ii", $jobId, $userId);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows === 0) {
        sendError('職缺不存在或無權限刪除', 404);
    }
    
    $stmt = $GLOBALS['conn']->prepare("DELETE FROM jobs WHERE id = ? AND enterprise_id = ?");
    $stmt->bind_param("ii", $jobId, $userId);
    
    if ($stmt->execute()) {
        sendResponse([], 200, '職缺刪除成功');
    } else {
        sendError('刪除職缺失敗', 500);
    }
}

// 切換職缺狀態
function toggleJobStatus($data) {
    $userId = checkPermission('enterprise');
    
    if (!isset($data['id'])) {
        sendError('缺少職缺ID', 400);
    }
    
    $jobId = (int)$data['id'];
    $newStatus = isset($data['status']) ? sanitizeInput($data['status']) : '';
    
    if (!in_array($newStatus, ['active', 'paused', 'closed', 'draft'])) {
        sendError('無效的狀態', 400);
    }
    
    // 檢查職缺是否屬於該企業
    $checkStmt = $GLOBALS['conn']->prepare("SELECT id, status FROM jobs WHERE id = ? AND enterprise_id = ?");
    $checkStmt->bind_param("ii", $jobId, $userId);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $job = $result->fetch_assoc();
    
    if (!$job) {
        sendError('職缺不存在或無權限修改', 404);
    }
    
    $publishedAt = $newStatus === 'active' && $job['status'] !== 'active' ? 'NOW()' : 'published_at';
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE jobs 
        SET status = ?, published_at = $publishedAt, updated_at = NOW() 
        WHERE id = ? AND enterprise_id = ?
    ");
    $stmt->bind_param("sii", $newStatus, $jobId, $userId);
    
    if ($stmt->execute()) {
        sendResponse(['status' => $newStatus], 200, '職缺狀態更新成功');
    } else {
        sendError('更新職缺狀態失敗', 500);
    }
}

// 取得職缺申請列表
function getJobApplications() {
    try {
        $userId = checkPermission('enterprise');
        
        $jobId = isset($_GET['job_id']) ? (int)$_GET['job_id'] : 0;
        $status = isset($_GET['status']) ? $_GET['status'] : '';
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        
        $offset = ($page - 1) * $limit;
        
        debugLog("取得職缺申請列表 - jobId: $jobId, userId: $userId, page: $page, limit: $limit");
    
    // 建立查詢條件
    $where = "WHERE ja.job_id = ? AND j.enterprise_id = ?";
    $params = [$jobId, $userId];
    $types = "ii";
    
    if ($status) {
        $where .= " AND ja.status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    // 查詢申請列表
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            ja.id, ja.student_id, ja.status, ja.cover_letter, ja.resume_url, ja.portfolio_url,
            ja.expected_salary, ja.available_date, ja.interview_date,
            ja.interview_location, ja.interview_notes, ja.enterprise_notes,
            ja.created_at, ja.updated_at,
            sp.first_name, sp.last_name, sp.display_name, sp.avatar_url,
            sp.major, sp.school, sp.grade, sp.skills,
            u.username, u.email as student_email
        FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        JOIN users u ON ja.student_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        $where
        ORDER BY ja.created_at DESC
        LIMIT ? OFFSET ?
    ");
    
    $params[] = $limit;
    $params[] = $offset;
    $types .= "ii";
    
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    $applications = $result->fetch_all(MYSQLI_ASSOC);
    
        // 處理技能（從文字轉為陣列）和頭像路徑
        foreach ($applications as &$app) {
            $app['skills'] = $app['skills'] ? explode(',', $app['skills']) : [];
            $app['student_name'] = $app['display_name'] ?: ($app['first_name'] . ' ' . $app['last_name']);
            
            // 處理頭像路徑
            if (empty($app['avatar_url'])) {
                // 使用姓名生成頭像（DiceBear API）
                $name = $app['student_name'] ?: '學生';
                $initial = mb_substr($name, 0, 1, 'UTF-8');
                $app['avatar_url'] = 'https://api.dicebear.com/7.x/initials/svg?seed=' . urlencode($initial);
            } elseif (strpos($app['avatar_url'], 'http') !== 0) {
                // 確保路徑以 / 開頭（適用於本地和 Railway）
                $app['avatar_url'] = '/' . ltrim($app['avatar_url'], '/');
            }
        }
        
        debugLog("成功取得 " . count($applications) . " 筆申請資料");
        sendResponse($applications, 200, '取得申請列表成功');
        
    } catch (Exception $e) {
        debugLog("取得職缺申請列表錯誤: " . $e->getMessage());
        sendError('取得申請列表失敗: ' . $e->getMessage(), 500);
    }
}

// 更新申請狀態
function updateApplicationStatus($data) {
    $userId = checkPermission('enterprise');
    
    if (!isset($data['application_id']) || !isset($data['status'])) {
        sendError('缺少必要參數', 400);
    }
    
    $applicationId = (int)$data['application_id'];
    $status = sanitizeInput($data['status']);
    $notes = isset($data['notes']) ? sanitizeInput($data['notes']) : '';
    $interviewDate = isset($data['interview_date']) ? sanitizeInput($data['interview_date']) : null;
    $interviewLocation = isset($data['interview_location']) ? sanitizeInput($data['interview_location']) : null;
    
    if (!in_array($status, ['pending', 'reviewed', 'interviewed', 'accepted', 'rejected'])) {
        sendError('無效的狀態', 400);
    }
    
    // 檢查申請是否屬於該企業的職缺
    $checkStmt = $GLOBALS['conn']->prepare("
        SELECT ja.id FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = ? AND j.enterprise_id = ?
    ");
    $checkStmt->bind_param("ii", $applicationId, $userId);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows === 0) {
        sendError('申請不存在或無權限修改', 404);
    }
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE job_applications 
        SET status = ?, enterprise_notes = ?, interview_date = ?, interview_location = ?, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->bind_param("ssssi", $status, $notes, $interviewDate, $interviewLocation, $applicationId);
    
    if ($stmt->execute()) {
        sendResponse(['status' => $status], 200, '申請狀態更新成功');
    } else {
        sendError('更新申請狀態失敗', 500);
    }
}

// 格式化薪資範圍
function formatSalaryRange($min, $max, $type) {
    if (!$min && !$max) {
        return '面議';
    }
    
    if ($min && $max) {
        return number_format($min) . ' - ' . number_format($max) . ' ' . $type;
    } elseif ($min) {
        return number_format($min) . ' ' . $type . ' 以上';
    } else {
        return number_format($max) . ' ' . $type . ' 以下';
    }
}
