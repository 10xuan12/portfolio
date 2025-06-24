<?php
echo "開始測試...<br>";
echo "時間: " . date('H:i:s') . "<br>";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    echo "收到POST請求<br>";
    echo "Email: " . ($_POST["email"] ?? '無') . "<br>";
    echo "Role: " . ($_POST["role"] ?? '無') . "<br>";
    echo "Password: " . (isset($_POST["password"]) ? '有輸入' : '無') . "<br>";
} else {
    echo "非POST請求<br>";
}

echo "測試完成<br>";
echo "結束時間: " . date('H:i:s') . "<br>";
$conn->close();
?> 