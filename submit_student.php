<?php
require 'includes/db_connect.php'; // 載入資料庫連線

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 取得表單資料
    $name = $_POST['name'];
    $gender = $_POST['gender'];
    $birthday = $_POST['birthday'];
    $student_id = $_POST['student_id'];
    $department = $_POST['department'];
    $grade = $_POST['grade'];
    $phone = $_POST['phone'];
    $email = $_POST['email'];
    $address = $_POST['address'];

    // 處理頭像上傳
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] == 0) {
        $avatar = $_FILES['avatar'];
        $avatar_name = time() . "_" . $avatar['name'];
        $avatar_path = 'uploads/' . $avatar_name;
        move_uploaded_file($avatar['tmp_name'], $avatar_path);
    } else {
        $avatar_path = null;
    }

    // 準備 SQL 查詢
    $sql = "INSERT INTO students (name, gender, birthday, student_id, department, grade, phone, email, address, avatar) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("ssssssssss", $name, $gender, $birthday, $student_id, $department, $grade, $phone, $email, $address, $avatar_path);

        if ($stmt->execute()) {
            echo "資料已儲存成功！";
        } else {
            echo "儲存資料時發生錯誤。";
        }

        $stmt->close();
    } else {
        echo "資料庫查詢準備失敗。";
    }

    $conn->close();
} else {
    echo "請求方法錯誤！";
}
?>
