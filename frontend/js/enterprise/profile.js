/**
 * 企業資料管理 JavaScript
 * 包含資料編輯、表單驗證、檔案上傳等功能
 */

// 企業資料（可從後端 API 載入：/api/enterprise/profile?action=get）
let enterpriseData = { id: null, name: '', type: '', size: '', industry: '', email: '', phone: '', website: '', address: '', description: '', hrName: '', hrEmail: '', hrPhone: '', recruitmentProcess: '', benefits: '', logo: '', stats: { jobs: 0, applications: 0, views: 0, contacts: 0 } };

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    loadEnterpriseData();
    initEventListeners();
    loadRecentActivities();
});

// 初始化事件監聽器
function initEventListeners() {
    // 表單驗證
    document.getElementById('profileForm').addEventListener('input', function() {
        validateForm();
    });
    
    // 自動儲存
    let saveTimeout;
    document.getElementById('profileForm').addEventListener('input', function() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(autoSave, 2000);
    });
}

// 載入企業資料
async function loadEnterpriseData() {
    try {
        const svc = await ensureApiServiceReady();
        const res = await svc.request('enterprise/profile.php?action=get');
        const data = res?.data || res || {};
        enterpriseData = {
            id: data.id,
            name: data.company_name || '',
            type: data.company_type || '',
            size: data.company_size || '',
            industry: data.industry || '',
            email: data.contact_email || data.email || '',
            phone: data.phone || '',
            website: data.website || '',
            address: data.address || '',
            description: data.description || '',
            hrName: data.contact_person || '',
            hrEmail: data.contact_email || '',
            hrPhone: '',
            recruitmentProcess: '',
            benefits: data.benefits_description || '',
            logo: data.logo_url || '',
            stats: data.stats || { jobs: 0, applications: 0, views: 0, contacts: 0 }
        };
        populateForm();
        updateStats();
        console.log('企業資料載入完成');
    } catch (error) {
        console.error('載入企業資料錯誤:', error);
        Utils.showNotification('載入資料失敗，請稍後再試', 'error');
    }
}

// 填充表單資料
function populateForm() {
    document.getElementById('companyName').value = enterpriseData.name;
    document.getElementById('companyType').value = enterpriseData.type;
    document.getElementById('companySize').value = enterpriseData.size;
    document.getElementById('companyIndustry').value = enterpriseData.industry;
    document.getElementById('companyEmail').value = enterpriseData.email;
    document.getElementById('companyPhone').value = enterpriseData.phone;
    document.getElementById('companyWebsite').value = enterpriseData.website;
    document.getElementById('companyAddress').value = enterpriseData.address;
    document.getElementById('companyDescription').value = enterpriseData.description;
    document.getElementById('hrName').value = enterpriseData.hrName;
    document.getElementById('hrEmail').value = enterpriseData.hrEmail;
    document.getElementById('hrPhone').value = enterpriseData.hrPhone;
    document.getElementById('recruitmentProcess').value = enterpriseData.recruitmentProcess;
    document.getElementById('benefits').value = enterpriseData.benefits;
    
    // 更新標誌
    if (enterpriseData.logo) {
        document.getElementById('logoImage').src = enterpriseData.logo;
    }
}

// 更新統計資料
function updateStats() {
    const stats = enterpriseData.stats || { jobs: 0, applications: 0, views: 0, contacts: 0 };
    
    // 儀表卡樣式（例如 dashboard 用）
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers && statNumbers.length >= 4) {
        statNumbers[0].textContent = stats.jobs;
        statNumbers[1].textContent = stats.applications;
        statNumbers[2].textContent = stats.views;
        statNumbers[3].textContent = stats.contacts;
    }
    
    // profile.html 側邊欄統計（.profile-stats .number 順序：發布職缺、收到申請、瀏覽次數、聯絡學生）
    const profileStatNumbers = document.querySelectorAll('.profile-stats .number');
    if (profileStatNumbers && profileStatNumbers.length >= 4) {
        profileStatNumbers[0].textContent = String(stats.jobs || 0);
        profileStatNumbers[1].textContent = String(stats.applications || 0);
        profileStatNumbers[2].textContent = String(stats.views || 0);
        profileStatNumbers[3].textContent = String(stats.contacts || 0);
    }
}

