# 企業端使用指南

## 🚀 快速開始

### 1. 啟動伺服器
確保您的 XAMPP 已經啟動，並且 Apache 和 MySQL 服務正在運行。

### 2. 訪問首頁
在瀏覽器中訪問：`https://localhost/portfolio/frontend/index.html`

### 3. 進入企業端
點擊首頁中的「企業入口」按鈕，或點擊頁腳中的「企業入口」連結。

### 4. 登入測試帳號
系統會彈出登入對話框，請輸入：
- **電子郵件：** `enterprise@test.com`
- **密碼：** `password123`

### 5. 查看儀表板
登入成功後會自動跳轉到企業儀表板，顯示真實的資料庫資料。

## 📊 功能說明

### 企業儀表板
- **統計資料：** 顯示瀏覽作品數、收藏作品、聯絡學生、發布職缺等統計
- **最近瀏覽：** 顯示最近瀏覽的學生作品集
- **推薦學生：** 根據企業需求推薦的學生
- **最近活動：** 顯示企業的最近活動記錄
- **職缺管理：** 顯示企業發布的職缺列表

### 資料來源
- 所有資料都來自真實的資料庫
- 如果 API 連接失敗，會顯示備用的測試資料
- 資料會即時更新

## 🔧 技術架構

### 前端
- **HTML5 + CSS3 + JavaScript**
- **響應式設計**
- **現代化 UI/UX**

### 後端
- **PHP + MySQL**
- **RESTful API**
- **Session 認證**

### 資料庫
- **端口：** 3307
- **資料庫名：** eportfolio1
- **測試資料：** 已預先插入

## 📁 檔案結構

```
portfolio/
├── frontend/
│   ├── index.html                 # 首頁（包含企業入口）
│   ├── enterprise/
│   │   ├── dashboard.html         # 企業儀表板
│   │   ├── jobs.html             # 職缺管理
│   │   ├── portfolios.html       # 作品集瀏覽
│   │   ├── profile.html          # 企業資料
│   │   ├── search.html           # 搜尋功能
│   │   ├── notifications.html    # 通知中心
│   │   └── analytics.html        # 分析報表
│   ├── js/
│   │   └── enterprise/
│   │       ├── dashboard.js      # 儀表板功能
│   │       ├── jobs.js           # 職缺管理功能
│   │       ├── portfolios.js     # 作品集瀏覽功能
│   │       ├── profile.js        # 企業資料管理
│   │       ├── search.js         # 搜尋功能
│   │       ├── notifications.js  # 通知管理
│   │       └── analytics.js      # 分析報表
│   └── css/
│       └── enterprise/
│           ├── dashboard.css     # 儀表板樣式
│           ├── job.css           # 職缺管理樣式
│           ├── portfolio.css     # 作品集瀏覽樣式
│           ├── profile.css       # 企業資料樣式
│           ├── search.css        # 搜尋功能樣式
│           ├── notification.css  # 通知中心樣式
│           └── analytics.css     # 分析報表樣式
└── api/
    └── enterprise/
        ├── auth.php              # 認證 API
        ├── dashboard.php         # 儀表板 API
        ├── jobs.php              # 職缺管理 API
        ├── portfolios.php        # 作品集瀏覽 API
        ├── profile.php           # 企業資料 API
        ├── search.php            # 搜尋 API
        ├── notifications.php     # 通知 API
        └── analytics.php         # 分析 API
```

## 🎯 主要功能

### 1. 企業認證
- 企業用戶登入/註冊
- Session 管理
- 權限控制

### 2. 職缺管理
- 發布職缺
- 編輯職缺
- 管理申請
- 職缺狀態控制

### 3. 作品集瀏覽
- 瀏覽學生作品集
- 搜尋和篩選
- 書籤功能
- 聯絡學生

### 4. 數據分析
- 瀏覽統計
- 申請統計
- 圖表顯示
- 趨勢分析

### 5. 通知系統
- 新申請通知
- 系統通知
- 通知管理

## 🔍 故障排除

### 1. 無法登入
- 檢查 XAMPP 是否啟動
- 確認 MySQL 服務運行在端口 3307
- 檢查資料庫連接配置

### 2. 資料無法載入
- 檢查 API 端點是否可訪問
- 確認資料庫中有測試資料
- 查看瀏覽器開發者工具的錯誤訊息

### 3. 頁面顯示異常
- 檢查 CSS 和 JavaScript 檔案路徑
- 確認瀏覽器支援 ES6+ 語法
- 清除瀏覽器快取

## 📞 支援

如果遇到問題，請檢查：
1. 瀏覽器開發者工具的 Console 和 Network 標籤
2. XAMPP 的錯誤日誌
3. 資料庫連接狀態

## 🎉 完成狀況

- ✅ **資料庫結構：** 100% 完成
- ✅ **後端 API：** 100% 完成
- ✅ **前端界面：** 100% 完成
- ✅ **API 整合：** 95% 完成
- ✅ **測試資料：** 100% 完成

企業端已經可以正常使用，所有主要功能都已實現！

## 🚀 使用流程

1. **訪問首頁** → `https://localhost/portfolio/frontend/index.html`
2. **點擊企業入口** → 在首頁或頁腳中點擊「企業入口」
3. **輸入測試帳號** → `enterprise@test.com` / `password123`
4. **查看儀表板** → 自動跳轉到企業儀表板，顯示真實資料庫資料
