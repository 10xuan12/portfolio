<?php
/**
 * 登入處理
 * 使用新的安全架構處理用戶登入
 */

// 載入應用程式初始化檔案
require_once 'includes/init.php';

// 檢查是否為 POST 請求
if (!is_post()) {
    json_response([
        'success' => false,
        'error' => '請使用 POST 方法提交表單'
    ], 405);
}

try {
    // 獲取表單數據
    $email = post('email');
    $password = post('password');
    $role = post('role');
    $remember = post('remember', false);

    // 使用安全類別處理登入
    $security = security();
    $result = $security->login($email, $password, $role);

    // 處理記住我功能
    if ($result['success'] && $remember) {
        $token = random_string(32);
        setcookie('remember_token', $token, time() + (30 * 24 * 60 * 60), '/');
        // 這裡可以將 token 儲存到資料庫中
    }

    // 返回結果
    json_response($result);

} catch (Exception $e) {
    // 記錄錯誤
    if (config('log.enabled', false)) {
        $logMessage = sprintf(
            "[%s] Login Error: %s\nEmail: %s\nRole: %s\n",
            date('Y-m-d H:i:s'),
            $e->getMessage(),
            $email ?? 'N/A',
            $role ?? 'N/A'
        );
        
        $logFile = log_path('auth_' . date('Y-m-d') . '.log');
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }

    json_response([
        'success' => false,
        'error' => '登入時發生錯誤，請稍後再試'
    ], 500);
}
?>
