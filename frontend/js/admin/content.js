/**
 * 管理員內容審核 JavaScript
 * 包含審核管理、狀態控制、批量操作等功能
 */

// TODO: 從後端 API 載入審核資料
let reviews = {
    portfolios: [
        {
            id: 1,
            title: '響應式網站設計',
            author: '張小明',
            type: 'web',
            status: 'pending',
            submitted_at: '2024-01-20 14:30',
            description: '使用 HTML5、CSS3 和 JavaScript 製作的現代化響應式網站，支援各種裝置尺寸。',
            skills: ['HTML5', 'CSS3', 'JavaScript', '響應式'],
            image: 'https://via.placeholder.com/400x200/667eea/ffffff?text=Web+Design'
        },
        {
            id: 2,
            title: '行動應用程式',
            author: '李大明',
            type: 'mobile',
            status: 'pending',
            submitted_at: '2024-01-20 12:15',
            description: '使用 React Native 開發的跨平台行動應用程式，提供流暢的使用者體驗。',
            skills: ['React Native', 'JavaScript', 'Firebase', '跨平台'],
            image: 'https://via.placeholder.com/400x200/764ba2/ffffff?text=Mobile+App'
        }
    ],
    jobs: [
        {
            id: 1,
            title: '前端開發實習生',
            enterprise: '台灣微軟',
            type: 'intern',
            status: 'pending',
            submitted_at: '2024-01-20 10:45',
            description: '我們正在尋找對前端開發有熱情的實習生，協助開發公司內部系統和客戶專案。',
            location: '台北市',
            salary: '月薪 30,000-35,000',
            requirements: ['JavaScript', 'React', 'HTML/CSS', 'Git']
        }
    ],
    users: [
        {
            id: 1,
            name: 'Google 台灣',
            type: 'enterprise',
            status: 'pending',
            submitted_at: '2024-01-20 09:30',
            description: 'Google 台灣分公司申請註冊企業帳號，用於招募實習生和正職員工。',
            email: 'hr@google.com.tw',
            website: 'https://careers.google.com',
            company_type: '科技公司',
            company_size: '1000人以上'
        }
    ],
    reports: [
        {
            id: 1,
            type: 'inappropriate',
            reporter: '張小明',
            reported: '李大明',
            status: 'pending',
            submitted_at: '2024-01-20 16:20',
            reason: '作品描述包含不當用語',
            description: '報告李大明作品「行動應用程式」包含不當內容，違反平台規範。',
            details: '作品描述中使用了不適合的語言'
        }
    ]
};

// 當前標籤
let currentTab = 'portfolios';

// 當前篩選條件
let currentFilters = {
    search: '',
    status: '',
    type: '',
    date: ''
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    renderReviews();
    initEventListeners();
    updateStats();
});

// 初始化事件監聽器
function initEventListeners() {
    // 搜尋篩選
    document.getElementById('searchFilter').addEventListener('input', Utils.debounce(function() {
        currentFilters.search = this.value;
        applyFilters();
    }, 300));
    
    // 狀態篩選
    document.getElementById('statusFilter').addEventListener('change', function() {
        currentFilters.status = this.value;
        applyFilters();
    });
    
    // 類型篩選
    document.getElementById('typeFilter').addEventListener('change', function() {
        currentFilters.type = this.value;
        applyFilters();
    });
    
    // 日期篩選
    document.getElementById('dateFilter').addEventListener('change', function() {
        currentFilters.date = this.value;
        applyFilters();
    });
}

