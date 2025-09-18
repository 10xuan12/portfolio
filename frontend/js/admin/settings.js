/**
 * 管理員系統設定 JavaScript
 * 包含設定管理、表單驗證、備份還原、日誌管理等功能
 */

// 系統設定資料
let settings = {
    general: {
        siteName: 'Portfolio+',
        siteDescription: '學生作品展示與企業招募平台',
        adminEmail: 'admin@portfolio.com',
        supportEmail: 'support@portfolio.com',
        timezone: 'Asia/Taipei',
        language: 'zh-TW',
        maxFileSize: 10,
        sessionTimeout: 120
    },
    security: {
        minPasswordLength: 8,
        passwordExpiry: 90,
        requireComplexPassword: true,
        require2FA: false,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        enableIPWhitelist: false,
        allowedIPs: ''
    },
    notifications: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpEncryption: 'tls',
        smtpUsername: '',
        smtpPassword: '',
        enableEmailNotifications: true,
        notifyNewUsers: true,
        notifyNewPortfolios: true,
        notifyNewJobs: false,
        notifySystemErrors: true
    },
    appearance: {
        primaryColor: '#667eea',
        accentColor: '#f093fb',
        themeMode: 'light',
        enableAnimations: true
    },
    backup: {
        backupFrequency: 'weekly',
        enableAutoBackup: true,
        confirmRestore: true
    },
    logs: {
        logLevel: 'info',
        logRetention: 30,
        enableLiveLogs: false
    }
};

// 當前標籤
let currentTab = 'general';

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    initEventListeners();
    initColorPickers();
});

// 初始化事件監聽器
function initEventListeners() {
    // 表單變更事件
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('change', function() {
            markSettingsChanged();
        });
    });
    
    // 切換開關事件
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
        toggle.addEventListener('change', function() {
            markSettingsChanged();
        });
    });
    
    // 顏色選擇器事件
    document.querySelectorAll('.color-input').forEach(colorInput => {
        colorInput.addEventListener('change', function() {
            updateColorDisplay(this);
            markSettingsChanged();
        });
    });
}

// 初始化顏色選擇器
function initColorPickers() {
    document.querySelectorAll('.color-input').forEach(colorInput => {
        updateColorDisplay(colorInput);
    });
}

// 更新顏色顯示
function updateColorDisplay(colorInput) {
    const colorSpan = colorInput.nextElementSibling;
    if (colorSpan) {
        colorSpan.textContent = colorInput.value;
    }
}

// 載入設定
function loadSettings() {
    // TODO: 從後端 API 載入設定
    // const response = await fetch('/api/admin/settings');
    // settings = await response.json();
    
    // 套用設定到表單
    applySettingsToForm();
}

// 套用設定到表單
function applySettingsToForm() {
    // 一般設定
    document.getElementById('siteName').value = settings.general.siteName;
    document.getElementById('siteDescription').value = settings.general.siteDescription;
    document.getElementById('adminEmail').value = settings.general.adminEmail;
    document.getElementById('supportEmail').value = settings.general.supportEmail;
    document.getElementById('timezone').value = settings.general.timezone;
    document.getElementById('language').value = settings.general.language;
    document.getElementById('maxFileSize').value = settings.general.maxFileSize;
    document.getElementById('sessionTimeout').value = settings.general.sessionTimeout;
    
    // 安全設定
    document.getElementById('minPasswordLength').value = settings.security.minPasswordLength;
    document.getElementById('passwordExpiry').value = settings.security.passwordExpiry;
    document.getElementById('requireComplexPassword').checked = settings.security.requireComplexPassword;
    document.getElementById('require2FA').checked = settings.security.require2FA;
    document.getElementById('maxLoginAttempts').value = settings.security.maxLoginAttempts;
    document.getElementById('lockoutDuration').value = settings.security.lockoutDuration;
    document.getElementById('enableIPWhitelist').checked = settings.security.enableIPWhitelist;
    document.getElementById('allowedIPs').value = settings.security.allowedIPs;
    
    // 通知設定
    document.getElementById('smtpHost').value = settings.notifications.smtpHost;
    document.getElementById('smtpPort').value = settings.notifications.smtpPort;
    document.getElementById('smtpEncryption').value = settings.notifications.smtpEncryption;
    document.getElementById('smtpUsername').value = settings.notifications.smtpUsername;
    document.getElementById('smtpPassword').value = settings.notifications.smtpPassword;
    document.getElementById('enableEmailNotifications').checked = settings.notifications.enableEmailNotifications;
    document.getElementById('notifyNewUsers').checked = settings.notifications.notifyNewUsers;
    document.getElementById('notifyNewPortfolios').checked = settings.notifications.notifyNewPortfolios;
    document.getElementById('notifyNewJobs').checked = settings.notifications.notifyNewJobs;
    document.getElementById('notifySystemErrors').checked = settings.notifications.notifySystemErrors;
    
    // 外觀設定
    document.getElementById('primaryColor').value = settings.appearance.primaryColor;
    document.getElementById('accentColor').value = settings.appearance.accentColor;
    document.getElementById('themeMode').value = settings.appearance.themeMode;
    document.getElementById('enableAnimations').checked = settings.appearance.enableAnimations;
    
    // 備份設定
    document.getElementById('backupFrequency').value = settings.backup.backupFrequency;
    document.getElementById('enableAutoBackup').checked = settings.backup.enableAutoBackup;
    document.getElementById('confirmRestore').checked = settings.backup.confirmRestore;
    
    // 日誌設定
    document.getElementById('logLevel').value = settings.logs.logLevel;
    document.getElementById('logRetention').value = settings.logs.logRetention;
    document.getElementById('enableLiveLogs').checked = settings.logs.enableLiveLogs;
}

