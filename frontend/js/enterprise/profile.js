/**
 * 企業資料管理 JavaScript
 * 包含資料編輯、表單驗證、檔案上傳等功能
 */

// TODO: 從後端 API 載入企業資料
let enterpriseData = {
    id: 1,
    name: '台灣微軟股份有限公司',
    type: '科技公司',
    size: '51-200人',
    industry: '軟體開發',
    email: 'hr@microsoft.com.tw',
    phone: '02-2345-6789',
    website: 'https://www.microsoft.com/zh-tw',
    address: '台北市信義區信義路五段7號',
    description: '台灣微軟是微軟公司在台灣的分公司，致力於推動台灣的數位轉型。我們提供各種軟體解決方案，包括雲端服務、人工智慧、企業應用程式等。我們重視人才發展，提供良好的工作環境和學習機會。',
    hrName: '王小明',
    hrEmail: 'hr@microsoft.com.tw',
    hrPhone: '02-2345-6789#123',
    recruitmentProcess: '筆試+面試',
    benefits: '• 具競爭力的薪資待遇\n• 完善的保險制度（勞保、健保、團保）\n• 年終獎金及績效獎金\n• 教育訓練補助\n• 員工旅遊\n• 彈性工作時間\n• 免費咖啡及零食\n• 健身房補助',
    logo: 'https://via.placeholder.com/120x120/667eea/ffffff?text=微軟',
    stats: {
        jobs: 5,
        applications: 23,
        views: 156,
        contacts: 8
    }
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    loadEnterpriseData();
    initEventListeners();
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
        // TODO: 從後端 API 載入企業資料
        // const response = await fetch('/api/enterprise/profile');
        // enterpriseData = await response.json();
        
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
    const stats = enterpriseData.stats;
    
    // 更新統計數字
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = stats.jobs;
        statNumbers[1].textContent = stats.applications;
        statNumbers[2].textContent = stats.views;
        statNumbers[3].textContent = stats.contacts;
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
        
        // TODO: 發送更新請求到後端 API
        // const response = await fetch('/api/enterprise/profile', {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(updatedData)
        // });
        
        // 更新本地資料
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
                enterpriseData.logo = e.target.result;
                
                // TODO: 上傳檔案到後端
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
        // TODO: 實作檔案上傳到後端
        // const formData = new FormData();
        // formData.append('logo', file);
        // 
        // const response = await fetch('/api/enterprise/upload-logo', {
        //     method: 'POST',
        //     body: formData
        // });
        // 
        // const result = await response.json();
        // enterpriseData.logo = result.logoUrl;
        
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
    // TODO: 在新視窗中開啟企業頁面預覽
    Utils.showNotification('預覽功能開發中', 'info');
}

// 全域函數，供 HTML 直接調用
window.saveProfile = saveProfile;
window.uploadLogo = uploadLogo;
window.exportProfile = exportProfile;
window.resetForm = resetForm;
window.previewProfile = previewProfile; 