# 企業端 API 文件

## 概述

企業端 API 提供企業用戶管理職缺、瀏覽學生作品、聯絡學生等功能。

## 基礎設定

所有 API 都需要企業用戶登入認證，使用 Session 機制進行身份驗證。

## API 端點

### 1. 認證 API (`auth.php`)

#### 登入
```
POST /api/enterprise/auth.php
Content-Type: application/json

{
    "action": "login",
    "username": "microsoft_tw",
    "password": "password123"
}
```

#### 註冊
```
POST /api/enterprise/auth.php
Content-Type: application/json

{
    "action": "register",
    "username": "new_company",
    "email": "hr@newcompany.com",
    "password": "password123",
    "company_name": "新公司名稱",
    "contact_person": "聯絡人",
    "phone": "02-1234-5678",
    "address": "公司地址",
    "industry": "產業別",
    "company_size": "51-200人",
    "description": "公司描述"
}
```

#### 登出
```
POST /api/enterprise/auth.php
Content-Type: application/json

{
    "action": "logout"
}
```

#### 檢查認證狀態
```
GET /api/enterprise/auth.php?action=check
```

### 2. 企業資料 API (`profile.php`)

#### 取得企業資料
```
GET /api/enterprise/profile.php?action=get
```

#### 更新企業資料
```
POST /api/enterprise/profile.php
Content-Type: application/json

{
    "action": "update",
    "company_name": "更新後的公司名稱",
    "company_type": "科技公司",
    "industry": "軟體開發",
    "company_size": "51-200人",
    "founded_year": 1995,
    "employee_count": 150,
    "revenue_range": "10億-50億",
    "description": "公司描述",
    "website": "https://www.company.com",
    "address": "公司地址",
    "phone": "02-1234-5678",
    "contact_person": "聯絡人",
    "contact_email": "hr@company.com",
    "company_culture": "公司文化",
    "benefits_description": "福利說明",
    "social_media": {
        "linkedin": "https://linkedin.com/company/example",
        "facebook": "https://facebook.com/example"
    }
}
```

#### 上傳企業標誌
```
POST /api/enterprise/profile.php
Content-Type: multipart/form-data

{
    "action": "upload_logo",
    "logo": [檔案]
}
```

### 3. 職缺管理 API (`jobs.php`)

#### 取得職缺列表
```
GET /api/enterprise/jobs.php?action=list&page=1&limit=10&status=active&job_type=全職&search=關鍵字
```

#### 取得職缺詳細資料
```
GET /api/enterprise/jobs.php?action=detail&id=1
```

#### 建立新職缺
```
POST /api/enterprise/jobs.php
Content-Type: application/json

{
    "action": "create",
    "title": "前端開發工程師",
    "description": "職缺描述",
    "requirements": "技能要求",
    "responsibilities": "工作內容",
    "salary_min": 45000,
    "salary_max": 65000,
    "salary_type": "月薪",
    "job_type": "全職",
    "location": "台北市",
    "department": "技術部",
    "experience_level": "1-3年",
    "education_level": "大學",
    "skills_required": "JavaScript,React,HTML,CSS",
    "benefits": "福利說明",
    "status": "active",
    "deadline": "2024-12-31"
}
```

#### 更新職缺
```
POST /api/enterprise/jobs.php
Content-Type: application/json

{
    "action": "update",
    "id": 1,
    "title": "更新後的職缺標題",
    "description": "更新後的描述",
    "status": "paused"
}
```

#### 刪除職缺
```
POST /api/enterprise/jobs.php
Content-Type: application/json

{
    "action": "delete",
    "id": 1
}
```

#### 切換職缺狀態
```
POST /api/enterprise/jobs.php
Content-Type: application/json

{
    "action": "toggle_status",
    "id": 1,
    "status": "active"
}
```

#### 取得職缺申請列表
```
GET /api/enterprise/jobs.php?action=applications&job_id=1&status=pending&page=1&limit=10
```

#### 更新申請狀態
```
POST /api/enterprise/jobs.php
Content-Type: application/json

{
    "action": "update_application",
    "application_id": 1,
    "status": "reviewed",
    "notes": "面試筆記",
    "interview_date": "2024-01-15 14:00:00",
    "interview_location": "台北市信義區"
}
```

