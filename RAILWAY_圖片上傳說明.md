# Railway 部署 - 圖片上傳處理說明

## 📋 概述

您的系統已經實現了**智能圖片上傳機制**，可以自動適應本地開發和 Railway 雲端部署環境。

## 🎯 圖片上傳策略

### 本地開發環境（XAMPP）
```
上傳圖片 → 儲存到 uploads/portfolios/ 目錄 → 使用相對路徑顯示
路徑格式: uploads/portfolios/cover_用戶ID_時間戳.jpg
```

### Railway 雲端部署
```
上傳圖片 → Cloudinary 雲端儲存 → 返回完整 HTTPS URL → 直接使用 URL 顯示
路徑格式: https://res.cloudinary.com/你的雲名稱/image/upload/v123456/portfolios/xxxx.jpg
```

## ⚠️ 為什麼在 Railway 必須使用 Cloudinary？

Railway 的文件系統特性：
- ✗ **臨時性（Ephemeral）**: 每次重新部署都會清空所有上傳的檔案
- ✗ **不持久化**: 重啟服務後上傳的圖片會消失
- ✗ **無共享**: 多個容器實例之間無法共享文件系統
- ✗ **不適合**: 不適合儲存用戶上傳的圖片

Cloudinary 的優勢：
- ✓ **永久儲存**: 圖片永久保存在雲端
- ✓ **CDN 加速**: 全球 CDN 節點加速圖片載入
- ✓ **自動優化**: 自動壓縮和格式轉換
- ✓ **免費額度**: 每月 25GB 儲存空間免費

## 🔧 在 Railway 設定 Cloudinary

### 步驟 1: 註冊 Cloudinary 帳號

1. 前往 https://cloudinary.com/users/register_free
2. 註冊免費帳號
3. 登入後進入 Dashboard

### 步驟 2: 獲取 API 憑證

在 Cloudinary Dashboard 中找到：
```
Cloud Name: dxxxxxxxxx
API Key: 123456789012345
API Secret: AbCdEfGhIjKlMnOpQrStUvWxYz
```

### 步驟 3: 在 Railway 設定環境變數

進入您的 Railway 專案 → Variables → 新增以下變數：

```env
CLOUDINARY_CLOUD_NAME=你的Cloud_Name
CLOUDINARY_API_KEY=你的API_Key
CLOUDINARY_API_SECRET=你的API_Secret
```

**重要**: 設定完成後，Railway 會自動重新部署應用程式。

## 💡 系統如何自動切換？

您的系統使用 `smartUploadImage()` 函數（在 `api/cloudinary-helper.php`）：

```php
function smartUploadImage($tmpFile, $userId, $prefix = 'cover', $originalFileName = '') {
    // 1. 優先嘗試上傳到 Cloudinary（如果已配置）
    if (isCloudinaryEnabled()) {
        $cloudinaryUrl = uploadToCloudinary($tmpFile, 'portfolios');
        if ($cloudinaryUrl) {
            return [
                'success' => true,
                'path' => $cloudinaryUrl,  // 完整 HTTPS URL
                'storage' => 'cloudinary'
            ];
        }
    }
    
    // 2. 降級：儲存到本地（適用於開發環境）
    $fileName = $prefix . '_' . $userId . '_' . time() . '.' . $extension;
    $destPath = __DIR__ . '/../uploads/portfolios/' . $fileName;
    
    if (copy($tmpFile, $destPath)) {
        return [
            'success' => true,
            'path' => 'uploads/portfolios/' . $fileName,  // 相對路徑
            'storage' => 'local'
        ];
    }
}
```

## 🖼️ 前端如何正確顯示圖片？

系統已修復圖片顯示邏輯，使用 `getImageUrl()` 函數處理不同來源的圖片路徑：

```javascript
function getImageUrl(url) {
    if (!url || url === 'null') return '';
    
    // Cloudinary URL (https://...)
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;  // 直接返回完整 URL
    }
    
    // 本地路徑
    if (url.startsWith('/')) {
        return url;  // 已經是絕對路徑
    }
    
    // 相對路徑，添加 / 前綴
    return '/' + url;  // uploads/portfolios/xxx.jpg → /uploads/portfolios/xxx.jpg
}
```

已修復的文件：
- ✅ `frontend/js/student/portfolio.js` - 學生作品管理頁面
- ✅ `frontend/js/enterprise/portfolios.js` - 企業瀏覽作品頁面
- ✅ `frontend/js/enterprise/bookmarks.js` - 企業收藏頁面
- ✅ `frontend/index.html` - 首頁作品展示

## 🧪 測試圖片上傳

### 本地測試（不設定 Cloudinary）
1. 上傳作品封面圖片
2. 檢查 `uploads/portfolios/` 目錄是否有新檔案
3. 圖片路徑應為：`uploads/portfolios/cover_1_1730726400.jpg`
4. 前端顯示：`/uploads/portfolios/cover_1_1730726400.jpg`

### Railway 測試（設定 Cloudinary 後）
1. 上傳作品封面圖片
2. 後端 API 返回：
   ```json
   {
     "cover_image_path": "https://res.cloudinary.com/xxx/image/upload/v123/portfolios/xxx.jpg",
     "storage_type": "cloudinary",
     "message": "封面圖片上傳成功 (雲端儲存)"
   }
   ```
3. 圖片永久儲存在 Cloudinary
4. 前端直接使用完整 URL 顯示

## 📊 檢查上傳狀態

查看後端日誌：

```bash
# Railway 日誌
railway logs

# 尋找以下訊息：
✓ "封面圖片上傳成功 (雲端儲存)" → Cloudinary 成功
✗ "Cloudinary 上傳失敗，降級到本地儲存" → 環境變數未設定或錯誤
```

## 🔍 常見問題排查

### Q1: Railway 部署後圖片無法顯示？
**原因**: 未設定 Cloudinary 環境變數，圖片存在臨時文件系統中
**解決**: 
1. 在 Railway Variables 設定 Cloudinary 憑證
2. 重新上傳圖片（舊圖片已經遺失）

### Q2: 本地開發時圖片無法顯示？
**原因**: 圖片路徑處理錯誤
**解決**: 
- 檢查 `uploads/portfolios/` 目錄是否存在檔案
- 瀏覽器開發者工具查看圖片請求 URL
- 確認路徑格式：`/uploads/portfolios/xxx.jpg`

### Q3: Cloudinary 上傳失敗？
**檢查**:
```bash
# 確認環境變數已設定
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET

# 檢查 composer 套件
composer show cloudinary/cloudinary_php
```

### Q4: 如何遷移現有圖片到 Cloudinary？
**步驟**:
1. 手動上傳 `uploads/portfolios/` 中的圖片到 Cloudinary
2. 更新資料庫中的 `cover_image` 欄位為 Cloudinary URL
3. 或者：讓用戶重新上傳封面圖片

## 📈 Cloudinary 免費方案限制

- 儲存空間: 25 GB
- 頻寬: 25 GB/月
- 轉換次數: 25,000 次/月

**建議**: 對於個人或小型專案完全足夠。

## 🎉 總結

✅ **開發環境**: 本地儲存，路徑 `uploads/portfolios/`  
✅ **Railway 部署**: Cloudinary 雲端儲存，完整 HTTPS URL  
✅ **自動切換**: 系統根據環境自動選擇最佳方案  
✅ **已修復**: 前端圖片顯示邏輯已統一處理  

**下一步**: 在 Railway 設定 Cloudinary 環境變數，即可開始上傳圖片！

