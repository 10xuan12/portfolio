/**
 * 職缺申請管理 JavaScript
 * 包含申請列表、篩選、狀態管理、統計等功能
 */

// 全域變數
let applications = [];
let jobs = [];
let currentPage = 1;
let totalPages = 1;
let currentView = 'list';
let currentFilters = {
    jobId: '',
    status: ''
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    // 檢查是否有職缺ID參數
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job_id');
    if (jobId) {
        currentFilters.jobId = jobId;
    }
    
    await loadJobs();
    await loadApplications();
    renderApplications();
    updateStats();
    initEventListeners();
    
    // 如果有職缺ID參數，設定篩選器
    if (jobId) {
        document.getElementById('jobFilter').value = jobId;
    }
});

// 初始化事件監聽器
function initEventListeners() {
    // 篩選器事件
    document.getElementById('jobFilter').addEventListener('change', handleJobFilter);
    document.getElementById('statusFilter').addEventListener('change', handleStatusFilter);
}

// 載入職缺列表
async function loadJobs() {
    try {
        const svc = await ensureApiServiceReady();
        const params = new URLSearchParams({ action: 'list', page: '1', limit: '100' });
        const res = await svc.request(`enterprise/jobs.php?${params.toString()}`);
        const data = res?.data || res || {};
        jobs = Array.isArray(data.jobs) ? data.jobs : (Array.isArray(data) ? data : []);
        
        // 更新職缺篩選器
        updateJobFilter();
        
    } catch (error) {
        console.error('載入職缺列表失敗:', error);
        jobs = [];
    }
}

// 更新職缺篩選器
function updateJobFilter() {
    const jobFilter = document.getElementById('jobFilter');
    jobFilter.innerHTML = '<option value="">所有職缺</option>';
    
    jobs.forEach(job => {
        const option = document.createElement('option');
        option.value = job.id;
        option.textContent = job.title;
        jobFilter.appendChild(option);
    });
}

// 載入申請列表
async function loadApplications(page = 1) {
    try {
        const svc = await ensureApiServiceReady();
        const params = new URLSearchParams({ 
            action: 'applications',
            page: String(page),
            limit: '20'
        });
        
        // 添加篩選條件
        if (currentFilters.jobId) {
            params.set('job_id', currentFilters.jobId);
        }
        if (currentFilters.status) {
            params.set('status', currentFilters.status);
        }
        
        const res = await svc.request(`enterprise/jobs.php?${params.toString()}`);
        const data = res?.data || res || {};
        
        if (Array.isArray(data)) {
            applications = data;
        } else if (data.applications) {
            applications = data.applications;
            totalPages = data.pagination?.pages || 1;
        } else {
            applications = [];
        }
        
        currentPage = page;
        
    } catch (error) {
        console.error('載入申請列表失敗:', error);
        applications = [];
    }
}

