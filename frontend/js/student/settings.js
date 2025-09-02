/**
 * 學生設定頁面 JavaScript
 * 包含設定管理、表單處理、切換功能等
 */

// 使用者設定
let userSettings = {
    account: {
        displayName: '張小明',
        username: 'zhangxiaoming',
        bio: '我是一名資訊管理學系的學生，專精於前端開發和 UI/UX 設計。',
        language: 'zh-TW',
        timezone: 'Asia/Taipei'
    },
    privacy: {
        profileVisibility: 'public',
        showProfile: true,
        showStats: true,
        allowComments: true,
        searchIndex: false
    },
    notifications: {
        emailNotifications: true,
        portfolioInteractions: true,
        enterpriseViews: true,
        systemUpdates: false,
        marketingMessages: false,
        frequency: 'daily'
    },
    security: {
        twoFactorAuth: false,
        lastPasswordChange: '2024-01-01'
    }
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    loadUserSettings();
    initEventListeners();
});

// 載入使用者設定
async function loadUserSettings() {
    try {
        // 使用API服務載入設定
        const response = await apiService.getUserSettings();
        if (response.success) {
            userSettings = response.data;
        }
        
        // 填充表單資料
        fillFormData();
        updateToggleStates();
        
    } catch (error) {
        console.error('載入設定失敗:', error);
        Utils.showNotification('載入設定失敗，使用預設設定', 'warning');
    }
}

// 填充表單資料
function fillFormData() {
    // 帳號設定
    const displayNameInput = document.getElementById('displayName');
    const usernameInput = document.getElementById('username');
    const bioInput = document.getElementById('bio');
    const languageInput = document.getElementById('language');
    const timezoneInput = document.getElementById('timezone');
    
    if (displayNameInput) displayNameInput.value = userSettings.account.displayName || '';
    if (usernameInput) usernameInput.value = userSettings.account.username || '';
    if (bioInput) bioInput.value = userSettings.account.bio || '';
    if (languageInput) languageInput.value = userSettings.account.language || 'zh-TW';
    if (timezoneInput) timezoneInput.value = userSettings.account.timezone || 'Asia/Taipei';
    
    // 通知設定
    const notificationFrequencyInput = document.getElementById('notificationFrequency');
    if (notificationFrequencyInput) {
        notificationFrequencyInput.value = userSettings.notifications.frequency || 'daily';
    }
}

// 初始化事件監聽器
function initEventListeners() {
    // 帳號表單提交
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountSubmit);
    }
    
    // 密碼表單提交
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordSubmit);
    }
    
    // 隱私設定保存
    const privacyForm = document.getElementById('privacyForm');
    if (privacyForm) {
        privacyForm.addEventListener('submit', handlePrivacySubmit);
    }
    
    // 通知設定保存
    const notificationForm = document.getElementById('notificationForm');
    if (notificationForm) {
        notificationForm.addEventListener('submit', handleNotificationSubmit);
    }
}

