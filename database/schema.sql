-- Portfolio+ 資料庫結構
-- 建立資料庫
CREATE DATABASE IF NOT EXISTS eportfolio1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eportfolio1;

-- 使用者表格
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'enterprise', 'admin') NOT NULL DEFAULT 'student',
    status ENUM('active', 'inactive', 'banned') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- 學生資料表格
CREATE TABLE IF NOT EXISTS student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    gender ENUM('男', '女', '其他'),
    birth_date DATE,
    phone VARCHAR(20),
    address TEXT,
    bio TEXT,
    avatar_url VARCHAR(255),
    student_id VARCHAR(20),
    major VARCHAR(100),
    school VARCHAR(100),
    grade VARCHAR(20),
    graduation_year INT,
    skills TEXT,
    interests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_id)
);

-- 企業資料表格
CREATE TABLE IF NOT EXISTS enterprise_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    company_type VARCHAR(100),
    industry VARCHAR(100),
    company_size ENUM('1-10', '11-50', '51-200', '201-500', '500+'),
    founded_year INT,
    employee_count INT,
    revenue_range VARCHAR(50),
    description TEXT,
    logo_url VARCHAR(255),
    website VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    contact_person VARCHAR(100),
    contact_email VARCHAR(100),
    social_media JSON,
    company_culture TEXT,
    benefits_description TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_company_name (company_name)
);

-- 作品分類表格
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 作品表格
CREATE TABLE IF NOT EXISTS portfolios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT,
    tags TEXT,
    status ENUM('draft', 'published', 'review', 'archived') DEFAULT 'draft',
    cover_image VARCHAR(255),
    content TEXT,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    download_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_published_at (published_at),
    FULLTEXT idx_search (title, description, tags)
);

-- 作品檔案表格
CREATE TABLE IF NOT EXISTS portfolio_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portfolio_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    file_type VARCHAR(100),
    file_extension VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    INDEX idx_portfolio_id (portfolio_id)
);

-- 評論表格
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portfolio_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT NULL,
    content TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id)
);

-- 讚表格
CREATE TABLE IF NOT EXISTS likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    portfolio_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (user_id, portfolio_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_portfolio_id (portfolio_id)
);

-- 收藏表格
CREATE TABLE IF NOT EXISTS bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    portfolio_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_bookmark (user_id, portfolio_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_portfolio_id (portfolio_id)
);

-- 通知表格
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('like', 'comment', 'view', 'system', 'enterprise') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- 訊息表格
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    subject VARCHAR(200),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- 履歷表格
CREATE TABLE IF NOT EXISTS resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    template VARCHAR(50) NOT NULL,
    content JSON NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_template (template)
);

-- ==================== 企業端表格擴展 ====================

-- 職缺表格
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
);

-- 職缺申請表格
CREATE TABLE IF NOT EXISTS job_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('pending', 'reviewed', 'interviewed', 'accepted', 'rejected') DEFAULT 'pending',
    cover_letter TEXT,
    resume_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    expected_salary DECIMAL(10,2),
    available_date DATE,
    interview_date DATETIME,
    interview_location VARCHAR(255),
    interview_notes TEXT,
    enterprise_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (job_id, student_id),
    INDEX idx_job_id (job_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 企業瀏覽記錄表格
CREATE TABLE IF NOT EXISTS enterprise_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enterprise_id INT NOT NULL,
    portfolio_id INT NOT NULL,
    view_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enterprise_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_view_date (view_date)
);

-- 企業聯絡記錄表格
CREATE TABLE IF NOT EXISTS enterprise_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enterprise_id INT NOT NULL,
    student_id INT NOT NULL,
    contact_type ENUM('email', 'phone', 'message', 'interview') NOT NULL,
    subject VARCHAR(200),
    message TEXT,
    contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (enterprise_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_student_id (student_id),
    INDEX idx_contact_type (contact_type),
    INDEX idx_contact_date (contact_date)
);

-- 企業收藏作品表格
CREATE TABLE IF NOT EXISTS enterprise_bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enterprise_id INT NOT NULL,
    portfolio_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enterprise_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enterprise_bookmark (enterprise_id, portfolio_id),
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_created_at (created_at)
);

-- 企業分析統計表格
CREATE TABLE IF NOT EXISTS enterprise_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enterprise_id INT NOT NULL,
    date DATE NOT NULL,
    portfolio_views INT DEFAULT 0,
    portfolio_bookmarks INT DEFAULT 0,
    student_contacts INT DEFAULT 0,
    job_views INT DEFAULT 0,
    job_applications INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enterprise_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enterprise_date (enterprise_id, date),
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_date (date)
);

-- ==================== 插入預設資料 ====================

