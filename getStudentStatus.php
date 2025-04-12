<?php
// getStudentStatus.php
require_once 'db.connect.php'; // 引入資料庫連接

// 確保有提供學生 ID
if (isset($_GET['student_id'])) {
    $student_id = $_GET['student_id'];

    // 查詢學生的狀態（假設 'status' 欄位儲存在線或離線的狀態）
    $sql = "SELECT status FROM students WHERE student_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $student_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // 回傳學生的狀態
        $row = $result->fetch_assoc();
        echo json_encode(['status' => $row['status']]);
    } else {
        // 若找不到學生資料，回傳錯誤
        echo json_encode(['error' => '學生資料不存在']);
    }

    $stmt->close();
} else {
    echo json_encode(['error' => '未提供學生 ID']);
}

$conn->close();
?>
