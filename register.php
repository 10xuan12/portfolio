<?php
/**
 * 註冊處理
 * 使用新的安全架構處理用戶註冊
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
    $userData = [
        'name' => post('name'),
        'email' => post('email'),
        'password' => post('password'),
        'confirmPassword' => post('confirmPassword'),
        'role' => post('role'),
        'companyName' => post('companyName'),
        'adminCode' => post('adminCode'),
        'agree' => post('agree')
    ];

    // 驗證確認密碼
    if ($userData['password'] !== $userData['confirmPassword']) {
        json_response([
            'success' => false,
            'error' => '密碼不一致'
        ]);
    }

    // 驗證同意條款
    if (!$userData['agree']) {
        json_response([
            'success' => false,
            'error' => '請同意服務條款和隱私政策'
        ]);
    }

    // 根據角色進行額外驗證
    switch ($userData['role']) {
        case 'enterprise':
            if (empty($userData['companyName'])) {
                json_response([
                    'success' => false,
                    'error' => '企業用戶必須填寫公司名稱'
                ]);
            }
            break;
        case 'admin':
            if (empty($userData['adminCode'])) {
                json_response([
                    'success' => false,
                    'error' => '管理員必須填寫管理員代碼'
                ]);
            }
            // 驗證管理員代碼
            if ($userData['adminCode'] !== 'ADMIN2024') {
                json_response([
                    'success' => false,
                    'error' => '管理員代碼錯誤'
                ]);
            }
            break;
    }

    // 使用安全類別處理註冊
    $security = security();
    $result = $security->register($userData);

    // 返回結果
    json_response($result);

} catch (Exception $e) {
    // 記錄錯誤
    if (config('log.enabled', false)) {
        $logMessage = sprintf(
            "[%s] Registration Error: %s\nEmail: %s\nRole: %s\n",
            date('Y-m-d H:i:s'),
            $e->getMessage(),
            $userData['email'] ?? 'N/A',
            $userData['role'] ?? 'N/A'
        );
        
        $logFile = log_path('auth_' . date('Y-m-d') . '.log');
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }

    json_response([
        'success' => false,
        'error' => '註冊時發生錯誤，請稍後再試'
    ], 500);
}
?>
