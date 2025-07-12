<?php
/**
 * 應用程式配置檔案
 * 集中管理所有設定值
 */

// 防止直接訪問
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

// 應用程式基本設定
define('APP_NAME', 'Portfolio+');
define('APP_VERSION', '2.0.0');
define('APP_ENV', 'development'); // development, production
define('APP_DEBUG', true);

// 時區設定
date_default_timezone_set('Asia/Taipei');

// 資料庫配置
$database_config = [
    'host' => '172.20.10.2',
    'username' => 'teammate1',
    'password' => 'securepass123',
    'database' => 'ephortfolio',
    'charset' => 'utf8mb4',
    'port' => 3306,
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];

// 備用資料庫配置
$database_fallbacks = [
    [
        'host' => 'localhost',
        'username' => 'root',
        'password' => '',
        'database' => 'ephortfolio',
        'charset' => 'utf8mb4',
        'port' => 3306
    ],
    [
        'host' => '127.0.0.1',
        'username' => 'root',
        'password' => '',
        'database' => 'ephortfolio',
        'charset' => 'utf8mb4',
        'port' => 3306
    ]
];

// 安全設定
$security_config = [
    'session_timeout' => 3600, // 1小時
    'max_login_attempts' => 5,
    'lockout_duration' => 900, // 15分鐘
    'password_min_length' => 8,
    'password_require_special' => true,
    'csrf_token_expiry' => 1800, // 30分鐘
];

// 檔案上傳設定
$upload_config = [
    'max_file_size' => 10 * 1024 * 1024, // 10MB
    'allowed_types' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'],
    'upload_path' => APP_ROOT . '/uploads/',
    'temp_path' => APP_ROOT . '/uploads/temp/',
];

// 郵件設定
$mail_config = [
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 587,
    'smtp_username' => '',
    'smtp_password' => '',
    'from_email' => 'noreply@portfolio.com',
    'from_name' => 'Portfolio+',
];

// 快取設定
$cache_config = [
    'enabled' => true,
    'path' => APP_ROOT . '/cache/',
    'expiry' => 3600, // 1小時
];

// 日誌設定
$log_config = [
    'enabled' => true,
    'path' => APP_ROOT . '/logs/',
    'level' => 'INFO', // DEBUG, INFO, WARNING, ERROR
    'max_files' => 30,
];

// 路由設定
$route_config = [
    'default_controller' => 'Home',
    'default_action' => 'index',
    '404_page' => 'error/404',
];

// 主題設定
$theme_config = [
    'primary_color' => '#2563eb',
    'secondary_color' => '#64748b',
    'success_color' => '#10b981',
    'warning_color' => '#f59e0b',
    'error_color' => '#ef4444',
    'info_color' => '#3b82f6',
];

// 功能開關
$feature_flags = [
    'enable_registration' => true,
    'enable_email_verification' => false,
    'enable_two_factor' => false,
    'enable_social_login' => false,
    'enable_api' => false,
    'enable_debug_mode' => APP_DEBUG,
];

// 錯誤報告設定
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
}

// 會話設定
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', isset($_SERVER['HTTPS']));
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Lax');

// 全域變數
$GLOBALS['config'] = [
    'database' => $database_config,
    'database_fallbacks' => $database_fallbacks,
    'security' => $security_config,
    'upload' => $upload_config,
    'mail' => $mail_config,
    'cache' => $cache_config,
    'log' => $log_config,
    'route' => $route_config,
    'theme' => $theme_config,
    'features' => $feature_flags,
];

/**
 * 獲取配置值
 * @param string $key 配置鍵名 (例如: 'database.host')
 * @param mixed $default 預設值
 * @return mixed
 */
function config($key, $default = null) {
    $keys = explode('.', $key);
    $config = $GLOBALS['config'];
    
    foreach ($keys as $k) {
        if (!isset($config[$k])) {
            return $default;
        }
        $config = $config[$k];
    }
    
    return $config;
}

/**
 * 設定配置值
 * @param string $key 配置鍵名
 * @param mixed $value 配置值
 */
function set_config($key, $value) {
    $keys = explode('.', $key);
    $config = &$GLOBALS['config'];
    
    foreach ($keys as $k) {
        if (!isset($config[$k])) {
            $config[$k] = [];
        }
        $config = &$config[$k];
    }
    
    $config = $value;
}

/**
 * 檢查是否為生產環境
 * @return bool
 */
function is_production() {
    return APP_ENV === 'production';
}

/**
 * 檢查是否為開發環境
 * @return bool
 */
function is_development() {
    return APP_ENV === 'development';
}

/**
 * 獲取應用程式根目錄
 * @return string
 */
function app_path($path = '') {
    return APP_ROOT . ($path ? '/' . ltrim($path, '/') : '');
}

/**
 * 獲取資源目錄
 * @return string
 */
function resource_path($path = '') {
    return app_path('resources' . ($path ? '/' . ltrim($path, '/') : ''));
}

/**
 * 獲取快取目錄
 * @return string
 */
function cache_path($path = '') {
    return app_path('cache' . ($path ? '/' . ltrim($path, '/') : ''));
}

/**
 * 獲取日誌目錄
 * @return string
 */
function log_path($path = '') {
    return app_path('logs' . ($path ? '/' . ltrim($path, '/') : ''));
}
?> 