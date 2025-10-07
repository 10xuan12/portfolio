-- ============================================
-- Portfolio+ 資料庫內容更新腳本
-- 用途：清理測試數據，加入正式內容
-- ============================================

-- 清理評論中的測試數據
DELETE FROM comments WHERE content IN ('123', '1234', '讚讚', '很讚123', '123456');
DELETE FROM portfolio_comments WHERE content IN ('123', '讚讚', '很讚123', '123456');

-- 更新職位資訊，移除測試數據
UPDATE jobs 
SET 
    title = '軟體工程師',
    description = '負責前端產品開發與最佳化，參與系統架構設計，與團隊協作開發高品質的軟體產品。',
    requirements = '熟悉 JavaScript、React、HTML、CSS、Git 等前端技術，具備良好的問題解決能力。',
    responsibilities = '開發和維護前端應用程式、參與產品設計討論、編寫技術文件、協助團隊成員解決技術問題。',
    skills_required = 'JavaScript, React, HTML, CSS, Git, TypeScript'
WHERE id = 1;

-- 刪除測試職位
DELETE FROM jobs WHERE title IN ('Test111', 'test', '測試職缺');

-- 清理測試企業帳號
DELETE FROM enterprise_profiles WHERE company_name LIKE '%test%' OR company_name LIKE '%Test%';
DELETE FROM users WHERE email LIKE '%test%' AND role = 'enterprise';

-- 更新企業資料為正式內容
UPDATE enterprise_profiles 
SET 
    description = '台灣微軟是微軟在台灣的分公司，致力於提供創新的雲端服務與企業數位轉型解決方案，協助企業提升競爭力。',
    company_culture = '我們重視多元包容、鼓勵創新思維，提供員工充分的成長空間與學習資源。',
    benefits_description = '完善的員工福利，包括：年終獎金、員工旅遊、彈性工時、遠距工作、教育訓練補助、健康檢查。'
WHERE company_name = '台灣微軟股份有限公司';

UPDATE enterprise_profiles 
SET 
    description = 'Google 台灣是 Google 在台灣的研發與營運據點，專注於創新技術研發與產品開發。',
    company_culture = '以使用者為中心，鼓勵創新與實驗精神，打造開放友善的工作環境。',
    benefits_description = '業界領先的薪資福利、彈性工時、免費三餐、健身房、交通補助、股票選擇權。'
WHERE company_name = 'Google 台灣';

UPDATE enterprise_profiles 
SET 
    description = 'Apple 台灣專注於產品設計、軟硬體整合與創新服務開發，追求卓越的產品品質。',
    company_culture = '追求完美、注重細節、設計導向的文化，激發團隊創造力與專業能力。',
    benefits_description = '員工購買優惠、完善的健康保險、教育訓練計畫、年度健康檢查、績效獎金。'
WHERE company_name = 'Apple 台灣';

-- 更新作品描述，移除測試內容
UPDATE portfolios 
SET 
    description = '使用 Python 和 PowerBI 進行電商網站的用戶行為深度分析，包括瀏覽路徑分析、購買轉換率研究、用戶分群洞察等，為行銷策略提供數據支持，協助企業優化營運決策。'
WHERE title = '電商網站使用者行為分析';

UPDATE portfolios 
SET 
    description = '為中小企業制定完整的社群媒體行銷策略，涵蓋內容規劃、發布時程安排、互動策略設計和成效追蹤分析，有效提升品牌知名度與客戶參與度。'
WHERE title = '社群媒體行銷策略規劃';

UPDATE portfolios 
SET 
    description = '重新設計學校資訊系統的使用者介面與體驗，大幅提升學生和教師的使用滿意度。包括響應式設計實作、無障礙功能優化，以及完整的使用者測試與迭代。'
WHERE title = '學生資訊系統 UI/UX 設計';

UPDATE portfolios 
SET 
    description = '開發高效能的自動化網頁爬蟲程式，支援多種網站格式與反爬蟲機制，用於數據收集與分析。採用 Selenium 處理動態內容，實作多線程爬取提升效率。'
