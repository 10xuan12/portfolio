<?php
require_once '../config.php';

// 學生端職缺瀏覽 API
// 允許學生查看所有公開的職缺（status = 'active'）

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'list':
                    getPublicJobList();
                    break;
                case 'detail':
                    getPublicJobDetail();
                    break;
                default:
                    sendError('無效的操作', 400);
            }
        } else {
            // 預設為列表
            getPublicJobList();
        }
        break;
        
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得公開職缺列表（學生端）
function getPublicJobList() {
    // 學生端不需要嚴格權限檢查，但可以選擇性檢查
    $userId = null;
    try {
        session_start();
        if (isset($_SESSION['user_id'])) {
            $userId = $_SESSION['user_id'];
        } else {
            $headers = getallheaders();
            if (isset($headers['X-User-ID'])) {
                $userId = (int)$headers['X-User-ID'];
            }
        }
    } catch (Exception $e) {
        // 忽略權限檢查錯誤，允許匿名瀏覽
    }
    
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $jobType = isset($_GET['job_type']) ? $_GET['job_type'] : '';
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $department = isset($_GET['department']) ? $_GET['department'] : '';
    
    $offset = ($page - 1) * $limit;
    
    // 建立查詢條件 - 只顯示已發布的職缺
    $where = "WHERE j.status = 'active'";
    $params = [];
    $types = "";
    
    if ($jobType) {
        $where .= " AND j.job_type = ?";
        $params[] = $jobType;
        $types .= "s";
    }
    
    if ($department) {
        $where .= " AND j.department = ?";
        $params[] = $department;
        $types .= "s";
    }
    
    if ($search) {
        $where .= " AND (j.title LIKE ? OR j.description LIKE ? OR j.skills_required LIKE ? OR ep.company_name LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "ssss";
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
        ORDER BY j.is_featured DESC, j.published_at DESC, j.created_at DESC
        LIMIT ? OFFSET ?
    ");
    
    $params[] = $limit;
    $params[] = $offset;
    $types .= "ii";
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $jobs = $result->fetch_all(MYSQLI_ASSOC);
    
    // 查詢總數
    $countStmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as total
        FROM jobs j
        LEFT JOIN enterprise_profiles ep ON j.enterprise_id = ep.user_id
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
        
        // 增加瀏覽次數（如果用戶已登入）
        if ($userId) {
            // 這裡可以實現瀏覽記錄，暫時先不實現
        }
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

// 取得職缺詳細資料（公開）
function getPublicJobDetail() {
    $jobId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if (!$jobId) {
        sendError('缺少職缺ID', 400);
    }
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            j.*, ep.company_name, ep.logo_url, ep.contact_person, ep.contact_email,
            ep.description as company_description, ep.website, ep.address
        FROM jobs j
        LEFT JOIN enterprise_profiles ep ON j.enterprise_id = ep.user_id
        WHERE j.id = ? AND j.status = 'active'
    ");
    $stmt->bind_param("i", $jobId);
    $stmt->execute();
    $result = $stmt->get_result();
    $job = $result->fetch_assoc();
    
    if (!$job) {
        sendError('職缺不存在或已下架', 404);
    }
    
    // 處理技能要求
    $job['skills_required'] = $job['skills_required'] ? explode(',', $job['skills_required']) : [];
    $job['salary_range'] = formatSalaryRange($job['salary_min'], $job['salary_max'], $job['salary_type']);
    
    // 增加瀏覽次數
    $updateStmt = $GLOBALS['conn']->prepare("UPDATE jobs SET view_count = view_count + 1 WHERE id = ?");
    $updateStmt->bind_param("i", $jobId);
    $updateStmt->execute();
    
    sendResponse($job, 200, '取得職缺詳細資料成功');
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