// 渲染申請列表
function renderApplications() {
    const applicationsList = document.getElementById('applicationsList');
    
    if (applications.length === 0) {
        applicationsList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-person-x"></i>
                <h3>沒有找到申請</h3>
                <p>目前沒有符合條件的申請記錄</p>
            </div>
        `;
        return;
    }
    
    const viewClass = currentView === 'grid' ? 'grid-view' : '';
    applicationsList.className = `applications-list ${viewClass}`;
    
    applicationsList.innerHTML = applications.map(app => `
        <div class="application-item" data-id="${app.id}">
            <div class="application-header">
                <div class="applicant-info">
                    <div class="applicant-avatar">
                        ${app.avatar_url ? 
                            `<img src="${app.avatar_url}" alt="${app.student_name}">` : 
                            `<i class="bi bi-person-circle"></i>`
                        }
                    </div>
                    <div class="applicant-details">
                        <h4 class="applicant-name">${app.student_name}</h4>
                        <p class="applicant-major">${app.major} - ${app.school || '未知學校'}</p>
                        <p class="applicant-grade">${app.grade}</p>
                    </div>
                </div>
                <div class="application-status">
                    <span class="status-badge status-${app.status}">${getApplicationStatusText(app.status)}</span>
                    <p class="application-date">${formatDate(app.created_at)}</p>
                </div>
            </div>
            
            <div class="application-content">
                ${app.cover_letter ? `
                    <div class="cover-letter">
                        <h5>求職信</h5>
                        <p>${app.cover_letter}</p>
                    </div>
                ` : ''}
                
                <div class="application-skills">
                    <h5>技能</h5>
                    <div class="skills-list">
                        ${(app.skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                
                ${app.expected_salary ? `
                    <div class="expected-salary">
                        <h5>期望薪資</h5>
                        <p>${app.expected_salary}</p>
                    </div>
                ` : ''}
                
                ${app.available_date ? `
                    <div class="available-date">
                        <h5>可開始日期</h5>
                        <p>${app.available_date}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="application-actions">
                <button class="action-btn" onclick="viewStudentProfile(${app.student_id})">
                    <i class="bi bi-person"></i> 查看個人檔案
                </button>
                ${app.portfolio_url ? `
                    <a href="${app.portfolio_url}" target="_blank" class="action-btn">
                        <i class="bi bi-briefcase"></i> 查看作品集
                    </a>
                ` : ''}
                <button class="action-btn primary" onclick="updateApplicationStatus(${app.id}, 'accepted')">
                    <i class="bi bi-check"></i> 錄取
                </button>
                <button class="action-btn danger" onclick="updateApplicationStatus(${app.id}, 'rejected')">
                    <i class="bi bi-x"></i> 拒絕
                </button>
            </div>
        </div>
    `).join('');
    
    renderPagination();
}

// 渲染分頁
function renderPagination() {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 上一頁按鈕
    paginationHTML += `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
                onclick="changePage(${currentPage - 1})">
            <i class="bi bi-chevron-left"></i>
        </button>
    `;
    
    // 頁碼按鈕
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<span class="pagination-ellipsis">...</span>';
        }
    }
    
    // 下一頁按鈕
    paginationHTML += `
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="changePage(${currentPage + 1})">
            <i class="bi bi-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

// 切換頁面
async function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    await loadApplications(page);
    renderApplications();
    updateStats();
    
    // 滾動到頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 切換視圖
function switchView(view) {
    currentView = view;
    
    // 更新按鈕狀態
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    renderApplications();
}

// 處理職缺篩選
async function handleJobFilter(e) {
    currentFilters.jobId = e.target.value;
    await loadApplications(1);
    renderApplications();
    updateStats();
}

// 處理狀態篩選
async function handleStatusFilter(e) {
    currentFilters.status = e.target.value;
    await loadApplications(1);
    renderApplications();
    updateStats();
}

// 更新統計數據
function updateStats() {
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'pending').length;
    const accepted = applications.filter(app => app.status === 'accepted').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    
    document.getElementById('totalApplications').textContent = total;
    document.getElementById('pendingApplications').textContent = pending;
    document.getElementById('acceptedApplications').textContent = accepted;
    document.getElementById('rejectedApplications').textContent = rejected;
}

// 查看申請詳情
function viewApplicationDetail(applicationId) {
    const application = applications.find(app => app.id === applicationId);
    if (!application) return;
    
    const modal = document.getElementById('applicationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `${application.student_name} - 申請詳情`;
    
    modalBody.innerHTML = `
        <div class="application-detail">
            <div class="detail-section">
                <h4>申請者資訊</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>姓名</label>
                        <span>${application.student_name}</span>
                    </div>
                    <div class="detail-item">
                        <label>科系</label>
                        <span>${application.major}</span>
                    </div>
                    <div class="detail-item">
                        <label>學校</label>
                        <span>${application.school || '未知'}</span>
                    </div>
                    <div class="detail-item">
                        <label>年級</label>
                        <span>${application.grade}</span>
                    </div>
                    <div class="detail-item">
                        <label>申請狀態</label>
                        <span class="status-badge status-${application.status}">${getApplicationStatusText(application.status)}</span>
                    </div>
                    <div class="detail-item">
                        <label>申請日期</label>
                        <span>${formatDate(application.created_at)}</span>
                    </div>
                </div>
            </div>
            
            ${application.cover_letter ? `
                <div class="detail-section">
                    <h4>求職信</h4>
                    <div class="cover-letter-content">
                        ${application.cover_letter}
                    </div>
                </div>
            ` : ''}
            
            <div class="detail-section">
                <h4>技能</h4>
                <div class="skills-list">
                    ${(application.skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
            
            ${application.expected_salary ? `
                <div class="detail-section">
                    <h4>期望薪資</h4>
                    <p>${application.expected_salary}</p>
                </div>
            ` : ''}
            
            ${application.available_date ? `
                <div class="detail-section">
                    <h4>可開始日期</h4>
                    <p>${application.available_date}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.classList.add('show');
}

// 關閉模態框
function closeModal() {
    const modal = document.getElementById('applicationModal');
    modal.classList.remove('show');
}

// 更新申請狀態
async function updateApplicationStatus(applicationId, status) {
    const statusText = getApplicationStatusText(status);
    
    if (!confirm(`確定要將此申請${statusText}嗎？`)) {
        return;
    }
    
    try {
        const svc = await ensureApiServiceReady();
        const res = await svc.request('enterprise/jobs.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'update_application',
                application_id: applicationId,
                status: status
            })
        });
        
        if (res?.status === 200) {
            Utils.showNotification(`申請已${statusText}`, 'success');
            await loadApplications(currentPage);
            renderApplications();
            updateStats();
        } else {
            throw new Error(res?.message || '更新申請狀態失敗');
        }
        
    } catch (error) {
        Utils.showNotification('更新申請狀態失敗', 'error');
        console.error('更新申請狀態錯誤:', error);
    }
}

// 查看學生履歷
function viewStudentProfile(studentId) {
    window.open(`student-profile.html?id=${studentId}`, '_blank');
}

// 匯出申請資料
function exportApplications() {
    try {
        const data = {
            exportDate: new Date().toISOString(),
            applications: applications.map(app => ({
                id: app.id,
                student_name: app.student_name,
                major: app.major,
                school: app.school,
                grade: app.grade,
                status: app.status,
                cover_letter: app.cover_letter,
                skills: app.skills,
                expected_salary: app.expected_salary,
                available_date: app.available_date,
                created_at: app.created_at
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applications-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('申請資料已匯出', 'success');
    } catch (error) {
        Utils.showNotification('匯出失敗，請稍後再試', 'error');
        console.error('匯出申請資料錯誤:', error);
    }
}

// 取得申請狀態文字
function getApplicationStatusText(status) {
    const statusMap = {
        'pending': '待審核',
        'reviewed': '已審核',
        'interviewed': '已面試',
        'accepted': '已錄取',
        'rejected': '已拒絕'
    };
    return statusMap[status] || status;
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
}

// 確保 API 服務就緒
async function ensureApiServiceReady(maxRetries = 10, delayMs = 100) {
    if (window.apiService) return window.apiService;
    if (typeof window.initializeApiService === 'function') {
        try { window.initializeApiService(); } catch (_) {}
    }
    for (let i = 0; i < maxRetries; i++) {
        if (window.apiService) return window.apiService;
        await new Promise(r => setTimeout(r, delayMs));
    }
    if (!window.apiService && typeof window.ApiService === 'function') {
        try { window.apiService = new window.ApiService(); return window.apiService; } catch (_) {}
    }
    throw new Error('API 服務未就緒');
}
