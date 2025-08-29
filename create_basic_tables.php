<?php
// 創建基本資料庫表格的腳本
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "開始創建基本資料庫表格...\n";

// 連線到資料庫
$conn = mysqli_init();
mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 5);

if (mysqli_real_connect($conn, 'localhost:3307', 'root', '', 'eportfolio1')) {
    $conn->set_charset("utf8mb4");
    echo "成功連線到資料庫\n";
    
    // 創建基本表格
    $basic_tables = [
        'users' => "
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('student', 'enterprise', 'admin') NOT NULL DEFAULT 'student',
                status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
                email_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_email (email),
                INDEX idx_role (role),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        
        'student_profiles' => "
            CREATE TABLE IF NOT EXISTS student_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                phone VARCHAR(20),
                address TEXT,
                bio TEXT,
                avatar_url VARCHAR(500),
                resume_url VARCHAR(500),
                graduation_year INT,
                major VARCHAR(100),
                university VARCHAR(100),
                gpa DECIMAL(3,2),
                skills TEXT,
                interests TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        
        'enterprise_profiles' => "
            CREATE TABLE IF NOT EXISTS enterprise_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                company_name VARCHAR(200) NOT NULL,
                industry VARCHAR(100),
                company_size ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+') DEFAULT '1-10',
                website VARCHAR(200),
                phone VARCHAR(20),
                address TEXT,
                description TEXT,
                logo_url VARCHAR(500),
                founded_year INT,
                employee_count INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_id (user_id),
                INDEX idx_company_name (company_name),
                INDEX idx_industry (industry)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        
        'portfolios' => "
            CREATE TABLE IF NOT EXISTS portfolios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                tags TEXT,
                thumbnail_url VARCHAR(500),
                project_url VARCHAR(500),
                github_url VARCHAR(500),
                technologies TEXT,
                duration VARCHAR(100),
                team_size INT DEFAULT 1,
                role VARCHAR(100),
                challenges TEXT,
                solutions TEXT,
                results TEXT,
                is_public BOOLEAN DEFAULT TRUE,
                view_count INT DEFAULT 0,
                like_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_category (category),
                INDEX idx_is_public (is_public),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ",
        
        'portfolio_images' => "
            CREATE TABLE IF NOT EXISTS portfolio_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                portfolio_id INT NOT NULL,
                image_url VARCHAR(500) NOT NULL,
                caption TEXT,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
                INDEX idx_portfolio_id (portfolio_id),
                INDEX idx_sort_order (sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        "
    ];
    
    // 執行創建基本表格
    $success_count = 0;
    $error_count = 0;
    
    foreach ($basic_tables as $table_name => $sql) {
        try {
            $result = $conn->query($sql);
            if ($result) {
                echo "✓ 成功創建表格: $table_name\n";
                $success_count++;
            } else {
                echo "✗ 創建表格失敗: $table_name - " . $conn->error . "\n";
                $error_count++;
            }
        } catch (Exception $e) {
            echo "✗ 創建表格錯誤: $table_name - " . $e->getMessage() . "\n";
            $error_count++;
        }
    }
    
    echo "\n基本表格創建完成！\n";
    echo "成功創建: $success_count 個表格\n";
    echo "創建失敗: $error_count 個表格\n";
    
    // 插入測試用戶
    echo "\n開始插入測試用戶...\n";
    
    // 插入企業用戶
    $enterprise_sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'enterprise')";
    $stmt = $conn->prepare($enterprise_sql);
    $username = 'enterprise_test';
    $email = 'enterprise@test.com';
    $password = password_hash('password123', PASSWORD_DEFAULT);
    $stmt->bind_param("sss", $username, $email, $password);
    
    if ($stmt->execute()) {
        $enterprise_id = $conn->insert_id;
        echo "✓ 插入企業用戶成功，ID: $enterprise_id\n";
        
        // 插入企業資料
        $profile_sql = "INSERT INTO enterprise_profiles (user_id, company_name, industry, company_size, description) VALUES (?, ?, ?, ?, ?)";
        $stmt2 = $conn->prepare($profile_sql);
        $company_name = '測試科技公司';
        $industry = '科技';
        $company_size = '51-200';
        $description = '這是一家測試用的科技公司，專注於軟體開發和創新技術。';
        $stmt2->bind_param("issss", $enterprise_id, $company_name, $industry, $company_size, $description);
        
        if ($stmt2->execute()) {
            echo "✓ 插入企業資料成功\n";
        } else {
            echo "✗ 插入企業資料失敗: " . $stmt2->error . "\n";
        }
        $stmt2->close();
    } else {
        echo "✗ 插入企業用戶失敗: " . $stmt->error . "\n";
    }
    $stmt->close();
    
    // 插入學生用戶
    $student_sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'student')";
    $stmt = $conn->prepare($student_sql);
    $username = 'student_test';
    $email = 'student@test.com';
    $password = password_hash('password123', PASSWORD_DEFAULT);
    $stmt->bind_param("sss", $username, $email, $password);
    
    if ($stmt->execute()) {
        $student_id = $conn->insert_id;
        echo "✓ 插入學生用戶成功，ID: $student_id\n";
        
        // 插入學生資料
        $profile_sql = "INSERT INTO student_profiles (user_id, first_name, last_name, major, university, bio) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt2 = $conn->prepare($profile_sql);
        $first_name = '小明';
        $last_name = '王';
        $major = '資訊管理';
        $university = '測試大學';
        $bio = '我是一名資訊管理系的學生，對軟體開發和資料分析有濃厚興趣。';
        $stmt2->bind_param("isssss", $student_id, $first_name, $last_name, $major, $university, $bio);
        
        if ($stmt2->execute()) {
            echo "✓ 插入學生資料成功\n";
        } else {
            echo "✗ 插入學生資料失敗: " . $stmt2->error . "\n";
        }
        $stmt2->close();
    } else {
        echo "✗ 插入學生用戶失敗: " . $stmt->error . "\n";
    }
    $stmt->close();
    
    // 插入管理員用戶
    $admin_sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'admin')";
    $stmt = $conn->prepare($admin_sql);
    $username = 'admin_test';
    $email = 'admin@test.com';
    $password = password_hash('password123', PASSWORD_DEFAULT);
    $stmt->bind_param("sss", $username, $email, $password);
    
    if ($stmt->execute()) {
        $admin_id = $conn->insert_id;
        echo "✓ 插入管理員用戶成功，ID: $admin_id\n";
    } else {
        echo "✗ 插入管理員用戶失敗: " . $stmt->error . "\n";
    }
    $stmt->close();
    
    $conn->close();
    echo "\n基本資料庫設置完成！\n";
    
} else {
    echo "資料庫連線失敗: " . mysqli_connect_error() . "\n";
}
?>
