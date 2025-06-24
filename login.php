<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 資料庫連線
$conn = mysqli_connect("172.20.10.2", "teammate1", "securepass123", "ephortfolio");
if (!$conn) {
    die("資料庫連線失敗");
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST["email"] ?? '');
    $password = $_POST["password"] ?? '';
    $role = trim($_POST["role"] ?? '');

    if (empty($email) || empty($password) || empty($role)) {
        echo "<script>alert('所有欄位必須填寫');window.history.back();</script>";
        $conn->close();
        exit;
    }

    // 根據角色選擇資料表
    if ($role == "student") {
        $sql = "SELECT student_id, name, email, password_hash FROM students WHERE email = ?";
    } else if ($role == "admin") {
        $sql = "SELECT admin_id, name, email, password_hash FROM admins WHERE email = ?";
    } else if ($role == "company") {
        $sql = "SELECT company_id, name, email, password_hash FROM companies WHERE email = ?";
    } else {
        echo "<script>alert('角色選擇錯誤');window.history.back();</script>";
        $conn->close();
        exit;
    }

    $stmt = $conn->prepare($sql);
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
                $_SESSION["student_id"] = $row["student_id"];
                header("Location: student/student_dashboard_view.php");
                exit();
            } else if ($role == "admin") {
                $_SESSION["admin_id"] = $row["admin_id"];
                header("Location: admin/admin_dashboard.php");
                exit();
            } else if ($role == "company") {
                $_SESSION["email"] = $row["email"];
                $_SESSION["company_id"] = $row["company_id"];
                header("Location: enterprise/enterprise_dashboard.php");
                exit();
            }
        } else {
            echo "<script>alert('密碼錯誤，請重新輸入');window.history.back();</script>";
        }
    } else {
        echo "<script>alert('帳號不存在，請確認Email或註冊新帳號');window.history.back();</script>";
    }
} else {
    echo "<script>alert('請用表單登入');window.location.href='login.html';</script>";
}

$conn->close();
?>
