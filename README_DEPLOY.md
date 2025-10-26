# 🚀 快速部署到 Railway.app

這份指南將幫助您在 **5-10 分鐘內**將作品集系統部署到公開網址，並實現程式碼推送自動更新！

---

## 📋 前置準備

- ✅ GitHub 帳號
- ✅ 專案已推送到 GitHub
- ✅ Railway.app 帳號（可用 GitHub 登入）

---

## 🎯 部署步驟（超簡單！）

### 步驟 1️⃣：推送程式碼到 GitHub

```bash
# 如果還沒有 git repository，先初始化
git init
git add .
git commit -m "初始提交 - 準備部署"

# 連接到 GitHub（請先在 GitHub 建立 repository）
git remote add origin https://github.com/你的使用者名稱/portfolio.git
git branch -M main
git push -u origin main
```

### 步驟 2️⃣：註冊 Railway

1. 前往 👉 [Railway.app](https://railway.app/)
2. 點擊 **Login** → 選擇 **Login with GitHub**
3. 授權 Railway 存取您的 GitHub

### 步驟 3️⃣：建立新專案

1. 在 Railway Dashboard 點擊 **New Project**
2. 選擇 **Deploy from GitHub repo**
3. 選擇您的 `portfolio` repository
4. 點擊 **Deploy Now**

### 步驟 4️⃣：新增 MySQL 資料庫

1. 在同一個專案中，點擊 **+ New**
2. 選擇 **Database** → **Add MySQL**
3. 等待 MySQL 部署完成（約 30 秒）

### 步驟 5️⃣：設定環境變數

1. **點擊 PHP 應用服務**（不是 MySQL）
2. 點擊 **Variables** 標籤
3. 點擊 **+ New Variable**，逐一新增以下變數：

#### 方法 A：使用 Railway 提供的變數（推薦）

點擊 **Add Reference**，從 MySQL 服務引用：

| 變數名稱 | 引用來源 |
|---------|---------|
| `MYSQL_HOST` | MySQL → MYSQL_HOST |
| `MYSQL_USER` | MySQL → MYSQL_USER |
| `MYSQL_PASSWORD` | MySQL → MYSQL_PASSWORD |
| `MYSQL_DATABASE` | MySQL → MYSQL_DATABASE |
| `MYSQL_PORT` | MySQL → MYSQL_PORT |

#### 方法 B：手動複製（替代方案）

先進入 **MySQL 服務** → **Variables** 標籤，複製以下值：

```
DB_HOST=[從 MySQL 複製 MYSQL_HOST]
DB_USERNAME=[從 MySQL 複製 MYSQL_USER]
DB_PASSWORD=[從 MySQL 複製 MYSQL_PASSWORD]
DB_NAME=[從 MySQL 複製 MYSQL_DATABASE]
DB_PORT=[從 MySQL 複製 MYSQL_PORT]
```

#### 其他必要變數（手動輸入）

```
JWT_SECRET=請輸入至少32字元的隨機密鑰例如abc123xyz789超級安全密鑰
APP_ENV=production
APP_DEBUG=false
TIMEZONE=Asia/Taipei
```

4. 點擊 **Deploy** 重新部署（確保變數生效）

### 步驟 6️⃣：匯入資料庫

#### 選項 A：使用 Railway CLI（推薦）

1. 安裝 Railway CLI：
   ```bash
   npm install -g @railway/cli
   ```

2. 登入並連接：
   ```bash
   railway login
   railway link
   ```

3. 匯入資料庫：
   ```bash
   railway run mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < database/eportfolio2.sql
   ```

#### 選項 B：使用本地 MySQL 客戶端

1. 從 Railway MySQL 服務取得連線資訊
2. 執行：
   ```bash
   mysql -h [MYSQL_HOST] -P [MYSQL_PORT] -u [MYSQL_USER] -p[MYSQL_PASSWORD] [MYSQL_DATABASE] < database/eportfolio2.sql
   ```

#### 選項 C：使用 phpMyAdmin 或其他 GUI 工具

1. 使用 Railway 提供的連線資訊連接
2. 匯入 `database/eportfolio2.sql` 檔案

### 步驟 7️⃣：取得公開網址

1. 回到 **PHP 應用服務**
2. 點擊 **Settings** 標籤
3. 找到 **Networking** 區塊
4. 點擊 **Generate Domain**
5. 🎉 **完成！** 您會得到類似：`https://portfolio-production-xxxx.up.railway.app`

---

## 🔄 自動更新功能

**已經自動啟用！** 每次您推送程式碼到 GitHub，Railway 會自動部署：

```bash
# 修改程式碼後
git add .
git commit -m "更新功能"
git push origin main

# ⏱️ 等待 1-3 分鐘，Railway 自動部署完成
```

### 查看部署狀態

1. 進入 Railway Dashboard
2. 點擊 PHP 應用服務
3. 查看 **Deployments** 標籤
4. 點擊最新部署查看 **日誌 (Logs)**

---

## 📊 免費額度說明

Railway 免費方案：
- 💰 每月 **$5 免費額度**
- ⏰ 約 **500 小時運行時間**
- 💾 **1GB RAM**
- 📦 **1GB 磁碟空間**

**足夠個人作品集使用！**

---

## ⚠️ 重要注意事項

### 1. 使用者上傳檔案問題

**問題**：Railway 重新部署時會清空暫存檔案

**解決方案**：

#### 選項 A：使用 Railway Volumes（推薦）

1. 在 PHP 應用服務中，點擊 **Settings**
2. 找到 **Volumes** 區塊
3. 點擊 **+ New Volume**
4. 掛載路徑：`/app/uploads`
5. 儲存並重新部署

#### 選項 B：使用雲端儲存

- **Cloudinary**（圖片）：免費 25GB
- **AWS S3**：需修改上傳邏輯
- **Imgur API**：免費圖片託管

### 2. 資料庫備份

**重要！** 定期備份您的資料庫：

```bash
# 使用 Railway CLI
railway run mysqldump -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > backup_$(date +%Y%m%d).sql
```

### 3. 環境變數安全

- ❌ **不要**將密碼、密鑰寫在程式碼中
- ✅ **一律**使用 Railway 的 Variables 功能
- ✅ 確保 `.gitignore` 已包含 `.env` 檔案

---

## 🔧 疑難排解

### 問題：部署失敗

**檢查項目：**
1. 查看 **Deployments** → **Build Logs**
2. 確認 `composer.json` 存在
3. 確認 `nixpacks.toml` 配置正確

### 問題：資料庫連接失敗

**解決方法：**
1. 確認環境變數拼寫正確（區分大小寫）
2. 檢查 MySQL 服務是否運行
3. 確認兩個服務在同一個 Project
4. 檢查 `includes/db_connect.php` 是否正確讀取環境變數

### 問題：404 Not Found

**解決方法：**
1. 確認 `index.php` 存在於專案根目錄
2. 檢查路由設定
3. 查看 Railway 的 **Runtime Logs**

### 問題：500 Internal Server Error

**解決方法：**
1. 查看 **Runtime Logs** 找出錯誤訊息
2. 檢查 PHP 版本兼容性
3. 確認所有 composer 依賴已安裝

---

## 📚 其他部署選項

如果 Railway 不適合您，還有其他選擇：

### Render.com
- 類似 Railway
- 免費額度較少但更穩定
- 部署步驟相同

### Heroku
- 老牌 PaaS 服務
- 需要信用卡驗證
- 有免費額度

### Vercel + PlanetScale
- Vercel 部署前端
- PlanetScale 託管 MySQL
- 需要改寫 API 為 Serverless Functions

---

## 🎉 恭喜完成！

您的作品集系統現在：
- ✅ 已公開上線
- ✅ 有專屬網址
- ✅ 支援 HTTPS（自動）
- ✅ 程式碼推送自動更新
- ✅ 完全免費

**分享您的作品集網址吧！** 🚀

---

## 📞 需要幫助？

- Railway 官方文件：https://docs.railway.app/
- Railway Discord 社群：https://discord.gg/railway
- GitHub Issues：在您的 repository 建立 issue

---

**最後更新：2025-10-26**

