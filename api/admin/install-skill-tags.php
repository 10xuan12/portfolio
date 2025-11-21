<?php
/**
 * 安裝技能標籤表
 * 一次性執行腳本
 * 
 * 使用方法：
 * 訪問：https://您的網址/api/admin/install-skill-tags.php
 * 執行完成後請刪除此檔案
 */

header('Content-Type: text/html; charset=utf-8');

require_once '../config.php';

/**
 * 獲取內嵌的 SQL 內容（避免路徑問題）
 */
function getEmbeddedSQL() {
    return "
CREATE TABLE IF NOT EXISTS `skill_tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '標籤名稱',
  `category` varchar(50) NOT NULL COMMENT '標籤類別',
  `description` text DEFAULT NULL COMMENT '標籤描述',
  `icon` varchar(50) DEFAULT NULL COMMENT '圖標',
  `color` varchar(7) DEFAULT NULL COMMENT '顏色',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序順序',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '是否啟用',
  `usage_count` int(11) DEFAULT 0 COMMENT '使用次數',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tag_name` (`name`),
  KEY `idx_category` (`category`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='技能標籤表';

INSERT IGNORE INTO `skill_tags` (`name`, `category`, `description`, `sort_order`, `is_active`) VALUES
('HTML', '前端開發', '超文本標記語言', 1, 1),
('CSS', '前端開發', '層疊樣式表', 2, 1),
('JavaScript', '前端開發', 'JavaScript 程式語言', 3, 1),
('React', '前端開發', 'React 前端框架', 4, 1),
('Vue', '前端開發', 'Vue.js 前端框架', 5, 1),
('Angular', '前端開發', 'Angular 前端框架', 6, 1),
('前端', '前端開發', '前端開發相關', 7, 1),
('UI', '前端開發', '使用者介面', 8, 1),
('響應式', '前端開發', '響應式設計', 9, 1),
('TypeScript', '前端開發', 'TypeScript 程式語言', 10, 1),
('Next.js', '前端開發', 'Next.js 框架', 11, 1),
('Svelte', '前端開發', 'Svelte 框架', 12, 1),
('Webpack', '前端開發', 'Webpack 打包工具', 13, 1),
('Vite', '前端開發', 'Vite 建置工具', 14, 1),
('Node.js', '後端開發', 'Node.js 後端框架', 1, 1),
('Python', '後端開發', 'Python 程式語言', 2, 1),
('PHP', '後端開發', 'PHP 程式語言', 3, 1),
('Java', '後端開發', 'Java 程式語言', 4, 1),
('C#', '後端開發', 'C# 程式語言', 5, 1),
('後端', '後端開發', '後端開發相關', 6, 1),
('API', '後端開發', '應用程式介面', 7, 1),
('資料庫', '後端開發', '資料庫相關', 8, 1),
('SQL', '後端開發', '結構化查詢語言', 9, 1),
('MySQL', '後端開發', 'MySQL 資料庫', 10, 1),
('PostgreSQL', '後端開發', 'PostgreSQL 資料庫', 11, 1),
('MongoDB', '後端開發', 'MongoDB NoSQL', 12, 1),
('Redis', '後端開發', 'Redis 快取', 13, 1),
('Firebase', '後端開發', 'Firebase 後端服務', 14, 1),
('Socket.io', '後端開發', 'Socket.io 即時通訊', 15, 1),
('WebSocket', '後端開發', 'WebSocket 通訊', 16, 1),
('即時通訊', '後端開發', '即時通訊系統', 17, 1),
('UX', 'UI/UX設計', '使用者體驗', 1, 1),
('設計', 'UI/UX設計', '設計相關', 2, 1),
('Figma', 'UI/UX設計', 'Figma 設計工具', 3, 1),
('Adobe', 'UI/UX設計', 'Adobe 設計套件', 4, 1),
('Photoshop', 'UI/UX設計', 'Adobe Photoshop', 5, 1),
('Illustrator', 'UI/UX設計', 'Adobe Illustrator', 6, 1),
('使用者體驗', 'UI/UX設計', '使用者體驗設計', 7, 1),
('R', '資料分析', 'R 統計語言', 1, 1),
('Excel', '資料分析', 'Microsoft Excel', 2, 1),
('PowerBI', '資料分析', 'Microsoft PowerBI', 3, 1),
('Tableau', '資料分析', 'Tableau 資料視覺化', 4, 1),
('數據分析', '資料分析', '數據分析相關', 5, 1),
('統計', '資料分析', '統計分析', 6, 1),
('機器學習', '資料分析', '機器學習', 7, 1),
('iOS', '行動開發', 'iOS 開發', 1, 1),
('Android', '行動開發', 'Android 開發', 2, 1),
('React Native', '行動開發', 'React Native 跨平台框架', 3, 1),
('Flutter', '行動開發', 'Flutter 跨平台框架', 4, 1),
('Swift', '行動開發', 'Swift 程式語言', 5, 1),
('Kotlin', '行動開發', 'Kotlin 程式語言', 6, 1),
('行動應用', '行動開發', '行動應用開發', 7, 1),
('專案管理', '專案管理', '專案管理相關', 1, 1),
('敏捷', '專案管理', '敏捷開發方法', 2, 1),
('Scrum', '專案管理', 'Scrum 專案管理框架', 3, 1),
('團隊協作', '專案管理', '團隊協作相關', 4, 1),
('Git', '專案管理', 'Git 版本控制', 5, 1),
('版本控制', '專案管理', '版本控制系統', 6, 1),
('管理', '專案管理', '管理相關', 7, 1),
('行銷', '數位行銷', '行銷相關', 1, 1),
('SEO', '數位行銷', '搜尋引擎優化', 2, 1),
('Google Analytics', '數位行銷', 'Google Analytics 分析工具', 3, 1),
('社群媒體', '數位行銷', '社群媒體行銷', 4, 1),
('內容行銷', '數位行銷', '內容行銷', 5, 1),
('數位行銷', '數位行銷', '數位行銷相關', 6, 1),
('網路安全', '網路安全', '網路安全相關', 1, 1),
('滲透測試', '網路安全', '滲透測試技術', 2, 1),
('弱點評估', '網路安全', '弱點評估與分析', 3, 1),
('資訊安全', '網路安全', '資訊安全管理', 4, 1),
('資安', '網路安全', '資訊安全', 5, 1),
('漏洞掃描', '網路安全', '漏洞掃描技術', 6, 1),
('安全測試', '網路安全', '安全測試方法', 7, 1),
('PLC', '工業自動化', '可程式邏輯控制器', 1, 1),
('SCADA', '工業自動化', '監控與數據採集系統', 2, 1),
('工業自動化', '工業自動化', '工業自動化系統', 3, 1),
('物聯網', '工業自動化', '物聯網技術', 4, 1),
('IoT', '工業自動化', '物聯網', 5, 1),
('製造業', '工業自動化', '製造業應用', 6, 1),
('感測器', '工業自動化', '感測器技術', 7, 1),
('Modbus', '工業自動化', 'Modbus 通訊協定', 8, 1),
('機器人學', '機器人學', '機器人技術', 1, 1),
('機械手臂', '機器人學', '機械手臂控制', 2, 1),
('控制系統', '機器人學', '控制系統設計', 3, 1),
('PID控制', '機器人學', 'PID 控制演算法', 4, 1),
('路徑規劃', '機器人學', '路徑規劃演算法', 5, 1),
('碰撞檢測', '機器人學', '碰撞檢測技術', 6, 1),
('Arduino', '機器人學', 'Arduino 開發板', 7, 1),
('MATLAB', '機器人學', 'MATLAB 模擬軟體', 8, 1),
('Simulink', '機器人學', 'MATLAB Simulink', 9, 1),
('BIM', '建築/營建', '建築資訊模型', 1, 1),
('Revit', '建築/營建', 'Autodesk Revit', 2, 1),
('建築學', '建築/營建', '建築設計', 3, 1),
('營建', '建築/營建', '營建工程', 4, 1),
('3D建模', '建築/營建', '3D 建築建模', 5, 1),
('結構分析', '建築/營建', '結構分析與設計', 6, 1),
('機電系統', '建築/營建', '機電系統設計', 7, 1),
('ETABS', '建築/營建', 'ETABS 結構分析', 8, 1),
('3ds Max', '建築/營建', '3ds Max 視覺化', 9, 1),
('永續建築', '建築/營建', '永續建築設計', 10, 1),
('綠建築', '建築/營建', '綠建築技術', 11, 1),
('LEED', '建築/營建', 'LEED 認證', 12, 1),
('能源效率', '建築/營建', '能源效率設計', 13, 1),
('數學建模', '數學/統計', '數學建模方法', 1, 1),
('最佳化', '數學/統計', '最佳化理論', 2, 1),
('線性規劃', '數學/統計', '線性規劃方法', 3, 1),
('非線性優化', '數學/統計', '非線性優化', 4, 1),
('統計學', '數學/統計', '統計分析方法', 5, 1),
('迴歸分析', '數學/統計', '迴歸分析', 6, 1),
('時間序列', '數學/統計', '時間序列分析', 7, 1),
('Gurobi', '數學/統計', 'Gurobi 求解器', 8, 1),
('CPLEX', '數學/統計', 'CPLEX 求解器', 9, 1),
('物理學', '物理', '物理實驗與分析', 1, 1),
('LabVIEW', '物理', 'LabVIEW 儀器控制', 2, 1),
('實驗數據', '物理', '實驗數據分析', 3, 1),
('測量', '物理', '物理測量技術', 4, 1),
('不確定度', '物理', '測量不確定度分析', 5, 1),
('醫療資訊', '醫療資訊', '醫療資訊系統', 1, 1),
('護理資訊學', '醫療資訊', '護理資訊學', 2, 1),
('病患照護', '醫療資訊', '病患照護系統', 3, 1),
('醫療記錄', '醫療資訊', '醫療記錄管理', 4, 1),
('HIS', '醫療資訊', '醫院資訊系統', 5, 1),
('公共衛生', '公共衛生', '公共衛生管理', 1, 1),
('流行病學', '公共衛生', '流行病學分析', 2, 1),
('健康統計', '公共衛生', '健康統計分析', 3, 1),
('疫情監控', '公共衛生', '疫情監控系統', 4, 1),
('政策分析', '公共衛生', '公共政策分析', 5, 1),
('地理資訊', '公共衛生', '地理資訊系統', 6, 1),
('GIS', '公共衛生', '地理資訊系統', 7, 1),
('Leaflet', '公共衛生', 'Leaflet 地圖服務', 8, 1),
('生物資訊學', '生物資訊', '生物資訊分析', 1, 1),
('基因組學', '生物資訊', '基因組學研究', 2, 1),
('蛋白質分析', '生物資訊', '蛋白質結構分析', 3, 1),
('基因序列', '生物資訊', '基因序列分析', 4, 1),
('BLAST', '生物資訊', 'BLAST 序列比對', 5, 1),
('HMMER', '生物資訊', 'HMMER 蛋白質分析', 6, 1),
('Biopython', '生物資訊', 'Biopython 生物資訊庫', 7, 1),
('進化樹', '生物資訊', '進化樹建構', 8, 1),
('品牌識別', '品牌設計', '品牌識別系統', 1, 1),
('Logo設計', '品牌設計', 'Logo 設計', 2, 1),
('視覺識別', '品牌設計', '視覺識別系統', 3, 1),
('品牌設計', '品牌設計', '品牌設計相關', 4, 1),
('視覺規範', '品牌設計', '視覺設計規範', 5, 1),
('品牌指南', '品牌設計', '品牌指南制定', 6, 1),
('心理測驗', '心理學', '心理測驗開發', 1, 1),
('評估', '心理學', '心理評估系統', 2, 1),
('人格測驗', '心理學', '人格測驗設計', 3, 1),
('智力測驗', '心理學', '智力測驗開發', 4, 1),
('情緒評估', '心理學', '情緒評估工具', 5, 1),
('職業興趣', '心理學', '職業興趣測驗', 6, 1),
('數位媒體', '數位媒體', '數位媒體製作', 1, 1),
('內容創作', '數位媒體', '數位內容創作', 2, 1),
('影片製作', '數位媒體', '影片製作與剪輯', 3, 1),
('Premiere Pro', '數位媒體', 'Adobe Premiere Pro', 4, 1),
('After Effects', '數位媒體', 'Adobe After Effects', 5, 1),
('動畫製作', '數位媒體', '動畫製作技術', 6, 1),
('直播', '數位媒體', '直播節目企劃', 7, 1),
('跨文化溝通', '跨文化溝通', '跨文化溝通能力', 1, 1),
('語言教學', '跨文化溝通', '語言教學設計', 2, 1),
('培訓設計', '跨文化溝通', '培訓課程設計', 3, 1),
('線上學習', '跨文化溝通', '線上學習平台', 4, 1),
('國際商務', '跨文化溝通', '國際商務禮儀', 5, 1),
('文化理解', '跨文化溝通', '文化差異理解', 6, 1),
('電商', '電商/商業', '電子商務', 1, 1),
('用戶行為', '電商/商業', '用戶行為分析', 2, 1),
('轉換率', '電商/商業', '轉換率優化', 3, 1),
('用戶分群', '電商/商業', '用戶分群分析', 4, 1),
('商業分析', '電商/商業', '商業數據分析', 5, 1),
('爬蟲', '爬蟲/自動化', '網頁爬蟲開發', 1, 1),
('自動化', '爬蟲/自動化', '自動化程式開發', 2, 1),
('數據收集', '爬蟲/自動化', '數據收集系統', 3, 1),
('Selenium', '爬蟲/自動化', 'Selenium 自動化', 4, 1),
('多線程', '爬蟲/自動化', '多線程程式設計', 5, 1),
('AWS', '雲端/DevOps', 'Amazon Web Services', 1, 1),
('Docker', '雲端/DevOps', 'Docker 容器化', 2, 1),
('Kubernetes', '雲端/DevOps', 'Kubernetes 編排', 3, 1),
('CI/CD', '雲端/DevOps', '持續整合與部署', 4, 1),
('Jenkins', '雲端/DevOps', 'Jenkins 自動化', 5, 1),
('Linux', '雲端/DevOps', 'Linux 系統管理', 6, 1),
('創意', '其他技能', '創意思維', 1, 1),
('創新', '其他技能', '創新能力', 2, 1),
('解決問題', '其他技能', '問題解決能力', 3, 1),
('溝通', '其他技能', '溝通能力', 4, 1),
('領導', '其他技能', '領導能力', 5, 1);
";
}

$results = [];
$errors = [];

try {
    // 嘗試讀取 SQL 檔案，如果失敗則使用內嵌 SQL
    $sqlFile = null;
    $sqlContent = null;
    
    $possiblePaths = [
        __DIR__ . '/../../database/create_skill_tags_table.sql',
        __DIR__ . '/../../../database/create_skill_tags_table.sql',
        dirname(__DIR__, 2) . '/database/create_skill_tags_table.sql',
        dirname(__DIR__, 3) . '/database/create_skill_tags_table.sql',
    ];
    
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            $sqlFile = $path;
            $sqlContent = file_get_contents($path);
            break;
        }
    }
    
    // 如果找不到檔案，使用內嵌的 SQL
    if (!$sqlContent) {
        $sqlContent = getEmbeddedSQL();
    }
    
    // 移除註解
    $sqlContent = preg_replace('/--.*$/m', '', $sqlContent);
    $sqlContent = preg_replace('/\/\*.*?\*\//s', '', $sqlContent);
    
    // 分割 SQL 語句
    $sqlStatements = array_filter(
        array_map('trim', explode(';', $sqlContent)),
        function($stmt) { return !empty($stmt) && strlen($stmt) > 10; }
    );
    
    global $conn;
    $db = $conn;
    
    if (!$db || $db->connect_error) {
        throw new Exception('資料庫連接失敗：' . ($db->connect_error ?? '未知錯誤'));
    }
    
    $successCount = 0;
    $skipCount = 0;
    
    foreach ($sqlStatements as $index => $statement) {
        $statement = trim($statement);
        if (empty($statement) || strlen($statement) < 10) continue;
        
        try {
            if ($db->query($statement)) {
                $successCount++;
                $results[] = [
                    'status' => 'success',
                    'message' => '語句 ' . ($index + 1) . ' 執行成功',
                    'affected_rows' => $db->affected_rows
                ];
            } else {
                // 檢查是否為重複鍵錯誤（可忽略）
                $errorMsg = $db->error;
                if (strpos($errorMsg, 'Duplicate entry') !== false || 
                    strpos($errorMsg, 'Duplicate key') !== false ||
                    strpos($errorMsg, 'already exists') !== false) {
                    $skipCount++;
                    $results[] = [
                        'status' => 'skipped',
                        'message' => '語句 ' . ($index + 1) . ' 已存在，已跳過'
                    ];
                } else {
                    throw new Exception($errorMsg);
                }
            }
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') !== false) {
                $skipCount++;
            } else {
                $errors[] = [
                    'statement' => $index + 1,
                    'error' => $e->getMessage()
                ];
            }
        }
    }
    
    // 驗證安裝結果
    $checkQuery = "SELECT COUNT(*) as count FROM skill_tags WHERE is_active = 1";
    $checkResult = $db->query($checkQuery);
    $tagCount = 0;
    if ($checkResult) {
        $row = $checkResult->fetch_assoc();
        $tagCount = $row['count'] ?? 0;
    }
    
    // 顯示結果
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>技能標籤表安裝完成</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #667eea; margin-bottom: 20px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat-box { flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
            .stat-label { color: #666; margin-top: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>✅ 技能標籤表安裝完成</h1>
            
            <div class="stats">
                <div class="stat-box">
                    <div class="stat-number"><?php echo $successCount; ?></div>
                    <div class="stat-label">成功執行</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number"><?php echo $skipCount; ?></div>
                    <div class="stat-label">已跳過</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number"><?php echo count($errors); ?></div>
                    <div class="stat-label">錯誤</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number"><?php echo $tagCount; ?></div>
                    <div class="stat-label">標籤數量</div>
                </div>
            </div>
            
            <?php if ($tagCount > 0): ?>
            <div class="success">
                <strong>✅ 安裝成功！</strong><br>
                資料庫中已有 <strong><?php echo $tagCount; ?></strong> 個啟用的技能標籤。
            </div>
            <?php endif; ?>
            
            <?php if (!empty($errors)): ?>
            <div class="error">
                <strong>⚠️ 發生錯誤：</strong>
                <ul>
                    <?php foreach ($errors as $error): ?>
                    <li>語句 <?php echo $error['statement']; ?>: <?php echo htmlspecialchars($error['error']); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php endif; ?>
            
            <div class="info">
                <strong>📝 下一步：</strong>
                <ol>
                    <li>驗證標籤：訪問 <code>/api/student/skill-tags.php?action=get_tags</code></li>
                    <li>在上傳作品頁面檢查標籤是否顯示</li>
                    <li><strong>重要：執行完成後請刪除此檔案</strong></li>
                </ol>
            </div>
        </div>
    </body>
    </html>
    <?php
    
} catch (Exception $e) {
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>安裝失敗</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
        </style>
    </head>
    <body>
        <div class="error">
            <h2>❌ 安裝失敗</h2>
            <p><strong>錯誤訊息：</strong> <?php echo htmlspecialchars($e->getMessage()); ?></p>
        </div>
    </body>
    </html>
    <?php
}
?>

