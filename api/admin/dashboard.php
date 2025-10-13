<?php
require_once '../config.php';

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
    checkPermission('admin');
    
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
        $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM jobs");
        $stats['totalJobs'] = (int)$stmt->fetch_assoc()['total'];
        
        // 總申請數
        $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM applications");
        $stats['totalApplications'] = (int)$stmt->fetch_assoc()['total'];
        
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
        $stmt = $GLOBALS['conn']->query("
            SELECT COUNT(*) as total FROM jobs 
            WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        ");
        $stats['thisMonthJobs'] = (int)$stmt->fetch_assoc()['total'];
        
        // 本月新增申請
        $stmt = $GLOBALS['conn']->query("
            SELECT COUNT(*) as total FROM applications 
            WHERE MONTH(applied_at) = MONTH(CURRENT_DATE()) 
            AND YEAR(applied_at) = YEAR(CURRENT_DATE())
        ");
        $stats['thisMonthApplications'] = (int)$stmt->fetch_assoc()['total'];
        
        // 最近活動
        $recentActivities = [];
        $stmt = $GLOBALS['conn']->query("
            SELECT 
                'user' as type,
                CONCAT('新學生註冊：', u.username) as text,
                u.created_at as time,
                'pending' as status
            FROM users u
            WHERE u.role = 'student' AND u.status = 'pending'
            ORDER BY u.created_at DESC
            LIMIT 5
        ");
        while ($row = $stmt->fetch_assoc()) {
            $row['time'] = getTimeAgo($row['time']);
            $recentActivities[] = $row;
        }
        
        // 待審核項目
        $pendingReviews = [];
        
        // 待審核學生
        $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM users WHERE role = 'student' AND status = 'pending'");
        $pendingReviews[] = [
            'id' => 1,
            'type' => 'user',
            'title' => '學生註冊審核',
            'count' => (int)$stmt->fetch_assoc()['total'],
            'description' => '等待審核的學生註冊申請'
        ];
        
        // 待審核企業
        $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM users WHERE role = 'enterprise' AND status = 'pending'");
        $pendingReviews[] = [
            'id' => 2,
            'type' => 'enterprise',
            'title' => '企業註冊審核',
            'count' => (int)$stmt->fetch_assoc()['total'],
            'description' => '等待審核的企業註冊申請'
        ];
        
        // 待審核作品
        $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM portfolios WHERE status = 'pending'");
        $pendingReviews[] = [
            'id' => 3,
            'type' => 'portfolio',
            'title' => '作品審核',
            'count' => (int)$stmt->fetch_assoc()['total'],
            'description' => '等待審核的作品上傳'
        ];
        
        // 待審核職缺
        $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM jobs WHERE status = 'pending'");
        $pendingReviews[] = [
            'id' => 4,
            'type' => 'job',
            'title' => '職缺審核',
            'count' => (int)$stmt->fetch_assoc()['total'],
            'description' => '等待審核的職缺發布'
        ];
        
        // 系統健康狀態
        $systemHealth = [
            'status' => 'healthy',
            'uptime' => '99.9%',
            'responseTime' => '120ms',
            'activeUsers' => 234,
            'serverLoad' => '45%'
        ];
        
        $response = [
            'stats' => $stats,
            'recentActivities' => $recentActivities,
            'pendingReviews' => $pendingReviews,
            'systemHealth' => $systemHealth
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

