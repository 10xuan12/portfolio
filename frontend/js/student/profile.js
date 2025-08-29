/**
 * 學生個人資料管理 JavaScript
 * 包含資料編輯、頭像上傳、密碼修改等功能
 */

// 學生資料結構，將由後端 API 填充
let studentData = {
    id: null,
    name: '',
    gender: '',
    birth: '',
    student_id: '',
    department: '',
    grade: '',
    email: '',
    phone: '',
    address: '',
    github: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    bio: '',
    skills: '',
    languages: '',
    interests: '',
    avatar: '',
    stats: {
        portfolios: 0,
        views: 0,
        likes: 0,
        badges: 0
    },
    badges: [],
    activities: []
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    loadStudentData();
    loadUserSettings();
    initEventListeners();
    renderBadges();
    renderActivities();
});

// 載入學生資料
async function loadStudentData() {
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            console.error('無法獲取使用者資訊');
            return;
        }

        // 並行載入個人資料、徽章和活動
        const [profileResponse, badgesResponse, activitiesResponse] = await Promise.all([
            fetch(`/portfolio/api/student/profile.php?action=get&user_id=${user.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': user.id
                }
            }),
            fetch(`/portfolio/api/student/badges.php?action=get&user_id=${user.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': user.id
                }
            }),
            fetch(`/portfolio/api/student/activities.php?action=get&user_id=${user.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': user.id
                }
            })
        ]);

        // 處理個人資料回應
        if (profileResponse.ok) {
            const profileResult = await profileResponse.json();
            console.log('載入的個人資料:', profileResult);

            if (profileResult.status === 200 && profileResult.data) {
                // 檢查是否為首次登入
                if (profileResult.data.is_first_login) {
                    console.log('首次登入，需要完善個人資料');
                    showFirstLoginModal();
                }
                
                // 完全使用後端 API 資料
                studentData = {
                    id: profileResult.data.id,
                    name: profileResult.data.display_name || `${profileResult.data.first_name} ${profileResult.data.last_name}`,
                    gender: profileResult.data.gender || '',
                    birth: profileResult.data.birth_date || '',
                    student_id: profileResult.data.student_id || '',
                    department: profileResult.data.major || '',
                    grade: profileResult.data.grade || '',
                    email: profileResult.data.email || '',
                    phone: profileResult.data.phone || '',
                    address: profileResult.data.address || '',
                    github: profileResult.data.github || '',
                    linkedin: profileResult.data.linkedin || '',
                    instagram: profileResult.data.instagram || '',
                    facebook: profileResult.data.facebook || '',
                    bio: profileResult.data.bio || '',
                    skills: profileResult.data.skills || '',
                    languages: profileResult.data.languages || '',
                    interests: profileResult.data.interests || '',
                    avatar: profileResult.data.avatar_url || `https://via.placeholder.com/120x120/667eea/ffffff?text=${encodeURIComponent(profileResult.data.first_name || '')}`,
                    stats: {
                        portfolios: profileResult.data.portfolio_count || 0,
                        views: profileResult.data.view_count || 0,
                        likes: profileResult.data.like_count || 0,
                        badges: profileResult.data.badge_count || 0
                    },
                    badges: [],
                    activities: []
                };
            }
        }

        // 處理徽章回應
        if (badgesResponse.ok) {
            const badgesResult = await badgesResponse.json();
            if (badgesResult.status === 200 && badgesResult.data) {
                studentData.badges = badgesResult.data;
            }
        }

        // 處理活動回應
        if (activitiesResponse.ok) {
            const activitiesResult = await activitiesResponse.json();
            if (activitiesResult.status === 200 && activitiesResult.data) {
                studentData.activities = activitiesResult.data;
            }
        }
        
        // 更新頁面顯示
        updatePageDisplay();
        
        // 重新渲染徽章和活動
        renderBadges();
        renderActivities();
        
    } catch (error) {
        console.error('載入個人資料失敗:', error);
        // 如果 API 失敗，使用預設資料
    }
    
    // 填充表單資料
    if (studentData.name) {
        document.getElementById('name').value = studentData.name;
    }
    if (studentData.gender) {
        document.getElementById('gender').value = studentData.gender;
    }
    if (studentData.birth) {
        document.getElementById('birth').value = studentData.birth;
    }
    if (studentData.student_id) {
        document.getElementById('student_id').value = studentData.student_id;
    }
    if (studentData.department) {
        document.getElementById('department').value = studentData.department;
    }
    if (studentData.grade) {
        document.getElementById('grade').value = studentData.grade;
    }
    if (studentData.email) {
        document.getElementById('email').value = studentData.email;
    }
    if (studentData.phone) {
        document.getElementById('phone').value = studentData.phone;
    }
    if (studentData.address) {
        document.getElementById('address').value = studentData.address;
    }
    if (studentData.github) {
        document.getElementById('github').value = studentData.github;
    }
    if (studentData.linkedin) {
        document.getElementById('linkedin').value = studentData.linkedin;
    }
    if (studentData.instagram) {
        document.getElementById('instagram').value = studentData.instagram;
    }
    if (studentData.facebook) {
        document.getElementById('facebook').value = studentData.facebook;
    }
    if (studentData.bio) {
        document.getElementById('bio').value = studentData.bio;
    }
    if (studentData.skills) {
        document.getElementById('skills').value = studentData.skills;
    }
    if (studentData.languages) {
        document.getElementById('languages').value = studentData.languages;
    }
    if (studentData.interests) {
        document.getElementById('interests').value = studentData.interests;
    }
    
    // 更新頭像
    if (studentData.avatar) {
        document.getElementById('avatarImage').src = studentData.avatar;
    }
    
    // 更新統計資料
    updateStats();
    
    // 更新頁面顯示
    updatePageDisplay();
}

