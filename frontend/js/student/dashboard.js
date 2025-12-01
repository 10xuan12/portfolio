/**
 * 學生儀表板 JavaScript
 * 包含資料載入、統計顯示、活動記錄等功能
 */

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待 API 服務初始化完成
    if (typeof apiService !== 'undefined' && apiService) {
        loadDashboardData();
        setupEventListeners();
    } else {
        // 如果 API 服務還沒準備好，等待一下
        setTimeout(() => {
            if (typeof apiService !== 'undefined' && apiService) {
                loadDashboardData();
                setupEventListeners();
            } else {
                console.error('API 服務未初始化');
            }
        }, 100);
    }
});

/**
 * 載入儀表板資料
 */
async function loadDashboardData() {
    try {
        debugLog('載入學生儀表板資料...');
        showDashboardLoading(true);
        
        // 檢查 API 服務是否可用
        if (typeof apiService === 'undefined' || !apiService) {
            console.error('API 服務未初始化，嘗試重新初始化...');
            if (typeof window.initializeApiService === 'function') {
                window.initializeApiService();
                // 等待一下再檢查
                await new Promise(resolve => setTimeout(resolve, 200));
                if (typeof apiService === 'undefined' || !apiService) {
                    throw new Error('API 服務初始化失敗，請檢查後端服務是否正常運行');
                }
            } else {
                throw new Error('API 服務初始化函數不存在');
            }
        }
        
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user || !user.id) {
            throw new Error('使用者未登入');
        }
        
        // 載入履歷狀態
        await loadResumeStatus(user.id);
        
        // 載入其他資料
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊，請重新登入');
        }
        const userId = user.id;
        
        console.log('使用者 ID:', userId);
        console.log('API 服務狀態:', typeof apiService, apiService);
        console.log('API Base URL:', apiService.baseUrl);
        
        // 並行載入所有資料
        const [stats, portfolios, activitiesResp, badgesResp, notificationsResp, jobsResp] = await Promise.all([
            apiService.getStats('student'),
            apiService.getUserPortfolios(userId),
            apiService.getActivities(userId),
            apiService.getBadges(userId),
            apiService.getNotifications(userId),
            loadEnterpriseJobsData()
        ]);
        
        // 處理API回應格式
        const activities = activitiesResp && (activitiesResp.success || activitiesResp.status === 200) ? activitiesResp.data : (activitiesResp || []);
        const badges = badgesResp && (badgesResp.success || badgesResp.status === 200) ? (badgesResp.data?.badges || badgesResp.data || []) : (badgesResp || []);
        const notifications = notificationsResp && (notificationsResp.success || notificationsResp.status === 200) ? notificationsResp.data : (notificationsResp || []);
        
        // 處理職缺數據：支援多種API回應格式
        let jobs = [];
        if (jobsResp) {
            if (jobsResp.success || jobsResp.status === 200) {
                // 標準格式：{ status: 200, data: { jobs: [...] } }
                jobs = jobsResp.data?.jobs || jobsResp.data || [];
            } else if (Array.isArray(jobsResp)) {
                // 直接是陣列
                jobs = jobsResp;
            } else if (jobsResp.jobs && Array.isArray(jobsResp.jobs)) {
                // 格式：{ jobs: [...] }
                jobs = jobsResp.jobs;
            }
        }

        // 渲染資料
        renderStats(stats || {});
        renderRecentPortfolios(portfolios);
        renderRecentActivities(activities);
        renderBadges(badges);
        renderNotifications(notifications);
        renderEnterpriseJobs(jobs);
        
        debugLog('學生儀表板資料載入完成');
    } catch (error) {
        console.error('載入學生儀表板資料錯誤:', error);
        
        // 顯示更詳細的錯誤訊息
        let errorMessage = '載入資料失敗，請稍後再試';
        if (error.message.includes('API 服務初始化失敗')) {
            errorMessage = '後端服務未啟動，請檢查伺服器狀態';
        } else if (error.message.includes('無法獲取使用者資訊')) {
            errorMessage = '請重新登入';
        } else if (error.message.includes('Network Error') || error.message.includes('fetch')) {
            errorMessage = '網路連線錯誤，請檢查網路狀態';
        }
        
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification(errorMessage, 'error');
        } else {
            alert(errorMessage);
        }
        showDashboardError(errorMessage);
    }
    finally {
        showDashboardLoading(false);
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
            const value = statElements[id];
            if (typeof Utils !== 'undefined' && Utils.formatNumber) {
                element.textContent = Utils.formatNumber(value);
            } else {
                element.textContent = new Intl.NumberFormat('zh-TW').format(value);
            }
        }
    });
}

