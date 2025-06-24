<?php
echo "開始測試...<br>";

// 基本連線
$conn = mysqli_connect("172.20.10.2", "teammate1", "securepass123", "ephortfolio");
if (!$conn) {
    die("連線失敗");
}
echo "連線成功<br>";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST["email"];
    $password = $_POST["password"];
    $role = $_POST["role"];
    
    echo "Email: $email<br>";
    echo "Role: $role<br>";
    
    // 只查詢學生表
    $sql = "SELECT password_hash, name FROM students WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows > 0) {
        $stmt->bind_result($password_hash, $name);
        $stmt->fetch();
        if (password_verify($password, $password_hash)) {
            echo "登入成功！<br>";
            session_start();
            $_SESSION["email"] = $email;
            $_SESSION["role"] = $role;
            $_SESSION["name"] = $name;
            echo "Session已設定<br>";
        } else {
            echo "密碼錯誤<br>";
        }
    } else {
        echo "帳號不存在<br>";
    }
    $stmt->close();
} else {
    echo "非POST請求<br>";
}

echo "完成<br>";
$conn->close();
?>