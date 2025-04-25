<?php
session_start(); // 確保在開頭啟動 session
require '../includes/db_connect.php';  // 連接資料庫

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 接收學生輸入的資料
    $name = $_POST['name'] ?? null;
    $student_id = $_POST['student_id'] ?? null;
    $gender = $_POST['gender'] ?? null;
    $birth = $_POST['birth'] ?? null;
    $department = $_POST['department'] ?? null;
    $grade = $_POST['grade'] ?? null;
    $phone = $_POST['phone'] ?? null;
    $email = $_POST['email'] ?? null;
    $address = $_POST['address'] ?? null;

    // 社群與其他欄位
    $github = $_POST['github'] ?? 'N/A';
    $instagram = $_POST['instagram'] ?? 'N/A';
    $facebook = $_POST['facebook'] ?? 'N/A';
    $bio = $_POST['bio'] ?? 'N/A';
    $professional_background = $_POST['professional_background'] ?? 'N/A';
    $skills = $_POST['skills'] ?? 'N/A';
    $languages = $_POST['languages'] ?? 'N/A';
    $school = $_POST['school'] ?? 'N/A';

    // 處理頭像上傳
    $profile_picture_path = null;
    if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] == 0) {
        $upload_dir = 'uploads/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        $ext = pathinfo($_FILES['profile_picture']['name'], PATHINFO_EXTENSION);
        $profile_picture_name = time() . "_" . uniqid() . "." . $ext;
        $profile_picture_path = $upload_dir . $profile_picture_name;
        move_uploaded_file($_FILES['profile_picture']['tmp_name'], $profile_picture_path);
    }

    // 檢查是否有必要的欄位為空
    if (empty($name) || empty($student_id) || empty($email)) {
        echo "請填寫完整資料！";
        exit(); // 停止執行
    }

    // 插入或更新 students 表，確保學號與 email 都有資料
    $insert_student_sql = "INSERT INTO students (student_id, email, name)
                           VALUES (?, ?, ?)
                           ON DUPLICATE KEY UPDATE 
                               email = VALUES(email),
                               name = VALUES(name)";
    $stmt = $conn->prepare($insert_student_sql);
    if ($stmt) {
        $stmt->bind_param("iss", $student_id, $email, $name);
        $stmt->execute();
        $stmt->close();
    } else {
        echo json_encode(["status" => "error", "message" => "插入 students 表失敗：" . $conn->error]);
        exit;
    }

    // 插入或更新 student_profiles 表
    $sql = "INSERT INTO student_profiles 
                (student_id, name, gender, birth, department, grade, phone, email, address, profile_picture,
                github, instagram, facebook, bio, professional_background, skills, languages, school)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                gender = VALUES(gender),
                birth = VALUES(birth),
                department = VALUES(department),
                grade = VALUES(grade),
                phone = VALUES(phone),
                email = VALUES(email),
                address = VALUES(address),
                profile_picture = VALUES(profile_picture),
                github = VALUES(github),
                instagram = VALUES(instagram),
                facebook = VALUES(facebook),
                bio = VALUES(bio),
                professional_background = VALUES(professional_background),
                skills = VALUES(skills),
                languages = VALUES(languages),
                school = VALUES(school),
                updated_at = NOW()";

    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param("isssssssssssssssss",
            $student_id, $name, $gender, $birth, $department, $grade, $phone, $email, $address, $profile_picture_path,
            $github, $instagram, $facebook, $bio, $professional_background, $skills, $languages, $school
        );

        if ($stmt->execute()) {
            // 更新資料庫後檢查 session 資料
            $_SESSION['student_id'] = $student_id; // 儲存學生 ID 至 session
            $_SESSION['email'] = $email;           // 儲存 email 至 session
            $_SESSION['name'] = $name;
            // 跳轉到學生儀表板頁面
            header("Location: student_dashboard_view.php");
            exit(); // 確保跳轉後不再執行後續程式
        } else {
            echo json_encode(["status" => "error", "message" => "儲存 student_profiles 失敗：" . $stmt->error]);
        }
        $stmt->close();
    } else {
        echo json_encode(["status" => "error", "message" => "準備儲存 student_profiles 時失敗：" . $conn->error]);
    }

    $conn->close();
}
?>
