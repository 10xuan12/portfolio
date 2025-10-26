# Railway 部署步驟指南

本文檔說明如何將 Portfolio+ 系統部署到 Railway 並解決圖片顯示問題。

## 📋 部署前檢查清單

### 1. 確認本地更改已就緒

```bash
# 檢查修改的文件
git status

# 應該包含以下關鍵文件：
# - router.php (新增)
# - railway.json (更新)
# - .gitignore (更新)
# - frontend/js/config.js (更新)
# - uploads/portfolios/*.jpg (示例圖片)
# - uploads/avatars/demo-student-avatar.jpg (示例頭像)
```

### 2. 提交所有更改

```bash
# 添加所有更改
git add .

# 提交更改
git commit -m "修正 Railway 部署配置：添加路由器、更新 API 路徑、包含示例圖片"

# 推送到 GitHub
git push origin main
```

## 🚀 Railway 部署步驟

### 步驟 1：推送代碼到 Railway

Railway 會自動檢測到新的提交並開始部署。等待部署完成。

### 步驟 2：更新 Railway 數據庫

**重要：** Railway 上的數據庫路徑需要更新！

#### 方法 A：使用 Railway CLI（推薦）

```bash
# 1. 安裝 Railway CLI（如果還沒安裝）
npm i -g @railway/cli

# 2. 登入 Railway
railway login

# 3. 連接到您的項目
railway link

# 4. 執行 SQL 更新
railway run mysql -u root -p$MYSQL_PASSWORD $MYSQL_DATABASE < database/fix_upload_paths.sql
```

#### 方法 B：使用 Railway 數據庫連接

1. 在 Railway Dashboard 中找到您的 MySQL 服務
2. 點擊 "Connect" 獲取連接資訊
3. 使用 MySQL 客戶端連接：

```bash
mysql -h [RAILWAY_HOST] -u root -p[MYSQL_PASSWORD] -P [PORT] [DATABASE_NAME] < database/fix_upload_paths.sql
```

#### 方法 C：手動執行 SQL（最簡單）

1. 在 Railway Dashboard 中打開 MySQL 服務
2. 點擊 "Query" 或使用任何 MySQL 工具連接
3. 執行以下 SQL：

```sql
-- 修正作品封面圖片路徑
UPDATE portfolios 
SET cover_image = REPLACE(cover_image, '/portfolio/uploads/', '/uploads/') 
WHERE cover_image LIKE '/portfolio/uploads/%';

-- 修正作品附件文件路徑
UPDATE portfolio_files 
SET file_path = REPLACE(file_path, '/portfolio/uploads/', '/uploads/') 
WHERE file_path LIKE '/portfolio/uploads/%';

-- 修正學生頭像路徑
UPDATE student_profiles 
SET avatar_url = REPLACE(avatar_url, '/portfolio/uploads/', '/uploads/') 
WHERE avatar_url LIKE '/portfolio/uploads/%';

-- 驗證更新
SELECT id, title, cover_image FROM portfolios LIMIT 5;
```

### 步驟 3：重啟 Railway 服務

```bash
# 使用 Railway CLI
railway restart

# 或在 Railway Dashboard 中手動重啟
```

## ✅ 驗證部署

### 1. 檢查 API 是否正常

訪問：`https://your-app.railway.app/api/student/portfolio.php?action=categories`

應該返回 JSON 數據。

### 2. 檢查圖片是否顯示

訪問：`https://your-app.railway.app/uploads/portfolios/ecommerce-analysis.jpg`

應該顯示圖片。

### 3. 檢查前端是否正常

1. 訪問：`https://your-app.railway.app`
2. 登入演示帳號：
   - Email: `selina101292@gmail.com`
   - Password: `password123`
3. 進入「我的作品」頁面
4. 確認作品封面圖片正常顯示

## 🔧 常見問題排查

### 問題 1：圖片仍然 404

**原因：** 數據庫路徑未更新

**解決：** 執行步驟 2 的 SQL 更新腳本

### 問題 2：API 404 錯誤

**原因：** router.php 未生效

**解決：** 
1. 檢查 `railway.json` 中的 `startCommand` 是否包含 `router.php`
2. 確認 `router.php` 文件已推送到 Git

### 問題 3：配置環境檢測錯誤

**原因：** `config.js` 未正確檢測 Railway 環境

**解決：** 
1. 清除瀏覽器緩存
2. 檢查 Console 日誌，應該顯示 "檢測到 Railway 環境，使用 /api"

### 問題 4：用戶上傳的圖片消失

**這是正常的！** 

- Railway 使用臨時文件系統
- 每次部署都會重置
- 解決方案：
  - 使用外部存儲（如 AWS S3、Cloudinary）
  - 或使用 Railway Volumes（持久化存儲）

## 📊 部署架構

```
本地環境 (localhost)
├── API: /portfolio/api/...
└── 圖片: /portfolio/uploads/...

Railway 生產環境
├── API: /api/...
└── 圖片: /uploads/...

自動檢測：
- config.js 會檢測 hostname
- 如果包含 "railway.app" → 使用 /api
- 如果是 localhost → 使用 /portfolio/api
```

## 📝 需要提交到 Git 的文件

### ✅ 會被提交（示例文件）
- `uploads/portfolios/*.jpg` (20 個示例作品圖片)
- `uploads/avatars/demo-student-avatar.jpg` (演示頭像)
- `uploads/enterprise/logos/*.jpg|.png` (企業 Logo)
- `uploads/**/.gitkeep` (目錄結構保留文件)

### ❌ 不會被提交（用戶文件）
- `uploads/avatars/avatar_*_*.jpg` (帶時間戳的用戶頭像)
- `uploads/resumes/resume_*_*.pdf` (帶時間戳的用戶履歷)
- `uploads/portfolios/portfolio_*_*.*` (帶時間戳的用戶作品附件)

## 🎯 部署後的結果

- ✅ 所有 API 端點正常工作
- ✅ 示例作品圖片正常顯示
- ✅ 演示帳號頭像正常顯示
- ✅ 企業 Logo 正常顯示
- ✅ 前端自動適配 Railway 環境
- ✅ 本地開發環境不受影響

## 💡 下次部署注意事項

每次推送新代碼到 Railway 時：
1. Railway 會自動部署
2. **但數據庫不會重置**（除非您刪除並重建）
3. 用戶上傳的文件會消失（需要外部存儲解決方案）
4. 示例圖片會保留（因為在 Git 中）

---

**完成以上步驟後，您的 Portfolio+ 系統應該可以在 Railway 上正常運行！** 🎉

