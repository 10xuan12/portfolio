@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 準備部署到 Railway
echo ========================================
echo.

REM 檢查是否已安裝 Git
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 錯誤：未安裝 Git
    echo 請先安裝 Git：https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git 已安裝
echo.

REM 檢查是否已初始化 Git
if not exist ".git" (
    echo 📦 初始化 Git repository...
    git init
    git branch -M main
)

REM 添加所有檔案
echo 📝 添加檔案...
git add .

REM 提交
set /p commit_msg="💬 請輸入提交訊息（直接按 Enter 使用預設訊息）: "
if "%commit_msg%"=="" set commit_msg=部署到 Railway

echo 📤 提交變更...
git commit -m "%commit_msg%"

REM 檢查是否已設定 remote
git remote -v | findstr "origin" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ⚠️  尚未設定 GitHub repository
    echo.
    echo 請先在 GitHub 建立一個新的 repository，然後輸入以下資訊：
    echo 範例：https://github.com/你的使用者名稱/portfolio.git
    echo.
    set /p github_url="請輸入 GitHub repository 網址: "
    
    if "!github_url!"=="" (
        echo ❌ 未輸入 GitHub 網址，取消部署
        pause
        exit /b 1
    )
    
    git remote add origin !github_url!
)

REM 推送到 GitHub
echo.
echo 🚀 推送到 GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ⚠️  推送失敗，可能需要先拉取遠端變更
    echo 嘗試強制推送...
    set /p force="是否要強制推送？這會覆蓋遠端的變更 (y/N): "
    if /i "!force!"=="y" (
        git push -u origin main --force
    ) else (
        echo 取消推送
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo ✅ 成功推送到 GitHub！
echo ========================================
echo.
echo 📋 下一步：
echo 1. 前往 https://railway.app/
echo 2. 使用 GitHub 登入
echo 3. 選擇 "Deploy from GitHub repo"
echo 4. 選擇您的 portfolio repository
echo 5. 按照 README_DEPLOY.md 的指示完成部署
echo.
echo 📄 詳細部署指南請參考：README_DEPLOY.md
echo.
pause

