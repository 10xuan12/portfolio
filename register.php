<?php
header('Content-Type: application/json'); // 確保回應 JSON
require 'includes/db_connect.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = trim($_POST["name"]);
    $email = trim($_POST["email"]);
    $password = trim($_POST["password"]);
    $role = trim($_POST["role"]);


    if (empty($name) || empty($email) || empty($password) || empty($role)) {
        echo json_encode(["status" => "error", "message" => "所有欄位必須填寫"]);
        exit;
    }

    $hashed_password = password_hash($password, PASSWORD_BCRYPT);

    // 檢查 email 是否已存在 依不同角色檢查不同資料表
    $check_sql = "";
    if($role == "student"){
        $check_sql = "SELECT student_id FROM students WHERE email = ?";
    }else if($role == "admin"){
        $check_sql = "SELECT admin_id FROM admins WHERE email = ?";
    }else if($role == "company"){
        $check_sql = "SELECT company_id FROM companies WHERE email = ?";
    }

    $stmt = $conn->prepare($check_sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "該 Email 已被註冊"]);
        exit;
    }

    // 插入新使用者，依據不同角色插入不同資料表
    if($role == "student"){
        $sql = "INSERT INTO students (name, email, password_hash) VALUES (?, ?, ?)";
    }else if($role == "admin"){
        $sql = "INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)";
    }else if($role == "company"){
        $sql = "INSERT INTO companies (name, email, password_hash) VALUES (?, ?, ?)";
    }

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $name, $email, $hashed_password);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "註冊成功"]);
    } else {
        echo json_encode(["status" => "error", "message" => "註冊失敗"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "請求方式錯誤"]);
}
?>
