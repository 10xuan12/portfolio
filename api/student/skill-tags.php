<?php
/**
 * 技能標籤 API
 * 提供技能標籤列表，用於作品上傳時的標籤選擇
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
    $action = $_GET['action'] ?? 'get_tags';
    
    switch ($action) {
        case 'get_tags':
            getSkillTags();
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
 * 獲取技能標籤列表
 * 按類別分組返回
 */
function getSkillTags() {
    global $conn;
    $db = $conn;
    
    try {
        // 檢查表是否存在
        $tableExists = $db->query("SHOW TABLES LIKE 'skill_tags'");
        if ($tableExists->num_rows === 0) {
            // 表不存在，返回預設標籤
            sendDefaultTags();
            return;
        }
        
        // 從資料庫獲取標籤
        $stmt = $db->prepare("
            SELECT 
                id,
                name,
                category,
                description,
                icon,
                color,
                sort_order,
                usage_count
            FROM skill_tags
            WHERE is_active = 1
            ORDER BY category, sort_order, name
        ");
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $tags = [];
        while ($row = $result->fetch_assoc()) {
            $tags[] = $row;
        }
        
        // 按類別分組
        $groupedTags = [];
        foreach ($tags as $tag) {
            $category = $tag['category'];
            if (!isset($groupedTags[$category])) {
                $groupedTags[$category] = [];
            }
            $groupedTags[$category][] = $tag;
        }
        
        // 確保所有類別都有數據
        $categories = [
            '前端開發',
            '後端開發',
            'UI/UX設計',
            '資料分析',
            '行動開發',
            '專案管理',
            '數位行銷',
            '網路安全',
            '工業自動化',
            '機器人學',
            '建築/營建',
            '數學/統計',
            '物理',
            '醫療資訊',
            '公共衛生',
            '生物資訊',
            '品牌設計',
            '心理學',
            '數位媒體',
            '跨文化溝通',
            '電商/商業',
            '爬蟲/自動化',
            '雲端/DevOps',
            '其他技能'
        ];
        
        foreach ($categories as $category) {
            if (!isset($groupedTags[$category])) {
                $groupedTags[$category] = [];
            }
        }
        
        echo json_encode([
            'status' => 200,
            'message' => '獲取標籤成功',
            'data' => $groupedTags
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (Exception $e) {
        error_log('獲取技能標籤失敗: ' . $e->getMessage());
        // 發生錯誤時返回預設標籤
        sendDefaultTags();
    }
}

/**
 * 返回預設標籤（當資料庫表不存在或查詢失敗時）
 */
function sendDefaultTags() {
    $defaultTags = [
        '前端開發' => [
            ['name' => 'HTML'],
            ['name' => 'CSS'],
            ['name' => 'JavaScript'],
            ['name' => 'React'],
            ['name' => 'Vue'],
            ['name' => 'Angular'],
            ['name' => '前端'],
            ['name' => 'UI'],
            ['name' => '響應式']
        ],
        '後端開發' => [
            ['name' => 'Node.js'],
            ['name' => 'Python'],
            ['name' => 'PHP'],
            ['name' => 'Java'],
            ['name' => 'C#'],
            ['name' => '後端'],
            ['name' => 'API'],
            ['name' => '資料庫'],
            ['name' => 'SQL']
        ],
        'UI/UX設計' => [
            ['name' => 'UX'],
            ['name' => '設計'],
            ['name' => 'Figma'],
            ['name' => 'Adobe'],
            ['name' => 'Photoshop'],
            ['name' => 'Illustrator'],
            ['name' => '使用者體驗']
        ],
        '資料分析' => [
            ['name' => 'R'],
            ['name' => 'Excel'],
            ['name' => 'PowerBI'],
            ['name' => 'Tableau'],
            ['name' => '數據分析'],
            ['name' => '統計'],
            ['name' => '機器學習']
        ],
        '行動開發' => [
            ['name' => 'iOS'],
            ['name' => 'Android'],
            ['name' => 'React Native'],
            ['name' => 'Flutter'],
            ['name' => 'Swift'],
            ['name' => 'Kotlin'],
            ['name' => '行動應用']
        ],
        '專案管理' => [
            ['name' => '專案管理'],
            ['name' => '敏捷'],
            ['name' => 'Scrum'],
            ['name' => '團隊協作'],
            ['name' => 'Git'],
            ['name' => '版本控制'],
            ['name' => '管理']
        ],
        '數位行銷' => [
            ['name' => '行銷'],
            ['name' => 'SEO'],
            ['name' => 'Google Analytics'],
            ['name' => '社群媒體'],
            ['name' => '內容行銷'],
            ['name' => '數位行銷']
        ],
        '其他技能' => [
            ['name' => '創意'],
            ['name' => '創新'],
            ['name' => '解決問題'],
            ['name' => '溝通'],
            ['name' => '領導']
        ],
        '網路安全' => [
            ['name' => '網路安全'],
            ['name' => '滲透測試'],
            ['name' => '弱點評估'],
            ['name' => '資訊安全']
        ],
        '工業自動化' => [
            ['name' => 'PLC'],
            ['name' => 'SCADA'],
            ['name' => '物聯網'],
            ['name' => '工業自動化']
        ],
        '機器人學' => [
            ['name' => '機器人學'],
            ['name' => '控制系統'],
            ['name' => 'PID控制'],
            ['name' => '路徑規劃']
        ],
        '建築/營建' => [
            ['name' => 'BIM'],
            ['name' => 'Revit'],
            ['name' => '3D建模'],
            ['name' => '永續建築']
        ],
        '數學/統計' => [
            ['name' => '數學建模'],
            ['name' => '最佳化'],
            ['name' => '線性規劃'],
            ['name' => '統計學']
        ],
        '醫療資訊' => [
            ['name' => '醫療資訊'],
            ['name' => '護理資訊學'],
            ['name' => '病患照護']
        ],
        '公共衛生' => [
            ['name' => '公共衛生'],
            ['name' => '流行病學'],
            ['name' => '健康統計']
        ],
        '生物資訊' => [
            ['name' => '生物資訊學'],
            ['name' => '基因組學'],
            ['name' => '蛋白質分析']
        ],
        '品牌設計' => [
            ['name' => '品牌識別'],
            ['name' => 'Logo設計'],
            ['name' => '視覺識別']
        ],
        '心理學' => [
            ['name' => '心理測驗'],
            ['name' => '評估'],
            ['name' => '人格測驗']
        ],
        '數位媒體' => [
            ['name' => '數位媒體'],
            ['name' => '內容創作'],
            ['name' => '影片製作']
        ],
        '跨文化溝通' => [
            ['name' => '跨文化溝通'],
            ['name' => '語言教學'],
            ['name' => '培訓設計']
        ],
        '電商/商業' => [
            ['name' => '電商'],
            ['name' => '用戶行為'],
            ['name' => '商業分析']
        ],
        '爬蟲/自動化' => [
            ['name' => '爬蟲'],
            ['name' => '自動化'],
            ['name' => 'Selenium']
        ],
        '雲端/DevOps' => [
            ['name' => 'AWS'],
            ['name' => 'Docker'],
            ['name' => 'CI/CD']
        ]
    ];
    
    echo json_encode([
        'status' => 200,
        'message' => '獲取標籤成功（使用預設標籤）',
        'data' => $defaultTags
    ], JSON_UNESCAPED_UNICODE);
}
?>

