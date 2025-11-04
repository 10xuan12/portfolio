# 驗證 Cloudinary 設定

## ✅ 您已完成環境變數設定！

已設定的變數：
- `CLOUDINARY_CLOUD_NAME`: dzvsuf5eb
- `CLOUDINARY_API_KEY`: 378818522562746
- `CLOUDINARY_API_SECRET`: 2XufLke-R09iCr5WLc4BHoAN2Pg

## 🔍 驗證步驟

### 1. 等待 Railway 重新部署

設定環境變數後，Railway 會自動重新部署：
- 查看 Railway Dashboard 的 **Deployments** 標籤
- 等待狀態變為 **Success** (綠色勾勾)
- 通常需要 1-3 分鐘

### 2. 查看部署日誌

在 Railway 中點擊 **View Logs**，應該會看到：
```
✓ Application deployed successfully
✓ Environment variables loaded
```

### 3. 測試圖片上傳

1. 訪問您的 Railway 網站
2. 登入學生帳號
3. 進入「作品管理」頁面
4. 上傳新作品並選擇封面圖片
5. 查看上傳成功訊息：
   - ✅ 應顯示：「封面圖片上傳成功 (雲端儲存)」
   - ❌ 不應顯示：「(本地儲存)」

### 4. 檢查圖片 URL

上傳成功後，查看圖片網址：

**方法 A: 瀏覽器開發者工具**
1. 按 F12 開啟開發者工具
2. 切換到 **Network** 標籤
3. 重新載入頁面
4. 找到圖片請求
5. 檢查 URL 格式：
   - ✅ 正確：`https://res.cloudinary.com/dzvsuf5eb/image/upload/v1234567890/portfolios/xxx.jpg`
   - ❌ 錯誤：`/uploads/portfolios/xxx.jpg`

**方法 B: 滑鼠右鍵**
1. 在作品封面圖片上按右鍵
2. 選擇「在新分頁中開啟圖片」
3. 查看網址列的 URL
4. 應該是 `https://res.cloudinary.com/...` 開頭

### 5. 登入 Cloudinary 確認

1. 登入 https://cloudinary.com/console
2. 進入 **Media Library**
3. 應該會看到 `portfolios` 資料夾
4. 裡面有您上傳的圖片

## ✅ 成功指標

如果以下全部符合，代表設定完全成功：

- [x] Railway 環境變數已設定（3個）
- [ ] Railway 重新部署成功
- [ ] 上傳圖片顯示「雲端儲存」
- [ ] 圖片 URL 為 `https://res.cloudinary.com/...`
- [ ] Cloudinary Media Library 中能看到圖片
- [ ] 圖片在網站上正常顯示
- [ ] 重啟 Railway 服務後圖片仍然存在

## ⚠️ 常見問題

### Q: 上傳後還是顯示「本地儲存」？

**可能原因**:
1. Railway 尚未完成重新部署
2. 環境變數名稱拼寫錯誤（注意大小寫）
3. API 憑證錯誤

**解決方法**:
1. 等待 Railway 部署完成（查看 Deployments 狀態）
2. 確認三個變數名稱完全一致：
   - `CLOUDINARY_CLOUD_NAME`（不是 `CLOUDINARY_NAME`）
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. 重新確認 Cloudinary Dashboard 的憑證是否正確

### Q: 圖片上傳失敗？

**檢查清單**:
```bash
# 在 Railway Logs 中尋找錯誤訊息
❌ "Cloudinary authentication failed"
   → API 憑證錯誤，重新檢查
   
❌ "Invalid cloud_name"
   → CLOUD_NAME 錯誤
   
❌ "API key invalid"
   → API_KEY 錯誤
```

### Q: 如何測試而不上傳真實作品？

建議：
1. 上傳一個測試作品
2. 使用簡單的測試圖片
3. 測試成功後可以刪除
4. 或設定為「草稿」狀態

## 🎉 完成後的效果

設定成功後：
- ✅ 所有新上傳的圖片永久儲存在 Cloudinary
- ✅ 全球 CDN 加速，載入速度快
- ✅ 自動圖片優化和壓縮
- ✅ Railway 重啟或重新部署不影響圖片
- ✅ 支援大量並發訪問

## 📊 監控使用量

定期檢查 Cloudinary 用量：
1. 登入 Cloudinary
2. 進入 **Dashboard**
3. 查看用量統計
4. 免費方案限制：
   - 25 GB 儲存空間
   - 25 GB/月 頻寬
   - 25,000 次/月 轉換

---

**提示**: 第一次上傳可能需要稍等幾秒，因為需要連接到 Cloudinary。後續上傳會更快。

