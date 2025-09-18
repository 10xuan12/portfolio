/**
 * 企業儀表板 JavaScript
 * 包含企業統計、人才推薦、作品瀏覽等功能
 */

// 透過全域 apiService 串接後端

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
        showLoadingState();
        const svc = window.apiService || window.initializeApiService?.();
        if (!svc) throw new Error('API 服務未就緒');

        // 並行請求各區塊資料
        const [statsRes, recentPortfoliosRes, recommendedStudentsRes, recentActivitiesRes, jobSummaryRes] = await Promise.all([
            svc.request('enterprise/dashboard.php?action=stats'),
            svc.request('enterprise/dashboard.php?action=recent_portfolios&limit=6'),
            svc.request('enterprise/dashboard.php?action=recommended_students&limit=8'),
            svc.request('enterprise/dashboard.php?action=recent_activities&limit=10'),
            svc.request('enterprise/dashboard.php?action=job_summary&limit=5')
        ]);

        const stats = statsRes?.data || statsRes || {};
        const recentPortfolios = recentPortfoliosRes?.data || recentPortfoliosRes || [];
        const recommendedStudents = recommendedStudentsRes?.data || recommendedStudentsRes || [];
        const recentActivities = recentActivitiesRes?.data || recentActivitiesRes || [];
        const jobs = jobSummaryRes?.data || jobSummaryRes || [];

        renderStats({
            total_views: stats?.portfolios?.total_views ?? 0,
            total_favorites: stats?.portfolios?.total_bookmarks ?? 0,
            total_contacts: stats?.contacts?.total ?? 0,
            total_jobs: stats?.jobs?.total ?? 0
        });
        renderRecentPortfolios(Array.isArray(recentPortfolios) ? recentPortfolios : []);
        renderRecommendedStudents(Array.isArray(recommendedStudents) ? recommendedStudents : []);
        renderRecentActivities(Array.isArray(recentActivities) ? recentActivities : []);
        renderJobPostings(Array.isArray(jobs) ? jobs.map(j => ({
            id: j.id,
            title: j.title,
            status: j.status,
            applications: j.pending_applications ?? j.application_count ?? 0,
            views: j.view_count ?? 0
        })) : []);

        const companyNameElement = document.getElementById('company-name');
        if (companyNameElement) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            companyNameElement.textContent = user.company_name || '企業';
        }

        hideLoadingState();
        console.log('企業儀表板資料載入完成');
    } catch (error) {
        console.error('載入企業儀表板資料錯誤:', error);
        hideLoadingState();
        showErrorMessage('載入資料失敗，請稍後再試');
    }
}

// 已移除本地 mock，統一使用後端 API

/**
 * 顯示載入狀態
 */
function showLoadingState() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    
    // 在統計卡片上顯示載入動畫
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const numberElement = card.querySelector('.stat-number');
        if (numberElement) {
            numberElement.innerHTML = '<div class="loading-spinner"></div>';
        }
    });
}

/**
 * 隱藏載入狀態
 */
function hideLoadingState() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * 顯示錯誤訊息
 */