WHERE title = 'Python 爬蟲程式開發';

UPDATE portfolios 
SET 
    description = '使用 React 和 Node.js 技術棧，開發功能完整的專案管理系統。包含任務分配、進度追蹤、團隊協作、即時通訊等核心功能，提供直觀易用的操作介面。'
WHERE title = '專案管理系統開發';

-- 清理 JAVA 作品的測試數據（如果需要保留，請更新為正式內容）
UPDATE portfolios 
SET 
    title = 'Java 企業級應用開發',
    description = '使用 Java Spring Boot 開發企業級後端應用系統，包含 RESTful API 設計、資料庫整合、安全認證機制等功能，展現扎實的後端開發能力。',
    tags = 'Java, Spring Boot, MySQL, RESTful API, 後端開發'
WHERE title = 'JAVA';

-- 更新學生資料，使用更專業的描述
UPDATE student_profiles 
SET 
    bio = '靜宜大學資訊管理學系碩士生，對數位行銷與資料分析充滿熱情。擅長運用資訊科技解決商業問題，具備良好的專案管理與團隊協作能力。積極學習新技術，期望在畢業後能從事資料分析或數位行銷相關工作。',
    skills = 'Python, JavaScript, HTML/CSS, SQL, Excel, PowerBI, Google Analytics, 數位行銷, 資料分析, 專案管理',
    interests = '人工智慧應用, 大數據分析, 數位行銷策略, 使用者體驗設計, 敏捷專案管理'
WHERE user_id = 5;

-- 更新通知內容，移除測試通知
DELETE FROM notifications WHERE message LIKE '%測試%' OR message LIKE '%test%' OR title LIKE '%測試%';

-- 更新系統通知為更專業的內容
UPDATE notifications 
SET 
    title = '系統維護通知',
    message = '系統將於今晚 23:00 至 01:00 進行例行維護作業，期間部分功能可能暫時無法使用，造成不便敬請見諒。'
WHERE type = 'system' AND message LIKE '%維護%';

-- 新增一些正式的系統通知範例
INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at) 
SELECT 
    u.id,
    'system',
    '歡迎使用 Portfolio+ 平台',
    '感謝您註冊 Portfolio+ 專業作品集平台。在這裡，您可以展示作品、建立個人品牌，並與優秀企業建立聯繫。祝您使用愉快！',
    '{"welcome": true}',
    0,
    NOW()
FROM users u 
WHERE u.role = 'student' 
AND NOT EXISTS (
    SELECT 1 FROM notifications n 
    WHERE n.user_id = u.id AND n.title = '歡迎使用 Portfolio+ 平台'
)
LIMIT 10;

-- 更新企業狀態，確保正式企業為已驗證狀態
UPDATE users 
SET status = 'active' 
WHERE role = 'enterprise' 
AND id IN (10, 11, 12);

UPDATE enterprise_profiles 
SET is_verified = 1, verification_date = NOW() 
WHERE user_id IN (10, 11, 12);

-- 清理重複或無效的資料
DELETE FROM enterprise_recommendations WHERE expires_at < NOW();
DELETE FROM password_resets WHERE used = 1 OR expires_at < NOW();

-- 確保所有已發布的作品都有分類
UPDATE portfolios p
SET category_id = 27  -- 資訊學群
WHERE p.category_id IS NULL AND p.status = 'published';

-- 更新作品標籤格式（確保沒有多餘空格）
UPDATE portfolios 
SET tags = TRIM(REPLACE(REPLACE(tags, '  ', ' '), ', ', ','));

-- 最後統計資訊
SELECT '資料清理完成' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_portfolios FROM portfolios WHERE status = 'published';
SELECT COUNT(*) AS total_enterprises FROM users WHERE role = 'enterprise';
SELECT COUNT(*) AS pending_enterprises FROM users WHERE role = 'enterprise' AND status = 'pending';

-- ============================================
-- 執行完畢
-- ============================================

