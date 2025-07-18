/**
 * 學生儀表板 JavaScript
 * 包含資料載入、統計顯示、活動記錄等功能
 */

// TODO: 從後端 API 載入學生儀表板資料
let dashboardData = {
    stats: {
        totalPortfolios: 12,
        totalViews: 1234,
        totalLikes: 89,
        totalComments: 23,
        thisMonthViews: 156,
        thisMonthLikes: 12,
        thisMonthComments: 5
    },
    recentPortfolios: [
        {
            id: 1,
            title: '響應式網站設計',
            status: 'published',
            views: 156,
            likes: 23,
            comments: 8,
            created_at: '2024-01-15'
        },
        {
            id: 2,
            title: '行動應用程式',
            status: 'published',
            views: 203,
            likes: 45,
            comments: 12,
            created_at: '2024-01-14'
        },
        {
            id: 3,
            title: 'UI/UX 設計作品',
            status: 'review',
            views: 0,
            likes: 0,
            comments: 0,
            created_at: '2024-01-13'
        }
    ],
    recentActivities: [
        {
            id: 1,
            type: 'upload',
            text: '上傳了新作品「UI/UX 設計作品」',
            time: '2 小時前',
            portfolioId: 3
        },
        {
            id: 2,
            type: 'view',
            text: '有人瀏覽了您的作品「響應式網站設計」',
            time: '4 小時前',
            portfolioId: 1
        },
        {
            id: 3,
            type: 'like',
            text: '有人對您的作品「行動應用程式」按讚',
            time: '6 小時前',
            portfolioId: 2
        },
        {
            id: 4,
            type: 'comment',
            text: '有人評論了您的作品「響應式網站設計」',
            time: '1 天前',
            portfolioId: 1
        }
    ],
    badges: [
        { id: 1, name: '新手上傳者', icon: 'fas fa-star', earned: true },
        { id: 2, name: '瀏覽達人', icon: 'fas fa-eye', earned: true },
        { id: 3, name: '受歡迎', icon: 'fas fa-heart', earned: true },
        { id: 4, name: '作品大師', icon: 'fas fa-trophy', earned: true },
        { id: 5, name: '互動王', icon: 'fas fa-comment', earned: true },
        { id: 6, name: '超級明星', icon: 'fas fa-crown', earned: false }
    ],
    enterpriseInteractions: [
        {
            id: 1,
            company: '科技公司 A',
            action: '瀏覽了您的作品集',
            time: '1 天前'
        },
        {
            id: 2,
            company: '設計工作室 B',
            action: '對您的作品感興趣',
            time: '3 天前'
        }
    ]
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    initEventListeners();
    startRealTimeUpdates();
});

// 載入儀表板資料
async function loadDashboardData() {
    try {
        // TODO: 從後端 API 載入儀表板資料
        // const response = await fetch('/api/student/dashboard');
        // dashboardData = await response.json();
        
        renderStats();
        renderRecentPortfolios();
        renderRecentActivities();
        renderBadges();
        renderEnterpriseInteractions();
        
        console.log('儀表板資料載入完成');
    } catch (error) {
        console.error('載入儀表板資料錯誤:', error);
        Utils.showNotification('載入資料失敗，請稍後再試', 'error');
    }
}

// 初始化事件監聽器
function initEventListeners() {
    // 快速操作按鈕
    document.querySelectorAll('.quick-action').forEach(button => {
        button.addEventListener('click', function(e) {
            // 檢查是否為有效的連結
            if (!this.href || this.href === '#') {
                e.preventDefault();
                Utils.showNotification('功能開發中', 'info');
            }
        });
    });
    
    // 作品項目點擊
    document.addEventListener('click', function(e) {
        if (e.target.closest('.portfolio-item')) {
            const portfolioId = e.target.closest('.portfolio-item').dataset.id;
            if (portfolioId) {
                window.location.href = `portfolio-detail.html?id=${portfolioId}`;
            }
        }
    });
}