### 4. 作品瀏覽 API (`portfolios.php`)

#### 取得作品列表
```
GET /api/enterprise/portfolios.php?action=list&page=1&limit=12&category=web&department=資訊管理學系&sort=relevance&search=關鍵字
```

#### 取得作品詳細資料
```
GET /api/enterprise/portfolios.php?action=detail&id=1
```

#### 搜尋作品
```
GET /api/enterprise/portfolios.php?action=search&q=JavaScript&skills=React,Node.js&department=資訊工程學系&grade=大學四年級&match_threshold=70
```

#### 取得分類列表
```
GET /api/enterprise/portfolios.php?action=categories
```

#### 取得收藏列表
```
GET /api/enterprise/portfolios.php?action=bookmarks&page=1&limit=12
```

#### 切換收藏狀態
```
POST /api/enterprise/portfolios.php
Content-Type: application/json

{
    "action": "bookmark",
    "portfolio_id": 1,
    "notes": "收藏備註"
}
```

#### 聯絡學生
```
POST /api/enterprise/portfolios.php
Content-Type: application/json

{
    "action": "contact",
    "student_id": 1,
    "subject": "聯絡主旨",
    "message": "聯絡內容",
    "contact_type": "message"
}
```

#### 記錄瀏覽
```
POST /api/enterprise/portfolios.php
Content-Type: application/json

{
    "action": "view",
    "portfolio_id": 1
}
```

### 5. 儀表板 API (`dashboard.php`)

#### 取得統計資料
```
GET /api/enterprise/dashboard.php?action=stats
```

#### 取得最近瀏覽作品
```
GET /api/enterprise/dashboard.php?action=recent_portfolios&limit=6
```

#### 取得推薦學生
```
GET /api/enterprise/dashboard.php?action=recommended_students&limit=8
```

#### 取得最近活動
```
GET /api/enterprise/dashboard.php?action=recent_activities&limit=10
```

#### 取得職缺摘要
```
GET /api/enterprise/dashboard.php?action=job_summary&limit=5
```

#### 取得分析資料
```
GET /api/enterprise/dashboard.php?action=analytics&days=30
```

### 6. 通知 API (`notifications.php`)

#### 取得通知列表
```
GET /api/enterprise/notifications.php?action=list&page=1&limit=20&type=job_application&unread_only=false
```

#### 取得未讀通知數量
```
GET /api/enterprise/notifications.php?action=count
```

#### 標記通知為已讀
```
POST /api/enterprise/notifications.php
Content-Type: application/json

{
    "action": "mark_read",
    "notification_id": 1
}
```

#### 標記所有通知為已讀
```
POST /api/enterprise/notifications.php
Content-Type: application/json

{
    "action": "mark_all_read"
}
```

#### 刪除通知
```
POST /api/enterprise/notifications.php
Content-Type: application/json

{
    "action": "delete",
    "notification_id": 1
}
```

#### 清除所有通知
```
POST /api/enterprise/notifications.php
Content-Type: application/json

{
    "action": "clear_all"
}
```

## 回應格式

### 成功回應
```json
{
    "success": true,
    "message": "操作成功",
    "data": {
        // 回應資料
    }
}
```

### 錯誤回應
```json
{
    "success": false,
    "message": "錯誤訊息",
    "error_code": 400
}
```

## 狀態碼

- `200` - 成功
- `201` - 建立成功
- `400` - 請求錯誤
- `401` - 未認證
- `403` - 權限不足
- `404` - 資源不存在
- `405` - 方法不允許
- `500` - 伺服器錯誤

## 測試帳號

可以使用以下測試帳號進行測試：

- 帳號：`microsoft_tw`
- 密碼：`password`
- 角色：企業用戶

## 注意事項

1. 所有 API 都需要企業用戶登入認證
2. 檔案上傳限制為 5MB
3. 支援的圖片格式：JPG、PNG、GIF
4. 分頁預設每頁 10-20 筆資料
5. 時間格式使用 ISO 8601 標準
