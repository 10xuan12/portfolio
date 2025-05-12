<?php
session_start();
require '../includes/db_connect.php';
/*
// 檢查是否已登入
if (!isset($_SESSION['email'])) {
    header("Location: ../login.php");
    exit;
}*/

// 取得分類ID
$category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;

// 暫時設定一個固定的 student_id 用於測試
$student_id = 1; // 這裡先固定為 1，之後再改回使用 session

// 表單送出處理
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => ''];
    
    try {
        $title = trim($_POST['title']);
        $description = trim($_POST['description']);
        $cover_image = '';
        $category_id = isset($_POST['category_id']) ? intval($_POST['category_id']) : 0;
        $student_id = 1; // 暫時固定為 1，之後改回使用 session

        // 開始交易
        $conn->begin_transaction();

        // 處理封面圖片上傳
        if (isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['cover_image']['name'], PATHINFO_EXTENSION);
            $filename = uniqid('cover_', true) . '.' . $ext;
            $upload_dir = __DIR__ . '/uploads/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            $target_path = $upload_dir . $filename;
            if (move_uploaded_file($_FILES['cover_image']['tmp_name'], $target_path)) {
                $cover_image = $filename;
            }
        }

        // 檢查必要欄位
        if (empty($title)) {
            throw new Exception("標題不能為空");
        }
        if (empty($description)) {
            throw new Exception("描述不能為空");
        }
        if ($category_id <= 0) {
            throw new Exception("無效的分類ID");
        }

        // 寫入作品資料
        $sql = "INSERT INTO portfolios (category_id, student_id, title, description, cover_image) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("準備 SQL 語句失敗：" . $conn->error);
        }

        $stmt->bind_param("iisss", $category_id, $student_id, $title, $description, $cover_image);
        
        if (!$stmt->execute()) {
            throw new Exception("執行 SQL 失敗：" . $stmt->error);
        }
        
        $portfolio_id = $conn->insert_id;
        
        if ($portfolio_id <= 0) {
            throw new Exception("無法取得作品ID。SQL 錯誤：" . $conn->error);
        }

        // 處理檔案上傳
        if (isset($_FILES['project_files'])) {
            $files = $_FILES['project_files'];
            $file_count = count($files['name']);

            for ($i = 0; $i < $file_count; $i++) {
                if ($files['error'][$i] === UPLOAD_ERR_OK) {
                    $file_name = $files['name'][$i];
                    $file_type = $files['type'][$i];
                    $file_tmp = $files['tmp_name'][$i];
                    
                    $ext = pathinfo($file_name, PATHINFO_EXTENSION);
                    $new_filename = uniqid('file_', true) . '.' . $ext;
                    
                    $upload_dir = __DIR__ . '/uploads/';
                    $target_path = $upload_dir . $new_filename;
                    
                    if (move_uploaded_file($file_tmp, $target_path)) {
                        $sql = "INSERT INTO files (portfolio_id, file_name, file_type, file_url, uploaded_at) 
                                VALUES (?, ?, ?, ?, NOW())";
                        $stmt = $conn->prepare($sql);
                        if (!$stmt) {
                            throw new Exception("準備檔案 SQL 語句失敗：" . $conn->error);
                        }
                        $file_url = 'uploads/' . $new_filename;
                        $stmt->bind_param("isss", $portfolio_id, $file_name, $file_type, $file_url);
                        
                        if (!$stmt->execute()) {
                            throw new Exception("新增檔案資訊失敗：" . $stmt->error);
                        }
                    }
                }
            }
        }

        // 提交交易
        $conn->commit();
        $response['success'] = true;
        $response['message'] = '作品新增成功';
        $response['portfolio_id'] = $portfolio_id;

    } catch (Exception $e) {
        // 發生錯誤時回滾交易
        $conn->rollback();
        $response['message'] = '新增失敗：' . $e->getMessage();
        
        // 輸出詳細的錯誤資訊（僅用於除錯）
        error_log("Portfolio creation error: " . $e->getMessage());
        error_log("SQL State: " . $conn->sqlstate);
        error_log("Error Code: " . $conn->errno);
        error_log("Error Message: " . $conn->error);
    }

    echo json_encode($response);
    exit;
}
?> 