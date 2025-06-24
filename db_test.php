<?php
echo "開始資料庫測試...<br>";
echo "時間: " . date('H:i:s') . "<br>";

// 步驟1：基本連線
echo "步驟1：建立連線...<br>";
$servername = "172.20.10.2";
$username = "teammate1";
$password = "securepass123";
$dbname = "ephortfolio";

$conn = mysqli_connect($servername, $username, $password, $dbname);
if (!$conn) {
    die("連線失敗: " . mysqli_connect_error());
}
echo "連線成功<br>";

// 步驟2：檢查表單資料
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    echo "步驟2：檢查POST資料...<br>";
    $email = $_POST["email"] ?? '';
    $role = $_POST["role"] ?? '';
    echo "Email: $email, Role: $role<br>";
    
    // 步驟3：簡單查詢
    echo "步驟3：執行查詢...<br>";
    $sql = "SELECT COUNT(*) as count FROM students WHERE email = ?";
    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        echo "查詢結果：找到 " . $row['count'] . " 筆資料<br>";
    } else {
        echo "SQL準備失敗<br>";
    }
} else {
    echo "非POST請求<br>";
}

echo "測試完成<br>";
echo "結束時間: " . date('H:i:s') . "<br>";
$conn->close();
?> 