function showErrorMessage(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                ${message}
            </div>
        `;
        errorContainer.style.display = 'block';
    }
}

/**
 * 設定事件監聽器
 */
function setupEventListeners() {
    // 搜尋按鈕
    const searchBtn = document.querySelector('.btn-primary');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            console.log('執行搜尋...');
            // TODO: 實作搜尋功能
        });
    }
    
    // 篩選選擇器
    const filters = document.querySelectorAll('select');
    filters.forEach(filter => {
        filter.addEventListener('change', function() {
            console.log('篩選條件變更:', this.value);
            // TODO: 實作篩選功能
        });
    });
    
    // 重新整理按鈕
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadDashboardData();
        });
    }
}

/**
 * 渲染統計資料
 */
function renderStats(stats) {
    // 更新統計數字
    const statElements = {
        'total-views': stats.total_views || 0,
        'total-favorites': stats.total_favorites || 0,
        'total-contacts': stats.total_contacts || 0,
        'total-jobs': stats.total_jobs || 0
    };
    
    Object.keys(statElements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = formatNumber(statElements[id]);
        }
    });
}

/**
 * 渲染最近作品
 */
function renderRecentPortfolios(portfolios) {
    const portfolioGrid = document.querySelector('.recent-portfolios');
    if (!portfolioGrid) return;
    
    portfolioGrid.innerHTML = '';
    
    if (portfolios.length === 0) {
        portfolioGrid.innerHTML = '<p class="text-muted">暫無最近瀏覽的作品集</p>';
        return;
    }
    
    portfolios.forEach(portfolio => {
        const portfolioItem = document.createElement('div');
        portfolioItem.className = 'portfolio-item';
        portfolioItem.innerHTML = `
            <div class="portfolio-image">
                <img src="${portfolio.thumbnail_url || '/portfolio/images/default-portfolio.jpg'}" alt="${portfolio.title}">
            </div>
            <div class="portfolio-info">
                <h4>${portfolio.title}</h4>
                <p class="student-name">${portfolio.student_name}</p>
                <div class="portfolio-stats">
                    <span><i class="fas fa-eye"></i> ${formatNumber(portfolio.view_count)}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(portfolio.created_at)}</span>
                </div>
            </div>
        `;
        
        portfolioItem.addEventListener('click', () => {
            window.location.href = `/portfolio/frontend/enterprise/portfolios.html?id=${portfolio.id}`;
        });
        
        portfolioGrid.appendChild(portfolioItem);
    });
}

/**
 * 渲染推薦學生
 */
function renderRecommendedStudents(students) {
    const studentGrid = document.querySelector('.recommended-students');
    if (!studentGrid) return;
    
    studentGrid.innerHTML = '';
    
    if (students.length === 0) {
        studentGrid.innerHTML = '<p class="text-muted">暫無推薦學生</p>';
        return;
    }
    
    students.forEach(student => {
        const studentItem = document.createElement('div');
        studentItem.className = 'student-item';
        studentItem.innerHTML = `
            <div class="student-avatar">
                <img src="${student.avatar_url || '/portfolio/images/default-avatar.jpg'}" alt="${student.name}">
            </div>
            <div class="student-info">
                <h4>${student.name}</h4>
                <p class="student-major">${student.major} - ${student.university}</p>
                <p class="student-skills">${student.skills}</p>
            </div>
            <div class="student-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="viewStudentProfile(${student.id})">
                    查看資料
                </button>
            </div>
        `;
        
        studentGrid.appendChild(studentItem);
    });
}

/**
 * 渲染最近活動
 */
function renderRecentActivities(activities) {
    const activityList = document.querySelector('.recent-activities');
    if (!activityList) return;
    
    activityList.innerHTML = '';
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p class="text-muted">暫無最近活動</p>';
        return;
    }
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.message}</p>
                <small class="text-muted">${formatDateTime(activity.timestamp)}</small>
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

/**
 * 渲染職缺列表
 */
function renderJobPostings(jobs) {
    const jobList = document.querySelector('.job-postings');
    if (!jobList) return;
    
    jobList.innerHTML = '';
    
    if (jobs.length === 0) {
        jobList.innerHTML = '<p class="text-muted">暫無職缺</p>';
        return;
    }
    
    jobs.forEach(job => {
        const jobItem = document.createElement('div');
        jobItem.className = 'job-item';
        jobItem.innerHTML = `
            <div class="job-info">
                <h4>${job.title}</h4>
                <span class="job-status ${job.status}">${getStatusText(job.status)}</span>
            </div>
            <div class="job-stats">
                <span><i class="fas fa-users"></i> ${job.applications} 申請</span>
                <span><i class="fas fa-eye"></i> ${job.views} 瀏覽</span>
            </div>
        `;
        
        jobItem.addEventListener('click', () => {
            window.location.href = `/portfolio/frontend/enterprise/jobs.html?id=${job.id}`;
        });
        
        jobList.appendChild(jobItem);
    });
}

/**
 * 查看學生資料
 */
function viewStudentProfile(studentId) {
    window.location.href = `/portfolio/frontend/enterprise/search.html?student=${studentId}`;
}

/**
 * 格式化數字
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * 格式化日期
 */
function formatDate(dateString) {
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

/**
 * 格式化日期時間
 */
function formatDateTime(dateString) {
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * 取得活動圖示
 */
function getActivityIcon(type) {
    const icons = {
        'portfolio_view': 'fa-eye',
        'job_application': 'fa-file-alt',
        'contact': 'fa-envelope',
        'favorite': 'fa-heart'
    };
    return icons[type] || 'fa-info-circle';
}

/**
 * 取得狀態文字
 */
function getStatusText(status) {
    const statusTexts = {
        'active': '招募中',
        'paused': '暫停',
        'closed': '已結束',
        'draft': '草稿'
    };
    return statusTexts[status] || status;
} 