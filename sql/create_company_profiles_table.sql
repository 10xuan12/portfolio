-- 創建 company_profiles 表格
CREATE TABLE IF NOT EXISTS `company_profiles` (
    `company_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT '公司名稱',
    `email` VARCHAR(100) NOT NULL UNIQUE COMMENT '公司電子郵件',
    `password` VARCHAR(255) NOT NULL COMMENT '密碼',
    `logo` VARCHAR(255) DEFAULT NULL COMMENT '公司標誌',
    `address` VARCHAR(255) DEFAULT NULL COMMENT '公司地址',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '聯絡電話',
    `website` VARCHAR(255) DEFAULT NULL COMMENT '公司網站',
    `description` TEXT DEFAULT NULL COMMENT '公司簡介',
    `industry` VARCHAR(100) DEFAULT NULL COMMENT '產業類別',
    `size` VARCHAR(50) DEFAULT NULL COMMENT '公司規模',
    `founded_year` INT DEFAULT NULL COMMENT '成立年份',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入測試資料
INSERT INTO `company_profiles` (`name`, `email`, `password`, `logo`, `address`, `phone`, `website`, `description`, `industry`, `size`, `founded_year`) 
VALUES 
('測試公司', 'test@company.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, '台北市信義區信義路五段7號', '02-12345678', 'https://example.com', '這是一家測試公司', '科技業', '50-100人', 2020); 