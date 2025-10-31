# 📧 郵件功能設定說明

## 功能說明

聯絡表單已升級為自動發送 Email 功能！當訪客透過首頁的聯絡表單發送訊息時，系統會：

1. ✅ 將訊息儲存到資料庫（作為備份）
2. ✅ 自動發送格式化的 Email 到您指定的信箱
3. ✅ Email 包含完整的聯絡資訊和訊息內容
4. ✅ 可直接回覆 Email 與來信者聯繫

## 🚀 快速設定步驟

### 1. 安裝 PHPMailer 套件

在專案根目錄執行：

```bash
composer install
```

或單獨安裝：

```bash
composer require phpmailer/phpmailer
```

### 2. 設定環境變數

#### 方式 A：使用 .env 檔案（建議）

1. 複製範例檔案：
   ```bash
   cp .env.example .env
   ```

2. 編輯 `.env` 檔案，填入您的郵件設定：
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_USERNAME=portfolioplus2025@gmail.com
   SMTP_PASSWORD=your_app_password_here
   SMTP_PORT=587
   CONTACT_EMAIL=portfolioplus2025@gmail.com
   ```

#### 方式 B：直接修改 PHP 程式碼

如果不使用 .env 檔案，可以直接修改 `api/contact.php` 第 145-150 行的預設值。

### 3. 取得 Gmail 應用程式密碼

如果使用 Gmail，**不能使用一般密碼**，必須使用「應用程式密碼」：

#### 步驟：

1. 前往 [Google 帳戶](https://myaccount.google.com/)
2. 點選左側「安全性」
3. 確認已啟用「兩步驟驗證」（必須先啟用）
4. 在「兩步驟驗證」下方找到「應用程式密碼」
5. 選擇應用程式：「郵件」
6. 選擇裝置：「其他（自訂名稱）」，輸入「Portfolio Plus」
7. 點選「產生」
8. 複製產生的 16 位密碼（格式：xxxx xxxx xxxx xxxx）
9. 將此密碼填入 `.env` 檔案的 `SMTP_PASSWORD`

### 4. 測試郵件功能

1. 開啟您的網站首頁
2. 捲動到「聯絡我們」區塊
3. 填寫測試資料並送出
4. 檢查您的收件匣是否收到通知郵件

## 📧 Email 範本預覽

發送的郵件包含：
- 📌 美觀的 HTML 格式
- 👤 來信者姓名
- 📧 來信者電子郵件（設為回覆地址）
- 💬 訊息內容
- 🕒 收到時間
- 🎨 品牌色彩設計（紫色漸層）

## 🔧 進階設定

### 使用其他郵件服務

#### Gmail 以外的服務
如果使用其他 SMTP 服務（如 Outlook、Yahoo 等），請修改 `.env`：

```env
# Outlook/Hotmail
SMTP_HOST=smtp.office365.com
SMTP_PORT=587

# Yahoo Mail
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

#### 自訂 SMTP 伺服器
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USERNAME=noreply@yourdomain.com
SMTP_PASSWORD=your_password
```

### 變更收件信箱

預設收件信箱為 `portfolioplus2025@gmail.com`，若要變更：

```env
CONTACT_EMAIL=your_email@example.com
```

## 🐛 常見問題

### 問題 1：郵件無法發送

**解決方法：**
1. 確認已執行 `composer install`
2. 檢查 SMTP 帳號密碼是否正確
3. 確認 Gmail 已啟用「應用程式密碼」
4. 檢查伺服器是否允許對外連線到 port 587
5. 查看 `logs/` 目錄中的錯誤訊息

### 問題 2：收不到郵件

**檢查項目：**
1. 查看垃圾郵件資料夾
2. 確認 `CONTACT_EMAIL` 設定正確
3. 檢查 Gmail 帳戶的「已封鎖的寄件者」清單

### 問題 3：PHPMailer 未安裝

**錯誤訊息：** `Class 'PHPMailer\PHPMailer\PHPMailer' not found`

**解決方法：**
```bash
composer require phpmailer/phpmailer
```

## 📝 程式碼說明

### 主要檔案

- `api/contact.php` - 處理聯絡表單並發送郵件
- `composer.json` - 包含 PHPMailer 依賴
- `.env` - 環境變數設定檔（需自行建立）

### 流程圖

```
訪客填寫表單
    ↓
提交到 api/contact.php
    ↓
驗證表單資料
    ↓
儲存到資料庫 ← 失敗則回傳錯誤
    ↓
使用 PHPMailer 發送郵件
    ↓
回傳成功訊息給訪客
```

## 🔒 安全性提醒

1. ❌ **絕對不要**將 `.env` 檔案提交到 Git
2. ✅ 已將 `.env` 加入 `.gitignore`
3. ✅ 使用應用程式密碼而非帳戶密碼
4. ✅ 表單包含防 XSS 和 SQL Injection 保護

## 📞 需要協助？

如有任何問題，請：
1. 查看 `logs/` 目錄中的錯誤日誌
2. 檢查瀏覽器開發者工具的 Network 標籤
3. 確認 PHP 版本 >= 7.3

---

**更新日期：** 2024-10-31  
**版本：** 1.0

