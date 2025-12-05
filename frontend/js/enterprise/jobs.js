/**
 * 企業職缺管理 JavaScript
 * 包含職缺 CRUD、申請管理、狀態控制等功能
 */

// 透過後端 API 載入職缺資料 - 版本 20251205
let jobs = [];
let filteredJobs = [];
let currentFilter = 'all';

// 當前編輯的職缺
let currentJob = null;

// 技能要求列表
let requirements = [];

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    await loadDepartments();
    await loadJobs();
    renderJobs();
    initEventListeners();
});

// 載入下拉選單選項
async function loadDepartments() {
    // 部門選項
    const departments = [
        '技術部',
        '設計部',
        '行銷部',
        '業務部',
        '人資部',
        '財務部',
        '研發部',
        '客服部',
        '營運部',
        '產品部'
    ];
    
    // 職缺類型
    const jobTypes = [
        '實習',
        '正職',
        '兼職',
        '約聘',
        '契約'
    ];
    
    // 經驗要求
    const experienceLevels = [
        '無經驗',
        '1-3年',
        '3-5年',
        '5-10年',
        '10年以上'
    ];
    
    // 學歷要求
    const educationLevels = [
        '高中',
        '專科',
        '大學',
        '碩士',
        '博士',
        '不拘'
    ];
    
    // 薪資類型
    const salaryTypes = [
        '月薪',
        '年薪',
        '時薪',
        '面議'
    ];
    
    // 載入部門
    const deptSelect = document.getElementById('jobDepartment');
    if (deptSelect) {
        deptSelect.innerHTML = '<option value="">請選擇部門</option>' + 
            departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
    }
    
    // 載入職缺類型
    const typeSelect = document.getElementById('jobType');
    if (typeSelect) {
        typeSelect.innerHTML = '<option value="">請選擇類型</option>' + 
            jobTypes.map(type => `<option value="${type}">${type}</option>`).join('');
    }
    
    // 載入經驗要求
    const expSelect = document.getElementById('experienceLevel');
    if (expSelect) {
        expSelect.innerHTML = '<option value="">請選擇經驗要求</option>' + 
            experienceLevels.map(level => `<option value="${level}">${level}</option>`).join('');
    }
    
    // 載入學歷要求
    const eduSelect = document.getElementById('educationLevel');
    if (eduSelect) {
        eduSelect.innerHTML = '<option value="">請選擇學歷要求</option>' + 
            educationLevels.map(level => `<option value="${level}">${level}</option>`).join('');
    }
    
    // 載入薪資類型
    const salarySelect = document.getElementById('salaryType');
    if (salarySelect) {
        salarySelect.innerHTML = '<option value="">請選擇薪資類型</option>' + 
            salaryTypes.map(type => `<option value="${type}">${type}</option>`).join('');
    }
}

// 從後端載入職缺
async function loadJobs(page = 1) {
    try {
        const svc = await ensureApiServiceReady();
        const params = new URLSearchParams({ action: 'list', page: String(page), limit: '10' });
        const res = await svc.request(`enterprise/jobs.php?${params.toString()}`);
        const data = res?.data || res || {};
        const list = Array.isArray(data.jobs) ? data.jobs : (Array.isArray(data) ? data : []);
        jobs = list.map(j => ({
            id: j.id,
            title: j.title,
            department: j.department || '',
            type: j.job_type || '',
            location: j.location || '',
            description: j.description || '',
            requirements: (j.skills_required || []),
            salary_range: j.salary_range || '',
            salary_min: j.salary_min,
            salary_max: j.salary_max,
            salary_type: j.salary_type,
            benefits: j.benefits || '',
            experience_level: j.experience_level || '',
            education_level: j.education_level || '',
            deadline: j.deadline || '',
            responsibilities: j.responsibilities || '',
            status: j.status,
            applications: j.application_count ?? 0,
            views: j.view_count ?? 0,
            likes: j.bookmark_count ?? 0,
            created_at: (j.created_at || '').split(' ')[0]
        }));
    } catch (e) {
        console.error('載入職缺失敗', e);
        jobs = [];
    }
}

// 初始化事件監聽器
function initEventListeners() {
    // 職缺表單提交
    const form = document.getElementById('jobFormV2');
    if (form) {
        form.addEventListener('submit', handleJobSubmit);
    }
    
    // 技能要求輸入
    const requirementInput = document.getElementById('requirementInput');
    if (requirementInput) {
        requirementInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addRequirement();
            }
        });
    }
}