// 表單驗證
function validateForm() {
    const form = document.getElementById('profileForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = 'var(--error-color)';
            isValid = false;
        } else {
            field.style.borderColor = 'var(--gray-200)';
        }
    });
    
    // 驗證信箱格式
    const emailField = document.getElementById('companyEmail');
    if (emailField.value && !isValidEmail(emailField.value)) {
        emailField.style.borderColor = 'var(--error-color)';
        isValid = false;
    }
    
    // 驗證網站格式
    const websiteField = document.getElementById('companyWebsite');
    if (websiteField.value && !isValidUrl(websiteField.value)) {
        websiteField.style.borderColor = 'var(--error-color)';
        isValid = false;
    }
    
    return isValid;
}

// 驗證信箱格式
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 驗證網站格式
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// 儲存企業資料
async function saveProfile() {
    if (!validateForm()) {
        Utils.showNotification('請檢查表單資料是否正確', 'warning');
        return;
    }
    
    try {
        const formData = new FormData(document.getElementById('profileForm'));
        const updatedData = {
            name: formData.get('name'),
            type: formData.get('type'),
            size: formData.get('size'),
            industry: formData.get('industry'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            website: formData.get('website'),
            address: formData.get('address'),
            description: formData.get('description'),
            hrName: formData.get('hrName'),
            hrEmail: formData.get('hrEmail'),
            hrPhone: formData.get('hrPhone'),
            recruitmentProcess: formData.get('recruitmentProcess'),
            benefits: formData.get('benefits'),
            logo: enterpriseData.logo
        };
        
        const svc = await ensureApiServiceReady();
        const payload = {
            action: 'update',
            company_name: updatedData.name,
            company_type: updatedData.type,
            industry: updatedData.industry,
            company_size: updatedData.size,
            description: updatedData.description,
            website: updatedData.website,
            address: updatedData.address,
            phone: updatedData.phone,
            contact_person: updatedData.hrName,
            contact_email: updatedData.hrEmail,
            benefits_description: updatedData.benefits
        };
        const res = await svc.request('enterprise/profile.php', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (res?.status !== 200) throw new Error(res?.message || '更新失敗');
        enterpriseData = { ...enterpriseData, ...updatedData };
        Utils.showNotification('企業資料已儲存', 'success');
        
    } catch (error) {
        Utils.showNotification('儲存失敗，請稍後再試', 'error');
        console.error('儲存企業資料錯誤:', error);
    }
}

// 自動儲存
function autoSave() {
    if (validateForm()) {
        saveProfile();
    }
}

// 上傳企業標誌
function uploadLogo() {
    // 創建檔案輸入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // 驗證檔案大小
            if (file.size > 5 * 1024 * 1024) { // 5MB
                Utils.showNotification('檔案大小不能超過 5MB', 'error');
                return;
            }
            
            // 驗證檔案類型
            if (!file.type.startsWith('image/')) {
                Utils.showNotification('請選擇圖片檔案', 'error');
                return;
            }
            
            // 預覽圖片
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('logoImage').src = e.target.result;
                uploadLogoToServer(file);
            };
            reader.readAsDataURL(file);
        }
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// 上傳標誌到伺服器
async function uploadLogoToServer(file) {
    try {
        const formData = new FormData();
        formData.append('action', 'upload_logo');
        formData.append('logo', file);
        const uploadUrl = (window.apiService || window.initializeApiService?.()).getApiUrl('enterprise/profile.php');
        const resp = await fetch(uploadUrl, { method: 'POST', body: formData });
        if (!resp.ok) throw new Error('上傳失敗');
        const json = await resp.json();
        if (json?.status !== 200) throw new Error(json?.message || '上傳失敗');
        enterpriseData.logo = json?.data?.logo_url || enterpriseData.logo;
        Utils.showNotification('企業標誌已更新', 'success');
    } catch (error) {
        Utils.showNotification('上傳失敗，請稍後再試', 'error');
        console.error('上傳標誌錯誤:', error);
    }
}

// 匯出企業資料
function exportProfile() {
    try {
        const data = {
            exportDate: new Date().toISOString(),
            enterprise: {
                id: enterpriseData.id,
                name: enterpriseData.name,
                type: enterpriseData.type,
                size: enterpriseData.size,
                industry: enterpriseData.industry,
                contact: {
                    email: enterpriseData.email,
                    phone: enterpriseData.phone,
                    website: enterpriseData.website,
                    address: enterpriseData.address
                },
                description: enterpriseData.description,
                hr: {
                    name: enterpriseData.hrName,
                    email: enterpriseData.hrEmail,
                    phone: enterpriseData.hrPhone
                },
                recruitment: {
                    process: enterpriseData.recruitmentProcess,
                    benefits: enterpriseData.benefits
                },
                stats: enterpriseData.stats
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enterprise-profile-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('企業資料已匯出', 'success');
    } catch (error) {
        Utils.showNotification('匯出失敗，請稍後再試', 'error');
        console.error('匯出企業資料錯誤:', error);
    }
}

// 重置表單
function resetForm() {
    if (confirm('確定要重置所有變更嗎？')) {
        populateForm();
        Utils.showNotification('表單已重置', 'info');
    }
}

// 預覽企業頁面
function previewProfile() {
    // 在新視窗中開啟企業頁面預覽
    const previewUrl = `/enterprise/public-profile.html?id=${enterpriseData.id}`;
    window.open(previewUrl, '_blank', 'width=1200,height=800');
    Utils.showNotification('已開啟預覽視窗', 'success');
}

// 載入最近活動（企業端）
async function loadRecentActivities(limit = 10) {
    try {
        const svc = await ensureApiServiceReady();
        const res = await svc.request(`enterprise/dashboard.php?action=recent_activities&limit=${encodeURIComponent(String(limit))}`);
        const list = res?.data || res || [];
        renderRecentActivitiesProfile(Array.isArray(list) ? list : []);
    } catch (e) {
        console.error('載入最近活動失敗:', e);
        renderRecentActivitiesProfile([]);
    }
}

// 渲染 profile 頁面的最近活動到 .activity-list
function renderRecentActivitiesProfile(activities) {
    const ul = document.querySelector('.sidebar .activity-list');
    if (!ul) return;
    if (!activities || activities.length === 0) {
        ul.innerHTML = '<li class="activity-item"><div>目前沒有最近活動</div></li>';
        return;
    }
    ul.innerHTML = activities.map(act => {
        const type = act.type || '';
        const icon = type === 'job_application' ? 'fa-file-alt' : (type === 'portfolio_view' ? 'fa-eye' : (type === 'contact' ? 'fa-envelope' : 'fa-info-circle'));
        const desc = act.description || '';
        const timeText = act.time_ago || act.activity_date || '';
        const typeClass = type === 'job_application' ? 'activity-application' : (type === 'portfolio_view' ? 'activity-view' : (type === 'contact' ? 'activity-contact' : 'activity-generic'));
        return `
            <li class="activity-item">
                <div class="activity-icon ${typeClass}"><i class="fas ${icon}"></i></div>
                <div>
                    <div>${escapeHtml(desc)}</div>
                    <small>${escapeHtml(timeText)}</small>
                </div>
            </li>
        `;
    }).join('');
}

function escapeHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// 全域函數，供 HTML 直接調用
window.saveProfile = saveProfile;
window.uploadLogo = uploadLogo;
window.exportProfile = exportProfile;
window.resetForm = resetForm;
window.previewProfile = previewProfile; 

// 全域保險：確保 API 服務初始化完成
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