// 初始化事件監聽器
function initEventListeners() {
    // 個人資料表單提交
    document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
    
    // 密碼表單提交
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordSubmit);
    
    // 頭像上傳
    document.getElementById('avatarInput').addEventListener('change', handleAvatarUpload);
    
    // 設定變更事件
    initSettingsChangeListeners();
    
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
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }

        // 準備要發送的資料
        const updateData = {
            action: 'update',
            user_id: user.id,
            first_name: profileData.name.split(' ')[0] || profileData.name,
            last_name: profileData.name.split(' ').slice(1).join(' ') || '',
            display_name: profileData.name,
            gender: profileData.gender,
            birth_date: profileData.birth,
            phone: profileData.phone,
            address: profileData.address,
            bio: profileData.bio,
            student_id: profileData.student_id,
            major: profileData.department,
            school: '國立台灣大學', // 預設值
            grade: profileData.grade,
            skills: profileData.skills,
            interests: profileData.interests
        };

        // 發送更新請求到後端 API
        const response = await fetch('/portfolio/api/student/profile.php', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-ID': user.id
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('更新結果:', result);

        if (result.status === 200) {
            // 更新本地資料
            Object.assign(studentData, profileData);
            Utils.showNotification('個人資料已更新', 'success');
            
            // 重新載入資料以確保同步
            await loadStudentData();
        } else {
            throw new Error(result.message || '更新失敗');
        }
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
    if (!currentPassword) {
        Utils.showNotification('請輸入目前密碼', 'error');
        return;
    }
    
    if (!newPassword) {
        Utils.showNotification('請輸入新密碼', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        Utils.showNotification('新密碼與確認密碼不符', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        Utils.showNotification('新密碼至少需要 8 個字元', 'error');
        return;
    }
    
    // 檢查新密碼是否與目前密碼相同
    if (currentPassword === newPassword) {
        Utils.showNotification('新密碼不能與目前密碼相同', 'error');
        return;
    }
    
    // 檢查密碼強度
    const passwordStrength = checkPasswordStrength(newPassword);
    if (passwordStrength < 2) {
        Utils.showNotification('密碼強度不足，建議包含大小寫字母、數字和特殊符號', 'warning');
    }
    
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }

        // 發送密碼修改請求到後端 API
        const response = await fetch('/portfolio/api/student/password.php', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-ID': user.id
            },
            body: JSON.stringify({
                action: 'change_password',
                user_id: user.id,
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '密碼修改失敗');
        }

        const result = await response.json();
        
        if (result.status === 200) {
            e.target.reset();
            Utils.showNotification('密碼已成功修改', 'success');
            
            // 可選：登出使用者，要求重新登入
            if (confirm('密碼已修改，建議重新登入以確保安全。是否要登出？')) {
                localStorage.removeItem('user');
                window.location.href = '/portfolio/frontend/login.html';
            }
        } else {
            throw new Error(result.message || '密碼修改失敗');
        }
    } catch (error) {
        Utils.showNotification(error.message || '密碼修改失敗，請檢查目前密碼是否正確', 'error');
        console.error('修改密碼錯誤:', error);
    }
}

