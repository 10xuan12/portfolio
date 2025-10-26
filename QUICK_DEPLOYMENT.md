# 🚀 快速部署到 Railway

## 當前狀況

✅ **本地已完成：**
- Router 路由器已創建
- 前端配置自動檢測環境
- 圖片路徑已修正
- 示例圖片已準備好

⚠️ **Railway 上需要執行：**
- 數據庫路徑需要更新（從 `/portfolio/uploads/` 改為 `/uploads/`）

## 立即執行的 3 個步驟

### 步驟 1：提交並推送代碼

```bash
git add .
git commit -m "修正 Railway 部署：路由器、API 路徑、示例圖片"
git push origin main
```

### 步驟 2：等待 Railway 自動部署完成

在 Railway Dashboard 中查看部署狀態

### 步驟 3：更新 Railway 數據庫

**最簡單的方法：** 直接執行這些 SQL

登入 Railway 的 MySQL 服務，執行：

```sql
-- 1️⃣ 更新作品圖片路徑
UPDATE portfolios 
SET cover_image = REPLACE(cover_image, '/portfolio/uploads/', '/uploads/') 
WHERE cover_image LIKE '/portfolio/uploads/%';

-- 2️⃣ 更新作品附件路徑
UPDATE portfolio_files 
SET file_path = REPLACE(file_path, '/portfolio/uploads/', '/uploads/') 
WHERE file_path LIKE '/portfolio/uploads/%';

-- 3️⃣ 更新學生頭像路徑
UPDATE student_profiles 
SET avatar_url = REPLACE(avatar_url, '/portfolio/uploads/', '/uploads/') 
WHERE avatar_url LIKE '/portfolio/uploads/%';

-- 4️⃣ 更新企業 Logo 路徑
UPDATE enterprise_profiles 
SET logo_url = REPLACE(logo_url, '/portfolio/uploads/', '/uploads/') 
WHERE logo_url LIKE '/portfolio/uploads/%';

-- ✅ 驗證結果
SELECT id, title, cover_image FROM portfolios LIMIT 3;
```

## 完成！

執行完這 3 個步驟後：
- 刷新 Railway 上的網站
- 圖片應該正常顯示了！

---

**詳細說明請查看 `RAILWAY_DEPLOYMENT_STEPS.md`**

