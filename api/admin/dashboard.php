<?php
require_once __DIR__ . '/../config.php';

// 管理員儀表板 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getDashboardStats();
        break;
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得儀表板統計資料
function getDashboardStats() {
    // 檢查管理員 session（簡化版權限檢查）
    session_start();
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        sendError('需要管理員權限', 403);
    }
    
    try {
        // 基本統計
        $stats = [];
        
        // 總使用者數
        $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM users");
        $stats['totalUsers'] = (int)$stmt->fetch_assoc()['total'];
        
        // 學生數
        $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM users WHERE role = 'student'");
        $stats['totalStudents'] = (int)$stmt->fetch_assoc()['total'];
        
        // 企業數
        $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM users WHERE role = 'enterprise'");
        $stats['totalEnterprises'] = (int)$stmt->fetch_assoc()['total'];
        
        // 總作品數
        $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM portfolios");
        $stats['totalPortfolios'] = (int)$stmt->fetch_assoc()['total'];
        
        // 總職缺數
        $result = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM jobs");
        $stats['totalJobs'] = $result ? (int)$result->fetch_assoc()['total'] : 0;
        
        // 總申請數（檢查 job_applications 表）
        $result = $GLOBALS['conn']->query("SHOW TABLES LIKE 'job_applications'");
        if ($result && $result->num_rows > 0) {
            $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM job_applications");
            $stats['totalApplications'] = (int)$stmt->fetch_assoc()['total'];
        } else {
            $stats['totalApplications'] = 0;
        }
        
        // 開放中的職缺數
        $result = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM jobs WHERE status = 'open'");
        $stats['openJobs'] = $result ? (int)$result->fetch_assoc()['total'] : 0;
        
        // 待審核職缺數
        $result = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM jobs WHERE status = 'pending'");
        $stats['pendingJobs'] = $result ? (int)$result->fetch_assoc()['total'] : 0;
        
        // 待處理申請數
        $result = $GLOBALS['conn']->query("SHOW TABLES LIKE 'job_applications'");
        if ($result && $result->num_rows > 0) {
            $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM job_applications WHERE status = 'pending'");
            $stats['pendingApplications'] = (int)$stmt->fetch_assoc()['total'];
            
            // 已錄取申請數
            $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM job_applications WHERE status = 'accepted'");
            $stats['acceptedApplications'] = (int)$stmt->fetch_assoc()['total'];
        } else {
            $stats['pendingApplications'] = 0;
            $stats['acceptedApplications'] = 0;
        }
        
        // 本月新增使用者
        $stmt = $GLOBALS['conn']->query("
            SELECT COUNT(*) as total FROM users 
            WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        ");
        $stats['thisMonthUsers'] = (int)$stmt->fetch_assoc()['total'];
        
        // 本月新增作品
        $stmt = $GLOBALS['conn']->query("
            SELECT COUNT(*) as total FROM portfolios 
            WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        ");
        $stats['thisMonthPortfolios'] = (int)$stmt->fetch_assoc()['total'];
        
        // 本月新增職缺
        $result = $GLOBALS['conn']->query("
            SELECT COUNT(*) as total FROM jobs 
            WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        ");
        $stats['thisMonthJobs'] = $result ? (int)$result->fetch_assoc()['total'] : 0;
        
        // 本月新增申請（檢查 job_applications 表）
        $result = $GLOBALS['conn']->query("SHOW TABLES LIKE 'job_applications'");
        if ($result && $result->num_rows > 0) {
            $stmt = $GLOBALS['conn']->query("
                SELECT COUNT(*) as total FROM job_applications 
                WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
                AND YEAR(created_at) = YEAR(CURRENT_DATE())
            ");
            $stats['thisMonthApplications'] = (int)$stmt->fetch_assoc()['total'];
        } else {
            $stats['thisMonthApplications'] = 0;
        }
        
        // 最近活動 - 從多個來源合併查詢
        $recentActivities = [];
        
        // 1. 最近註冊的學生
        $result = $GLOBALS['conn']->query("
            SELECT 
                u.id,
                'user' as type,
                CONCAT('新學生註冊：', COALESCE(CONCAT(sp.first_name, ' ', sp.last_name), u.username), 
                       IF(sp.department IS NOT NULL, CONCAT(' (', sp.department, ')'), '')) as text,
                u.created_at as time,
                u.status
            FROM users u
            LEFT JOIN student_profiles sp ON u.id = sp.user_id
            WHERE u.role = 'student'
            ORDER BY u.created_at DESC
            LIMIT 3
        ");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $row['time'] = getTimeAgo($row['time']);
                $recentActivities[] = $row;
            }
        }
        
        // 2. 最近註冊的企業
        $result = $GLOBALS['conn']->query("
            SELECT 
                u.id,
                'enterprise' as type,
                CONCAT('新企業註冊：', COALESCE(ep.company_name, u.username)) as text,
                u.created_at as time,
                u.status
            FROM users u
            LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
            WHERE u.role = 'enterprise'
            ORDER BY u.created_at DESC
            LIMIT 2
        ");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $row['time'] = getTimeAgo($row['time']);
                $recentActivities[] = $row;
            }
        }
        
        // 3. 最近發布的職缺
        $result = $GLOBALS['conn']->query("
            SELECT 
                j.id,
                'job' as type,
                CONCAT('新職缺發布：', j.title, 
                       IF(ep.company_name IS NOT NULL, CONCAT(' (', ep.company_name, ')'), '')) as text,
                j.created_at as time,
                j.status
            FROM jobs j
            JOIN users u ON j.enterprise_id = u.id
            LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
            ORDER BY j.created_at DESC
            LIMIT 3
        ");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $row['time'] = getTimeAgo($row['time']);
                $recentActivities[] = $row;
            }
        }
        
        // 4. 最近的申請
        $result = $GLOBALS['conn']->query("SHOW TABLES LIKE 'job_applications'");
        if ($result && $result->num_rows > 0) {
            $result = $GLOBALS['conn']->query("
                SELECT 
                    ja.id,
                    'application' as type,
                    CONCAT('新申請：', COALESCE(CONCAT(sp.first_name, ' ', sp.last_name), u.username),
                           ' 申請職缺') as text,
                    ja.created_at as time,
                    ja.status
                FROM job_applications ja
                JOIN users u ON ja.student_id = u.id
                LEFT JOIN student_profiles sp ON u.id = sp.user_id
                ORDER BY ja.created_at DESC
                LIMIT 2
            ");
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $row['time'] = getTimeAgo($row['time']);
                    $recentActivities[] = $row;
                }
            }
        }
        
        // 按時間排序並取前5個
        usort($recentActivities, function($a, $b) {
            return strtotime($b['time']) - strtotime($a['time']);
        });
        $recentActivities = array_slice($recentActivities, 0, 5);
        
        // 待處理報告（移除審核功能，只保留報告處理）
        $result = $GLOBALS['conn']->query("SHOW TABLES LIKE 'reports'");
        $pendingReports = 0;
        if ($result && $result->num_rows > 0) {
            $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM reports WHERE status = 'pending'");
            $pendingReports = $stmt ? (int)$stmt->fetch_assoc()['total'] : 0;
        }
        
        // 保留 pendingReviews 結構以向後兼容，但只包含報告
        $pendingReviews = [
            [
                'id' => 1,
                'type' => 'report',
                'title' => '待處理報告',
                'count' => $pendingReports,
                'description' => '需要處理的使用者舉報'
            ]
        ];
        
        // 系統健康狀態 - 從資料庫計算
        // 今日活躍使用者（24小時內有活動的使用者）
        $result = $GLOBALS['conn']->query("SHOW TABLES LIKE 'user_activities'");
        $activeUsers = 0;
        if ($result && $result->num_rows > 0) {
            $stmt = $GLOBALS['conn']->query("
                SELECT COUNT(DISTINCT user_id) as total 
                FROM user_activities 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ");
            if ($stmt) {
                $activeUsers = (int)$stmt->fetch_assoc()['total'];
            }
        } else {
            // 如果沒有 user_activities 表，使用最近登入的使用者數
            $stmt = $GLOBALS['conn']->query("
                SELECT COUNT(DISTINCT id) as total 
                FROM users 
                WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ");
            if ($stmt) {
                $activeUsers = (int)$stmt->fetch_assoc()['total'];
            }
        }
        
        // 今日新增使用者
        $stmt = $GLOBALS['conn']->query("
            SELECT COUNT(*) as total 
            FROM users 
            WHERE DATE(created_at) = CURDATE()
        ");
        $todayUsers = $stmt ? (int)$stmt->fetch_assoc()['total'] : 0;
        
        // 今日新增職缺
        $stmt = $GLOBALS['conn']->query("
            SELECT COUNT(*) as total 
            FROM jobs 
            WHERE DATE(created_at) = CURDATE()
        ");
        $todayJobs = $stmt ? (int)$stmt->fetch_assoc()['total'] : 0;
        
        // 今日新增申請
        $result = $GLOBALS['conn']->query("SHOW TABLES LIKE 'job_applications'");
        $todayApplications = 0;
        if ($result && $result->num_rows > 0) {
            $stmt = $GLOBALS['conn']->query("
                SELECT COUNT(*) as total 
                FROM job_applications 
                WHERE DATE(created_at) = CURDATE()
            ");
            if ($stmt) {
                $todayApplications = (int)$stmt->fetch_assoc()['total'];
            }
        }
        
        // 判斷系統狀態
        $systemStatus = 'healthy';
        if ($activeUsers > 1000) {
            $systemStatus = 'warning'; // 高負載
        }
        
        $systemHealth = [
            'status' => $systemStatus,
            'activeUsers' => $activeUsers,
            'todayUsers' => $todayUsers,
            'todayJobs' => $todayJobs,
            'todayApplications' => $todayApplications
        ];
        
        // 熱門使用者（作品數或職缺數最多的使用者）
        $topUsers = [];
        
        // 熱門學生（作品數最多的前3名）
        $result = $GLOBALS['conn']->query("
            SELECT 
                u.id,
                COALESCE(CONCAT(sp.first_name, ' ', sp.last_name), u.username) as name,
                'student' as type,
                sp.department,
                COUNT(p.id) as portfolios,
                COALESCE(SUM(p.views), 0) as views,
                COALESCE(SUM(p.likes), 0) as likes
            FROM users u
            LEFT JOIN student_profiles sp ON u.id = sp.user_id
            LEFT JOIN portfolios p ON u.id = p.user_id
            WHERE u.role = 'student'
            GROUP BY u.id, sp.first_name, sp.last_name, u.username, sp.department
            HAVING portfolios > 0
            ORDER BY portfolios DESC, views DESC
            LIMIT 3
        ");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $topUsers[] = [
                    'id' => (int)$row['id'],
                    'name' => $row['name'],
                    'type' => 'student',
                    'department' => $row['department'] ?? '',
                    'portfolios' => (int)$row['portfolios'],
                    'views' => (int)$row['views'],
                    'likes' => (int)$row['likes']
                ];
            }
        }
        
        // 熱門企業（職缺數最多的前2名）
        $result = $GLOBALS['conn']->query("SHOW TABLES LIKE 'job_applications'");
        $hasApplications = $result && $result->num_rows > 0;
        
        if ($hasApplications) {
            $result = $GLOBALS['conn']->query("
                SELECT 
                    u.id,
                    COALESCE(ep.company_name, u.username) as name,
                    'enterprise' as type,
                    COUNT(DISTINCT j.id) as jobs,
                    COALESCE(COUNT(DISTINCT ja.id), 0) as applications,
                    0 as views
                FROM users u
                LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
                LEFT JOIN jobs j ON u.id = j.enterprise_id
                LEFT JOIN job_applications ja ON j.id = ja.job_id
                WHERE u.role = 'enterprise'
                GROUP BY u.id, ep.company_name, u.username
                HAVING jobs > 0
                ORDER BY jobs DESC
                LIMIT 2
            ");
        } else {
            $result = $GLOBALS['conn']->query("
                SELECT 
                    u.id,
                    COALESCE(ep.company_name, u.username) as name,
                    'enterprise' as type,
                    COUNT(j.id) as jobs,
                    0 as applications,
                    0 as views
                FROM users u
                LEFT JOIN enterprise_profiles ep ON u.id = ep.user_id
                LEFT JOIN jobs j ON u.id = j.enterprise_id
                WHERE u.role = 'enterprise'
                GROUP BY u.id, ep.company_name, u.username
                HAVING jobs > 0
                ORDER BY jobs DESC
                LIMIT 2
            ");
        }
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $topUsers[] = [
                    'id' => (int)$row['id'],
                    'name' => $row['name'],
                    'type' => 'enterprise',
                    'jobs' => (int)$row['jobs'],
                    'applications' => (int)$row['applications'],
                    'views' => (int)$row['views']
                ];
            }
        }
        
        // 最近報告（待處理的報告）
        $recentReports = [];
        $result = $GLOBALS['conn']->query("SHOW TABLES LIKE 'reports'");
        if ($result && $result->num_rows > 0) {
            $result = $GLOBALS['conn']->query("
                SELECT 
                    r.id,
                    r.reason as type,
                    COALESCE(reporter.username, '未知') as reporter,
                    COALESCE(reported.username, '未知') as reported,
                    r.reason,
                    r.status,
                    r.created_at
                FROM reports r
                LEFT JOIN users reporter ON r.reporter_id = reporter.id
                LEFT JOIN users reported ON r.reported_user_id = reported.id
                WHERE r.status = 'pending'
                ORDER BY r.created_at DESC
                LIMIT 5
            ");
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $recentReports[] = [
                        'id' => (int)$row['id'],
                        'type' => $row['type'],
                        'reporter' => $row['reporter'],
                        'reported' => $row['reported'],
                        'reason' => $row['reason'],
                        'status' => $row['status'],
                        'time' => getTimeAgo($row['created_at'])
                    ];
                }
            }
        }
        
        $response = [
            'stats' => $stats,
            'recentActivities' => $recentActivities,
            'pendingReviews' => $pendingReviews,
            'systemHealth' => $systemHealth,
            'topUsers' => $topUsers,
            'recentReports' => $recentReports
        ];
        
        sendResponse($response, 200, '取得儀表板資料成功');
    } catch (Exception $e) {
        sendError('取得儀表板資料失敗: ' . $e->getMessage(), 500);
    }
}

// 計算時間差
function getTimeAgo($datetime) {
    $now = new DateTime();
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);
    
    if ($diff->y > 0) return $diff->y . ' 年前';
    if ($diff->m > 0) return $diff->m . ' 月前';
    if ($diff->d > 0) return $diff->d . ' 天前';
    if ($diff->h > 0) return $diff->h . ' 小時前';
    if ($diff->i > 0) return $diff->i . ' 分鐘前';
    return '剛剛';
}
?>

