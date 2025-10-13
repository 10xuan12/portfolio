<?php
require_once '../config.php';

// 管理員統計分析 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['type'])) {
            getAnalytics($_GET['type']);
        } else {
            getAnalytics('trends');
        }
        break;
        
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得分析資料
function getAnalytics($type) {
    checkPermission('admin');
    
    switch ($type) {
        case 'trends':
            getTrends();
            break;
        case 'users':
            getUserStats();
            break;
        case 'portfolios':
            getPortfolioStats();
            break;
        case 'jobs':
            getJobStats();
            break;
        default:
            getTrends();
    }
}

// 取得趨勢資料
function getTrends() {
    // 取得過去6個月的資料
    $months = [];
    $userCounts = [];
    $studentCounts = [];
    $enterpriseCounts = [];
    
    for ($i = 5; $i >= 0; $i--) {
        $date = date('Y-m', strtotime("-$i months"));
        $months[] = date('n月', strtotime("-$i months"));
        
        // 統計該月新增使用者
        $stmt = $GLOBALS['conn']->prepare("
            SELECT 
                COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
                COUNT(CASE WHEN role = 'enterprise' THEN 1 END) as enterprises
            FROM users 
            WHERE DATE_FORMAT(created_at, '%Y-%m') = ?
        ");
        $stmt->bind_param("s", $date);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        $studentCounts[] = (int)$result['students'];
        $enterpriseCounts[] = (int)$result['enterprises'];
    }
    
    // 作品趨勢
    $portfolioCounts = [];
    $webDesignCounts = [];
    $mobileAppCounts = [];
    
    for ($i = 5; $i >= 0; $i--) {
        $date = date('Y-m', strtotime("-$i months"));
        
        $stmt = $GLOBALS['conn']->prepare("
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN category = '網頁設計' THEN 1 END) as web,
                COUNT(CASE WHEN category = '行動應用' THEN 1 END) as mobile
            FROM portfolios 
            WHERE DATE_FORMAT(created_at, '%Y-%m') = ?
        ");
        $stmt->bind_param("s", $date);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        $portfolioCounts[] = (int)$result['total'];
        $webDesignCounts[] = (int)$result['web'];
        $mobileAppCounts[] = (int)$result['mobile'];
    }
    
    // 職缺趨勢
    $internCounts = [];
    $fulltimeCounts = [];
    
    for ($i = 5; $i >= 0; $i--) {
        $date = date('Y-m', strtotime("-$i months"));
        
        $stmt = $GLOBALS['conn']->prepare("
            SELECT 
                COUNT(CASE WHEN job_type = 'intern' THEN 1 END) as intern,
                COUNT(CASE WHEN job_type = 'fulltime' THEN 1 END) as fulltime
            FROM jobs 
            WHERE DATE_FORMAT(created_at, '%Y-%m') = ?
        ");
        $stmt->bind_param("s", $date);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        $internCounts[] = (int)$result['intern'];
        $fulltimeCounts[] = (int)$result['fulltime'];
    }
    
    // 使用者分布圓餅圖資料
    $stmt = $GLOBALS['conn']->query("
        SELECT 
            COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
            COUNT(CASE WHEN role = 'enterprise' THEN 1 END) as enterprises,
            COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
        FROM users
    ");
    $distribution = $stmt->fetch_assoc();
    
    $response = [
        'users' => [
            'labels' => $months,
            'datasets' => [
                [
                    'label' => '學生',
                    'data' => $studentCounts,
                    'borderColor' => '#667eea',
                    'backgroundColor' => 'rgba(102, 126, 234, 0.1)',
                    'tension' => 0.4
                ],
                [
                    'label' => '企業',
                    'data' => $enterpriseCounts,
                    'borderColor' => '#f093fb',
                    'backgroundColor' => 'rgba(240, 147, 251, 0.1)',
                    'tension' => 0.4
                ]
            ]
        ],
        'portfolios' => [
            'labels' => $months,
            'datasets' => [
                [
                    'label' => '網頁設計',
                    'data' => $webDesignCounts,
                    'borderColor' => '#4facfe',
                    'backgroundColor' => 'rgba(79, 172, 254, 0.1)',
                    'tension' => 0.4
                ],
                [
                    'label' => '行動應用',
                    'data' => $mobileAppCounts,
                    'borderColor' => '#43e97b',
                    'backgroundColor' => 'rgba(67, 233, 123, 0.1)',
                    'tension' => 0.4
                ]
            ]
        ],
        'jobs' => [
            'labels' => $months,
            'datasets' => [
                [
                    'label' => '實習職缺',
                    'data' => $internCounts,
                    'borderColor' => '#fa709a',
                    'backgroundColor' => 'rgba(250, 112, 154, 0.1)',
                    'tension' => 0.4
                ],
                [
                    'label' => '正職職缺',
                    'data' => $fulltimeCounts,
                    'borderColor' => '#fee140',
                    'backgroundColor' => 'rgba(254, 225, 64, 0.1)',
                    'tension' => 0.4
                ]
            ]
        ],
        'pieData' => [
            'labels' => ['學生', '企業', '管理員'],
            'datasets' => [
                [
                    'data' => [
                        (int)$distribution['students'],
                        (int)$distribution['enterprises'],
                        (int)$distribution['admins']
                    ],
                    'backgroundColor' => ['#667eea', '#f093fb', '#4facfe'],
                    'borderWidth' => 2,
                    'borderColor' => '#ffffff'
                ]
            ]
        ]
    ];
    
    sendResponse($response, 200, '取得趨勢資料成功');
}

// 取得使用者統計
function getUserStats() {
    $stats = [];
    
    // 總使用者數
    $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM users");
    $stats['total'] = (int)$stmt->fetch_assoc()['total'];
    
    // 本月新增
    $stmt = $GLOBALS['conn']->query("
        SELECT COUNT(*) as total FROM users 
        WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
    ");
    $stats['thisMonth'] = (int)$stmt->fetch_assoc()['total'];
    
    sendResponse($stats, 200, '取得使用者統計成功');
}

// 取得作品統計
function getPortfolioStats() {
    $stats = [];
    
    // 總作品數
    $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM portfolios");
    $stats['total'] = (int)$stmt->fetch_assoc()['total'];
    
    // 本月新增
    $stmt = $GLOBALS['conn']->query("
        SELECT COUNT(*) as total FROM portfolios 
        WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
    ");
    $stats['thisMonth'] = (int)$stmt->fetch_assoc()['total'];
    
    sendResponse($stats, 200, '取得作品統計成功');
}

// 取得職缺統計
function getJobStats() {
    $stats = [];
    
    // 總職缺數
    $stmt = $GLOBALS['conn']->query("SELECT COUNT(*) as total FROM jobs");
    $stats['total'] = (int)$stmt->fetch_assoc()['total'];
    
    // 本月新增
    $stmt = $GLOBALS['conn']->query("
        SELECT COUNT(*) as total FROM jobs 
        WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
    ");
    $stats['thisMonth'] = (int)$stmt->fetch_assoc()['total'];
    
    sendResponse($stats, 200, '取得職缺統計成功');
}
?>

