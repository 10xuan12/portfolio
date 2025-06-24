<?php
require_once 'includes/db_connect.php'; // 確保這個檔案連接到 MySQL
global $conn;
if (!$conn || !$conn->ping()) {
    die("資料庫連線已關閉，請檢查 db_connect.php 或其他程式碼有無提前關閉連線。");
}
echo "1. 連線OK<br>";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    echo "2. POST 請求<br>";
    $email = $_POST["email"];
    $password = $_POST["password"];
    $role = trim($_POST["role"]);
    echo "3. 取得POST資料: $email, $role<br>";

    if (empty($email) || empty($password) || empty($role)) {
        echo json_encode(["status" => "error", "message" => "所有欄位必須填寫"]);
        exit;
    }
    echo "4. 欄位檢查OK<br>";

    // 根據角色選擇不同的資料表和欄位名稱
    if ($role == "student") {
        $sql = "SELECT * FROM students WHERE email = ?";
    } else if ($role == "admin") {
        $sql = "SELECT * FROM admins WHERE email = ?";
    } else if ($role == "company") {
        $sql = "SELECT * FROM companies WHERE email = ?";
    }
    echo "5. SQL: $sql<br>";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        die("SQL預備失敗: " . $conn->error);
    }
    echo "6. SQL預備OK<br>";

    $stmt->bind_param("s", $email);
    $stmt->execute();
    echo "7. SQL執行OK<br>";

    $result = $stmt->get_result();
    echo "8. 取得查詢結果<br>";

    if ($row = $result->fetch_assoc()) {
        echo "9. 查到資料<br>";
        if (password_verify($password, $row["password_hash"])) {
            echo "10. 密碼正確<br>";
            session_start();
            $_SESSION["role"] = $role;
            $_SESSION["email"] = $row["email"];
            $_SESSION["name"] = $row["name"];

            // 根據角色選擇對應的 ID 欄位
            if ($role == "student") {
                $_SESSION["email"] = $row["email"];
                echo "11. 導向學生dashboard<br>";
                header("Location: student/student_dashboard_view.php");
                exit();
            } else if ($role == "admin") {
                $_SESSION["admin_id"] = $row["admin_id"];
                echo "11. 導向admin dashboard<br>";
                header("Location: admin/admin_dashboard.php");
                exit();
            } else if ($role == "company") {
                $_SESSION["company_id"] = $row["company_id"];
                echo "11. 導向company dashboard<br>";
                header("Location: company/company_dashboard.php");
                exit();
            }

            // 回傳登入成功並包含角色資訊
            echo json_encode(["status" => "success", "role" => $role, "message" => "登入成功！"]);
        } else {
            echo "11. 密碼錯誤<br>";
            echo json_encode(["status" => "error", "message" => "密碼錯誤"]);
        }
    } else {
        echo "12. 查無此帳號<br>";
        echo json_encode(["status" => "error", "message" => "帳號不存在"]);
    }
} else {
    echo "13. 非POST請求<br>";
    echo json_encode(["status" => "error", "message" => "請求方式錯誤"]);
}
?>
