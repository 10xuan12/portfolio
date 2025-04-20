<?php
require '../includes/db_connect.php'; // 載入資料庫連線

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 從表單取得資料
    $student_id = $_POST['student_id'];
    $gender = $_POST['gender'];
    $birth = isset($_POST['birth']) ? $_POST['birth'] : null;
    $department = $_POST['department'];
    $grade = $_POST['grade'];
    $phone = $_POST['phone'];
    $email = $_POST['email'];
    $address = $_POST['address'];

    // 新增的欄位
    $github = isset($_POST['github']) ? $_POST['github'] : null;
    $instagram = isset($_POST['instagram']) ? $_POST['instagram'] : null;
    $facebook = isset($_POST['facebook']) ? $_POST['facebook'] : null;
    $bio = isset($_POST['bio']) ? $_POST['bio'] : null;
    $professional_background = isset($_POST['professional_background']) ? $_POST['professional_background'] : null;
    $skills = isset($_POST['skills']) ? $_POST['skills'] : null;
    $languages = isset($_POST['languages']) ? $_POST['languages'] : null;
    $graduation_school = isset($_POST['graduation_school']) ? $_POST['graduation_school'] : null;

    // 處理頭像上傳
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] == 0) {
        $avatar = $_FILES['avatar'];
        $avatar_name = time() . "_" . $avatar['name'];
        $avatar_path = 'uploads/' . $avatar_name;
        move_uploaded_file($avatar['tmp_name'], $avatar_path);
    } else {
        $avatar_path = null; // 如果沒有上傳頭像，則設為 null
    }

    // 檢查 email 是否已經註冊過
    $check_sql = "SELECT student_id FROM students WHERE email = ?";
    if ($stmt = $conn->prepare($check_sql)) {
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows == 0) {
            // 若該 email 不存在，回傳錯誤訊息
            echo json_encode(["status" => "error", "message" => "此 email 尚未註冊！"]);
            exit;
        }
        $stmt->close();
    } else {
        echo json_encode(["status" => "error", "message" => "資料庫查詢準備失敗。"]);
        exit;
    }

    // 準備 SQL 查詢，插入學生資料到 student_profiles
    $sql = "INSERT INTO student_profiles 
                (student_id, gender, birth, department, grade, phone, email, address, avatar, 
                 github, instagram, facebook, bio, professional_background, skills, languages, graduation_school)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    if ($stmt = $conn->prepare($sql)) {
        // 這裡的 'ssssssssssssssss' 是根據你的欄位數量對應的類型：s 是 string，i 是 int
        $stmt->bind_param("issssssssssssssss", 
            $student_id, $gender, $birth, $department, $grade, $phone, $email, $address, $avatar_path, 
            $github, $instagram, $facebook, $bio, $professional_background, $skills, $languages, $graduation_school);

        if ($stmt->execute()) {
            // 資料儲存成功後轉向 student_dashboard.php
            header("Location: student_dashboard.php");
            exit; // 確保程式執行停止，防止後續程式繼續運行
        } else {
            echo json_encode(["status" => "error", "message" => "儲存資料時發生錯誤。"]);
        }

        $stmt->close();
    } else {
        echo json_encode(["status" => "error", "message" => "資料庫查詢準備失敗。"]);
    }

    $conn->close();
} else {
    echo json_encode(["status" => "error", "message" => "請求方式錯誤！"]);
}
?>