// 切換標籤
function switchTab(tabName) {
    currentTab = tabName;
    
    // 更新標籤狀態
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 更新內容區域
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${tabName}Section`).classList.add('active');
    
    // 重新渲染內容
    renderReviews();
}

// 渲染審核項目
function renderReviews() {
    const reviewsToRender = getFilteredReviews();
    
    switch (currentTab) {
        case 'portfolios':
            renderPortfolioReviews(reviewsToRender.portfolios);
            break;
        case 'jobs':
            renderJobReviews(reviewsToRender.jobs);
            break;
        case 'users':
            renderUserReviews(reviewsToRender.users);
            break;
        case 'reports':
            renderReportReviews(reviewsToRender.reports);
            break;
    }
}

// 取得篩選後的審核項目
function getFilteredReviews() {
    let filtered = { ...reviews };
    
    // 搜尋篩選
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        
        filtered.portfolios = filtered.portfolios.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            item.author.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
        
        filtered.jobs = filtered.jobs.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            item.enterprise.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
        
        filtered.users = filtered.users.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
        
        filtered.reports = filtered.reports.filter(item => 
            item.reporter.toLowerCase().includes(searchTerm) ||
            item.reported.toLowerCase().includes(searchTerm) ||
            item.reason.toLowerCase().includes(searchTerm)
        );
    }
    
    // 狀態篩選
    if (currentFilters.status) {
        Object.keys(filtered).forEach(key => {
            filtered[key] = filtered[key].filter(item => item.status === currentFilters.status);
        });
    }
    
    // 類型篩選
    if (currentFilters.type) {
        filtered.portfolios = filtered.portfolios.filter(item => item.type === currentFilters.type);
        filtered.jobs = filtered.jobs.filter(item => item.type === currentFilters.type);
    }
    
    // 日期篩選
    if (currentFilters.date) {
        const today = new Date();
        const filterDate = new Date();
        
        switch (currentFilters.date) {
            case 'today':
                filterDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                filterDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                filterDate.setMonth(today.getMonth() - 1);
                break;
        }
        
        Object.keys(filtered).forEach(key => {
            filtered[key] = filtered[key].filter(item => {
                const submittedDate = new Date(item.submitted_at);
                return submittedDate >= filterDate;
            });
        });
    }
    
    return filtered;
}

// 渲染作品審核
function renderPortfolioReviews(portfolios) {
    const grid = document.getElementById('portfoliosGrid');
    
    if (portfolios.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>沒有待審核的作品</h3>
                <p>所有作品都已審核完成</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = portfolios.map(portfolio => `
        <div class="review-item ${portfolio.status}">
            <div class="review-header">
                <div class="review-info">
                    <h3>${portfolio.title}</h3>
                    <div class="review-meta">
                        <span>作者：${portfolio.author}</span>
                        <span>提交時間：${portfolio.submitted_at}</span>
                    </div>
                </div>
                <span class="review-status status-${portfolio.status}">${getStatusText(portfolio.status)}</span>
            </div>
            <div class="review-content">
                <p class="review-description">${portfolio.description}</p>
                <div class="review-preview">
                    <img src="${portfolio.image}" alt="作品預覽">
                    <p><strong>技能標籤：</strong>${portfolio.skills.join(', ')}</p>
                </div>
            </div>
            <div class="review-actions">
                <button class="action-btn" onclick="viewPortfolio(${portfolio.id})">
                    <i class="fas fa-eye"></i> 查看詳情
                </button>
                <button class="action-btn approve" onclick="approvePortfolio(${portfolio.id})">
                    <i class="fas fa-check"></i> 核准
                </button>
                <button class="action-btn reject" onclick="rejectPortfolio(${portfolio.id})">
                    <i class="fas fa-times"></i> 拒絕
                </button>
            </div>
        </div>
    `).join('');
}

// 渲染職缺審核
function renderJobReviews(jobs) {
    const grid = document.getElementById('jobsGrid');
    
    if (jobs.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-briefcase"></i>
                <h3>沒有待審核的職缺</h3>
                <p>所有職缺都已審核完成</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = jobs.map(job => `
        <div class="review-item ${job.status}">
            <div class="review-header">
                <div class="review-info">
                    <h3>${job.title}</h3>
                    <div class="review-meta">
                        <span>企業：${job.enterprise}</span>
                        <span>提交時間：${job.submitted_at}</span>
                    </div>
                </div>
                <span class="review-status status-${job.status}">${getStatusText(job.status)}</span>
            </div>
            <div class="review-content">
                <p class="review-description">${job.description}</p>
                <div class="review-preview">
                    <p><strong>職缺類型：</strong>${getJobTypeText(job.type)}</p>
                    <p><strong>工作地點：</strong>${job.location}</p>
                    <p><strong>技能要求：</strong>${job.requirements.join(', ')}</p>
                    <p><strong>薪資範圍：</strong>${job.salary}</p>
                </div>
            </div>
            <div class="review-actions">
                <button class="action-btn" onclick="viewJob(${job.id})">
                    <i class="fas fa-eye"></i> 查看詳情
                </button>
                <button class="action-btn approve" onclick="approveJob(${job.id})">
                    <i class="fas fa-check"></i> 核准
                </button>
                <button class="action-btn reject" onclick="rejectJob(${job.id})">
                    <i class="fas fa-times"></i> 拒絕
                </button>
            </div>
        </div>
    `).join('');
}

// 渲染使用者審核
function renderUserReviews(users) {
    const grid = document.getElementById('usersGrid');
    
    if (users.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>沒有待審核的使用者</h3>
                <p>所有使用者都已審核完成</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = users.map(user => `
        <div class="review-item ${user.status}">
            <div class="review-header">
                <div class="review-info">
                    <h3>新${getUserTypeText(user.type)}註冊</h3>
                    <div class="review-meta">
                        <span>${getUserTypeText(user.type)}：${user.name}</span>
                        <span>提交時間：${user.submitted_at}</span>
                    </div>
                </div>
                <span class="review-status status-${user.status}">${getStatusText(user.status)}</span>
            </div>
            <div class="review-content">
                <p class="review-description">${user.description}</p>
                <div class="review-preview">
                    <p><strong>${getUserTypeText(user.type)}類型：</strong>${user.company_type}</p>
                    <p><strong>公司規模：</strong>${user.company_size}</p>
                    <p><strong>聯絡信箱：</strong>${user.email}</p>
                    <p><strong>公司網站：</strong>${user.website}</p>
                </div>
            </div>
            <div class="review-actions">
                <button class="action-btn" onclick="viewUser(${user.id})">
                    <i class="fas fa-eye"></i> 查看詳情
                </button>
                <button class="action-btn approve" onclick="approveUser(${user.id})">
                    <i class="fas fa-check"></i> 核准
                </button>
                <button class="action-btn reject" onclick="rejectUser(${user.id})">
                    <i class="fas fa-times"></i> 拒絕
                </button>
            </div>
        </div>
    `).join('');
}

// 渲染報告處理
function renderReportReviews(reports) {
    const grid = document.getElementById('reportsGrid');
    
    if (reports.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-flag"></i>
                <h3>沒有待處理的報告</h3>
                <p>所有報告都已處理完成</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = reports.map(report => `
        <div class="review-item ${report.status}">
            <div class="review-header">
                <div class="review-info">
                    <h3>${getReportTypeText(report.type)}報告</h3>
                    <div class="review-meta">
                        <span>報告者：${report.reporter}</span>
                        <span>提交時間：${report.submitted_at}</span>
                    </div>
                </div>
                <span class="review-status status-${report.status}">${getStatusText(report.status)}</span>
            </div>
            <div class="review-content">
                <p class="review-description">${report.description}</p>
                <div class="review-preview">
                    <p><strong>報告類型：</strong>${getReportTypeText(report.type)}</p>
                    <p><strong>被報告者：</strong>${report.reported}</p>
                    <p><strong>報告原因：</strong>${report.reason}</p>
                    <p><strong>詳細說明：</strong>${report.details}</p>
                </div>
            </div>
            <div class="review-actions">
                <button class="action-btn" onclick="viewReport(${report.id})">
                    <i class="fas fa-eye"></i> 查看詳情
                </button>
                <button class="action-btn approve" onclick="resolveReport(${report.id})">
                    <i class="fas fa-check"></i> 處理完成
                </button>
                <button class="action-btn reject" onclick="dismissReport(${report.id})">
                    <i class="fas fa-times"></i> 駁回報告
                </button>
            </div>
        </div>
    `).join('');
}

// 取得狀態文字
function getStatusText(status) {
    const statusMap = {
        'pending': '待審核',
        'approved': '已核准',
        'rejected': '已拒絕',
        'resolved': '已處理'
    };
    return statusMap[status] || status;
}

// 取得職缺類型文字
function getJobTypeText(type) {
    const typeMap = {
        'intern': '實習',
        'fulltime': '正職',
        'parttime': '兼職'
    };
    return typeMap[type] || type;
}

// 取得使用者類型文字
function getUserTypeText(type) {
    const typeMap = {
        'student': '學生',
        'enterprise': '企業',
        'admin': '管理員'
    };
    return typeMap[type] || type;
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

// 更新統計資料
function updateStats() {
    const stats = {
        portfolios: reviews.portfolios.filter(p => p.status === 'pending').length,
        jobs: reviews.jobs.filter(j => j.status === 'pending').length,
        users: reviews.users.filter(u => u.status === 'pending').length,
        reports: reviews.reports.filter(r => r.status === 'pending').length
    };
    
    // 更新統計卡片
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = stats.portfolios;
        statNumbers[1].textContent = stats.jobs;
        statNumbers[2].textContent = stats.users;
        statNumbers[3].textContent = stats.reports;
    }
}

// 查看作品詳情
function viewPortfolio(portfolioId) {
    window.location.href = `portfolio-review.html?id=${portfolioId}`;
}

// 核准作品
async function approvePortfolio(portfolioId) {
    try {
        // TODO: 發送核准請求到後端 API
        // await fetch(`/api/admin/portfolios/${portfolioId}/approve`, {
        //     method: 'PUT'
        // });
        
        // 更新本地狀態
        const portfolio = reviews.portfolios.find(p => p.id === portfolioId);
        if (portfolio) {
            portfolio.status = 'approved';
            renderReviews();
            updateStats();
            Utils.showNotification('作品已核准', 'success');
        }
        
    } catch (error) {
        Utils.showNotification('操作失敗，請稍後再試', 'error');
        console.error('核准作品錯誤:', error);
    }
}

// 拒絕作品
async function rejectPortfolio(portfolioId) {
    if (confirm('確定要拒絕這個作品嗎？')) {
        try {
            // TODO: 發送拒絕請求到後端 API
            // await fetch(`/api/admin/portfolios/${portfolioId}/reject`, {
            //     method: 'PUT'
            // });
            
            // 更新本地狀態
            const portfolio = reviews.portfolios.find(p => p.id === portfolioId);
            if (portfolio) {
                portfolio.status = 'rejected';
                renderReviews();
                updateStats();
                Utils.showNotification('作品已拒絕', 'success');
            }
            
        } catch (error) {
            Utils.showNotification('操作失敗，請稍後再試', 'error');
            console.error('拒絕作品錯誤:', error);
        }
    }
}

// 查看職缺詳情
function viewJob(jobId) {
    window.location.href = `job-review.html?id=${jobId}`;
}

// 核准職缺
async function approveJob(jobId) {
    try {
        // TODO: 發送核准請求到後端 API
        // await fetch(`/api/admin/jobs/${jobId}/approve`, {
        //     method: 'PUT'
        // });
        
        // 更新本地狀態
        const job = reviews.jobs.find(j => j.id === jobId);
        if (job) {
            job.status = 'approved';
            renderReviews();
            updateStats();
            Utils.showNotification('職缺已核准', 'success');
        }
        
    } catch (error) {
        Utils.showNotification('操作失敗，請稍後再試', 'error');
        console.error('核准職缺錯誤:', error);
    }
}

// 拒絕職缺
async function rejectJob(jobId) {
    if (confirm('確定要拒絕這個職缺嗎？')) {
        try {
            // TODO: 發送拒絕請求到後端 API
            // await fetch(`/api/admin/jobs/${jobId}/reject`, {
            //     method: 'PUT'
            // });
            
            // 更新本地狀態
            const job = reviews.jobs.find(j => j.id === jobId);
            if (job) {
                job.status = 'rejected';
                renderReviews();
                updateStats();
                Utils.showNotification('職缺已拒絕', 'success');
            }
            
        } catch (error) {
            Utils.showNotification('操作失敗，請稍後再試', 'error');
            console.error('拒絕職缺錯誤:', error);
        }
    }
}

// 查看使用者詳情
function viewUser(userId) {
    window.location.href = `user-review.html?id=${userId}`;
}

// 核准使用者
async function approveUser(userId) {
    try {
        // TODO: 發送核准請求到後端 API
        // await fetch(`/api/admin/users/${userId}/approve`, {
        //     method: 'PUT'
        // });
        
        // 更新本地狀態
        const user = reviews.users.find(u => u.id === userId);
        if (user) {
            user.status = 'approved';
            renderReviews();
            updateStats();
            Utils.showNotification('使用者已核准', 'success');
        }
        
    } catch (error) {
        Utils.showNotification('操作失敗，請稍後再試', 'error');
        console.error('核准使用者錯誤:', error);
    }
}

// 拒絕使用者
async function rejectUser(userId) {
    if (confirm('確定要拒絕這個使用者嗎？')) {
        try {
            // TODO: 發送拒絕請求到後端 API
            // await fetch(`/api/admin/users/${userId}/reject`, {
            //     method: 'PUT'
            // });
            
            // 更新本地狀態
            const user = reviews.users.find(u => u.id === userId);
            if (user) {
                user.status = 'rejected';
                renderReviews();
                updateStats();
                Utils.showNotification('使用者已拒絕', 'success');
            }
            
        } catch (error) {
            Utils.showNotification('操作失敗，請稍後再試', 'error');
            console.error('拒絕使用者錯誤:', error);
        }
    }
}

// 查看報告詳情
function viewReport(reportId) {
    window.location.href = `report-review.html?id=${reportId}`;
}

// 處理報告
async function resolveReport(reportId) {
    try {
        // TODO: 發送處理報告請求到後端 API
        // await fetch(`/api/admin/reports/${reportId}/resolve`, {
        //     method: 'PUT'
        // });
        
        // 更新本地狀態
        const report = reviews.reports.find(r => r.id === reportId);
        if (report) {
            report.status = 'resolved';
            renderReviews();
            updateStats();
            Utils.showNotification('報告已處理完成', 'success');
        }
        
    } catch (error) {
        Utils.showNotification('操作失敗，請稍後再試', 'error');
        console.error('處理報告錯誤:', error);
    }
}

// 駁回報告
async function dismissReport(reportId) {
    if (confirm('確定要駁回這個報告嗎？')) {
        try {
            // TODO: 發送駁回報告請求到後端 API
            // await fetch(`/api/admin/reports/${reportId}/dismiss`, {
            //     method: 'PUT'
            // });
            
            // 更新本地狀態
            const report = reviews.reports.find(r => r.id === reportId);
            if (report) {
                report.status = 'rejected';
                renderReviews();
                updateStats();
                Utils.showNotification('報告已駁回', 'success');
            }
            
        } catch (error) {
            Utils.showNotification('操作失敗，請稍後再試', 'error');
            console.error('駁回報告錯誤:', error);
        }
    }
}

// 應用篩選器
function applyFilters() {
    renderReviews();
}

// 重新整理審核項目
function refreshReviews() {
    // TODO: 從後端 API 重新載入審核資料
    Utils.showNotification('正在重新整理...', 'info');
    
    setTimeout(() => {
        renderReviews();
        updateStats();
        Utils.showNotification('審核項目已更新', 'success');
    }, 1000);
}

// 匯出審核記錄
function exportReviews() {
    try {
        const data = {
            exportDate: new Date().toISOString(),
            filters: currentFilters,
            reviews: {
                portfolios: reviews.portfolios,
                jobs: reviews.jobs,
                users: reviews.users,
                reports: reviews.reports
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reviews-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('審核記錄已匯出', 'success');
    } catch (error) {
        Utils.showNotification('匯出失敗，請稍後再試', 'error');
        console.error('匯出審核記錄錯誤:', error);
    }
}

// 返回上一頁
function goBack() {
    window.history.back();
}

// 全域函數，供 HTML 直接調用
window.switchTab = switchTab;
window.viewPortfolio = viewPortfolio;
window.approvePortfolio = approvePortfolio;
window.rejectPortfolio = rejectPortfolio;
window.viewJob = viewJob;
window.approveJob = approveJob;
window.rejectJob = rejectJob;
window.viewUser = viewUser;
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.viewReport = viewReport;
window.resolveReport = resolveReport;
window.dismissReport = dismissReport;
window.refreshReviews = refreshReviews;
window.exportReviews = exportReviews;
window.goBack = goBack; 