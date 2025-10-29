/**
 * Portfolio+ 配置檔案
 * 用於控制應用程式的各種設定（真實 API）
 */

// 避免重複宣告
if (typeof window.APP_CONFIG === 'undefined') {
    window.APP_CONFIG = {
    // ==================== 核心設定 ====================
    
    
    // API 基礎 URL
    API_BASE_URL: '/api',
    
    // 應用程式版本
    VERSION: '2.0.2',
    
    // 環境設定
    ENVIRONMENT: 'development', // 'development', 'staging', 'production'
    
    // ==================== 功能開關 ====================
    
    // 是否啟用即時通知
    ENABLE_REALTIME_NOTIFICATIONS: false,
    
    // 是否啟用 WebSocket 連接
    ENABLE_WEBSOCKET: false,
    
    // 是否啟用離線模式
    ENABLE_OFFLINE_MODE: false,
    
    // 是否啟用 PWA 功能
    ENABLE_PWA: false,
    
    // ==================== 開發設定 ====================
    
    // 是否啟用除錯模式
    DEBUG_MODE: true,
    
    // 是否啟用詳細日誌
    VERBOSE_LOGGING: false,
    
    
    // ==================== UI 設定 ====================
    
    // 預設主題
    DEFAULT_THEME: 'light', // 'light', 'dark', 'auto'
    
    // 預設語言
    DEFAULT_LANGUAGE: 'zh-Hant', // 'zh-Hant', 'en'
    
    // 分頁大小
    PAGE_SIZE: 12,
    
    // 自動重新整理間隔 (秒)
    AUTO_REFRESH_INTERVAL: 30,
    
    // ==================== 安全設定 ====================
    
    // 是否啟用 HTTPS
    FORCE_HTTPS: false,
    
    // 會話超時時間 (分鐘)
    SESSION_TIMEOUT: 60,
    
    // 最大登入嘗試次數
    MAX_LOGIN_ATTEMPTS: 5,
    
    // ==================== 檔案上傳設定 ====================
    
    // 最大檔案大小 (MB)
    MAX_FILE_SIZE: 10,
    
    // 允許的檔案類型
    ALLOWED_FILE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    
    // 上傳目錄
    UPLOAD_DIRECTORY: '/uploads/',
    
    // ==================== 通知設定 ====================
    
    // 通知顯示時間 (秒)
    NOTIFICATION_DURATION: 5,
    
    // 是否啟用桌面通知
    ENABLE_DESKTOP_NOTIFICATIONS: false,
    
    // ==================== 分析設定 ====================
    
    // 是否啟用 Google Analytics
    ENABLE_ANALYTICS: false,
    
    // Google Analytics ID
    GA_TRACKING_ID: '',
    
    // 是否啟用錯誤追蹤
    ENABLE_ERROR_TRACKING: false
};
}

// ==================== 工具函數 ====================


/**
 * 取得 API 基礎 URL
 */
function getApiBaseUrl() {
    return APP_CONFIG.API_BASE_URL;
}

/**
 * 取得完整的 API URL
 */
