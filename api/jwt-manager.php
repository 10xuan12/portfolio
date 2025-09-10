<?php
/**
 * JWT Token 處理類
 * 提供完整的JWT token生成、驗證和管理功能
 */

class JWTManager {
    private $secretKey;
    private $algorithm = 'HS256';
    private $expirationTime = 3600; // 1小時
    
    public function __construct($secretKey = null) {
        $this->secretKey = $secretKey ?: $this->generateSecretKey();
    }
    
    /**
     * 生成JWT Token
     */
    public function generateToken($payload) {
        $header = [
            'typ' => 'JWT',
            'alg' => $this->algorithm
        ];
        
        $payload['iat'] = time();
        $payload['exp'] = time() + $this->expirationTime;
        $payload['jti'] = $this->generateJTI();
        
        $headerEncoded = $this->base64UrlEncode(json_encode($header));
        $payloadEncoded = $this->base64UrlEncode(json_encode($payload));
        
        $signature = $this->generateSignature($headerEncoded, $payloadEncoded);
        
        return $headerEncoded . '.' . $payloadEncoded . '.' . $signature;
    }
    
    /**
     * 驗證JWT Token
     */
    public function validateToken($token) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return ['valid' => false, 'error' => 'Invalid token format'];
        }
        
        list($headerEncoded, $payloadEncoded, $signature) = $parts;
        
        // 驗證簽名
        $expectedSignature = $this->generateSignature($headerEncoded, $payloadEncoded);
        if (!hash_equals($signature, $expectedSignature)) {
            return ['valid' => false, 'error' => 'Invalid signature'];
        }
        
        // 解析payload
        $payload = json_decode($this->base64UrlDecode($payloadEncoded), true);
        
        if (!$payload) {
            return ['valid' => false, 'error' => 'Invalid payload'];
        }
        
        // 檢查過期時間
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return ['valid' => false, 'error' => 'Token expired'];
        }
        
        return ['valid' => true, 'payload' => $payload];
    }
    
    /**
     * 刷新Token
     */
    public function refreshToken($token) {
        $validation = $this->validateToken($token);
        
        if (!$validation['valid']) {
            return ['success' => false, 'error' => $validation['error']];
        }
        
        $payload = $validation['payload'];
        
        // 移除時間相關字段，讓generateToken重新生成
        unset($payload['iat'], $payload['exp'], $payload['jti']);
        
        $newToken = $this->generateToken($payload);
        
        return ['success' => true, 'token' => $newToken];
    }
    
    /**
     * 生成簽名
     */
    private function generateSignature($headerEncoded, $payloadEncoded) {
        $data = $headerEncoded . '.' . $payloadEncoded;
        return $this->base64UrlEncode(hash_hmac('sha256', $data, $this->secretKey, true));
    }
    
    /**
     * Base64 URL編碼
     */
    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64 URL解碼
     */
    private function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
    
    /**
     * 生成JTI (JWT ID)
     */
    private function generateJTI() {
        return bin2hex(random_bytes(16));
    }
    
    /**
     * 生成密鑰
     */
    private function generateSecretKey() {
        return bin2hex(random_bytes(32));
    }
    
    /**
     * 設置過期時間
     */
    public function setExpirationTime($seconds) {
        $this->expirationTime = $seconds;
    }
    
    /**
     * 獲取密鑰
     */
    public function getSecretKey() {
        return $this->secretKey;
    }
}

// 全域JWT管理器實例
$jwtManager = new JWTManager();
?>