// 顯示設定區段
function showSection(sectionName) {
    // 隱藏所有區段
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 移除所有導航連結的 active 狀態
    document.querySelectorAll('.settings-nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    // 顯示選中的區段
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // 更新導航連結狀態
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// 切換設定
function toggleSetting(element, settingKey) {
    element.classList.toggle('active');
    
    // 更新設定值
    const isActive = element.classList.contains('active');
    
    switch (settingKey) {
        case 'showProfile':
            userSettings.privacy.showProfile = isActive;
            break;
        case 'showStats':
            userSettings.privacy.showStats = isActive;
            break;
        case 'allowComments':
            userSettings.privacy.allowComments = isActive;
            break;
        case 'searchIndex':
            userSettings.privacy.searchIndex = isActive;
            break;
        case 'emailNotifications':
            userSettings.notifications.emailNotifications = isActive;
            break;
        case 'portfolioInteractions':
            userSettings.notifications.portfolioInteractions = isActive;
            break;
        case 'enterpriseViews':
            userSettings.notifications.enterpriseViews = isActive;
            break;
        case 'systemUpdates':
            userSettings.notifications.systemUpdates = isActive;
            break;
        case 'marketingMessages':
            userSettings.notifications.marketingMessages = isActive;
            break;
    }
    
    // 自動保存設定
    saveSettings();
}

// 更新切換開關狀態
function updateToggleStates() {
    updateToggleState('showProfile', userSettings.privacy.showProfile);
    updateToggleState('showStats', userSettings.privacy.showStats);
    updateToggleState('allowComments', userSettings.privacy.allowComments);
    updateToggleState('searchIndex', userSettings.privacy.searchIndex);
    updateToggleState('emailNotifications', userSettings.notifications.emailNotifications);
    updateToggleState('portfolioInteractions', userSettings.notifications.portfolioInteractions);
    updateToggleState('enterpriseViews', userSettings.notifications.enterpriseViews);
    updateToggleState('systemUpdates', userSettings.notifications.systemUpdates);
    updateToggleState('marketingMessages', userSettings.notifications.marketingMessages);
}

// 更新單個切換開關狀態
function updateToggleState(settingKey, isActive) {
    const element = document.querySelector(`[data-setting="${settingKey}"]`);
    if (element) {
        if (isActive) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    }
}

// 選擇隱私等級
function selectPrivacy(level) {
    userSettings.privacy.profileVisibility = level;
    
    // 更新UI
    document.querySelectorAll('.privacy-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    const selectedOption = document.querySelector(`[data-privacy="${level}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    // 自動保存設定
    saveSettings();
}

// 處理帳號表單提交
async function handleAccountSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const accountData = {
            displayName: formData.get('displayName'),
            username: formData.get('username'),
            bio: formData.get('bio'),
            language: formData.get('language'),
            timezone: formData.get('timezone')
        };
        
        // 驗證資料
        if (!accountData.displayName.trim()) {
            Utils.showNotification('請輸入顯示名稱', 'error');
            return;
        }
        
        if (!accountData.username.trim()) {
            Utils.showNotification('請輸入使用者名稱', 'error');
            return;
        }
        
        // 使用API服務更新個人資料（僅持久化可支援欄位）
        const profilePayload = {
            display_name: accountData.displayName,
            bio: accountData.bio,
            username: accountData.username
        };
        const response = await apiService.updateStudentProfile(profilePayload);
        
        if (response.success) {
            Utils.showNotification('帳號資料更新成功！', 'success');
            userSettings.account = { ...userSettings.account, ...accountData };
            // 同步更新偏好設定（語言、時區）
            await apiService.updateUserSettings('account', {
                language: accountData.language,
                timezone: accountData.timezone
            });
        } else {
            throw new Error(response.message || '更新失敗');
        }
        
    } catch (error) {
        console.error('更新帳號資料錯誤:', error);
        Utils.showNotification('更新失敗，請稍後再試', 'error');
    }
}

// 處理密碼表單提交
async function handlePasswordSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        
        // 驗證密碼
        if (!currentPassword) {
            Utils.showNotification('請輸入當前密碼', 'error');
            return;
        }
        
        if (!newPassword) {
            Utils.showNotification('請輸入新密碼', 'error');
            return;
        }
        
        if (newPassword.length < 8) {
            Utils.showNotification('新密碼至少需要8個字元', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            Utils.showNotification('新密碼與確認密碼不符', 'error');
            return;
        }
        
        // 使用API服務更新密碼
        const response = await apiService.updatePassword({
            currentPassword,
            newPassword
        });
        
        if (response.success) {
            Utils.showNotification('密碼更新成功！', 'success');
            e.target.reset();
        } else {
            throw new Error(response.message || '密碼更新失敗');
        }
        
    } catch (error) {
        console.error('更新密碼錯誤:', error);
        Utils.showNotification('密碼更新失敗，請稍後再試', 'error');
    }
}

// 處理隱私設定提交
async function handlePrivacySubmit(e) {
    e.preventDefault();
    
    try {
        await savePrivacySettings();
        Utils.showNotification('隱私設定更新成功！', 'success');
    } catch (error) {
        console.error('更新隱私設定錯誤:', error);
        Utils.showNotification('隱私設定更新失敗，請稍後再試', 'error');
    }
}

// 處理通知設定提交
async function handleNotificationSubmit(e) {
    e.preventDefault();
    
    try {
        await saveNotificationSettings();
        Utils.showNotification('通知設定更新成功！', 'success');
    } catch (error) {
        console.error('更新通知設定錯誤:', error);
        Utils.showNotification('通知設定更新失敗，請稍後再試', 'error');
    }
}

// 保存隱私設定
async function savePrivacySettings() {
    const privacyData = {
        profileVisibility: userSettings.privacy.profileVisibility,
        showProfile: userSettings.privacy.showProfile,
        showStats: userSettings.privacy.showStats,
        allowComments: userSettings.privacy.allowComments,
        searchIndex: userSettings.privacy.searchIndex
    };
    
    const response = await apiService.updateUserSettings('privacy', privacyData);
    
    if (!response.success) {
        throw new Error(response.message || '隱私設定更新失敗');
    }
    
    return response;
}

