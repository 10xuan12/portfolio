<?php
session_start(); // 開啟 session
require '../includes/db_connect.php'; // 資料庫連線

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $name = trim($_POST['name']);
        $description = trim($_POST['description']);

        // 預設圖片路徑
        $imagePath = null;

        // 如果有上傳圖片
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../uploads/'; // 儲存到上層 uploads 資料夾
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // 取得副檔名並過濾
            $fileInfo = pathinfo($_FILES['image']['name']);
            $extension = strtolower($fileInfo['extension']);
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

            if (!in_array($extension, $allowedExtensions)) {
                echo json_encode([
                    'success' => false,
                    'message' => '只允許上傳 JPG、PNG、GIF、WEBP 格式的圖片'
                ]);
                exit();
            }

            // 新檔名避免重複 (用時間戳加亂數)
            $newFileName = time() . '_' . bin2hex(random_bytes(5)) . '.' . $extension;
            $targetPath = $uploadDir . $newFileName;

            if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                // 儲存相對路徑（給前端用）
                $imagePath = 'uploads/' . $newFileName;
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => '圖片上傳失敗，請稍後再試。'
                ]);
                exit();
            }
        }

        // 寫入資料庫
        $stmt = $pdo->prepare("INSERT INTO categories (name, description, image) VALUES (?, ?, ?)");
        $stmt->execute([$name, $description, $imagePath]);

        $newCategory = [
            'name' => $name,
            'description' => $description,
            'image' => $imagePath
        ];

        echo json_encode([
            'success' => true,
            'category' => $newCategory
        ]);
        exit();
    }

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => '資料庫錯誤：' . $e->getMessage()
    ]);
    exit();
}
?>
