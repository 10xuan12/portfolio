<?php
require_once '../config.php';

// 企業端：搜尋/儀表板用的下拉選單元資料
// GET action=search_filters → { skills:[], departments:[], grades:[] }

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('不支援的 HTTP 方法', 405);
}

// 對於 search_filters，允許未登入用戶也能訪問（提供基本選項）
$action = $_GET['action'] ?? 'search_filters';

// 嘗試驗證權限，但不強制要求（search_filters 可公開訪問）
$enterpriseId = null;
try {
    $enterpriseId = checkPermission('enterprise');
    error_log("meta.php - 權限檢查成功，企業 ID: " . $enterpriseId);
} catch (Exception $e) {
    error_log("meta.php - 權限檢查失敗: " . $e->getMessage());
    // 權限檢查失敗，但對於 search_filters 仍允許繼續
    if ($action !== 'search_filters') {
        sendError('需要企業用戶權限', 401);
    }
    error_log("meta.php - 允許未登入訪問 search_filters");
}

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
        error_log('meta.php - 技能數量: ' . count($skills));
    } catch (Exception $e) {
        error_log('獲取技能列表失敗: ' . $e->getMessage());
        // 使用備用方案：直接從資料庫獲取常見技能
        $skills = ['Python', 'Java', 'JavaScript', 'SQL', 'HTML', 'CSS', 'React', 'Node.js', 'PHP', 'C++'];
    }

    // 科系（departments）
    $departments = [];
    try {
        $deptStmt = $GLOBALS['conn']->prepare("SELECT name FROM departments WHERE is_active = 1 ORDER BY sort_order ASC, name ASC");
        if ($deptStmt) {
            $deptStmt->execute();
            $res2 = $deptStmt->get_result();
            while ($r = $res2->fetch_assoc()) { 
                $departments[] = $r['name']; 
            }
            error_log('meta.php - 科系數量: ' . count($departments));
        }
    } catch (Exception $e) {
        error_log('獲取科系列表失敗: ' . $e->getMessage());
        $departments = [];
    }
    
    // 如果沒有從資料庫獲取到科系，使用備用列表
    if (empty($departments)) {
        error_log('meta.php - 使用備用科系列表');
        $departments = [
            '資訊管理學系', '財務金融學系', '國際企業學系', '資訊工程學系',
            '統計學系', '企業管理學系', '會計學系', '經濟學系',
            '資訊安全學系', '資料科學學系', '人工智慧學系', '電機工程學系'
        ];
    }

    // 學群（categories）
    $categories = [];
    try {
        $catStmt = $GLOBALS['conn']->prepare("SELECT name FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC");
        if ($catStmt) {
            $catStmt->execute();
            $resCat = $catStmt->get_result();
            while ($c = $resCat->fetch_assoc()) { 
                $categories[] = $c['name']; 
            }
            error_log('meta.php - 分類數量: ' . count($categories));
        }
    } catch (Exception $e) {
        error_log('獲取分類列表失敗: ' . $e->getMessage());
    }

    // 年級（grades）
    $grades = [];
    try {
        $gradeStmt = $GLOBALS['conn']->prepare("SELECT name FROM grades WHERE is_active = 1 ORDER BY sort_order ASC, year ASC, name ASC");
        if ($gradeStmt) {
            $gradeStmt->execute();
            $res3 = $gradeStmt->get_result();
            while ($r = $res3->fetch_assoc()) { 
                $grades[] = $r['name']; 
            }
            error_log('meta.php - 年級數量: ' . count($grades));
        }
    } catch (Exception $e) {
        error_log('獲取年級列表失敗: ' . $e->getMessage());
        $grades = [];
    }
    
    // 如果沒有從資料庫獲取到年級，使用備用列表
    if (empty($grades)) {
        error_log('meta.php - 使用備用年級列表');
        $grades = ['大學一年級', '大學二年級', '大學三年級', '大學四年級', '碩士生', '博士生'];
    }

    sendResponse([
        'skills' => $skills,
        'departments' => $departments,
        'categories' => $categories,
        'grades' => $grades
    ], 200, '取得搜尋篩選元資料成功');
}


