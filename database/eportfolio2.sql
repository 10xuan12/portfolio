-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： localhost
-- 產生時間： 2025-09-17 11:26:46
-- 伺服器版本： 10.4.32-MariaDB
-- PHP 版本： 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： `eportfolio2`
--

-- --------------------------------------------------------

--
-- 資料表結構 `badges`
--

CREATE TABLE `badges` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `icon` varchar(100) NOT NULL,
  `category` enum('achievement','engagement') NOT NULL DEFAULT 'achievement',
  `required_points` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `badges`
--

INSERT INTO `badges` (`id`, `name`, `description`, `icon`, `category`, `required_points`) VALUES
(1, '初次登入', '第一次登入系統', 'fa-user-check', 'achievement', 1),
(2, '首次上傳', '上傳第一個作品', 'fa-upload', 'achievement', 5),
(3, '完整個人檔案', '完成個人基本資料', 'fa-id-card', 'achievement', 10),
(4, '熱門作品', '作品瀏覽數破 100', 'fa-fire', 'achievement', 100),
(5, '明星創作者', '累積 10 個讚', 'fa-star', 'achievement', 10);

-- --------------------------------------------------------

--
-- 資料表結構 `bookmarks`
--

CREATE TABLE `bookmarks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `portfolio_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `bookmarks`
--

INSERT INTO `bookmarks` (`id`, `user_id`, `portfolio_id`, `created_at`) VALUES
(1, 5, 9, '2025-08-29 07:10:55');

-- --------------------------------------------------------

--
-- 資料表結構 `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `color` varchar(7) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon`, `color`, `sort_order`, `is_active`, `created_at`) VALUES
(1, '網頁設計', 'web', '網站設計與開發相關作品', 'fas fa-globe', '#667eea', 1, 0, '2025-08-29 06:29:47'),
(2, '行動應用', 'mobile', '手機應用程式開發', 'fas fa-mobile-alt', '#f093fb', 2, 0, '2025-08-29 06:29:47'),
(3, 'UI/UX 設計', 'design', '使用者介面與體驗設計', 'fas fa-palette', '#4facfe', 3, 0, '2025-08-29 06:29:47'),
(4, '數據分析', 'data', '數據分析與視覺化', 'fas fa-chart-bar', '#43e97b', 4, 0, '2025-08-29 06:29:47'),
(5, '其他', 'other', '其他未歸類之領域', 'fas fa-ellipsis', '#9CA3AF', 20, 1, '2025-08-29 06:29:47'),
(11, '網頁開發', 'web-development', '前端和後端網頁應用程式開發', 'code', '#3B82F6', 1, 0, '2025-08-29 06:59:43'),
(12, '資料分析', 'data-analysis', '數據處理、分析和視覺化', 'bar-chart', '#10B981', 2, 0, '2025-08-29 06:59:43'),
(13, '數位行銷', 'digital-marketing', '社群媒體行銷、SEO、內容行銷', 'megaphone', '#F59E0B', 3, 0, '2025-08-29 06:59:43'),
(14, '使用者體驗', 'user-experience', 'UI/UX 設計、使用者研究', 'users', '#8B5CF6', 4, 0, '2025-08-29 06:59:43'),
(15, '專案管理', 'project-management', '專案規劃、執行和監控', 'folder', '#EF4444', 5, 0, '2025-08-29 06:59:43'),
(27, '資訊學群', 'info', '資訊科技與電腦相關學群', 'fas fa-laptop-code', '#2563EB', 1, 1, '2025-09-17 08:59:16'),
(28, '工程學群', 'engineering', '工程與技術相關學群', 'fas fa-gears', '#0EA5E9', 2, 1, '2025-09-17 08:59:16'),
(29, '數理化學群', 'science', '數學、物理、化學等理學領域', 'fas fa-flask', '#10B981', 3, 1, '2025-09-17 08:59:16'),
(30, '醫藥衛生學群', 'medical', '醫學、護理、公共衛生等領域', 'fas fa-stethoscope', '#EF4444', 4, 1, '2025-09-17 08:59:16'),
(31, '生命科學學群', 'life-science', '生物與生命科學相關領域', 'fas fa-dna', '#22C55E', 5, 1, '2025-09-17 08:59:16'),
(32, '生物資源學群', 'bio-resource', '農業、生技、資源相關領域', 'fas fa-seedling', '#16A34A', 6, 1, '2025-09-17 08:59:16'),
(33, '地球環境學群', 'earth-environment', '地科、環境、氣候相關領域', 'fas fa-globe', '#059669', 7, 1, '2025-09-17 08:59:16'),
(34, '建築設計學群', 'architecture', '建築、都市設計、室內設計', 'fas fa-building', '#FB923C', 8, 1, '2025-09-17 08:59:16'),
(35, '藝術學群', 'arts', '美術、設計、表演藝術等', 'fas fa-palette', '#F59E0B', 9, 1, '2025-09-17 08:59:16'),
(36, '社會心理學群', 'social-psychology', '社會學、心理學、人類行為', 'fas fa-users', '#8B5CF6', 10, 1, '2025-09-17 08:59:16'),
(37, '大眾傳播學群', 'mass-communication', '新聞、廣告、公關、傳播', 'fas fa-bullhorn', '#F43F5E', 11, 1, '2025-09-17 08:59:16'),
(38, '外語學群', 'foreign-language', '外語與語言學相關領域', 'fas fa-language', '#6366F1', 12, 1, '2025-09-17 08:59:16'),
(39, '文史哲學群', 'humanities', '文學、歷史、哲學等', 'fas fa-book', '#A78BFA', 13, 1, '2025-09-17 08:59:16'),
(40, '教育學群', 'education', '教育學、師培、教學科技', 'fas fa-chalkboard-teacher', '#F97316', 14, 1, '2025-09-17 08:59:16'),
(41, '法政學群', 'law-political', '法律、政治、公共政策', 'fas fa-scale-balanced', '#64748B', 15, 1, '2025-09-17 08:59:16'),
(42, '管理學群', 'management', '企管、人資、供應鏈等', 'fas fa-briefcase', '#14B8A6', 16, 1, '2025-09-17 08:59:16'),
(43, '財經學群', 'finance-economics', '財務、會計、經濟、統計', 'fas fa-coins', '#F59E0B', 17, 1, '2025-09-17 08:59:16'),
(44, '農業學群', 'agriculture', '農學、作物、畜產、水產', 'fas fa-tractor', '#84CC16', 18, 1, '2025-09-17 08:59:16'),
(45, '遊憩運動學群', 'sports-recreation', '體育、運動、休閒遊憩', 'fas fa-person-running', '#22D3EE', 19, 1, '2025-09-17 08:59:16');

