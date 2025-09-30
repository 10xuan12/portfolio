/**
 * 管理員儀表板 JavaScript
 * 包含系統統計、使用者管理、內容審核等功能
 */

// TODO: 從後端 API 載入管理員儀表板資料
let dashboardData = {
    stats: {
        totalUsers: 1234,
        totalStudents: 890,
        totalEnterprises: 156,
        totalPortfolios: 2345,
        totalJobs: 89,
        totalApplications: 456,
        thisMonthUsers: 123,
        thisMonthPortfolios: 234,
        thisMonthJobs: 12,
        thisMonthApplications: 67
    },
    recentActivities: [
        {
            id: 1,
            type: 'user',
            text: '新學生註冊：張小明 (資訊管理學系)',
            time: '10 分鐘前',
            status: 'pending'
        },
        {
            id: 2,
            type: 'enterprise',
            text: '新企業註冊：台灣微軟股份有限公司',
            time: '30 分鐘前',
            status: 'approved'
        },
        {
            id: 3,
            type: 'portfolio',
            text: '新作品上傳：響應式網站設計 (張小明)',
            time: '1 小時前',
            status: 'pending'
        },
        {
            id: 4,
            type: 'job',
            text: '新職缺發布：前端開發實習生 (台灣微軟)',
            time: '2 小時前',
            status: 'approved'
        },
        {
            id: 5,
            type: 'application',
            text: '新申請：李大明申請前端開發實習生',
            time: '3 小時前',
            status: 'pending'
        }
    ],
    pendingReviews: [
        {
            id: 1,
            type: 'user',
            title: '學生註冊審核',
            count: 5,
            description: '等待審核的學生註冊申請'
        },
        {
            id: 2,
            type: 'enterprise',
            title: '企業註冊審核',
            count: 2,
            description: '等待審核的企業註冊申請'
        },
        {
            id: 3,
            type: 'portfolio',
            title: '作品審核',
            count: 12,
            description: '等待審核的作品上傳'
        },
        {
            id: 4,
            type: 'job',
            title: '職缺審核',
            count: 3,
            description: '等待審核的職缺發布'
        }
    ],
    systemHealth: {
        status: 'healthy',
        uptime: '99.9%',
        responseTime: '120ms',
        activeUsers: 234,
        serverLoad: '45%'
    },
    topUsers: [
        {
            id: 1,
            name: '張小明',
            type: 'student',
            department: '資訊管理學系',
            portfolios: 8,
            views: 1234,
            likes: 89
        },
        {
            id: 2,
            name: '台灣微軟',
            type: 'enterprise',
            jobs: 5,
            applications: 23,
            views: 567
        },
        {
            id: 3,
            name: '李大明',
            type: 'student',
            department: '資訊工程學系',
            portfolios: 6,
            views: 890,
            likes: 67
        }
    ],
    recentReports: [
        {
            id: 1,
            type: 'inappropriate',
            reporter: '張小明',
            reported: '李大明',
            reason: '不當內容',
            status: 'pending',
            time: '1 小時前'
        },
        {
            id: 2,
            type: 'spam',
            reporter: '系統',
            reported: '某企業',
            reason: '垃圾訊息',
            status: 'resolved',
            time: '2 小時前'
        }
    ]
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadDashboardData();
    startRealTimeUpdates();
});

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
    
    // 審核項目點擊
    document.addEventListener('click', function(e) {
        if (e.target.closest('.review-item')) {
            const reviewId = e.target.closest('.review-item').dataset.id;
            const reviewType = e.target.closest('.review-item').dataset.type;
            if (reviewId && reviewType) {
                // 統一導向對應頁面並帶入待審核篩選
                navigateToReviewTarget(reviewType, { source: 'dashboard', reviewId });
            }
        }
    });
}

