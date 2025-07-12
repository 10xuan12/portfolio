# Portfolio+ 安裝指南

## 系統需求

- PHP 7.4 或更高版本
- MySQL 5.7 或更高版本
- Apache/Nginx 網頁伺服器
- XAMPP/WAMP/MAMP 等整合環境

## 安裝步驟

### 1. 下載專案
將專案檔案下載到您的網頁伺服器目錄中（例如：`htdocs/portfolio/`）

### 2. 啟動伺服器
啟動您的網頁伺服器（Apache）和資料庫伺服器（MySQL）

### 3. 創建資料庫
1. 開啟 phpMyAdmin 或任何 MySQL 管理工具
2. 創建一個名為 `ephortfolio` 的資料庫
3. 匯入 `sql/init_database.sql` 檔案

### 4. 設定資料庫連線
編輯 `includes/db_connect.php` 檔案，根據您的環境修改資料庫連線設定：

```php
$connection_configs = [
    [
        'host' => 'localhost',
        'username' => 'root',
        'password' => '',
        'database' => 'ephortfolio'
    ]
];
```

### 5. 設定檔案權限
確保以下目錄具有寫入權限：
- `uploads/`
- `student/uploads/`

### 6. 測試系統
1. 開啟瀏覽器，訪問 `http://localhost/portfolio/`
2. 點擊測試頁面確認所有功能正常
3. 嘗試註冊新帳號並登入

## 預設帳號

### 管理員帳號
- 電子郵件：`admin@portfolio.com`
- 密碼：`admin123`

## 功能測試

### 學生端功能
1. 註冊學生帳號
2. 填寫個人資料
3. 上傳作品集
4. 管理作品分類

### 企業端功能
1. 註冊企業帳號
2. 填寫企業資料
3. 瀏覽學生作品
4. 發表評論

### 管理員功能
1. 使用預設管理員帳號登入
2. 管理使用者帳號
3. 監控系統狀態

## 常見問題

### Q: 資料庫連線失敗
A: 請檢查：
- MySQL 服務是否啟動
- 資料庫名稱是否正確
- 使用者權限是否足夠

### Q: 檔案上傳失敗
A: 請檢查：
- 上傳目錄權限是否正確
- PHP 上傳設定是否適當
- 檔案大小是否超過限制

### Q: 頁面顯示異常
A: 請檢查：
- CSS 檔案路徑是否正確
- 瀏覽器快取是否清除
- JavaScript 檔案是否載入

## 技術支援

如果遇到問題，請檢查：
1. 錯誤日誌檔案
2. 瀏覽器開發者工具
3. PHP 錯誤報告

## 更新日誌

### v1.0.0
- 初始版本發布
- 統一樣式系統
- 完整的 CRUD 功能
- 響應式設計 