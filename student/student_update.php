<?php
session_start();
require '../includes/db_connect.php';

if (!isset($_SESSION['email'])) {
    header("Location: ../login.php");
    exit();
}

$email = $_SESSION['email'];

// 取得表單資料
$name = $_POST['name'];
$department = $_POST['department'];
$grade = $_POST['grade'];
$phone = $_POST['phone'];
$email = $_POST['email'];

// ✅ 驗證 email 格式
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "電子郵件格式不正確。<a href='student_edit_form.php'>返回</a>";
    exit();
}

// ✅ 檢查 email 是否已被其他學生使用
$sql_check = "SELECT student_id FROM student_profiles WHERE email = ? AND student_id != ?";
$stmt_check = $conn->prepare($sql_check);
$stmt_check->bind_param("ss", $email, $student_id);
$stmt_check->execute();
$result_check = $stmt_check->get_result();

if ($result_check->num_rows > 0) {
    echo "此電子郵件已被其他帳號使用。<a href='student_edit_form.php'>返回</a>";
    exit();
}
$stmt_check->close();

// ✅ 處理頭像上傳
$profile_picture_filename = null;

if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {
    $upload_dir = '../uploads/';
    $ext = pathinfo($_FILES['profile_picture']['name'], PATHINFO_EXTENSION);
    $profile_picture_filename = uniqid('profile_picture_', true) . '.' . $ext;
    $target_path = __DIR__ . "/uploads/" . $profile_picture_filename;
;

    // 確保目錄存在
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    // 儲存頭像
    move_uploaded_file($_FILES['profile_picture']['tmp_name'], $target_path);

    // 順便刪除舊頭像（如果有）
    $sql_old = "SELECT profile_picture FROM student_profiles WHERE student_id = ?";
    $stmt_old = $conn->prepare($sql_old);
    $stmt_old->bind_param("s", $student_id);
    $stmt_old->execute();
    $result_old = $stmt_old->get_result();
    if ($row_old = $result_old->fetch_assoc()) {
        if (!empty($row_old['profile_picture']) && file_exists($upload_dir . $row_old['profile_picture'])) {
            unlink($upload_dir . $row_old['profile_picture']);
        }
    }
    $stmt_old->close();
}

// ✅ 更新資料
if ($profile_picture_filename) {
    $sql = "UPDATE student_profiles SET name = ?, department = ?, grade = ?, phone = ?, email = ?, profile_picture = ? WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssssss", $name, $department, $grade, $phone, $email, $profile_picture_filename, $email);
} else {
    $sql = "UPDATE student_profiles SET name = ?, department = ?, grade = ?, phone = ?, email = ? WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssss", $name, $department, $grade, $phone, $email, $email);
}

if ($stmt->execute()) {
    header("Location: student_dashboard_view.php?updated=true");
} else {
    echo "更新失敗：" . $conn->error;
}

$stmt->close();
$conn->close();
?>
