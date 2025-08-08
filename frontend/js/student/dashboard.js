/**
 * 學生儀表板 JavaScript
 * 包含資料載入、統計顯示、活動記錄等功能
 */

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    setupEventListeners();
});

/**
 * 載入儀表板資料
 */
async function loadDashboardData() {
    try {
        debugLog('載入學生儀表板資料...');
        
        // 使用統一API服務
        const userId = 1; // 假設當前使用者ID為1
        
        // 並行載入所有資料
        const [stats, portfolios, activities, badges, notifications] = await Promise.all([
            apiService.getStats('student'),
            apiService.getUserPortfolios(userId),
            apiService.getActivities(userId),
            apiService.getBadges(userId),
            apiService.getNotifications(userId)
        ]);
        
        // 渲染資料
        renderStats(stats);
        renderRecentPortfolios(portfolios);
        renderRecentActivities(activities);
        renderBadges(badges);
        renderNotifications(notifications);
        
        debugLog('學生儀表板資料載入完成');
    } catch (error) {
        console.error('載入學生儀表板資料錯誤:', error);
        Utils.showNotification('載入資料失敗，請稍後再試', 'error');
    }
}

/**
 * 設定事件監聽器
 */
function setupEventListeners() {
    // 快速操作按鈕
    const quickActions = document.querySelectorAll('.quick-action');
    quickActions.forEach(action => {
        action.addEventListener('click', function(e) {
            // 這裡可以添加點擊追蹤或其他功能
            debugLog('快速操作:', this.querySelector('span').textContent);
        });
    });
}

/**
 * 渲染統計資料
 */
function renderStats(stats) {
    // 更新統計數字
    const statElements = {
        'stat-works': stats.total_portfolios || stats.totalPortfolios || 0,
        'stat-views': stats.total_views || stats.totalViews || 0,
        'stat-likes': stats.total_likes || stats.totalLikes || 0,
        'stat-comments': stats.total_comments || stats.totalComments || 0
    };
    
    Object.keys(statElements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = MockData.formatNumber(statElements[id]);
        }
    });
}

/**
 * 渲染最近作品
 */
function renderRecentPortfolios(portfolios) {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;
    
    portfolioGrid.innerHTML = '';
    
    // 確保portfolios是陣列
    const portfolioArray = Array.isArray(portfolios) ? portfolios : (portfolios.data || []);
    
    portfolioArray.forEach(portfolio => {
        const portfolioItem = document.createElement('div');
        portfolioItem.className = 'portfolio-item';
        portfolioItem.innerHTML = `
            <div class="portfolio-header">
                <span class="portfolio-title">${portfolio.title}</span>
                <span class="portfolio-status ${portfolio.status}">${getStatusText(portfolio.status)}</span>
            </div>
            <div class="portfolio-content">
                <p>${portfolio.description}</p>
                <div class="portfolio-tags">
                    ${(portfolio.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="portfolio-stats">
                <span><i class="fas fa-eye"></i> ${MockData.formatNumber(portfolio.views || 0)}</span>
                <span><i class="fas fa-heart"></i> ${MockData.formatNumber(portfolio.likes || 0)}</span>
                <span><i class="fas fa-comment"></i> ${MockData.formatNumber(portfolio.comments || 0)}</span>
            </div>
        `;
        portfolioGrid.appendChild(portfolioItem);
    });
}

/**
 * 渲染最近活動
 */
function renderRecentActivities(activities) {
    const activitiesList = document.querySelector('.recent-activities');
    if (!activitiesList) return;
    
    activitiesList.innerHTML = '';
    
    // 確保activities是陣列
    const activityArray = Array.isArray(activities) ? activities : (activities.data || []);
    
    activityArray.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.text}</p>
                <small>${activity.time}</small>
            </div>
        `;
        activitiesList.appendChild(activityItem);
    });
}

/**
 * 渲染徽章
 */
function renderBadges(badges) {
    const badgesContainer = document.querySelector('.badges-container');
    if (!badgesContainer) return;
    
    badgesContainer.innerHTML = '';
    
    // 確保badges是陣列
    const badgeArray = Array.isArray(badges) ? badges : (badges.data || []);
    
    badgeArray.forEach(badge => {
        const badgeItem = document.createElement('div');
        badgeItem.className = `badge-item ${badge.earned ? 'earned' : ''}`;
        badgeItem.innerHTML = `
            <div class="badge-icon">
                <i class="${badge.icon}"></i>
            </div>
            <div class="badge-info">
                <div class="badge-name">${badge.name}</div>
                <div class="badge-description">${badge.description}</div>
            </div>
        `;
        badgesContainer.appendChild(badgeItem);
    });
}

/**
 * 渲染通知
 */
function renderNotifications(notifications) {
    const notificationsList = document.querySelector('.notifications-list');
    if (!notificationsList) return;
    
    notificationsList.innerHTML = '';
    
    // 確保notifications是陣列
    const notificationArray = Array.isArray(notifications) ? notifications : (notifications.data || []);
    
    notificationArray.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.is_read ? 'read' : 'unread'}`;
        notificationItem.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <small>${MockData.formatTime(notification.created_at)}</small>
            </div>
        `;
        notificationsList.appendChild(notificationItem);
    });
}

/**
 * 取得狀態文字
 */
function getStatusText(status) {
    const statusMap = {
        'published': '已發布',
        'review': '審核中',
        'draft': '草稿',
        'rejected': '已拒絕'
    };
    return statusMap[status] || status;
}

/**
 * 取得活動圖示
 */
function getActivityIcon(type) {
    const iconMap = {
        'upload': 'fa-upload',
        'view': 'fa-eye',
        'like': 'fa-heart',
        'comment': 'fa-comment'
    };
    return iconMap[type] || 'fa-info-circle';
}

/**
 * 取得通知圖示
 */
function getNotificationIcon(type) {
    const iconMap = {
        'view': 'fa-eye',
        'like': 'fa-heart',
        'comment': 'fa-comment',
        'system': 'fa-cog'
    };
    return iconMap[type] || 'fa-bell';
}

// 全域函數，供 HTML 呼叫
window.loadDashboardData = loadDashboardData; 