# Portfolio+ 後端 API 使用說明

## 概述

Portfolio+ 是一個完整的作品集管理系統，提供學生、企業和管理員三種角色的功能。本文檔詳細說明學生相關的 API 端點使用方法。

## 基礎設定

### 資料庫設定
- 資料庫名稱：`ephortfolio1`
- 字符集：`utf8mb4`
- 時區：`Asia/Taipei`

### 安裝步驟
1. 匯入 `database/schema.sql` 到 MySQL 資料庫
2. 確保 `includes/db_connect.php` 中的資料庫連線設定正確
3. 啟動 XAMPP 的 Apache 和 MySQL 服務

## API 基礎資訊

### 基礎 URL
```
http://localhost/portfolio/api
```

### 回應格式
所有 API 回應都使用 JSON 格式，包含以下欄位：
```json
{
    "status": 200,
    "message": "success",
    "data": {...},
    "timestamp": "2024-01-15 10:30:00"
}
```

### 錯誤回應
```json
{
    "status": 400,
    "message": "錯誤訊息",
    "data": null,
    "timestamp": "2024-01-15 10:30:00"
}
```

## 學生認證 API

### 登入
**端點：** `POST /api/student/auth`

**請求體：**
```json
{
    "action": "login",
    "username": "student123",
    "password": "password123"
}
```

**回應：**
```json
{
    "status": 200,
    "message": "登入成功",
    "data": {
        "user_id": 1,
        "username": "student123",
        "email": "student@example.com",
        "role": "student",
        "first_name": "張",
        "last_name": "小明",
        "display_name": "張小明",
        "avatar_url": "uploads/avatars/avatar_1.jpg"
    }
}
```

### 註冊
**端點：** `POST /api/student/auth`

**請求體：**
```json
{
    "action": "register",
    "username": "newstudent",
    "email": "new@example.com",
    "password": "password123",
    "first_name": "李",
    "last_name": "小華"
}
```

### 登出
**端點：** `POST /api/student/auth`

**請求體：**
```json
{
    "action": "logout"
}
```

### 檢查認證狀態
**端點：** `GET /api/student/auth?action=check`

## 學生個人資料 API

### 取得個人資料
**端點：** `GET /api/student/profile?action=get`

**回應：**
```json
{
    "status": 200,
    "message": "success",
    "data": {
        "id": 1,
        "username": "student123",
        "email": "student@example.com",
        "first_name": "張",
        "last_name": "小明",
        "display_name": "張小明",
        "gender": "男",
        "birth_date": "2000-01-01",
        "phone": "0912-345-678",
        "address": "台北市...",
        "bio": "我是一名學生...",
        "student_id": "12345678",
        "major": "資訊管理學系",
        "school": "某某大學",
        "grade": "三年級",
        "graduation_year": 2025,
        "skills": ["JavaScript", "React", "PHP"],
        "interests": ["網頁開發", "UI/UX設計"],
        "stats": {
            "portfolio_count": 5,
            "total_views": 1234,
            "total_likes": 89,
            "comment_count": 23
        }
    }
}
```

### 更新個人資料
**端點：** `POST /api/student/profile`

**請求體：**
```json
{
    "action": "update",
    "first_name": "張",
    "last_name": "小明",
    "display_name": "張小明",
    "gender": "男",
    "birth_date": "2000-01-01",
    "phone": "0912-345-678",
    "address": "台北市...",
    "bio": "我是一名學生...",
    "student_id": "12345678",
    "major": "資訊管理學系",
    "school": "某某大學",
    "grade": "三年級",
    "graduation_year": 2025,
    "skills": ["JavaScript", "React", "PHP"],
    "interests": ["網頁開發", "UI/UX設計"]
}
```

### 上傳頭像
**端點：** `POST /api/student/profile`

**請求體：** `multipart/form-data`
```
action: upload_avatar
avatar: [檔案]
```

## 作品管理 API

### 取得作品列表
**端點：** `GET /api/student/portfolio?action=list&page=1&limit=10&status=published&category=web&search=網站`

**查詢參數：**
- `page`: 頁碼（預設：1）
- `limit`: 每頁數量（預設：10）
- `status`: 作品狀態（draft, published, review, archived）
- `category`: 分類 ID
- `search`: 搜尋關鍵字

**回應：**
```json
{
    "status": 200,
    "message": "success",
    "data": {
        "portfolios": [
            {
                "id": 1,
                "title": "響應式網站設計",
                "description": "使用 HTML5、CSS3 和 JavaScript...",
                "status": "published",
                "cover_image": "uploads/portfolios/cover1.jpg",
                "view_count": 156,
                "like_count": 23,
                "comment_count": 8,
                "created_at": "2024-01-15 10:30:00",
                "category_name": "網頁設計",
                "category_slug": "web"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 25,
            "pages": 3
        }
    }
}
```

### 取得作品詳情
**端點：** `GET /api/student/portfolio?action=detail&id=1`

### 建立作品
**端點：** `POST /api/student/portfolio`

