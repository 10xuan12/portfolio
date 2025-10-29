<?php
/**
 * Cloudinary 圖片上傳助手
 * 支援本地開發和 Railway 雲端部署
 */

// 檢查是否啟用 Cloudinary
function isCloudinaryEnabled() {
    // 如果環境變數中有 CLOUDINARY_URL，則啟用
    return !empty(getenv('CLOUDINARY_URL')) || 
           !empty($_ENV['CLOUDINARY_URL']) || 
           (defined('CLOUDINARY_ENABLED') && CLOUDINARY_ENABLED);
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
        
        // 配置 Cloudinary
        \Cloudinary\Cloudinary::config([
            'cloud' => [
                'cloud_name' => getenv('CLOUDINARY_CLOUD_NAME'),
                'api_key' => getenv('CLOUDINARY_API_KEY'),
                'api_secret' => getenv('CLOUDINARY_API_SECRET'),
            ],
            'url' => [
                'secure' => true
            ]
        ]);
        
        // 上傳圖片
        $result = \Cloudinary\Uploader::upload($filePath, [
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
function smartUploadImage($tmpFile, $userId, $prefix = 'cover') {
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
    $extension = pathinfo($tmpFile, PATHINFO_EXTENSION);
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

