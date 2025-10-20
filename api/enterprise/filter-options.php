<?php
/**
 * 企業端篩選選項 API
 * 提供技能、科系、年級等篩選選項
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
    // 使用全域資料庫連接
    $conn = $GLOBALS['conn'];
    
    $response = [
        'status' => 200,
        'message' => '篩選選項獲取成功',
        'data' => []
    ];
    
    // 獲取技能選項 - 從 student_profiles 表的 skills 欄位中提取
    $skillsQuery = "
        SELECT DISTINCT sp.skills 
        FROM student_profiles sp
        INNER JOIN users u ON sp.user_id = u.id
        WHERE u.role = 'student' AND u.status = 'active' 
        AND sp.skills IS NOT NULL AND sp.skills != ''
    ";
    
    $skillsStmt = $conn->prepare($skillsQuery);
    $skillsStmt->execute();
    $skillsResult = $skillsStmt->get_result();
    
    $allSkills = [];
    while ($row = $skillsResult->fetch_assoc()) {
        if (!empty($row['skills'])) {
            // 將技能字串分割並清理
            $skillList = array_map('trim', explode(',', $row['skills']));
            $allSkills = array_merge($allSkills, $skillList);
        }
    }
    
    // 去重並排序
    $skills = array_unique(array_filter($allSkills));
    sort($skills);
    
    // 獲取科系選項
    $departmentsQuery = "
        SELECT DISTINCT sp.major 
        FROM student_profiles sp
        INNER JOIN users u ON sp.user_id = u.id
        WHERE u.role = 'student' AND u.status = 'active' 
        AND sp.major IS NOT NULL AND sp.major != ''
        ORDER BY sp.major
    ";
    
    $departmentsStmt = $conn->prepare($departmentsQuery);
    $departmentsStmt->execute();
    $departments = $departmentsStmt->get_result()->fetch_all(MYSQLI_NUM);
    $departments = array_column($departments, 0);
    
    // 獲取年級選項
    $gradesQuery = "
        SELECT DISTINCT sp.grade 
        FROM student_profiles sp
        INNER JOIN users u ON sp.user_id = u.id
        WHERE u.role = 'student' AND u.status = 'active' 
        AND sp.grade IS NOT NULL AND sp.grade != ''
        ORDER BY 
            CASE sp.grade
                WHEN '大學一年級' THEN 1
                WHEN '大學二年級' THEN 2
                WHEN '大學三年級' THEN 3
                WHEN '大學四年級' THEN 4
                WHEN '碩士生' THEN 5
                WHEN '博士生' THEN 6
                ELSE 7
            END
    ";
    
    $gradesStmt = $conn->prepare($gradesQuery);
    $gradesStmt->execute();
    $grades = $gradesStmt->get_result()->fetch_all(MYSQLI_NUM);
    $grades = array_column($grades, 0);
    
    // 獲取大學選項
    $universitiesQuery = "
        SELECT DISTINCT sp.school 
        FROM student_profiles sp
        INNER JOIN users u ON sp.user_id = u.id
        WHERE u.role = 'student' AND u.status = 'active' 
        AND sp.school IS NOT NULL AND sp.school != ''
        ORDER BY sp.school
    ";
    
    $universitiesStmt = $conn->prepare($universitiesQuery);
    $universitiesStmt->execute();
    $universities = $universitiesStmt->get_result()->fetch_all(MYSQLI_NUM);
    $universities = array_column($universities, 0);
    
    $response['data'] = [
        'skills' => $skills,
        'departments' => $departments,
        'grades' => $grades,
        'universities' => $universities
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'message' => '系統錯誤: ' . $e->getMessage(),
        'data' => null
    ], JSON_UNESCAPED_UNICODE);
}
?>
