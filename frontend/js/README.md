# JavaScript 檔案說明

## 📁 目錄結構

```
js/
├── config.js              # 配置檔案 (新增)
├── mock-data.js           # 統一假資料檔案
├── api-service.js         # 統一API服務 (新增)
├── app.js                 # 主要應用程式檔案
├── student/               # 學生相關功能
│   ├── dashboard.js       # 學生儀表板
│   ├── portfolio.js       # 作品集管理
│   ├── upload.js          # 作品上傳
│   └── ...
├── enterprise/            # 企業相關功能
│   ├── dashboard.js       # 企業儀表板
│   ├── analytics.js       # 企業分析
│   ├── jobs.js            # 職缺管理
│   └── ...
└── admin/                 # 管理員相關功能
    ├── dashboard.js       # 管理員儀表板
    ├── users.js           # 使用者管理
    └── ...
```

## 🎯 配置系統 (新增)

### 檔案位置
- **主要檔案**: `js/config.js`
- **全域物件**: `APP_CONFIG`

### 核心功能

#### 1. 假資料/真實API切換
```javascript
// 檢查是否使用假資料
if (isUsingMockData()) {
    console.log('使用假資料模式');
} else {
    console.log('使用真實API模式');
}

// 切換模式
toggleMockData();
```

#### 2. 配置管理
```javascript
// 取得配置值
const apiUrl = getConfig('API_BASE_URL');
const debugMode = getConfig('DEBUG_MODE');

// 設定配置值
setConfig('USE_MOCK_DATA', false);
setConfig('API_BASE_URL', 'https://api.example.com');
```

#### 3. 環境檢查
```javascript
// 檢查環境
if (isDevelopment()) {
    console.log('開發環境');
} else if (isProduction()) {
    console.log('生產環境');
}
```

### 配置項目

#### 核心設定
- `USE_MOCK_DATA`: 是否使用假資料 (true/false)
- `API_BASE_URL`: API基礎URL
- `VERSION`: 應用程式版本
- `ENVIRONMENT`: 環境設定

#### 功能開關
- `ENABLE_REALTIME_NOTIFICATIONS`: 即時通知
- `ENABLE_WEBSOCKET`: WebSocket連接
- `ENABLE_OFFLINE_MODE`: 離線模式
- `ENABLE_PWA`: PWA功能

#### 開發設定
- `DEBUG_MODE`: 除錯模式
- `VERBOSE_LOGGING`: 詳細日誌
- `MOCK_API_DELAY`: 模擬API延遲

## 🎯 統一API服務 (新增)

### 檔案位置
- **主要檔案**: `js/api-service.js`
- **全域物件**: `apiService`

### 使用方式

#### 1. 在HTML中引用
```html
<script src="../js/config.js"></script>
<script src="../js/mock-data.js"></script>
<script src="../js/api-service.js"></script>
<script src="../js/app.js"></script>
```

#### 2. 在JavaScript中使用
```javascript
// 取得使用者資料
const user = await apiService.getUser(1);

// 取得作品列表
const portfolios = await apiService.getPortfolios();

// 搜尋作品
const searchResults = await apiService.searchPortfolios('React');

// 建立新作品
const newPortfolio = await apiService.createPortfolio({
    title: '新作品',
    description: '作品描述'
});
```

### API方法

#### 使用者相關
```javascript
apiService.getUser(userId)           // 取得使用者資料
apiService.getUsers(role)            // 取得使用者列表
apiService.updateUser(userId, data)  // 更新使用者資料
```

#### 作品相關
```javascript
apiService.getPortfolio(portfolioId)           // 取得作品資料
apiService.getPortfolios(filters)              // 取得作品列表
apiService.getUserPortfolios(userId)           // 取得使用者的作品
apiService.createPortfolio(data)               // 建立新作品
apiService.updatePortfolio(portfolioId, data)  // 更新作品
apiService.deletePortfolio(portfolioId)        // 刪除作品
```

#### 統計相關
```javascript
apiService.getStats(type)  // 取得統計資料
```

#### 通知相關
```javascript
apiService.getNotifications(userId)                    // 取得通知
apiService.markNotificationAsRead(notificationId)      // 標記通知為已讀
```

#### 搜尋相關
```javascript
apiService.searchPortfolios(keyword, filters)  // 搜尋作品
apiService.searchUsers(keyword, filters)       // 搜尋使用者
```

