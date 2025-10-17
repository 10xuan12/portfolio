-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： localhost
-- 產生時間： 2025-10-08 12:10:14
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
-- 資料表結構 `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL COMMENT '執行審核的管理員 ID',
  `action_type` enum('approve','reject','suspend','delete','edit','warning') NOT NULL COMMENT '操作類型',
  `target_type` enum('user','portfolio','job','comment','enterprise','report') NOT NULL COMMENT '審核對象類型',
  `target_id` int(11) NOT NULL COMMENT '審核對象 ID',
  `target_user_id` int(11) DEFAULT NULL COMMENT '被審核的用戶 ID',
  `reason` varchar(500) DEFAULT NULL COMMENT '審核原因',
  `details` text DEFAULT NULL COMMENT '詳細說明',
  `before_data` longtext DEFAULT NULL COMMENT '變更前數據（JSON）',
  `after_data` longtext DEFAULT NULL COMMENT '變更後數據（JSON）',
  `ip_address` varchar(45) DEFAULT NULL COMMENT '操作 IP 位址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '瀏覽器資訊',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='審核歷史記錄表';

-- --------------------------------------------------------

--
-- 資料表結構 `available_timeslots`
--

CREATE TABLE `available_timeslots` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT '用戶 ID',
  `day_of_week` int(11) NOT NULL COMMENT '星期幾（0=日, 1=一, ..., 6=六）',
  `start_time` time NOT NULL COMMENT '開始時間',
  `end_time` time NOT NULL COMMENT '結束時間',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否啟用',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='可用時間段表';

--
-- 傾印資料表的資料 `available_timeslots`
--

INSERT INTO `available_timeslots` (`id`, `user_id`, `day_of_week`, `start_time`, `end_time`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 5, 1, '09:00:00', '12:00:00', 1, '2025-10-08 09:52:56', '2025-10-08 09:52:56'),
(2, 5, 1, '14:00:00', '17:00:00', 1, '2025-10-08 09:52:56', '2025-10-08 09:52:56'),
(3, 5, 3, '09:00:00', '12:00:00', 1, '2025-10-08 09:52:56', '2025-10-08 09:52:56'),
(4, 5, 5, '14:00:00', '18:00:00', 1, '2025-10-08 09:52:56', '2025-10-08 09:52:56'),
(5, 5, 1, '09:00:00', '12:00:00', 1, '2025-10-08 10:00:47', '2025-10-08 10:00:47'),
(6, 5, 1, '14:00:00', '17:00:00', 1, '2025-10-08 10:00:47', '2025-10-08 10:00:47'),
(7, 5, 3, '09:00:00', '12:00:00', 1, '2025-10-08 10:00:47', '2025-10-08 10:00:47'),
(8, 5, 5, '14:00:00', '18:00:00', 1, '2025-10-08 10:00:47', '2025-10-08 10:00:47');

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
(1, '初次登入', '第一次登入系統', 'bi bi-box-arrow-in-right', 'achievement', 1),
(2, '首次上傳', '上傳第一個作品', 'bi bi-cloud-upload', 'achievement', 5),
(3, '完整個人檔案', '完成個人基本資料', 'bi bi-person-circle', 'achievement', 10),
(4, '熱門作品', '作品瀏覽數破 100', 'bi bi-fire', 'achievement', 100),
(5, '明星創作者', '累積 10 個讚', 'bi bi-star-fill', 'achievement', 10);

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
(1, 5, 9, '2025-08-29 07:10:55'),
(2, 5, 6, '2025-09-17 02:30:00'),
(3, 5, 8, '2025-09-17 02:35:00'),
(4, 5, 10, '2025-09-17 02:40:00');

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
  `report_count` int(11) NOT NULL DEFAULT 0 COMMENT '被檢舉次數',
  `is_flagged` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否被標記',
  `is_approved` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `comments`
--

INSERT INTO `comments` (`id`, `portfolio_id`, `user_id`, `parent_id`, `content`, `rating`, `like_count`, `report_count`, `is_flagged`, `is_approved`, `created_at`, `updated_at`) VALUES
(1, 6, 5, NULL, '這份分析報告非常詳細，數據視覺化做得很好！', NULL, 0, 0, 0, 1, '2025-08-29 15:10:55', '2025-08-29 15:10:55'),
(2, 7, 5, NULL, '策略規劃很實用，對中小企業很有幫助。', NULL, 0, 0, 0, 1, '2025-08-29 15:10:55', '2025-08-29 15:10:55'),
(3, 18, 5, NULL, '這是一則測試留言，系統檢查通過。', 5, 0, 0, 0, 1, '2025-09-02 17:31:09', '2025-09-02 17:31:09'),
(4, 18, 5, NULL, '父留言：這是測試父留言內容。', 5, 0, 0, 0, 1, '2025-09-02 17:33:01', '2025-09-02 17:33:01'),
(5, 18, 5, 4, '子留言一：這是回覆父留言。', 4, 0, 0, 0, 1, '2025-09-02 17:33:02', '2025-09-02 17:33:02'),
(6, 18, 5, 4, '子留言二：第二則回覆父留言。', 3, 0, 0, 0, 1, '2025-09-02 17:33:02', '2025-09-02 17:33:02'),
(7, 18, 5, 6, '子留言的回覆：這是更深一層的回覆。', 5, 0, 0, 0, 1, '2025-09-02 17:33:02', '2025-09-02 17:33:02');

--
-- 觸發器 `comments`
--
DELIMITER $$
CREATE TRIGGER `update_portfolio_comment_count_delete` AFTER DELETE ON `comments` FOR EACH ROW BEGIN
    UPDATE portfolios 
    SET comment_count = GREATEST(comment_count - 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.portfolio_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_portfolio_comment_count_insert` AFTER INSERT ON `comments` FOR EACH ROW BEGIN
    UPDATE portfolios 
    SET comment_count = comment_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.portfolio_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- 資料表結構 `content_moderation`
--

