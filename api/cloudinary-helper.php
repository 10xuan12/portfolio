<?php
/**
 * Cloudinary 圖片上傳助手
 * 支援本地開發和 Railway 雲端部署
 */

// 檢查是否啟用 Cloudinary
function isCloudinaryEnabled() {
    // 檢查是否有完整的 CLOUDINARY_URL
    if (!empty(getenv('CLOUDINARY_URL')) || !empty($_ENV['CLOUDINARY_URL'])) {
        return true;
    }
    
    // 或檢查是否有分開的三個環境變數
    $hasCloudName = !empty(getenv('CLOUDINARY_CLOUD_NAME')) || !empty($_ENV['CLOUDINARY_CLOUD_NAME']);
    $hasApiKey = !empty(getenv('CLOUDINARY_API_KEY')) || !empty($_ENV['CLOUDINARY_API_KEY']);
    $hasApiSecret = !empty(getenv('CLOUDINARY_API_SECRET')) || !empty($_ENV['CLOUDINARY_API_SECRET']);
    
    if ($hasCloudName && $hasApiKey && $hasApiSecret) {
        return true;
    }
    
    // 或檢查是否有定義 CLOUDINARY_ENABLED 常數
    return (defined('CLOUDINARY_ENABLED') && CLOUDINARY_ENABLED);
}

// 上傳圖片到 Cloudinary
function uploadToCloudinary($filePath, $folder = 'portfolio') {
    if (!isCloudinaryEnabled()) {
        return null;
    }
    
    try {
        // 檢查 autoload 和 Cloudinary 類別是否存在
        $autoloadPath = __DIR__ . '/../vendor/autoload.php';
        if (!file_exists($autoloadPath)) {
            error_log('Vendor autoload 不存在，無法使用 Cloudinary');
            return null;
        }
        
        require_once $autoloadPath;
        
        // 檢查 Cloudinary 類別是否存在
        if (!class_exists('Cloudinary\Cloudinary')) {
            error_log('Cloudinary 套件未安裝');
            return null;
        }
        
        // 配置 Cloudinary（使用正確的 v2 API）
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME');
        $apiKey = getenv('CLOUDINARY_API_KEY');
        $apiSecret = getenv('CLOUDINARY_API_SECRET');
        
        if (empty($cloudName) || empty($apiKey) || empty($apiSecret)) {
            error_log('Cloudinary 環境變數未完整設定');
            return null;
        }
        
        // 創建 Cloudinary 實例
        $cloudinary = new \Cloudinary\Cloudinary([
            'cloud' => [
                'cloud_name' => $cloudName,
                'api_key' => $apiKey,
                'api_secret' => $apiSecret
            ],
            'url' => [
                'secure' => true
            ]
        ]);
        
        // 上傳圖片
        $result = $cloudinary->uploadApi()->upload($filePath, [
            'folder' => $folder,
            'resource_type' => 'image',
            'transformation' => [
                'quality' => 'auto',
                'fetch_format' => 'auto'
            ]
        ]);
        
        return $result['secure_url'] ?? null;
        
    } catch (Exception $e) {
        error_log('Cloudinary 上傳失敗: ' . $e->getMessage());
        return null;
    }
}

// 智能上傳：優先使用 Cloudinary，降級到本地儲存
function smartUploadImage($tmpFile, $userId, $prefix = 'cover', $originalFileName = '') {
    $response = [
        'success' => false,
        'path' => null,
        'storage' => 'local' // 'cloudinary' or 'local'
    ];
    
    // 嘗試上傳到 Cloudinary
    if (isCloudinaryEnabled()) {
        $cloudinaryUrl = uploadToCloudinary($tmpFile, 'portfolios');
        if ($cloudinaryUrl) {
            $response['success'] = true;
            $response['path'] = $cloudinaryUrl;
            $response['storage'] = 'cloudinary';
            return $response;
        }
        
        error_log('Cloudinary 上傳失敗，降級到本地儲存');
    }
    
    // 降級：儲存到本地
    // 優先從原始檔案名稱獲取副檔名，否則從臨時檔案路徑獲取
    if ($originalFileName) {
        $extension = pathinfo($originalFileName, PATHINFO_EXTENSION);
    } else {
        $extension = pathinfo($tmpFile, PATHINFO_EXTENSION);
    }
    
    // 如果還是沒有副檔名，嘗試從 MIME 類型推斷
    if (empty($extension)) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $tmpFile);
        finfo_close($finfo);
        
        $mimeToExt = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/svg+xml' => 'svg'
        ];
        
        $extension = $mimeToExt[$mimeType] ?? 'jpg'; // 預設為 jpg
    }
    
    $fileName = $prefix . '_' . $userId . '_' . time() . '.' . $extension;
    $uploadDir = __DIR__ . '/../uploads/portfolios/';
    
    // 確保目錄存在
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $destPath = $uploadDir . $fileName;
    
    if (copy($tmpFile, $destPath)) {
        $response['success'] = true;
        $response['path'] = 'uploads/portfolios/' . $fileName;
        $response['storage'] = 'local';
    }
    
    return $response;
}
?>

