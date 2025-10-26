# 🚀 部署指南 - Railway.app

## 步驟一：準備 GitHub Repository

1. **確保專案已推送到 GitHub**
   ```bash
   git add .
   git commit -m "準備部署到 Railway"
   git push origin main
   ```

## 步驟二：註冊 Railway.app

1. 前往 [Railway.app](https://railway.app/)
2. 點擊 **Start a New Project**
3. 使用 GitHub 帳號登入並授權

## 步驟三：部署 MySQL 資料庫

1. 在 Railway Dashboard 點擊 **+ New**
2. 選擇 **Database** → **MySQL**
3. 等待 MySQL 部署完成
4. 點擊 MySQL 服務，進入 **Variables** 標籤
5. 記下以下資訊（稍後會用到）：
   - `MYSQL_HOST`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
   - `MYSQL_PORT`

## 步驟四：匯入資料庫

1. 在 MySQL 服務中，點擊 **Data** 標籤
2. 使用提供的連線資訊，透過 MySQL 客戶端連接
3. 執行資料庫腳本：
   ```bash
   mysql -h [MYSQL_HOST] -u [MYSQL_USER] -p[MYSQL_PASSWORD] [MYSQL_DATABASE] < database/eportfolio2.sql
   ```

## 步驟五：部署 PHP 應用

1. 回到 Railway Dashboard，點擊 **+ New**
2. 選擇 **GitHub Repo**
3. 選擇您的 portfolio 專案
4. Railway 會自動偵測並開始部署

## 步驟六：設定環境變數

1. 點擊 PHP 應用服務
2. 進入 **Variables** 標籤
3. 新增以下環境變數：

   ```
   DB_HOST=[從 MySQL 服務複製 MYSQL_HOST]
   DB_USERNAME=[從 MySQL 服務複製 MYSQL_USER]
   DB_PASSWORD=[從 MySQL 服務複製 MYSQL_PASSWORD]
   DB_NAME=[從 MySQL 服務複製 MYSQL_DATABASE]
   DB_PORT=[從 MySQL 服務複製 MYSQL_PORT]
   JWT_SECRET=[輸入一個隨機字串，例如：your-super-secret-key-12345]
   APP_ENV=production
   APP_DEBUG=false
   TIMEZONE=Asia/Taipei
   ```

4. 點擊 **Add Variable** 儲存

## 步驟七：連接服務

1. 在 PHP 應用的設定中，確保已連接到 MySQL 服務
2. Railway 會自動處理內部網路連接

## 步驟八：取得公開網址

1. 在 PHP 應用服務中，點擊 **Settings**
2. 找到 **Networking** 區塊
3. 點擊 **Generate Domain**
4. 您會得到一個 `https://your-app.up.railway.app` 網址
5. 複製此網址，這就是您的公開網址！

## 🔄 自動更新設定

**已完成！** Railway 會自動監控您的 GitHub repository：

- ✅ 每次推送到 `main` 分支時自動部署
- ✅ 修改程式碼 → `git push` → 自動更新線上版本
- ✅ 可在 Railway Dashboard 查看部署日誌

### 更新流程

```bash
# 1. 修改程式碼
# 2. 提交變更
git add .
git commit -m "更新功能"

# 3. 推送到 GitHub
git push origin main

# 4. Railway 自動部署（約 1-3 分鐘）
```

## 📝 注意事項

1. **免費額度**：Railway 提供每月 $5 免費額度（約 500 小時運行時間）
2. **檔案上傳**：使用者上傳的檔案會在重新部署時消失，建議使用：
   - AWS S3
   - Cloudinary
   - Railway Volumes（持久化儲存）

3. **資料庫備份**：定期備份 MySQL 資料庫
4. **環境變數**：敏感資訊（密碼、密鑰）請務必使用環境變數，不要直接寫在程式碼中

## 🔧 疑難排解

### 部署失敗
- 檢查 Railway 的部署日誌（Deployments → 點擊最新部署 → Logs）
- 確認 `composer.json` 和 `nixpacks.toml` 配置正確

### 資料庫連接失敗
- 確認環境變數設定正確
- 檢查 MySQL 服務是否運行中
- 確認兩個服務在同一個 Project 中

### 404 錯誤
- 檢查 `index.php` 路由設定
- 確認檔案路徑正確

## 🎉 完成！

您的作品集系統現在已經公開上線！
- 公開網址：`https://your-app.up.railway.app`
- 每次 git push 都會自動更新

---

## 其他部署選項（備選）

### Render.com
類似 Railway，也支援 PHP + MySQL，免費額度較少但穩定。

### Heroku
老牌服務，需要信用卡驗證（有免費額度）。

### InfinityFree
傳統 PHP 主機，免費但功能受限，需手動上傳檔案（無自動部署）。

