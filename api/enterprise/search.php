<?php
require_once '../config.php';

// 企業人才搜尋 API（獨立檔）
// GET 參數：q, skills(逗號), department, grade, minMatch, page, limit

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('不支援的 HTTP 方法', 405);
}

$enterpriseId = checkPermission('enterprise');

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$skills = isset($_GET['skills']) ? trim($_GET['skills']) : '';
$department = isset($_GET['department']) ? trim($_GET['department']) : '';
$grade = isset($_GET['grade']) ? trim($_GET['grade']) : '';
$minMatch = isset($_GET['minMatch']) ? (int)$_GET['minMatch'] : 0;
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = min(50, max(1, (int)($_GET['limit'] ?? 12)));
$offset = ($page - 1) * $limit;

$t0 = microtime(true);

// 動態 where
$where = [];
$params = [];
$types = '';

// 僅列出有公開作品的學生
$where[] = "u.role = 'student' AND u.status = 'active'";

if ($department !== '') {
    $where[] = 'sp.major LIKE ?';
    $params[] = "%$department%";
    $types .= 's';
}
if ($grade !== '') {
    $where[] = 'sp.grade = ?';
    $params[] = $grade;
    $types .= 's';
}

// 關鍵字：名字/科系/技能/自介
if ($q !== '') {
    $where[] = '(sp.display_name LIKE ? OR sp.first_name LIKE ? OR sp.last_name LIKE ? OR sp.major LIKE ? OR sp.skills LIKE ? OR sp.bio LIKE ?)';
    for ($i = 0; $i < 6; $i++) { $params[] = "%$q%"; }
    $types .= 'ssssss';
}

// 技能：任一包含（改進精確度）
if ($skills !== '') {
    $skillList = array_filter(array_map('trim', explode(',', $skills)));
    if (!empty($skillList)) {
        $skillConds = [];
        foreach ($skillList as $kw) {
            // 使用更精確的匹配：技能前後必須是逗號、空格或字串開頭/結尾
            $skillConds[] = '(sp.skills LIKE ? OR sp.skills LIKE ? OR sp.skills LIKE ? OR sp.skills LIKE ?)';
            $params[] = $kw.',%';        // 開頭匹配
            $params[] = '%, '.$kw.'%';   // 中間匹配
            $params[] = '%,'.$kw;        // 結尾匹配
            $params[] = $kw;             // 完全匹配
            $types .= 'ssss';
        }
        $where[] = '('.implode(' OR ', $skillConds).')';
    }
}

$whereSql = empty($where) ? '1=1' : implode(' AND ', $where);

// 主要查詢：聚合已發佈作品統計
$sql = "
    SELECT 
        u.id AS student_id,
        u.username,
        sp.display_name, sp.first_name, sp.last_name, sp.avatar_url,
        sp.major, sp.school, sp.grade, sp.skills, sp.bio,
        COALESCE(COUNT(p.id), 0) AS portfolio_count,
        COALESCE(SUM(p.view_count), 0) AS total_views,
        COALESCE(SUM(p.like_count), 0) AS total_likes
    FROM users u
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    LEFT JOIN portfolios p ON p.user_id = u.id AND p.status = 'published'
    WHERE $whereSql
    GROUP BY u.id
    HAVING portfolio_count > 0
    ORDER BY portfolio_count DESC, total_views DESC, total_likes DESC
    LIMIT ? OFFSET ?
";

$stmt = $GLOBALS['conn']->prepare($sql);
if ($types !== '') {
    $types2 = $types.'ii';
    $params2 = array_merge($params, [$limit, $offset]);
    $stmt->bind_param($types2, ...$params2);
} else {
    $stmt->bind_param('ii', $limit, $offset);
}
$stmt->execute();
$res = $stmt->get_result();
$rows = $res->fetch_all(MYSQLI_ASSOC);