**請求體：**
```json
{
    "action": "create",
    "title": "新作品標題",
    "description": "作品描述",
    "category_id": 1,
    "tags": "JavaScript,React,PHP",
    "status": "draft",
    "content": "詳細內容..."
}
```

### 更新作品
**端點：** `POST /api/student/portfolio`

**請求體：**
```json
{
    "action": "update",
    "id": 1,
    "title": "更新後的標題",
    "description": "更新後的描述",
    "category_id": 1,
    "tags": "JavaScript,React,PHP",
    "status": "published",
    "content": "更新後的內容..."
}
```

### 刪除作品
**端點：** `POST /api/student/portfolio`

**請求體：**
```json
{
    "action": "delete",
    "id": 1
}
```

### 上傳作品檔案
**端點：** `POST /api/student/portfolio`

**請求體：** `multipart/form-data`
```
action: upload_files
portfolio_id: 1
files: [檔案1]
files: [檔案2]
```

### 切換作品狀態
**端點：** `POST /api/student/portfolio`

**請求體：**
```json
{
    "action": "toggle_status",
    "id": 1,
    "status": "published"
}
```

### 取得分類列表
**端點：** `GET /api/student/portfolio?action=categories`

## 履歷管理 API

### 取得履歷列表
**端點：** `GET /api/student/resume?action=list`

### 取得履歷詳情
**端點：** `GET /api/student/resume?action=detail&id=1`

### 取得履歷模板
**端點：** `GET /api/student/resume?action=templates`

**回應：**
```json
{
    "status": 200,
    "message": "success",
    "data": [
        {
            "id": "modern",
            "name": "現代簡約",
            "description": "簡潔現代的設計風格，適合技術職位",
            "preview": "modern_preview.jpg",
            "features": ["響應式設計", "清晰排版", "專業外觀"]
        }
    ]
}
```

### 建立履歷
**端點：** `POST /api/student/resume`

**請求體：**
```json
{
    "action": "create",
    "title": "我的履歷",
    "template": "modern",
    "content": {
        "basic_info": {
            "name": "張小明",
            "title": "前端開發工程師",
            "email": "zhang@example.com"
        },
        "education": [
            {
                "degree": "資訊管理學系",
                "school": "某某大學",
                "year": "2025"
            }
        ],
        "skills": ["JavaScript", "React", "PHP"]
    },
    "is_public": false
}
```

### 更新履歷
**端點：** `POST /api/student/resume`

**請求體：**
```json
{
    "action": "update",
    "id": 1,
    "title": "更新後的履歷標題",
    "template": "modern",
    "content": {...},
    "is_public": true
}
```

### 刪除履歷
**端點：** `POST /api/student/resume`

**請求體：**
```json
{
    "action": "delete",
    "id": 1
}
```

### 複製履歷
**端點：** `POST /api/student/resume`

**請求體：**
```json
{
    "action": "duplicate",
    "id": 1
}
```

### 匯出履歷
**端點：** `GET /api/student/resume?action=export&id=1&format=html`

**查詢參數：**
- `id`: 履歷 ID
- `format`: 匯出格式（html, pdf, docx）

## 通用 API

### 搜尋作品
**端點：** `GET /api/common/search?q=JavaScript&type=published&category=web&page=1&limit=10`

**查詢參數：**
- `q`: 搜尋關鍵字
- `type`: 搜尋類型（all, published）
- `category`: 分類篩選
- `page`: 頁碼
- `limit`: 每頁數量

### 取得分類列表
**端點：** `GET /api/common/categories`

### 檔案上傳
**端點：** `POST /api/common/upload`

**請求體：** `multipart/form-data`
```
file: [檔案]
type: portfolio
```

## 錯誤代碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 成功 |
| 201 | 建立成功 |
| 400 | 請求錯誤 |
| 401 | 未認證 |
| 403 | 權限不足 |
| 404 | 找不到資源 |
| 405 | 方法不允許 |
| 500 | 伺服器錯誤 |
| 501 | 功能未實作 |

## 安全性注意事項

1. **密碼安全**：密碼使用 bcrypt 加密儲存
2. **SQL 注入防護**：使用 prepared statements
3. **XSS 防護**：輸入資料進行 HTML 轉義
4. **檔案上傳安全**：驗證檔案類型和大小
5. **權限控制**：每個 API 都驗證使用者權限

## 測試建議

1. 使用 Postman 或類似工具測試 API
2. 先測試認證功能，取得 session
3. 測試各種錯誤情況（無效參數、權限不足等）
4. 測試檔案上傳功能
5. 驗證資料庫中的資料正確性

## 開發環境設定

### 必要擴展
- PHP 7.4+
- MySQL 5.7+
- Apache mod_rewrite
- PHP 擴展：mysqli, json, fileinfo

### 開發工具
- XAMPP 或類似環境
- 資料庫管理工具（phpMyAdmin）
- API 測試工具（Postman）

## 聯絡支援

如有問題或建議，請聯絡開發團隊或查看專案文件。
