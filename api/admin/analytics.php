<?php
require_once __DIR__ . '/../config.php';

// 管理員統計分析 API
// 檢查管理員權限
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    sendError('需要管理員權限', 403);
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getAnalytics();
        break;
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得統計分析數據
function getAnalytics() {
    try {
        // 解析時間範圍
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        $type = $_GET['type'] ?? 'all'; // all, users, portfolios, jobs
        
        $data = [];
        
        // 使用者成長趨勢
        if ($type === 'all' || $type === 'users') {
            $data['users'] = getUsersGrowth($startDate, $endDate);
        }
        
        // 作品上傳趨勢
        if ($type === 'all' || $type === 'portfolios') {
            $data['portfolios'] = getPortfoliosGrowth($startDate, $endDate);
        }
        
        // 職缺發布趨勢
        if ($type === 'all' || $type === 'jobs') {
            $data['jobs'] = getJobsGrowth($startDate, $endDate);
        }
        
        // 使用者分布
        if ($type === 'all') {
            $data['userDistribution'] = getUserDistribution();
            $data['departmentStats'] = getDepartmentStats();
            $data['categoryStats'] = getCategoryStats();
        }
        
        sendResponse($data, 200, '取得統計數據成功');
        
    } catch (Exception $e) {
        sendError('取得統計數據失敗: ' . $e->getMessage(), 500);
    }
}

// 使用者成長趨勢
function getUsersGrowth($startDate, $endDate) {
    $sql = "
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as count,
            SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
            SUM(CASE WHEN role = 'enterprise' THEN 1 ELSE 0 END) as enterprises
        FROM users
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ";
    
    $stmt = $GLOBALS['conn']->prepare($sql);
    $stmt->bind_param('ss', $startDate, $endDate);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $labels = [];
    $datasets = [
        'students' => [],
        'enterprises' => []
    ];
    
    while ($row = $result->fetch_assoc()) {
        $labels[] = date('m/d', strtotime($row['date']));
        $datasets['students'][] = (int)$row['students'];
        $datasets['enterprises'][] = (int)$row['enterprises'];
    }
    
    return [
        'labels' => $labels,
        'datasets' => [
            [
                'label' => '學生',
                'data' => $datasets['students'],
                'borderColor' => '#667eea',
                'backgroundColor' => 'rgba(102, 126, 234, 0.1)'
            ],
            [
                'label' => '企業',
                'data' => $datasets['enterprises'],
                'borderColor' => '#f093fb',
                'backgroundColor' => 'rgba(240, 147, 251, 0.1)'
            ]
        ]
    ];
}

// 作品上傳趨勢
function getPortfoliosGrowth($startDate, $endDate) {
    $sql = "
        SELECT 
            DATE(p.created_at) as date,
            COUNT(*) as count,
            p.category,
            COUNT(DISTINCT p.id) as portfolio_count
        FROM portfolios p
        WHERE DATE(p.created_at) BETWEEN ? AND ?
        GROUP BY DATE(p.created_at), p.category
        ORDER BY date ASC
    ";
    
    $stmt = $GLOBALS['conn']->prepare($sql);
    $stmt->bind_param('ss', $startDate, $endDate);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $dateData = [];
    $categories = [];
    
    while ($row = $result->fetch_assoc()) {
        $date = date('m/d', strtotime($row['date']));
        $category = $row['category'] ?: '其他';
        
        if (!isset($dateData[$date])) {
            $dateData[$date] = [];
        }
        
        $dateData[$date][$category] = (int)$row['portfolio_count'];
        
        if (!in_array($category, $categories)) {
            $categories[] = $category;
        }
    }
    
    $labels = array_keys($dateData);
    $datasets = [];
    
    $colors = [
        '#4facfe', '#43e97b', '#fa709a', '#fee140', 
        '#30cfd0', '#a8edea', '#ff9a9e', '#fbc2eb'
    ];
    
    foreach ($categories as $i => $category) {
        $data = [];
        foreach ($labels as $label) {
            $data[] = $dateData[$label][$category] ?? 0;
        }
        
        $datasets[] = [
            'label' => $category,
            'data' => $data,
            'borderColor' => $colors[$i % count($colors)],
            'backgroundColor' => $colors[$i % count($colors)] . '20'
        ];
    }
    
    return [
        'labels' => $labels,
        'datasets' => $datasets
    ];
}

