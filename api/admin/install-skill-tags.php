<?php
/**
 * 安裝技能標籤表
 * 一次性執行腳本
 * 
 * 使用方法：
 * 訪問：https://您的網址/api/admin/install-skill-tags.php
 * 執行完成後請刪除此檔案
 */

header('Content-Type: text/html; charset=utf-8');

require_once '../config.php';

$results = [];
$errors = [];

try {
    // 讀取 SQL 檔案
    $sqlFile = __DIR__ . '/../../database/create_skill_tags_table.sql';
    
    if (!file_exists($sqlFile)) {
        throw new Exception('找不到 SQL 檔案：' . $sqlFile);
    }
    
    $sqlContent = file_get_contents($sqlFile, false, null, 0, filesize($sqlFile));
    
    // 移除註解
    $sqlContent = preg_replace('/--.*$/m', '', $sqlContent);
    $sqlContent = preg_replace('/\/\*.*?\*\//s', '', $sqlContent);
    
    // 分割 SQL 語句
    $sqlStatements = array_filter(
        array_map('trim', explode(';', $sqlContent)),
        function($stmt) { return !empty($stmt) && strlen($stmt) > 10; }
    );
    
    global $conn;
    $db = $conn;
    
    if (!$db || $db->connect_error) {
        throw new Exception('資料庫連接失敗：' . ($db->connect_error ?? '未知錯誤'));
    }
    
    $successCount = 0;
    $skipCount = 0;
    
    foreach ($sqlStatements as $index => $statement) {
        $statement = trim($statement);
        if (empty($statement) || strlen($statement) < 10) continue;
        
        try {
            if ($db->query($statement)) {
                $successCount++;
                $results[] = [
                    'status' => 'success',
                    'message' => '語句 ' . ($index + 1) . ' 執行成功',
                    'affected_rows' => $db->affected_rows
                ];
            } else {
                // 檢查是否為重複鍵錯誤（可忽略）
                $errorMsg = $db->error;
                if (strpos($errorMsg, 'Duplicate entry') !== false || 
                    strpos($errorMsg, 'Duplicate key') !== false ||
                    strpos($errorMsg, 'already exists') !== false) {
                    $skipCount++;
                    $results[] = [
                        'status' => 'skipped',
                        'message' => '語句 ' . ($index + 1) . ' 已存在，已跳過'
                    ];
                } else {
                    throw new Exception($errorMsg);
                }
            }
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') !== false) {
                $skipCount++;
            } else {
                $errors[] = [
                    'statement' => $index + 1,
                    'error' => $e->getMessage()
                ];
            }
        }
    }
    
    // 驗證安裝結果
    $checkQuery = "SELECT COUNT(*) as count FROM skill_tags WHERE is_active = 1";
    $checkResult = $db->query($checkQuery);
    $tagCount = 0;
    if ($checkResult) {
        $row = $checkResult->fetch_assoc();
        $tagCount = $row['count'] ?? 0;
    }
    
    // 顯示結果
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>技能標籤表安裝完成</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #667eea; margin-bottom: 20px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat-box { flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
            .stat-label { color: #666; margin-top: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>✅ 技能標籤表安裝完成</h1>
            
            <div class="stats">
                <div class="stat-box">
                    <div class="stat-number"><?php echo $successCount; ?></div>
                    <div class="stat-label">成功執行</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number"><?php echo $skipCount; ?></div>
                    <div class="stat-label">已跳過</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number"><?php echo count($errors); ?></div>
                    <div class="stat-label">錯誤</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number"><?php echo $tagCount; ?></div>
                    <div class="stat-label">標籤數量</div>
                </div>
            </div>
            
            <?php if ($tagCount > 0): ?>
            <div class="success">
                <strong>✅ 安裝成功！</strong><br>
                資料庫中已有 <strong><?php echo $tagCount; ?></strong> 個啟用的技能標籤。
            </div>
            <?php endif; ?>
            
            <?php if (!empty($errors)): ?>
            <div class="error">
                <strong>⚠️ 發生錯誤：</strong>
                <ul>
                    <?php foreach ($errors as $error): ?>
                    <li>語句 <?php echo $error['statement']; ?>: <?php echo htmlspecialchars($error['error']); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php endif; ?>
            
            <div class="info">
                <strong>📝 下一步：</strong>
                <ol>
                    <li>驗證標籤：訪問 <code>/api/student/skill-tags.php?action=get_tags</code></li>
                    <li>在上傳作品頁面檢查標籤是否顯示</li>
                    <li><strong>重要：執行完成後請刪除此檔案</strong></li>
                </ol>
            </div>
        </div>
    </body>
    </html>
    <?php
    
} catch (Exception $e) {
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>安裝失敗</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
        </style>
    </head>
    <body>
        <div class="error">
            <h2>❌ 安裝失敗</h2>
            <p><strong>錯誤訊息：</strong> <?php echo htmlspecialchars($e->getMessage()); ?></p>
        </div>
    </body>
    </html>
    <?php
}
?>

