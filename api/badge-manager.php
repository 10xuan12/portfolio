<?php
require_once 'config.php';

/**
 * 徽章管理器 - 負責檢查和授予徽章
 */
class BadgeManager {
    private $conn;
    
    public function __construct($connection) {
        $this->conn = $connection;
    }
    
    /**
     * 檢查並授予所有徽章
     */
    public function checkAndAwardBadges($userId) {
        try {
            // 取得用戶統計數據
            $userStats = $this->getUserStats($userId);
            
            // 取得所有徽章
            $badges = $this->getAllBadges();
            
            $awardedBadges = [];
            
            foreach ($badges as $badge) {
                // 檢查是否已獲得此徽章
                if ($this->hasBadge($userId, $badge['id'])) {
                    continue;
                }
                
                // 檢查是否達成條件
                if ($this->checkBadgeCondition($badge, $userStats)) {
                    $this->awardBadge($userId, $badge['id'], $badge['name']);
                    $awardedBadges[] = $badge;
                }
            }
            
            return $awardedBadges;
            
        } catch (Exception $e) {
            error_log("徽章檢查失敗: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * 取得用戶統計數據
     */
    private function getUserStats($userId) {
        $stats = [
            'login_count' => 0,
            'portfolio_count' => 0,
            'profile_complete' => false,
            'total_views' => 0,
            'total_likes' => 0,
            'is_first_login' => false
        ];
        
        try {
            // 檢查是否為新用戶（基於註冊時間和是否已有徽章）
            $stmt = $this->conn->prepare("
                SELECT 
                    u.created_at,
                    COUNT(ub.id) as badge_count
                FROM users u
                LEFT JOIN user_badges ub ON u.id = ub.user_id
                WHERE u.id = ?
                GROUP BY u.id
            ");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                // 如果用戶註冊時間在24小時內且沒有任何徽章，視為首次登入
                $createdAt = new DateTime($row['created_at']);
                $now = new DateTime();
                $hoursSinceRegistration = $now->diff($createdAt)->h + ($now->diff($createdAt)->days * 24);
                
                $stats['is_first_login'] = ($hoursSinceRegistration <= 24) && ($row['badge_count'] == 0);
            }
            
            // 檢查作品數量
            $stmt = $this->conn->prepare("SELECT COUNT(*) as portfolio_count FROM portfolios WHERE user_id = ? AND status = 'published'");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $stats['portfolio_count'] = (int)$row['portfolio_count'];
            }
            
            // 檢查個人資料完整性
            $stmt = $this->conn->prepare("
                SELECT 
                    CASE WHEN 
                        u.username IS NOT NULL AND u.username != '' AND
                        u.email IS NOT NULL AND u.email != '' AND
                        sp.first_name IS NOT NULL AND sp.first_name != '' AND
                        sp.last_name IS NOT NULL AND sp.last_name != '' AND
                        sp.bio IS NOT NULL AND sp.bio != '' AND
                        sp.skills IS NOT NULL AND sp.skills != ''
                    THEN 1 ELSE 0 END as profile_complete
                FROM users u
                LEFT JOIN student_profiles sp ON u.id = sp.user_id
                WHERE u.id = ?
            ");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $stats['profile_complete'] = (bool)$row['profile_complete'];
            }
            
            // 檢查總瀏覽數
            $stmt = $this->conn->prepare("SELECT SUM(view_count) as total_views FROM portfolios WHERE user_id = ?");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $stats['total_views'] = (int)$row['total_views'];
            }
            
            // 檢查總讚數
            $stmt = $this->conn->prepare("SELECT SUM(like_count) as total_likes FROM portfolios WHERE user_id = ?");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $stats['total_likes'] = (int)$row['total_likes'];
            }
            
        } catch (Exception $e) {
            error_log("取得用戶統計失敗: " . $e->getMessage());
        }
        
        return $stats;
    }
    
    /**
     * 取得所有徽章
     */
    private function getAllBadges() {
        $badges = [];
        
        try {
            $stmt = $this->conn->prepare("SELECT * FROM badges ORDER BY required_points ASC");
            $stmt->execute();
            $result = $stmt->get_result();
            
            while ($row = $result->fetch_assoc()) {
                $badges[] = $row;
            }
        } catch (Exception $e) {
            error_log("取得徽章列表失敗: " . $e->getMessage());
        }
        
        return $badges;
    }
    
    /**
     * 檢查用戶是否已獲得特定徽章
     */
    private function hasBadge($userId, $badgeId) {
        try {
            $stmt = $this->conn->prepare("SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?");
            $stmt->bind_param("ii", $userId, $badgeId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            return $result->num_rows > 0;
        } catch (Exception $e) {
            error_log("檢查徽章失敗: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * 檢查徽章達成條件
     */
    private function checkBadgeCondition($badge, $userStats) {
        switch ($badge['name']) {
            case '初次登入':
                return $userStats['is_first_login'];
                
            case '首次上傳':
                return $userStats['portfolio_count'] >= 1;
                
            case '完整個人檔案':
                return $userStats['profile_complete'];
                
            case '熱門作品':
                return $userStats['total_views'] >= 100;
                
            case '明星創作者':
                return $userStats['total_likes'] >= 10;
                
            default:
                // 通用條件：基於 required_points
                return $userStats['total_views'] >= $badge['required_points'];
        }
    }
    
    /**
     * 授予徽章（公開方法）
     */
    public function awardBadge($userId, $badgeId, $badgeName) {
        try {
            $stmt = $this->conn->prepare("INSERT INTO user_badges (user_id, badge_id, achieved_at, notes) VALUES (?, ?, NOW(), ?)");
            $notes = "自動授予: {$badgeName}";
            $stmt->bind_param("iis", $userId, $badgeId, $notes);
            $stmt->execute();
            
            // 記錄活動
            $this->logActivity($userId, 'badge_earned', "獲得徽章: {$badgeName}");
            
            return true;
        } catch (Exception $e) {
            error_log("授予徽章失敗: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * 記錄活動
     */
    private function logActivity($userId, $activityType, $description) {
        try {
            $stmt = $this->conn->prepare("INSERT INTO user_activities (user_id, type, description, created_at) VALUES (?, ?, ?, NOW())");
            $stmt->bind_param("iss", $userId, $activityType, $description);
            $stmt->execute();
        } catch (Exception $e) {
            error_log("記錄活動失敗: " . $e->getMessage());
        }
    }
    
    /**
     * 檢查特定徽章條件（供外部調用）
     */
    public function checkSpecificBadge($userId, $badgeName) {
        $userStats = $this->getUserStats($userId);
        $badges = $this->getAllBadges();
        
        foreach ($badges as $badge) {
            if ($badge['name'] === $badgeName) {
                if (!$this->hasBadge($userId, $badge['id'])) {
                    if ($this->checkBadgeCondition($badge, $userStats)) {
                        $this->awardBadge($userId, $badge['id'], $badge['name']);
                        return true;
                    }
                }
                break;
            }
        }
        
        return false;
    }
}

// 提供全域函數供其他API使用
function checkAndAwardBadges($userId) {
    global $conn;
    $badgeManager = new BadgeManager($conn);
    return $badgeManager->checkAndAwardBadges($userId);
}

function checkSpecificBadge($userId, $badgeName) {
    global $conn;
    $badgeManager = new BadgeManager($conn);
    return $badgeManager->checkSpecificBadge($userId, $badgeName);
}
?>