function getApiUrl(endpoint) {
    const baseUrl = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${baseUrl}/${cleanEndpoint}`;
}

/**
 * 處理圖片載入錯誤
 * @param {HTMLImageElement} img - 圖片元素
 * @param {string} defaultUrl - 預設圖片 URL
 */
function handleImageError(img, defaultUrl = 'https://via.placeholder.com/400x200/667eea/ffffff?text=Portfolio') {
    if (img && img.src !== defaultUrl) {
        img.onerror = null; // 防止無限循環
        img.src = defaultUrl;
    }
}


/**
 * 記錄除錯訊息
 */
function debugLog(message, data = null) {
    if (APP_CONFIG.DEBUG_MODE) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        
        if (data) {
            console.log(logMessage, data);
        } else {
            console.log(logMessage);
        }
    }
}

/**
 * 記錄詳細日誌
 */
function verboseLog(message, data = null) {
    if (APP_CONFIG.VERBOSE_LOGGING) {
        debugLog(message, data);
    }
}

/**
 * 檢查是否使用假資料模式
 */
function isUsingMockData() {
    return false; // 此專案使用真實 API，不使用假資料
}

/**
 * 取得環境設定
 */
function getEnvironment() {
    return APP_CONFIG.ENVIRONMENT;
}

/**
 * 檢查是否為開發環境
 */
function isDevelopment() {
    return APP_CONFIG.ENVIRONMENT === 'development';
}

/**
 * 檢查是否為生產環境
 */
function isProduction() {
    return APP_CONFIG.ENVIRONMENT === 'production';
}

/**
 * 取得應用程式版本
 */
function getVersion() {
    return APP_CONFIG.VERSION;
}

/**
 * 檢查功能是否啟用
 */
function isFeatureEnabled(feature) {
    return APP_CONFIG[feature] === true;
}

/**
 * 取得設定值
 */
function getConfig(key) {
    return APP_CONFIG[key];
}

/**
 * 設定配置值
 */
function setConfig(key, value) {
    if (key in APP_CONFIG) {
        APP_CONFIG[key] = value;
        debugLog(`配置已更新: ${key} = ${value}`);
    } else {
        console.warn(`未知的配置鍵: ${key}`);
    }
}


/**
 * 初始化配置
 */
function initializeConfig() {
    debugLog('初始化應用程式配置...');
    
    // 檢查本地儲存的配置
    const savedConfig = localStorage.getItem('app_config');
    if (savedConfig) {
        try {
            const parsedConfig = JSON.parse(savedConfig);
            Object.assign(APP_CONFIG, parsedConfig);
            debugLog('已載入本地儲存的配置');
        } catch (error) {
            console.warn('載入本地配置失敗:', error);
        }
    }
    
    // 根據環境調整設定
    if (isProduction()) {
        APP_CONFIG.DEBUG_MODE = false;
        APP_CONFIG.VERBOSE_LOGGING = false;
    }
    
    // 自動檢測並設定 API Base URL
    const hostname = window.location.hostname;
    const isRailwayApp = hostname.includes('railway.app');
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isRailwayApp) {
        // Railway 生產環境：直接使用 /api
        APP_CONFIG.API_BASE_URL = '/api';
        APP_CONFIG.ENVIRONMENT = 'production';
        debugLog('檢測到 Railway 環境，使用 /api');
    } else if (isLocalhost) {
        // 本地開發環境：使用 /portfolio/api
        APP_CONFIG.API_BASE_URL = '/portfolio/api';
        APP_CONFIG.ENVIRONMENT = 'development';
        debugLog('檢測到本地環境，使用 /portfolio/api');
    } else {
        // 其他環境：保持原有設定
        APP_CONFIG.API_BASE_URL = APP_CONFIG.API_BASE_URL || '/api';
        debugLog('使用預設 API URL: ' + APP_CONFIG.API_BASE_URL);
    }
    
    // 強制覆蓋 localStorage 中的設定
    try {
        localStorage.setItem('app_config', JSON.stringify(APP_CONFIG));
    } catch (error) {
        console.warn('無法儲存配置到 localStorage:', error);
    }
    
    debugLog('配置初始化完成', {
        environment: getEnvironment(),
        version: getVersion()
    });
    
    // 注意：API 服務的初始化由 api-service.js 自己處理
    // 避免循環依賴問題
}

/**
 * 儲存配置到本地儲存
 */
function saveConfig() {
    try {
        localStorage.setItem('app_config', JSON.stringify(APP_CONFIG));
        debugLog('配置已儲存到本地儲存');
    } catch (error) {
        console.warn('儲存配置失敗:', error);
    }
}

/**
 * 重設配置為預設值
 */
function resetConfig() {
    // 重新載入預設配置
    location.reload();
}

// ==================== 全域函數 ====================

// 將工具函數暴露到全域
window.APP_CONFIG = APP_CONFIG;
window.getApiBaseUrl = getApiBaseUrl;
window.getApiUrl = getApiUrl;
window.debugLog = debugLog;
window.verboseLog = verboseLog;
window.isUsingMockData = isUsingMockData;
window.getEnvironment = getEnvironment;
window.isDevelopment = isDevelopment;
window.isProduction = isProduction;
window.getVersion = getVersion;
window.isFeatureEnabled = isFeatureEnabled;
window.getConfig = getConfig;
window.setConfig = setConfig;
window.initializeConfig = initializeConfig;
window.saveConfig = saveConfig;
window.resetConfig = resetConfig;

// 現在函數已經暴露到全域，可以安全地初始化配置
initializeConfig();

// 也監聽 DOMContentLoaded 事件作為備用
document.addEventListener('DOMContentLoaded', function() {
    // 配置已經初始化，這裡只是確保
    console.log('DOM 載入完成，配置已就緒');
});

// 匯出配置 (用於模組化)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APP_CONFIG,
        getApiBaseUrl,
        getApiUrl,
        debugLog,
        verboseLog,
        isUsingMockData,
        getEnvironment,
        isDevelopment,
        isProduction,
        getVersion,
        isFeatureEnabled,
        getConfig,
        setConfig,
        initializeConfig,
        saveConfig,
        resetConfig
    };
}
