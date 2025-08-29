/**
 * 企業儀表板 JavaScript
 * 包含企業統計、人才推薦、作品瀏覽等功能
 */

// API 基礎 URL
const API_BASE_URL = '/portfolio/api/enterprise';

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
        
        // 從後端 API 載入企業儀表板資料
        const response = await fetch(`${API_BASE_URL}/dashboard.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'get_dashboard_data'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 200) {
            const dashboardData = result.data;
            renderStats(dashboardData.stats);
            renderRecentPortfolios(dashboardData.recent_portfolios);
            renderRecommendedStudents(dashboardData.recommended_students);
            renderRecentActivities(dashboardData.recent_activities);
            renderJobPostings(dashboardData.job_postings);
            
            // 顯示企業名稱
            const companyNameElement = document.getElementById('company-name');
            if (companyNameElement) {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                companyNameElement.textContent = user.company_name || '企業';
            }
            
            hideLoadingState();
            console.log('企業儀表板資料載入完成');
        } else {
            throw new Error(result.message || '載入資料失敗');
        }
    } catch (error) {
        console.error('載入企業儀表板資料錯誤:', error);
        hideLoadingState();
        showErrorMessage('載入資料失敗，請稍後再試');
        
        // 如果 API 失敗，使用備用的 mock 資料
        loadFallbackData();
    }
}

/**
 * 載入備用資料（當 API 失敗時）
 */
function loadFallbackData() {
    console.log('使用備用資料...');
    const enterpriseId = 1; // 使用測試企業ID
    const dashboardData = {
        stats: {
            total_views: 1250,
            total_favorites: 89,
            total_contacts: 23,
            total_jobs: 5
        },
        recent_portfolios: [
            {
                id: 1,
                title: '電商網站開發',
                student_name: '王小明',
                thumbnail_url: '/portfolio/images/portfolio1.jpg',
                view_count: 156,
                created_at: '2024-01-15'
            },
            {
                id: 2,
                title: '手機APP設計',
                student_name: '李小華',
                thumbnail_url: '/portfolio/images/portfolio2.jpg',
                view_count: 89,
                created_at: '2024-01-10'
            }
        ],
        recommended_students: [
            {
                id: 1,
                name: '王小明',
                major: '資訊管理',
                university: '台灣大學',
                skills: 'JavaScript, React, Node.js',
                avatar_url: '/portfolio/images/avatar1.jpg'
            },
            {
                id: 2,
                name: '李小華',
                major: '資訊工程',
                university: '清華大學',
                skills: 'Python, Django, MySQL',
                avatar_url: '/portfolio/images/avatar2.jpg'
            }
        ],
        recent_activities: [
            {
                id: 1,
                type: 'portfolio_view',
                message: '瀏覽了王小明的最新作品集',
                timestamp: '2024-01-20 14:30:00'
            },
            {
                id: 2,
                type: 'job_application',
                message: '收到新的職缺申請',
                timestamp: '2024-01-20 12:15:00'
            }
        ],
        job_postings: [
            {
                id: 1,
                title: '前端工程師',
                status: 'active',
                applications: 12,
                views: 89
            },
            {
                id: 2,
                title: '後端工程師',
                status: 'active',
                applications: 8,
                views: 67
            }
        ]
    };
    
    renderStats(dashboardData.stats);
    renderRecentPortfolios(dashboardData.recent_portfolios);
    renderRecommendedStudents(dashboardData.recommended_students);
    renderRecentActivities(dashboardData.recent_activities);
    renderJobPostings(dashboardData.job_postings);
}

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
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
}

/**
 * 格式化日期時間
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW');
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