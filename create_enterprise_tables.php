<?php
// 直接創建企業端資料庫表格的 PHP 腳本
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "開始創建企業端資料庫表格...\n";

// 嘗試多種連線方式，包括端口 3307
$connection_configs = [
    [
        'host' => 'localhost:3307',
        'username' => 'root',
        'password' => '',
        'database' => 'eportfolio1'
    ],
    [
        'host' => '127.0.0.1:3307',
        'username' => 'root',
        'password' => '',
        'database' => 'eportfolio1'
    ],
    [
        'host' => '172.20.10.2',
        'username' => 'teammate1',
        'password' => 'securepass123',
        'database' => 'eportfolio1'
    ]
];

$conn = null;
$connection_error = '';

foreach ($connection_configs as $config) {
    try {
        $conn = mysqli_init();
        mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 5);
        
        if (mysqli_real_connect($conn, $config['host'], $config['username'], $config['password'], $config['database'])) {
            $conn->set_charset("utf8mb4");
            
            if (!$conn->connect_error) {
                echo "成功連線到資料庫: {$config['host']}\n";
                break;
            }
        }
    } catch (Exception $e) {
        $connection_error .= "連線 {$config['host']} 失敗: " . $e->getMessage() . "\n";
        continue;
    }
}

if (!$conn || $conn->connect_error) {
    echo "所有資料庫連線都失敗:\n$connection_error\n";
    exit(1);
}