// 職缺發布趨勢
function getJobsGrowth($startDate, $endDate) {
    $sql = "
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as count,
            SUM(CASE WHEN job_type = 'full_time' THEN 1 ELSE 0 END) as full_time,
            SUM(CASE WHEN job_type = 'part_time' THEN 1 ELSE 0 END) as part_time,
            SUM(CASE WHEN job_type = 'internship' THEN 1 ELSE 0 END) as internship
        FROM jobs
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ";
    
    $stmt = $GLOBALS['conn']->prepare($sql);
    $stmt->bind_param('ss', $startDate, $endDate);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $labels = [];
    $datasets = [
        'internship' => [],
        'full_time' => [],
        'part_time' => []
    ];
    
    while ($row = $result->fetch_assoc()) {
        $labels[] = date('m/d', strtotime($row['date']));
        $datasets['internship'][] = (int)$row['internship'];
        $datasets['full_time'][] = (int)$row['full_time'];
        $datasets['part_time'][] = (int)$row['part_time'];
    }
    
    return [
        'labels' => $labels,
        'datasets' => [
            [
                'label' => '實習職缺',
                'data' => $datasets['internship'],
                'borderColor' => '#667eea'
            ],
            [
                'label' => '全職',
                'data' => $datasets['full_time'],
                'borderColor' => '#43e97b'
            ],
            [
                'label' => '兼職',
                'data' => $datasets['part_time'],
                'borderColor' => '#fa709a'
            ]
        ]
    ];
}

// 使用者分布
function getUserDistribution() {
    $sql = "
        SELECT 
            role,
            COUNT(*) as count
        FROM users
        GROUP BY role
    ";
    
    $result = $GLOBALS['conn']->query($sql);
    
    $labels = [];
    $data = [];
    $colors = [
        'student' => '#667eea',
        'enterprise' => '#f093fb',
        'admin' => '#4facfe'
    ];
    $backgroundColors = [];
    
    while ($row = $result->fetch_assoc()) {
        $roleNames = [
            'student' => '學生',
            'enterprise' => '企業',
            'admin' => '管理員'
        ];
        
        $labels[] = $roleNames[$row['role']] ?? $row['role'];
        $data[] = (int)$row['count'];
        $backgroundColors[] = $colors[$row['role']] ?? '#cccccc';
    }
    
    return [
        'labels' => $labels,
        'datasets' => [
            [
                'data' => $data,
                'backgroundColor' => $backgroundColors
            ]
        ]
    ];
}

// 熱門科系統計
function getDepartmentStats() {
    $sql = "
        SELECT 
            sp.department,
            COUNT(*) as student_count,
            COUNT(DISTINCT p.id) as portfolio_count
        FROM student_profiles sp
        LEFT JOIN users u ON sp.user_id = u.id
        LEFT JOIN portfolios p ON u.id = p.user_id
        WHERE sp.department IS NOT NULL AND sp.department != ''
        GROUP BY sp.department
        ORDER BY student_count DESC
        LIMIT 10
    ";
    
    $result = $GLOBALS['conn']->query($sql);
    
    $departments = [];
    while ($row = $result->fetch_assoc()) {
        $departments[] = [
            'name' => $row['department'],
            'students' => (int)$row['student_count'],
            'portfolios' => (int)$row['portfolio_count'],
            'percentage' => 0 // 計算百分比
        ];
    }
    
    // 計算總學生數
    $totalStudents = array_sum(array_column($departments, 'students'));
    
    foreach ($departments as &$dept) {
        $dept['percentage'] = $totalStudents > 0 
            ? round(($dept['students'] / $totalStudents) * 100, 1) 
            : 0;
    }
    
    return $departments;
}

// 作品分類統計
function getCategoryStats() {
    $sql = "
        SELECT 
            category,
            COUNT(*) as count,
            SUM(views) as total_views,
            SUM(likes) as total_likes
        FROM portfolios
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY count DESC
        LIMIT 10
    ";
    
    $result = $GLOBALS['conn']->query($sql);
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = [
            'name' => $row['category'],
            'count' => (int)$row['count'],
            'views' => (int)($row['total_views'] ?? 0),
            'likes' => (int)($row['total_likes'] ?? 0)
        ];
    }
    
    // 計算總作品數
    $totalPortfolios = array_sum(array_column($categories, 'count'));
    
    foreach ($categories as &$cat) {
        $cat['percentage'] = $totalPortfolios > 0 
            ? round(($cat['count'] / $totalPortfolios) * 100, 1) 
            : 0;
    }
    
    return $categories;
}
?>
