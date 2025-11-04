# Cloudinary 快速設定指南

## 🚀 5 分鐘完成設定

### 1️⃣ 註冊 Cloudinary（免費）

訪問: https://cloudinary.com/users/register_free

填寫資料：
- Email
- 密碼
- Cloud Name（可自訂，例如：portfolio-2024）

### 2️⃣ 獲取 API 憑證

登入後，Dashboard 頁面會顯示：

```
┌─────────────────────────────────────┐
│ Account Details                     │
├─────────────────────────────────────┤
│ Cloud Name:    my-portfolio         │
│ API Key:       123456789012345      │
│ API Secret:    ●●●●●●●●●●●●  [顯示] │
└─────────────────────────────────────┘
```

點擊「顯示」按鈕複製 API Secret

### 3️⃣ 在 Railway 設定環境變數

#### 方法 A: 使用 Railway Web UI

1. 進入您的 Railway 專案
2. 點擊 **Variables** 標籤
3. 新增以下三個變數：

| Variable Name              | Value                  |
|---------------------------|------------------------|
| `CLOUDINARY_CLOUD_NAME`   | 您的 Cloud Name        |
| `CLOUDINARY_API_KEY`      | 您的 API Key           |
| `CLOUDINARY_API_SECRET`   | 您的 API Secret        |

4. 點擊 **Save** → Railway 會自動重新部署

#### 方法 B: 使用 Railway CLI

```bash
# 安裝 Railway CLI
npm i -g @railway/cli

# 登入
railway login

# 連結專案
railway link

# 設定環境變數
railway variables set CLOUDINARY_CLOUD_NAME=你的Cloud_Name
railway variables set CLOUDINARY_API_KEY=你的API_Key
railway variables set CLOUDINARY_API_SECRET=你的API_Secret

# 重新部署
railway up
```

### 4️⃣ 驗證設定

#### 檢查 Railway 日誌

```bash
railway logs
```

尋找以下訊息：
- ✅ `封面圖片上傳成功 (雲端儲存)` → Cloudinary 運作正常
- ❌ `Cloudinary 上傳失敗，降級到本地儲存` → 設定有誤

#### 測試上傳

1. 登入您的 Railway 部署網站
2. 進入學生帳號
3. 上傳作品封面圖片
4. 檢查圖片 URL：
   - ✅ 應為：`https://res.cloudinary.com/你的Cloud_Name/...`
   - ❌ 不應為：`uploads/portfolios/...`

### 5️⃣ 本地開發環境（選用）

如果您想在本地也使用 Cloudinary：

1. 複製 `env.example.txt` 為 `.env`
2. 填入 Cloudinary 憑證：

```env
# Cloudinary 設定
CLOUDINARY_CLOUD_NAME=你的Cloud_Name
CLOUDINARY_API_KEY=你的API_Key
CLOUDINARY_API_SECRET=你的API_Secret
```

3. 重啟 XAMPP

## 📊 Cloudinary Dashboard

登入 Cloudinary 後，您可以：

- 📁 **Media Library**: 查看所有上傳的圖片
- 📈 **Usage**: 查看用量統計
- ⚙️ **Settings**: 管理設定
- 🔒 **Security**: 設定上傳限制

## 🎯 完成檢查清單

- [ ] Cloudinary 帳號已註冊
- [ ] API 憑證已複製
- [ ] Railway 環境變數已設定（3 個）
- [ ] Railway 已重新部署
- [ ] 測試上傳圖片成功
- [ ] 圖片 URL 為 Cloudinary 網址
- [ ] 圖片可正常顯示

## 🆘 需要協助？

### Cloudinary 支援
- 文檔: https://cloudinary.com/documentation
- 社群: https://community.cloudinary.com/

### Railway 支援
- 文檔: https://docs.railway.app/
- Discord: https://discord.gg/railway

## 💡 小提示

1. **API Secret 要保密**: 不要提交到 Git
2. **免費額度監控**: 定期檢查 Cloudinary 用量
3. **圖片優化**: Cloudinary 會自動優化圖片大小和格式
4. **CDN 加速**: 全球用戶都能快速載入圖片

---

設定完成後，您的作品封面圖片就能永久儲存並快速載入了！🎉

