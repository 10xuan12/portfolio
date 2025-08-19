@echo off
echo Starting Portfolio+ Frontend Server...
echo.
echo Please select a server to use:
echo 1. Python HTTP Server (Recommended)
echo 2. Node.js HTTP Server
echo 3. PHP Built-in Server
echo.
set /p choice="Enter your choice (1-3): "

cd frontend

if "%choice%"=="1" (
    echo Starting Python HTTP Server...
    python -m http.server 8000
) else if "%choice%"=="2" (
    echo Starting Node.js HTTP Server...
    npx http-server -p 8000 --cors
) else if "%choice%"=="3" (
    echo Starting PHP Built-in Server...
    php -S localhost:8000
) else (
    echo Invalid choice, using default Python server...
    python -m http.server 8000
)

pause
