# 🎯 Portfolio+ API Swagger 測試指南

## 📋 概述

這個資料夾包含了使用 Swagger 測試 Portfolio+ 後端 API 的完整工具集。Swagger 是一個強大的 API 文檔和測試工具，可以幫助您：

- 📖 查看完整的 API 文檔
- 🧪 互動式測試 API 端點
- 📊 監控 API 狀態
- 🔍 調試請求和響應

## 🚀 快速開始

### 1. 啟動 XAMPP
確保您的 XAMPP 服務正在運行：
- Apache 服務
- MySQL 服務

### 2. 訪問 Swagger UI
在瀏覽器中打開：
```
http://localhost/portfolio/swagger/
```

### 3. 開始測試
- 使用 Swagger UI 介面測試各個 API 端點
- 查看請求/響應範例
- 使用內建的測試帳號

## 📁 檔案說明

### `swagger.json`
- **用途**: Swagger API 規範文件
- **內容**: 定義所有 API 端點、參數、響應格式
- **格式**: OpenAPI 3.0.0 標準

### `index.html`
- **用途**: Swagger UI 測試介面
- **功能**: 
  - 互動式 API 測試
  - API 狀態監控
  - 測試帳號管理
  - 響應美化顯示

### `test-api.php`
- **用途**: 自動化 API 測試腳本
- **功能**:
  - 批量測試 API 端點
  - 命令行和網頁兩種模式
  - 詳細的測試報告
  - 錯誤診斷

## 🧪 測試帳號

### 學生帳號
- **電子郵件**: `student@example.com`
- **密碼**: `password123`

### 管理員帳號
- **電子郵件**: `admin@portfolio.com`
- **密碼**: `admin123`

## 🔧 使用方法

### 方法 1: Swagger UI（推薦）
1. 打開 `http://localhost/portfolio/swagger/`
2. 選擇要測試的 API 端點
3. 點擊 "Try it out" 按鈕
4. 填寫必要參數
5. 點擊 "Execute" 執行測試

### 方法 2: 自動化測試腳本
1. 命令行模式：
   ```bash
   cd /path/to/portfolio/swagger
   php test-api.php
   ```

2. 網頁模式：
   - 打開 `http://localhost/portfolio/swagger/test-api.php`
   - 點擊 "開始測試 API" 按鈕

### 方法 3: 直接 API 調用
使用 Postman、curl 或其他 HTTP 客戶端：
```bash
# 學生登入範例
curl -X POST http://localhost/portfolio/api/student/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

## 📊 API 端點分類

### 🎓 學生認證
- `POST /api/student/auth/login` - 學生登入
- `POST /api/student/auth/register` - 學生註冊
- `POST /api/student/auth/logout` - 學生登出
- `GET /api/student/auth/check` - 檢查登入狀態

### 👤 學生檔案
- `GET /api/student/profile` - 獲取學生檔案
- `POST /api/student/profile` - 更新學生檔案
- `POST /api/student/profile/avatar` - 上傳頭像

### 🎨 學生作品集
- `GET /api/student/portfolio` - 獲取作品集列表
- `POST /api/student/portfolio` - 創建作品集
- `PUT /api/student/portfolio/{id}` - 更新作品集
- `DELETE /api/student/portfolio/{id}` - 刪除作品集

### 📄 學生履歷
- `GET /api/student/resume` - 獲取履歷列表
- `POST /api/student/resume` - 創建履歷
- `GET /api/student/resume/export` - 匯出履歷

### 🔍 通用功能
- `GET /api/search` - 搜尋功能
- `GET /api/categories` - 獲取分類

## ⚠️ 注意事項

### 1. 資料庫連線
- 確保資料庫 `eportfolio1` 已創建
- 檢查資料庫連線設定
- 確認使用者權限

### 2. 檔案權限
- 確保 `uploads/` 資料夾可寫入
- 檢查 PHP 檔案上傳設定

### 3. CORS 設定
- 如果從不同域名測試，可能需要調整 CORS 設定
- 本地開發通常不需要額外設定

## 🐛 故障排除

### 常見問題

#### 1. 資料庫連線失敗
**症狀**: 500 錯誤或資料庫錯誤訊息
**解決方案**:
- 檢查 XAMPP MySQL 服務狀態
- 確認資料庫名稱 `eportfolio1`
- 檢查使用者權限

#### 2. API 端點 404 錯誤
**症狀**: 所有 API 都返回 404
**解決方案**:
- 檢查 `.htaccess` 檔案
- 確認 Apache mod_rewrite 已啟用
- 檢查檔案路徑是否正確

#### 3. 檔案上傳失敗
**症狀**: 檔案上傳相關 API 錯誤
**解決方案**:
- 檢查 `uploads/` 資料夾權限
- 確認 PHP 上傳限制設定
- 檢查檔案大小限制

### 調試技巧

1. **啟用錯誤報告**:
   ```php
   ini_set('display_errors', 1);
   error_reporting(E_ALL);
   ```

2. **檢查 PHP 錯誤日誌**:
   - XAMPP: `xampp/php/logs/php_error_log`
   - 系統: `/var/log/apache2/error.log`

3. **使用瀏覽器開發者工具**:
   - 查看 Network 標籤
   - 檢查請求/響應標頭
   - 查看 Console 錯誤訊息

## 📚 進階功能

### 1. 自定義 Swagger 配置
編輯 `swagger.json` 來：
- 添加新的 API 端點
- 修改請求/響應範例
- 調整安全設定

### 2. 擴展測試腳本
修改 `test-api.php` 來：
- 添加新的測試案例
- 自定義測試邏輯
- 生成測試報告

### 3. 整合 CI/CD
將測試腳本整合到：
- GitHub Actions
- Jenkins
- GitLab CI

## 🤝 支援

如果您遇到問題或需要幫助：

1. 檢查本文件的故障排除部分
2. 查看 `API_README.md` 了解 API 詳細資訊
3. 檢查 PHP 錯誤日誌
4. 使用 Swagger UI 的互動式測試功能

## 📝 更新日誌

- **v1.0.0** - 初始版本，包含基本的 Swagger 配置和測試工具
- 支援所有學生相關 API 端點
- 包含自動化測試腳本
- 提供完整的 API 文檔

---

🎉 **祝您測試愉快！** 如果發現任何問題或需要改進，請隨時提出建議。
