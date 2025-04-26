<?php
session_start(); // 確保在開頭啟動 session
require '../includes/db_connect.php';  // 連接資料庫

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $name = $_POST['name'];
        $description = $_POST['description'];

        // 處理圖片
        $imagePath = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
            $uploadDir = 'uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $fileName = time() . '_' . basename($_FILES['image']['name']);
            $targetPath = $uploadDir . $fileName;
            move_uploaded_file($_FILES['image']['tmp_name'], $targetPath);
            $imagePath = $targetPath;
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
        'message' => $e->getMessage()
    ]);
    exit();
}
?>
