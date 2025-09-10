<?php
/**
 * Portfolio+ 安全驗證類
 * 提供完整的數據驗證、安全檢查和防護機制
 */

class SecurityValidator {
    
    // 驗證規則
    private $validationRules = [
        'username' => [
            'required' => true,
            'min_length' => 3,
            'max_length' => 50,
            'pattern' => '/^[a-zA-Z0-9_]+$/',
            'message' => '用戶名只能包含字母、數字和下劃線，長度3-50字符'
        ],
        'email' => [
            'required' => true,
            'type' => 'email',
            'max_length' => 255,
            'message' => '請輸入有效的電子郵件地址'
        ],
        'password' => [
            'required' => true,
            'min_length' => 8,
            'max_length' => 128,
            'pattern' => '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/',
            'message' => '密碼必須包含大小寫字母、數字和特殊字符，長度至少8位'
        ],
        'first_name' => [
            'required' => true,
            'min_length' => 1,
            'max_length' => 50,
            'pattern' => '/^[\p{L}\s]+$/u',
            'message' => '姓名只能包含字母和空格'
        ],
        'last_name' => [
            'required' => true,
            'min_length' => 1,
            'max_length' => 50,
            'pattern' => '/^[\p{L}\s]+$/u',
            'message' => '姓名只能包含字母和空格'
        ],
        'phone' => [
            'required' => false,
            'pattern' => '/^[\+]?[0-9\s\-\(\)]{10,15}$/',
            'message' => '請輸入有效的手機號碼'
        ],
        'title' => [
            'required' => true,
            'min_length' => 1,
            'max_length' => 200,
            'message' => '標題長度必須在1-200字符之間'
        ],
        'description' => [
            'required' => false,
            'max_length' => 5000,
            'message' => '描述不能超過5000字符'
        ],
        'tags' => [
            'required' => false,
            'type' => 'array',
            'max_items' => 10,
            'item_pattern' => '/^[a-zA-Z0-9\u4e00-\u9fa5\s]+$/',
            'message' => '標籤只能包含字母、數字、中文和空格，最多10個'
        ]
    ];
    
