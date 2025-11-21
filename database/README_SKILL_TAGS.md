# 技能標籤表部署說明

## Railway 部署方式

### 方法 1：Railway Dashboard（推薦）

1. 登入 [Railway Dashboard](https://railway.app)
2. 選擇您的專案
3. 點擊 MySQL 資料庫服務
4. 開啟 **"Data"** 或 **"Query"** 標籤
5. 複製 `create_skill_tags_table.sql` 檔案的全部內容
6. 貼上到查詢編輯器
7. 點擊 **"Run"** 或 **"Execute"** 執行

### 方法 2：使用 MySQL 客戶端

如果您有 Railway 的資料庫連接資訊：

```bash
# 使用 mysql 命令列工具
mysql -h [MYSQL_HOST] -u [MYSQL_USER] -p[MYSQL_PASSWORD] [MYSQL_DATABASE] < create_skill_tags_table.sql
```

或使用 MySQL Workbench、phpMyAdmin 等工具連接後執行。

### 方法 3：通過 PHP 腳本執行（一次性）

如果上述方法無法使用，可以創建一個臨時的 PHP 腳本來執行：

1. 在 Railway 專案中創建 `api/admin/run-migration.php`
2. 訪問該檔案執行 SQL
3. 執行完成後刪除該檔案

## 注意事項

⚠️ **重要**：
- 執行前請確認資料庫備份
- 如果 `skill_tags` 表已存在，SQL 會使用 `CREATE TABLE IF NOT EXISTS` 避免錯誤
- INSERT 語句如果標籤已存在（因為有 UNIQUE 約束），會跳過重複的標籤
- 執行完成後，標籤會自動從資料庫載入，無需重啟服務

## 驗證部署

執行完成後，可以通過以下方式驗證：

1. 訪問 API：`/api/student/skill-tags.php?action=get_tags`
2. 檢查是否返回標籤數據
3. 在上傳作品頁面查看標籤是否正常顯示

## 故障排除

如果執行失敗：
1. 檢查 SQL 語法是否正確
2. 確認資料庫連接正常
3. 查看 Railway 日誌是否有錯誤訊息
4. 確認資料庫用戶有 CREATE TABLE 和 INSERT 權限