// 保存通知設定
async function saveNotificationSettings() {
    const notificationData = {
        emailNotifications: userSettings.notifications.emailNotifications,
        portfolioInteractions: userSettings.notifications.portfolioInteractions,
        enterpriseViews: userSettings.notifications.enterpriseViews,
        systemUpdates: userSettings.notifications.systemUpdates,
        marketingMessages: userSettings.notifications.marketingMessages,
        frequency: userSettings.notifications.frequency
    };
    
    const response = await apiService.updateUserSettings('notifications', notificationData);
    
    if (!response.success) {
        throw new Error(response.message || '通知設定更新失敗');
    }
    
    return response;
}

// 保存設定
async function saveSettings() {
    try {
        const response = await apiService.updateUserSettings('all', userSettings);
        
        if (!response.success) {
            throw new Error(response.message || '設定保存失敗');
        }
        
        return response;
    } catch (error) {
        console.error('保存設定錯誤:', error);
        throw error;
    }
}

// 設定雙重認證
async function setupTwoFactorAuth() {
    try {
        Utils.showNotification('正在設定雙重認證...', 'info');
        
        const response = await apiService.setupTwoFactorAuth();
        
        if (response.success) {
            Utils.showNotification('雙重認證設定成功！', 'success');
            userSettings.security.twoFactorAuth = true;
            updateToggleState('twoFactorAuth', true);
        } else {
            throw new Error(response.message || '雙重認證設定失敗');
        }
        
    } catch (error) {
        console.error('設定雙重認證錯誤:', error);
        Utils.showNotification('雙重認證設定失敗，請稍後再試', 'error');
    }
}

// 匯出資料
async function exportData() {
    try {
        Utils.showNotification('正在準備資料匯出...', 'info');
        
        const response = await apiService.exportUserData();
        
        if (response.success) {
            // 建立下載連結
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Utils.showNotification('資料匯出成功！', 'success');
        } else {
            throw new Error(response.message || '資料匯出失敗');
        }
        
    } catch (error) {
        console.error('匯出資料錯誤:', error);
        Utils.showNotification('資料匯出失敗，請稍後再試', 'error');
    }
}

// 停用帳號
async function deactivateAccount() {
    if (!confirm('確定要停用帳號嗎？停用後您將無法登入，但資料會保留。')) {
        return;
    }
    
    try {
        const response = await apiService.deactivateAccount();
        
        if (response.success) {
            Utils.showNotification('帳號已停用', 'success');
            try {
                localStorage.removeItem('user');
                sessionStorage.clear();
            } catch (e) {}
            setTimeout(() => {
                window.location.replace('../login.html');
            }, 2000);
        } else {
            throw new Error(response.message || '帳號停用失敗');
        }
        
    } catch (error) {
        console.error('停用帳號錯誤:', error);
        Utils.showNotification('帳號停用失敗，請稍後再試', 'error');
    }
}

// 刪除帳號
async function deleteAccount() {
    if (!confirm('確定要刪除帳號嗎？此操作無法復原，所有資料將被永久刪除。')) {
        return;
    }
    
    const password = prompt('請輸入您的密碼以確認刪除：');
    if (!password) {
        return;
    }
    
    try {
        const response = await apiService.deleteAccount({ password });
        
        if (response.success) {
            Utils.showNotification('帳號已刪除', 'success');
            try {
                localStorage.removeItem('user');
                sessionStorage.clear();
            } catch (e) {}
            setTimeout(() => {
                window.location.replace('../login.html');
            }, 2000);
        } else {
            throw new Error(response.message || '帳號刪除失敗');
        }
        
    } catch (error) {
        console.error('刪除帳號錯誤:', error);
        Utils.showNotification('帳號刪除失敗，請稍後再試', 'error');
    }
}

// 重置表單
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        fillFormData();
    }
}

// 全域函數供 HTML 使用
window.showSection = showSection;
window.toggleSetting = toggleSetting;
window.selectPrivacy = selectPrivacy;
window.setupTwoFactorAuth = setupTwoFactorAuth;
window.exportData = exportData;
window.deactivateAccount = deactivateAccount;
window.deleteAccount = deleteAccount;
window.resetForm = resetForm; 