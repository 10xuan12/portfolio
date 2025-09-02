#### 新增 API 檔案
1. **`api/student/settings.php`** - 使用者設定管理
   - GET: 取得使用者設定
   - POST: 更新使用者設定

2. **`api/student/password.php`** - 密碼管理
   - POST: 修改密碼
   - POST: 重置密碼（忘記密碼功能）

3. **`api/student/badges.php`** - 徽章管理
   - GET: 取得使用者徽章

4. **`api/student/activities.php`** - 活動記錄
   - GET: 取得使用者活動記錄（支援分頁）

5. **`api/student/options.php`** - 選項資料管理
   - GET: 取得科系列表
   - GET: 取得年級列表
   - GET: 取得所有選項（科系+年級）

3. **新增功能**
   - 社群媒體連結管理
   - 使用者設定管理
   - 密碼強度驗證
   - 資料匯出功能（JSON, CSV, PDF）
   - 動態選項載入（科系、年級）

4. **改善錯誤處理**
   - 統一的錯誤處理機制
   - 使用者友善的錯誤訊息
   - 網路錯誤重試機制
   - 選項載入失敗時的預設值處理
