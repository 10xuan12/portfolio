# 統一設計系統

## 概述

本專案已實施統一的設計系統，確保整個作品集系統具有一致的視覺風格和用戶體驗。

## 主要特色

### 🎨 統一色彩方案
- **主色彩**: `#2563eb` (藍色)
- **次要色彩**: `#64748b` (灰色)
- **背景色彩**: 白色、淺灰、深灰
- **側邊欄**: 深色背景 `#1e293b`

### 📱 響應式設計
- 桌面端: 側邊欄寬度 80px
- 平板端: 側邊欄寬度 70px
- 手機端: 側邊欄隱藏，內容全寬

### 🔧 統一組件
- 側邊欄導航
- 卡片組件
- 按鈕樣式
- 表單元素
- 通知訊息

## 文件結構

```
css/
├── unified-styles.css          # 統一樣式文件
├── styles.css                  # 登入頁面樣式
├── student.css                 # 學生端舊樣式 (已棄用)
└── category_projects.css       # 分類頁面樣式 (已棄用)

includes/
├── sidebar.php                 # 統一側邊欄組件
├── page_template.php           # 頁面模板開始
└── page_template_end.php       # 頁面模板結束
```

## 使用方法

### 1. 基本頁面結構

```php
<?php
// 設定頁面變數
$current_page = 'dashboard';
$user_type = 'student'; // 或 'enterprise'
$page_title = '學生主頁';

// 包含頁面模板
include '../includes/page_template.php';
?>

<!-- 頁面內容 -->
<section class="card p-4">
    <div class="card-header">
        <h2 class="text-xl font-bold text-primary">歡迎回來</h2>
    </div>
    <div class="card-body">
        <p class="text-secondary">這是您的個人主頁</p>
    </div>
</section>

<?php
// 結束頁面模板
include '../includes/page_template_end.php';
?>
```

### 2. 使用統一側邊欄

```php
<?php
$current_page = 'portfolio';
$user_type = 'student';
include '../includes/sidebar.php';
?>
```

### 3. 按鈕樣式

```html
<!-- 主要按鈕 -->
<button class="btn btn-primary">儲存</button>

<!-- 次要按鈕 -->
<button class="btn btn-secondary">取消</button>

<!-- 外框按鈕 -->
<button class="btn btn-outline">編輯</button>

<!-- 不同尺寸 -->
<button class="btn btn-primary btn-sm">小按鈕</button>
<button class="btn btn-primary btn-lg">大按鈕</button>
```

### 4. 卡片組件

```html
<!-- 基本卡片 -->
<div class="card">
    <div class="card-header">
        <h3 class="text-lg font-semibold text-primary">標題</h3>
    </div>
    <div class="card-body">
        <p class="text-secondary">內容</p>
    </div>
    <div class="card-footer">
        <button class="btn btn-primary">操作</button>
    </div>
</div>
```

### 5. 表單元素

```html
<div class="form-group">
    <label for="name" class="form-label">姓名</label>
    <input type="text" class="form-control" id="name" name="name" required>
</div>
```

### 6. 通知訊息

```html
<!-- 成功訊息 -->
<div class="alert alert-success">操作成功！</div>

<!-- 警告訊息 -->
<div class="alert alert-warning">請注意...</div>

<!-- 錯誤訊息 -->
<div class="alert alert-error">發生錯誤</div>

<!-- 資訊訊息 -->
<div class="alert alert-info">提示資訊</div>
```

## CSS 變數

所有設計令牌都定義在 `:root` 中：

```css
:root {
    /* 主色彩 */
    --primary-color: #2563eb;
    --primary-dark: #1d4ed8;
    --primary-light: #3b82f6;
    
    /* 側邊欄色彩 */
    --sidebar-bg: #1e293b;
    --sidebar-hover: #334155;
    --sidebar-active: #3b82f6;
    
    /* 間距 */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    
    /* 圓角 */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
}
```

## 工具類

### 間距
- `m-0` 到 `m-5`: 外邊距
- `p-0` 到 `p-5`: 內邊距

### Flexbox
- `d-flex`: `display: flex`
- `flex-column`: `flex-direction: column`
- `justify-center`: `justify-content: center`
- `align-center`: `align-items: center`

### 文字
- `text-primary`: 主要文字顏色
- `text-secondary`: 次要文字顏色
- `text-center`: 文字置中

### 網格
- `grid-cols-1` 到 `grid-cols-4`: 網格列數

## 響應式斷點

- **桌面**: `> 1024px`
- **平板**: `768px - 1024px`
- **手機**: `< 768px`
- **小手機**: `< 480px`

## 動畫效果

```css
/* 淡入動畫 */
.fade-in {
    animation: fadeIn 0.3s ease-in;
}

/* 滑入動畫 */
.slide-in {
    animation: slideIn 0.3s ease-out;
}
```

## 已更新的頁面

### 企業端
- ✅ `enterprise/enterprise_dashboard.php`
- ✅ `enterprise/browseportfolio/enterprise_portfolio.php`

### 學生端
- ✅ `student/student_dashboard_view.php`
- ✅ `student/student_file.php`

## 待更新頁面

### 企業端
- ⏳ `enterprise/setting.php`
- ⏳ `enterprise/notifications/notification.php`
- ⏳ `enterprise/browseportfolio/category_filter.php`

### 學生端
- ⏳ `student/works.php`
- ⏳ `student/work_detail.php`
- ⏳ `student/student_edit_form.php`

## 注意事項

1. **不要混用舊樣式**: 避免同時使用 Tailwind CSS 和統一設計系統
2. **保持一致性**: 所有新頁面都應使用統一設計系統
3. **測試響應式**: 確保在不同螢幕尺寸下都能正常顯示
4. **無障礙設計**: 保持適當的對比度和鍵盤導航支援

## 貢獻指南

當添加新功能時：

1. 使用現有的 CSS 變數和工具類
2. 遵循統一的命名慣例
3. 確保響應式設計
4. 測試在不同瀏覽器中的相容性

## 問題回報

如果發現設計不一致或樣式問題，請：

1. 檢查是否正確引入了 `unified-styles.css`
2. 確認使用了正確的 CSS 類別
3. 檢查瀏覽器開發者工具中的樣式衝突
4. 回報具體的頁面和問題描述 