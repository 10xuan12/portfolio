<?php
require $_SERVER['DOCUMENT_ROOT'] . '/portfolio/enterprise/config/enterprise.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    echo "<h2>🔍 檔案上傳結果：</h2><pre>";
    print_r($_FILES);
    echo "</pre>";
}
?>

<form method="post" enctype="multipart/form-data">
  <label>選擇圖片：<input type="file" name="avatar"></label><br><br>
  <button type="submit">上傳測試</button>
</form>
