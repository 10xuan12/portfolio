<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "開始測試登入...<br>";

// 基本資料庫連線
$servername = "172.20.10.2";
$username = "teammate1";
$password = "securepass123";
$dbname = "ephortfolio";

try {
    $conn = mysqli_connect($servername, $username, $password, $dbname);
    if (!$conn) {
        die("連線失敗: " . mysqli_connect_error());
    }
    echo "資料庫連線成功<br>";
    
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        echo "收到POST請求<br>";
        $email = $_POST["email"] ?? '';
        $password = $_POST["password"] ?? '';
        $role = $_POST["role"] ?? '';
        
        echo "Email: $email, Role: $role<br>";
        
        // 簡單查詢測試
        $sql = "SELECT * FROM students WHERE email = ?";
        $stmt = $conn->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                echo "找到帳號<br>";
                $row = $result->fetch_assoc();
                if (password_verify($password, $row["password_hash"])) {
                    echo "密碼正確，登入成功！<br>";
                    session_start();
                    $_SESSION["role"] = $role;
                    $_SESSION["email"] = $row["email"];
                    $_SESSION["name"] = $row["name"];
                    echo "Session已設定<br>";
                } else {
                    echo "密碼錯誤<br>";
                }
            } else {
                echo "帳號不存在<br>";
            }
        } else {
            echo "SQL準備失敗<br>";
        }
    } else {
        echo "非POST請求<br>";
    }
    
} catch (Exception $e) {
    echo "錯誤: " . $e->getMessage() . "<br>";
}

$conn->close();
?> 