-- 插入預設分類
INSERT INTO categories (name, slug, description, icon, color, sort_order) VALUES
('網頁設計', 'web', '網站設計與開發相關作品', 'fas fa-globe', '#667eea', 1),
('行動應用', 'mobile', '手機應用程式開發', 'fas fa-mobile-alt', '#f093fb', 2),
('UI/UX 設計', 'design', '使用者介面與體驗設計', 'fas fa-palette', '#4facfe', 3),
('數據分析', 'data', '數據分析與視覺化', 'fas fa-chart-bar', '#43e97b', 4),
('其他', 'other', '其他類型的作品', 'fas fa-ellipsis-h', '#fa709a', 5);

-- 插入預設管理員帳號 (密碼: admin123)
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@portfolio.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- 插入測試企業帳號
INSERT INTO users (username, email, password_hash, role) VALUES
('microsoft_tw', 'hr@microsoft.com.tw', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'enterprise'),
('google_tw', 'hr@google.com.tw', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'enterprise'),
('apple_tw', 'hr@apple.com.tw', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'enterprise');

-- 插入測試企業資料
INSERT INTO enterprise_profiles (user_id, company_name, company_type, industry, company_size, founded_year, employee_count, revenue_range, description, logo_url, website, address, phone, contact_person, contact_email, social_media, company_culture, benefits_description, is_verified) VALUES
(101, '台灣微軟股份有限公司', '科技公司', '軟體開發', '500+', 1975, 2000, '100億以上', '微軟是全球領先的軟體公司，致力於為個人和企業提供創新的技術解決方案。', 'https://via.placeholder.com/200x100/0078d4/ffffff?text=Microsoft', 'https://www.microsoft.com/zh-tw', '台北市信義區信義路五段7號', '02-3725-3888', '張經理', 'hr@microsoft.com.tw', '{"linkedin": "https://linkedin.com/company/microsoft", "facebook": "https://facebook.com/microsoft"}', '我們重視創新、多元化和包容性，致力於為員工提供良好的工作環境和發展機會。', '提供具競爭力的薪資、年終獎金、股票選擇權、健康保險、教育訓練等福利。', TRUE),
(102, 'Google 台灣', '科技公司', '網際網路服務', '500+', 1998, 1500, '100億以上', 'Google 是全球最大的搜尋引擎公司，提供各種網路服務和解決方案。', 'https://via.placeholder.com/200x100/4285f4/ffffff?text=Google', 'https://www.google.com', '台北市信義區信義路五段7號', '02-8729-6000', '李經理', 'hr@google.com.tw', '{"linkedin": "https://linkedin.com/company/google", "twitter": "https://twitter.com/google"}', '我們相信技術可以改變世界，鼓勵員工創新和實驗。', '提供優厚的薪資福利、免費餐點、健身房、教育補助等。', TRUE),
(103, 'Apple 台灣', '科技公司', '消費電子', '500+', 1976, 1200, '100億以上', 'Apple 是全球知名的消費電子產品公司，以創新設計和優質體驗聞名。', 'https://via.placeholder.com/200x100/000000/ffffff?text=Apple', 'https://www.apple.com/tw', '台北市信義區松仁路100號', '02-2341-5200', '王經理', 'hr@apple.com.tw', '{"linkedin": "https://linkedin.com/company/apple", "instagram": "https://instagram.com/apple"}', '我們追求卓越，重視設計和創新，致力於創造最好的產品和體驗。', '提供具競爭力的薪資、員工折扣、健康保險、教育補助等福利。', TRUE);

-- 插入測試職缺資料
INSERT INTO jobs (enterprise_id, title, description, requirements, responsibilities, salary_min, salary_max, salary_type, job_type, location, department, experience_level, education_level, skills_required, benefits, status, is_featured, published_at) VALUES
(101, '前端開發實習生', '我們正在尋找對前端開發有熱情的實習生，協助開發公司內部系統和客戶專案。', '對前端技術有基本了解，願意學習新技術', '協助開發公司網站和客戶專案，參與團隊開發流程', 25000, 35000, '月薪', '實習', '台北市', '技術部', '無經驗', '大學', 'JavaScript,HTML,CSS,React', '彈性工時、學習津貼、實習證明', 'active', TRUE, NOW()),
(101, 'UI/UX 設計師', '負責公司產品的使用者介面設計和使用者體驗優化。', '具備 UI/UX 設計經驗，熟悉設計工具', '設計產品介面、進行使用者研究、優化使用者體驗', 45000, 65000, '月薪', '全職', '台北市', '設計部', '1-3年', '大學', 'Figma,Sketch,Adobe Creative Suite', '年終獎金、健康檢查、教育訓練', 'active', TRUE, NOW()),
(101, '數據分析師', '負責公司數據分析工作，提供數據洞察和決策支援。', '具備數據分析能力，熟悉統計方法', '分析業務數據、製作報表、提供決策建議', 50000, 70000, '月薪', '全職', '台北市', '數據部', '3-5年', '碩士', 'Python,R,SQL,Tableau', '績效獎金、股票選擇權、進修補助', 'active', FALSE, NOW());