// 渲染統計資料
function renderStats() {
    const stats = dashboardData.stats;
    
    // 更新統計卡片
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('.number').textContent = stats.totalPortfolios;
        statCards[1].querySelector('.number').textContent = Utils.formatNumber(stats.totalViews);
        statCards[2].querySelector('.number').textContent = stats.totalLikes;
        statCards[3].querySelector('.number').textContent = stats.totalComments;
    }
}

// 渲染最近作品
function renderRecentPortfolios() {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;
    
    portfolioGrid.innerHTML = dashboardData.recentPortfolios.map(portfolio => `
        <div class="portfolio-item" data-id="${portfolio.id}">
            <div class="portfolio-header">
                <span class="portfolio-title">${portfolio.title}</span>
                <span class="portfolio-status status-${portfolio.status}">${getStatusText(portfolio.status)}</span>
            </div>
            <p>${getPortfolioDescription(portfolio.title)}</p>
            <div class="portfolio-stats">
                <span><i class="fas fa-eye"></i> ${portfolio.views} 次瀏覽</span>
                <span><i class="fas fa-heart"></i> ${portfolio.likes} 個讚</span>
                <span><i class="fas fa-comment"></i> ${portfolio.comments} 則評論</span>
            </div>
        </div>
    `).join('');
}

// 渲染最近活動
function renderRecentActivities() {
    const activityList = document.querySelector('.recent-activity');
    if (!activityList) return;
    
    activityList.innerHTML = dashboardData.recentActivities.map(activity => `
        <li>
            <div class="activity-icon activity-${activity.type}">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div>
                <div>${activity.text}</div>
                <small>${activity.time}</small>
            </div>
        </li>
    `).join('');
}

