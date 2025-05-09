<?php
namespace Config;

use PDO;
use PDOException;

class EnterpriseDB {
    private PDO $pdo;

    public function __construct() {
        $host     = 'localhost';
        $dbName   = 'enterprise_portal';  // ← 這是你的資料庫名稱
        $user     = 'root';               // ← XAMPP 預設
        $password = '';
        $charset  = 'utf8mb4';

        $dsn = "mysql:host=$host;dbname=$dbName;charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $this->pdo = new PDO($dsn, $user, $password, $options);
        } catch (PDOException $e) {
            echo '資料庫連線失敗: ' . htmlspecialchars($e->getMessage());
            exit;
        }
    }

    public function getConnection(): PDO {
        return $this->pdo;
    }
}