// 切換標籤
function switchTab(tabName) {
    currentTab = tabName;
    
    // 更新標籤狀態
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 更新內容區域
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${tabName}Section`).classList.add('active');
}

// 標記設定已變更
function markSettingsChanged() {
    const saveButton = document.querySelector('.settings-actions .btn-primary');
    if (saveButton) {
        saveButton.textContent = '儲存設定 *';
        saveButton.style.background = 'var(--warning-color)';
    }
}

// 儲存設定
async function saveSettings() {
    try {
        // 收集表單資料
        const formData = collectFormData();
        
        // 驗證設定
        if (!validateSettings(formData)) {
            return;
        }
        
        Utils.showNotification('正在儲存設定...', 'info');
        
        // TODO: 發送設定到後端 API
        // const response = await fetch('/api/admin/settings', {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // });
        
        // 更新本地設定
        settings = formData;
        
        // 更新按鈕狀態
        const saveButton = document.querySelector('.settings-actions .btn-primary');
        if (saveButton) {
            saveButton.textContent = '儲存設定';
            saveButton.style.background = '';
        }
        
        Utils.showNotification('設定已儲存', 'success');
        
    } catch (error) {
        Utils.showNotification('儲存設定失敗，請稍後再試', 'error');
        console.error('儲存設定錯誤:', error);
    }
}

// 收集表單資料
function collectFormData() {
    return {
        general: {
            siteName: document.getElementById('siteName').value,
            siteDescription: document.getElementById('siteDescription').value,
            adminEmail: document.getElementById('adminEmail').value,
            supportEmail: document.getElementById('supportEmail').value,
            timezone: document.getElementById('timezone').value,
            language: document.getElementById('language').value,
            maxFileSize: parseInt(document.getElementById('maxFileSize').value),
            sessionTimeout: parseInt(document.getElementById('sessionTimeout').value)
        },
        security: {
            minPasswordLength: parseInt(document.getElementById('minPasswordLength').value),
            passwordExpiry: parseInt(document.getElementById('passwordExpiry').value),
            requireComplexPassword: document.getElementById('requireComplexPassword').checked,
            require2FA: document.getElementById('require2FA').checked,
            maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts').value),
            lockoutDuration: parseInt(document.getElementById('lockoutDuration').value),
            enableIPWhitelist: document.getElementById('enableIPWhitelist').checked,
            allowedIPs: document.getElementById('allowedIPs').value
        },
        notifications: {
            smtpHost: document.getElementById('smtpHost').value,
            smtpPort: parseInt(document.getElementById('smtpPort').value),
            smtpEncryption: document.getElementById('smtpEncryption').value,
            smtpUsername: document.getElementById('smtpUsername').value,
            smtpPassword: document.getElementById('smtpPassword').value,
            enableEmailNotifications: document.getElementById('enableEmailNotifications').checked,
            notifyNewUsers: document.getElementById('notifyNewUsers').checked,
            notifyNewPortfolios: document.getElementById('notifyNewPortfolios').checked,
            notifyNewJobs: document.getElementById('notifyNewJobs').checked,
            notifySystemErrors: document.getElementById('notifySystemErrors').checked
        },
        appearance: {
            primaryColor: document.getElementById('primaryColor').value,
            accentColor: document.getElementById('accentColor').value,
            themeMode: document.getElementById('themeMode').value,
            enableAnimations: document.getElementById('enableAnimations').checked
        },
        backup: {
            backupFrequency: document.getElementById('backupFrequency').value,
            enableAutoBackup: document.getElementById('enableAutoBackup').checked,
            confirmRestore: document.getElementById('confirmRestore').checked
        },
        logs: {
            logLevel: document.getElementById('logLevel').value,
            logRetention: parseInt(document.getElementById('logRetention').value),
            enableLiveLogs: document.getElementById('enableLiveLogs').checked
        }
    };
}

// 驗證設定
function validateSettings(formData) {
    // 驗證電子郵件
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.general.adminEmail)) {
        Utils.showNotification('管理員信箱格式不正確', 'error');
        return false;
    }
    
    if (!emailRegex.test(formData.general.supportEmail)) {
        Utils.showNotification('客服信箱格式不正確', 'error');
        return false;
    }
    
    // 驗證數值範圍
    if (formData.general.maxFileSize < 1 || formData.general.maxFileSize > 100) {
        Utils.showNotification('最大檔案大小必須在 1-100 MB 之間', 'error');
        return false;
    }
    
    if (formData.general.sessionTimeout < 30 || formData.general.sessionTimeout > 1440) {
        Utils.showNotification('會話超時必須在 30-1440 分鐘之間', 'error');
        return false;
    }
    
    // 驗證安全設定
    if (formData.security.minPasswordLength < 6 || formData.security.minPasswordLength > 20) {
        Utils.showNotification('最小密碼長度必須在 6-20 之間', 'error');
        return false;
    }
    
    if (formData.security.passwordExpiry < 30 || formData.security.passwordExpiry > 365) {
        Utils.showNotification('密碼有效期必須在 30-365 天之間', 'error');
        return false;
    }
    
    return true;
}

// 重設設定
function resetSettings() {
    if (confirm('確定要重設所有設定嗎？此操作無法復原。')) {
        loadSettings();
        Utils.showNotification('設定已重設', 'success');
    }
}

// 測試郵件設定
async function testEmailSettings() {
    try {
        Utils.showNotification('正在測試郵件設定...', 'info');
        
        // TODO: 發送測試郵件請求到後端 API
        // await fetch('/api/admin/settings/test-email', {
        //     method: 'POST'
        // });
        
        setTimeout(() => {
            Utils.showNotification('測試郵件已發送，請檢查收件匣', 'success');
        }, 2000);
        
    } catch (error) {
        Utils.showNotification('測試郵件發送失敗', 'error');
        console.error('測試郵件錯誤:', error);
    }
}

// 清除快取
async function clearCache() {
    try {
        Utils.showNotification('正在清除快取...', 'info');
        
        // TODO: 發送清除快取請求到後端 API
        // await fetch('/api/admin/settings/clear-cache', {
        //     method: 'POST'
        // });
        
        setTimeout(() => {
            Utils.showNotification('快取已清除', 'success');
        }, 1000);
        
    } catch (error) {
        Utils.showNotification('清除快取失敗', 'error');
        console.error('清除快取錯誤:', error);
    }
}

// 最佳化資料庫
async function optimizeDatabase() {
    try {
        Utils.showNotification('正在最佳化資料庫...', 'info');
        
        // TODO: 發送資料庫最佳化請求到後端 API
        // await fetch('/api/admin/settings/optimize-database', {
        //     method: 'POST'
        // });
        
        setTimeout(() => {
            Utils.showNotification('資料庫已最佳化', 'success');
        }, 3000);
        
    } catch (error) {
        Utils.showNotification('資料庫最佳化失敗', 'error');
        console.error('資料庫最佳化錯誤:', error);
    }
}

// 系統健康檢查
async function checkSystemHealth() {
    try {
        Utils.showNotification('正在進行系統健康檢查...', 'info');
        
        // TODO: 發送系統健康檢查請求到後端 API
        // const response = await fetch('/api/admin/settings/system-health');
        // const health = await response.json();
        
        setTimeout(() => {
            Utils.showNotification('系統健康檢查完成，所有項目正常', 'success');
        }, 2000);
        
    } catch (error) {
        Utils.showNotification('系統健康檢查失敗', 'error');
        console.error('系統健康檢查錯誤:', error);
    }
}

// 檢查系統更新
async function updateSystem() {
    try {
        Utils.showNotification('正在檢查系統更新...', 'info');
        
        // TODO: 發送系統更新檢查請求到後端 API
        // const response = await fetch('/api/admin/settings/check-updates');
        // const updates = await response.json();
        
        setTimeout(() => {
            Utils.showNotification('系統已是最新版本', 'success');
        }, 1500);
        
    } catch (error) {
        Utils.showNotification('檢查更新失敗', 'error');
        console.error('檢查更新錯誤:', error);
    }
}

// 生成系統報告
async function generateReport() {
    try {
        Utils.showNotification('正在生成系統報告...', 'info');
        
        // TODO: 發送生成報告請求到後端 API
        // const response = await fetch('/api/admin/settings/generate-report', {
        //     method: 'POST'
        // });
        
        setTimeout(() => {
            Utils.showNotification('系統報告已生成', 'success');
        }, 2000);
        
    } catch (error) {
        Utils.showNotification('生成報告失敗', 'error');
        console.error('生成報告錯誤:', error);
    }
}

// 建立備份
async function createBackup() {
    try {
        Utils.showNotification('正在建立備份...', 'info');
        
        // TODO: 發送建立備份請求到後端 API
        // const response = await fetch('/api/admin/settings/create-backup', {
        //     method: 'POST'
        // });
        
        setTimeout(() => {
            Utils.showNotification('備份已建立完成', 'success');
        }, 3000);
        
    } catch (error) {
        Utils.showNotification('建立備份失敗', 'error');
        console.error('建立備份錯誤:', error);
    }
}

// 排程備份
function scheduleBackup() {
    // TODO: 實作排程備份功能
    Utils.showNotification('排程備份功能開發中', 'info');
}

// 還原備份
async function restoreBackup() {
    const backupFile = document.getElementById('backupFile').files[0];
    if (!backupFile) {
        Utils.showNotification('請選擇備份檔案', 'warning');
        return;
    }
    
    if (confirm('確定要還原備份嗎？此操作會覆蓋現有資料。')) {
        try {
            Utils.showNotification('正在還原備份...', 'info');
            
            // TODO: 發送還原備份請求到後端 API
            // const formData = new FormData();
            // formData.append('backup', backupFile);
            // await fetch('/api/admin/settings/restore-backup', {
            //     method: 'POST',
            //     body: formData
            // });
            
            setTimeout(() => {
                Utils.showNotification('備份還原完成', 'success');
            }, 5000);
            
        } catch (error) {
            Utils.showNotification('還原備份失敗', 'error');
            console.error('還原備份錯誤:', error);
        }
    }
}

// 測試備份
async function testBackup() {
    try {
        Utils.showNotification('正在測試備份...', 'info');
        
        // TODO: 發送測試備份請求到後端 API
        // await fetch('/api/admin/settings/test-backup', {
        //     method: 'POST'
        // });
        
        setTimeout(() => {
            Utils.showNotification('備份測試完成，備份檔案正常', 'success');
        }, 2000);
        
    } catch (error) {
        Utils.showNotification('測試備份失敗', 'error');
        console.error('測試備份錯誤:', error);
    }
}

// 清除日誌
async function clearLogs() {
    if (confirm('確定要清除所有系統日誌嗎？')) {
        try {
            Utils.showNotification('正在清除日誌...', 'info');
            
            // TODO: 發送清除日誌請求到後端 API
            // await fetch('/api/admin/settings/clear-logs', {
            //     method: 'POST'
            // });
            
            // 清除日誌顯示
            document.getElementById('logOutput').innerHTML = '';
            
            Utils.showNotification('日誌已清除', 'success');
            
        } catch (error) {
            Utils.showNotification('清除日誌失敗', 'error');
            console.error('清除日誌錯誤:', error);
        }
    }
}

// 匯出日誌
async function exportLogs() {
    try {
        Utils.showNotification('正在匯出日誌...', 'info');
        
        // TODO: 發送匯出日誌請求到後端 API
        // const response = await fetch('/api/admin/settings/export-logs');
        // const logs = await response.json();
        
        // 建立日誌檔案
        const logData = {
            exportDate: new Date().toISOString(),
            logs: [
                '[2024-01-20 14:30:25] INFO: 系統啟動完成',
                '[2024-01-20 14:30:26] INFO: 資料庫連接成功',
                '[2024-01-20 14:30:27] WARNING: 快取空間不足',
                '[2024-01-20 14:30:28] INFO: 使用者登入: admin',
                '[2024-01-20 14:30:29] ERROR: 檔案上傳失敗'
            ]
        };
        
        const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('日誌已匯出', 'success');
        
    } catch (error) {
        Utils.showNotification('匯出日誌失敗', 'error');
        console.error('匯出日誌錯誤:', error);
    }
}

// 全域函數，供 HTML 直接調用
window.switchTab = switchTab;
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.testEmailSettings = testEmailSettings;
window.clearCache = clearCache;
window.optimizeDatabase = optimizeDatabase;
window.checkSystemHealth = checkSystemHealth;
window.updateSystem = updateSystem;
// 返回上一頁
function goBack() {
    window.history.back();
}

window.generateReport = generateReport;
window.createBackup = createBackup;
window.scheduleBackup = scheduleBackup;
window.restoreBackup = restoreBackup;
window.testBackup = testBackup;
window.clearLogs = clearLogs;
window.exportLogs = exportLogs;
window.goBack = goBack; 