/**
 * 企業職缺管理 JavaScript
 * 包含職缺 CRUD、申請管理、狀態控制等功能
 */

// 透過後端 API 載入職缺資料
let jobs = [];

// 當前編輯的職缺
let currentJob = null;

// 技能要求列表
let requirements = [];

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    await loadJobs();
    renderJobs();
    initEventListeners();
});

// 從後端載入職缺
async function loadJobs(page = 1) {
    try {
        const svc = window.apiService || window.initializeApiService?.();
        if (!svc) throw new Error('API 服務未就緒');
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
            salary: j.salary_range || '',
            duration: '',
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
    document.getElementById('jobFormElement').addEventListener('submit', handleJobSubmit);
    
    // 技能要求輸入
    document.getElementById('requirementInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addRequirement();
        }
    });
}

// 渲染職缺列表
function renderJobs() {
    const jobsList = document.getElementById('jobsList');
    
    if (jobs.length === 0) {
        jobsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-briefcase"></i>
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
                        <span><i class="fas fa-building"></i> ${job.department}</span>
                        <span><i class="fas fa-briefcase"></i> ${job.type}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                        <span><i class="fas fa-users"></i> ${job.applications} 個申請</span>
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
            <div class="job-stats">
                <span><i class="fas fa-calendar"></i> ${job.created_at} 發布</span>
                <span><i class="fas fa-eye"></i> ${job.views} 次瀏覽</span>
                <span><i class="fas fa-heart"></i> ${job.likes} 個收藏</span>
            </div>
            <div class="job-actions">
                <button class="action-btn" onclick="editJob(${job.id})">
                    <i class="fas fa-edit"></i> 編輯
                </button>
                <button class="action-btn" onclick="viewApplications(${job.id})">
                    <i class="fas fa-list"></i> 查看申請
                </button>
                <button class="action-btn" onclick="toggleJobStatus(${job.id})">
                    <i class="fas fa-${job.status === 'active' ? 'pause' : 'play'}"></i> 
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

// 創建新職缺
function createNewJob() {
    currentJob = null;
    requirements = [];
    
    document.getElementById('formTitle').textContent = '發布新職缺';
    document.getElementById('jobFormElement').reset();
    document.getElementById('requirementsList').innerHTML = '';
    
    document.getElementById('jobForm').style.display = 'block';
    
    // 滾動到表單
    document.getElementById('jobForm').scrollIntoView({ behavior: 'smooth' });
}

// 編輯職缺
function editJob(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    currentJob = job;
    requirements = [...job.requirements];
    
    document.getElementById('formTitle').textContent = '編輯職缺';
    document.getElementById('jobId').value = job.id;
    document.getElementById('jobTitle').value = job.title;
    document.getElementById('jobDepartment').value = job.department;
    document.getElementById('jobType').value = job.type;
    document.getElementById('jobLocation').value = job.location;
    document.getElementById('jobDescription').value = job.description;
    document.getElementById('jobSalary').value = job.salary;
    document.getElementById('jobDuration').value = job.duration;
    
    renderRequirements();
    
    document.getElementById('jobForm').style.display = 'block';
    
    // 滾動到表單
    document.getElementById('jobForm').scrollIntoView({ behavior: 'smooth' });
}

// 取消表單
function cancelJobForm() {
    document.getElementById('jobForm').style.display = 'none';
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
        salary: formData.get('salary'),
        duration: formData.get('duration')
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
    const svc = window.apiService || window.initializeApiService?.();
    if (!svc) throw new Error('API 服務未就緒');
    const payload = {
        action: 'create',
        title: jobData.title,
        description: jobData.description,
        requirements: (jobData.requirements || []).join(','),
        job_type: jobData.type,
        location: jobData.location,
        department: jobData.department,
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
    const svc = window.apiService || window.initializeApiService?.();
    if (!svc) throw new Error('API 服務未就緒');
    const payload = {
        action: 'update',
        id: jobId,
        title: jobData.title,
        description: jobData.description,
        requirements: (jobData.requirements || []).join(','),
        job_type: jobData.type,
        location: jobData.location,
        department: jobData.department
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
        const svc = window.apiService || window.initializeApiService?.();
        if (!svc) throw new Error('API 服務未就緒');
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
    window.location.href = `applications.html?job=${jobId}`;
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

// 移除技能要求
function removeRequirement(index) {
    requirements.splice(index, 1);
    renderRequirements();
}

// 渲染技能要求
function renderRequirements() {
    const requirementsList = document.getElementById('requirementsList');
    
    requirementsList.innerHTML = requirements.map((req, index) => `
        <span class="requirement-tag-edit">
            ${req}
            <button type="button" class="remove-requirement" onclick="removeRequirement(${index})">
                <i class="fas fa-times"></i>
            </button>
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
            const svc = window.apiService || window.initializeApiService?.();
            if (!svc) throw new Error('API 服務未就緒');
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