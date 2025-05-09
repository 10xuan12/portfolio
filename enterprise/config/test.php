<?php
// 請確認這個 require 路徑對應到你的連線設定檔
require __DIR__ . '/config/enterprise.php';

// 假設你在 enterprise.php 裡面把 mysqli 實例存在 $conn
if (isset($conn) && $conn instanceof mysqli) {
    if ($conn->connect_error) {
        echo '❌ MySQL 連線失敗：' . htmlspecialchars($conn->connect_error);
    } else {
        echo '✅ MySQL 連線成功！';
    }
} else {
    echo '⚠️ 無法找到 $conn 或設定不是 mysqli 物件。';
}