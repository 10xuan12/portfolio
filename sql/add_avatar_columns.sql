-- 為 student_profiles 表新增 avatar 欄位（保留原有的 profile_picture）
ALTER TABLE student_profiles
ADD COLUMN avatar VARCHAR(255) DEFAULT NULL COMMENT '學生頭像路徑' AFTER profile_picture;

-- 為 company_profiles 表新增 avatar 欄位（保留原有的 logo）
ALTER TABLE company_profiles
ADD COLUMN avatar VARCHAR(255) DEFAULT NULL COMMENT '企業頭像路徑' AFTER logo;

-- 將現有的 profile_picture 和 logo 資料複製到新的 avatar 欄位
-- 注意：這裡只複製資料，不會刪除原有欄位
UPDATE student_profiles 
SET avatar = profile_picture 
WHERE profile_picture IS NOT NULL AND avatar IS NULL;

UPDATE company_profiles 
SET avatar = logo 
WHERE logo IS NOT NULL AND avatar IS NULL;

-- 說明：
-- 1. 保留了原有的 profile_picture 和 logo 欄位
-- 2. 新增了 avatar 欄位作為統一的頭像欄位
-- 3. 將現有資料複製到 avatar 欄位，但只在 avatar 為空時才複製
-- 4. 這樣可以讓系統逐步過渡到使用新的 avatar 欄位

-- 更新 get_comments.php 中使用的欄位名稱
-- 注意：這個 SQL 不會修改 PHP 檔案，只是提醒需要修改的地方
-- 在 get_comments.php 中，需要將：
-- sp.profile_picture 改為 sp.avatar
-- cp.logo 改為 cp.avatar 

-- 為 comments 表新增 avatar 欄位
ALTER TABLE comments
ADD COLUMN avatar VARCHAR(255) DEFAULT NULL COMMENT '留言者頭像路徑' AFTER content;

-- 說明：
-- 1. 只在 comments 表中新增 avatar 欄位
-- 2. 欄位位置放在 content 欄位之後
-- 3. 允許為空，預設值為 NULL
-- 4. 欄位類型為 VARCHAR(255)，足夠存儲頭像路徑 