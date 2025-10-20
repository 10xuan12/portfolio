<?php
/**
 * 技能分析 API
 * 提供學生技能雷達圖所需的數據分析功能
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 處理 OPTIONS 請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

try {
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    switch ($action) {
        case 'get_skill_analysis':
            getSkillAnalysis();
            break;
        case 'get_student_portfolios':
            getStudentPortfolios();
            break;
        case 'get_skill_comparison':
            getSkillComparison();
            break;
        case 'get_skill_trends':
            getSkillTrends();
            break;
        case 'get_portfolio_timeline':
            getPortfolioTimeline();
            break;
        case 'get_departments':
            getDepartments();
            break;
        default:
            throw new Exception('無效的操作');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 400,
        'message' => $e->getMessage(),
        'data' => null
    ]);
}

/**
 * 獲取學生技能分析數據
 */
function getSkillAnalysis() {
    $studentId = $_GET['student_id'] ?? null;
    
    if (!$studentId) {
        // 嘗試從 user_id 參數獲取
        $studentId = $_GET['user_id'] ?? null;
    }
    
    if (!$studentId) {
        throw new Exception('缺少學生ID參數');
    }
    
    global $conn;
    $db = $conn;
    
    // 獲取學生基本資料
    $studentQuery = "
        SELECT 
            u.id,
            u.username,
            u.email,
            sp.display_name,
            sp.first_name,
            sp.last_name,
            sp.major,
            sp.school,
            sp.grade,
            sp.skills,
            sp.bio
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.id = ? AND u.role = 'student'
    ";
    
    $stmt = $db->prepare($studentQuery);
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $student = $result->fetch_assoc();
    
    if (!$student) {
        throw new Exception('找不到指定的學生');
    }
    
    // 獲取學生作品數據
    $portfoliosQuery = "
        SELECT 
            p.id,
            p.title,
            p.description,
            p.tags,
            p.category_id,
            c.name as category_name,
            p.view_count,
            p.like_count,
            p.comment_count,
            p.download_count,
            p.status,
            p.cover_image,
            p.content,
            p.published_at,
            p.created_at
        FROM portfolios p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.user_id = ? AND p.status = 'published'
        ORDER BY p.published_at DESC
    ";
    
    $stmt = $db->prepare($portfoliosQuery);
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $portfolios = [];
    while ($row = $result->fetch_assoc()) {
        $portfolios[] = $row;
    }
    
    // 分析技能分數
    $skillAnalysis = analyzeStudentSkills($portfolios);
    
    // 獲取技能趨勢數據
    $skillTrends = getSkillTrends($studentId, $db);
    
    // 獲取互動統計
    $interactionStats = getInteractionStats($studentId, $db);
    
    // 生成雷達圖數據
    $radarChartData = generateRadarChartData($skillAnalysis);
    
    echo json_encode([
        'status' => 200,
        'message' => '技能分析成功',
        'data' => [
            'student' => $student,
            'portfolios' => $portfolios,
            'skill_analysis' => $skillAnalysis,
            'skill_trends' => $skillTrends,
            'interaction_stats' => $interactionStats,
            'radarChartData' => $radarChartData,
            'generated_at' => date('Y-m-d H:i:s')
        ]
    ]);
}

/**
 * 獲取學生作品列表
 */
function getStudentPortfolios() {
    $studentId = $_GET['student_id'] ?? null;
    $limit = $_GET['limit'] ?? 50;
    $offset = $_GET['offset'] ?? 0;
    
    if (!$studentId) {
        throw new Exception('缺少學生ID參數');
    }
    
    global $conn;
    $db = $conn;
    
    $query = "
        SELECT 
            p.id,
            p.title,
            p.description,
            p.tags,
            p.category_id,
            c.name as category_name,
            p.view_count,
            p.like_count,
            p.comment_count,
            p.download_count,
            p.status,
            p.cover_image,
            p.published_at,
            p.created_at
        FROM portfolios p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    ";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param("iii", $studentId, $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();
    $portfolios = [];
    while ($row = $result->fetch_assoc()) {
        $portfolios[] = $row;
    }
    
    // 獲取總數
    $countQuery = "SELECT COUNT(*) as total FROM portfolios WHERE user_id = ?";
    $stmt = $db->prepare($countQuery);
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $total = $result->fetch_assoc()['total'];
    
    echo json_encode([
        'status' => 200,
        'message' => '獲取作品列表成功',
        'data' => [
            'portfolios' => $portfolios,
            'pagination' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $total
            ]
        ]
    ]);
}