// 渲染徽章
function renderBadges() {
    const badgeContainer = document.querySelector('.sidebar-card:last-child');
    if (!badgeContainer) return;
    
    const earnedBadges = dashboardData.badges.filter(badge => badge.earned);
    const unearnedBadges = dashboardData.badges.filter(badge => !badge.earned);
    
    badgeContainer.innerHTML = `
        <h3>徽章成就</h3>
        <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-sm);">
            ${earnedBadges.map(badge => `
                <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 80px;">
                    <div style="width: 40px; height: 40px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: var(--spacing-xs);">
                        <i class="${badge.icon}"></i>
                    </div>
                    <div style="font-size: var(--text-xs); color: var(--gray-700);">${badge.name}</div>
                </div>
            `).join('')}
            ${unearnedBadges.map(badge => `
                <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 80px; opacity: 0.5;">
                    <div style="width: 40px; height: 40px; background: var(--gray-300); color: var(--gray-500); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: var(--spacing-xs);">
                        <i class="${badge.icon}"></i>
                    </div>
                    <div style="font-size: var(--text-xs); color: var(--gray-500);">${badge.name}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// 渲染企業互動
function renderEnterpriseInteractions() {
    const enterpriseContainer = document.querySelector('.sidebar-card:nth-child(3)');
    if (!enterpriseContainer) return;
    
    enterpriseContainer.innerHTML = `
        <h3>企業互動</h3>
        ${dashboardData.enterpriseInteractions.map(interaction => `
            <div style="margin-bottom: var(--spacing-md);">
                <div style="font-weight: 600; color: var(--gray-900);">${interaction.company}</div>
                <div style="font-size: var(--text-sm); color: var(--gray-600);">${interaction.action}</div>
                <small style="color: var(--gray-500);">${interaction.time}</small>
            </div>
        `).join('')}
    `;
}

// 取得狀態文字
function getStatusText(status) {
    const statusMap = {
        'published': '已發布',
        'draft': '草稿',
        'review': '審核中'
    };
    return statusMap[status] || status;
}

// 取得作品描述
function getPortfolioDescription(title) {
    const descriptions = {
        '響應式網站設計': '使用 HTML5、CSS3 和 JavaScript 製作的現代化響應式網站',
        '行動應用程式': '使用 React Native 開發的跨平台行動應用程式',
        'UI/UX 設計作品': '使用 Figma 設計的現代化使用者介面',
        '數據視覺化專案': '使用 D3.js 製作的互動式數據視覺化專案'
    };
    return descriptions[title] || '作品描述';
}

// 取得活動圖示
function getActivityIcon(type) {
    const icons = {
        'upload': 'fa-upload',
        'view': 'fa-eye',
        'like': 'fa-heart',
        'comment': 'fa-comment'
    };
    return icons[type] || 'fa-info-circle';
}

// 開始即時更新
function startRealTimeUpdates() {
    // TODO: 實作 WebSocket 連接來接收即時通知
    // 例如：當有新通知、新評論、新瀏覽時，即時更新儀表板
    
    // 模擬即時更新
    setInterval(() => {
        // 檢查是否有新通知
        checkNewNotifications();
    }, 30000); // 每30秒檢查一次
}

// 檢查新通知
async function checkNewNotifications() {
    try {
        // TODO: 檢查是否有新通知
        // const response = await fetch('/api/notifications/unread-count');
        // const unreadCount = await response.json();
        
        // 更新通知數量
        updateNotificationCount(0); // 暫時設為0
        
    } catch (error) {
        console.error('檢查新通知錯誤:', error);
    }
}

// 更新通知數量
function updateNotificationCount(count) {
    const notificationLink = document.querySelector('a[href="notifications.html"]');
    if (notificationLink && count > 0) {
        // 添加通知數量徽章
        let badge = notificationLink.querySelector('.notification-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: var(--error-color);
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            notificationLink.style.position = 'relative';
            notificationLink.appendChild(badge);
        }
        badge.textContent = count;
    }
}

// 重新整理儀表板
function refreshDashboard() {
    loadDashboardData();
    Utils.showNotification('儀表板已重新整理', 'success');
}
// Dashboard 統計數據動態渲染
if (window.location.pathname.includes('student/dashboard.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        API.get('/student/stats')
            .then(data => {
                if (data) {
                    if (document.getElementById('stat-works'))
                        document.getElementById('stat-works').textContent = Utils.formatNumber(data.works);
                    if (document.getElementById('stat-views'))
                        document.getElementById('stat-views').textContent = Utils.formatNumber(data.views);
                    if (document.getElementById('stat-likes'))
                        document.getElementById('stat-likes').textContent = Utils.formatNumber(data.likes);
                    if (document.getElementById('stat-comments'))
                        document.getElementById('stat-comments').textContent = Utils.formatNumber(data.comments);
                }
            })
            .catch(error => {
                console.error('載入統計資料失敗', error);
            });
    });
}
// 匯出儀表板資料
function exportDashboardData() {
    try {
        const data = {
            stats: dashboardData.stats,
            portfolios: dashboardData.recentPortfolios,
            activities: dashboardData.recentActivities,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('儀表板資料已匯出', 'success');
    } catch (error) {
        Utils.showNotification('匯出失敗，請稍後再試', 'error');
        console.error('匯出儀表板資料錯誤:', error);
    }
}

// 切換主題
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    Utils.showNotification(`已切換到${newTheme === 'dark' ? '深色' : '淺色'}主題`, 'success');
}

// 切換語言
function toggleLanguage() {
    const currentLang = document.documentElement.lang;
    const newLang = currentLang === 'zh-Hant' ? 'en' : 'zh-Hant';
    
    document.documentElement.lang = newLang;
    localStorage.setItem('language', newLang);
    
    Utils.showNotification(`已切換到${newLang === 'en' ? '英文' : '繁體中文'}`, 'success');
}

// 全域函數，供 HTML 直接調用
window.refreshDashboard = refreshDashboard;
window.exportDashboardData = exportDashboardData;
window.toggleTheme = toggleTheme;
window.toggleLanguage = toggleLanguage; 