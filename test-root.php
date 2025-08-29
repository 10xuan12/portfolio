<?php
echo "根目錄 PHP 測試成功！<br>";
echo "當前時間: " . date('Y-m-d H:i:s') . "<br>";
echo "PHP 版本: " . phpversion() . "<br>";
echo "檔案路徑: " . __FILE__ . "<br>";
echo "當前目錄: " . getcwd() . "<br>";
echo "SERVER_NAME: " . $_SERVER['SERVER_NAME'] . "<br>";
echo "REQUEST_URI: " . $_SERVER['REQUEST_URI'] . "<br>";
echo "SCRIPT_NAME: " . $_SERVER['SCRIPT_NAME'] . "<br>";
?>
