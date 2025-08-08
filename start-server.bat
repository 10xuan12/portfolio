@echo off
echo 正在啟動 Portfolio+ 前端伺服器...
echo.
echo 請選擇要使用的伺服器：
echo 1. Python HTTP 伺服器 (推薦)
echo 2. Node.js HTTP 伺服器
echo 3. PHP 內建伺服器
echo.
set /p choice="請輸入選擇 (1-3): "

cd frontend

if "%choice%"=="1" (
    echo 啟動 Python HTTP 伺服器...
    python -m http.server 8000
) else if "%choice%"=="2" (
    echo 啟動 Node.js HTTP 伺服器...
    npx http-server -p 8000 --cors
) else if "%choice%"=="3" (
    echo 啟動 PHP 內建伺服器...
    php -S localhost:8000
) else (
    echo 無效選擇，使用預設 Python 伺服器...
    python -m http.server 8000
)

pause