-- --------------------------------------------------------

--
-- 資料表結構 `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `portfolio_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `content` text NOT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `like_count` int(11) NOT NULL DEFAULT 0,
  `is_approved` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `comments`
--

INSERT INTO `comments` (`id`, `portfolio_id`, `user_id`, `parent_id`, `content`, `rating`, `like_count`, `is_approved`, `created_at`, `updated_at`) VALUES
(1, 6, 5, NULL, '這份分析報告非常詳細，數據視覺化做得很好！', NULL, 0, 1, '2025-08-29 15:10:55', '2025-08-29 15:10:55'),
(2, 7, 5, NULL, '策略規劃很實用，對中小企業很有幫助。', NULL, 0, 1, '2025-08-29 15:10:55', '2025-08-29 15:10:55'),
(3, 18, 5, NULL, '這是一則測試留言，系統檢查通過。', 5, 0, 1, '2025-09-02 17:31:09', '2025-09-02 17:31:09'),
(4, 18, 5, NULL, '父留言：這是測試父留言內容。', 5, 0, 1, '2025-09-02 17:33:01', '2025-09-02 17:33:01'),
(5, 18, 5, 4, '子留言一：這是回覆父留言。', 4, 0, 1, '2025-09-02 17:33:02', '2025-09-02 17:33:02'),
(6, 18, 5, 4, '子留言二：第二則回覆父留言。', 3, 0, 1, '2025-09-02 17:33:02', '2025-09-02 17:33:02'),
(7, 18, 5, 6, '子留言的回覆：這是更深一層的回覆。', 5, 0, 1, '2025-09-02 17:33:02', '2025-09-02 17:33:02'),
(11, 21, 5, NULL, '很棒', NULL, 0, 1, '2025-09-15 17:27:10', '2025-09-15 17:27:10'),
(12, 21, 5, NULL, '讚讚', NULL, 0, 1, '2025-09-15 17:28:21', '2025-09-15 17:28:21'),
(13, 21, 5, NULL, '123', NULL, 0, 1, '2025-09-15 17:32:14', '2025-09-15 17:32:14'),
(14, 21, 5, NULL, '1234', NULL, 0, 1, '2025-09-15 17:33:04', '2025-09-15 17:33:04'),
(15, 21, 5, NULL, '讚讚', NULL, 0, 1, '2025-09-15 17:45:47', '2025-09-15 17:45:47');

-- --------------------------------------------------------

--
-- 資料表結構 `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `school` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `departments`
--

INSERT INTO `departments` (`id`, `name`, `code`, `school`, `description`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, '資訊管理學系', 'IM', '靜宜大學', '培養資訊管理專業人才，結合資訊科技與管理知識', 1, 1, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(2, '財務金融學系', 'FF', '靜宜大學', '培養財務金融專業人才，專精於投資、風險管理與金融創新', 1, 2, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(3, '國際企業學系', 'IB', '靜宜大學', '培養國際企業管理專業人才，專精於國際貿易與跨文化管理', 1, 3, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(4, '資訊工程學系', 'CS', '靜宜大學', '培養資訊工程專業人才，專精於軟體開發與系統設計', 1, 4, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(5, '統計學系', 'STAT', '靜宜大學', '培養統計分析專業人才，專精於數據分析與統計建模', 1, 5, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(6, '企業管理學系', 'BA', '靜宜大學', '培養企業管理專業人才，專精於組織管理與策略規劃', 1, 6, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(7, '會計學系', 'ACC', '靜宜大學', '培養會計專業人才，專精於財務會計與審計', 1, 7, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(8, '經濟學系', 'ECON', '靜宜大學', '培養經濟學專業人才，專精於經濟理論與政策分析', 1, 8, '2025-08-29 02:37:33', '2025-08-29 02:37:33');

-- --------------------------------------------------------

--
-- 資料表結構 `enterprise_analytics`
--

CREATE TABLE `enterprise_analytics` (
  `id` int(11) NOT NULL,
  `enterprise_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `portfolio_views` int(11) DEFAULT 0,
  `portfolio_bookmarks` int(11) DEFAULT 0,
  `student_contacts` int(11) DEFAULT 0,
  `job_views` int(11) DEFAULT 0,
  `job_applications` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `enterprise_bookmarks`
--

