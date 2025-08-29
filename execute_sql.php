<?php
// 執行 SQL 腳本的 PHP 文件
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "開始執行企業端資料庫表格創建...\n";

// 使用現有的資料庫連線設定
require_once 'includes/db_connect.php';

try {
    if (!$conn || $conn->connect_error) {
        throw new Exception("資料庫連線失敗");
    }
    
    echo "資料庫連線成功！\n";
    
    // 讀取 SQL 文件
    $sql_file = 'database/enterprise_tables.sql';
    if (!file_exists($sql_file)) {
        throw new Exception("SQL 文件不存在: $sql_file");
    }
    
    $sql_content = file_get_contents($sql_file);
    if ($sql_content === false) {
        throw new Exception("無法讀取 SQL 文件");
    }
    
    echo "SQL 文件讀取成功，開始執行...\n";
    
    // 分割 SQL 語句（以分號結尾）
    $sql_statements = array_filter(
        array_map('trim', explode(';', $sql_content)),
        function($stmt) { return !empty($stmt) && !preg_match('/^--/', $stmt); }
    );
    
    $success_count = 0;
    $error_count = 0;
    
    foreach ($sql_statements as $statement) {
        if (empty(trim($statement))) continue;
        
        try {
            $result = $conn->query($statement);
            if ($result) {
                echo "✓ 執行成功: " . substr($statement, 0, 50) . "...\n";
                $success_count++;
            } else {
                echo "✗ 執行失敗: " . $conn->error . "\n";
                echo "語句: " . substr($statement, 0, 100) . "...\n";
                $error_count++;
            }
        } catch (Exception $e) {
            echo "✗ 執行錯誤: " . $e->getMessage() . "\n";
            echo "語句: " . substr($statement, 0, 100) . "...\n";
            $error_count++;
        }
    }
    
    echo "\n執行完成！\n";
    echo "成功執行: $success_count 個語句\n";
    echo "執行失敗: $error_count 個語句\n";
    
    // 檢查表格是否創建成功
    echo "\n檢查創建的表格：\n";
    $tables = ['jobs', 'job_applications', 'enterprise_views', 'enterprise_contacts', 'enterprise_bookmarks', 'enterprise_analytics'];
    
    foreach ($tables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        if ($result && $result->num_rows > 0) {
            echo "✓ 表格 '$table' 存在\n";
        } else {
            echo "✗ 表格 '$table' 不存在\n";
        }
    }
    
    $conn->close();
    
} catch (Exception $e) {
    echo "錯誤: " . $e->getMessage() . "\n";
}
?>
