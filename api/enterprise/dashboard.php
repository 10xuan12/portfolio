<?php
require_once '../config.php';

// 企業儀表板 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'stats':
                    getDashboardStats();
                    break;
                case 'recent_portfolios':
                    getRecentPortfolios();
                    break;
                case 'recommended_students':
                    getRecommendedStudents();
                    break;
                case 'recent_activities':
                    getRecentActivities();
                    break;
                case 'job_summary':
                    getJobSummary();
                    break;
                case 'analytics':
                    getAnalytics();
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

// 取得儀表板統計資料
function getDashboardStats() {
    $userId = checkPermission('enterprise');
    
    // 職缺統計
    $jobStmt = $GLOBALS['conn']->prepare("
        SELECT 
            COUNT(*) as total_jobs,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs,
            SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused_jobs,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_jobs,
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
    
    // 最近7天的統計
    $recentViewStmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as recent_views
        FROM enterprise_views 
        WHERE enterprise_id = ? AND view_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ");
    $recentViewStmt->bind_param("i", $userId);
    $recentViewStmt->execute();
    $recentViewStats = $recentViewStmt->get_result()->fetch_assoc();
    
    $recentContactStmt = $GLOBALS['conn']->prepare("
        SELECT COUNT(*) as recent_contacts
        FROM enterprise_contacts 
        WHERE enterprise_id = ? AND contact_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ");
    $recentContactStmt->bind_param("i", $userId);
    $recentContactStmt->execute();
    $recentContactStats = $recentContactStmt->get_result()->fetch_assoc();
    
    $stats = [
        'jobs' => [
            'total' => (int)$jobStats['total_jobs'],
            'active' => (int)$jobStats['active_jobs'],
            'paused' => (int)$jobStats['paused_jobs'],
            'closed' => (int)$jobStats['closed_jobs'],
            'total_views' => (int)$jobStats['total_job_views'],
            'total_applications' => (int)$jobStats['total_applications']
        ],
        'portfolios' => [
            'total_views' => (int)$viewStats['total_portfolio_views'],
            'total_bookmarks' => (int)$bookmarkStats['total_bookmarks'],
            'recent_views' => (int)$recentViewStats['recent_views']
        ],
        'contacts' => [
            'total' => (int)$contactStats['total_contacts'],
            'recent' => (int)$recentContactStats['recent_contacts']
        ]
    ];
    
    sendResponse($stats, 200, '取得統計資料成功');
}

// 取得最近瀏覽的作品
function getRecentPortfolios() {
    $userId = checkPermission('enterprise');
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 6;
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            p.id, p.title, p.description, p.cover_image, p.status,
            p.view_count, p.like_count, p.comment_count, p.download_count,
            p.is_featured, p.published_at, p.created_at, p.tags,
            c.name as category_name, c.slug as category_slug, c.color as category_color,
            sp.first_name, sp.last_name, sp.display_name, sp.avatar_url,
            sp.major, sp.school, sp.grade, sp.skills,
            u.username,
            ev.view_date
        FROM enterprise_views ev
        JOIN portfolios p ON ev.portfolio_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE ev.enterprise_id = ? AND p.status = 'published'
        ORDER BY ev.view_date DESC
        LIMIT ?
    ");
    $stmt->bind_param("ii", $userId, $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    $portfolios = $result->fetch_all(MYSQLI_ASSOC);
    
    // 處理資料
    foreach ($portfolios as &$portfolio) {
        $portfolio['tags'] = $portfolio['tags'] ? explode(',', $portfolio['tags']) : [];
        $portfolio['skills'] = $portfolio['skills'] ? explode(',', $portfolio['skills']) : [];
        $portfolio['student_name'] = $portfolio['display_name'] ?: ($portfolio['first_name'] . ' ' . $portfolio['last_name']);
    }
    
    sendResponse($portfolios, 200, '取得最近瀏覽作品成功');
}

// 取得推薦學生
function getRecommendedStudents() {
    $userId = checkPermission('enterprise');
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 8;
    
    // 根據企業的職缺需求推薦學生
    $stmt = $GLOBALS['conn']->prepare("
        SELECT DISTINCT
            sp.user_id, sp.first_name, sp.last_name, sp.display_name, sp.avatar_url,
            sp.major, sp.school, sp.grade, sp.skills, sp.bio,
            sp.portfolio_count, sp.view_count, sp.like_count,
            u.username,
            COUNT(p.id) as portfolio_count,
            AVG(p.view_count) as avg_views,
            AVG(p.like_count) as avg_likes
        FROM student_profiles sp
        JOIN users u ON sp.user_id = u.id
        LEFT JOIN portfolios p ON sp.user_id = p.user_id AND p.status = 'published'
        WHERE u.role = 'student' AND u.status = 'active'
        GROUP BY sp.user_id
        HAVING portfolio_count > 0
        ORDER BY avg_views DESC, avg_likes DESC, portfolio_count DESC
        LIMIT ?
    ");
    $stmt->bind_param("i", $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    $students = $result->fetch_all(MYSQLI_ASSOC);
    
    // 處理資料
    foreach ($students as &$student) {
        $student['skills'] = $student['skills'] ? explode(',', $student['skills']) : [];
        $student['student_name'] = $student['display_name'] ?: ($student['first_name'] . ' ' . $student['last_name']);
        $student['avg_views'] = round($student['avg_views'], 0);
        $student['avg_likes'] = round($student['avg_likes'], 0);
    }
    
    sendResponse($students, 200, '取得推薦學生成功');
}

// 取得最近活動
function getRecentActivities() {
    $userId = checkPermission('enterprise');
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    
    // 合併多種活動類型
    $stmt = $GLOBALS['conn']->prepare("
        (SELECT 
            'job_application' as type,
            ja.created_at as activity_date,
            ja.id as activity_id,
            j.title as job_title,
            sp.first_name, sp.last_name, sp.display_name,
            ja.status as application_status,
            NULL as portfolio_title,
            NULL as contact_type
        FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        JOIN users u ON ja.student_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE j.enterprise_id = ?
        ORDER BY ja.created_at DESC
        LIMIT ?)
        
        UNION ALL
        
        (SELECT 
            'portfolio_view' as type,
            ev.view_date as activity_date,
            ev.id as activity_id,
            NULL as job_title,
            sp.first_name, sp.last_name, sp.display_name,
            NULL as application_status,
            p.title as portfolio_title,
            NULL as contact_type
        FROM enterprise_views ev
        JOIN portfolios p ON ev.portfolio_id = p.id
        JOIN users u ON p.user_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE ev.enterprise_id = ? AND p.status = 'published'
        ORDER BY ev.view_date DESC
        LIMIT ?)
        
        UNION ALL
        
        (SELECT 
            'contact' as type,
            ec.contact_date as activity_date,
            ec.id as activity_id,
            NULL as job_title,
            sp.first_name, sp.last_name, sp.display_name,
            NULL as application_status,
            NULL as portfolio_title,
            ec.contact_type
        FROM enterprise_contacts ec
        JOIN users u ON ec.student_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE ec.enterprise_id = ?
        ORDER BY ec.contact_date DESC
        LIMIT ?)
        
        ORDER BY activity_date DESC
        LIMIT ?
    ");
    $stmt->bind_param("iiiiii", $userId, $limit, $userId, $limit, $userId, $limit, $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    $activities = $result->fetch_all(MYSQLI_ASSOC);
    
    // 處理資料
    foreach ($activities as &$activity) {
        $activity['student_name'] = $activity['display_name'] ?: ($activity['first_name'] . ' ' . $activity['last_name']);
        $activity['time_ago'] = getTimeAgo($activity['activity_date']);
        
        // 根據活動類型設定描述
        switch ($activity['type']) {
            case 'job_application':
                $activity['description'] = $activity['student_name'] . ' 申請了「' . $activity['job_title'] . '」職缺';
                $activity['status_text'] = getApplicationStatusText($activity['application_status']);
                break;
            case 'portfolio_view':
                $activity['description'] = '瀏覽了 ' . $activity['student_name'] . ' 的作品「' . $activity['portfolio_title'] . '」';
                break;
            case 'contact':
                $activity['description'] = '聯絡了 ' . $activity['student_name'];
                break;
        }
    }
    
    sendResponse($activities, 200, '取得最近活動成功');
}

// 取得職缺摘要
function getJobSummary() {
    $userId = checkPermission('enterprise');
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT 
            j.id, j.title, j.status, j.job_type, j.location,
            j.view_count, j.application_count, j.bookmark_count,
            j.published_at, j.deadline,
            COUNT(ja.id) as pending_applications
        FROM jobs j
        LEFT JOIN job_applications ja ON j.id = ja.job_id AND ja.status = 'pending'
        WHERE j.enterprise_id = ?
        GROUP BY j.id
        ORDER BY j.created_at DESC
        LIMIT ?
    ");
    $stmt->bind_param("ii", $userId, $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    $jobs = $result->fetch_all(MYSQLI_ASSOC);
    
    // 處理資料
    foreach ($jobs as &$job) {
        $job['status_text'] = getJobStatusText($job['status']);
        $job['days_ago'] = getDaysAgo($job['published_at']);
        if ($job['deadline']) {
            $job['days_until_deadline'] = getDaysUntil($job['deadline']);
        }
    }
    
    sendResponse($jobs, 200, '取得職缺摘要成功');
}

// 取得分析資料
function getAnalytics() {
    $userId = checkPermission('enterprise');
    $days = isset($_GET['days']) ? (int)$_GET['days'] : 30;
    
    // 每日瀏覽統計
    $viewStmt = $GLOBALS['conn']->prepare("
        SELECT 
            DATE(ev.view_date) as date,
            COUNT(*) as views
        FROM enterprise_views ev
        WHERE ev.enterprise_id = ? AND ev.view_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(ev.view_date)
        ORDER BY date ASC
    ");
    $viewStmt->bind_param("ii", $userId, $days);
    $viewStmt->execute();
    $viewStats = $viewStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // 每日聯絡統計
    $contactStmt = $GLOBALS['conn']->prepare("
        SELECT 
            DATE(ec.contact_date) as date,
            COUNT(*) as contacts
        FROM enterprise_contacts ec
        WHERE ec.enterprise_id = ? AND ec.contact_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(ec.contact_date)
        ORDER BY date ASC
    ");
    $contactStmt->bind_param("ii", $userId, $days);
    $contactStmt->execute();
    $contactStats = $contactStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // 職缺申請統計
    $applicationStmt = $GLOBALS['conn']->prepare("
        SELECT 
            DATE(ja.created_at) as date,
            COUNT(*) as applications
        FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        WHERE j.enterprise_id = ? AND ja.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(ja.created_at)
        ORDER BY date ASC
    ");
    $applicationStmt->bind_param("ii", $userId, $days);
    $applicationStmt->execute();
    $applicationStats = $applicationStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // 熱門技能統計
    $skillStmt = $GLOBALS['conn']->prepare("
        SELECT 
            TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(sp.skills, ',', numbers.n), ',', -1)) as skill,
            COUNT(*) as count
        FROM (
            SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
        ) numbers
        JOIN student_profiles sp ON CHAR_LENGTH(sp.skills) - CHAR_LENGTH(REPLACE(sp.skills, ',', '')) >= numbers.n - 1
        JOIN enterprise_views ev ON sp.user_id = ev.enterprise_id
        WHERE ev.enterprise_id = ? AND ev.view_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY skill
        HAVING skill != ''
        ORDER BY count DESC
        LIMIT 10
    ");
    $skillStmt->bind_param("ii", $userId, $days);
    $skillStmt->execute();
    $skillStats = $skillStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    $analytics = [
        'views' => $viewStats,
        'contacts' => $contactStats,
        'applications' => $applicationStats,
        'top_skills' => $skillStats
    ];
    
    sendResponse($analytics, 200, '取得分析資料成功');
}

// 輔助函數：取得時間差
function getTimeAgo($datetime) {
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
        return floor($diff / 2592000) . ' 個月前';
    }
}

// 輔助函數：取得申請狀態文字
function getApplicationStatusText($status) {
    $statusMap = [
        'pending' => '待處理',
        'reviewed' => '已檢視',
        'interviewed' => '已面試',
        'accepted' => '已錄取',
        'rejected' => '已拒絕'
    ];
    return $statusMap[$status] ?? $status;
}

// 輔助函數：取得職缺狀態文字
function getJobStatusText($status) {
    $statusMap = [
        'active' => '招募中',
        'paused' => '暫停招募',
        'closed' => '已結束',
        'draft' => '草稿'
    ];
    return $statusMap[$status] ?? $status;
}

// 輔助函數：取得天數差
function getDaysAgo($datetime) {
    $time = strtotime($datetime);
    $now = time();
    $diff = $now - $time;
    return floor($diff / 86400);
}

// 輔助函數：取得剩餘天數
function getDaysUntil($date) {
    $time = strtotime($date);
    $now = time();
    $diff = $time - $now;
    return floor($diff / 86400);
}