// 處理頭像上傳
async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 驗證檔案類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        Utils.showNotification('只允許上傳 JPG、PNG 或 GIF 格式的圖片', 'error');
        return;
    }
    
    // 驗證檔案大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        Utils.showNotification(`圖片檔案大小不能超過 ${Math.round(maxSize / 1024 / 1024)}MB`, 'error');
        return;
    }
    
    // 驗證圖片尺寸
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = async function() {
        URL.revokeObjectURL(url);
        
        if (img.width < 100 || img.height < 100) {
            Utils.showNotification('圖片尺寸太小，建議至少 100x100 像素', 'warning');
        }
        
        if (img.width > 2000 || img.height > 2000) {
            Utils.showNotification('圖片尺寸太大，建議不超過 2000x2000 像素', 'warning');
        }
        
        // 開始上傳
        await uploadAvatarFile(file);
    };
    
    img.onerror = function() {
        URL.revokeObjectURL(url);
        Utils.showNotification('無法讀取圖片檔案，請選擇有效的圖片', 'error');
    };
    
    img.src = url;
}

// 上傳頭像檔案
async function uploadAvatarFile(file) {
    try {
        // 顯示上傳中狀態
        Utils.showNotification('正在上傳頭像...', 'info');
        
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }

        // 準備 FormData 並上傳檔案到後端
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('action', 'upload_avatar');
        formData.append('user_id', user.id);

        const response = await fetch('/portfolio/api/student/profile.php', {
            method: 'POST',
            headers: { 
                'X-User-ID': user.id
                // 注意：不要設定 Content-Type，讓瀏覽器自動設定 multipart/form-data
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '頭像上傳失敗');
        }

        const result = await response.json();
        
        if (result.status === 200) {
            // 更新頭像顯示
            const avatarUrl = result.data.avatar_url;
            document.getElementById('avatarImage').src = avatarUrl;
            studentData.avatar = avatarUrl;
            
            // 更新 localStorage 中的使用者資訊
            const currentUser = JSON.parse(localStorage.getItem('user'));
            currentUser.avatar = avatarUrl;
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            Utils.showNotification('頭像上傳成功', 'success');
        } else {
            throw new Error(result.message || '頭像上傳失敗');
        }
        
    } catch (error) {
        Utils.showNotification(error.message || '頭像上傳失敗，請稍後再試', 'error');
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

// 更新頁面顯示
function updatePageDisplay() {
    // 更新個人資料標題區域
    const profileName = document.getElementById('profile-name');
    if (profileName && studentData.name) {
        profileName.textContent = studentData.name;
    }
    
    const profileDeptGrade = document.getElementById('profile-department-grade');
    if (profileDeptGrade && studentData.department && studentData.grade) {
        profileDeptGrade.textContent = `${studentData.department} · ${studentData.grade}`;
    }
    
    const profileStudentId = document.getElementById('profile-student-id');
    if (profileStudentId && studentData.student_id) {
        profileStudentId.textContent = `學生編號: ${studentData.student_id}`;
    }
    
    // 更新統計資料
    const statPortfolios = document.getElementById('stat-portfolios');
    if (statPortfolios && studentData.stats) {
        statPortfolios.textContent = studentData.stats.portfolios || 0;
    }
    
    const statViews = document.getElementById('stat-views');
    if (statViews && studentData.stats) {
        statViews.textContent = studentData.stats.views || 0;
    }
    
    const statLikes = document.getElementById('stat-likes');
    if (statLikes && studentData.stats) {
        statLikes.textContent = studentData.stats.likes || 0;
    }
    
    const statBadges = document.getElementById('stat-badges');
    if (statBadges && studentData.stats) {
        statBadges.textContent = studentData.stats.badges || 0;
    }
    
    // 更新頭像
    if (studentData.avatar && document.getElementById('avatarImage')) {
        document.getElementById('avatarImage').src = studentData.avatar;
    }
}

// 渲染徽章
function renderBadges() {
    const badgeGrid = document.querySelector('.badge-grid');
    if (!badgeGrid) return;
    
    if (studentData.badges && studentData.badges.length > 0) {
        badgeGrid.innerHTML = studentData.badges.map(badge => `
            <div class="badge-item ${badge.earned ? 'earned' : ''}">
                <i class="${badge.icon}"></i>
                <div class="badge-name">${badge.name}</div>
            </div>
        `).join('');
    } else {
        badgeGrid.innerHTML = '<div class="no-badges">目前還沒有徽章</div>';
    }
}

// 渲染活動記錄
function renderActivities() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    if (studentData.activities && studentData.activities.length > 0) {
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
    } else {
        activityList.innerHTML = '<li class="no-activities">目前還沒有活動記錄</li>';
    }
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
    // 顯示匯出選項
    const exportType = prompt('請選擇匯出格式：\n1. JSON 格式\n2. CSV 格式\n3. PDF 格式\n\n輸入數字 1-3：');
    
    if (!exportType) return;
    
    try {
        switch (exportType.trim()) {
            case '1':
                exportAsJSON();
                break;
            case '2':
                exportAsCSV();
                break;
            case '3':
                exportAsPDF();
                break;
            default:
                Utils.showNotification('無效的選擇，請輸入 1-3', 'error');
                return;
        }
    } catch (error) {
        console.error('匯出失敗:', error);
        Utils.showNotification('匯出失敗，請稍後再試', 'error');
    }
}

// 匯出為 JSON 格式
function exportAsJSON() {
    const exportData = {
        ...studentData,
        exportDate: new Date().toISOString(),
        exportFormat: 'JSON'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `profile_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    Utils.showNotification('個人資料已匯出為 JSON 格式', 'success');
}

// 匯出為 CSV 格式
function exportAsCSV() {
    const csvData = [
        ['欄位', '值'],
        ['姓名', studentData.name || ''],
        ['性別', studentData.gender || ''],
        ['生日', studentData.birth || ''],
        ['學號', studentData.student_id || ''],
        ['科系', studentData.department || ''],
        ['年級', studentData.grade || ''],
        ['電子郵件', studentData.email || ''],
        ['電話', studentData.phone || ''],
        ['地址', studentData.address || ''],
        ['GitHub', studentData.github || ''],
        ['LinkedIn', studentData.linkedin || ''],
        ['Instagram', studentData.instagram || ''],
        ['Facebook', studentData.facebook || ''],
        ['個人簡介', studentData.bio || ''],
        ['技能專長', studentData.skills || ''],
        ['語言能力', studentData.languages || ''],
        ['興趣愛好', studentData.interests || ''],
        ['匯出日期', new Date().toLocaleDateString('zh-TW')]
    ];
    
    const csvContent = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `profile_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    Utils.showNotification('個人資料已匯出為 CSV 格式', 'success');
}

// 匯出為 PDF 格式
function exportAsPDF() {
    // 檢查是否有 jsPDF 函式庫
    if (typeof jsPDF === 'undefined') {
        Utils.showNotification('PDF 匯出功能需要 jsPDF 函式庫，請先載入', 'warning');
        // 嘗試載入 jsPDF
        loadJSPDF().then(() => {
            exportAsPDF();
        }).catch(() => {
            Utils.showNotification('無法載入 PDF 函式庫，請使用其他格式匯出', 'error');
        });
        return;
    }
    
    try {
        const doc = new jsPDF();
        
        // 設定中文字體（如果支援）
        doc.setFont('helvetica');
        doc.setFontSize(16);
        
        // 標題
        doc.text('個人資料', 105, 20, { align: 'center' });
        
        // 基本資料
        doc.setFontSize(12);
        doc.text(`姓名：${studentData.name || ''}`, 20, 40);
        doc.text(`性別：${studentData.gender || ''}`, 20, 50);
        doc.text(`生日：${studentData.birth || ''}`, 20, 60);
        doc.text(`學號：${studentData.student_id || ''}`, 20, 70);
        doc.text(`科系：${studentData.department || ''}`, 20, 80);
        doc.text(`年級：${studentData.grade || ''}`, 20, 90);
        doc.text(`電子郵件：${studentData.email || ''}`, 20, 100);
        doc.text(`電話：${studentData.phone || ''}`, 20, 110);
        doc.text(`地址：${studentData.address || ''}`, 20, 120);
        
        // 社群媒體
        doc.text(`GitHub：${studentData.github || ''}`, 20, 140);
        doc.text(`LinkedIn：${studentData.linkedin || ''}`, 20, 150);
        doc.text(`Instagram：${studentData.instagram || ''}`, 20, 160);
        doc.text(`Facebook：${studentData.facebook || ''}`, 20, 170);
        
        // 專業資訊
        doc.text(`個人簡介：${studentData.bio || ''}`, 20, 190);
        doc.text(`技能專長：${studentData.skills || ''}`, 20, 200);
        doc.text(`語言能力：${studentData.languages || ''}`, 20, 210);
        doc.text(`興趣愛好：${studentData.interests || ''}`, 20, 220);
        
        // 匯出日期
        doc.text(`匯出日期：${new Date().toLocaleDateString('zh-TW')}`, 20, 240);
        
        // 儲存檔案
        doc.save(`profile_${new Date().toISOString().split('T')[0]}.pdf`);
        
        Utils.showNotification('個人資料已匯出為 PDF 格式', 'success');
    } catch (error) {
        console.error('PDF 匯出錯誤:', error);
        Utils.showNotification('PDF 匯出失敗，請使用其他格式', 'error');
    }
}

// 載入 jsPDF 函式庫
async function loadJSPDF() {
    return new Promise((resolve, reject) => {
        if (typeof jsPDF !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('無法載入 jsPDF'));
        document.head.appendChild(script);
    });
}

// 載入使用者設定
async function loadUserSettings() {
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            return;
        }

        // 嘗試從 localStorage 載入已儲存的設定
        const savedSettings = localStorage.getItem('user_settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            updateSettingsUI(settings);
            return;
        }

        // 如果沒有本地設定，從後端 API 載入
        const response = await fetch(`/portfolio/api/student/settings.php?action=get&user_id=${user.id}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': user.id
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.status === 200 && result.data) {
                const settings = {
                    emailNotification: result.data.email_notification || false,
                    publicProfile: result.data.public_profile || true,
                    twoFactor: result.data.two_factor_auth || false
                };
                
                // 更新 UI 和本地儲存
                updateSettingsUI(settings);
                localStorage.setItem('user_settings', JSON.stringify(settings));
            }
        }
    } catch (error) {
        console.error('載入使用者設定失敗:', error);
        // 使用預設設定
        const defaultSettings = {
            emailNotification: true,
            publicProfile: true,
            twoFactor: false
        };
        updateSettingsUI(defaultSettings);
    }
}

// 更新設定 UI
function updateSettingsUI(settings) {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length >= 3) {
        checkboxes[0].checked = settings.emailNotification;
        checkboxes[1].checked = settings.publicProfile;
        checkboxes[2].checked = settings.twoFactor;
    }
}

// 初始化設定變更事件監聽器
function initSettingsChangeListeners() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('change', function() {
            // 延遲儲存，避免頻繁 API 呼叫
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                updateAccountSettings();
            }, 1000);
        });
    });
}

// 檢查密碼強度
function checkPasswordStrength(password) {
    let strength = 0;
    
    // 長度檢查
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // 包含小寫字母
    if (/[a-z]/.test(password)) strength++;
    
    // 包含大寫字母
    if (/[A-Z]/.test(password)) strength++;
    
    // 包含數字
    if (/\d/.test(password)) strength++;
    
    // 包含特殊符號
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
    
    return strength;
}

// 更新帳號設定
async function updateAccountSettings() {
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }

        // 獲取設定值
        const emailNotification = document.querySelector('input[type="checkbox"]').checked;
        const publicProfile = document.querySelectorAll('input[type="checkbox"]')[1].checked;
        const twoFactor = document.querySelectorAll('input[type="checkbox"]')[2].checked;
        
        // 發送設定更新請求到後端 API
        const response = await fetch('/portfolio/api/student/settings.php', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-ID': user.id
            },
            body: JSON.stringify({
                action: 'update_settings',
                user_id: user.id,
                email_notification: emailNotification,
                public_profile: publicProfile,
                two_factor_auth: twoFactor
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '設定更新失敗');
        }

        const result = await response.json();
        
        if (result.status === 200) {
            Utils.showNotification('帳號設定已更新', 'success');
            
            // 更新本地資料
            studentData.settings = {
                emailNotification,
                publicProfile,
                twoFactor
            };
            
            // 可選：儲存到 localStorage
            localStorage.setItem('user_settings', JSON.stringify({
                emailNotification,
                publicProfile,
                twoFactor
            }));
        } else {
            throw new Error(result.message || '設定更新失敗');
        }
        
    } catch (error) {
        Utils.showNotification(error.message || '設定更新失敗，請稍後再試', 'error');
        console.error('更新帳號設定錯誤:', error);
    }
}

// 顯示首次登入模態框
function showFirstLoginModal() {
    // 創建模態框 HTML
    const modalHTML = `
        <div id="firstLoginModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>歡迎！請完善您的個人資料</h2>
                    <p>為了提供更好的服務，請填寫以下基本資料</p>
                </div>
                <div class="modal-body">
                    <form id="firstLoginForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="modal-firstname">名字 *</label>
                                <input type="text" id="modal-firstname" name="first_name" required placeholder="請輸入您的名字">
                            </div>
                            <div class="form-group">
                                <label for="modal-lastname">姓氏 *</label>
                                <input type="text" id="modal-lastname" name="last_name" required placeholder="請輸入您的姓氏">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="modal-phone">電話</label>
                            <input type="tel" id="modal-phone" name="phone" placeholder="請輸入您的電話號碼">
                        </div>
                        <div class="form-group">
                            <label for="modal-major">主修科系</label>
                            <input type="text" id="modal-major" name="major" placeholder="請輸入您的主修科系">
                        </div>
                        <div class="form-group">
                            <label for="modal-grade">年級</label>
                            <select id="modal-grade" name="grade">
                                <option value="">請選擇年級</option>
                                <option value="大學一年級">大學一年級</option>
                                <option value="大學二年級">大學二年級</option>
                                <option value="大學三年級">大學三年級</option>
                                <option value="大學四年級">大學四年級</option>
                                <option value="碩士生">碩士生</option>
                                <option value="博士生">博士生</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="modal-bio">個人簡介</label>
                            <textarea id="modal-bio" name="bio" rows="3" placeholder="請簡單介紹一下自己"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="submitFirstLogin()">完成設定</button>
                </div>
            </div>
        </div>
    `;
    
    // 添加到頁面
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 顯示模態框
    document.getElementById('firstLoginModal').style.display = 'flex';
    
    // 自動聚焦到第一個輸入欄位
    document.getElementById('modal-firstname').focus();
}

// 提交首次登入表單
async function submitFirstLogin() {
    const form = document.getElementById('firstLoginForm');
    const formData = new FormData(form);
    
    // 驗證必填欄位
    const firstName = formData.get('first_name');
    const lastName = formData.get('last_name');
    
    if (!firstName || !lastName) {
        Utils.showNotification('請填寫名字和姓氏', 'error');
        return;
    }
    
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }
        
        // 準備要發送的資料
        const updateData = {
            action: 'update',
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            display_name: `${lastName}${firstName}`,
            phone: formData.get('phone') || '',
            major: formData.get('major') || '',
            grade: formData.get('grade') || '',
            bio: formData.get('bio') || '',
            school: '國立台灣大學', // 預設值
            is_public: true
        };
        
        // 發送更新請求到後端 API
        const response = await fetch('/portfolio/api/student/profile.php', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-ID': user.id
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('首次登入資料更新結果:', result);
        
        if (result.status === 200) {
            Utils.showNotification('個人資料設定完成！', 'success');
            
            // 關閉模態框
            closeFirstLoginModal();
            
            // 重新載入資料
            await loadStudentData();
        } else {
            throw new Error(result.message || '更新失敗');
        }
    } catch (error) {
        Utils.showNotification('設定失敗，請稍後再試', 'error');
        console.error('首次登入設定錯誤:', error);
    }
}

// 關閉首次登入模態框
function closeFirstLoginModal() {
    const modal = document.getElementById('firstLoginModal');
    if (modal) {
        modal.remove();
    }
}

// 全域函數供 HTML 使用
window.resetForm = resetForm;
window.exportProfileData = exportProfileData;
window.updateAccountSettings = updateAccountSettings;
window.submitFirstLogin = submitFirstLogin; 