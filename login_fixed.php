<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "開始登入流程...<br>";

// 資料庫連線
$servername = "172.20.10.2";
$username = "teammate1";
$password = "securepass123";
$dbname = "ephortfolio";

$conn = mysqli_connect($servername, $username, $password, $dbname);
if (!$conn) {
    die("連線失敗: " . mysqli_connect_error());
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST["email"];
    $password = $_POST["password"];
    $role = trim($_POST["role"]);
    
    echo "處理登入：$email, $role<br>";

    if (empty($email) || empty($password) || empty($role)) {
        echo json_encode(["status" => "error", "message" => "所有欄位必須填寫"]);
        exit;
    }

    // 根據角色選擇資料表
    if ($role == "student") {
        $sql = "SELECT * FROM students WHERE email = ?";
    } else if ($role == "admin") {
        $sql = "SELECT * FROM admins WHERE email = ?";
    } else if ($role == "company") {
        $sql = "SELECT * FROM companies WHERE email = ?";
    }

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        die("SQL準備失敗: " . $conn->error);
    }

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        if (password_verify($password, $row["password_hash"])) {
            session_start();
            $_SESSION["role"] = $role;
            $_SESSION["email"] = $row["email"];
            $_SESSION["name"] = $row["name"];

            if ($role == "student") {
                header("Location: student/student_dashboard_view.php");
                exit();
            } else if ($role == "admin") {
                header("Location: admin/admin_dashboard.php");
                exit();
            } else if ($role == "company") {
                header("Location: company/company_dashboard.php");
                exit();
            }
        } else {
            echo json_encode(["status" => "error", "message" => "密碼錯誤"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "帳號不存在"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "請求方式錯誤"]);
}

$conn->close();
?> 