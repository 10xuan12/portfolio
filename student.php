<?php
include 'db.connect.php';

// 處理 GET 請求，取得學生資料
if (isset($_GET['student_id'])) {
    $student_id = $_GET['student_id'];

    $sql = "SELECT name, major, bio, status FROM students WHERE student_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $student = $result->fetch_assoc();
        echo json_encode($student);
    } else {
        echo json_encode(['error' => '學生資料不存在']);
    }
}

// 處理 POST 請求，更新學生資料
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_POST['student_id'], $_POST['name'], $_POST['major'], $_POST['bio'])) {
        // 更新學生基本資料
        $student_id = $_POST['student_id'];
        $name = $_POST['name'];
        $major = $_POST['major'];
        $bio = $_POST['bio'];

        $sql = "UPDATE students SET name = ?, major = ?, bio = ? WHERE student_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssi", $name, $major, $bio, $student_id);

        if ($stmt->execute()) {
            echo json_encode(['message' => '資料更新成功']);
        } else {
            echo json_encode(['error' => '資料更新失敗']);
        }
    } elseif (isset($_POST['status'], $_POST['student_id'])) {
        // 更新學生在線狀態
        $status = $_POST['status'];
        $student_id = $_POST['student_id'];

        $sql = "UPDATE students SET status = ? WHERE student_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $status, $student_id);

        if ($stmt->execute()) {
            echo json_encode(['message' => '狀態更新成功']);
        } else {
            echo json_encode(['error' => '狀態更新失敗']);
        }
    } else {
        echo json_encode(['error' => '缺少必要的資料']);
    }
}
?>
