<?php
// config/db.php
namespace Config;

use PDO;
use PDOException;

class DB {
    private PDO $pdo;

    public function __construct() {
        // 資料庫參數：請依實際環境調整
        $host     = 'localhost';
        $dbName   = 'enterprise_portal';
        $user     = 'root';
        $password = '';
        $charset  = 'utf8mb4';

        $dsn = "mysql:host={$host};dbname={$dbName};charset={$charset}";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $this->pdo = new PDO($dsn, $user, $password, $options);
        } catch (PDOException $e) {
            // 開發環境可直接顯示，正式環境建議寫入 log
            echo 'Database Connection Failed: ' . htmlspecialchars($e->getMessage());
            exit;
        }
    }

    /**
     * 回傳 PDO 連線物件
     *
     * @return PDO
     */
    public function getConnection(): PDO {
        return $this->pdo;
    }
}
