#!/bin/bash

echo "正在啟動 Portfolio+ 前端伺服器..."
echo ""
echo "請選擇要使用的伺服器："
echo "1. Python HTTP 伺服器 (推薦)"
echo "2. Node.js HTTP 伺服器"
echo "3. PHP 內建伺服器"
echo ""
read -p "請輸入選擇 (1-3): " choice

cd frontend

case $choice in
    1)
        echo "啟動 Python HTTP 伺服器..."
        python3 -m http.server 8000
        ;;
    2)
        echo "啟動 Node.js HTTP 伺服器..."
        npx http-server -p 8000 --cors
        ;;
    3)
        echo "啟動 PHP 內建伺服器..."
        php -S localhost:8000
        ;;
    *)
        echo "無效選擇，使用預設 Python 伺服器..."
        python3 -m http.server 8000
        ;;
esac
