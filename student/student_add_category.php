<?php
session_start(); // 開啟 session
require '../includes/db_connect.php'; // 使用 mysqli 的資料庫連線

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name']);
    $description = trim($_POST['description']);

    // 預設圖片名稱與路徑為 NULL
    $imageName = null;
    $imagePath = null;

    // 如果有上傳圖片
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/'; // 儲存位置
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // 取得副檔名並檢查
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

        // 建立唯一檔名
        $newFileName = time() . '_' . bin2hex(random_bytes(5)) . '.' . $extension;
        $targetPath = $uploadDir . $newFileName;

        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
            // 儲存為相對路徑（開頭加斜線）
            $imageName = $newFileName; // 儲存檔案名稱
            $imagePath = 'uploads/' . $newFileName; // 儲存相對路徑
        } else {
            echo json_encode([
                'success' => false,
                'message' => '圖片上傳失敗，請稍後再試。'
            ]);
            exit();
        }
    }

    // 寫入資料庫
    $stmt = $conn->prepare("INSERT INTO categories (name, description, image, image_path) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $description, $imageName, $imagePath);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'category' => [
                'name' => $name,
                'description' => $description,
                'image' => $imageName,
                'imagepath' => $imagePath
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => '寫入資料庫失敗：' . $stmt->error
        ]);
    }

    $stmt->close();
    $conn->close();
    exit();
}
?>
