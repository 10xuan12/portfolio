/**
 * 企業儀表板 JavaScript
 * 包含企業統計、人才推薦、作品瀏覽等功能
 */

// TODO: 從後端 API 載入企業儀表板資料
let dashboardData = {
    stats: {
        totalViews: 1234,
        totalLikes: 89,
        totalComments: 23,
        totalStudents: 456,
        totalPortfolios: 789,
        thisMonthViews: 156,
        thisMonthLikes: 12,
        thisMonthComments: 5
    },
    recentPortfolios: [
        {
            id: 1,
            title: '響應式網站設計',
            author: '張小明',
            department: '資訊管理學系',
            category: 'web',
            views: 156,
            likes: 23,
            created_at: '2024-01-15',
            image: 'https://via.placeholder.com/400x200/667eea/ffffff?text=Web+Design'
        },
        {
            id: 2,
            title: '行動應用程式',
            author: '李大明',
            department: '資訊工程學系',
            category: 'mobile',
            views: 203,
            likes: 45,
            created_at: '2024-01-14',
            image: 'https://via.placeholder.com/400x200/764ba2/ffffff?text=Mobile+App'
        },
        {
            id: 3,
            title: 'UI/UX 設計作品',
            author: '王小美',
            department: '設計學系',
            category: 'design',
            views: 89,
            likes: 12,
            created_at: '2024-01-13',
            image: 'https://via.placeholder.com/400x200/f093fb/ffffff?text=UI+Design'
        }
    ],
    recommendedStudents: [
        {
            id: 1,
            name: '張小明',
            department: '資訊管理學系',
            grade: '大學三年級',
            skills: ['JavaScript', 'React', 'Node.js', 'UI/UX Design'],
            avatar: 'https://via.placeholder.com/60x60/667eea/ffffff?text=張',
            matchScore: 95
        },
        {
            id: 2,
            name: '李大明',
            department: '資訊工程學系',
            grade: '大學四年級',
            skills: ['Python', 'Machine Learning', 'Data Analysis'],
            avatar: 'https://via.placeholder.com/60x60/764ba2/ffffff?text=李',
            matchScore: 88
        },
        {
            id: 3,
            name: '王小美',
            department: '設計學系',
            grade: '大學三年級',
            skills: ['Figma', 'Adobe Creative Suite', 'UI/UX Design'],
            avatar: 'https://via.placeholder.com/60x60/f093fb/ffffff?text=王',
            matchScore: 82
        }
    ],
    recentActivities: [
        {
            id: 1,
            type: 'view',
            text: '瀏覽了張小明的作品「響應式網站設計」',
            time: '2 小時前'
        },
        {
            id: 2,
            type: 'like',
            text: '對李大明作品「行動應用程式」表示興趣',
            time: '4 小時前'
        },
        {
            id: 3,
            type: 'contact',
            text: '聯絡了王小美討論實習機會',
            time: '1 天前'
        }
    ],
    jobPostings: [
        {
            id: 1,
            title: '前端開發實習生',
            department: '技術部',
            type: '實習',
            location: '台北市',
            status: 'active',
            applications: 12,
            created_at: '2024-01-10'
        },
        {
            id: 2,
            title: 'UI/UX 設計師',
            department: '設計部',
            type: '正職',
            location: '台北市',
            status: 'active',
            applications: 8,
            created_at: '2024-01-08'
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
        // TODO: 從後端 API 載入企業儀表板資料
        // const response = await fetch('/api/enterprise/dashboard');
        // dashboardData = await response.json();
        
        renderStats();
        renderRecentPortfolios();
        renderRecommendedStudents();
        renderRecentActivities();
        renderJobPostings();
        
        console.log('企業儀表板資料載入完成');
    } catch (error) {
        console.error('載入企業儀表板資料錯誤:', error);
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
    
    // 學生項目點擊
    document.addEventListener('click', function(e) {
        if (e.target.closest('.student-item')) {
            const studentId = e.target.closest('.student-item').dataset.id;
            if (studentId) {
                window.location.href = `student-profile.html?id=${studentId}`;
            }
        }
    });
}

// 渲染統計資料
function renderStats() {
    const stats = dashboardData.stats;
    
    // 更新統計卡片
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 6) {
        statCards[0].querySelector('.number').textContent = Utils.formatNumber(stats.totalViews);
        statCards[1].querySelector('.number').textContent = stats.totalLikes;
        statCards[2].querySelector('.number').textContent = stats.totalComments;
        statCards[3].querySelector('.number').textContent = stats.totalStudents;
        statCards[4].querySelector('.number').textContent = stats.totalPortfolios;
        statCards[5].querySelector('.number').textContent = Utils.formatNumber(stats.thisMonthViews);
    }
}

// 渲染最近作品
function renderRecentPortfolios() {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;
    
    portfolioGrid.innerHTML = dashboardData.recentPortfolios.map(portfolio => `
        <div class="portfolio-item" data-id="${portfolio.id}">
            <div class="portfolio-image">
                <img src="${portfolio.image}" alt="${portfolio.title}">
                <div class="portfolio-overlay">
                    <button class="overlay-btn" onclick="viewPortfolio(${portfolio.id})">
                        <i class="fas fa-eye"></i> 查看
                    </button>
                    <button class="overlay-btn" onclick="contactStudent(${portfolio.id})">
                        <i class="fas fa-envelope"></i> 聯絡
                    </button>
                    <button class="overlay-btn" onclick="likePortfolio(${portfolio.id})">
                        <i class="fas fa-heart"></i> 收藏
                    </button>
                </div>
            </div>
            <div class="portfolio-content">
                <div class="portfolio-header">
                    <h3>${portfolio.title}</h3>
                    <span class="portfolio-category">${getCategoryText(portfolio.category)}</span>
                </div>
                <p class="portfolio-author">${portfolio.author} - ${portfolio.department}</p>
                <div class="portfolio-stats">
                    <span><i class="fas fa-eye"></i> ${portfolio.views}</span>
                    <span><i class="fas fa-heart"></i> ${portfolio.likes}</span>
                    <span><i class="fas fa-calendar"></i> ${portfolio.created_at}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 渲染推薦學生
function renderRecommendedStudents() {
    const studentGrid = document.querySelector('.student-grid');
    if (!studentGrid) return;
    
    studentGrid.innerHTML = dashboardData.recommendedStudents.map(student => `
        <div class="student-item" data-id="${student.id}">
            <div class="student-header">
                <img src="${student.avatar}" alt="${student.name}" class="student-avatar">
                <div class="student-info">
                    <h3>${student.name}</h3>
                    <p>${student.department} - ${student.grade}</p>
                    <div class="match-score">
                        <span class="score">${student.matchScore}%</span>
                        <span class="label">匹配度</span>
                    </div>
                </div>
            </div>
            <div class="student-skills">
                ${student.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <div class="student-actions">
                <button class="btn btn-outline" onclick="viewStudentProfile(${student.id})">
                    <i class="fas fa-user"></i> 查看資料
                </button>
                <button class="btn btn-primary" onclick="contactStudent(${student.id})">
                    <i class="fas fa-envelope"></i> 聯絡
                </button>
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

// 渲染職缺列表
function renderJobPostings() {
    const jobList = document.querySelector('.job-list');
    if (!jobList) return;
    
    jobList.innerHTML = dashboardData.jobPostings.map(job => `
        <div class="job-item">
            <div class="job-header">
                <h3>${job.title}</h3>
                <span class="job-status status-${job.status}">${getJobStatusText(job.status)}</span>
            </div>
            <div class="job-details">
                <span><i class="fas fa-building"></i> ${job.department}</span>
                <span><i class="fas fa-briefcase"></i> ${job.type}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                <span><i class="fas fa-users"></i> ${job.applications} 個申請</span>
            </div>
            <div class="job-actions">
                <button class="btn btn-outline" onclick="editJob(${job.id})">
                    <i class="fas fa-edit"></i> 編輯
                </button>
                <button class="btn btn-outline" onclick="viewApplications(${job.id})">
                    <i class="fas fa-list"></i> 查看申請
                </button>
            </div>
        </div>
    `).join('');
}

// 取得分類文字
function getCategoryText(category) {
    const categoryMap = {
        'web': '網頁設計',
        'mobile': '行動應用',
        'design': 'UI/UX 設計',
        'data': '數據分析',
        'other': '其他'
    };
    return categoryMap[category] || category;
}

// 取得活動圖示
function getActivityIcon(type) {
    const icons = {
        'view': 'fa-eye',
        'like': 'fa-heart',
        'contact': 'fa-envelope',
        'application': 'fa-file-alt'
    };
    return icons[type] || 'fa-info-circle';
}

// 取得職缺狀態文字
function getJobStatusText(status) {
    const statusMap = {
        'active': '招募中',
        'paused': '暫停招募',
        'closed': '已結束'
    };
    return statusMap[status] || status;
}

// 開始即時更新
function startRealTimeUpdates() {
    // TODO: 實作 WebSocket 連接來接收即時通知
    // 例如：當有新作品、新申請時，即時更新儀表板
    
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
        // const response = await fetch('/api/enterprise/notifications/unread-count');
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

// 查看作品詳情
function viewPortfolio(portfolioId) {
    window.location.href = `portfolio-detail.html?id=${portfolioId}`;
}

// 聯絡學生
function contactStudent(studentId) {
    // TODO: 實作聯絡學生功能
    Utils.showNotification('聯絡功能開發中', 'info');
}

// 收藏作品
function likePortfolio(portfolioId) {
    // TODO: 實作收藏作品功能
    Utils.showNotification('收藏功能開發中', 'info');
}

// 查看學生資料
function viewStudentProfile(studentId) {
    window.location.href = `student-profile.html?id=${studentId}`;
}

// 編輯職缺
function editJob(jobId) {
    window.location.href = `job-edit.html?id=${jobId}`;
}

// 查看申請
function viewApplications(jobId) {
    window.location.href = `applications.html?job=${jobId}`;
}

// 重新整理儀表板
function refreshDashboard() {
    loadDashboardData();
    Utils.showNotification('儀表板已重新整理', 'success');
}

// 匯出儀表板資料
function exportDashboardData() {
    try {
        const data = {
            stats: dashboardData.stats,
            portfolios: dashboardData.recentPortfolios,
            students: dashboardData.recommendedStudents,
            activities: dashboardData.recentActivities,
            jobs: dashboardData.jobPostings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enterprise-dashboard-${new Date().toISOString().split('T')[0]}.json`;
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
window.viewPortfolio = viewPortfolio;
window.contactStudent = contactStudent;
window.likePortfolio = likePortfolio;
window.viewStudentProfile = viewStudentProfile;
window.editJob = editJob;
window.viewApplications = viewApplications; 