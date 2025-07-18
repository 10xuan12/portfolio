/**
 * 學生個人資料管理 JavaScript
 * 包含資料編輯、頭像上傳、密碼修改等功能
 */

// TODO: 從後端 API 載入學生資料
let studentData = {
    id: 1,
    name: '張小明',
    gender: '男',
    birth: '2002-05-15',
    student_id: '12345678',
    department: '資訊管理學系',
    grade: '大學三年級',
    email: 'zhang@example.com',
    phone: '0912-345-678',
    address: '台北市大安區復興南路一段 390 號',
    github: 'https://github.com/zhangxiaoming',
    linkedin: 'https://linkedin.com/in/zhangxiaoming',
    instagram: '@zhangxiaoming',
    facebook: '張小明',
    bio: '我是一名資訊管理學系的學生，專精於前端開發和 UI/UX 設計。我熱愛學習新技術，並且喜歡將創意轉化為實際的作品。',
    skills: 'JavaScript, React, Node.js, UI/UX Design',
    languages: '中文（母語）, 英文（流利）, 日文（基礎）',
    interests: '程式設計, 設計, 攝影, 旅行',
    avatar: 'https://via.placeholder.com/120x120/667eea/ffffff?text=張',
    stats: {
        portfolios: 12,
        views: 1234,
        likes: 89,
        badges: 5
    },
    badges: [
        { id: 1, name: '新手上傳者', icon: 'fas fa-star', earned: true },
        { id: 2, name: '瀏覽達人', icon: 'fas fa-eye', earned: true },
        { id: 3, name: '受歡迎', icon: 'fas fa-heart', earned: true },
        { id: 4, name: '作品大師', icon: 'fas fa-trophy', earned: true },
        { id: 5, name: '互動王', icon: 'fas fa-comment', earned: true },
        { id: 6, name: '超級明星', icon: 'fas fa-crown', earned: false }
    ],
    activities: [
        {
            id: 1,
            type: 'upload',
            text: '上傳了新作品「UI/UX 設計作品」',
            time: '2 小時前'
        },
        {
            id: 2,
            type: 'view',
            text: '有人瀏覽了您的作品「響應式網站設計」',
            time: '4 小時前'
        },
        {
            id: 3,
            type: 'like',
            text: '有人對您的作品「行動應用程式」按讚',
            time: '6 小時前'
        },
        {
            id: 4,
            type: 'comment',
            text: '有人評論了您的作品「響應式網站設計」',
            time: '1 天前'
        }
    ]
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    loadStudentData();
    initEventListeners();
    renderBadges();
    renderActivities();
});

// 載入學生資料
function loadStudentData() {
    // TODO: 從後端 API 載入學生資料
    // const response = await fetch('/api/student/profile');
    // studentData = await response.json();
    
    // 填充表單資料
    document.getElementById('name').value = studentData.name;
    document.getElementById('gender').value = studentData.gender;
    document.getElementById('birth').value = studentData.birth;
    document.getElementById('student_id').value = studentData.student_id;
    document.getElementById('department').value = studentData.department;
    document.getElementById('grade').value = studentData.grade;
    document.getElementById('email').value = studentData.email;
    document.getElementById('phone').value = studentData.phone;
    document.getElementById('address').value = studentData.address;
    document.getElementById('github').value = studentData.github;
    document.getElementById('linkedin').value = studentData.linkedin;
    document.getElementById('instagram').value = studentData.instagram;
    document.getElementById('facebook').value = studentData.facebook;
    document.getElementById('bio').value = studentData.bio;
    document.getElementById('skills').value = studentData.skills;
    document.getElementById('languages').value = studentData.languages;
    document.getElementById('interests').value = studentData.interests;
    
    // 更新頭像
    if (studentData.avatar) {
        document.getElementById('avatarImage').src = studentData.avatar;
    }
    
    // 更新統計資料
    updateStats();
}

// 初始化事件監聽器
function initEventListeners() {
    // 個人資料表單提交
    document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
    
    // 密碼表單提交
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordSubmit);
    
    // 頭像上傳
    document.getElementById('avatarInput').addEventListener('change', handleAvatarUpload);
    
    // 表單驗證
    initFormValidation();
}

// 處理個人資料表單提交
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const profileData = {
        name: formData.get('name'),
        gender: formData.get('gender'),
        birth: formData.get('birth'),
        student_id: formData.get('student_id'),
        department: formData.get('department'),
        grade: formData.get('grade'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        github: formData.get('github'),
        linkedin: formData.get('linkedin'),
        instagram: formData.get('instagram'),
        facebook: formData.get('facebook'),
        bio: formData.get('bio'),
        skills: formData.get('skills'),
        languages: formData.get('languages'),
        interests: formData.get('interests')
    };
    
    try {
        // TODO: 發送更新請求到後端 API
        // const response = await fetch('/api/student/profile', {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(profileData)
        // });
        
        // 更新本地資料
        Object.assign(studentData, profileData);
        
        Utils.showNotification('個人資料已更新', 'success');
    } catch (error) {
        Utils.showNotification('更新失敗，請稍後再試', 'error');
        console.error('更新個人資料錯誤:', error);
    }
}