/**
 * 獲取多個學生技能比較
 */
function getSkillComparison() {
    $studentIds = $_GET['student_ids'] ?? '';
    
    if (!$studentIds) {
        throw new Exception('缺少學生ID列表');
    }
    
    $studentIdArray = explode(',', $studentIds);
    $studentIdArray = array_filter(array_map('intval', $studentIdArray));
    
    if (empty($studentIdArray)) {
        throw new Exception('無效的學生ID列表');
    }
    
    global $conn;
    $db = $conn;
    $comparisonData = [];
    
    foreach ($studentIdArray as $studentId) {
        // 獲取學生基本資料
        $studentQuery = "
            SELECT 
                u.id,
                u.username,
                sp.display_name,
                sp.first_name,
                sp.last_name,
                sp.major,
                sp.school,
                sp.grade
            FROM users u
            LEFT JOIN student_profiles sp ON u.id = sp.user_id
            WHERE u.id = ? AND u.role = 'student'
        ";
        
        $stmt = $db->prepare($studentQuery);
        $stmt->bind_param("i", $studentId);
        $stmt->execute();
        $result = $stmt->get_result();
        $student = $result->fetch_assoc();
        
        if (!$student) continue;
        
        // 獲取作品數據
        $portfoliosQuery = "
            SELECT 
                p.id,
                p.title,
                p.description,
                p.tags,
                p.category_id,
                p.view_count,
                p.like_count,
                p.comment_count,
                p.status,
                p.published_at
            FROM portfolios p
            WHERE p.user_id = ? AND p.status = 'published'
        ";
        
        $stmt = $db->prepare($portfoliosQuery);
        $stmt->bind_param("i", $studentId);
        $stmt->execute();
        $result = $stmt->get_result();
        $portfolios = [];
        while ($row = $result->fetch_assoc()) {
            $portfolios[] = $row;
        }
        
        // 分析技能
        $skillAnalysis = analyzeStudentSkills($portfolios);
        
        $comparisonData[] = [
            'student' => $student,
            'skill_analysis' => $skillAnalysis,
            'portfolio_count' => count($portfolios)
        ];
    }
    
    echo json_encode([
        'status' => 200,
        'message' => '技能比較分析成功',
        'data' => $comparisonData
    ]);
}

/**
 * 獲取技能趨勢數據
 */
function getSkillTrends($studentId, $db) {
    // 獲取過去6個月的作品上傳趨勢
    $trendsQuery = "
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as portfolio_count,
            SUM(view_count) as total_views,
            SUM(like_count) as total_likes,
            SUM(comment_count) as total_comments
        FROM portfolios 
        WHERE user_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND status = 'published'
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
    ";
    
    $stmt = $db->prepare($trendsQuery);
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $trends = [];
    while ($row = $result->fetch_assoc()) {
        $trends[] = $row;
    }
    
    return $trends;
}

/**
 * 獲取互動統計
 */
function getInteractionStats($studentId, $db) {
    // 總互動統計
    $statsQuery = "
        SELECT 
            COUNT(DISTINCT p.id) as total_portfolios,
            SUM(p.view_count) as total_views,
            SUM(p.like_count) as total_likes,
            SUM(p.comment_count) as total_comments,
            AVG(p.view_count) as avg_views_per_portfolio,
            AVG(p.like_count) as avg_likes_per_portfolio
        FROM portfolios p
        WHERE p.user_id = ? AND p.status = 'published'
    ";
    
    $stmt = $db->prepare($statsQuery);
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stats = $result->fetch_assoc();
    
    // 最受歡迎的作品
    $popularQuery = "
        SELECT 
            p.id,
            p.title,
            p.view_count,
            p.like_count,
            p.comment_count
        FROM portfolios p
        WHERE p.user_id = ? AND p.status = 'published'
        ORDER BY (p.view_count + p.like_count * 2 + p.comment_count * 3) DESC
        LIMIT 3
    ";
    
    $stmt = $db->prepare($popularQuery);
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $popularPortfolios = [];
    while ($row = $result->fetch_assoc()) {
        $popularPortfolios[] = $row;
    }
    
    return [
        'overall' => $stats,
        'popular_portfolios' => $popularPortfolios
    ];
}