// 載入儀表板資料
async function loadDashboardData() {
    try {
        Utils.showNotification('載入儀表板資料中...', 'info');
        // 顯示載入中狀態
        const reviewsGrid = document.querySelector('.reviews-grid');
        if (reviewsGrid) {
            reviewsGrid.innerHTML = `<div style="display:flex;justify-content:center;padding:20px;color:var(--text-secondary);"><i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>載入中...</div>`;
        }
        const healthCard = document.querySelector('.system-health');
        if (healthCard) {
            healthCard.innerHTML = `<div style="display:flex;justify-content:center;padding:20px;color:var(--text-secondary);"><i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>載入中...</div>`;
        }
        const activityList = document.querySelector('.recent-activity');
        if (activityList) {
            activityList.innerHTML = `<li style="display:flex;justify-content:center;padding:12px;color:var(--text-secondary);"><i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>載入中...</li>`;
        }
        const resp = await apiService.getAdminDashboard();
        const data = resp?.data || resp;
        if (data) {
            dashboardData = {
                stats: data.stats || dashboardData.stats,
                recentActivities: data.recentActivities || dashboardData.recentActivities,
                pendingReviews: data.pendingReviews || dashboardData.pendingReviews,
                systemHealth: data.systemHealth || dashboardData.systemHealth,
                topUsers: data.topUsers || dashboardData.topUsers,
                recentReports: data.recentReports || dashboardData.recentReports
            };
        }
        renderStats();
        renderRecentActivities();
        renderPendingReviews();
        renderSystemHealth();
        renderTopUsers();
        renderRecentReports();
        Utils.showNotification('儀表板資料載入完成', 'success');
        // 空狀態處理
        if (reviewsGrid && (!data?.pendingReviews || data.pendingReviews.length === 0)) {
            reviewsGrid.innerHTML = `<div class="empty-state"><i class="fas fa-folder-open"></i><h3>目前沒有待審核內容</h3></div>`;
        }
        if (activityList && (!data?.recentActivities || data.recentActivities.length === 0)) {
            activityList.innerHTML = `<li style="text-align:center;color:var(--text-secondary);padding:12px;">沒有最近活動</li>`;
        }
    } catch (error) {
        console.warn('載入儀表板資料失敗，使用預設資料。', error);
        renderStats();
        renderRecentActivities();
        renderPendingReviews();
        renderSystemHealth();
        renderTopUsers();
        renderRecentReports();
    }
}

