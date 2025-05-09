<?php
// testpdo.php 放在 portfolio/enterprise 下
require __DIR__ . '/config/enterprise.php';
try {
    $db  = new \Config\EnterpriseDB();
    $pdo = $db->getConnection();
    echo "✅ PDO connected successfully.\n";
} catch (\Exception $e) {
    echo "❌ PDO connection failed:\n", $e->getMessage(), "\n";
}