CREATE TABLE `content_moderation` (
  `id` int(11) NOT NULL,
  `content_type` enum('portfolio','job','comment') NOT NULL COMMENT '內容類型',
  `content_id` int(11) NOT NULL COMMENT '內容 ID',
  `status` enum('pending','approved','rejected','flagged') NOT NULL DEFAULT 'pending' COMMENT '審核狀態',
  `reviewed_by` int(11) DEFAULT NULL COMMENT '審核人員 ID',
  `review_notes` text DEFAULT NULL COMMENT '審核備註',
  `flags` longtext DEFAULT NULL COMMENT '標記原因（JSON）',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '提交時間',
  `reviewed_at` timestamp NULL DEFAULT NULL COMMENT '審核時間',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='內容審核狀態表';

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
(8, '經濟學系', 'ECON', '靜宜大學', '培養經濟學專業人才，專精於經濟理論與政策分析', 1, 8, '2025-08-29 02:37:33', '2025-08-29 02:37:33'),
(9, '資訊安全學系', 'INFOSEC', '靜宜大學', '資訊安全、資安管理與滲透測試', 1, 9, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(10, '資料科學學系', 'DS', '靜宜大學', '資料探勘、機器學習與數據工程', 1, 10, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(11, '人工智慧學系', 'AI', '靜宜大學', '深度學習、電腦視覺與自然語言處理', 1, 11, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(12, '電機工程學系', 'EE', '靜宜大學', '電機系統、通訊與控制工程', 1, 12, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(13, '電子工程學系', 'ECE', '靜宜大學', '半導體、嵌入式系統與物聯網', 1, 13, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(14, '機械工程學系', 'ME', '靜宜大學', '機械設計、製造與自動化', 1, 14, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(15, '土木工程學系', 'CE', '靜宜大學', '結構、營建與永續工程', 1, 15, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(16, '化學工程學系', 'CHE', '靜宜大學', '製程設計、材料與環境工程', 1, 16, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(17, '材料科學與工程學系', 'MSE', '靜宜大學', '材料科學、奈米與先進製造', 1, 17, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(18, '生物醫學工程學系', 'BME', '靜宜大學', '醫療儀器、生醫訊號與醫材', 1, 18, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(19, '數學系', 'MATH', '靜宜大學', '純數、應用數學與統計', 1, 19, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(20, '物理學系', 'PHYS', '靜宜大學', '基礎物理、量測與計算物理', 1, 20, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(21, '化學系', 'CHEM', '靜宜大學', '有機、無機、分析與物化', 1, 21, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(22, '生命科學系', 'BIO', '靜宜大學', '分生、生態與生物技術', 1, 22, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(23, '心理學系', 'PSY', '靜宜大學', '基礎心理、測評與諮商', 1, 23, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(24, '社會學系', 'SOC', '靜宜大學', '社會理論、研究方法與政策', 1, 24, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(25, '外國語文學系', 'LANG', '靜宜大學', '英語、第二外語與跨文化溝通', 1, 25, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(26, '中國文學系', 'CHIN', '靜宜大學', '國學、現代文學與寫作', 1, 26, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(27, '歷史學系', 'HIST', '靜宜大學', '世界史、臺灣史與史學方法', 1, 27, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(28, '哲學系', 'PHIL', '靜宜大學', '倫理、形上與邏輯', 1, 28, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(29, '觀光暨休閒學系', 'TOUR', '靜宜大學', '觀光管理、餐旅與休閒規劃', 1, 29, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(30, '大眾傳播學系', 'COMM', '靜宜大學', '新聞、廣告、公關與數位媒體', 1, 30, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(31, '教育學系', 'EDU', '靜宜大學', '課程教學、教育科技與評量', 1, 31, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(32, '醫學系', 'MED', '靜宜大學', '臨床醫學與基礎醫學', 1, 32, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(33, '護理學系', 'NURS', '靜宜大學', '臨床護理、社區護理與長照', 1, 33, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(34, '公共衛生學系', 'PH', '靜宜大學', '流病、環衛與健康政策', 1, 34, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(35, '建築學系', 'ARCH', '靜宜大學', '建築設計、都市與永續', 1, 35, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(36, '都市計畫學系', 'URP', '靜宜大學', '都市規劃、土地使用與交通', 1, 36, '2025-08-28 18:37:33', '2025-08-28 18:37:33'),
(37, '人力資源管理學系', 'HRM', '靜宜大學', '招募、人才發展與薪酬制度', 1, 37, '2025-08-28 18:37:33', '2025-08-28 18:37:33');

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

--
-- 傾印資料表的資料 `enterprise_analytics`
--

INSERT INTO `enterprise_analytics` (`id`, `enterprise_id`, `date`, `portfolio_views`, `portfolio_bookmarks`, `student_contacts`, `job_views`, `job_applications`, `created_at`) VALUES
(1, 10, '2025-09-22', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(2, 10, '2025-09-21', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(3, 10, '2025-09-20', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(4, 10, '2025-09-19', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(5, 10, '2025-09-18', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(6, 10, '2025-09-17', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(7, 10, '2025-09-16', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(8, 11, '2025-09-22', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(9, 11, '2025-09-21', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(10, 11, '2025-09-20', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(11, 11, '2025-09-19', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(12, 11, '2025-09-18', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(13, 11, '2025-09-17', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(14, 11, '2025-09-16', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(15, 12, '2025-09-22', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(16, 12, '2025-09-21', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(17, 12, '2025-09-20', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(18, 12, '2025-09-19', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(19, 12, '2025-09-18', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(20, 12, '2025-09-17', 0, 0, 0, 0, 0, '2025-09-22 09:18:57'),
(21, 12, '2025-09-16', 0, 0, 0, 0, 0, '2025-09-22 09:18:57');

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

--
-- 傾印資料表的資料 `enterprise_bookmarks`
--

INSERT INTO `enterprise_bookmarks` (`id`, `enterprise_id`, `portfolio_id`, `notes`, `created_at`) VALUES
(1, 10, 6, '初始收藏', '2025-09-22 09:21:55'),
(2, 10, 8, '初始收藏', '2025-09-22 09:21:55'),
(3, 10, 9, '初始收藏', '2025-09-22 09:21:55'),
(4, 11, 7, '熱門作品', '2025-09-22 09:21:56'),
(5, 11, 8, '熱門作品', '2025-09-22 09:21:56'),
(6, 11, 10, '熱門作品', '2025-09-22 09:21:56'),
(9, 12, 18, '候選人追蹤', '2025-09-22 09:21:56');

--
-- 觸發器 `enterprise_bookmarks`
--
DELIMITER $$
CREATE TRIGGER `update_enterprise_bookmark_stats` AFTER INSERT ON `enterprise_bookmarks` FOR EACH ROW BEGIN
    INSERT INTO enterprise_analytics (enterprise_id, date, portfolio_bookmarks)
    VALUES (NEW.enterprise_id, CURDATE(), 1)
    ON DUPLICATE KEY UPDATE 
        portfolio_bookmarks = portfolio_bookmarks + 1;
END
$$
DELIMITER ;

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

--
-- 傾印資料表的資料 `enterprise_contacts`
--

INSERT INTO `enterprise_contacts` (`id`, `enterprise_id`, `student_id`, `contact_type`, `subject`, `message`, `contact_date`, `is_read`) VALUES
(1, 10, 5, 'message', '關於作品 Python 爬蟲程式開發', '您好，我們對您的作品「Python 爬蟲程式開發」很感興趣，方便進一步聯繫嗎？', '2025-09-24 07:44:39', 0),
(2, 10, 5, 'message', '關於作品 Python 爬蟲程式開發', '您好，我們對您的作品「Python 爬蟲程式開發」很感興趣，方便進一步聯繫嗎？', '2025-09-24 07:44:47', 0),
(3, 10, 5, 'message', '企業聯絡', '您好，我們對您的背景（Python, JavaScript, HTML/CSS）很感興趣，方便進一步聯繫嗎？', '2025-09-24 08:37:55', 0);

--
-- 觸發器 `enterprise_contacts`
--
DELIMITER $$
CREATE TRIGGER `update_enterprise_contact_stats` AFTER INSERT ON `enterprise_contacts` FOR EACH ROW BEGIN
    INSERT INTO enterprise_analytics (enterprise_id, date, student_contacts)
    VALUES (NEW.enterprise_id, CURDATE(), 1)
    ON DUPLICATE KEY UPDATE 
        student_contacts = student_contacts + 1;
END
$$
DELIMITER ;

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

--
-- 傾印資料表的資料 `enterprise_profiles`
--

INSERT INTO `enterprise_profiles` (`id`, `user_id`, `company_name`, `company_type`, `industry`, `company_size`, `founded_year`, `employee_count`, `revenue_range`, `description`, `logo_url`, `website`, `address`, `phone`, `contact_person`, `contact_email`, `social_media`, `company_culture`, `benefits_description`, `is_verified`, `verification_date`, `created_at`, `updated_at`) VALUES
(2, 10, '台灣微軟股份有限公司', '科技', '資訊軟體', '201-500', 1990, 300, 'NT$1B+', '台灣微軟是微軟在台灣的分公司，致力於提供創新的雲端服務與企業數位轉型解決方案，協助企業提升競爭力。', 'uploads/enterprise/logos/microsoft_tw_logo.jpg', 'https://www.microsoft.com/zh-tw', '台北市信義區', '02-1234-5678', 'HR 團隊', 'hr@microsoft.com.tw', '{\"linkedin\": \"https://www.linkedin.com/company/microsoft\", \"website\": \"https://www.microsoft.com\"}', '我們重視多元包容、鼓勵創新思維，提供員工充分的成長空間與學習資源。', '完善的員工福利，包括：年終獎金、員工旅遊、彈性工時、遠距工作、教育訓練補助、健康檢查。', 1, '2025-10-07 11:16:40', '2025-09-22 09:18:56', '2025-10-08 08:45:40'),
(3, 11, 'Google 台灣', '科技', '網路服務', '201-500', 2006, 400, 'NT$1B+', 'Google 台灣是 Google 在台灣的研發與營運據點，專注於創新技術研發與產品開發。', 'uploads/enterprise/logos/google_tw_logo.jpg', 'https://about.google', '台北市信義區', '02-5678-1234', 'HR Team', 'hr@google.com.tw', '{\"linkedin\": \"https://www.linkedin.com/company/google\", \"website\": \"https://about.google\"}', '以使用者為中心，鼓勵創新與實驗精神，打造開放友善的工作環境。', '業界領先的薪資福利、彈性工時、免費三餐、健身房、交通補助、股票選擇權。', 1, '2025-10-07 11:16:40', '2025-09-22 09:18:56', '2025-10-08 08:45:40'),
(4, 12, 'Apple 台灣', '科技', '硬體/軟體', '201-500', 2001, 350, 'NT$1B+', 'Apple 台灣專注於產品設計、軟硬體整合與創新服務開發，追求卓越的產品品質。', 'uploads/enterprise/logos/apple_tw_logo.jpg', 'https://www.apple.com/tw', '台北市內湖區', '02-9876-5432', 'HR Team', 'hr@apple.com.tw', '{\"linkedin\": \"https://www.linkedin.com/company/apple\", \"website\": \"https://www.apple.com\"}', '追求完美、注重細節、設計導向的文化，激發團隊創造力與專業能力。', '員工購買優惠、完善的健康保險、教育訓練計畫、年度健康檢查、績效獎金。', 1, '2025-10-07 11:16:40', '2025-09-22 09:18:56', '2025-10-08 08:45:40');

-- --------------------------------------------------------

--
-- 資料表結構 `enterprise_recommendations`
--

CREATE TABLE `enterprise_recommendations` (
  `id` int(11) NOT NULL,
  `enterprise_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `score` decimal(5,2) NOT NULL DEFAULT 0.00,
  `reason` varchar(255) DEFAULT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL
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
-- 資料表結構 `interviews`
--

CREATE TABLE `interviews` (
  `id` int(11) NOT NULL,
  `enterprise_id` int(11) NOT NULL COMMENT '企業 ID',
  `student_id` int(11) NOT NULL COMMENT '學生 ID',
  `job_id` int(11) DEFAULT NULL COMMENT '相關職缺 ID',
  `application_id` int(11) DEFAULT NULL COMMENT '相關應徵 ID',
  `title` varchar(200) NOT NULL COMMENT '面試標題',
  `type` enum('phone','video','onsite','other') NOT NULL DEFAULT 'video' COMMENT '面試類型',
  `status` enum('scheduled','confirmed','rescheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled' COMMENT '面試狀態',
  `scheduled_at` datetime NOT NULL COMMENT '預定時間',
  `duration` int(11) NOT NULL DEFAULT 60 COMMENT '預計時長（分鐘）',
  `location` varchar(500) DEFAULT NULL COMMENT '面試地點/連結',
  `video_link` varchar(500) DEFAULT NULL COMMENT '視訊會議連結',
  `description` text DEFAULT NULL COMMENT '面試說明',
  `notes` text DEFAULT NULL COMMENT '備註',
  `reminder_sent` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已發送提醒',
  `confirmed_by_student` tinyint(1) NOT NULL DEFAULT 0 COMMENT '學生是否確認',
  `confirmed_by_enterprise` tinyint(1) NOT NULL DEFAULT 0 COMMENT '企業是否確認',
  `feedback` text DEFAULT NULL COMMENT '面試回饋',
  `rating` int(11) DEFAULT NULL COMMENT '評分（1-5）',
  `created_by` int(11) NOT NULL COMMENT '建立者 ID',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面試安排表';

--
-- 傾印資料表的資料 `interviews`
--

INSERT INTO `interviews` (`id`, `enterprise_id`, `student_id`, `job_id`, `application_id`, `title`, `type`, `status`, `scheduled_at`, `duration`, `location`, `video_link`, `description`, `notes`, `reminder_sent`, `confirmed_by_student`, `confirmed_by_enterprise`, `feedback`, `rating`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 10, 5, 1, NULL, '前端工程師初試', 'video', 'scheduled', '2025-10-15 14:00:00', 60, 'Microsoft Teams', NULL, '技術面試，請準備作品展示', NULL, 0, 0, 0, NULL, NULL, 10, '2025-10-08 09:52:55', '2025-10-08 09:52:55'),
(2, 11, 5, 2, NULL, '資料分析師面談', 'video', 'confirmed', '2025-10-18 10:00:00', 45, 'Google Meet', NULL, '與團隊主管面談', NULL, 0, 0, 0, NULL, NULL, 11, '2025-10-08 09:52:55', '2025-10-08 09:52:55'),
(3, 10, 5, 1, NULL, '前端工程師初試', 'video', 'scheduled', '2025-10-15 14:00:00', 60, 'Microsoft Teams', NULL, '技術面試，請準備作品展示', NULL, 0, 0, 0, NULL, NULL, 10, '2025-10-08 10:00:46', '2025-10-08 10:00:46'),
(4, 11, 5, 2, NULL, '資料分析師面談', 'video', 'confirmed', '2025-10-18 10:00:00', 45, 'Google Meet', NULL, '與團隊主管面談', NULL, 0, 0, 0, NULL, NULL, 11, '2025-10-08 10:00:46', '2025-10-08 10:00:46');

--
-- 觸發器 `interviews`
--
DELIMITER $$
CREATE TRIGGER `create_notification_on_interview` AFTER INSERT ON `interviews` FOR EACH ROW BEGIN
    DECLARE company_name VARCHAR(100);
    DECLARE student_name VARCHAR(100);
    
    -- 取得企業名稱
    SELECT ep.company_name INTO company_name
    FROM enterprise_profiles ep
    WHERE ep.user_id = NEW.enterprise_id;
    
    -- 取得學生姓名
    SELECT COALESCE(sp.display_name, u.username) INTO student_name
    FROM users u
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    WHERE u.id = NEW.student_id;
    
    -- 通知學生
    INSERT INTO notifications (user_id, type, title, message, data, is_read)
    VALUES (
        NEW.student_id,
        'enterprise',
        '新面試邀請',
        CONCAT(company_name, ' 邀請您進行面試：', NEW.title, '，時間：', DATE_FORMAT(NEW.scheduled_at, '%Y-%m-%d %H:%i')),
        JSON_OBJECT(
            'interview_id', NEW.id,
            'company_name', company_name,
            'scheduled_at', NEW.scheduled_at
        ),
        0
    );
    
    -- 通知企業
    INSERT INTO notifications (user_id, type, title, message, data, is_read)
    VALUES (
        NEW.enterprise_id,
        'system',
        '面試已建立',
        CONCAT('已建立與 ', student_name, ' 的面試：', NEW.title),
        JSON_OBJECT(
            'interview_id', NEW.id,
            'student_name', student_name,
            'scheduled_at', NEW.scheduled_at
        ),
        0
    );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- 資料表結構 `interview_reminders`
--

CREATE TABLE `interview_reminders` (
  `id` int(11) NOT NULL,
  `interview_id` int(11) NOT NULL COMMENT '面試 ID',
  `remind_at` datetime NOT NULL COMMENT '提醒時間',
  `remind_type` enum('email','notification','both') NOT NULL DEFAULT 'both' COMMENT '提醒方式',
  `is_sent` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已發送',
  `sent_at` timestamp NULL DEFAULT NULL COMMENT '發送時間',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面試提醒表';

--
-- 傾印資料表的資料 `interview_reminders`
--

INSERT INTO `interview_reminders` (`id`, `interview_id`, `remind_at`, `remind_type`, `is_sent`, `sent_at`, `created_at`) VALUES
(1, 1, '2025-10-15 13:00:00', 'both', 0, NULL, '2025-10-08 09:52:56'),
(2, 1, '2025-10-14 14:00:00', 'notification', 0, NULL, '2025-10-08 09:52:56'),
(3, 2, '2025-10-18 09:00:00', 'both', 0, NULL, '2025-10-08 09:52:56'),
(4, 1, '2025-10-15 13:00:00', 'both', 0, NULL, '2025-10-08 10:00:46'),
(5, 1, '2025-10-14 14:00:00', 'notification', 0, NULL, '2025-10-08 10:00:46'),
(6, 2, '2025-10-18 09:00:00', 'both', 0, NULL, '2025-10-08 10:00:46');

-- --------------------------------------------------------

--
-- 資料表結構 `interview_reschedules`
--

CREATE TABLE `interview_reschedules` (
  `id` int(11) NOT NULL,
  `interview_id` int(11) NOT NULL COMMENT '面試 ID',
  `old_scheduled_at` datetime NOT NULL COMMENT '原預定時間',
  `new_scheduled_at` datetime NOT NULL COMMENT '新預定時間',
  `reason` varchar(500) DEFAULT NULL COMMENT '改期原因',
  `requested_by` int(11) NOT NULL COMMENT '請求改期的用戶 ID',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面試改期記錄';

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
  `report_count` int(11) NOT NULL DEFAULT 0 COMMENT '被檢舉次數',
  `is_flagged` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否被標記',
  `published_at` timestamp NULL DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `jobs`
--

INSERT INTO `jobs` (`id`, `enterprise_id`, `title`, `description`, `requirements`, `responsibilities`, `salary_min`, `salary_max`, `salary_type`, `job_type`, `location`, `department`, `experience_level`, `education_level`, `skills_required`, `benefits`, `status`, `view_count`, `application_count`, `bookmark_count`, `is_featured`, `report_count`, `is_flagged`, `published_at`, `deadline`, `created_at`, `updated_at`) VALUES
(1, 10, '軟體工程師', '負責前端產品開發與最佳化，參與系統架構設計，與團隊協作開發高品質的軟體產品。', '熟悉 JavaScript、React、HTML、CSS、Git 等前端技術，具備良好的問題解決能力。', '開發和維護前端應用程式、參與產品設計討論、編寫技術文件、協助團隊成員解決技術問題。', 60000.00, 100000.00, '月薪', '實習', '台北市', '技術部', '1-3年', '大學', 'JavaScript, React, HTML, CSS, Git, TypeScript', '', 'active', 0, 0, 0, 0, 0, 0, '2025-09-27 06:51:37', '2025-11-21', '2025-09-22 09:18:56', '2025-10-07 11:16:37'),
(2, 11, '資料分析師', '負責數據分析與可視化儀表板。', '熟悉 SQL、Python、BI 工具', '建立數據報表、協助決策', 70000.00, 110000.00, '月薪', '全職', '台北市', '數據部', '1-3年', '大學', 'Python,SQL,PowerBI,Tableau', '年終獎金, 在家工作', 'active', 0, 0, 0, 0, 0, 0, '2025-09-22 09:18:56', '2025-11-06', '2025-09-22 09:18:56', '2025-09-22 09:18:56');

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

--
-- 傾印資料表的資料 `job_applications`
--

INSERT INTO `job_applications` (`id`, `job_id`, `student_id`, `status`, `cover_letter`, `resume_url`, `portfolio_url`, `expected_salary`, `available_date`, `interview_date`, `interview_location`, `interview_notes`, `enterprise_notes`, `created_at`, `updated_at`) VALUES
(1, 1, 5, 'pending', '我對前端工程師職位很感興趣...', NULL, NULL, 45000.00, '2025-10-01', NULL, NULL, NULL, NULL, '2025-09-27 07:04:05', '2025-09-27 07:04:05'),
(2, 1, 9, 'accepted', '我有豐富的程式設計經驗...', NULL, NULL, 50000.00, '2025-10-15', NULL, NULL, NULL, '', '2025-09-27 07:04:05', '2025-09-27 07:22:27'),
(3, 2, 5, 'pending', '我專精於資料分析...', NULL, NULL, 55000.00, '2025-11-01', NULL, NULL, NULL, NULL, '2025-09-27 07:04:05', '2025-09-27 07:04:05');

--
-- 觸發器 `job_applications`
--
DELIMITER $$
CREATE TRIGGER `update_job_application_count_delete` AFTER DELETE ON `job_applications` FOR EACH ROW BEGIN
    UPDATE jobs 
    SET application_count = GREATEST(application_count - 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.job_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_job_application_count_insert` AFTER INSERT ON `job_applications` FOR EACH ROW BEGIN
    UPDATE jobs 
    SET application_count = application_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.job_id;
END
$$
DELIMITER ;

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
(21, 5, 6, '2025-09-17 03:00:00'),
(22, 5, 9, '2025-09-17 03:05:00'),
(23, 5, 10, '2025-09-17 03:10:00');

--
-- 觸發器 `likes`
--
DELIMITER $$
CREATE TRIGGER `update_portfolio_like_count_delete` AFTER DELETE ON `likes` FOR EACH ROW BEGIN
    UPDATE portfolios 
    SET like_count = GREATEST(like_count - 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.portfolio_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_portfolio_like_count_insert` AFTER INSERT ON `likes` FOR EACH ROW BEGIN
    UPDATE portfolios 
    SET like_count = like_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.portfolio_id;
END
$$
DELIMITER ;

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

--
-- 傾印資料表的資料 `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `subject`, `content`, `is_read`, `created_at`) VALUES
(1, 11, 5, '關於您的作品：資料儀表板', '您好，我是 Google HR，對您的資料儀表板作品很感興趣，方便約時間聊聊嗎？', 0, '2025-09-17 01:40:00'),
(2, 5, 11, 'Re: 關於您的作品：資料儀表板', '您好，感謝來信！本週三下午或週五上午都可以，請告知您方便的時段。', 0, '2025-09-17 02:05:00'),
(3, 12, 5, 'iOS/UI 相關實習機會', '您好，我們有一個 UI/UX 實習職缺，覺得您很合適，是否願意了解？', 0, '2025-09-17 04:20:00');

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
(3, 5, 'system', '系統維護通知', '系統將於今晚 23:00 至 01:00 進行例行維護作業，期間部分功能可能暫時無法使用，造成不便敬請見諒。', '{\"level\": \"info\"}', 1, '2025-08-29 08:42:39'),
(4, 5, 'view', '有人瀏覽了你的作品', '你的作品「Python 爬蟲程式開發」被瀏覽。', '{\"portfolio_id\": 9}', 1, '2025-08-29 08:42:39'),
(5, 5, 'system', '系統更新', 'Portfolio+ 已更新，提升了儀表板載入效能。', '{\"version\": \"2.0.2\"}', 0, '2025-09-07 07:35:03'),
(6, 5, 'like', '你的作品收到新的讚', '作品「資料儀表板設計與視覺化」新增 1 個讚。', '{\"portfolio_id\": 20}', 0, '2025-09-07 21:35:03'),
(7, 5, 'comment', '你的作品收到新的留言', '有人於「資料儀表板設計與視覺化」留下好評。', '{\"portfolio_id\": 20, \"comment_preview\": \"視覺排版清楚...\"}', 0, '2025-09-08 02:35:03'),
(8, 12, 'system', '歡迎使用企業儀表板', '您已成功加入企業端，開始搜尋合適人才吧！', '{\"level\": \"info\"}', 0, '2025-09-22 09:18:57'),
(9, 11, 'system', '歡迎使用企業儀表板', '您已成功加入企業端，開始搜尋合適人才吧！', '{\"level\": \"info\"}', 0, '2025-09-22 09:18:57'),
(10, 10, 'system', '歡迎使用企業儀表板', '您已成功加入企業端，開始搜尋合適人才吧！', '{\"level\": \"info\"}', 1, '2025-09-22 09:18:57'),
(11, 5, 'enterprise', '企業邀請面談', 'Apple HR 邀請你進行面談', '{\"enterprise\": \"Apple\", \"contact\": \"hr@apple.com.tw\"}', 0, '2025-09-17 04:30:00'),
(12, 5, 'view', '有人瀏覽了你的作品', '你的作品「Python 爬蟲程式開發」被 Apple HR 瀏覽。', '{\"portfolio_id\": 9, \"viewer\": \"Apple HR\"}', 0, '2025-09-17 04:31:00'),
(13, 5, 'like', '你的作品收到新的讚', 'Google HR 對你的作品「電商網站使用者行為分析」按讚。', '{\"portfolio_id\": 6, \"liker\": \"Google HR\"}', 0, '2025-09-17 04:32:00'),
(14, 5, 'enterprise', '台灣微軟股份有限公司 聯絡了您', '有企業對您的作品感興趣，請查看聯絡內容。', '{\"contact_id\":0}', 0, '2025-09-24 07:44:40'),
(15, 5, 'enterprise', '台灣微軟股份有限公司 聯絡了您', '有企業對您的作品感興趣，請查看聯絡內容。', '{\"contact_id\":0}', 0, '2025-09-24 07:44:47'),
(16, 5, 'enterprise', '台灣微軟股份有限公司 聯絡了您', '有企業對您的作品感興趣，請查看聯絡內容。', '{\"contact_id\":0}', 0, '2025-09-24 08:37:55'),
(17, 10, 'system', '系統維護通知', '系統將於今晚 23:00 至 01:00 進行例行維護作業，期間部分功能可能暫時無法使用，造成不便敬請見諒。', '{\"level\": \"warning\", \"maintenance_time\": \"2025-01-15 23:00:00\"}', 1, '2025-01-15 02:30:00'),
(18, 10, 'system', '新功能上線', '企業端新增「批量聯絡」功能，可一次聯絡多位候選人。', '{\"feature\": \"batch_contact\", \"version\": \"2.1.0\"}', 1, '2025-01-14 07:20:00'),
(19, 10, 'system', '資料備份完成', '您的企業資料已成功備份至雲端。', '{\"backup_date\": \"2025-01-14\", \"size\": \"2.3MB\"}', 1, '2025-01-13 18:00:00'),
(20, 11, 'system', '帳戶安全提醒', '偵測到異常登入活動，請檢查您的帳戶安全設定。', '{\"security_level\": \"high\", \"login_location\": \"台北市\"}', 0, '2025-01-15 01:15:00'),
(21, 11, 'system', 'API 配額更新', '您的 API 使用配額已更新，本月剩餘 95% 配額。', '{\"quota_used\": \"5%\", \"quota_remaining\": \"95%\"}', 0, '2025-01-14 04:00:00'),
(22, 12, 'system', '服務條款更新', '我們已更新服務條款，請查看最新版本。', '{\"document_version\": \"v3.2\", \"effective_date\": \"2025-01-20\"}', 0, '2025-01-13 08:45:00'),
(23, 12, 'system', '付款成功', '您的 Premium 方案付款已成功處理。', '{\"amount\": \"2990\", \"currency\": \"TWD\", \"plan\": \"premium\"}', 1, '2025-01-12 02:30:00'),
(25, 10, 'enterprise', '學生主動聯絡', '學生 黃玟瑄 對您的職缺「軟體工程師」感興趣，已發送履歷。', '{\"contact_id\": 1, \"student_name\": \"黃玟瑄\", \"job_title\": \"軟體工程師\", \"resume_sent\": true}', 1, '2025-01-15 06:30:00'),
(26, 10, 'enterprise', '學生主動聯絡', '學生 王小明 詢問關於「資料分析師」職缺的詳細資訊。', '{\"contact_id\": 2, \"student_name\": \"王小明\", \"job_title\": \"資料分析師\", \"inquiry_type\": \"job_details\"}', 1, '2025-01-15 03:20:00'),
(27, 10, 'enterprise', '學生主動聯絡', '學生 李美華 對您的公司文化很感興趣，希望了解更多。', '{\"contact_id\": 3, \"student_name\": \"李美華\", \"inquiry_type\": \"company_culture\"}', 1, '2025-01-14 08:45:00'),
(28, 11, 'enterprise', '學生主動聯絡', '學生 張志強 對您的職缺「前端工程師」感興趣，已發送作品集。', '{\"contact_id\": 4, \"student_name\": \"張志強\", \"job_title\": \"前端工程師\", \"portfolio_sent\": true}', 0, '2025-01-15 05:15:00'),
(29, 11, 'enterprise', '學生主動聯絡', '學生 陳雅婷 詢問實習機會，對「UI/UX 設計師」職位有興趣。', '{\"contact_id\": 5, \"student_name\": \"陳雅婷\", \"job_title\": \"UI/UX 設計師\", \"position_type\": \"internship\"}', 0, '2025-01-15 02:30:00'),
(30, 12, 'enterprise', '學生主動聯絡', '學生 林志明 對您的職缺「iOS 開發工程師」感興趣，已發送履歷。', '{\"contact_id\": 6, \"student_name\": \"林志明\", \"job_title\": \"iOS 開發工程師\", \"resume_sent\": true}', 0, '2025-01-15 04:00:00'),
(31, 12, 'enterprise', '學生主動聯絡', '學生 吳佳玲 詢問關於「產品經理」職缺的面試流程。', '{\"contact_id\": 7, \"student_name\": \"吳佳玲\", \"job_title\": \"產品經理\", \"inquiry_type\": \"interview_process\"}', 1, '2025-01-14 06:20:00'),
(32, 10, 'view', '職缺被瀏覽', '您的職缺「軟體工程師」被 15 位求職者瀏覽。', '{\"job_id\": 1, \"job_title\": \"軟體工程師\", \"view_count\": 15, \"viewers\": [\"學生A\", \"學生B\", \"學生C\"]}', 1, '2025-01-15 07:30:00'),
(33, 10, 'view', '職缺被瀏覽', '您的職缺「資料分析師」被 8 位求職者瀏覽。', '{\"job_id\": 2, \"job_title\": \"資料分析師\", \"view_count\": 8, \"viewers\": [\"學生D\", \"學生E\"]}', 1, '2025-01-15 06:15:00'),
(34, 10, 'view', '職缺被瀏覽', '您的職缺「專案經理」被 12 位求職者瀏覽。', '{\"job_id\": 3, \"job_title\": \"專案經理\", \"view_count\": 12, \"viewers\": [\"學生F\", \"學生G\", \"學生H\"]}', 1, '2025-01-14 10:20:00'),
(35, 11, 'view', '職缺被瀏覽', '您的職缺「前端工程師」被 22 位求職者瀏覽。', '{\"job_id\": 4, \"job_title\": \"前端工程師\", \"view_count\": 22, \"viewers\": [\"學生I\", \"學生J\", \"學生K\"]}', 0, '2025-01-15 08:45:00'),
(36, 11, 'view', '職缺被瀏覽', '您的職缺「後端工程師」被 18 位求職者瀏覽。', '{\"job_id\": 5, \"job_title\": \"後端工程師\", \"view_count\": 18, \"viewers\": [\"學生L\", \"學生M\"]}', 0, '2025-01-15 05:30:00'),
(37, 12, 'view', '職缺被瀏覽', '您的職缺「iOS 開發工程師」被 25 位求職者瀏覽。', '{\"job_id\": 6, \"job_title\": \"iOS 開發工程師\", \"view_count\": 25, \"viewers\": [\"學生N\", \"學生O\", \"學生P\"]}', 0, '2025-01-15 09:00:00'),
(38, 12, 'view', '職缺被瀏覽', '您的職缺「產品經理」被 10 位求職者瀏覽。', '{\"job_id\": 7, \"job_title\": \"產品經理\", \"view_count\": 10, \"viewers\": [\"學生Q\", \"學生R\"]}', 1, '2025-01-14 11:15:00'),
(39, 10, 'like', '職缺被按讚', '您的職缺「軟體工程師」收到了新的讚！', '{\"job_id\": 1, \"job_title\": \"軟體工程師\", \"liker_name\": \"學生A\", \"like_count\": 5}', 1, '2025-01-15 08:20:00'),
(40, 10, 'like', '職缺被按讚', '您的職缺「資料分析師」收到了新的讚！', '{\"job_id\": 2, \"job_title\": \"資料分析師\", \"liker_name\": \"學生B\", \"like_count\": 3}', 1, '2025-01-15 07:10:00'),
(41, 10, 'like', '職缺被按讚', '您的職缺「專案經理」收到了新的讚！', '{\"job_id\": 3, \"job_title\": \"專案經理\", \"liker_name\": \"學生C\", \"like_count\": 7}', 1, '2025-01-14 09:30:00'),
(42, 11, 'like', '職缺被按讚', '您的職缺「前端工程師」收到了新的讚！', '{\"job_id\": 4, \"job_title\": \"前端工程師\", \"liker_name\": \"學生D\", \"like_count\": 12}', 0, '2025-01-15 09:45:00'),
(43, 11, 'like', '職缺被按讚', '您的職缺「後端工程師」收到了新的讚！', '{\"job_id\": 5, \"job_title\": \"後端工程師\", \"liker_name\": \"學生E\", \"like_count\": 8}', 0, '2025-01-15 06:20:00'),
(44, 12, 'like', '職缺被按讚', '您的職缺「iOS 開發工程師」收到了新的讚！', '{\"job_id\": 6, \"job_title\": \"iOS 開發工程師\", \"liker_name\": \"學生F\", \"like_count\": 15}', 0, '2025-01-15 10:00:00'),
(45, 12, 'like', '職缺被按讚', '您的職缺「產品經理」收到了新的讚！', '{\"job_id\": 7, \"job_title\": \"產品經理\", \"liker_name\": \"學生G\", \"like_count\": 6}', 1, '2025-01-14 12:10:00'),
(46, 10, 'comment', '職缺收到評論', '您的職缺「軟體工程師」收到了新的評論。', '{\"job_id\": 1, \"job_title\": \"軟體工程師\", \"commenter_name\": \"學生H\", \"comment_preview\": \"這個職缺看起來很有挑戰性...\"}', 1, '2025-01-15 08:30:00'),
(47, 10, 'comment', '職缺收到評論', '您的職缺「資料分析師」收到了新的評論。', '{\"job_id\": 2, \"job_title\": \"資料分析師\", \"commenter_name\": \"學生I\", \"comment_preview\": \"薪資待遇很吸引人...\"}', 1, '2025-01-15 07:40:00'),
(48, 10, 'comment', '職缺收到評論', '您的職缺「專案經理」收到了新的評論。', '{\"job_id\": 3, \"job_title\": \"專案經理\", \"commenter_name\": \"學生J\", \"comment_preview\": \"公司文化很好...\"}', 1, '2025-01-14 10:50:00'),
(49, 11, 'comment', '職缺收到評論', '您的職缺「前端工程師」收到了新的評論。', '{\"job_id\": 4, \"job_title\": \"前端工程師\", \"commenter_name\": \"學生K\", \"comment_preview\": \"技術很新穎...\"}', 0, '2025-01-15 09:50:00'),
(50, 11, 'comment', '職缺收到評論', '您的職缺「後端工程師」收到了新的評論。', '{\"job_id\": 5, \"job_title\": \"後端工程師\", \"commenter_name\": \"學生L\", \"comment_preview\": \"工作環境很棒...\"}', 0, '2025-01-15 06:50:00'),
(51, 12, 'comment', '職缺收到評論', '您的職缺「iOS 開發工程師」收到了新的評論。', '{\"job_id\": 6, \"job_title\": \"iOS 開發工程師\", \"commenter_name\": \"學生M\", \"comment_preview\": \"Apple 的技術很先進...\"}', 0, '2025-01-15 10:10:00'),
(52, 12, 'comment', '職缺收到評論', '您的職缺「產品經理」收到了新的評論。', '{\"job_id\": 7, \"job_title\": \"產品經理\", \"commenter_name\": \"學生N\", \"comment_preview\": \"產品思維很重要...\"}', 1, '2025-01-14 12:30:00'),
(53, 10, 'system', '月度報告', '您的 1 月份招聘報告已生成，共收到 45 份履歷。', '{\"report_month\": \"2025-01\", \"resume_count\": 45, \"interview_count\": 12}', 1, '2025-01-01 01:00:00'),
(54, 10, 'enterprise', '學生主動聯絡', '學生 陳小華 對您的職缺「DevOps 工程師」感興趣。', '{\"contact_id\": 8, \"student_name\": \"陳小華\", \"job_title\": \"DevOps 工程師\"}', 1, '2025-01-13 03:30:00'),
(55, 10, 'view', '職缺被瀏覽', '您的職缺「DevOps 工程師」被 6 位求職者瀏覽。', '{\"job_id\": 8, \"job_title\": \"DevOps 工程師\", \"view_count\": 6}', 1, '2025-01-13 02:15:00'),
(56, 11, 'system', '帳戶升級', '您的帳戶已升級至 Premium 方案，享受更多功能。', '{\"plan\": \"premium\", \"features\": [\"advanced_search\", \"bulk_contact\"]}', 1, '2025-01-10 06:20:00'),
(57, 11, 'like', '職缺被按讚', '您的職缺「全端工程師」收到了新的讚！', '{\"job_id\": 9, \"job_title\": \"全端工程師\", \"liker_name\": \"學生O\", \"like_count\": 9}', 1, '2025-01-12 08:40:00'),
(58, 11, 'comment', '職缺收到評論', '您的職缺「全端工程師」收到了新的評論。', '{\"job_id\": 9, \"job_title\": \"全端工程師\", \"commenter_name\": \"學生P\", \"comment_preview\": \"技術要求很全面...\"}', 1, '2025-01-12 09:20:00'),
(59, 12, 'system', '面試安排', '您有 3 場面試安排在明天，請確認時間。', '{\"interview_count\": 3, \"date\": \"2025-01-16\", \"candidates\": [\"學生Q\", \"學生R\", \"學生S\"]}', 0, '2025-01-15 10:30:00'),
(60, 12, 'enterprise', '學生主動聯絡', '學生 黃小明 詢問關於「硬體工程師」職缺的詳細資訊。', '{\"contact_id\": 9, \"student_name\": \"黃小明\", \"job_title\": \"硬體工程師\", \"inquiry_type\": \"job_details\"}', 0, '2025-01-15 09:15:00'),
(61, 12, 'view', '職缺被瀏覽', '您的職缺「硬體工程師」被 4 位求職者瀏覽。', '{\"job_id\": 10, \"job_title\": \"硬體工程師\", \"view_count\": 4}', 1, '2025-01-14 13:00:00'),
(62, 5, 'system', '歡迎使用 Portfolio+ 平台', '感謝您註冊 Portfolio+ 專業作品集平台。在這裡，您可以展示作品、建立個人品牌，並與優秀企業建立聯繫。祝您使用愉快！', '{\"welcome\": true}', 0, '2025-10-07 11:16:40'),
(63, 9, 'system', '歡迎使用 Portfolio+ 平台', '感謝您註冊 Portfolio+ 專業作品集平台。在這裡，您可以展示作品、建立個人品牌，並與優秀企業建立聯繫。祝您使用愉快！', '{\"welcome\": true}', 0, '2025-10-07 11:16:40');

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
  `report_count` int(11) NOT NULL DEFAULT 0 COMMENT '被檢舉次數',
  `is_flagged` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否被標記',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `portfolios`
--

INSERT INTO `portfolios` (`id`, `user_id`, `title`, `description`, `category_id`, `tags`, `status`, `cover_image`, `content`, `view_count`, `like_count`, `comment_count`, `download_count`, `is_featured`, `report_count`, `is_flagged`, `published_at`, `created_at`, `updated_at`) VALUES
(6, 5, '電商網站使用者行為分析', '使用 Python 和 PowerBI 進行電商網站的用戶行為深度分析，包括瀏覽路徑分析、購買轉換率研究、用戶分群洞察等，為行銷策略提供數據支持，協助企業優化營運決策。', 27, 'Python,PowerBI,數據分析,電商,用戶行為', 'published', '/portfolio/uploads/portfolios/ecommerce-analysis.jpg', '## 專案概述\n\n本專案旨在分析電商網站的用戶行為數據，透過數據挖掘和視覺化技術，深入了解用戶的瀏覽習慣和購買行為。\n\n## 技術工具\n- Python (pandas, numpy, matplotlib)\n- PowerBI\n- SQL\n- Excel\n\n## 主要發現\n1. 用戶平均瀏覽時間為 8.5 分鐘\n2. 購物車放棄率為 68%\n3. 最受歡迎的產品類別是電子產品\n\n## 改進建議\n1. 優化購物車流程\n2. 增加產品推薦功能\n3. 改善移動端體驗', 159, 23, 0, 0, 1, 0, 0, '2024-12-01 02:00:00', '2025-08-29 07:07:41', '2025-10-07 11:16:40'),
(7, 5, '社群媒體行銷策略規劃', '為中小企業制定完整的社群媒體行銷策略，涵蓋內容規劃、發布時程安排、互動策略設計和成效追蹤分析，有效提升品牌知名度與客戶參與度。', 42, '社群媒體,行銷策略,內容規劃,品牌推廣', 'published', '/portfolio/uploads/portfolios/social-media-strategy.jpg', '## 專案背景\n\n協助台中地區的中小企業建立有效的社群媒體行銷策略，提升品牌知名度和客戶互動。\n\n## 策略內容\n1. 平台選擇：Facebook、Instagram、Line\n2. 內容主題：產品介紹、客戶故事、產業知識\n3. 發布頻率：每週 3-4 篇\n4. 互動策略：回覆評論、舉辦活動\n\n## 成效指標\n- 粉絲增長率：每月 15%\n- 互動率：平均 8%\n- 網站流量：提升 25%', 89, 15, 0, 0, 0, 0, 0, '2024-11-15 06:30:00', '2025-08-29 07:07:41', '2025-10-07 11:16:40'),
(8, 5, '學生資訊系統 UI/UX 設計', '重新設計學校資訊系統的使用者介面與體驗，大幅提升學生和教師的使用滿意度。包括響應式設計實作、無障礙功能優化，以及完整的使用者測試與迭代。', 27, 'UI/UX設計,響應式設計,無障礙設計,使用者研究', 'published', '/portfolio/uploads/portfolios/student-system-ui.jpg', '## 設計目標\n\n改善現有學生資訊系統的使用者體驗，讓學生和教師能夠更有效率地使用系統功能。\n\n## 設計原則\n1. 簡潔明瞭的介面\n2. 直觀的操作流程\n3. 響應式設計\n4. 無障礙功能\n\n## 主要改進\n- 重新設計導航結構\n- 優化表單設計\n- 增加搜尋功能\n- 改善移動端體驗\n\n## 使用者測試\n- 測試對象：20 名學生，5 名教師\n- 完成任務成功率：95%\n- 使用者滿意度：4.2/5.0', 236, 31, 0, 0, 1, 0, 0, '2024-10-20 01:15:00', '2025-08-29 07:07:41', '2025-10-08 08:53:32'),
(9, 5, 'Python 爬蟲程式開發', '開發高效能的自動化網頁爬蟲程式，支援多種網站格式與反爬蟲機制，用於數據收集與分析。採用 Selenium 處理動態內容，實作多線程爬取提升效率。', 27, 'Python,爬蟲,自動化,數據收集,Selenium', 'published', '/portfolio/uploads/portfolios/python-scraper.jpg', '## 專案描述\n\n開發一個功能完整的網頁爬蟲系統，能夠自動化收集網路數據，支援多種網站格式和反爬蟲機制。\n\n## 技術特點\n- 使用 Selenium 處理動態內容\n- 支援多線程爬取\n- 自動處理反爬蟲機制\n- 數據清洗和格式化\n\n## 主要功能\n1. 自動化登入\n2. 數據提取\n3. 錯誤處理\n4. 數據導出\n\n## 應用場景\n- 電商價格監控\n- 新聞內容收集\n- 社交媒體分析\n- 市場研究數據', 178, 28, 0, 0, 0, 0, 0, '2024-09-10 08:45:00', '2025-08-29 07:07:41', '2025-10-07 11:16:40'),
(10, 5, '專案管理系統開發', '使用 React 和 Node.js 技術，開發功能完整的專案管理系統。包含任務分配、進度追蹤、團隊協作、即時通訊等核心功能，提供直觀易用的操作介面。', 27, 'React,Node.js,專案管理,團隊協作,任務追蹤', 'published', '/portfolio/uploads/portfolios/project-management-system.jpg', '## 系統功能\n\n開發一個完整的專案管理系統，幫助團隊更有效率地協作和追蹤專案進度。\n\n## 核心功能\n1. 專案建立和管理\n2. 任務分配和追蹤\n3. 團隊成員管理\n4. 進度報告\n5. 檔案共享\n\n## 技術架構\n- 前端：React + TypeScript\n- 後端：Node.js + Express\n- 資料庫：MySQL\n- 即時通訊：Socket.io\n\n## 專案成果\n- 開發週期：3 個月\n- 團隊規模：5 人\n- 使用者反饋：4.5/5.0', 146, 19, 0, 0, 0, 0, 0, '2024-08-25 03:20:00', '2025-08-29 07:07:41', '2025-10-08 08:52:47'),
(15, 5, '專案管理系統開發', '使用 React 和 Node.js 技術，開發功能完整的專案管理系統。包含任務分配、進度追蹤、團隊協作、即時通訊等核心功能，提供直觀易用的操作介面。', 15, 'React,Node.js,專案管理,團隊協作,任務追蹤', 'published', '/portfolio/uploads/portfolios/project-management-system.jpg', '## 系統功能\n\n開發一個完整的專案管理系統，幫助團隊更有效率地協作和追蹤專案進度。\n\n## 核心功能\n1. 專案建立和管理\n2. 任務分配和追蹤\n3. 團隊成員管理\n4. 進度報告\n5. 檔案共享\n\n## 技術架構\n- 前端：React + TypeScript\n- 後端：Node.js + Express\n- 資料庫：MySQL\n- 即時通訊：Socket.io\n\n## 專案成果\n- 開發週期：3 個月\n- 團隊規模：5 人\n- 使用者反饋：4.5/5.0', 146, 19, 0, 0, 0, 0, 0, '2024-08-25 03:20:00', '2025-08-29 07:10:55', '2025-10-07 11:16:40'),
(18, 5, '資料科學作品範例（測試）', '這是用於測試的作品描述。', 27, 'Python,數據分析,測試', 'published', '/portfolio/uploads/portfolios/test-cover.jpg', '## 測試內容', 4, 0, 0, 0, 0, 0, 0, '2025-09-02 09:31:09', '2025-09-02 09:31:09', '2025-10-08 08:53:13');

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
(6, 16, 5, '讚喔', 0, 1, '2025-09-16 14:07:55', '2025-09-16 14:07:55'),
(8, 27, 10, '好讚', 0, 1, '2025-09-24 15:48:10', '2025-09-24 15:48:10');

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
(3, 8, 'student-system-design.pdf', '/portfolio/uploads/portfolios/files/student-system-design.pdf', 3072000, 'application/pdf', 'pdf', 1, 0, '2025-08-29 07:10:55');

-- --------------------------------------------------------

--
-- 資料表結構 `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL COMMENT '檢舉人 ID',
  `reported_type` enum('portfolio','comment','job','user','message') NOT NULL COMMENT '被檢舉對象類型',
  `reported_id` int(11) NOT NULL COMMENT '被檢舉對象 ID',
  `reported_user_id` int(11) DEFAULT NULL COMMENT '被檢舉的用戶 ID',
  `reason` enum('inappropriate','spam','harassment','copyright','other') NOT NULL COMMENT '檢舉原因',
  `description` text DEFAULT NULL COMMENT '詳細說明',
  `evidence_url` varchar(500) DEFAULT NULL COMMENT '證據截圖 URL',
  `status` enum('pending','reviewing','resolved','rejected') NOT NULL DEFAULT 'pending' COMMENT '處理狀態',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium' COMMENT '優先級',
  `admin_id` int(11) DEFAULT NULL COMMENT '處理的管理員 ID',
  `admin_notes` text DEFAULT NULL COMMENT '管理員備註',
  `resolution` enum('warning','content_removed','user_suspended','user_banned','no_action') DEFAULT NULL COMMENT '處置結果',
  `resolved_at` timestamp NULL DEFAULT NULL COMMENT '處理完成時間',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '檢舉時間',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='檢舉記錄表';

--
-- 傾印資料表的資料 `reports`
--

INSERT INTO `reports` (`id`, `reporter_id`, `reported_type`, `reported_id`, `reported_user_id`, `reason`, `description`, `evidence_url`, `status`, `priority`, `admin_id`, `admin_notes`, `resolution`, `resolved_at`, `created_at`, `updated_at`) VALUES
(1, 5, 'portfolio', 18, 5, 'spam', '這個作品包含廣告內容', NULL, 'pending', 'medium', NULL, NULL, NULL, NULL, '2025-10-08 10:01:31', '2025-10-08 10:01:31'),
(2, 9, 'comment', 7, 5, 'inappropriate', '留言內容不當', NULL, 'pending', 'low', NULL, NULL, NULL, NULL, '2025-10-08 10:01:31', '2025-10-08 10:01:31');

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
  `file_path` varchar(500) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `download_count` int(11) DEFAULT 0,
  `view_count` int(11) DEFAULT 0,
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `version` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `resumes`
--

INSERT INTO `resumes` (`id`, `user_id`, `title`, `template`, `content`, `file_path`, `is_public`, `download_count`, `view_count`, `status`, `version`, `created_at`, `updated_at`) VALUES
(1, 5, '資料分析履歷（一般版）', 'classic', '{\r\n  \"summary\": \"熱愛資料分析與視覺化，熟悉 Python 與 BI 工具\",\r\n  \"skills\": [\"Python\", \"Pandas\", \"SQL\", \"PowerBI\", \"Excel\"],\r\n  \"experience\": [\r\n    {\"title\": \"行銷資料分析專案\", \"details\": \"分析用戶行為並製作儀表板\"}\r\n  ]\r\n}', NULL, 1, 3, 12, 'published', 2, '2025-09-01 00:00:00', '2025-09-10 00:00:00'),
(2, 5, 'UI/UX 履歷（精簡版）', 'modern', '{\r\n  \"summary\": \"具備 UI/UX 設計與使用者研究經驗\",\r\n  \"skills\": [\"Figma\", \"UI/UX\", \"Usability\", \"Responsive Design\"],\r\n  \"projects\": [\r\n    {\"name\": \"學生資訊系統改版\", \"role\": \"UI/UX 設計\"}\r\n  ]\r\n}', NULL, 0, 0, 4, 'draft', 1, '2025-09-05 01:30:00', '2025-09-05 01:30:00');

-- --------------------------------------------------------

--
-- 資料表結構 `special_availability`
--

CREATE TABLE `special_availability` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT '用戶 ID',
  `date` date NOT NULL COMMENT '日期',
  `start_time` time NOT NULL COMMENT '開始時間',
  `end_time` time NOT NULL COMMENT '結束時間',
  `is_available` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否可用（0=不可用，1=可用）',
  `note` varchar(200) DEFAULT NULL COMMENT '備註',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='特殊可用時間表';

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
(1, 5, '玟瑄', '黃', '黃玟瑄', '女', '2000-01-15', '0912-345-678', '台中市西區精誠路123號', '靜宜大學資訊管理學系碩士生，對數位行銷與資料分析充滿熱情。擅長運用資訊科技解決商業問題，具備良好的專案管理與團隊協作能力。積極學習新技術，期望在畢業後能從事資料分析或數位行銷相關工作。', 'uploads/avatars/avatar_5_1758098146.jpg', '411146708', '資訊管理學系', '靜宜大學', '碩士生', 2026, 'Python, JavaScript, HTML/CSS, SQL, Excel, PowerBI, Google Analytics, 數位行銷, 資料分析, 專案管理', '人工智慧應用, 大數據分析, 數位行銷策略, 使用者體驗設計, 敏捷專案管理', '2025-08-29 06:34:32', '2025-10-07 11:16:39'),
(9, 9, '玟瑄', '林', '林玟瑄', NULL, NULL, '0965418312', '台北市大安區復興南路一段 390 號', NULL, NULL, NULL, '國際企業學系', NULL, '大學三年級', NULL, NULL, NULL, '2025-09-19 02:31:22', '2025-09-24 08:26:25');

-- --------------------------------------------------------

--
-- 資料表結構 `talent_search_logs`
--

CREATE TABLE `talent_search_logs` (
  `id` int(11) NOT NULL,
  `enterprise_id` int(11) NOT NULL,
  `query` varchar(255) DEFAULT NULL,
  `filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`filters`)),
  `result_count` int(11) DEFAULT 0,
  `duration_ms` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `talent_search_logs`
--

INSERT INTO `talent_search_logs` (`id`, `enterprise_id`, `query`, `filters`, `result_count`, `duration_ms`, `created_at`) VALUES
(1, 10, '', '{\"skills\":\"\",\"department\":\"\\u8cc7\\u8a0a\\u7ba1\\u7406\\u5b78\\u7cfb\",\"grade\":\"\",\"minMatch\":0}', 1, 19, '2025-09-24 07:17:47'),
(2, 10, '', '{\"skills\":\"\",\"department\":\"\\u8cc7\\u8a0a\\u7ba1\\u7406\\u5b78\\u7cfb\",\"grade\":\"\",\"minMatch\":0}', 1, 7, '2025-09-24 07:17:47'),
(3, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 28, '2025-09-24 08:02:56'),
(4, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 84, '2025-09-24 08:04:40'),
(5, 10, '', '{\"skills\":\"\",\"department\":\"\\u8cc7\\u8a0a\\u7ba1\\u7406\\u5b78\\u7cfb\",\"grade\":\"\",\"minMatch\":0}', 1, 1642, '2025-09-24 08:19:00'),
(6, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 15, '2025-09-24 08:19:13'),
(7, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 125, '2025-09-24 08:19:22'),
(8, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 19, '2025-09-24 08:21:01'),
(9, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\\u5927\\u5b78\\u4e09\\u5e74\\u7d1a\",\"minMatch\":0}', 1, 39, '2025-09-24 08:31:57'),
(10, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\\u5927\\u5b78\\u4e09\\u5e74\\u7d1a\",\"minMatch\":0}', 1, 15, '2025-09-24 08:32:06'),
(11, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\\u5927\\u5b78\\u4e09\\u5e74\\u7d1a\",\"minMatch\":0}', 1, 16, '2025-09-24 08:32:10'),
(12, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 19, '2025-09-24 08:37:46'),
(13, 10, '', '{\"skills\":\"\",\"department\":\"\\u8cc7\\u8a0a\\u7ba1\\u7406\\u5b78\\u7cfb\",\"grade\":\"\",\"minMatch\":0}', 1, 17, '2025-09-24 08:39:06'),
(14, 10, '', '{\"skills\":\"\",\"department\":\"\\u8cc7\\u8a0a\\u7ba1\\u7406\\u5b78\\u7cfb\",\"grade\":\"\",\"minMatch\":0}', 1, 7, '2025-09-24 08:39:06'),
(15, 10, '', '{\"skills\":\"python\",\"department\":\"\\u8cc7\\u8a0a\\u7ba1\\u7406\\u5b78\\u7cfb\",\"grade\":\"\",\"minMatch\":0}', 1, 14, '2025-09-24 08:39:12'),
(16, 10, '', '{\"skills\":\"python\",\"department\":\"\\u8cc7\\u8a0a\\u7ba1\\u7406\\u5b78\\u7cfb\",\"grade\":\"\",\"minMatch\":0}', 1, 6, '2025-09-24 08:39:12'),
(17, 10, '', '{\"skills\":\"excel\",\"department\":\"\\u8cc7\\u8a0a\\u7ba1\\u7406\\u5b78\\u7cfb\",\"grade\":\"\",\"minMatch\":0}', 1, 32, '2025-09-24 08:39:16'),
(18, 10, '', '{\"skills\":\"excel\",\"department\":\"\\u8cc7\\u8a0a\\u7ba1\\u7406\\u5b78\\u7cfb\",\"grade\":\"\",\"minMatch\":0}', 1, 6, '2025-09-24 08:39:16'),
(19, 10, '', '{\"skills\":\"excel\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 1, 30, '2025-09-24 08:39:17'),
(20, 10, '', '{\"skills\":\"excel\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 1, 6, '2025-09-24 08:39:17'),
(21, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 86, '2025-09-24 08:39:19'),
(22, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 8, '2025-09-24 08:39:20'),
(23, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 25, '2025-09-27 06:43:30'),
(24, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 12, '2025-09-27 06:44:10'),
(25, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 7, '2025-09-27 06:44:10'),
(26, 10, '', '{\"skills\":\"html\\/css\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 1, 18, '2025-09-27 06:44:19'),
(27, 10, '', '{\"skills\":\"html\\/css\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 1, 10, '2025-09-27 06:44:19'),
(28, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 13, '2025-09-27 07:27:33'),
(29, 10, '', '{\"skills\":\"\",\"department\":\"\\u8cc7\\u8a0a\\u7ba1\\u7406\\u5b78\\u7cfb\",\"grade\":\"\",\"minMatch\":0}', 1, 17, '2025-09-27 07:27:50'),
(30, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 16, '2025-09-27 07:31:01'),
(31, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 18, '2025-09-27 07:32:32'),
(32, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 12, '2025-09-27 07:32:42'),
(33, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 14, '2025-09-27 07:33:53'),
(34, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 16, '2025-09-27 07:33:55'),
(35, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 141, '2025-09-27 07:36:32'),
(36, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 17, '2025-09-27 07:40:03'),
(37, 10, '', '{\"skills\":\"\",\"department\":\"\",\"grade\":\"\",\"minMatch\":0}', 2, 15, '2025-09-27 07:40:10');

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
(5, 'selina101292@gmail.com', 'selina101292@gmail.com', '$2y$10$EZA6irjCgnHNPrUxaMlAiO/qpPXD6zaDjwS/cd.phY0MgrRtdHJHG', 'student', 'active', '2025-08-29 06:34:32', '2025-08-29 06:34:32'),
(9, 'willykid03@gmail.com', 'willykid03@gmail.com', '$2y$10$xdrhcLdJf6HzWKRiG/siKO/x81fDPFNlOtC3M8HCEbXFDrbXVcuUS', 'student', 'active', '2025-09-19 02:31:22', '2025-09-19 02:31:22'),
(10, 'microsoft_tw', 'hr@microsoft.com.tw', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'enterprise', 'active', '2025-09-22 09:18:56', '2025-09-22 09:18:56'),
(11, 'google_tw', 'hr@google.com.tw', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'enterprise', 'active', '2025-09-22 09:18:56', '2025-09-22 09:18:56'),
(12, 'apple_tw', 'hr@apple.com.tw', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'enterprise', 'active', '2025-09-22 09:18:56', '2025-09-22 09:18:56'),
(14, 'admin', 'admin@portfolio-plus.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active', '2025-10-08 10:03:44', '2025-10-08 10:03:44');

-- --------------------------------------------------------

--
-- 資料表結構 `user_activities`
--

CREATE TABLE `user_activities` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('upload','view','like','comment','badge','login') NOT NULL,
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
(4, 5, 5, '2025-09-08 12:35:03', '累積點讚達標'),
(5, 4, 1, '2025-09-19 10:46:25', '手動授予: 初次登入');

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

-- --------------------------------------------------------

--
-- 資料表結構 `user_warnings`
--

CREATE TABLE `user_warnings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT '被警告的用戶 ID',
  `admin_id` int(11) NOT NULL COMMENT '發出警告的管理員 ID',
  `reason` varchar(500) NOT NULL COMMENT '警告原因',
  `severity` enum('minor','moderate','severe','final') NOT NULL DEFAULT 'moderate' COMMENT '嚴重程度',
  `details` text DEFAULT NULL COMMENT '詳細說明',
  `related_report_id` int(11) DEFAULT NULL COMMENT '相關檢舉 ID',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '警告過期時間',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否有效',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用戶警告記錄表';

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_target_type_id` (`target_type`,`target_id`),
  ADD KEY `idx_target_user_id` (`target_user_id`),
  ADD KEY `idx_action_type` (`action_type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- 資料表索引 `available_timeslots`
--
ALTER TABLE `available_timeslots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_day_of_week` (`day_of_week`);

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
-- 資料表索引 `content_moderation`
--
ALTER TABLE `content_moderation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_content` (`content_type`,`content_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_reviewed_by` (`reviewed_by`),
  ADD KEY `idx_submitted_at` (`submitted_at`);

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
-- 資料表索引 `enterprise_recommendations`
--
ALTER TABLE `enterprise_recommendations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_enterprise_student` (`enterprise_id`,`student_id`),
  ADD KEY `idx_score` (`score`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `fk_reco_student` (`student_id`);

--
-- 資料表索引 `enterprise_views`
--
ALTER TABLE `enterprise_views`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_enterprise_id` (`enterprise_id`),
  ADD KEY `idx_portfolio_id` (`portfolio_id`),
  ADD KEY `idx_view_date` (`view_date`),
  ADD KEY `idx_enterprise_portfolio_date` (`enterprise_id`,`portfolio_id`,`view_date`);

--
-- 資料表索引 `interviews`
--
ALTER TABLE `interviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_enterprise_id` (`enterprise_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_job_id` (`job_id`),
  ADD KEY `idx_application_id` (`application_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_scheduled_at` (`scheduled_at`);

--
-- 資料表索引 `interview_reminders`
--
ALTER TABLE `interview_reminders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_interview_id` (`interview_id`),
  ADD KEY `idx_remind_at` (`remind_at`),
  ADD KEY `idx_is_sent` (`is_sent`);

--
-- 資料表索引 `interview_reschedules`
--
ALTER TABLE `interview_reschedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_interview_id` (`interview_id`),
  ADD KEY `idx_requested_by` (`requested_by`);

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
  ADD KEY `idx_portfolios_user` (`user_id`),
  ADD KEY `idx_user_status_published` (`user_id`,`status`,`published_at`);
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
-- 資料表索引 `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reporter_id` (`reporter_id`),
  ADD KEY `idx_reported_type_id` (`reported_type`,`reported_id`),
  ADD KEY `idx_reported_user_id` (`reported_user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_created_at` (`created_at`);

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
-- 資料表索引 `special_availability`
--
ALTER TABLE `special_availability`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_date` (`date`);

--
-- 資料表索引 `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_student_id` (`student_id`);
ALTER TABLE `student_profiles` ADD FULLTEXT KEY `ft_student_profiles_text` (`skills`,`bio`);

--
-- 資料表索引 `talent_search_logs`
--
ALTER TABLE `talent_search_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_enterprise_id` (`enterprise_id`),
  ADD KEY `idx_created_at` (`created_at`);
ALTER TABLE `talent_search_logs` ADD FULLTEXT KEY `ft_query` (`query`);

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
-- 資料表索引 `user_warnings`
--
ALTER TABLE `user_warnings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_severity` (`severity`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_related_report` (`related_report_id`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `available_timeslots`
--
ALTER TABLE `available_timeslots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `badges`
--
ALTER TABLE `badges`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `bookmarks`
--
ALTER TABLE `bookmarks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
-- 使用資料表自動遞增(AUTO_INCREMENT) `content_moderation`
--
ALTER TABLE `content_moderation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `enterprise_analytics`
--
ALTER TABLE `enterprise_analytics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `enterprise_bookmarks`
--
ALTER TABLE `enterprise_bookmarks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `enterprise_contacts`
--
ALTER TABLE `enterprise_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `enterprise_profiles`
--
ALTER TABLE `enterprise_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `enterprise_recommendations`
--
ALTER TABLE `enterprise_recommendations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `enterprise_views`
--
ALTER TABLE `enterprise_views`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `interviews`
--
ALTER TABLE `interviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `interview_reminders`
--
ALTER TABLE `interview_reminders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `interview_reschedules`
--
ALTER TABLE `interview_reschedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `job_applications`
--
ALTER TABLE `job_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `likes`
--
ALTER TABLE `likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `portfolios`
--
ALTER TABLE `portfolios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `portfolio_comments`
--
ALTER TABLE `portfolio_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `portfolio_files`
--
ALTER TABLE `portfolio_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `resumes`
--
ALTER TABLE `resumes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `special_availability`
--
ALTER TABLE `special_availability`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `student_profiles`
--
ALTER TABLE `student_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `talent_search_logs`
--
ALTER TABLE `talent_search_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `user_activities`
--
ALTER TABLE `user_activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `user_badges`
--
ALTER TABLE `user_badges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `user_warnings`
--
ALTER TABLE `user_warnings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_logs_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_audit_logs_target_user` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- 資料表的限制式 `available_timeslots`
--
ALTER TABLE `available_timeslots`
  ADD CONSTRAINT `fk_timeslots_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
-- 資料表的限制式 `content_moderation`
--
ALTER TABLE `content_moderation`
  ADD CONSTRAINT `fk_moderation_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
-- 資料表的限制式 `enterprise_recommendations`
--
ALTER TABLE `enterprise_recommendations`
  ADD CONSTRAINT `fk_reco_enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reco_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `enterprise_views`
--
ALTER TABLE `enterprise_views`
  ADD CONSTRAINT `enterprise_views_ibfk_1` FOREIGN KEY (`enterprise_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enterprise_views_ibfk_2` FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `interviews`
--
ALTER TABLE `interviews`
  ADD CONSTRAINT `fk_interviews_application` FOREIGN KEY (`application_id`) REFERENCES `job_applications` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_interviews_enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_interviews_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_interviews_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `interview_reminders`
--
ALTER TABLE `interview_reminders`
  ADD CONSTRAINT `fk_reminders_interview` FOREIGN KEY (`interview_id`) REFERENCES `interviews` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `interview_reschedules`
--
ALTER TABLE `interview_reschedules`
  ADD CONSTRAINT `fk_reschedules_interview` FOREIGN KEY (`interview_id`) REFERENCES `interviews` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reschedules_user` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
-- 資料表的限制式 `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `fk_reports_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_reports_reported_user` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_reports_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `resumes`
--
ALTER TABLE `resumes`
  ADD CONSTRAINT `fk_resumes_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `resumes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `special_availability`
--
ALTER TABLE `special_availability`
  ADD CONSTRAINT `fk_special_availability_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD CONSTRAINT `student_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `talent_search_logs`
--
ALTER TABLE `talent_search_logs`
  ADD CONSTRAINT `fk_talent_search_logs_enterprise` FOREIGN KEY (`enterprise_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `user_activities`
--
ALTER TABLE `user_activities`
  ADD CONSTRAINT `fk_user_activities_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `user_warnings`
--
ALTER TABLE `user_warnings`
  ADD CONSTRAINT `fk_warnings_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_warnings_report` FOREIGN KEY (`related_report_id`) REFERENCES `reports` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_warnings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
