<?php
require_once __DIR__ . '/../config.php';

// 管理員系統設定 API
// 檢查管理員權限
session_start();
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    sendError('需要管理員權限', 403);
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getSettings();
        break;
    case 'POST':
    case 'PUT':
        updateSettings();
        break;
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得系統設定
function getSettings() {
    try {
        // 從資料庫或配置檔案讀取設定
        // 這裡使用示範資料，實際應該從資料庫的 settings 表讀取
        
        $settings = [
            // 一般設定
            'general' => [
                'site_name' => 'Portfolio+',
                'site_description' => '學生作品展示與企業招募平台',
                'admin_email' => 'admin@portfolio.com',
                'support_email' => 'support@portfolio.com',
                'timezone' => 'Asia/Taipei',
                'language' => 'zh-TW',
                'max_file_size' => 10, // MB
                'session_timeout' => 120 // 分鐘
            ],
            
            // 安全設定
            'security' => [
                'min_password_length' => 8,
                'password_expiry_days' => 90,
                'require_complex_password' => true,
                'require_2fa' => false,
                'max_login_attempts' => 5,
                'lockout_duration' => 30, // 分鐘
                'enable_ip_whitelist' => false,
                'allowed_ips' => []
            ],
            
            // 通知設定
            'notifications' => [
                'smtp_host' => 'smtp.gmail.com',
                'smtp_port' => 587,
                'smtp_encryption' => 'tls',
                'smtp_username' => '',
                'smtp_password' => '',
                'enable_email_notifications' => true,
                'notify_new_users' => true,
                'notify_new_portfolios' => true,
                'notify_new_jobs' => false,
                'notify_system_errors' => true
            ],
            
            // 外觀設定
            'appearance' => [
                'primary_color' => '#667eea',
                'accent_color' => '#f093fb',
                'theme_mode' => 'light',
                'enable_animations' => true
            ],
            
            // 備份設定
            'backup' => [
                'enable_auto_backup' => true,
                'backup_frequency' => 'weekly',
                'last_backup' => date('Y-m-d H:i:s', strtotime('-1 day'))
            ],
            
            // 日誌設定
            'logs' => [
                'log_level' => 'info',
                'log_retention_days' => 30,
                'enable_live_logs' => false
            ]
        ];
        
        sendResponse($settings, 200, '取得系統設定成功');
        
    } catch (Exception $e) {
        sendError('取得系統設定失敗: ' . $e->getMessage(), 500);
    }
}

// 更新系統設定
function updateSettings() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input)) {
            sendError('缺少設定資料', 400);
        }
        
        // 驗證設定資料
        $category = $input['category'] ?? '';
        $settings = $input['settings'] ?? [];
        
        if (empty($category) || empty($settings)) {
            sendError('缺少必要參數', 400);
        }
        
        // 根據分類更新設定
        switch ($category) {
            case 'general':
                updateGeneralSettings($settings);
                break;
            case 'security':
                updateSecuritySettings($settings);
                break;
            case 'notifications':
                updateNotificationSettings($settings);
                break;
            case 'appearance':
                updateAppearanceSettings($settings);
                break;
            case 'backup':
                updateBackupSettings($settings);
                break;
            case 'logs':
                updateLogSettings($settings);
                break;
            default:
                sendError('未知的設定分類', 400);
        }
        
        sendResponse([
            'category' => $category,
            'settings' => $settings
        ], 200, '設定更新成功');
        
    } catch (Exception $e) {
        sendError('更新設定失敗: ' . $e->getMessage(), 500);
    }
}

// 更新一般設定
function updateGeneralSettings($settings) {
    // 實際應用應該更新資料庫
    // 這裡僅作示範
    
    // 驗證必填欄位
    if (isset($settings['site_name']) && empty($settings['site_name'])) {
        throw new Exception('網站名稱不能為空');
    }
    
    if (isset($settings['max_file_size'])) {
        $maxSize = (int)$settings['max_file_size'];
        if ($maxSize < 1 || $maxSize > 100) {
            throw new Exception('檔案大小必須在 1-100 MB 之間');
        }
    }
    
    // TODO: 更新資料庫
    return true;
}

// 更新安全設定
function updateSecuritySettings($settings) {
    // 驗證密碼長度
    if (isset($settings['min_password_length'])) {
        $minLength = (int)$settings['min_password_length'];
        if ($minLength < 6 || $minLength > 20) {
            throw new Exception('密碼長度必須在 6-20 之間');
        }
    }
    
    // 驗證登入嘗試次數
    if (isset($settings['max_login_attempts'])) {
        $maxAttempts = (int)$settings['max_login_attempts'];
        if ($maxAttempts < 3 || $maxAttempts > 10) {
            throw new Exception('最大登入嘗試次數必須在 3-10 之間');
        }
    }
    
    // TODO: 更新資料庫
    return true;
}

// 更新通知設定
function updateNotificationSettings($settings) {
    // 驗證 SMTP 設定
    if (isset($settings['smtp_port'])) {
        $port = (int)$settings['smtp_port'];
        if ($port < 1 || $port > 65535) {
            throw new Exception('無效的 SMTP 埠號');
        }
    }
    
    // TODO: 更新資料庫
    // TODO: 測試 SMTP 連接
    return true;
}

// 更新外觀設定
function updateAppearanceSettings($settings) {
    // 驗證顏色格式
    if (isset($settings['primary_color'])) {
        if (!preg_match('/^#[0-9A-F]{6}$/i', $settings['primary_color'])) {
            throw new Exception('無效的顏色格式');
        }
    }
    
    // TODO: 更新資料庫
    return true;
}

// 更新備份設定
function updateBackupSettings($settings) {
    // 驗證備份頻率
    if (isset($settings['backup_frequency'])) {
        $validFrequencies = ['daily', 'weekly', 'monthly'];
        if (!in_array($settings['backup_frequency'], $validFrequencies)) {
            throw new Exception('無效的備份頻率');
        }
    }
    
    // TODO: 更新資料庫
    return true;
}

// 更新日誌設定
function updateLogSettings($settings) {
    // 驗證日誌等級
    if (isset($settings['log_level'])) {
        $validLevels = ['debug', 'info', 'warning', 'error'];
        if (!in_array($settings['log_level'], $validLevels)) {
            throw new Exception('無效的日誌等級');
        }
    }
    
    // 驗證保留天數
    if (isset($settings['log_retention_days'])) {
        $days = (int)$settings['log_retention_days'];
        if ($days < 7 || $days > 365) {
            throw new Exception('日誌保留天數必須在 7-365 之間');
        }
    }
    
    // TODO: 更新資料庫
    return true;
}
?>