// 處理密碼表單提交
async function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    // 驗證密碼
    if (newPassword !== confirmPassword) {
        Utils.showNotification('新密碼與確認密碼不符', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        Utils.showNotification('新密碼至少需要 8 個字元', 'error');
        return;
    }
    
    try {
        // TODO: 發送密碼修改請求到後端 API
        // const response = await fetch('/api/student/password', {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         currentPassword,
        //         newPassword
        //     })
        // });
        
        e.target.reset();
        Utils.showNotification('密碼已成功修改', 'success');
    } catch (error) {
        Utils.showNotification('密碼修改失敗，請檢查目前密碼是否正確', 'error');
        console.error('修改密碼錯誤:', error);
    }
}

// 處理頭像上傳
async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
        Utils.showNotification('請選擇圖片檔案', 'error');
        return;
    }
    
    // 驗證檔案大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
        Utils.showNotification('圖片檔案大小不能超過 2MB', 'error');
        return;
    }
    
    try {
        // 顯示上傳中狀態
        Utils.showNotification('正在上傳頭像...', 'info');
        
        // TODO: 上傳檔案到後端
        // const formData = new FormData();
        // formData.append('avatar', file);
        // const response = await fetch('/api/student/avatar', {
        //     method: 'POST',
        //     body: formData
        // });
        
        // 模擬上傳成功
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatarImage').src = e.target.result;
            studentData.avatar = e.target.result;
            Utils.showNotification('頭像上傳成功', 'success');
        };
        reader.readAsDataURL(file);
        
    } catch (error) {
        Utils.showNotification('頭像上傳失敗，請稍後再試', 'error');
        console.error('上傳頭像錯誤:', error);
    }
}

// 重置表單
function resetForm() {
    if (confirm('確定要重置所有變更嗎？')) {
        loadStudentData();
        Utils.showNotification('表單已重置', 'info');
    }
}

// 更新統計資料
function updateStats() {
    const stats = studentData.stats;
    
    // 更新頁面中的統計數字
    const statElements = document.querySelectorAll('.stat-number');
    if (statElements.length >= 4) {
        statElements[0].textContent = stats.portfolios;
        statElements[1].textContent = Utils.formatNumber(stats.views);
        statElements[2].textContent = stats.likes;
        statElements[3].textContent = stats.badges;
    }
}

// 渲染徽章
function renderBadges() {
    const badgeGrid = document.querySelector('.badge-grid');
    if (!badgeGrid) return;
    
    badgeGrid.innerHTML = studentData.badges.map(badge => `
        <div class="badge-item ${badge.earned ? 'earned' : ''}">
            <i class="${badge.icon}"></i>
            <div class="badge-name">${badge.name}</div>
        </div>
    `).join('');
}

// 渲染活動記錄
function renderActivities() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    activityList.innerHTML = studentData.activities.map(activity => `
        <li class="activity-item">
            <div class="activity-icon activity-${activity.type}">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </li>
    `).join('');
}

// 取得活動圖示
function getActivityIcon(type) {
    const iconMap = {
        'upload': 'upload',
        'view': 'eye',
        'like': 'heart',
        'comment': 'comment'
    };
    return iconMap[type] || 'info-circle';
}

// 初始化表單驗證
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // 即時驗證
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            // 輸入時清除錯誤
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });
    });
}

// 驗證欄位
function validateField(field) {
    const value = field.value.trim();
    
    // 必填欄位驗證
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, '此欄位為必填');
        return false;
    }
    
    // 電子郵件驗證
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, '請輸入有效的電子郵件地址');
            return false;
        }
    }
    
    // URL 驗證
    if (field.type === 'url' && value) {
        try {
            new URL(value);
        } catch {
            showFieldError(field, '請輸入有效的網址');
            return false;
        }
    }
    
    // 電話號碼驗證
    if (field.name === 'phone' && value) {
        const phoneRegex = /^[\d\-\+\(\)\s]+$/;
        if (!phoneRegex.test(value)) {
            showFieldError(field, '請輸入有效的電話號碼');
            return false;
        }
    }
    
    clearFieldError(field);
    return true;
}

// 顯示欄位錯誤
function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #f87171;
        font-size: 0.875rem;
        margin-top: 0.25rem;
    `;
    
    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = '#f87171';
}

// 清除欄位錯誤
function clearFieldError(field) {
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    field.style.borderColor = '';
}

// 匯出個人資料
function exportProfileData() {
    const exportData = {
        ...studentData,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `profile_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    Utils.showNotification('個人資料已匯出', 'success');
}

// 更新帳號設定
function updateAccountSettings() {
    const emailNotification = document.querySelector('input[type="checkbox"]').checked;
    const publicProfile = document.querySelectorAll('input[type="checkbox"]')[1].checked;
    const twoFactor = document.querySelectorAll('input[type="checkbox"]')[2].checked;
    
    // TODO: 發送設定更新請求到後端 API
    // fetch('/api/student/settings', {
    //     method: 'PUT',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //         emailNotification,
    //         publicProfile,
    //         twoFactor
    //     })
    // });
    
    Utils.showNotification('帳號設定已更新', 'success');
}

// 全域函數供 HTML 使用
window.resetForm = resetForm;
window.exportProfileData = exportProfileData;
window.updateAccountSettings = updateAccountSettings; 