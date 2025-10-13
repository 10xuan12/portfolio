<?php
require_once '../config.php';

// 管理員系統設定 API
// 解析 RESTful 路徑
$requestUri = $_SERVER['REQUEST_URI'];
$pathAction = '';

if (preg_match('#/admin/settings/([^/?]+)#', $requestUri, $matches)) {
    $pathAction = $matches[1];
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getSettings();
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        $action = $pathAction ?: ($input['action'] ?? 'update');
        
        if ($action === 'update') {
            updateSettings($input);
        } else {
            sendError('無效的操作: ' . $action, 400);
        }
        break;
        
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得系統設定
function getSettings() {
    checkPermission('admin');
    
    // 檢查 system_settings 表是否存在
    $tableCheck = $GLOBALS['conn']->query("SHOW TABLES LIKE 'system_settings'");
    
    if ($tableCheck->num_rows === 0) {
        // 表不存在，返回預設設定
        $defaultSettings = [
            'general' => [
                'siteName' => 'Portfolio+',
                'siteDescription' => '學生作品展示與企業招募平台',
                'adminEmail' => 'admin@portfolio.com',
                'supportEmail' => 'support@portfolio.com',
                'timezone' => 'Asia/Taipei',
                'language' => 'zh-TW',
                'maxFileSize' => 10,
                'sessionTimeout' => 120
            ],
            'security' => [
                'minPasswordLength' => 8,
                'passwordExpiry' => 90,
                'requireComplexPassword' => true,
                'require2FA' => false,
                'maxLoginAttempts' => 5,
                'lockoutDuration' => 30,
                'enableIPWhitelist' => false,
                'allowedIPs' => ''
            ],
            'notifications' => [
                'smtpHost' => 'smtp.gmail.com',
                'smtpPort' => 587,
                'smtpEncryption' => 'tls',
                'smtpUsername' => '',
                'smtpPassword' => '',
                'enableEmailNotifications' => true,
                'notifyNewUsers' => true,
                'notifyNewPortfolios' => true,
                'notifyNewJobs' => false,
                'notifySystemErrors' => true
            ],
            'appearance' => [
                'primaryColor' => '#667eea',
                'accentColor' => '#f093fb',
                'themeMode' => 'light',
                'enableAnimations' => true
            ],
            'backup' => [
                'backupFrequency' => 'weekly',
                'enableAutoBackup' => true,
                'confirmRestore' => true
            ],
            'logs' => [
                'logLevel' => 'info',
                'logRetention' => 30,
                'enableLiveLogs' => false
            ]
        ];
        
        sendResponse($defaultSettings, 200, '取得系統設定成功（使用預設值）');
        return;
    }
    
    // 讀取所有設定
    $stmt = $GLOBALS['conn']->query("SELECT setting_key, setting_value FROM system_settings");
    $settings = [];
    
    while ($row = $stmt->fetch_assoc()) {
        $keys = explode('.', $row['setting_key']);
        $value = json_decode($row['setting_value'], true);
        
        if (count($keys) === 2) {
            $settings[$keys[0]][$keys[1]] = $value;
        }
    }
    
    sendResponse($settings, 200, '取得系統設定成功');
}

// 更新系統設定
function updateSettings($data) {
    checkPermission('admin');
    
    // 檢查 system_settings 表是否存在
    $tableCheck = $GLOBALS['conn']->query("SHOW TABLES LIKE 'system_settings'");
    
    if ($tableCheck->num_rows === 0) {
        // 建立 system_settings 表
        $GLOBALS['conn']->query("
            CREATE TABLE IF NOT EXISTS system_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(255) UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ");
    }
    
    // 開始交易
    $GLOBALS['conn']->begin_transaction();
    
    try {
        foreach ($data as $section => $settings) {
            if (!is_array($settings)) continue;
            
            foreach ($settings as $key => $value) {
                $settingKey = "$section.$key";
                $settingValue = json_encode($value, JSON_UNESCAPED_UNICODE);
                
                $stmt = $GLOBALS['conn']->prepare("
                    INSERT INTO system_settings (setting_key, setting_value)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE setting_value = ?
                ");
                $stmt->bind_param("sss", $settingKey, $settingValue, $settingValue);
                $stmt->execute();
            }
        }
        
        $GLOBALS['conn']->commit();
        sendResponse([], 200, '系統設定已更新');
    } catch (Exception $e) {
        $GLOBALS['conn']->rollback();
        sendError('更新設定失敗：' . $e->getMessage(), 500);
    }
}
?>