// 渲染統計資料
function renderStats() {
    const stats = dashboardData.stats;
    
    // 更新統計卡片
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 8) {
        statCards[0].querySelector('.number').textContent = Utils.formatNumber(stats.totalUsers);
        statCards[1].querySelector('.number').textContent = Utils.formatNumber(stats.totalStudents);
        statCards[2].querySelector('.number').textContent = Utils.formatNumber(stats.totalEnterprises);
        statCards[3].querySelector('.number').textContent = Utils.formatNumber(stats.totalPortfolios);
        statCards[4].querySelector('.number').textContent = Utils.formatNumber(stats.totalJobs);
        statCards[5].querySelector('.number').textContent = Utils.formatNumber(stats.totalApplications);
        statCards[6].querySelector('.number').textContent = Utils.formatNumber(stats.thisMonthUsers);
        statCards[7].querySelector('.number').textContent = Utils.formatNumber(stats.thisMonthPortfolios);
    }
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
                <span class="status-badge status-${activity.status}">${getStatusText(activity.status)}</span>
            </div>
        </li>
    `).join('');
}

// 渲染待審核項目
function renderPendingReviews() {
    const reviewsGrid = document.querySelector('.reviews-grid');
    if (!reviewsGrid) return;
    
    // 需求：不顯示職缺審核
    const items = (dashboardData.pendingReviews || []).filter(r => r.type !== 'job');
    if (!items.length) {
        reviewsGrid.innerHTML = `<div class="empty-state"><i class="fas fa-folder-open"></i><h3>目前沒有待審核內容</h3></div>`;
        return;
    }
    reviewsGrid.innerHTML = items.map(review => `
        <div class="review-item" data-id="${review.id}" data-type="${review.type}">
            <div class="review-header">
                <h3>${review.title}</h3>
                <span class="review-count">${review.count}</span>
            </div>
            <p>${review.description}</p>
            <div class="review-actions">
                <button class="btn btn-outline" onclick="viewReviews('${review.type}')">
                    <i class="fas fa-eye"></i> 查看
                </button>
                <button class="btn btn-primary" onclick="processReviews('${review.type}')">
                    <i class="fas fa-check"></i> 處理
                </button>
            </div>
        </div>
    `).join('');
}

// 渲染系統健康狀態
function renderSystemHealth() {
    const health = dashboardData.systemHealth;
    const healthCard = document.querySelector('.system-health');
    if (!healthCard) return;
    
    healthCard.innerHTML = `
        <div class="health-status status-${health.status}">
            <i class="fas fa-circle"></i>
            <span>系統狀態：${getHealthStatusText(health.status)}</span>
        </div>
        <div class="health-stats">
            <div class="health-stat">
                <span class="label">運行時間</span>
                <span class="value">${health.uptime}</span>
            </div>
            <div class="health-stat">
                <span class="label">回應時間</span>
                <span class="value">${health.responseTime}</span>
            </div>
            <div class="health-stat">
                <span class="label">活躍使用者</span>
                <span class="value">${health.activeUsers}</span>
            </div>
            <div class="health-stat">
                <span class="label">伺服器負載</span>
                <span class="value">${health.serverLoad}</span>
            </div>
        </div>
    `;
}

// 渲染熱門使用者
function renderTopUsers() {
    const usersList = document.querySelector('.top-users');
    if (!usersList) return;
    
    usersList.innerHTML = dashboardData.topUsers.map(user => `
        <div class="user-item">
            <div class="user-info">
                <div class="user-avatar">
                    <i class="fas ${user.type === 'student' ? 'fa-user-graduate' : 'fa-building'}"></i>
                </div>
                <div class="user-details">
                    <h4>${user.name}</h4>
                    <p>${user.type === 'student' ? user.department : '企業用戶'}</p>
                </div>
            </div>
            <div class="user-stats">
                ${user.type === 'student' ? `
                    <span>${user.portfolios} 作品</span>
                    <span>${user.views} 瀏覽</span>
                    <span>${user.likes} 讚</span>
                ` : `
                    <span>${user.jobs} 職缺</span>
                    <span>${user.applications} 申請</span>
                    <span>${user.views} 瀏覽</span>
                `}
            </div>
            <div class="user-actions">
                <button class="btn btn-outline" onclick="viewUserProfile(${user.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-outline" onclick="manageUser(${user.id})">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 渲染最近報告
function renderRecentReports() {
    const reportsList = document.querySelector('.recent-reports');
    if (!reportsList) return;
    
    reportsList.innerHTML = dashboardData.recentReports.map(report => `
        <div class="report-item">
            <div class="report-header">
                <span class="report-type type-${report.type}">${getReportTypeText(report.type)}</span>
                <span class="report-status status-${report.status}">${getStatusText(report.status)}</span>
            </div>
            <div class="report-content">
                <p><strong>報告者：</strong>${report.reporter}</p>
                <p><strong>被報告者：</strong>${report.reported}</p>
                <p><strong>原因：</strong>${report.reason}</p>
            </div>
            <div class="report-actions">
                <button class="btn btn-outline" onclick="viewReport(${report.id})">
                    <i class="fas fa-eye"></i> 查看
                </button>
                <button class="btn btn-primary" onclick="resolveReport(${report.id})">
                    <i class="fas fa-check"></i> 處理
                </button>
            </div>
        </div>
    `).join('');
}

