<?php
require '../includes/db_connect.php'; // 資料庫連線

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 接收學生輸入的資料
    $name = $_POST['name'];
    $student_id = $_POST['student_id'];
    $gender = $_POST['gender'];
    $birth = isset($_POST['birth']) ? $_POST['birth'] : null;
    $department = $_POST['department'];
    $grade = $_POST['grade'];
    $phone = $_POST['phone'];
    $email = $_POST['email'];
    $address = $_POST['address'];

    // 新增欄位
    $github = $_POST['github'] ?? null;
    $instagram = $_POST['instagram'] ?? null;
    $facebook = $_POST['facebook'] ?? null;
    $bio = $_POST['bio'] ?? null;
    $professional_background = $_POST['professional_background'] ?? null;
    $skills = $_POST['skills'] ?? null;
    $languages = $_POST['languages'] ?? null;
    $school = $_POST['school'] ?? null;

    // 處理頭像上傳
    $profile_picture_path = null;
    if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] == 0) {
        $upload_dir = 'uploads/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true); // 若目錄不存在則建立
        }
        $profile_picture_name = time() . "_" . basename($_FILES['profile_picture']['name']);
        $profile_picture_path = $upload_dir . $profile_picture_name;
        move_uploaded_file($_FILES['profile_picture']['tmp_name'], $profile_picture_path);
    }

    // 儲存 student_id 到 students 表（若不存在就新增）
    $insert_student_sql = "INSERT INTO students (student_id, email) VALUES (?, ?) 
                           ON DUPLICATE KEY UPDATE email = VALUES(email)";
    if ($stmt = $conn->prepare($insert_student_sql)) {
        $stmt->bind_param("is", $student_id, $email);
        $stmt->execute();
        $stmt->close();
    } else {
        echo json_encode(["status" => "error", "message" => "插入學生基本資料失敗。"]);
        exit;
    }

    // 插入資料到 student_profiles 表
    $sql = "INSERT INTO student_profiles 
                (name,student_id, gender, birth, department, grade, phone, email, address, profile_picture, 
                 github, instagram, facebook, bio, professional_background, skills, languages, school)
            VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("isssssssssssssssss", 
            $name, $student_id, $gender, $birth, $department, $grade, $phone, $email, $address, $profile_picture_path, 
            $github, $instagram, $facebook, $bio, $professional_background, $skills, $languages, $school
        );

        if ($stmt->execute()) {
            session_write_close();
            header("Location: /portfolio/student/student_dashboard_view.php");
            exit;
        } else {
            echo json_encode(["status" => "error", "message" => "儲存學生資料失敗！請檢查資料。"]);
        }

        $stmt->close();
    } else {
        echo json_encode(["status" => "error", "message" => "準備儲存學生資料時發生錯誤。"]);
    }

    $conn->close();
} else {
    echo json_encode(["status" => "error", "message" => "請求方式錯誤！"]);
}
?>
