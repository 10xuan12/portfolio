/**
 * 企業儀表板 JavaScript
 * 包含企業統計、人才推薦、作品瀏覽等功能
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
        // TODO: 從後端 API 載入企業儀表板資料
        // const response = await fetch('/api/enterprise/dashboard');
        // dashboardData = await response.json();
        
        // 使用統一假資料
        const enterpriseId = 101; // 假設當前企業ID為101
        const dashboardData = {
            stats: MockData.stats.enterprise,
            recentPortfolios: MockData.portfolios.slice(0, 3),
            recommendedStudents: MockData.users.students,
            recentActivities: MockData.activities,
            jobPostings: MockData.jobs.filter(job => job.company_id === enterpriseId)
        };
        
        renderStats(dashboardData.stats);
        renderRecentPortfolios(dashboardData.recentPortfolios);
        renderRecommendedStudents(dashboardData.recommendedStudents);
        renderRecentActivities(dashboardData.recentActivities);
        renderJobPostings(dashboardData.jobPostings);
        
        console.log('企業儀表板資料載入完成');
    } catch (error) {
        console.error('載入企業儀表板資料錯誤:', error);
        Utils.showNotification('載入資料失敗，請稍後再試', 'error');
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
}

/**
 * 渲染統計資料
 */
function renderStats(stats) {
    // 更新統計數字
    const statElements = {
        'total-views': stats.total_views,
        'total-favorites': stats.total_favorites,
        'total-contacts': stats.total_contacts,
        'total-jobs': stats.total_jobs
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
    const portfolioGrid = document.querySelector('.recent-portfolios');
    if (!portfolioGrid) return;
    
    portfolioGrid.innerHTML = '';
    
    portfolios.forEach(portfolio => {
        const portfolioItem = document.createElement('div');
        portfolioItem.className = 'portfolio-item';
        portfolioItem.innerHTML = `
            <div class="portfolio-image">
                <img src="${portfolio.image}" alt="${portfolio.title}">
            </div>
            <div class="portfolio-content">
                <h4>${portfolio.title}</h4>
                <p>${portfolio.author_name} • ${portfolio.department}</p>
                <div class="portfolio-stats">
                    <span><i class="fas fa-eye"></i> ${MockData.formatNumber(portfolio.views)}</span>
                    <span><i class="fas fa-heart"></i> ${MockData.formatNumber(portfolio.likes)}</span>
                </div>
            </div>
        `;
        portfolioGrid.appendChild(portfolioItem);
    });
}

/**
 * 渲染推薦人才
 */
function renderRecommendedStudents(students) {
    const candidateGrid = document.querySelector('.candidate-grid');
    if (!candidateGrid) return;
    
    candidateGrid.innerHTML = '';
    
    students.forEach(student => {
        const candidateCard = document.createElement('div');
        candidateCard.className = 'candidate-card';
        candidateCard.innerHTML = `
            <div class="candidate-header">
                <div class="candidate-avatar">${student.avatar}</div>
                <div class="candidate-info">
                    <h3>${student.name}</h3>
                    <p>${student.department} • ${student.grade}</p>
                </div>
            </div>
            <div class="candidate-skills">
                ${student.skills.slice(0, 4).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <p style="font-size: var(--text-sm); color: var(--gray-600); margin-bottom: var(--spacing-md);">
                ${student.summary}
            </p>
            <div class="candidate-stats">
                <span><i class="fas fa-eye"></i> ${MockData.formatNumber(Math.floor(Math.random() * 200) + 50)} 次瀏覽</span>
                <span><i class="fas fa-heart"></i> ${MockData.formatNumber(Math.floor(Math.random() * 50) + 5)} 個讚</span>
            </div>
        `;
        candidateGrid.appendChild(candidateCard);
    });
}

/**
 * 渲染最近活動
 */
function renderRecentActivities(activities) {
    const activitiesList = document.querySelector('.recent-activities');
    if (!activitiesList) return;
    
    activitiesList.innerHTML = '';
    
    activities.slice(0, 5).forEach(activity => {
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
 * 渲染職缺發布
 */
function renderJobPostings(jobs) {
    const jobList = document.querySelector('.job-postings');
    if (!jobList) return;
    
    jobList.innerHTML = '';
    
    jobs.forEach(job => {
        const jobItem = document.createElement('div');
        jobItem.className = 'job-item';
        jobItem.innerHTML = `
            <div class="job-header">
                <h4>${job.title}</h4>
                <span class="job-status ${job.status}">${getJobStatusText(job.status)}</span>
            </div>
            <div class="job-content">
                <p>${job.description}</p>
                <div class="job-details">
                    <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    <span><i class="fas fa-money-bill-wave"></i> ${job.salary_range}</span>
                    <span><i class="fas fa-users"></i> ${job.applications} 人申請</span>
                </div>
            </div>
        `;
        jobList.appendChild(jobItem);
    });
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
 * 取得職缺狀態文字
 */
function getJobStatusText(status) {
    const statusMap = {
        'active': '招募中',
        'closed': '已結束',
        'draft': '草稿'
    };
    return statusMap[status] || status;
}

/**
 * 搜尋人才
 */
function searchCandidates(keyword, filters = {}) {
    // TODO: 實作搜尋功能
    console.log('搜尋人才:', keyword, filters);
    
    // 使用統一假資料進行搜尋
    const results = MockData.searchUsers(keyword, filters);
    renderRecommendedStudents(results);
}

/**
 * 篩選人才
 */
function filterCandidates(filters) {
    // TODO: 實作篩選功能
    console.log('篩選人才:', filters);
    
    const results = MockData.searchUsers('', filters);
    renderRecommendedStudents(results);
}

// 全域函數，供 HTML 呼叫
window.loadDashboardData = loadDashboardData;
window.searchCandidates = searchCandidates;
window.filterCandidates = filterCandidates; 