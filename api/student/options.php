<?php
require_once '../config.php';

// 設定 CORS 與回應格式
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');
header('Content-Type: application/json; charset=utf-8');

// 預檢請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 選項 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'departments':
                    getDepartments();
                    break;
                case 'grades':
                    getGrades();
                    break;
                case 'all':
                    getAllOptions();
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

// 取得科系列表
function getDepartments() {
    try {
        $stmt = $GLOBALS['conn']->prepare(
            "SELECT id, name, code, school, description 
             FROM departments 
             WHERE is_active = 1 
             ORDER BY sort_order ASC, name ASC"
        );
        $stmt->execute();
        $result = $stmt->get_result();
        
        $departments = [];
        while ($row = $result->fetch_assoc()) {
            $departments[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'code' => $row['code'],
                'school' => $row['school'],
                'description' => $row['description']
            ];
        }
        
        sendResponse($departments, 200);
        
    } catch (Exception $e) {
        sendError('取得科系列表失敗: ' . $e->getMessage(), 500);
    }
}

// 取得年級列表
function getGrades() {
    try {
        $stmt = $GLOBALS['conn']->prepare(
            "SELECT id, name, level, year, description 
             FROM grades 
             WHERE is_active = 1 
             ORDER BY sort_order ASC, year ASC"
        );
        $stmt->execute();
        $result = $stmt->get_result();
        
        $grades = [];
        while ($row = $result->fetch_assoc()) {
            $grades[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'level' => $row['level'],
                'year' => $row['year'],
                'description' => $row['description']
            ];
        }
        
        sendResponse($grades, 200);
        
    } catch (Exception $e) {
        sendError('取得年級列表失敗: ' . $e->getMessage(), 500);
    }
}

// 取得所有選項
function getAllOptions() {
    try {
        // 並行取得科系和年級
        $departmentsStmt = $GLOBALS['conn']->prepare(
            "SELECT id, name, code, school, description 
             FROM departments 
             WHERE is_active = 1 
             ORDER BY sort_order ASC, name ASC"
        );
        $departmentsStmt->execute();
        $departmentsResult = $departmentsStmt->get_result();
        
        $gradesStmt = $GLOBALS['conn']->prepare(
            "SELECT id, name, level, year, description 
             FROM grades 
             WHERE is_active = 1 
             ORDER BY sort_order ASC, year ASC"
        );
        $gradesStmt->execute();
        $gradesResult = $gradesStmt->get_result();
        
        // 處理科系資料
        $departments = [];
        while ($row = $departmentsResult->fetch_assoc()) {
            $departments[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'code' => $row['code'],
                'school' => $row['school'],
                'description' => $row['description']
            ];
        }
        
        // 處理年級資料
        $grades = [];
        while ($row = $gradesResult->fetch_assoc()) {
            $grades[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'level' => $row['level'],
                'year' => $row['year'],
                'description' => $row['description']
            ];
        }
        
        sendResponse([
            'departments' => $departments,
            'grades' => $grades
        ], 200);
        
    } catch (Exception $e) {
        sendError('取得選項失敗: ' . $e->getMessage(), 500);
    }
}

// 注意：sendResponse 和 sendError 函數已在 config.php 中定義
?>
