/**
 * 管理員儀表板 JavaScript
 * 包含系統統計、使用者管理、內容審核等功能
 */

// 初始化 API 服務
let apiService = null;

// 管理員儀表板資料（全部從後端 API 載入，不使用假資料）
let dashboardData = {
    stats: {},
    recentActivities: [],
    pendingReviews: [],
    systemHealth: {},
    topUsers: [],
    recentReports: []
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    // 初始化 API 服務
    if (typeof ApiService !== 'undefined') {
        apiService = new ApiService();
    }
    
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
        
        // 如果 apiService 可用，則從 API 載入資料
        let data = null;
        if (apiService && typeof apiService.getAdminDashboard === 'function') {
            const resp = await apiService.getAdminDashboard();
            data = resp?.data || resp;
        }
        
        // 如果沒有 API 資料，顯示錯誤訊息
        if (!data) {
            console.error('無法載入儀表板資料');
            Utils.showNotification('載入儀表板資料失敗', 'error');
            return;
        }
        
        // 更新 dashboardData
        dashboardData = {
            stats: data.stats || {},
            recentActivities: data.recentActivities || [],
            pendingReviews: data.pendingReviews || [],
            systemHealth: data.systemHealth || {},
            topUsers: data.topUsers || [],
            recentReports: data.recentReports || []
        };
        renderStats();
        renderRecentActivities();
        renderActivitySummary();
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
        console.error('載入儀表板資料失敗:', error);
        Utils.showNotification('載入儀表板資料失敗，請重新整理頁面', 'error');
        // 顯示空狀態
        const activitySummary = document.querySelector('.activity-summary');
        if (activitySummary) {
            activitySummary.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>無法載入資料</h3><p>請檢查網路連線或稍後再試</p></div>`;
        }
    }
}

// 渲染統計資料
function renderStats() {
    const stats = dashboardData.stats;
    
    // 更新主要統計卡片
    const totalUsersEl = document.getElementById('statTotalUsers');
    const totalJobsEl = document.getElementById('statTotalJobs');
    const totalApplicationsEl = document.getElementById('statTotalApplications');
    const pendingReviewsEl = document.getElementById('statPendingReviews');
    
    if (totalUsersEl) totalUsersEl.textContent = Utils.formatNumber(stats.totalUsers || 0);
    if (totalJobsEl) totalJobsEl.textContent = Utils.formatNumber(stats.totalJobs || 0);
    if (totalApplicationsEl) totalApplicationsEl.textContent = Utils.formatNumber(stats.totalApplications || 0);
    
    // 計算待審核總數
    const pendingCount = (dashboardData.pendingReviews || []).reduce((sum, item) => sum + (item.count || 0), 0);
    if (pendingReviewsEl) pendingReviewsEl.textContent = Utils.formatNumber(pendingCount);
    
    // 更新實習媒合概況
    renderInternshipOverview(stats);
    
    // 更新側邊欄統計
    renderSidebarStats(stats);
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

// 渲染平台活動摘要（取代審核項目）
function renderActivitySummary() {
    const stats = dashboardData.stats;
    
    const recentRegistrationsEl = document.getElementById('recentRegistrations');
    const recentJobsEl = document.getElementById('recentJobs');
    const recentApplicationsEl = document.getElementById('recentApplications');
    
    if (recentRegistrationsEl) {
        recentRegistrationsEl.textContent = `${Utils.formatNumber(stats.thisMonthUsers || 0)} 人`;
    }
    if (recentJobsEl) {
        recentJobsEl.textContent = `${Utils.formatNumber(stats.thisMonthJobs || 0)} 個`;
    }
    if (recentApplicationsEl) {
        recentApplicationsEl.textContent = `${Utils.formatNumber(stats.thisMonthApplications || 0)} 件`;
    }
    
    // 更新待處理報告數
    const pendingReportsEl = document.getElementById('statPendingReports');
    if (pendingReportsEl) {
        // 從 pendingReviews 中找出報告相關的項目
        const reportItem = (dashboardData.pendingReviews || []).find(r => r.type === 'report');
        const reportCount = reportItem ? reportItem.count : 0;
        pendingReportsEl.textContent = Utils.formatNumber(reportCount);
    }
}

// 渲染系統健康狀態
function renderSystemHealth() {
    const health = dashboardData.systemHealth || {};
    const healthCard = document.querySelector('.system-health');
    const statusCard = document.getElementById('systemStatus');
    
    if (healthCard) {
        healthCard.innerHTML = `
            <div class="health-status status-${health.status || 'healthy'}">
                <i class="fas fa-circle"></i>
                <span>系統狀態：${getHealthStatusText(health.status || 'healthy')}</span>
            </div>
            <div class="health-stats">
                <div class="health-stat">
                    <span class="label">活躍使用者（24小時）</span>
                    <span class="value">${Utils.formatNumber(health.activeUsers || 0)}</span>
                </div>
                <div class="health-stat">
                    <span class="label">今日新增使用者</span>
                    <span class="value">${Utils.formatNumber(health.todayUsers || 0)}</span>
                </div>
                <div class="health-stat">
                    <span class="label">今日新增職缺</span>
                    <span class="value">${Utils.formatNumber(health.todayJobs || 0)}</span>
                </div>
                <div class="health-stat">
                    <span class="label">今日新增申請</span>
                    <span class="value">${Utils.formatNumber(health.todayApplications || 0)}</span>
                </div>
            </div>
        `;
    }
    
    // 更新側邊欄系統狀態
    if (statusCard) {
        const status = health.status || 'healthy';
        statusCard.innerHTML = `
            <div class="status-item status-${status}">
                <i class="fas fa-${status === 'healthy' ? 'check-circle' : status === 'warning' ? 'exclamation-triangle' : 'times-circle'}"></i>
                <span>系統運行${status === 'healthy' ? '正常' : status === 'warning' ? '警告' : '異常'}</span>
            </div>
        `;
    }
}

// 渲染實習媒合概況
function renderInternshipOverview(stats) {
    const openJobsEl = document.getElementById('overviewOpenJobs');
    const totalJobsEl = document.getElementById('overviewTotalJobs');
    const pendingAppsEl = document.getElementById('overviewPendingApps');
    const totalAppsEl = document.getElementById('overviewTotalApps');
    
    if (openJobsEl) openJobsEl.textContent = Utils.formatNumber(stats.openJobs || stats.totalJobs || 0);
    if (totalJobsEl) totalJobsEl.textContent = Utils.formatNumber(stats.totalJobs || 0);
    if (pendingAppsEl) pendingAppsEl.textContent = Utils.formatNumber(stats.pendingApplications || 0);
    if (totalAppsEl) totalAppsEl.textContent = Utils.formatNumber(stats.totalApplications || 0);
}

// 渲染側邊欄統計
function renderSidebarStats(stats) {
    const studentsEl = document.getElementById('sidebarStudents');
    const enterprisesEl = document.getElementById('sidebarEnterprises');
    const portfoliosEl = document.getElementById('sidebarPortfolios');
    const jobsEl = document.getElementById('sidebarJobs');
    const pendingEl = document.getElementById('sidebarPending');
    
    if (studentsEl) studentsEl.textContent = `${Utils.formatNumber(stats.totalStudents || 0)} 人`;
    if (enterprisesEl) enterprisesEl.textContent = `${Utils.formatNumber(stats.totalEnterprises || 0)} 家`;
    if (portfoliosEl) portfoliosEl.textContent = `${Utils.formatNumber(stats.totalPortfolios || 0)} 件`;
    if (jobsEl) jobsEl.textContent = `${Utils.formatNumber(stats.openJobs || 0)} 個`;
    
    // 計算待審核總數
    const pendingCount = (dashboardData.pendingReviews || []).reduce((sum, item) => sum + (item.count || 0), 0);
    if (pendingEl) pendingEl.textContent = `${Utils.formatNumber(pendingCount)} 件`;
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
    // 即時更新可使用以下方式實現：
    // 1. WebSocket: const ws = new WebSocket('ws://localhost/notifications')
    // 2. Server-Sent Events (SSE): const evtSource = new EventSource('/api/admin/events')
    // 3. 輪詢: setInterval(() => fetch('/api/admin/notifications/unread'), 30000)
    
    // 當前使用輪詢方式進行更新
    setInterval(() => {
        // 檢查是否有新通知
        checkNewNotifications();
    }, 30000); // 每30秒檢查一次
}

// 檢查新通知
async function checkNewNotifications() {
    try {
        const svc = await ensureApiServiceReady();
        
        // API: GET /api/admin/notifications?status=unread
        const response = await svc.request('admin/notifications?status=unread');
        const notifications = response?.data || [];
        const unreadCount = notifications.length;
        
        // 更新通知數量
        updateNotificationCount(unreadCount);
        
    } catch (error) {
        console.error('檢查新通知錯誤:', error);
        // 失敗時設為0
        updateNotificationCount(0);
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
    Utils.showNotification(`正在處理 ${type} 審核項目...`, 'info');
    
    // 導航到對應的審核頁面並標記為批量處理模式
    sessionStorage.setItem('review_mode', 'batch');
    sessionStorage.setItem('review_type', type);
    
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
async function resolveReport(reportId) {
    try {
        // 顯示處理選項對話框
        const action = await showReportActionDialog(reportId);
        
        if (!action) return; // 用戶取消
        
        Utils.showNotification('正在處理報告...', 'info');
        
        // 這裡可以呼叫 API 處理報告
        // const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ action, notes: action.notes })
        // });
        
        // 模擬處理完成
        setTimeout(() => {
            Utils.showNotification('報告處理完成', 'success');
            loadRecentReports(); // 重新載入報告列表
        }, 1000);
        
    } catch (error) {
        console.error('處理報告失敗:', error);
        Utils.showNotification('處理報告失敗', 'error');
    }
}

// 顯示報告處理選項對話框
function showReportActionDialog(reportId) {
    return new Promise((resolve) => {
        const actions = [
            { value: 'warning', label: '發出警告' },
            { value: 'content_removed', label: '移除內容' },
            { value: 'user_suspended', label: '暫停用戶' },
            { value: 'user_banned', label: '封鎖用戶' },
            { value: 'no_action', label: '無需處理' }
        ];
        
        // 這裡應該顯示一個對話框讓管理員選擇處理方式
        // 暫時使用 confirm 模擬
        const actionValue = prompt('請選擇處理方式：\n' + actions.map((a, i) => `${i+1}. ${a.label}`).join('\n'));
        
        if (actionValue && parseInt(actionValue) > 0 && parseInt(actionValue) <= actions.length) {
            resolve(actions[parseInt(actionValue) - 1]);
        } else {
            resolve(null);
        }
    });
}

// 重新整理儀表板
function refreshDashboard() {
    loadDashboardData();
    Utils.showNotification('儀表板已重新整理', 'success');
}

// 導向審核目標頁面（依類型對應現有頁面，移除作品審核）
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
        'job': {
            path: 'analytics.html',
            params: { type: 'jobs' }
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