<?php
require_once '../config.php';

// 管理員內容審核 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getReviews();
        break;
        
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得審核項目
function getReviews() {
    checkPermission('admin');
    
    $status = isset($_GET['status']) ? $_GET['status'] : 'pending';
    $search = isset($_GET['q']) ? sanitizeInput($_GET['q']) : '';
    
    // 取得待審核作品
    $portfolios = [];
    $portfolioStmt = $GLOBALS['conn']->prepare("
        SELECT 
            p.id, p.title, p.description, p.category as type, p.status,
            p.created_at as submitted_at,
            u.username as author
        FROM portfolios p
        JOIN users u ON p.user_id = u.id
        WHERE p.status = ?
        ORDER BY p.created_at DESC
        LIMIT 10
    ");
    $portfolioStmt->bind_param("s", $status);
    $portfolioStmt->execute();
    $result = $portfolioStmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        // 取得技能標籤
        $tagsStmt = $GLOBALS['conn']->prepare("
            SELECT tag_name 
            FROM portfolio_tags 
            WHERE portfolio_id = ?
        ");
        $tagsStmt->bind_param("i", $row['id']);
        $tagsStmt->execute();
        $tagsResult = $tagsStmt->get_result();
        
        $skills = [];
        while ($tag = $tagsResult->fetch_assoc()) {
            $skills[] = $tag['tag_name'];
        }
        
        // 取得封面圖片
        $imageStmt = $GLOBALS['conn']->prepare("
            SELECT file_path 
            FROM portfolio_files 
            WHERE portfolio_id = ? AND file_type LIKE 'image/%'
            LIMIT 1
        ");
        $imageStmt->bind_param("i", $row['id']);
        $imageStmt->execute();
        $imageResult = $imageStmt->get_result();
        $imageRow = $imageResult->fetch_assoc();
        
        $row['skills'] = $skills;
        $row['image'] = $imageRow ? '../' . $imageRow['file_path'] : 'https://via.placeholder.com/400x200';
        
        $portfolios[] = $row;
    }
    
    // 取得待審核職缺
    $jobs = [];
    $jobStmt = $GLOBALS['conn']->prepare("
        SELECT 
            j.id, j.title, j.description, j.job_type as type, j.status,
            j.location, j.salary, j.created_at as submitted_at,
            ep.company_name as enterprise
        FROM jobs j
        JOIN users u ON j.enterprise_id = u.id
        LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
        WHERE j.status = ?
        ORDER BY j.created_at DESC
        LIMIT 10
    ");
    $jobStmt->bind_param("s", $status);
    $jobStmt->execute();
    $result = $jobStmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        // 取得技能要求
        $reqStmt = $GLOBALS['conn']->prepare("
            SELECT skill_name 
            FROM job_requirements 
            WHERE job_id = ?
        ");
        $reqStmt->bind_param("i", $row['id']);
        $reqStmt->execute();
        $reqResult = $reqStmt->get_result();
        
        $requirements = [];
        while ($req = $reqResult->fetch_assoc()) {
            $requirements[] = $req['skill_name'];
        }
        
        $row['requirements'] = $requirements;
        
        $jobs[] = $row;
    }
    
    // 取得待審核使用者
    $users = [];
    $userStmt = $GLOBALS['conn']->prepare("
        SELECT 
            u.id, u.username, u.email, u.role as type, u.status,
            u.created_at as submitted_at,
            ep.company_name as name, ep.company_type, ep.company_size, ep.website,
            ep.description
        FROM users u
        LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
        WHERE u.status = ? AND u.role = 'enterprise'
        ORDER BY u.created_at DESC
        LIMIT 10
    ");
    $userStmt->bind_param("s", $status);
    $userStmt->execute();
    $result = $userStmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    
    // 取得報告
    $reports = [];
    // TODO: 實作報告查詢，需要先建立 reports 表
    
    $response = [
        'portfolios' => $portfolios,
        'jobs' => $jobs,
        'users' => $users,
        'reports' => $reports
    ];
    
    sendResponse($response, 200, '取得審核項目成功');
}
?>