// 定義要創建的表格
$tables = [
    'jobs' => "
        CREATE TABLE IF NOT EXISTS jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            enterprise_id INT NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT NOT NULL,
            requirements TEXT,
            responsibilities TEXT,
            salary_min DECIMAL(10,2),
            salary_max DECIMAL(10,2),
            salary_type ENUM('月薪', '年薪', '時薪', '面議') DEFAULT '面議',
            job_type ENUM('全職', '兼職', '實習', '約聘') NOT NULL,
            location VARCHAR(100),
            department VARCHAR(100),
            experience_level ENUM('無經驗', '1-3年', '3-5年', '5-10年', '10年以上') DEFAULT '無經驗',
            education_level ENUM('高中', '專科', '大學', '碩士', '博士', '不拘') DEFAULT '不拘',
            skills_required TEXT,
            benefits TEXT,
            status ENUM('active', 'paused', 'closed', 'draft') DEFAULT 'draft',
            view_count INT DEFAULT 0,
            application_count INT DEFAULT 0,
            bookmark_count INT DEFAULT 0,
            is_featured BOOLEAN DEFAULT FALSE,
            published_at TIMESTAMP NULL,
            deadline DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (enterprise_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_enterprise_id (enterprise_id),
            INDEX idx_status (status),
            INDEX idx_job_type (job_type),
            INDEX idx_location (location),
            INDEX idx_published_at (published_at),
            FULLTEXT idx_search (title, description, requirements, skills_required)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",
    
    'job_applications' => "
        CREATE TABLE IF NOT EXISTS job_applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            job_id INT NOT NULL,
            student_id INT NOT NULL,
            enterprise_id INT NOT NULL,
            status ENUM('pending', 'reviewed', 'interview', 'accepted', 'rejected') DEFAULT 'pending',
            cover_letter TEXT,
            resume_url VARCHAR(500),
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reviewed_at TIMESTAMP NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (enterprise_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_application (job_id, student_id),
            INDEX idx_job_id (job_id),
            INDEX idx_student_id (student_id),
            INDEX idx_enterprise_id (enterprise_id),
            INDEX idx_status (status),
            INDEX idx_applied_at (applied_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",
    
    'enterprise_views' => "
        CREATE TABLE IF NOT EXISTS enterprise_views (
            id INT AUTO_INCREMENT PRIMARY KEY,
            enterprise_id INT NOT NULL,
            student_id INT NOT NULL,
            portfolio_id INT NOT NULL,
            viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            view_duration INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (enterprise_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
            INDEX idx_enterprise_id (enterprise_id),
            INDEX idx_student_id (student_id),
            INDEX idx_portfolio_id (portfolio_id),
            INDEX idx_viewed_at (viewed_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",
    
    'enterprise_contacts' => "
        CREATE TABLE IF NOT EXISTS enterprise_contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            enterprise_id INT NOT NULL,
            student_id INT NOT NULL,
            contact_type ENUM('email', 'phone', 'message', 'interview') NOT NULL,
            message TEXT,
            contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('sent', 'read', 'replied', 'archived') DEFAULT 'sent',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (enterprise_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_enterprise_id (enterprise_id),
            INDEX idx_student_id (student_id),
            INDEX idx_contact_type (contact_type),
            INDEX idx_status (status),
            INDEX idx_contact_date (contact_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",
    
    'enterprise_bookmarks' => "
        CREATE TABLE IF NOT EXISTS enterprise_bookmarks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            enterprise_id INT NOT NULL,
            student_id INT NOT NULL,
            portfolio_id INT NOT NULL,
            notes TEXT,
            bookmarked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (enterprise_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
            UNIQUE KEY unique_bookmark (enterprise_id, portfolio_id),
            INDEX idx_enterprise_id (enterprise_id),
            INDEX idx_student_id (student_id),
            INDEX idx_portfolio_id (portfolio_id),
            INDEX idx_bookmarked_at (bookmarked_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",
    
    'enterprise_analytics' => "
        CREATE TABLE IF NOT EXISTS enterprise_analytics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            enterprise_id INT NOT NULL,
            date DATE NOT NULL,
            portfolio_views INT DEFAULT 0,
            job_views INT DEFAULT 0,
            applications_received INT DEFAULT 0,
            bookmarks_created INT DEFAULT 0,
            contacts_made INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (enterprise_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_daily_analytics (enterprise_id, date),
            INDEX idx_enterprise_id (enterprise_id),
            INDEX idx_date (date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    "
];

// 執行創建表格
$success_count = 0;
$error_count = 0;

foreach ($tables as $table_name => $sql) {
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

echo "\n表格創建完成！\n";
echo "成功創建: $success_count 個表格\n";
echo "創建失敗: $error_count 個表格\n";

// 檢查表格是否創建成功
echo "\n檢查創建的表格：\n";
foreach (array_keys($tables) as $table) {
    $result = $conn->query("SHOW TABLES LIKE '$table'");
    if ($result && $result->num_rows > 0) {
        echo "✓ 表格 '$table' 存在\n";
    } else {
        echo "✗ 表格 '$table' 不存在\n";
    }
}

// 插入測試資料
echo "\n開始插入測試資料...\n";

// 檢查是否有企業用戶
$result = $conn->query("SELECT id FROM users WHERE role = 'enterprise' LIMIT 1");
if ($result && $result->num_rows > 0) {
    $enterprise_user = $result->fetch_assoc();
    $enterprise_id = $enterprise_user['id'];
    
    // 插入測試職缺
    $test_jobs = [
        [
            'title' => '前端工程師',
            'description' => '負責公司產品的前端開發工作，使用 React、Vue.js 等現代前端技術。',
            'requirements' => '熟悉 HTML、CSS、JavaScript，有 React 或 Vue.js 開發經驗',
            'salary_min' => 35000,
            'salary_max' => 50000,
            'job_type' => '全職',
            'location' => '台北市',
            'department' => '技術部'
        ],
        [
            'title' => '後端工程師',
            'description' => '負責公司產品的後端開發工作，使用 PHP、MySQL 等技術。',
            'requirements' => '熟悉 PHP、MySQL，有 API 開發經驗',
            'salary_min' => 40000,
            'salary_max' => 60000,
            'job_type' => '全職',
            'location' => '台北市',
            'department' => '技術部'
        ]
    ];
    
    foreach ($test_jobs as $job) {
        $sql = "INSERT INTO jobs (enterprise_id, title, description, requirements, salary_min, salary_max, job_type, location, department, status, published_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("isssddsss", 
            $enterprise_id,
            $job['title'],
            $job['description'],
            $job['requirements'],
            $job['salary_min'],
            $job['salary_max'],
            $job['job_type'],
            $job['location'],
            $job['department']
        );
        
        if ($stmt->execute()) {
            echo "✓ 插入測試職缺: {$job['title']}\n";
        } else {
            echo "✗ 插入測試職缺失敗: {$job['title']}\n";
        }
        $stmt->close();
    }
} else {
    echo "沒有找到企業用戶，跳過測試資料插入\n";
}

$conn->close();
echo "\n企業端資料庫表格創建完成！\n";
?>
