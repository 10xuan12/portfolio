<?php
require 'includes/db_connect.php'; // 確保這個檔案連接到 MySQL

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST["email"];
    $password = $_POST["password"];
    $role = trim($_POST["role"]);

    if (empty($email) || empty($password) || empty($role)) {
        echo json_encode(["status" => "error", "message" => "所有欄位必須填寫"]);
        exit;
    }

    if($role == "student"){
        $sql = "SELECT * FROM students WHERE email = ?";
    }else if($role == "admin"){
        $sql = "SELECT * FROM admins WHERE email = ?";
    }else if($role == "company"){
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
            if($role == "student"){
                $_SESSION["user_id"] = $row["student_id"];
            }else if($role == "admin"){
                $_SESSION["user_id"] = $row["admin_id"];
            }else if($role == "company"){
                $_SESSION["user_id"] = $row["company_id"];
            }
            $_SESSION["email"] = $row["email"];
            $_SESSION["name"] = $row["name"];
            
            echo json_encode(["status" => "success", "message" => "登入成功！"]);
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