/**
 * 分析學生技能分數
 */
function analyzeStudentSkills($portfolios) {
    $skillCategories = [
        '前端開發' => ['HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'Angular', '前端', 'UI', '響應式'],
        '後端開發' => ['Node.js', 'Python', 'PHP', 'Java', 'C#', '後端', 'API', '資料庫', 'SQL'],
        'UI/UX設計' => ['UI', 'UX', '設計', 'Figma', 'Adobe', 'Photoshop', 'Illustrator', '使用者體驗'],
        '資料分析' => ['Python', 'R', 'SQL', 'Excel', 'PowerBI', 'Tableau', '數據分析', '統計', '機器學習'],
        '行動開發' => ['iOS', 'Android', 'React Native', 'Flutter', 'Swift', 'Kotlin', '行動應用'],
        '專案管理' => ['專案管理', '敏捷', 'Scrum', '團隊協作', 'Git', '版本控制', '管理'],
        '數位行銷' => ['行銷', 'SEO', 'Google Analytics', '社群媒體', '內容行銷', '數位行銷'],
        '其他技能' => ['其他', '創意', '創新', '解決問題', '溝通', '領導']
    ];
    
    $skillScores = [];
    $totalPortfolios = count($portfolios);
    
    // 初始化所有技能類別
    foreach ($skillCategories as $category => $keywords) {
        $skillScores[$category] = [
            'score' => 0,
            'portfolio_count' => 0,
            'interaction_score' => 0,
            'completeness_score' => 0,
            'keywords_matched' => []
        ];
    }
    
    if ($totalPortfolios === 0) {
        return $skillScores;
    }
    
    // 分析每個作品
    foreach ($portfolios as $portfolio) {
        $tags = explode(',', $portfolio['tags'] ?? '');
        $tags = array_map('trim', $tags);
        
        $description = strtolower($portfolio['description'] ?? '');
        $title = strtolower($portfolio['title'] ?? '');
        $content = strtolower($portfolio['content'] ?? '');
        
        // 計算互動分數
        $interactionScore = calculateInteractionScore($portfolio);
        
        // 計算完整度分數
        $completenessScore = calculateCompletenessScore($portfolio);
        
        // 檢查每個技能類別
        foreach ($skillCategories as $category => $keywords) {
            $matchScore = 0;
            $matchedKeywords = [];
            
            // 檢查標籤匹配
            foreach ($tags as $tag) {
                foreach ($keywords as $keyword) {
                    if (stripos($tag, $keyword) !== false) {
                        $matchScore += 2; // 標籤匹配權重較高
                        $matchedKeywords[] = $keyword;
                    }
                }
            }
            
            // 檢查標題和描述匹配
            $textContent = $title . ' ' . $description . ' ' . $content;
            foreach ($keywords as $keyword) {
                if (stripos($textContent, strtolower($keyword)) !== false) {
                    $matchScore += 1;
                    if (!in_array($keyword, $matchedKeywords)) {
                        $matchedKeywords[] = $keyword;
                    }
                }
            }
            
            if ($matchScore > 0) {
                $skillScores[$category]['portfolio_count']++;
                $skillScores[$category]['interaction_score'] += $interactionScore;
                $skillScores[$category]['completeness_score'] += $completenessScore;
                $skillScores[$category]['keywords_matched'] = array_unique(
                    array_merge($skillScores[$category]['keywords_matched'], $matchedKeywords)
                );
            }
        }
    }
    
    // 計算最終分數 (0-100)
    foreach ($skillScores as $category => &$data) {
        if ($data['portfolio_count'] === 0) {
            $data['score'] = 0;
            continue;
        }
        
        // 分數計算公式：
        // 作品數量權重 (40%) + 互動分數權重 (30%) + 完整度權重 (30%)
        $portfolioWeight = ($data['portfolio_count'] / $totalPortfolios) * 40;
        $interactionWeight = ($data['interaction_score'] / $data['portfolio_count']) * 30;
        $completenessWeight = ($data['completeness_score'] / $data['portfolio_count']) * 30;
        
        $data['score'] = min(100, round($portfolioWeight + $interactionWeight + $completenessWeight));
    }
    
    return $skillScores;
}

/**
 * 計算互動分數
 */
function calculateInteractionScore($portfolio) {
    $views = $portfolio['view_count'] ?? 0;
    $likes = $portfolio['like_count'] ?? 0;
    $comments = $portfolio['comment_count'] ?? 0;
    
    // 互動分數計算：瀏覽數*0.1 + 讚數*2 + 評論數*3
    return min(100, ($views * 0.1) + ($likes * 2) + ($comments * 3));
}

/**
 * 計算完整度分數
 */
function calculateCompletenessScore($portfolio) {
    $score = 0;
    
    // 有標題 +10
    if (!empty($portfolio['title'])) $score += 10;
    
    // 有描述 +20
    if (!empty($portfolio['description'])) $score += 20;
    
    // 有內容 +20
    if (!empty($portfolio['content'])) $score += 20;
    
    // 有標籤 +15
    if (!empty($portfolio['tags'])) $score += 15;
    
    // 有封面圖片 +15
    if (!empty($portfolio['cover_image'])) $score += 15;
    
    // 有分類 +10
    if (!empty($portfolio['category_id'])) $score += 10;
    
    // 已發布 +10
    if ($portfolio['status'] === 'published') $score += 10;
    
    return min(100, $score);
}

/**
 * 獲取作品時光機數據
 */
function getPortfolioTimeline() {
    $studentId = $_GET['student_id'] ?? null;
    
    if (!$studentId) {
        throw new Exception('缺少學生ID參數');
    }
    
    global $conn;
    $db = $conn;
    
    // 獲取學生基本資料
    $studentQuery = "
        SELECT 
            u.id,
            u.username,
            sp.display_name,
            sp.first_name,
            sp.last_name,
            sp.major,
            sp.school,
            sp.grade,
            sp.skills,
            sp.bio
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.id = ? AND u.role = 'student'
    ";
    
    $stmt = $db->prepare($studentQuery);
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $student = $result->fetch_assoc();
    
    if (!$student) {
        throw new Exception('找不到指定的學生');
    }
    
    // 獲取作品時光機數據
    $timelineQuery = "
        SELECT 
            p.id,
            p.title,
            p.description,
            p.tags,
            p.category_id,
            c.name as category_name,
            c.color as category_color,
            p.view_count,
            p.like_count,
            p.comment_count,
            p.download_count,
            p.status,
            p.cover_image,
            p.content,
            p.published_at,
            p.created_at,
            p.updated_at
        FROM portfolios p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
    ";
    
    $stmt = $db->prepare($timelineQuery);
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $portfolios = [];
    while ($row = $result->fetch_assoc()) {
        $portfolios[] = $row;
    }
    
    // 處理時光機數據
    $timelineData = [];
    $monthlyStats = [];
    $categoryStats = [];
    
    foreach ($portfolios as $portfolio) {
        $createdDate = new DateTime($portfolio['created_at']);
        $monthKey = $createdDate->format('Y-m');
        $category = $portfolio['category_name'] ?: '未分類';
        
        // 處理標籤
        $portfolio['tags'] = $portfolio['tags'] ? explode(',', $portfolio['tags']) : [];
        
        // 處理封面圖片路徑
        $coverImage = $portfolio['cover_image'];
        if (!empty($coverImage) && strpos($coverImage, '/portfolio/') !== 0 && strpos($coverImage, 'http') !== 0) {
            $coverImage = '/portfolio/' . ltrim($coverImage, '/');
        }
        $portfolio['cover_image'] = $coverImage;
        
        // 添加到時光機數據
        $timelineData[] = [
            'id' => $portfolio['id'],
            'title' => $portfolio['title'],
            'description' => $portfolio['description'],
            'tags' => $portfolio['tags'],
            'category' => $category,
            'category_color' => $portfolio['category_color'],
            'views' => (int)$portfolio['view_count'],
            'likes' => (int)$portfolio['like_count'],
            'comments' => (int)$portfolio['comment_count'],
            'downloads' => (int)$portfolio['download_count'],
            'status' => $portfolio['status'],
            'cover_image' => $portfolio['cover_image'],
            'created_at' => $portfolio['created_at'],
            'published_at' => $portfolio['published_at'],
            'updated_at' => $portfolio['updated_at'],
            'month' => $monthKey
        ];
        
        // 統計每月數據
        if (!isset($monthlyStats[$monthKey])) {
            $monthlyStats[$monthKey] = [
                'month' => $monthKey,
                'portfolio_count' => 0,
                'total_views' => 0,
                'total_likes' => 0,
                'total_comments' => 0
            ];
        }
        
        $monthlyStats[$monthKey]['portfolio_count']++;
        $monthlyStats[$monthKey]['total_views'] += (int)$portfolio['view_count'];
        $monthlyStats[$monthKey]['total_likes'] += (int)$portfolio['like_count'];
        $monthlyStats[$monthKey]['total_comments'] += (int)$portfolio['comment_count'];
        
        // 統計分類數據
        if (!isset($categoryStats[$category])) {
            $categoryStats[$category] = [
                'category' => $category,
                'color' => $portfolio['category_color'],
                'count' => 0,
                'total_views' => 0,
                'total_likes' => 0
            ];
        }
        
        $categoryStats[$category]['count']++;
        $categoryStats[$category]['total_views'] += (int)$portfolio['view_count'];
        $categoryStats[$category]['total_likes'] += (int)$portfolio['like_count'];
    }
    
    // 轉換為陣列格式
    $monthlyStats = array_values($monthlyStats);
    $categoryStats = array_values($categoryStats);
    
    // 計算成長指標
    $growthMetrics = calculateGrowthMetrics($monthlyStats);
    
    echo json_encode([
        'status' => 200,
        'message' => '作品時光機數據獲取成功',
        'data' => [
            'student' => $student,
            'timeline' => $timelineData,
            'monthly_stats' => $monthlyStats,
            'category_stats' => $categoryStats,
            'growth_metrics' => $growthMetrics,
            'total_portfolios' => count($portfolios),
            'generated_at' => date('Y-m-d H:i:s')
        ]
    ]);
}

/**
 * 計算成長指標
 */
function calculateGrowthMetrics($monthlyStats) {
    if (empty($monthlyStats)) {
        return [
            'portfolio_growth_rate' => 0,
            'view_growth_rate' => 0,
            'engagement_growth_rate' => 0,
            'trend' => 'stable'
        ];
    }
    
    // 按月份排序
    usort($monthlyStats, function($a, $b) {
        return strcmp($a['month'], $b['month']);
    });
    
    $totalMonths = count($monthlyStats);
    if ($totalMonths < 2) {
        return [
            'portfolio_growth_rate' => 0,
            'view_growth_rate' => 0,
            'engagement_growth_rate' => 0,
            'trend' => 'stable'
        ];
    }
    
    // 計算最近3個月與前3個月的比較
    $recentMonths = array_slice($monthlyStats, -3);
    $previousMonths = array_slice($monthlyStats, -6, 3);
    
    if (empty($previousMonths)) {
        $previousMonths = array_slice($monthlyStats, 0, 3);
    }
    
    // 計算平均成長率
    $recentAvgPortfolios = array_sum(array_column($recentMonths, 'portfolio_count')) / count($recentMonths);
    $previousAvgPortfolios = array_sum(array_column($previousMonths, 'portfolio_count')) / count($previousMonths);
    
    $recentAvgViews = array_sum(array_column($recentMonths, 'total_views')) / count($recentMonths);
    $previousAvgViews = array_sum(array_column($previousMonths, 'total_views')) / count($previousMonths);
    
    $recentAvgEngagement = array_sum(array_column($recentMonths, 'total_likes')) / count($recentMonths);
    $previousAvgEngagement = array_sum(array_column($previousMonths, 'total_likes')) / count($previousMonths);
    
    $portfolioGrowthRate = $previousAvgPortfolios > 0 ? 
        (($recentAvgPortfolios - $previousAvgPortfolios) / $previousAvgPortfolios) * 100 : 0;
    
    $viewGrowthRate = $previousAvgViews > 0 ? 
        (($recentAvgViews - $previousAvgViews) / $previousAvgViews) * 100 : 0;
    
    $engagementGrowthRate = $previousAvgEngagement > 0 ? 
        (($recentAvgEngagement - $previousAvgEngagement) / $previousAvgEngagement) * 100 : 0;
    
    // 判斷趨勢
    $avgGrowthRate = ($portfolioGrowthRate + $viewGrowthRate + $engagementGrowthRate) / 3;
    $trend = 'stable';
    if ($avgGrowthRate > 10) {
        $trend = 'growing';
    } elseif ($avgGrowthRate < -10) {
        $trend = 'declining';
    }
    
    return [
        'portfolio_growth_rate' => round($portfolioGrowthRate, 1),
        'view_growth_rate' => round($viewGrowthRate, 1),
        'engagement_growth_rate' => round($engagementGrowthRate, 1),
        'trend' => $trend
    ];
}

/**
 * 獲取科系列表
 */
function getDepartments() {
    global $conn;
    $db = $conn;
    
    try {
        // 從學生資料表中獲取所有不重複的科系
        $query = "
            SELECT DISTINCT sp.major as name, COUNT(*) as student_count
            FROM student_profiles sp
            WHERE sp.major IS NOT NULL AND sp.major != ''
            GROUP BY sp.major
            ORDER BY student_count DESC, sp.major ASC
        ";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $result = $stmt->get_result();
        $departments = [];
        while ($row = $result->fetch_assoc()) {
            $departments[] = $row;
        }
        
        // 如果沒有找到科系數據，返回預設科系
        if (empty($departments)) {
            $defaultDepartments = [
                ['name' => '資訊工程', 'student_count' => 0],
                ['name' => '資訊管理', 'student_count' => 0],
                ['name' => '資訊科學', 'student_count' => 0],
                ['name' => '電腦科學', 'student_count' => 0],
                ['name' => '軟體工程', 'student_count' => 0],
                ['name' => '網路工程', 'student_count' => 0],
                ['name' => '多媒體設計', 'student_count' => 0],
                ['name' => '數位媒體', 'student_count' => 0],
                ['name' => '商業管理', 'student_count' => 0],
                ['name' => '企業管理', 'student_count' => 0],
                ['name' => '行銷管理', 'student_count' => 0],
                ['name' => '其他', 'student_count' => 0]
            ];
            $departments = $defaultDepartments;
        }
        
        echo json_encode([
            'status' => 200,
            'message' => '取得科系列表成功',
            'data' => $departments,
            'generated_at' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'status' => 500,
            'message' => '獲取科系列表失敗: ' . $e->getMessage(),
            'data' => null
        ]);
    }
}

/**
 * 生成雷達圖數據
 */
function generateRadarChartData($skillAnalysis) {
    $labels = [];
    $data = [];
    $backgroundColor = 'rgba(124, 58, 237, 0.2)';
    $borderColor = 'rgba(124, 58, 237, 1)';
    $pointBackgroundColor = 'rgba(124, 58, 237, 1)';
    $pointBorderColor = '#fff';
    $pointHoverBackgroundColor = '#fff';
    $pointHoverBorderColor = 'rgba(124, 58, 237, 1)';
    
    // 只包含有分數的技能類別
    foreach ($skillAnalysis as $category => $analysis) {
        if ($analysis['score'] > 0) {
            $labels[] = $category;
            $data[] = $analysis['score'];
        }
    }
    
    // 如果沒有技能數據，提供預設數據
    if (empty($labels)) {
        $labels = ['前端開發', '後端開發', 'UI/UX設計', '資料分析', '行動開發', '專案管理'];
        $data = [20, 15, 25, 10, 5, 15];
    }
    
    return [
        'labels' => $labels,
        'datasets' => [
            [
                'label' => '技能分數',
                'data' => $data,
                'backgroundColor' => $backgroundColor,
                'borderColor' => $borderColor,
                'pointBackgroundColor' => $pointBackgroundColor,
                'pointBorderColor' => $pointBorderColor,
                'pointHoverBackgroundColor' => $pointHoverBackgroundColor,
                'pointHoverBorderColor' => $pointHoverBorderColor,
                'pointRadius' => 4,
                'pointHoverRadius' => 6,
                'borderWidth' => 2
            ]
        ]
    ];
}

/**
 * 獲取資料庫連接
 */
function getDatabaseConnection() {
    global $conn;
    
    if (!$conn) {
        throw new Exception('資料庫連接失敗');
    }
    
    return $conn;
}
?>
