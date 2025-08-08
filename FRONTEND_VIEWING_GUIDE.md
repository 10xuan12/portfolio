# Portfolio+ 前端介面查看指南

## 🚀 快速啟動

### 方法一：使用啟動腳本 (推薦)

#### Windows 用戶
1. 雙擊 `start-server.bat` 檔案
2. 選擇伺服器類型 (推薦選擇 1 - Python)
3. 等待伺服器啟動
4. 在瀏覽器中開啟 `http://localhost:8000`

#### Mac/Linux 用戶
1. 在終端機中執行：
   ```bash
   chmod +x start-server.sh
   ./start-server.sh
   ```
2. 選擇伺服器類型 (推薦選擇 1 - Python)
3. 等待伺服器啟動
4. 在瀏覽器中開啟 `http://localhost:8000`

### 方法二：手動啟動

#### 使用 Python (推薦)
```bash
cd frontend
python -m http.server 8000
```

#### 使用 Node.js
```bash
cd frontend
npx http-server -p 8000 --cors
```

#### 使用 PHP
```bash
cd frontend
php -S localhost:8000
```

## 📁 可查看的頁面

### 🏠 主要頁面
- **首頁**: `http://localhost:8000/index.html`
- **登入頁面**: `http://localhost:8000/login.html`
- **註冊頁面**: `http://localhost:8000/register.html`

### 👨‍🎓 學生功能
- **學生儀表板**: `http://localhost:8000/student/dashboard.html`
- **作品集管理**: `http://localhost:8000/student/portfolio.html`
- **作品詳情**: `http://localhost:8000/student/portfolio-detail.html`
- **上傳作品**: `http://localhost:8000/student/upload.html`
- **個人資料**: `http://localhost:8000/student/profile.html`
- **履歷生成**: `http://localhost:8000/student/resume.html`
- **搜尋功能**: `http://localhost:8000/student/search.html`
- **通知中心**: `http://localhost:8000/student/notifications.html`
- **設定頁面**: `http://localhost:8000/student/settings.html`

### 🏢 企業功能
- **企業儀表板**: `http://localhost:8000/enterprise/dashboard.html`
- **作品瀏覽**: `http://localhost:8000/enterprise/portfolios.html`
- **職缺管理**: `http://localhost:8000/enterprise/jobs.html`
- **人才搜尋**: `http://localhost:8000/enterprise/search.html`
- **企業資料**: `http://localhost:8000/enterprise/profile.html`
- **通知中心**: `http://localhost:8000/enterprise/notifications.html`
- **數據分析**: `http://localhost:8000/enterprise/analytics.html`

### 👨‍💼 管理員功能
- **管理員儀表板**: `http://localhost:8000/admin/dashboard.html`
- **使用者管理**: `http://localhost:8000/admin/users.html`
- **內容審核**: `http://localhost:8000/admin/content.html`
- **數據分析**: `http://localhost:8000/admin/analytics.html`
- **系統設定**: `http://localhost:8000/admin/settings.html`
- **報表功能**: `http://localhost:8000/admin/reports.html`

## 🎯 測試帳號

### 學生帳號
- **電子郵件**: student@example.com
- **密碼**: password123

### 企業帳號
- **電子郵件**: enterprise@example.com
- **密碼**: password123

### 管理員帳號
- **電子郵件**: admin@example.com
- **密碼**: password123

## 🔧 功能特色

### ✅ 已完成功能
- [x] 完整的響應式設計
- [x] 三種用戶角色的完整介面
- [x] 作品上傳和管理功能
- [x] 搜尋和篩選功能
- [x] 通知系統
- [x] 數據分析和統計
- [x] 個人資料管理
- [x] 設定頁面

### 🚧 待完成功能
- [ ] 後端 API 整合
- [ ] 真實資料庫連接
- [ ] 檔案上傳功能
- [ ] 即時通知系統
- [ ] 用戶認證系統

## 🎨 設計特色

### 響應式設計
- 支援桌面、平板、手機
- 自適應佈局
- 觸控友善介面

### 現代化 UI
- 使用 CSS 變數系統
- 漸層和陰影效果
- 流暢的動畫過渡
- Font Awesome 圖標

### 用戶體驗
- 直觀的導航
- 清晰的視覺層次
- 一致的設計語言
- 無障礙功能支援

## 🔍 除錯和開發

### 開發者工具
1. 開啟瀏覽器開發者工具 (F12)
2. 查看 Console 標籤的錯誤訊息
3. 檢查 Network 標籤的網路請求
4. 使用 Elements 標籤檢查 HTML 結構

### 常見問題
- **頁面無法載入**: 檢查伺服器是否正常啟動
- **樣式問題**: 檢查 CSS 檔案路徑
- **JavaScript 錯誤**: 查看瀏覽器 Console
- **圖片無法顯示**: 檢查圖片檔案路徑

## 📞 支援

如果遇到問題，請檢查：
1. 伺服器是否正常啟動
2. 瀏覽器是否支援現代化功能
3. 網路連線是否正常
4. 檔案路徑是否正確

## 🎯 下一步

1. **測試所有頁面功能**
2. **檢查響應式設計**
3. **驗證用戶體驗**
4. **準備後端整合**
5. **部署到生產環境**

---

**Portfolio+** - 讓作品說話，讓才華發光 ✨