    // 安全配置
    private $securityConfig = [
        'max_file_size' => 10 * 1024 * 1024, // 10MB
        'allowed_file_types' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'zip', 'rar'],
        'max_upload_files' => 10,
        'rate_limit_requests' => 100, // 每分鐘最大請求數
        'rate_limit_window' => 60, // 時間窗口（秒）
        'csrf_token_expiry' => 3600, // CSRF token過期時間
        'max_login_attempts' => 5,
        'lockout_duration' => 900 // 鎖定時間（秒）
    ];
    
    /**
     * 驗證數據
     */
    public function validate($data, $fields = null) {
        $errors = [];
        $validatedData = [];
        
        // 如果沒有指定字段，驗證所有提供的字段
        if ($fields === null) {
            $fields = array_keys($data);
        }
        
        foreach ($fields as $field) {
            $value = $data[$field] ?? null;
            $rule = $this->validationRules[$field] ?? null;
            
            if (!$rule) {
                continue; // 跳過沒有規則的字段
            }
            
            $fieldErrors = $this->validateField($field, $value, $rule);
            if (!empty($fieldErrors)) {
                $errors[$field] = $fieldErrors;
            } else {
                $validatedData[$field] = $this->sanitizeValue($value, $rule);
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'data' => $validatedData
        ];
    }
    
    /**
     * 驗證單個字段
     */
    private function validateField($field, $value, $rule) {
        $errors = [];
        
        // 必填驗證
        if ($rule['required'] && ($value === null || $value === '')) {
            $errors[] = $rule['message'] ?? "{$field} 為必填欄位";
            return $errors;
        }
        
        // 如果值為空且非必填，跳過其他驗證
        if (($value === null || $value === '') && !$rule['required']) {
            return $errors;
        }
        
        // 類型驗證
        if (isset($rule['type'])) {
            switch ($rule['type']) {
                case 'email':
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $errors[] = $rule['message'] ?? "{$field} 格式不正確";
                    }
                    break;
                case 'array':
                    if (!is_array($value)) {
                        $errors[] = $rule['message'] ?? "{$field} 必須是數組";
                    } else {
                        // 數組項目數量限制
                        if (isset($rule['max_items']) && count($value) > $rule['max_items']) {
                            $errors[] = "{$field} 最多只能包含 {$rule['max_items']} 個項目";
                        }
                        
                        // 數組項目格式驗證
                        if (isset($rule['item_pattern'])) {
                            foreach ($value as $item) {
                                if (!preg_match($rule['item_pattern'], $item)) {
                                    $errors[] = $rule['message'] ?? "{$field} 中的項目格式不正確";
                                    break;
                                }
                            }
                        }
                    }
                    break;
            }
        }
        
        // 長度驗證
        if (isset($rule['min_length']) && strlen($value) < $rule['min_length']) {
            $errors[] = $rule['message'] ?? "{$field} 長度不能少於 {$rule['min_length']} 個字符";
        }
        
        if (isset($rule['max_length']) && strlen($value) > $rule['max_length']) {
            $errors[] = $rule['message'] ?? "{$field} 長度不能超過 {$rule['max_length']} 個字符";
        }
        
        // 模式驗證
        if (isset($rule['pattern']) && !preg_match($rule['pattern'], $value)) {
            $errors[] = $rule['message'] ?? "{$field} 格式不正確";
        }
        
        return $errors;
    }
    
    /**
     * 清理數據
     */
    private function sanitizeValue($value, $rule) {
        if (is_array($value)) {
            return array_map(function($item) {
                return htmlspecialchars(trim($item), ENT_QUOTES, 'UTF-8');
            }, $value);
        }
        
        return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * 驗證文件上傳
     */
    public function validateFileUpload($file, $allowedTypes = null) {
        $errors = [];
        
        if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = '文件上傳失敗';
            return ['valid' => false, 'errors' => $errors];
        }
        
        // 文件大小檢查
        if ($file['size'] > $this->securityConfig['max_file_size']) {
            $errors[] = '文件大小不能超過 ' . ($this->securityConfig['max_file_size'] / 1024 / 1024) . 'MB';
        }
        
        // 文件類型檢查
        $allowedTypes = $allowedTypes ?: $this->securityConfig['allowed_file_types'];
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($fileExtension, $allowedTypes)) {
            $errors[] = '不支持的文件類型: ' . $fileExtension;
        }
        
        // 文件內容檢查（防止文件偽裝）
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        $allowedMimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'zip' => 'application/zip',
            'rar' => 'application/x-rar-compressed'
        ];
        
        if (isset($allowedMimeTypes[$fileExtension]) && $mimeType !== $allowedMimeTypes[$fileExtension]) {
            $errors[] = '文件內容與擴展名不匹配';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'file_info' => [
                'name' => $file['name'],
                'size' => $file['size'],
                'type' => $mimeType,
                'extension' => $fileExtension
            ]
        ];
    }
    
    /**
     * 生成CSRF Token
     */
    public function generateCSRFToken() {
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        $_SESSION['csrf_token_time'] = time();
        return $token;
    }
    
    /**
     * 驗證CSRF Token
     */
    public function validateCSRFToken($token) {
        if (!isset($_SESSION['csrf_token']) || !isset($_SESSION['csrf_token_time'])) {
            return false;
        }
        
        // 檢查token是否過期
        if (time() - $_SESSION['csrf_token_time'] > $this->securityConfig['csrf_token_expiry']) {
            unset($_SESSION['csrf_token'], $_SESSION['csrf_token_time']);
            return false;
        }
        
        return hash_equals($_SESSION['csrf_token'], $token);
    }
    
    /**
     * 檢查速率限制
     */
    public function checkRateLimit($identifier, $requests = null, $window = null) {
        $requests = $requests ?: $this->securityConfig['rate_limit_requests'];
        $window = $window ?: $this->securityConfig['rate_limit_window'];
        
        $key = 'rate_limit_' . md5($identifier);
        $now = time();
        
        if (!isset($_SESSION[$key])) {
            $_SESSION[$key] = [];
        }
        
        // 清理過期的請求記錄
        $_SESSION[$key] = array_filter($_SESSION[$key], function($timestamp) use ($now, $window) {
            return ($now - $timestamp) < $window;
        });
        
        // 檢查是否超過限制
        if (count($_SESSION[$key]) >= $requests) {
            return false;
        }
        
        // 記錄當前請求
        $_SESSION[$key][] = $now;
        
        return true;
    }
    
    /**
     * 檢查登入嘗試限制
     */
    public function checkLoginAttempts($identifier) {
        $key = 'login_attempts_' . md5($identifier);
        $now = time();
        
        if (!isset($_SESSION[$key])) {
            $_SESSION[$key] = ['count' => 0, 'last_attempt' => 0];
        }
        
        $attempts = $_SESSION[$key];
        
        // 檢查是否在鎖定期內
        if ($attempts['count'] >= $this->securityConfig['max_login_attempts']) {
            $lockoutTime = $attempts['last_attempt'] + $this->securityConfig['lockout_duration'];
            if ($now < $lockoutTime) {
                return [
                    'allowed' => false,
                    'lockout_remaining' => $lockoutTime - $now,
                    'message' => '帳號已被鎖定，請稍後再試'
                ];
            } else {
                // 鎖定期已過，重置計數
                $_SESSION[$key] = ['count' => 0, 'last_attempt' => 0];
            }
        }
        
        return ['allowed' => true];
    }
    
    /**
     * 記錄登入失敗
     */
    public function recordLoginFailure($identifier) {
        $key = 'login_attempts_' . md5($identifier);
        
        if (!isset($_SESSION[$key])) {
            $_SESSION[$key] = ['count' => 0, 'last_attempt' => 0];
        }
        
        $_SESSION[$key]['count']++;
        $_SESSION[$key]['last_attempt'] = time();
    }
    
    /**
     * 清除登入失敗記錄
     */
    public function clearLoginFailures($identifier) {
        $key = 'login_attempts_' . md5($identifier);
        unset($_SESSION[$key]);
    }
    
    /**
     * 檢查SQL注入
     */
    public function detectSQLInjection($input) {
        $patterns = [
            '/(\bunion\b.*\bselect\b)/i',
            '/(\bselect\b.*\bfrom\b)/i',
            '/(\binsert\b.*\binto\b)/i',
            '/(\bupdate\b.*\bset\b)/i',
            '/(\bdelete\b.*\bfrom\b)/i',
            '/(\bdrop\b.*\btable\b)/i',
            '/(\bexec\b|\bexecute\b)/i',
            '/(\bscript\b)/i',
            '/(\bjavascript\b)/i',
            '/(\bonload\b)/i'
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 檢查XSS攻擊
     */
    public function detectXSS($input) {
        $patterns = [
            '/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i',
            '/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/i',
            '/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/i',
            '/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/i',
            '/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/i',
            '/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/i',
            '/javascript:/i',
            '/vbscript:/i',
            '/onload\s*=/i',
            '/onerror\s*=/i',
            '/onclick\s*=/i'
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 安全日誌記錄
     */
    public function logSecurityEvent($event, $details = []) {
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'event' => $event,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'url' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'details' => $details
        ];
        
        error_log('[SECURITY] ' . json_encode($logEntry, JSON_UNESCAPED_UNICODE));
    }
}

// 全域安全驗證器實例
$securityValidator = new SecurityValidator();
$GLOBALS['securityValidator'] = $securityValidator;
?>