## 🎯 統一假資料系統

### 檔案位置
- **主要檔案**: `js/mock-data.js`
- **全域物件**: `MockData`

### 使用方式

#### 1. 在HTML中引用
```html
<script src="../js/mock-data.js"></script>
<script src="../js/app.js"></script>
<script src="../js/your-page.js"></script>
```

#### 2. 在JavaScript中使用
```javascript
// 取得使用者資料
const user = MockData.getUserById(1);
const students = MockData.getUsersByRole('student');

// 取得作品資料
const portfolio = MockData.getPortfolioById(1);
const userPortfolios = MockData.getPortfoliosByAuthor(1);

// 取得統計資料
const stats = MockData.stats.student;
const platformStats = MockData.stats.platform;

// 搜尋功能
const searchResults = MockData.searchPortfolios('React');
const userResults = MockData.searchUsers('張小明');
```

### 資料結構

#### 使用者資料
```javascript
MockData.users.students      // 學生使用者
MockData.users.enterprises   // 企業使用者
MockData.users.admins        // 管理員使用者
```

#### 作品資料
```javascript
MockData.portfolios          // 所有作品
MockData.getPortfolioById(id)    // 根據ID取得作品
MockData.getPortfoliosByAuthor(authorId)  // 根據作者取得作品
```

#### 統計資料
```javascript
MockData.stats.platform      // 平台統計
MockData.stats.student       // 學生統計
MockData.stats.enterprise    // 企業統計
MockData.stats.admin         // 管理員統計
```

#### 分析資料
```javascript
MockData.analytics.trends    // 趨勢資料
MockData.analytics.skills    // 技能分析
MockData.analytics.departments  // 科系分布
```

### 工具函數

#### 格式化函數
```javascript
MockData.formatNumber(1234)      // 格式化數字: 1,234
MockData.formatDate('2024-01-15') // 格式化日期: 2024/1/15
MockData.formatTime('2024-01-15 14:30:00') // 格式化時間: 2024/1/15 14:30
```

#### 搜尋函數
```javascript
// 搜尋作品
MockData.searchPortfolios(keyword, filters)

// 搜尋使用者
MockData.searchUsers(keyword, filters)
```

#### 取得函數
```javascript
// 根據ID取得資料
MockData.getUserById(id)
MockData.getPortfolioById(id)

// 根據條件取得資料
MockData.getUsersByRole(role)
MockData.getPortfoliosByAuthor(authorId)
MockData.getPortfoliosByStatus(status)
```

## 🔄 後端整合準備

當後端API準備好時，只需要：

1. **修改配置檔案**
   ```javascript
   // 在 config.js 中修改
   USE_MOCK_DATA: false,  // 改為 false
   API_BASE_URL: 'https://your-api-domain.com/api'  // 設定真實API URL
   ```

2. **使用配置切換工具**
   - 訪問 `config-switcher.html`
   - 切換「使用假資料」開關
   - 設定API基礎URL
   - 點擊「儲存設定」

3. **或者直接修改配置**
   ```javascript
   // 在瀏覽器控制台中執行
   setConfig('USE_MOCK_DATA', false);
   setConfig('API_BASE_URL', 'https://your-api-domain.com/api');
   saveConfig();
   ```

## 🛠️ 配置切換工具

### 檔案位置
- **工具頁面**: `config-switcher.html`

### 功能特色
- 視覺化配置管理
- 即時模式切換
- 配置狀態顯示
- 一鍵儲存設定

### 使用方式
1. 在瀏覽器中開啟 `config-switcher.html`
2. 修改需要的配置項目
3. 點擊「儲存設定」按鈕
4. 重新載入頁面以應用新設定

## 📝 注意事項

1. **配置優先級**: 本地儲存的配置會覆蓋預設配置
2. **資料一致性**: 所有假資料都在 `mock-data.js` 中統一管理
3. **API服務**: 使用 `apiService` 進行所有API呼叫
4. **錯誤處理**: 在實際API整合時需要添加適當的錯誤處理
5. **效能考量**: 假資料檔案較大，實際部署時需要考慮載入效能

## 🎯 下一步

1. **API整合**: 連接後端服務
2. **錯誤處理**: 完善錯誤處理機制
3. **效能優化**: 實作資料快取和懶載入
4. **測試**: 建立單元測試和整合測試
5. **監控**: 實作應用程式監控和日誌系統