// 顯示/隱藏 loading 狀態
function showDashboardLoading(isLoading) {
    const overlay = document.getElementById('dashboardLoading');
    if (!overlay) return;
    overlay.style.display = isLoading ? 'flex' : 'none';
}

// 顯示錯誤訊息容器（若頁面有）
function showDashboardError(message) {
    const err = document.getElementById('dashboardError');
    if (!err) return;
    err.textContent = message;
    err.style.display = 'block';
}

/**
 * 渲染最近作品
 */
function renderRecentPortfolios(portfolios) {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;
    
    portfolioGrid.innerHTML = '';
    
    // 確保portfolios是陣列
    const portfolioArray = Array.isArray(portfolios) ? portfolios : (portfolios && portfolios.data ? portfolios.data : []);
    
    if (portfolioArray.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.innerHTML = `
            <i class="fas fa-folder-open"></i>
            <p>暫無作品</p>
            <a href="upload.html" class="btn btn-primary">上傳第一個作品</a>
        `;
        portfolioGrid.appendChild(emptyMessage);
        return;
    }
    
    portfolioArray.forEach(portfolio => {
        const portfolioItem = document.createElement('div');
        portfolioItem.className = 'portfolio-item';
        portfolioItem.setAttribute('data-portfolio-id', portfolio.id);
        
        // 格式化數字
        const formatNumber = (num) => {
            if (typeof Utils !== 'undefined' && Utils.formatNumber) {
                return Utils.formatNumber(num || 0);
            }
            return new Intl.NumberFormat('zh-TW').format(num || 0);
        };
        
        portfolioItem.innerHTML = `
            <div class="portfolio-header">
                <span class="portfolio-title">${portfolio.title || '未命名作品'}</span>
                <span class="portfolio-status status-${portfolio.status || 'draft'}">${getStatusText(portfolio.status)}</span>
            </div>
            <div class="portfolio-content">
                <p>${portfolio.description || '暫無描述'}</p>
                <div class="portfolio-tags">
                    ${(portfolio.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="portfolio-stats">
                <span><i class="fas fa-eye"></i> ${formatNumber(portfolio.views)}</span>
                <span><i class="fas fa-heart"></i> ${formatNumber(portfolio.likes)}</span>
                <span><i class="fas fa-comment"></i> ${formatNumber(portfolio.comments)}</span>
            </div>
        `;
        portfolioGrid.appendChild(portfolioItem);
    });
}

/**
 * 渲染最近活動
 */
function renderRecentActivities(activities) {
    const activitiesList = document.getElementById('recent-activity');
    if (!activitiesList) return;
    
    activitiesList.innerHTML = '';
    
    const activityArray = Array.isArray(activities) ? activities : [];
    
    if (activityArray.length === 0) {
        const li = document.createElement('li');
        li.className = 'no-activity';
        li.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-info-circle"></i>
            </div>
            <div>
                <div>暫無活動</div>
                <small>開始上傳作品來記錄活動</small>
            </div>
        `;
        activitiesList.appendChild(li);
        return;
    }
    
    activityArray.forEach(activity => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="activity-icon activity-${activity.type || 'default'}">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div>
                <div>${activity.text || activity.message || '未知活動'}</div>
                <small>${activity.time || activity.created_at || '未知時間'}</small>
            </div>
        `;
        activitiesList.appendChild(li);
    });
}

/**
 * 根據徽章名稱或類別決定徽章類型
 */
function getBadgeType(badgeName, category) {
    // 簡化版：所有徽章都使用 achievement 類型
    return 'achievement';
}

/**
 * 根據徽章類型獲取預設圖標 - Bootstrap Icons
 */
