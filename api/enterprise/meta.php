<?php
require_once '../config.php';

// 企業端：搜尋/儀表板用的下拉選單元資料
// GET action=search_filters → { skills:[], departments:[], grades:[] }

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('不支援的 HTTP 方法', 405);
}

$enterpriseId = checkPermission('enterprise');
$action = $_GET['action'] ?? 'search_filters';

switch ($action) {
    case 'search_filters':
        getSearchFilters();
        break;
    default:
        sendError('無效的操作', 400);
}

function getSearchFilters() {
    // 熱門技能（從學生技能欄位拆分聚合，取前 20）
    $skills = [];
    try {
        $skillStmt = $GLOBALS['conn']->prepare(
            "SELECT LOWER(TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(sp.skills, ',', numbers.n), ',', -1))) AS skill,
                    COUNT(*) AS cnt
             FROM (
                SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
             ) numbers
             JOIN student_profiles sp 
               ON CHAR_LENGTH(sp.skills) - CHAR_LENGTH(REPLACE(sp.skills, ',', '')) >= numbers.n - 1
             WHERE sp.skills IS NOT NULL AND sp.skills <> ''
             GROUP BY LOWER(TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(sp.skills, ',', numbers.n), ',', -1)))
             HAVING skill IS NOT NULL AND skill <> ''
             ORDER BY cnt DESC
             LIMIT 20"
        );
        
        if ($skillStmt) {
            $skillStmt->execute();
            $res1 = $skillStmt->get_result();
            while ($r = $res1->fetch_assoc()) { 
                $skills[] = $r['skill']; 
            }
        }
    } catch (Exception $e) {
        error_log('獲取技能列表失敗: ' . $e->getMessage());
        // 使用備用方案：直接從資料庫獲取常見技能
        $skills = ['Python', 'Java', 'JavaScript', 'SQL', 'HTML', 'CSS', 'React', 'Node.js', 'PHP', 'C++'];
    }

    // 科系（departments）
    $departments = [];
    try {
        $deptStmt = $GLOBALS['conn']->prepare("SELECT DISTINCT name FROM departments WHERE is_active = 1 ORDER BY sort_order ASC, name ASC");
        if ($deptStmt) {
            $deptStmt->execute();
            $res2 = $deptStmt->get_result();
            while ($r = $res2->fetch_assoc()) { $departments[] = $r['name']; }
        }
    } catch (Exception $e) {
        error_log('獲取科系列表失敗: ' . $e->getMessage());
        $departments = [];
    }

    // 學群（categories）
    $categories = [];
    if ($GLOBALS['conn']->query("SHOW TABLES LIKE 'categories'") && $GLOBALS['conn']->affected_rows >= 0) {
        $catStmt = $GLOBALS['conn']->prepare("SELECT name FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC");
        if ($catStmt) {
            $catStmt->execute();
            $resCat = $catStmt->get_result();
            while ($c = $resCat->fetch_assoc()) { $categories[] = $c['name']; }
        }
    }

    // 年級（grades）
    $grades = [];
    try {
        $gradeStmt = $GLOBALS['conn']->prepare("SELECT DISTINCT name FROM grades WHERE is_active = 1 ORDER BY sort_order ASC, year ASC, name ASC");
        if ($gradeStmt) {
            $gradeStmt->execute();
            $res3 = $gradeStmt->get_result();
            while ($r = $res3->fetch_assoc()) { $grades[] = $r['name']; }
        }
    } catch (Exception $e) {
        error_log('獲取年級列表失敗: ' . $e->getMessage());
        $grades = [];
    }

    sendResponse([
        'skills' => $skills,
        'departments' => $departments,
        'categories' => $categories,
        'grades' => $grades
    ], 200, '取得搜尋篩選元資料成功');
}


