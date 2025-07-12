/**
 * 學生設定頁面 JavaScript
 * 包含設定管理、表單處理、切換功能等
 */

// TODO: 從後端 API 載入使用者設定
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
function loadUserSettings() {
    // TODO: 從後端 API 載入設定
    // const response = await fetch('/api/user/settings');
    // userSettings = await response.json();
    
    // 填充表單資料
    document.getElementById('displayName').value = userSettings.account.displayName;
    document.getElementById('username').value = userSettings.account.username;
    document.getElementById('bio').value = userSettings.account.bio;
    document.getElementById('language').value = userSettings.account.language;
    document.getElementById('timezone').value = userSettings.account.timezone;
    document.getElementById('notificationFrequency').value = userSettings.notifications.frequency;
    
    // 更新切換開關狀態
    updateToggleStates();
}

// 初始化事件監聽器
function initEventListeners() {
    // 帳號表單提交
    document.getElementById('accountForm').addEventListener('submit', handleAccountSubmit);
    
    // 密碼表單提交
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordSubmit);
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
    document.getElementById(sectionName + 'Section').classList.add('active');
    
    // 更新導航連結狀態
    event.target.classList.add('active');
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
        case 'twoFactorAuth':
            userSettings.security.twoFactorAuth = isActive;
            if (isActive) {
                setupTwoFactorAuth();
            }
            break;
    }
    
    Utils.showNotification('設定已更新', 'success');
}

// 更新切換開關狀態
function updateToggleStates() {
    // 隱私設定
    updateToggleState('showProfile', userSettings.privacy.showProfile);
    updateToggleState('showStats', userSettings.privacy.showStats);
    updateToggleState('allowComments', userSettings.privacy.allowComments);
    updateToggleState('searchIndex', userSettings.privacy.searchIndex);
    
    // 通知設定
    updateToggleState('emailNotifications', userSettings.notifications.emailNotifications);
    updateToggleState('portfolioInteractions', userSettings.notifications.portfolioInteractions);
    updateToggleState('enterpriseViews', userSettings.notifications.enterpriseViews);
    updateToggleState('systemUpdates', userSettings.notifications.systemUpdates);
    updateToggleState('marketingMessages', userSettings.notifications.marketingMessages);
    
    // 安全設定
    updateToggleState('twoFactorAuth', userSettings.security.twoFactorAuth);
}

// 更新單個切換開關狀態
function updateToggleState(settingKey, isActive) {
    const toggle = document.querySelector(`[onclick*="${settingKey}"]`);
    if (toggle) {
        if (isActive) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    }
}

// 選擇隱私設定
function selectPrivacy(level) {
    // 移除所有選中狀態
    document.querySelectorAll('.privacy-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 選中當前選項
    event.target.closest('.privacy-option').classList.add('selected');
    
    // 更新設定
    userSettings.privacy.profileVisibility = level;
    
    Utils.showNotification('隱私設定已更新', 'success');
}

// 處理帳號表單提交
async function handleAccountSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const accountData = {
        displayName: formData.get('displayName'),
        bio: formData.get('bio'),
        language: formData.get('language'),
        timezone: formData.get('timezone')
    };
    
    try {
        // TODO: 發送更新請求到後端 API
        // const response = await fetch('/api/user/account', {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(accountData)
        // });
        
        // 更新本地設定
        Object.assign(userSettings.account, accountData);
        
        Utils.showNotification('帳號設定已更新', 'success');
    } catch (error) {
        Utils.showNotification('更新失敗，請稍後再試', 'error');
        console.error('更新帳號設定錯誤:', error);
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
        // const response = await fetch('/api/user/password', {
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

// 儲存隱私設定
async function savePrivacySettings() {
    try {
        // TODO: 發送隱私設定更新請求到後端 API
        // const response = await fetch('/api/user/privacy', {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(userSettings.privacy)
        // });
        
        Utils.showNotification('隱私設定已儲存', 'success');
    } catch (error) {
        Utils.showNotification('儲存失敗，請稍後再試', 'error');
        console.error('儲存隱私設定錯誤:', error);
    }
}

// 儲存通知設定
async function saveNotificationSettings() {
    const frequency = document.getElementById('notificationFrequency').value;
    userSettings.notifications.frequency = frequency;
    
    try {
        // TODO: 發送通知設定更新請求到後端 API
        // const response = await fetch('/api/user/notifications', {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(userSettings.notifications)
        // });
        
        Utils.showNotification('通知設定已儲存', 'success');
    } catch (error) {
        Utils.showNotification('儲存失敗，請稍後再試', 'error');
        console.error('儲存通知設定錯誤:', error);
    }
}

// 設定雙重認證
function setupTwoFactorAuth() {
    // TODO: 實作雙重認證設定流程
    Utils.showNotification('雙重認證設定功能開發中', 'info');
}

// 匯出資料
function exportData() {
    const exportData = {
        user: userSettings,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `user_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    Utils.showNotification('資料已匯出', 'success');
}

// 停用帳號
function deactivateAccount() {
    if (confirm('確定要停用您的帳號嗎？您可以隨時重新啟用。')) {
        // TODO: 發送停用帳號請求到後端 API
        // fetch('/api/user/deactivate', { method: 'POST' });
        
        Utils.showNotification('帳號已停用', 'success');
        
        // 跳轉到登出頁面
        setTimeout(() => {
            window.location.href = '../login.html';
        }, 2000);
    }
}

// 刪除帳號
function deleteAccount() {
    if (confirm('確定要永久刪除您的帳號嗎？此操作無法復原，所有資料將被永久刪除。')) {
        const password = prompt('請輸入您的密碼以確認刪除：');
        if (password) {
            // TODO: 發送刪除帳號請求到後端 API
            // fetch('/api/user/delete', {
            //     method: 'DELETE',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ password })
            // });
            
            Utils.showNotification('帳號已刪除', 'success');
            
            // 跳轉到首頁
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
        }
    }
}

// 重置表單
function resetForm() {
    if (confirm('確定要重置所有變更嗎？')) {
        loadUserSettings();
        Utils.showNotification('表單已重置', 'info');
    }
}

// 全域函數供 HTML 使用
window.showSection = showSection;
window.toggleSetting = toggleSetting;
window.selectPrivacy = selectPrivacy;
window.savePrivacySettings = savePrivacySettings;
window.saveNotificationSettings = saveNotificationSettings;
window.exportData = exportData;
window.deactivateAccount = deactivateAccount;
window.deleteAccount = deleteAccount;
window.resetForm = resetForm; 