// 計算匹配度
$result = [];
foreach ($rows as $r) {
    $skillsArr = $r['skills'] ? array_map('trim', explode(',', $r['skills'])) : [];
    
    // 改進基礎分：如果沒有任何搜尋條件，給予較高的基礎分
    $hasSearchConditions = ($q !== '' || $skills !== '' || $department !== '' || $grade !== '');
    $score = $hasSearchConditions ? 40 : 60; // 提高基礎分

    // 關鍵字匹配加分
    if ($q !== '') {
        $queryLower = mb_strtolower($q, 'UTF-8');
        $matchCount = 0;
        
        // 檢查各欄位的匹配
        if (stripos($r['display_name'] ?? '', $q) !== false) $matchCount++;
        if (stripos($r['first_name'] ?? '', $q) !== false) $matchCount++;
        if (stripos($r['last_name'] ?? '', $q) !== false) $matchCount++;
        if (stripos($r['major'] ?? '', $q) !== false) $matchCount++;
        if (stripos($r['bio'] ?? '', $q) !== false) $matchCount++;
        
        // 根據匹配數量給分
        $score += min(25, $matchCount * 5);
    }

    // 技能匹配加分
    if (!empty($skillsArr) && $skills !== '') {
        $kwList = array_filter(array_map('trim', explode(',', $skills)));
        $matched = 0;
        $exactMatched = 0;
        
        foreach ($kwList as $kw) {
            foreach ($skillsArr as $s) {
                $sLower = mb_strtolower($s, 'UTF-8');
                $kwLower = mb_strtolower($kw, 'UTF-8');
                
                // 完全匹配給更高分
                if ($sLower === $kwLower) {
                    $exactMatched++;
                    $matched++;
                    break;
                } elseif (stripos($s, $kw) !== false) {
                    $matched++;
                    break;
                }
            }
        }
        
        if (!empty($kwList)) {
            // 完全匹配的技能給額外加分
            $score += min(35, (int)round($matched / max(1, count($kwList)) * 30));
            $score += min(10, $exactMatched * 5);
        }
    }

    // 作品與熱度加分
    $score += min(15, (int)($r['portfolio_count'] * 2));
    $score += min(10, (int)floor($r['total_views'] / 100));
    $score = min(100, $score);

    if ($score >= $minMatch) {
        $name = $r['display_name'] ?: trim(($r['first_name'] ?? '').' '.($r['last_name'] ?? ''));
        
        // 處理頭像路徑
        $avatarUrl = $r['avatar_url'];
        if (empty($avatarUrl)) {
            // 使用姓名生成頭像（DiceBear API）
            $initial = mb_substr($name ?: '學', 0, 1, 'UTF-8');
            $avatarUrl = 'https://api.dicebear.com/7.x/initials/svg?seed=' . urlencode($initial);
        } elseif (strpos($avatarUrl, '/portfolio/') !== 0 && strpos($avatarUrl, 'http') !== 0) {
            $avatarUrl = '/portfolio/' . ltrim($avatarUrl, '/');
        }
        
        $result[] = [
            'id' => (int)$r['student_id'],
            'name' => $name,
            'avatar' => $avatarUrl,
            'department' => $r['major'],
            'grade' => $r['grade'],
            'skills' => $skillsArr,
            'stats' => [
                'portfolios' => (int)$r['portfolio_count'],
                'views' => (int)$r['total_views'],
                'likes' => (int)$r['total_likes']
            ],
            'matchScore' => $score
        ];
    }
}

// 按匹配度排序結果
usort($result, function($a, $b) {
    // 先比較匹配度
    if ($b['matchScore'] !== $a['matchScore']) {
        return $b['matchScore'] - $a['matchScore'];
    }
    // 匹配度相同時，比較作品數量
    if ($b['stats']['portfolios'] !== $a['stats']['portfolios']) {
        return $b['stats']['portfolios'] - $a['stats']['portfolios'];
    }
    // 作品數量相同時，比較瀏覽次數
    return $b['stats']['views'] - $a['stats']['views'];
});

// 搜尋記錄
$durationMs = (int)round((microtime(true) - $t0) * 1000);
$logStmt = $GLOBALS['conn']->prepare(
    "INSERT INTO talent_search_logs (enterprise_id, query, filters, result_count, duration_ms) VALUES (?, ?, ?, ?, ?)"
);
$filters = [
    'skills' => $skills,
    'department' => $department,
    'grade' => $grade,
    'minMatch' => $minMatch
];
$filtersJson = json_encode($filters);
$cnt = count($result);
$logStmt->bind_param('issii', $enterpriseId, $q, $filtersJson, $cnt, $durationMs);
$logStmt->execute();

sendResponse([
    'students' => $result,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'count' => $cnt
    ]
], 200, '搜尋完成');