function getDefaultIcon(badgeType) {
    const iconMap = {
        'login': 'bi bi-box-arrow-in-right',
        'upload': 'bi bi-cloud-upload',
        'profile': 'bi bi-person-circle',
        'creator': 'bi bi-star-fill',
        'popular': 'bi bi-fire',
        'social': 'bi bi-people-fill',
        'achievement': 'bi bi-trophy-fill',
        'special': 'bi bi-gem'
    };
    
    return iconMap[badgeType] || 'bi bi-star-fill';
}

/**
 * 渲染徽章
 */
function renderBadges(badges) {
    const badgesContainer = document.getElementById('badges-container');
    if (!badgesContainer) return;
    
    badgesContainer.innerHTML = '';
    
    const badgeArray = Array.isArray(badges) ? badges : [];
    
    // 調試：輸出徽章數據
    console.log('徽章數據:', badgeArray);
    console.log('徽章數據類型:', typeof badgeArray, Array.isArray(badgeArray));
    
    if (badgeArray.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'badge-item loading-placeholder';
        empty.innerHTML = `
            <div class="badge-icon">
                <i class="bi bi-star"></i>
            </div>
            <div>
                <div>暫無徽章</div>
                <small>完成更多作品來獲得徽章</small>
            </div>
        `;
        badgesContainer.appendChild(empty);
        return;
    }
    
    badgeArray.forEach((badge, index) => {
        const badgeItem = document.createElement('li');
        
        // 根據徽章名稱或類別決定CSS類別
        const badgeType = getBadgeType(badge.name, badge.category);
        const badgeClass = badge.earned ? `earned badge-${badgeType}` : 'not-earned';
        
        // 調試：輸出每個徽章的資訊
        console.log(`徽章 ${index}:`, {
            name: badge.name,
            icon: badge.icon,
            earned: badge.earned,
            category: badge.category,
            badgeType: badgeType,
            badgeClass: badgeClass,
            finalIconClass: badge.icon || getDefaultIcon(badgeType)
        });
        
        badgeItem.className = `badge-item ${badgeClass}`;
        badgeItem.innerHTML = `
            <div class="badge-icon">
                <i class="${badge.icon || getDefaultIcon(badgeType)}"></i>
            </div>
            <div>
                <div>${badge.name || '未知徽章'}</div>
                <small>${badge.description || '暫無描述'}</small>
                ${badge.earned_date ? `<small>獲得於 ${badge.earned_date}</small>` : ''}
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
    const notificationArray = Array.isArray(notifications) ? notifications : (notifications && notifications.data ? notifications.data : []);
    
    if (notificationArray.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'no-notifications';
        empty.innerHTML = `
            <i class="fas fa-bell-slash"></i>
            <p>暫無通知</p>
            <small>當有新的互動時會顯示在這裡</small>
        `;
        notificationsList.appendChild(empty);
        return;
    }
    
    notificationArray.forEach(notification => {
        const isRead = (notification.is_read !== undefined) ? notification.is_read : (notification.status === 'read');
        const title = notification.title || '通知';
        const message = notification.message || notification.text || '';
        const time = notification.created_at || notification.time || '';
        
        // 格式化日期
        const formatDate = (dateString) => {
            if (typeof Utils !== 'undefined' && Utils.formatDate) {
                return Utils.formatDate(dateString);
            }
            if (dateString) {
                const d = new Date(dateString);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}/${month}/${day}`;
            }
            return '未知時間';
        };
        
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${isRead ? 'read' : 'unread'}`;
        notificationItem.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
                <small>${formatDate(time)}</small>
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

/**
 * 載入履歷狀態
 */
async function loadResumeStatus(userId) {
    try {
        // 檢查履歷狀態的 API 呼叫
        if (typeof apiService !== 'undefined' && apiService.getResumeStatus) {
            const resumeStatus = await apiService.getResumeStatus(userId);
            console.log('履歷狀態:', resumeStatus);
            return resumeStatus;
        } else {
            // 如果沒有 API 服務，返回預設狀態
            console.log('履歷狀態: 未初始化');
            return { hasResume: false, status: 'not_created' };
        }
    } catch (error) {
        console.warn('載入履歷狀態失敗:', error);
        return { hasResume: false, status: 'error' };
    }
}

/**
 * 載入企業職缺資料
 */
async function loadEnterpriseJobsData() {
    try {
        if (typeof apiService === 'undefined' || !apiService) {
            console.warn('API服務未初始化，無法載入企業職缺');
            return { success: false, data: [] };
        }
        
        console.log('開始載入企業職缺資料...');
        const result = await apiService.request('student/jobs.php?action=list&limit=5&status=published');
        console.log('企業職缺API回應:', result);
        
        // 確保返回標準格式
        if (result && (result.status === 200 || result.success)) {
            return result;
        } else if (result && result.data) {
            return { success: true, status: 200, data: result.data };
        } else if (Array.isArray(result)) {
            return { success: true, status: 200, data: { jobs: result } };
        }
        
        return { success: false, data: [] };
    } catch (error) {
        console.error('載入企業職缺錯誤:', error);
        return { success: false, data: [] };
    }
}

/**
 * 渲染企業職缺
 */
function renderEnterpriseJobs(jobs) {
    const jobsContainer = document.getElementById('enterprise-jobs');
    if (!jobsContainer) {
        console.warn('找不到企業職缺容器 #enterprise-jobs');
        return;
    }
    
    console.log('開始渲染企業職缺，接收到的數據:', jobs);
    
    jobsContainer.innerHTML = '';
    
    // 確保jobs是陣列，支援多種數據格式
    let jobArray = [];
    if (Array.isArray(jobs)) {
        jobArray = jobs;
    } else if (jobs && jobs.jobs && Array.isArray(jobs.jobs)) {
        jobArray = jobs.jobs;
    } else if (jobs && jobs.data) {
        if (Array.isArray(jobs.data)) {
            jobArray = jobs.data;
        } else if (jobs.data.jobs && Array.isArray(jobs.data.jobs)) {
            jobArray = jobs.data.jobs;
        }
    }
    
    console.log('處理後的職缺陣列:', jobArray);
    
    if (jobArray.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'no-jobs';
        empty.style.cssText = 'text-align: center; padding: 2rem; color: #666;';
        empty.innerHTML = `
            <i class="fas fa-briefcase" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem; display: block;"></i>
            <p style="margin: 0.5rem 0; font-size: 1rem;">暫無職缺</p>
            <small style="color: #999;">目前沒有可用的職缺</small>
        `;
        jobsContainer.appendChild(empty);
        return;
    }
    
    jobArray.forEach(job => {
        const jobItem = document.createElement('div');
        jobItem.className = 'job-item';
        jobItem.style.cssText = 'padding: 12px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;';
        jobItem.style.borderBottom = jobArray.indexOf(job) === jobArray.length - 1 ? 'none' : '1px solid #eee';
        
        jobItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #333;">${job.title || '未命名職缺'}</h4>
                ${job.is_featured ? '<span style="background: #ff6b6b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px;">熱門</span>' : ''}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                <i class="fas fa-building"></i> ${job.company_name || '企業'}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                <i class="fas fa-map-marker-alt"></i> ${job.location || '地點未指定'}
            </div>
            <div style="font-size: 12px; color: #295a8a; font-weight: 500;">
                <i class="fas fa-dollar-sign"></i> ${job.salary_range || '面議'}
            </div>
        `;
        
        // 點擊跳轉到職缺詳情（使用相對路徑，因為dashboard.html和job-detail.html都在student目錄下）
        jobItem.addEventListener('click', function() {
            window.location.href = `job-detail.html?id=${job.id}`;
        });
        
        jobItem.addEventListener('mouseenter', function() {
            this.style.background = '#f5f5f5';
        });
        
        jobItem.addEventListener('mouseleave', function() {
            this.style.background = 'transparent';
        });
        
        jobsContainer.appendChild(jobItem);
    });
    
    // 添加「查看更多」連結（指向搜索頁面，因為沒有專門的職缺列表頁）
    const moreLink = document.createElement('a');
    moreLink.href = 'search.html?type=jobs';
    moreLink.className = 'btn btn-link';
    moreLink.style.cssText = 'display: block; text-align: center; margin-top: 12px; padding: 8px; color: #295a8a; text-decoration: none;';
    moreLink.innerHTML = '<i class="fas fa-arrow-right"></i> 查看更多職缺';
    jobsContainer.appendChild(moreLink);
}

// 全域函數，供 HTML 呼叫
window.loadDashboardData = loadDashboardData;
window.loadResumeStatus = loadResumeStatus;
window.loadEnterpriseJobsData = loadEnterpriseJobsData;