# 📧 聯絡表單Email功能 - 快速安裝指南

## 🎯 功能已完成！

您的聯絡表單現在會自動發送 Email 到指定的信箱！

---

## ⚡ 三步驟快速設定

### 步驟 1：安裝 PHPMailer

開啟終端機，在專案根目錄執行：

```bash
composer install
```

### 步驟 2：設定郵件帳號

#### 選項 A：修改程式碼（最簡單）

直接編輯 `api/contact.php` 第 145-158 行，填入您的郵件設定：

```php
$mail->Host       = 'smtp.gmail.com';
$mail->Username   = 'portfolioplus2025@gmail.com';  // 您的 Gmail
$mail->Password   = 'xxxx xxxx xxxx xxxx';          // 應用程式密碼
$mail->Port       = 587;

// 收件人
$receiverEmail = 'portfolioplus2025@gmail.com';     // 接收通知的信箱
```

#### 選項 B：使用環境變數（推薦）

1. 複製 `env.example.txt` 為 `.env`
2. 編輯 `.env` 填入設定：
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_USERNAME=portfolioplus2025@gmail.com
   SMTP_PASSWORD=your_app_password
   SMTP_PORT=587
   CONTACT_EMAIL=portfolioplus2025@gmail.com
   ```

### 步驟 3：取得 Gmail 應用程式密碼

⚠️ **重要：不能使用一般密碼！**

1. 前往：https://myaccount.google.com/security
2. 啟用「兩步驟驗證」
3. 點選「應用程式密碼」
4. 選擇「郵件」>「其他裝置」
5. 輸入名稱：`Portfolio Plus`
6. **複製產生的 16 位密碼**（格式：`xxxx xxxx xxxx xxxx`）
7. 填入上面的 `Password` 或 `SMTP_PASSWORD`

---

## ✅ 測試

1. 開啟網站首頁
2. 捲動到「聯絡我們」
3. 填寫表單並送出
4. 檢查您的信箱！

---

## 📧 Email 內容範例

您會收到美觀的 HTML 郵件，包含：
- 來信者姓名和電子郵件
- 完整訊息內容
- 收到時間
- 可直接回覆功能

---

## 🔧 其他郵件服務

### Outlook / Hotmail
```php
$mail->Host = 'smtp.office365.com';
$mail->Port = 587;
```

### Yahoo Mail
```php
$mail->Host = 'smtp.mail.yahoo.com';
$mail->Port = 587;
```

---

## ❓ 常見問題

**Q: 郵件無法發送？**
- 確認已執行 `composer install`
- 檢查應用程式密碼是否正確
- 查看伺服器錯誤日誌

**Q: 收不到郵件？**
- 檢查垃圾郵件資料夾
- 確認收件信箱地址正確

**Q: Class 'PHPMailer' not found？**
```bash
composer require phpmailer/phpmailer
```

---

## 📝 已修改的檔案

1. ✅ `composer.json` - 加入 PHPMailer 依賴
2. ✅ `api/contact.php` - 實作郵件發送功能
3. ✅ `env.example.txt` - 環境變數範例
4. ✅ `EMAIL_SETUP.md` - 詳細設定說明

---

**需要更詳細的說明？** 請參閱 `EMAIL_SETUP.md`

**安裝日期：** 2024-10-31