// 渲染職缺列表（V2 版本）
function renderJobs() {
    const jobsList = document.getElementById('jobsListV2');
    const emptyState = document.getElementById('emptyState');
    
    // 應用篩選
    filteredJobs = jobs.filter(job => {
        if (currentFilter === 'all') return true;
        return job.status === currentFilter;
    });
    
    if (filteredJobs.length === 0) {
        if (jobsList) jobsList.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (jobsList) jobsList.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    
    jobsList.innerHTML = filteredJobs.map(job => `
        <div class="job-card-v2" onclick="editJob(${job.id})">
            <div class="job-card-header">
                <div class="job-card-title-section">
                    <h3 class="job-card-title">${job.title}</h3>
                    <div class="job-card-meta">
                        <span><i class="bi bi-building"></i> ${job.department}</span>
                        <span><i class="bi bi-briefcase"></i> ${job.type}</span>
                        <span><i class="bi bi-geo-alt"></i> ${job.location}</span>
                    </div>
                </div>
                <span class="job-card-status status-${job.status}">
                    ${getJobStatusText(job.status)}
                </span>
            </div>
            
            <p class="job-card-description">${job.description || '暫無描述'}</p>
            
            ${job.requirements && job.requirements.length > 0 ? `
                <div class="job-card-skills">
                    ${job.requirements.slice(0, 4).map(req => 
                        `<span class="skill-tag-v2">${req}</span>`
                    ).join('')}
                    ${job.requirements.length > 4 ? `<span class="skill-tag-v2">+${job.requirements.length - 4}</span>` : ''}
                </div>
            ` : ''}
            
            <div class="job-card-footer">
                <div class="job-card-stats">
                    <span><i class="bi bi-people"></i> ${job.applications}</span>
                    <span><i class="bi bi-eye"></i> ${job.views}</span>
                    <span><i class="bi bi-bookmark"></i> ${job.likes}</span>
                </div>
                <div class="job-card-actions" onclick="event.stopPropagation()">
                    <button class="job-card-btn" onclick="editJob(${job.id})" title="編輯">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="job-card-btn" onclick="toggleJobStatus(${job.id})" title="切換狀態">
                        <i class="bi bi-toggle-${job.status === 'active' ? 'on' : 'off'}"></i>
                    </button>
                    <button class="job-card-btn danger" onclick="deleteJob(${job.id})" title="刪除">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// 舊版渲染函數（保留相容性）
function renderJobsOld() {
    const jobsList = document.getElementById('jobsList');
    
    if (!jobsList) return renderJobs();
    
    if (jobs.length === 0) {
        jobsList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-briefcase"></i>
                <h3>還沒有發布任何職缺</h3>
                <p>點擊「發布新職缺」開始招募人才</p>
            </div>
        `;
        return;
    }
    
    jobsList.innerHTML = jobs.map(job => `
        <div class="job-item">
            <div class="job-header">
                <div>
                    <div class="job-title">${job.title}</div>
                    <div class="job-details">
                        <span><i class="bi bi-building"></i> ${job.department}</span>
                        <span><i class="bi bi-briefcase"></i> ${job.type}</span>
                        <span><i class="bi bi-geo-alt"></i> ${job.location}</span>
                        <span><i class="bi bi-people"></i> ${job.applications} 個申請</span>
                    </div>
                </div>
                <span class="job-status status-${job.status}">${getJobStatusText(job.status)}</span>
            </div>
            <p class="job-description">${job.description}</p>
            <div class="job-requirements">
                <h4>技能要求</h4>
                <div class="requirements-list">
                    ${job.requirements.map(req => `<span class="requirement-tag">${req}</span>`).join('')}
                </div>
            </div>
            <div class="job-details-extended">
                <div class="detail-item">
                    <i class="bi bi-currency-dollar"></i>
                    <span>薪資：${job.salary_range || '面議'}</span>
                </div>
                <div class="detail-item">
                    <i class="bi bi-person-badge"></i>
                    <span>經驗：${job.experience_level || '不拘'}</span>
                </div>
                <div class="detail-item">
                    <i class="bi bi-mortarboard"></i>
                    <span>學歷：${job.education_level || '不拘'}</span>
                </div>
                ${job.deadline ? `<div class="detail-item">
                    <i class="bi bi-clock"></i>
                    <span>截止：${job.deadline}</span>
                </div>` : ''}
            </div>
            <div class="job-stats">
                <span><i class="bi bi-calendar3"></i> ${job.created_at} 發布</span>
                <span><i class="bi bi-eye"></i> ${job.views} 次瀏覽</span>
                <span><i class="bi bi-heart"></i> ${job.likes} 個收藏</span>
            </div>
            <div class="job-actions">
                <button class="action-btn" onclick="editJob(${job.id})">
                    <i class="bi bi-pencil"></i> 編輯
                </button>
                <button class="action-btn" onclick="viewApplications(${job.id})">
                    <i class="bi bi-list-ul"></i> 查看申請
                </button>
                <button class="action-btn ${job.status === 'active' ? '' : 'primary'}" onclick="toggleJobStatus(${job.id})">
                    <i class="bi bi-${job.status === 'active' ? 'pause' : 'play'}"></i> 
                    ${job.status === 'active' ? '暫停招募' : '恢復招募'}
                </button>
            </div>
        </div>
    `).join('');
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

// 顯示職缺表單
function showJobForm() {
    currentJob = null;
    requirements = [];
    
    document.getElementById('formTitle').textContent = '發布新職缺';
    
    // V2 版本
    const formSection = document.getElementById('jobFormSection');
    const formV2 = document.getElementById('jobFormV2');
    
    // 舊版相容
    const jobForm = document.getElementById('jobForm');
    const formElement = document.getElementById('jobFormElement');
    
    if (formSection && formV2) {
        formV2.reset();
        document.getElementById('requirementsList').innerHTML = '';
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (jobForm && formElement) {
        formElement.reset();
        document.getElementById('requirementsList').innerHTML = '';
        jobForm.style.display = 'block';
        jobForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// 創建新職缺
function createNewJob() {
    showJobForm();
}

// 編輯職缺 - 版本 20250927
function editJob(jobId) {
    console.log('editJob called with jobId:', jobId);
    console.log('Available jobs:', jobs);
    console.log('editJob function version: 20250927');
    
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
        console.error('Job not found:', jobId);
        return;
    }
    
    console.log('Found job:', job);
    
    currentJob = job;
    requirements = [...job.requirements];
    
    // 安全地設定表單欄位值
    const setFieldValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value || '';
            console.log(`Set ${id} = ${value || ''}`);
        } else {
            console.warn(`找不到元素: ${id}`);
        }
    };
    
    const setTextContent = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || '';
            console.log(`Set ${id} textContent = ${value || ''}`);
        } else {
            console.warn(`找不到元素: ${id}`);
        }
    };
    
    setTextContent('formTitle', '編輯職缺');
    setFieldValue('jobId', job.id);
    setFieldValue('jobTitle', job.title);
    setFieldValue('jobDepartment', job.department);
    setFieldValue('jobType', job.type);
    setFieldValue('jobLocation', job.location);
    setFieldValue('jobDescription', job.description);
    
    // 薪資相關欄位
    setFieldValue('salaryMin', job.salary_min);
    setFieldValue('salaryMax', job.salary_max);
    setFieldValue('salaryType', job.salary_type);
    setFieldValue('benefits', job.benefits);
    
    // 職位要求欄位
    setFieldValue('experienceLevel', job.experience_level);
    setFieldValue('educationLevel', job.education_level);
    setFieldValue('deadline', job.deadline);
    setFieldValue('responsibilities', job.responsibilities);
    
    renderRequirements();
    
    // 顯示表單（V2 版本）
    const formSection = document.getElementById('jobFormSection');
    const jobForm = document.getElementById('jobForm');
    
    if (formSection) {
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (jobForm) {
        jobForm.style.display = 'block';
        jobForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// 取消表單
function cancelJobForm() {
    hideJobForm();
    currentJob = null;
    requirements = [];
}

// 處理職缺表單提交
async function handleJobSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const jobData = {
        title: formData.get('title'),
        department: formData.get('department'),
        type: formData.get('type'),
        location: formData.get('location'),
        description: formData.get('description'),
        requirements: requirements,
        salary_min: formData.get('salary_min'),
        salary_max: formData.get('salary_max'),
        salary_type: formData.get('salary_type'),
        benefits: formData.get('benefits'),
        experience_level: formData.get('experience_level'),
        education_level: formData.get('education_level'),
        deadline: formData.get('deadline'),
        responsibilities: formData.get('responsibilities')
    };
    
    try {
        if (currentJob) {
            await updateJob(currentJob.id, jobData);
        } else {
            await createJob(jobData);
        }
        
        cancelJobForm();
        await loadJobs();
        renderJobs();
        
    } catch (error) {
        Utils.showNotification('操作失敗，請稍後再試', 'error');
        console.error('職缺操作錯誤:', error);
    }
}

// 創建職缺
async function createJob(jobData) {
    const svc = await ensureApiServiceReady();
    const payload = {
        action: 'create',
        title: jobData.title,
        description: jobData.description,
        requirements: (jobData.requirements || []).join(','),
        responsibilities: jobData.responsibilities,
        job_type: jobData.type,
        location: jobData.location,
        department: jobData.department,
        salary_min: jobData.salary_min ? parseFloat(jobData.salary_min) : null,
        salary_max: jobData.salary_max ? parseFloat(jobData.salary_max) : null,
        salary_type: jobData.salary_type,
        experience_level: jobData.experience_level,
        education_level: jobData.education_level,
        skills_required: (jobData.requirements || []).join(','),
        benefits: jobData.benefits,
        deadline: jobData.deadline,
        status: 'active'
    };
    const res = await svc.request('enterprise/jobs.php', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    if (res?.status === 201 || res?.status === 200) {
        Utils.showNotification('職缺發布成功', 'success');
    } else {
        throw new Error(res?.message || '建立職缺失敗');
    }
}

// 更新職缺
async function updateJob(jobId, jobData) {
    const svc = await ensureApiServiceReady();
    const payload = {
        action: 'update',
        id: jobId,
        title: jobData.title,
        description: jobData.description,
        requirements: (jobData.requirements || []).join(','),
        responsibilities: jobData.responsibilities,
        job_type: jobData.type,
        location: jobData.location,
        department: jobData.department,
        salary_min: jobData.salary_min ? parseFloat(jobData.salary_min) : null,
        salary_max: jobData.salary_max ? parseFloat(jobData.salary_max) : null,
        salary_type: jobData.salary_type,
        experience_level: jobData.experience_level,
        education_level: jobData.education_level,
        skills_required: (jobData.requirements || []).join(','),
        benefits: jobData.benefits,
        deadline: jobData.deadline
    };
    const res = await svc.request('enterprise/jobs.php', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    if (res?.status === 200) {
        Utils.showNotification('職缺更新成功', 'success');
    } else {
        throw new Error(res?.message || '更新職缺失敗');
    }
}

// 切換職缺狀態
async function toggleJobStatus(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const newStatus = job.status === 'active' ? 'paused' : 'active';
    
    try {
        const svc = await ensureApiServiceReady();
        const res = await svc.request('enterprise/jobs.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'toggle_status', id: jobId, status: newStatus })
        });
        if (res?.status !== 200) throw new Error(res?.message || '更新狀態失敗');
        job.status = newStatus;
        renderJobs();
        Utils.showNotification(`職缺已${newStatus === 'active' ? '恢復招募' : '暫停招募'}`, 'success');
    } catch (error) {
        Utils.showNotification('狀態更新失敗，請稍後再試', 'error');
        console.error('更新職缺狀態錯誤:', error);
    }
}

// 查看申請
function viewApplications(jobId) {
    // 跳轉到專門的申請管理頁面
    window.location.href = `job_application.html?job_id=${jobId}`;
}


// 新增技能要求
function addRequirement() {
    const input = document.getElementById('requirementInput');
    const requirement = input.value.trim();
    
    if (requirement && !requirements.includes(requirement)) {
        requirements.push(requirement);
        renderRequirements();
        input.value = '';
    }
}

// 移除技能要求（支援兩種調用方式）
function removeRequirement(indexOrReq) {
    if (typeof indexOrReq === 'number') {
        // 舊版：使用索引
        requirements.splice(indexOrReq, 1);
    } else {
        // V2版：使用字串
        requirements = requirements.filter(r => r !== indexOrReq);
    }
    renderRequirements();
}

// 渲染技能要求（V2 版本）
function renderRequirements() {
    const requirementsList = document.getElementById('requirementsList');
    if (!requirementsList) return;
    
    requirementsList.innerHTML = requirements.map(req => `
        <span class="skill-tag-edit">
            ${req}
            <button type="button" class="remove-skill" onclick="removeRequirement('${req}')">×</button>
        </span>
    `).join('');
}

// 匯出職缺資料
function exportJobs() {
    try {
        const data = {
            exportDate: new Date().toISOString(),
            jobs: jobs.map(job => ({
                id: job.id,
                title: job.title,
                department: job.department,
                type: job.type,
                location: job.location,
                description: job.description,
                requirements: job.requirements,
                salary: job.salary,
                duration: job.duration,
                status: job.status,
                stats: {
                    applications: job.applications,
                    views: job.views,
                    likes: job.likes
                },
                created_at: job.created_at
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jobs-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('職缺資料已匯出', 'success');
    } catch (error) {
        Utils.showNotification('匯出失敗，請稍後再試', 'error');
        console.error('匯出職缺資料錯誤:', error);
    }
}

// 刪除職缺
function deleteJob(jobId) {
    if (confirm('確定要刪除這個職缺嗎？此操作無法復原。')) {
        try {
            ensureApiServiceReady().then((svc) => {
            svc.request('enterprise/jobs.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'delete', id: jobId })
            }).then(async (res) => {
                if (res?.status !== 200) throw new Error(res?.message || '刪除失敗');
                await loadJobs();
                renderJobs();
                Utils.showNotification('職缺已刪除', 'success');
            }).catch((e) => {
                Utils.showNotification('刪除失敗，請稍後再試', 'error');
                console.error('刪除職缺錯誤:', e);
            });
            }).catch((e) => {
                Utils.showNotification('API 服務未就緒', 'error');
                console.error(e);
            });
        } catch (error) {
            Utils.showNotification('刪除失敗，請稍後再試', 'error');
            console.error('刪除職缺錯誤:', error);
        }
    }
}

// 複製職缺
function duplicateJob(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const duplicatedJob = {
        ...job,
        id: Date.now(),
        title: `${job.title} (複製)`,
        status: 'active',
        applications: 0,
        views: 0,
        likes: 0,
        created_at: new Date().toISOString().split('T')[0]
    };
    
    jobs.unshift(duplicatedJob);
    renderJobs();
    Utils.showNotification('職缺已複製', 'success');
}

// 全域函數，供 HTML 直接調用
window.createNewJob = createNewJob;
window.editJob = editJob;
window.cancelJobForm = cancelJobForm;
window.toggleJobStatus = toggleJobStatus;
window.viewApplications = viewApplications;
window.addRequirement = addRequirement;
window.removeRequirement = removeRequirement;
window.exportJobs = exportJobs;
window.deleteJob = deleteJob;
window.duplicateJob = duplicateJob; 

// 確保 API 服務就緒（帶重試）
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

// ==========================================
// V2 版本新增功能
// ==========================================

// 隱藏職缺表單
function hideJobForm() {
    const formSection = document.getElementById('jobFormSection');
    const jobForm = document.getElementById('jobForm');
    
    if (formSection) {
        formSection.style.display = 'none';
    } else if (jobForm) {
        jobForm.style.display = 'none';
    }
    
    currentJob = null;
    requirements = [];
}

// 篩選職缺
function filterJobs(status) {
    currentFilter = status;
    
    // 更新標籤樣式
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.status === status) {
            tab.classList.add('active');
        }
    });
    
    renderJobs();
}

// 搜尋職缺
function searchJobs() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        filteredJobs = jobs.filter(job => {
            if (currentFilter === 'all') return true;
            return job.status === currentFilter;
        });
    } else {
        filteredJobs = jobs.filter(job => {
            const matchesFilter = currentFilter === 'all' || job.status === currentFilter;
            const matchesSearch = 
                job.title.toLowerCase().includes(searchTerm) ||
                (job.description && job.description.toLowerCase().includes(searchTerm)) ||
                (job.requirements && job.requirements.some(r => r.toLowerCase().includes(searchTerm)));
            
            return matchesFilter && matchesSearch;
        });
    }
    
    renderJobs();
}

// 排序職缺
function sortJobs() {
    const sortBy = document.getElementById('sortSelect').value;
    
    switch(sortBy) {
        case 'newest':
            filteredJobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            filteredJobs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'applications':
            filteredJobs.sort((a, b) => (b.applications || 0) - (a.applications || 0));
            break;
        case 'views':
            filteredJobs.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
    }
    
    renderJobs();
}

// 重新整理職缺
async function refreshJobs() {
    await loadJobs();
    renderJobs();
    if (typeof Utils !== 'undefined' && Utils.showNotification) {
        Utils.showNotification('職缺列表已更新', 'success');
    }
}


// 全域函數註冊（V2）
window.showJobForm = showJobForm;
window.hideJobForm = hideJobForm;
window.filterJobs = filterJobs;
window.searchJobs = searchJobs;
window.sortJobs = sortJobs;
window.refreshJobs = refreshJobs;