// 取得活動圖示
function getActivityIcon(type) {
    const icons = {
        'user': 'fa-user',
        'enterprise': 'fa-building',
        'portfolio': 'fa-folder',
        'job': 'fa-briefcase',
        'application': 'fa-file-alt',
        'system': 'fa-cog'
    };
    return icons[type] || 'fa-info-circle';
}

// 取得狀態文字
function getStatusText(status) {
    const statusMap = {
        'pending': '待處理',
        'approved': '已核准',
        'rejected': '已拒絕',
        'resolved': '已解決'
    };
    return statusMap[status] || status;
}

// 取得健康狀態文字
function getHealthStatusText(status) {
    const statusMap = {
        'healthy': '正常',
        'warning': '警告',
        'error': '錯誤'
    };
    return statusMap[status] || status;
}

// 取得報告類型文字
function getReportTypeText(type) {
    const typeMap = {
        'inappropriate': '不當內容',
        'spam': '垃圾訊息',
        'fake': '虛假資訊',
        'other': '其他'
    };
    return typeMap[type] || type;
}

// 開始即時更新
function startRealTimeUpdates() {
    // TODO: 實作 WebSocket 連接來接收即時通知
    // 例如：當有新註冊、新報告時，即時更新儀表板
    
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
        // const response = await fetch('/api/admin/notifications/unread-count');
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

// 查看審核項目
function viewReviews(type) {
    navigateToReviewTarget(type, { source: 'dashboard' });
}

// 處理審核項目
function processReviews(type) {
    // TODO: 實作批量處理審核功能
    Utils.showNotification(`正在處理 ${type} 審核項目...`, 'info');
    navigateToReviewTarget(type, { source: 'dashboard', action: 'process' });
}

// 查看使用者資料
function viewUserProfile(userId) {
    window.location.href = `user-profile.html?id=${userId}`;
}

// 管理使用者
function manageUser(userId) {
    window.location.href = `user-management.html?id=${userId}`;
}

// 查看報告
function viewReport(reportId) {
    window.location.href = `report-detail.html?id=${reportId}`;
}

// 處理報告
function resolveReport(reportId) {
    // TODO: 實作報告處理功能
    Utils.showNotification('正在處理報告...', 'info');
}

// 重新整理儀表板
function refreshDashboard() {
    loadDashboardData();
    Utils.showNotification('儀表板已重新整理', 'success');
}

// 導向審核目標頁面（依類型對應現有頁面）
function navigateToReviewTarget(type, extraParams = {}) {
    const map = {
        'user': {
            path: 'users.html',
            params: { tab: 'students', status: 'pending' }
        },
        'enterprise': {
            path: 'users.html',
            params: { tab: 'enterprises', status: 'pending' }
        },
        'portfolio': {
            path: 'content.html',
            params: { section: 'portfolios', status: 'pending' }
        },
        'job': {
            path: 'content.html',
            params: { section: 'jobs', status: 'pending' }
        }
    };
    const target = map[type];
    if (!target) return;
    const params = new URLSearchParams({ ...target.params, ...extraParams });
    window.location.href = `${target.path}?${params.toString()}`;
}

// 匯出儀表板資料
function exportDashboardData() {
    try {
        const data = {
            stats: dashboardData.stats,
            activities: dashboardData.recentActivities,
            reviews: dashboardData.pendingReviews,
            health: dashboardData.systemHealth,
            users: dashboardData.topUsers,
            reports: dashboardData.recentReports,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-dashboard-${new Date().toISOString().split('T')[0]}.json`;
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

// 全域函數，供 HTML 直接調用
window.refreshDashboard = refreshDashboard;
window.exportDashboardData = exportDashboardData;
window.viewReviews = viewReviews;
window.processReviews = processReviews;
window.viewUserProfile = viewUserProfile;
window.manageUser = manageUser;
window.viewReport = viewReport;
window.resolveReport = resolveReport; 
window.navigateToReviewTarget = navigateToReviewTarget;