CREATE TABLE `enterprise_bookmarks` (
  `id` int(11) NOT NULL,
  `enterprise_id` int(11) NOT NULL,
  `portfolio_id` int(11) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `enterprise_contacts`
--

CREATE TABLE `enterprise_contacts` (
  `id` int(11) NOT NULL,
  `enterprise_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `contact_type` enum('email','phone','message','interview') NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `contact_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_read` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `enterprise_profiles`
--

CREATE TABLE `enterprise_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `company_name` varchar(100) NOT NULL,
  `company_type` varchar(100) DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `company_size` enum('1-10','11-50','51-200','201-500','500+') DEFAULT NULL,
  `founded_year` int(11) DEFAULT NULL,
  `employee_count` int(11) DEFAULT NULL,
  `revenue_range` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `social_media` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`social_media`)),
  `company_culture` text DEFAULT NULL,
  `benefits_description` text DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verification_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `enterprise_views`
--

CREATE TABLE `enterprise_views` (
  `id` int(11) NOT NULL,
  `enterprise_id` int(11) NOT NULL,
  `portfolio_id` int(11) NOT NULL,
  `view_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `grades`
--

CREATE TABLE `grades` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `level` enum('undergraduate','graduate','phd') NOT NULL DEFAULT 'undergraduate',
  `year` int(11) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `grades`
--

INSERT INTO `grades` (`id`, `name`, `level`, `year`, `description`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, '大學一年級', 'undergraduate', 1, '大學部一年級學生', 1, 1, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(2, '大學二年級', 'undergraduate', 2, '大學部二年級學生', 1, 2, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(3, '大學三年級', 'undergraduate', 3, '大學部三年級學生', 1, 3, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(4, '大學四年級', 'undergraduate', 4, '大學部四年級學生', 1, 4, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(5, '碩士生', 'graduate', 1, '碩士班學生', 1, 5, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(6, '博士生', 'phd', 1, '博士班學生', 1, 6, '2025-08-29 02:37:33', '2025-08-29 02:37:33');

-- --------------------------------------------------------

--
-- 資料表結構 `jobs`
--

CREATE TABLE `jobs` (
  `id` int(11) NOT NULL,
  `enterprise_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `requirements` text DEFAULT NULL,
  `responsibilities` text DEFAULT NULL,
  `salary_min` decimal(10,2) DEFAULT NULL,
  `salary_max` decimal(10,2) DEFAULT NULL,
  `salary_type` enum('月薪','年薪','時薪','面議') DEFAULT '面議',
  `job_type` enum('全職','兼職','實習','約聘') NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `experience_level` enum('無經驗','1-3年','3-5年','5-10年','10年以上') DEFAULT '無經驗',
  `education_level` enum('高中','專科','大學','碩士','博士','不拘') DEFAULT '不拘',
  `skills_required` text DEFAULT NULL,
  `benefits` text DEFAULT NULL,
  `status` enum('active','paused','closed','draft') DEFAULT 'draft',
  `view_count` int(11) DEFAULT 0,
  `application_count` int(11) DEFAULT 0,
  `bookmark_count` int(11) DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `published_at` timestamp NULL DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `job_applications`
--

CREATE TABLE `job_applications` (
  `id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `status` enum('pending','reviewed','interviewed','accepted','rejected') DEFAULT 'pending',
  `cover_letter` text DEFAULT NULL,
  `resume_url` varchar(255) DEFAULT NULL,
  `portfolio_url` varchar(255) DEFAULT NULL,
  `expected_salary` decimal(10,2) DEFAULT NULL,
  `available_date` date DEFAULT NULL,
  `interview_date` datetime DEFAULT NULL,
  `interview_location` varchar(255) DEFAULT NULL,
  `interview_notes` text DEFAULT NULL,
  `enterprise_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `likes`
--

CREATE TABLE `likes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `portfolio_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `likes`
--

INSERT INTO `likes` (`id`, `user_id`, `portfolio_id`, `created_at`) VALUES
(2, 5, 8, '2025-08-29 07:10:55'),
(18, 5, 16, '2025-09-16 06:08:02'),
(20, 5, 21, '2025-09-16 06:31:04');

-- --------------------------------------------------------

--
-- 資料表結構 `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('like','comment','view','system','enterprise') NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `data`, `is_read`, `created_at`) VALUES
(1, 5, 'like', '您的作品收到了新的讚', '有人對您的作品「電商網站使用者行為分析」按讚了！', '{\"portfolio_id\": 1, \"liker_name\": \"匿名用戶\"}', 1, '2025-08-29 07:10:55'),
(2, 5, 'comment', '您的作品收到了新的評論', '有人對您的作品「社群媒體行銷策略規劃」發表了評論。', '{\"portfolio_id\": 2, \"commenter_name\": \"匿名用戶\", \"comment\": \"策略規劃很實用，對中小企業很有幫助。\"}', 1, '2025-08-29 07:10:55'),
(3, 5, 'system', '系統維護公告', '今晚 23:00 將進行例行維護。', '{\"level\": \"info\"}', 1, '2025-08-29 08:42:39'),
(4, 5, 'view', '有人瀏覽了你的作品', '你的作品「Python 爬蟲程式開發」被瀏覽。', '{\"portfolio_id\": 9}', 1, '2025-08-29 08:42:39'),
(5, 5, 'system', '系統更新', 'Portfolio+ 已更新，提升了儀表板載入效能。', '{\"version\": \"2.0.2\"}', 0, '2025-09-07 07:35:03'),
(6, 5, 'like', '你的作品收到新的讚', '作品「資料儀表板設計與視覺化」新增 1 個讚。', '{\"portfolio_id\": 20}', 0, '2025-09-07 21:35:03'),
(7, 5, 'comment', '你的作品收到新的留言', '有人於「資料儀表板設計與視覺化」留下好評。', '{\"portfolio_id\": 20, \"comment_preview\": \"視覺排版清楚...\"}', 0, '2025-09-08 02:35:03');

-- --------------------------------------------------------

--
-- 資料表結構 `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `password_resets`
--

INSERT INTO `password_resets` (`id`, `user_id`, `token`, `expires_at`, `used`, `created_at`) VALUES
(1, 5, 'token123', '2025-09-01 12:00:00', 0, '2025-08-29 02:37:33'),
(2, 6, 'token456', '2025-09-02 12:00:00', 0, '2025-08-29 02:37:33');

-- --------------------------------------------------------

--
-- 資料表結構 `portfolios`
--

CREATE TABLE `portfolios` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `tags` text DEFAULT NULL,
  `status` enum('draft','published','review','archived') DEFAULT 'draft',
  `cover_image` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `view_count` int(11) DEFAULT 0,
  `like_count` int(11) DEFAULT 0,
  `comment_count` int(11) DEFAULT 0,
  `download_count` int(11) DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `portfolios`
--

INSERT INTO `portfolios` (`id`, `user_id`, `title`, `description`, `category_id`, `tags`, `status`, `cover_image`, `content`, `view_count`, `like_count`, `comment_count`, `download_count`, `is_featured`, `published_at`, `created_at`, `updated_at`) VALUES
(6, 5, '電商網站使用者行為分析', '使用 Python 和 PowerBI 分析電商網站的用戶行為數據，包括瀏覽路徑、購買轉換率、用戶分群等，為行銷策略提供數據支持。', 27, 'Python, PowerBI, 數據分析, 電商, 用戶行為', 'published', '/portfolio/uploads/portfolios/ecommerce-analysis.jpg', '## 專案概述\n\n本專案旨在分析電商網站的用戶行為數據，透過數據挖掘和視覺化技術，深入了解用戶的瀏覽習慣和購買行為。\n\n## 技術工具\n- Python (pandas, numpy, matplotlib)\n- PowerBI\n- SQL\n- Excel\n\n## 主要發現\n1. 用戶平均瀏覽時間為 8.5 分鐘\n2. 購物車放棄率為 68%\n3. 最受歡迎的產品類別是電子產品\n\n## 改進建議\n1. 優化購物車流程\n2. 增加產品推薦功能\n3. 改善移動端體驗', 159, 23, 0, 0, 1, '2024-12-01 02:00:00', '2025-08-29 07:07:41', '2025-09-17 09:11:15'),
(7, 5, '社群媒體行銷策略規劃', '為中小企業制定完整的社群媒體行銷策略，包括內容規劃、發布時程、互動策略和成效追蹤。', 42, '社群媒體, 行銷策略, 內容規劃, 品牌推廣', 'published', '/portfolio/uploads/portfolios/social-media-strategy.jpg', '## 專案背景\n\n協助台中地區的中小企業建立有效的社群媒體行銷策略，提升品牌知名度和客戶互動。\n\n## 策略內容\n1. 平台選擇：Facebook、Instagram、Line\n2. 內容主題：產品介紹、客戶故事、產業知識\n3. 發布頻率：每週 3-4 篇\n4. 互動策略：回覆評論、舉辦活動\n\n## 成效指標\n- 粉絲增長率：每月 15%\n- 互動率：平均 8%\n- 網站流量：提升 25%', 89, 15, 0, 0, 0, '2024-11-15 06:30:00', '2025-08-29 07:07:41', '2025-09-17 09:12:39'),
(8, 5, '學生資訊系統 UI/UX 設計', '重新設計學校資訊系統的使用者介面，提升學生和教師的使用體驗，包括響應式設計和無障礙功能。', 27, 'UI/UX設計, 響應式設計, 無障礙設計, 使用者研究', 'published', '/portfolio/uploads/portfolios/student-system-ui.jpg', '## 設計目標\n\n改善現有學生資訊系統的使用者體驗，讓學生和教師能夠更有效率地使用系統功能。\n\n## 設計原則\n1. 簡潔明瞭的介面\n2. 直觀的操作流程\n3. 響應式設計\n4. 無障礙功能\n\n## 主要改進\n- 重新設計導航結構\n- 優化表單設計\n- 增加搜尋功能\n- 改善移動端體驗\n\n## 使用者測試\n- 測試對象：20 名學生，5 名教師\n- 完成任務成功率：95%\n- 使用者滿意度：4.2/5.0', 235, 31, 0, 0, 1, '2024-10-20 01:15:00', '2025-08-29 07:07:41', '2025-09-17 09:13:19'),
(9, 5, 'Python 爬蟲程式開發', '開發自動化網頁爬蟲程式，用於收集和分析網路數據，支援多種網站格式和反爬蟲機制。', 27, 'Python, 爬蟲, 自動化, 數據收集, Selenium', 'published', '/portfolio/uploads/portfolios/python-scraper.jpg', '## 專案描述\n\n開發一個功能完整的網頁爬蟲系統，能夠自動化收集網路數據，支援多種網站格式和反爬蟲機制。\n\n## 技術特點\n- 使用 Selenium 處理動態內容\n- 支援多線程爬取\n- 自動處理反爬蟲機制\n- 數據清洗和格式化\n\n## 主要功能\n1. 自動化登入\n2. 數據提取\n3. 錯誤處理\n4. 數據導出\n\n## 應用場景\n- 電商價格監控\n- 新聞內容收集\n- 社交媒體分析\n- 市場研究數據', 178, 28, 0, 0, 0, '2024-09-10 08:45:00', '2025-08-29 07:07:41', '2025-09-17 09:23:49'),
(10, 5, '專案管理系統開發', '使用 React 和 Node.js 開發專案管理系統，包含任務分配、進度追蹤、團隊協作等功能。', 27, 'React, Node.js, 專案管理, 團隊協作, 任務追蹤', 'published', '/portfolio/uploads/portfolios/project-management-system.jpg', '## 系統功能\n\n開發一個完整的專案管理系統，幫助團隊更有效率地協作和追蹤專案進度。\n\n## 核心功能\n1. 專案建立和管理\n2. 任務分配和追蹤\n3. 團隊成員管理\n4. 進度報告\n5. 檔案共享\n\n## 技術架構\n- 前端：React + TypeScript\n- 後端：Node.js + Express\n- 資料庫：MySQL\n- 即時通訊：Socket.io\n\n## 專案成果\n- 開發週期：3 個月\n- 團隊規模：5 人\n- 使用者反饋：4.5/5.0', 145, 19, 0, 0, 0, '2024-08-25 03:20:00', '2025-08-29 07:07:41', '2025-09-17 09:14:12'),
(15, 5, '專案管理系統開發', '使用 React 和 Node.js 開發專案管理系統，包含任務分配、進度追蹤、團隊協作等功能。', 15, 'React, Node.js, 專案管理, 團隊協作, 任務追蹤', 'published', '/portfolio/uploads/portfolios/project-management-system.jpg', '## 系統功能\n\n開發一個完整的專案管理系統，幫助團隊更有效率地協作和追蹤專案進度。\n\n## 核心功能\n1. 專案建立和管理\n2. 任務分配和追蹤\n3. 團隊成員管理\n4. 進度報告\n5. 檔案共享\n\n## 技術架構\n- 前端：React + TypeScript\n- 後端：Node.js + Express\n- 資料庫：MySQL\n- 即時通訊：Socket.io\n\n## 專案成果\n- 開發週期：3 個月\n- 團隊規模：5 人\n- 使用者反饋：4.5/5.0', 146, 19, 0, 0, 0, '2024-08-25 03:20:00', '2025-08-29 07:10:55', '2025-09-15 09:52:49'),
(16, 5, '我的第一個作品', '這是一個範例作品描述', 34, '範例,Demo', 'published', NULL, '內容...', 13, 2, 1, 0, 0, '2025-08-29 07:59:32', '2025-08-29 07:59:32', '2025-09-17 09:25:25'),
(18, 5, '資料科學作品範例（測試）', '這是用於測試的作品描述。', 27, 'Python, 數據分析, 測試', 'published', '/portfolio/uploads/portfolios/test-cover.jpg', '## 測試內容', 3, 0, 0, 0, 0, '2025-09-02 09:31:09', '2025-09-02 09:31:09', '2025-09-17 09:24:13'),
(21, 5, 'JAVA', 'JAVA新增', 27, 'java', 'draft', NULL, NULL, 70, 1, 4, 3, 0, NULL, '2025-09-15 06:05:18', '2025-09-17 09:13:54');

-- --------------------------------------------------------

--
-- 資料表結構 `portfolio_comments`
--

CREATE TABLE `portfolio_comments` (
  `id` int(11) NOT NULL,
  `portfolio_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `like_count` int(11) NOT NULL DEFAULT 0,
  `is_approved` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `portfolio_comments`
--

INSERT INTO `portfolio_comments` (`id`, `portfolio_id`, `user_id`, `content`, `like_count`, `is_approved`, `created_at`, `updated_at`) VALUES
(1, 6, 5, '這份分析報告非常詳細，數據視覺化做得很好！', 0, 1, '2025-08-29 15:10:55', '2025-08-29 15:10:55'),
(2, 7, 5, '策略規劃很實用，對中小企業很有幫助。', 0, 1, '2025-08-29 15:10:55', '2025-08-29 15:10:55'),
(3, 21, 5, '讚讚', 0, 1, '2025-09-15 17:52:10', '2025-09-15 17:52:10'),
(4, 21, 5, '123', 1, 1, '2025-09-15 17:52:30', '2025-09-16 13:23:22'),
(5, 21, 5, '很讚123', 0, 1, '2025-09-16 14:04:09', '2025-09-16 14:04:09'),
(6, 16, 5, '讚喔', 0, 1, '2025-09-16 14:07:55', '2025-09-16 14:07:55'),
(7, 21, 5, '123456', 0, 1, '2025-09-17 16:17:42', '2025-09-17 16:17:42');

-- --------------------------------------------------------

--
-- 資料表結構 `portfolio_files`
--

CREATE TABLE `portfolio_files` (
  `id` int(11) NOT NULL,
  `portfolio_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_extension` varchar(20) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `portfolio_files`
--

INSERT INTO `portfolio_files` (`id`, `portfolio_id`, `file_name`, `file_path`, `file_size`, `file_type`, `file_extension`, `is_primary`, `sort_order`, `created_at`) VALUES
(1, 6, 'ecommerce-analysis-report.pdf', '/portfolio/uploads/portfolios/files/ecommerce-analysis-report.pdf', 2048576, 'application/pdf', 'pdf', 1, 0, '2025-08-29 07:10:55'),
(2, 7, 'social-media-strategy.pdf', '/portfolio/uploads/portfolios/files/social-media-strategy.pdf', 1536000, 'application/pdf', 'pdf', 1, 0, '2025-08-29 07:10:55'),
(3, 8, 'student-system-design.pdf', '/portfolio/uploads/portfolios/files/student-system-design.pdf', 3072000, 'application/pdf', 'pdf', 1, 0, '2025-08-29 07:10:55'),
(9, 21, 'report.pdf', '/portfolio/uploads/portfolios/files/report.pdf', 123456, 'application/pdf', 'pdf', 1, 0, '2025-09-15 10:20:04');

-- --------------------------------------------------------

--
-- 資料表結構 `resumes`
--

CREATE TABLE `resumes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `template` varchar(50) NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`content`)),
  `is_public` tinyint(1) DEFAULT 0,
  `download_count` int(11) DEFAULT 0,
  `view_count` int(11) DEFAULT 0,
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `version` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `student_profiles`
--

CREATE TABLE `student_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `gender` enum('男','女','其他') DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `major` varchar(100) DEFAULT NULL,
  `school` varchar(100) DEFAULT NULL,
  `grade` varchar(20) DEFAULT NULL,
  `graduation_year` int(11) DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `interests` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `student_profiles`
--

INSERT INTO `student_profiles` (`id`, `user_id`, `first_name`, `last_name`, `display_name`, `gender`, `birth_date`, `phone`, `address`, `bio`, `avatar_url`, `student_id`, `major`, `school`, `grade`, `graduation_year`, `skills`, `interests`, `created_at`, `updated_at`) VALUES
(1, 5, '玟瑄', '黃', '黃玟瑄', '女', '2000-01-15', '0912-345-678', '台中市西區精誠路123號', '我是靜宜大學資訊管理學系的學生，對數位行銷和資料分析有濃厚興趣。喜歡學習新技術，希望能在畢業後從事相關工作。', 'uploads/avatars/avatar_5_1758098146.jpg', '411146708', '資訊管理學系', '靜宜大學', '碩士生', 2026, 'Python, JavaScript, HTML/CSS, SQL, Excel, PowerBI, 數位行銷, 資料分析', '人工智慧, 大數據分析, 數位行銷, 使用者體驗設計, 專案管理', '2025-08-29 06:34:32', '2025-09-17 08:39:56'),
(2, 6, '達尼', '林', '達尼 林', NULL, NULL, '0965418312', '台中市', NULL, NULL, NULL, '國際企業學系', NULL, '碩士生', NULL, NULL, NULL, '2025-08-29 06:48:47', '2025-08-29 06:48:47'),
(3, 7, '達尼', '陳', '達尼 陳', NULL, NULL, '0965418312', '台中市', NULL, NULL, NULL, '國際企業學系', NULL, '碩士生', NULL, NULL, NULL, '2025-08-29 06:50:51', '2025-08-29 06:50:51'),
(4, 8, '123', '黃', '123 黃', NULL, NULL, '0965418312', '台中市', NULL, NULL, NULL, '資訊管理學系', NULL, '大學四年級', NULL, NULL, NULL, '2025-08-29 06:53:35', '2025-08-29 06:53:35');

-- --------------------------------------------------------

--
-- 資料表結構 `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','enterprise','admin') NOT NULL DEFAULT 'student',
  `status` enum('active','inactive','banned') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@portfolio.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active', '2025-08-29 06:29:47', '2025-08-29 06:29:47'),
(2, 'microsoft_tw', 'hr@microsoft.com.tw', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'enterprise', 'active', '2025-08-29 06:29:47', '2025-08-29 06:29:47'),
(3, 'google_tw', 'hr@google.com.tw', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'enterprise', 'active', '2025-08-29 06:29:47', '2025-08-29 06:29:47'),
(4, 'apple_tw', 'hr@apple.com.tw', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'enterprise', 'active', '2025-08-29 06:29:47', '2025-08-29 06:29:47'),
(5, 'selina101292@gmail.com', 'selina101292@gmail.com', '$2y$10$EZA6irjCgnHNPrUxaMlAiO/qpPXD6zaDjwS/cd.phY0MgrRtdHJHG', 'student', 'active', '2025-08-29 06:34:32', '2025-08-29 06:34:32'),
(6, 'selina@gmail.com', 'selina@gmail.com', '$2y$10$AQWc.A.HWBnJ9Bn3a5H9Q.TtAgW2H0J2t.9jibUtd7kYR1S1SYMZG', 'student', 'active', '2025-08-29 06:48:47', '2025-08-29 06:48:47'),
(7, 'selina11@gmail.com', 'selina11@gmail.com', '$2y$10$YyDQFkoHLV21XzBkgwHkyOeQWXxV1jocoSHYDApsW2kUsRHNGkfkO', 'student', 'active', '2025-08-29 06:50:51', '2025-08-29 06:50:51'),
(8, 'selina55@gmail.com', 'selina55@gmail.com', '$2y$10$BUB5vbr8lK6VE/2IBr6euOqDzv79EY0cmp6qBM/XPFKXBn0FLV3Hu', 'student', 'active', '2025-08-29 06:53:35', '2025-08-29 06:53:35');

-- --------------------------------------------------------

--
-- 資料表結構 `user_activities`
--

CREATE TABLE `user_activities` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('upload','view','like','comment','badge') NOT NULL,
  `description` varchar(255) NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `user_activities`
--

INSERT INTO `user_activities` (`id`, `user_id`, `type`, `description`, `metadata`, `created_at`, `updated_at`) VALUES
(1, 5, 'upload', '上傳了新作品「我的第一個作品」', '{\"portfolio_id\": 16}', '2025-08-29 16:42:48', NULL),
(2, 5, 'like', '你的作品獲得一個讚', '{\"portfolio_id\": 6}', '2025-08-29 16:42:48', NULL),
(3, 5, 'upload', '上傳新作品：資料儀表板設計與視覺化', '{\"portfolio_id\": 20, \"title\": \"資料儀表板設計與視覺化\"}', '2025-09-06 15:35:03', NULL),
(4, 5, 'view', '你的作品獲得 50 次新瀏覽', '{\"portfolio_id\": 20, \"delta_views\": 50}', '2025-09-07 15:35:03', NULL),
(5, 5, 'like', '有人對你的作品按讚', '{\"portfolio_id\": 20, \"liker\": \"匿名\"}', '2025-09-08 03:35:03', NULL),
(6, 5, 'comment', '有人留言：「視覺排版清楚，互動過濾很實用！」', '{\"portfolio_id\": 20, \"comment_preview\": \"視覺排版清楚...\"}', '2025-09-08 09:35:03', NULL);

-- --------------------------------------------------------

--
-- 資料表結構 `user_badges`
--

CREATE TABLE `user_badges` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `badge_id` int(11) NOT NULL,
  `achieved_at` datetime NOT NULL DEFAULT current_timestamp(),
  `notes` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `user_badges`
--

INSERT INTO `user_badges` (`id`, `user_id`, `badge_id`, `achieved_at`, `notes`) VALUES
(1, 5, 1, '2025-08-24 16:32:01', NULL),
(2, 5, 3, '2025-08-25 16:32:01', NULL),
(3, 5, 2, '2025-08-26 16:32:01', NULL),
(4, 5, 5, '2025-09-08 12:35:03', '累積點讚達標');

-- --------------------------------------------------------

--
-- 資料表結構 `user_settings`
--

CREATE TABLE `user_settings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('boolean','string','number','json') NOT NULL DEFAULT 'string',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `user_settings`
--

INSERT INTO `user_settings` (`id`, `user_id`, `setting_key`, `setting_value`, `setting_type`, `created_at`, `updated_at`) VALUES
(1, 5, 'email_notification', '1', 'boolean', '2025-08-28 23:10:55', '2025-08-28 23:10:55'),
(5, 5, 'notification_frequency', 'daily', 'string', '2025-08-28 23:10:55', '2025-08-28 23:10:55'),
(4, 5, 'profile_visibility', 'public', 'string', '2025-08-28 23:10:55', '2025-08-28 23:10:55'),
(2, 5, 'public_profile', '1', 'boolean', '2025-08-28 23:10:55', '2025-08-28 23:10:55'),
(3, 5, 'two_factor_auth', '0', 'boolean', '2025-08-28 23:10:55', '2025-08-28 23:10:55');

-- --------------------------------------------------------

--
-- 資料表結構 `user_social_media`
--

CREATE TABLE `user_social_media` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `platform` enum('github','linkedin','instagram','facebook','twitter','youtube','blog') NOT NULL,
  `url` varchar(255) NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `user_social_media`
--

INSERT INTO `user_social_media` (`id`, `user_id`, `platform`, `url`, `is_public`, `created_at`, `updated_at`) VALUES
(1, 5, 'github', 'https://github.com/huangwensyuan', 1, '2025-08-28 23:10:55', '2025-08-28 23:10:55'),
(2, 5, 'linkedin', 'https://linkedin.com/in/huangwensyuan', 1, '2025-08-28 23:10:55', '2025-08-28 23:10:55'),
(3, 5, 'instagram', 'wensyuan_huang', 1, '2025-08-28 23:10:55', '2025-08-28 23:10:55'),
(4, 5, 'facebook', 'wensyuan.huang', 0, '2025-08-28 23:10:55', '2025-08-28 23:10:55');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `badges`
--
ALTER TABLE `badges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_badges_name` (`name`);

--
-- 資料表索引 `bookmarks`
--
ALTER TABLE `bookmarks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_bookmark` (`user_id`,`portfolio_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_portfolio_id` (`portfolio_id`);

--
-- 資料表索引 `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- 資料表索引 `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_portfolio_id` (`portfolio_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_parent_id` (`parent_id`);

--
-- 資料表索引 `enterprise_analytics`
--
ALTER TABLE `enterprise_analytics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_enterprise_date` (`enterprise_id`,`date`),
  ADD KEY `idx_enterprise_id` (`enterprise_id`),
  ADD KEY `idx_date` (`date`);

--
-- 資料表索引 `enterprise_bookmarks`
--
ALTER TABLE `enterprise_bookmarks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_enterprise_bookmark` (`enterprise_id`,`portfolio_id`),
  ADD KEY `idx_enterprise_id` (`enterprise_id`),
  ADD KEY `idx_portfolio_id` (`portfolio_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- 資料表索引 `enterprise_contacts`
--
ALTER TABLE `enterprise_contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_enterprise_id` (`enterprise_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_contact_type` (`contact_type`),
  ADD KEY `idx_contact_date` (`contact_date`);

--
-- 資料表索引 `enterprise_profiles`
--
ALTER TABLE `enterprise_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_company_name` (`company_name`);

--
-- 資料表索引 `enterprise_views`
--
ALTER TABLE `enterprise_views`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_enterprise_id` (`enterprise_id`),
  ADD KEY `idx_portfolio_id` (`portfolio_id`),
  ADD KEY `idx_view_date` (`view_date`);

--
-- 資料表索引 `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_enterprise_id` (`enterprise_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_job_type` (`job_type`),
  ADD KEY `idx_location` (`location`),
  ADD KEY `idx_published_at` (`published_at`);
ALTER TABLE `jobs` ADD FULLTEXT KEY `idx_search` (`title`,`description`,`requirements`,`skills_required`);

--
-- 資料表索引 `job_applications`
--
ALTER TABLE `job_applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_application` (`job_id`,`student_id`),
  ADD KEY `idx_job_id` (`job_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- 資料表索引 `likes`
--
ALTER TABLE `likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_like` (`user_id`,`portfolio_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_portfolio_id` (`portfolio_id`);

--
-- 資料表索引 `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sender_id` (`sender_id`),
  ADD KEY `idx_receiver_id` (`receiver_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- 資料表索引 `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- 資料表索引 `password_resets`
--
ALTER TABLE `password_resets`
  ADD KEY `password_resets_ibfk_1` (`user_id`);

--
-- 資料表索引 `portfolios`
--
ALTER TABLE `portfolios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_category_id` (`category_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_published_at` (`published_at`),
  ADD KEY `idx_portfolios_user` (`user_id`);
ALTER TABLE `portfolios` ADD FULLTEXT KEY `idx_search` (`title`,`description`,`tags`);

--
-- 資料表索引 `portfolio_comments`
--
ALTER TABLE `portfolio_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_portfolio_comments_portfolio` (`portfolio_id`),
  ADD KEY `idx_portfolio_comments_user` (`user_id`);

--
-- 資料表索引 `portfolio_files`
--
ALTER TABLE `portfolio_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_portfolio_id` (`portfolio_id`);

--
-- 資料表索引 `resumes`
--
ALTER TABLE `resumes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_template` (`template`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- 資料表索引 `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_student_id` (`student_id`);

--
-- 資料表索引 `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `uniq_users_username` (`username`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- 資料表索引 `user_activities`
--
ALTER TABLE `user_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_user_activities_user` (`user_id`);

--
-- 資料表索引 `user_badges`
--
ALTER TABLE `user_badges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_user_badge` (`user_id`,`badge_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_badge` (`badge_id`);

--
-- 資料表索引 `user_settings`
--
ALTER TABLE `user_settings`
  ADD UNIQUE KEY `uniq_user_settings_user_key` (`user_id`,`setting_key`),
  ADD KEY `idx_user_settings_user` (`user_id`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `badges`
--
ALTER TABLE `badges`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `bookmarks`
--
ALTER TABLE `bookmarks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `enterprise_analytics`
--
ALTER TABLE `enterprise_analytics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `enterprise_bookmarks`
--
ALTER TABLE `enterprise_bookmarks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `enterprise_contacts`
--
ALTER TABLE `enterprise_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `enterprise_profiles`
--
ALTER TABLE `enterprise_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `enterprise_views`
--
ALTER TABLE `enterprise_views`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `job_applications`
--
ALTER TABLE `job_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `likes`
--
ALTER TABLE `likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `portfolios`
--
ALTER TABLE `portfolios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `portfolio_comments`
--
ALTER TABLE `portfolio_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `portfolio_files`
--
ALTER TABLE `portfolio_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `resumes`
--
ALTER TABLE `resumes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `student_profiles`
--
ALTER TABLE `student_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `user_activities`
--
ALTER TABLE `user_activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `user_badges`
--
ALTER TABLE `user_badges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `bookmarks`
--
ALTER TABLE `bookmarks`
  ADD CONSTRAINT `bookmarks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookmarks_ibfk_2` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `enterprise_analytics`
--
ALTER TABLE `enterprise_analytics`
  ADD CONSTRAINT `enterprise_analytics_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `enterprise_bookmarks`
--
ALTER TABLE `enterprise_bookmarks`
  ADD CONSTRAINT `enterprise_bookmarks_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enterprise_bookmarks_ibfk_2` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `enterprise_contacts`
--
ALTER TABLE `enterprise_contacts`
  ADD CONSTRAINT `enterprise_contacts_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enterprise_contacts_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `enterprise_profiles`
--
ALTER TABLE `enterprise_profiles`
  ADD CONSTRAINT `enterprise_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `enterprise_views`
--
ALTER TABLE `enterprise_views`
  ADD CONSTRAINT `enterprise_views_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enterprise_views_ibfk_2` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `jobs`
--
ALTER TABLE `jobs`
  ADD CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `job_applications`
--
ALTER TABLE `job_applications`
  ADD CONSTRAINT `job_applications_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `job_applications_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `likes`
--
ALTER TABLE `likes`
  ADD CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `portfolios`
--
ALTER TABLE `portfolios`
  ADD CONSTRAINT `portfolios_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portfolios_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- 資料表的限制式 `portfolio_files`
--
ALTER TABLE `portfolio_files`
  ADD CONSTRAINT `portfolio_files_ibfk_1` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `resumes`
--
ALTER TABLE `resumes`
  ADD CONSTRAINT `fk_resumes_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `resumes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD CONSTRAINT `student_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `user_activities`
--
ALTER TABLE `user_activities`
  ADD CONSTRAINT `fk_user_activities_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
