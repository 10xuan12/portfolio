# 📧 聯絡表單Email功能 - 更新紀錄

## 📅 更新日期：2024-10-31

---

## 🎉 新功能

### ✨ 自動發送Email通知

現在當訪客透過首頁的「聯絡我們」表單發送訊息時，系統會：

1. ✅ **儲存訊息到資料庫**（作為備份記錄）
2. ✅ **自動發送Email到指定信箱**（即時通知）
3. ✅ **美觀的HTML郵件範本**（專業形象）
4. ✅ **可直接回覆功能**（方便聯繫來信者）

### 📧 Email 內容包含：

- 👤 來信者姓名
- 📧 來信者電子郵件（設為回覆地址）
- 💬 完整訊息內容
- 🕒 收到時間
- 🎨 Portfolio Plus 品牌設計（紫色漸層）

---

## 📝 檔案修改清單

### 1. `composer.json`
```json
新增依賴套件：
- phpmailer/phpmailer: ^6.8
```

### 2. `api/contact.php`
- ✅ 加入 PHPMailer 整合
- ✅ 實作 `sendEmailNotification()` 函數
- ✅ 支援環境變數設定（.env）
- ✅ 支援直接在程式碼中設定
- ✅ 美觀的HTML郵件範本
- ✅ 錯誤處理機制

### 3. 新增檔案

#### `env.example.txt`
環境變數範例檔案，包含：
- SMTP 伺服器設定
- Gmail 應用程式密碼說明
- 收件信箱設定

#### `EMAIL_SETUP.md`
詳細的設定說明文件，包含：
- 完整安裝步驟
- Gmail 應用程式密碼取得教學
- 其他郵件服務設定方法
- 常見問題解答
- 安全性提醒

#### `INSTALL_EMAIL.md`
快速安裝指南：
- 三步驟快速設定
- 簡化的操作說明
- 常見問題快速解答

#### `CHANGELOG_EMAIL.md`（本檔案）
更新紀錄與技術說明

---

## 🚀 如何使用

### 最快方式（3 步驟）：

1. **安裝套件**
   ```bash
   composer install
   ```

2. **設定郵件帳號**
   
   編輯 `api/contact.php` 第 154-168 行：
   ```php
   $mail->Username = 'your_email@gmail.com';
   $mail->Password = 'your_app_password';
   $receiverEmail = 'your_email@gmail.com';
   ```

3. **取得 Gmail 應用程式密碼**
   
   前往 [Google 帳戶安全性設定](https://myaccount.google.com/security)
   
   啟用兩步驟驗證 → 產生應用程式密碼

---

## 🔧 技術細節

### SMTP 設定

```php
Host:       smtp.gmail.com
Port:       587
Secure:     STARTTLS
Auth:       true
```

### 環境變數支援

系統支援兩種設定方式：

#### 方式 1：.env 檔案（推薦）
```env
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=portfolioplus2025@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_PORT=587
CONTACT_EMAIL=portfolioplus2025@gmail.com
```

#### 方式 2：直接修改程式碼
直接在 `api/contact.php` 中設定預設值

### 優先順序

```
$_ENV > getenv() > 預設值
```

---

## 🔒 安全性

- ✅ `.env` 檔案已加入 `.gitignore`（不會提交到 Git）
- ✅ 使用應用程式密碼而非帳戶密碼
- ✅ 表單包含 XSS 防護
- ✅ SQL Injection 防護
- ✅ 郵件內容進行 HTML 轉義
- ✅ 訊息長度限制（2000字）
- ✅ Email 格式驗證

---

## 📊 功能流程

```
1. 訪客填寫聯絡表單
   ↓
2. JavaScript 驗證並發送到 api/contact.php
   ↓
3. 後端驗證資料（姓名、Email、訊息）
   ↓
4. 儲存到資料庫 contact_messages
   ↓
5. 使用 PHPMailer 發送郵件
   ↓
6. 回傳成功訊息給訪客
   ↓
7. 您的信箱收到通知郵件！
```

---

## 🎨 郵件範本設計

- **標題列**：紫色漸層背景，白色文字
- **內容區**：淺灰背景，資訊卡片式設計
- **訊息框**：左側紫色邊條，突出顯示
- **頁尾**：小字說明，專業感
- **響應式設計**：在各種郵件客戶端都能正常顯示

---

## 📱 相容性

### 測試環境
- ✅ Gmail
- ✅ Outlook
- ✅ Yahoo Mail
- ✅ Apple Mail
- ✅ 手機郵件 App

### 伺服器需求
- PHP >= 7.3
- Composer
- PHPMailer 6.8+
- 允許對外連線到 Port 587

---

## ❓ 疑難排解

### 問題 1：Class 'PHPMailer' not found
```bash
解決：composer install
```

### 問題 2：SMTP Error: Could not authenticate
```
原因：密碼錯誤或未使用應用程式密碼
解決：檢查是否使用 Gmail 應用程式密碼
```

### 問題 3：收不到郵件
```
檢查項目：
1. 垃圾郵件資料夾
2. CONTACT_EMAIL 設定是否正確
3. 檢查伺服器錯誤日誌
```

### 問題 4：郵件發送失敗但訊息仍儲存
```
這是正常的：即使郵件發送失敗，訊息也會儲存到資料庫
您可以從後台管理介面查看
```

---

## 📚 延伸閱讀

- [PHPMailer 官方文件](https://github.com/PHPMailer/PHPMailer)
- [Gmail SMTP 設定](https://support.google.com/mail/answer/7126229)
- [應用程式密碼說明](https://support.google.com/accounts/answer/185833)

---

## 🎯 下一步建議

1. ✅ 設定好郵件功能並測試
2. 💡 考慮加入郵件範本管理
3. 💡 新增自動回覆功能（寄確認信給來信者）
4. 💡 整合後台管理介面（查看所有聯絡訊息）
5. 💡 加入郵件發送記錄

---

## 👨‍💻 開發者

**Portfolio Plus Team**  
更新日期：2024-10-31  
版本：1.0.0

---

**有任何問題嗎？** 請參閱 `EMAIL_SETUP.md` 或 `INSTALL_EMAIL.md`

