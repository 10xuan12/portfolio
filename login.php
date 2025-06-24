<?php
require 'test_db_connection.php';
global $conn; // 確保這個檔案連接到 MySQL
if (!$conn || !$conn->ping()) {
    die("資料庫連線已關閉，請檢查 db_connect.php 或其他程式碼有無提前關閉連線。");
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST["email"];
    $password = $_POST["password"];
    $role = trim($_POST["role"]);

    if (empty($email) || empty($password) || empty($role)) {
        echo json_encode(["status" => "error", "message" => "所有欄位必須填寫"]);
        exit;
    }

    // 根據角色選擇不同的資料表和欄位名稱
    if ($role == "student") {
        $sql = "SELECT * FROM students WHERE email = ?";
    } else if ($role == "admin") {
        $sql = "SELECT * FROM admins WHERE email = ?";
    } else if ($role == "company") {
        $sql = "SELECT * FROM companies WHERE email = ?";
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

            // 根據角色選擇對應的 ID 欄位
            if ($role == "student") {
                $_SESSION["email"] = $row["email"];
                header("Location: student/student_dashboard_view.php");
                exit();
            } else if ($role == "admin") {
                $_SESSION["admin_id"] = $row["admin_id"];
                header("Location: admin/admin_dashboard.php");
                exit();
            } else if ($role == "company") {
                $_SESSION["company_id"] = $row["company_id"];
                header("Location: company/company_dashboard.php");
                exit();
            }

            // 回傳登入成功並包含角色資訊
            echo json_encode(["status" => "success", "role" => $role, "message" => "登入成功！"]);
        } else {
            echo json_encode(["status" => "error", "message" => "密碼錯誤"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "帳號不存在"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "請求方式錯誤"]);
}
?>
