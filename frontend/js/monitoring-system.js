/**
 * Portfolio+ 錯誤監控和日誌系統
 * 提供完整的錯誤追蹤、性能監控和日誌管理
 */

// 避免重複宣告
if (typeof window.MonitoringSystem === 'undefined') {
    window.MonitoringSystem = {
        
        // 配置
        config: {
            enableErrorTracking: true,
            enablePerformanceTracking: true,
            enableUserTracking: true,
            enableApiTracking: true,
            logLevel: 'info', // debug, info, warn, error
            maxLogEntries: 1000,
            sendToServer: true,
            get serverEndpoint() {
                const apiBase = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.API_BASE_URL) 
                    ? APP_CONFIG.API_BASE_URL 
                    : '/api';
                return `${apiBase}/monitoring.php`;
            }
        },
        
        // 日誌存儲
        logs: [],
        
        // 錯誤統計
        errorStats: {
            totalErrors: 0,
            errorsByType: {},
            errorsByPage: {},
            lastErrorTime: null
        },
        
        // 性能指標
        performanceMetrics: {
            pageLoadTimes: [],
            apiResponseTimes: [],
            memoryUsage: [],
            networkRequests: []
        },
        
        // 用戶行為追蹤
        userActions: [],
        
        /**
         * 初始化監控系統
         */
        init() {
            this.setupErrorHandlers();
            this.setupPerformanceTracking();
            this.setupUserTracking();
            this.setupApiTracking();
            this.startPeriodicReporting();
            
            console.log('監控系統已初始化');
        },
        
        /**
         * 設置錯誤處理器
         */
        setupErrorHandlers() {
            // 全局錯誤處理
            window.addEventListener('error', (event) => {
                this.trackError({
                    type: 'javascript_error',
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error ? event.error.stack : null,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    userAgent: navigator.userAgent
                });
            });
            
            // Promise拒絕處理
            window.addEventListener('unhandledrejection', (event) => {
                this.trackError({
                    type: 'promise_rejection',
                    message: event.reason ? event.reason.toString() : 'Unknown promise rejection',
                    stack: event.reason ? event.reason.stack : null,
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                });
            });
            
            // 資源載入錯誤
            window.addEventListener('error', (event) => {
                if (event.target !== window) {
                    this.trackError({
                        type: 'resource_error',
                        message: `Failed to load resource: ${event.target.src || event.target.href}`,
                        element: event.target.tagName,
                        src: event.target.src || event.target.href,
                        timestamp: new Date().toISOString(),
                        url: window.location.href
                    });
                }
            }, true);
        },
        
        /**
         * 設置性能追蹤
         */
        setupPerformanceTracking() {
            // 頁面載入時間
            window.addEventListener('load', () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.trackPerformance({
                        type: 'page_load',
                        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        firstPaint: this.getFirstPaint(),
                        timestamp: new Date().toISOString(),
                        url: window.location.href
                    });
                }
            });
            
            // 記憶體使用情況
            if ('memory' in performance) {
                setInterval(() => {
                    this.trackPerformance({
                        type: 'memory_usage',
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                        timestamp: new Date().toISOString()
                    });
                }, 30000); // 每30秒記錄一次
            }
        },
        
        /**
         * 設置用戶行為追蹤
         */
        setupUserTracking() {
            // 點擊追蹤
            document.addEventListener('click', (event) => {
                this.trackUserAction({
                    type: 'click',
                    element: event.target.tagName,
                    id: event.target.id,
                    className: event.target.className,
                    text: event.target.textContent ? event.target.textContent.slice(0, 100) : '',
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                });
            });
            
            // 表單提交追蹤
            document.addEventListener('submit', (event) => {
                this.trackUserAction({
                    type: 'form_submit',
                    formId: event.target.id,
                    formClass: event.target.className,
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                });
            });
            
            // 頁面瀏覽追蹤
            this.trackUserAction({
                type: 'page_view',
                url: window.location.href,
                referrer: document.referrer,
                timestamp: new Date().toISOString()
            });
        },
        
        /**
         * 設置API追蹤
         */
        setupApiTracking() {
            // 攔截fetch請求
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const startTime = performance.now();
                const url = args[0];
                
                try {
                    const response = await originalFetch(...args);
                    const endTime = performance.now();
                    
                    this.trackApiCall({
                        url: url,
                        method: args[1]?.method || 'GET',
                        status: response.status,
                        responseTime: endTime - startTime,
                        success: response.ok,
                        timestamp: new Date().toISOString()
                    });
                    
                    return response;
                } catch (error) {
                    const endTime = performance.now();
                    
                    this.trackApiCall({
                        url: url,
                        method: args[1]?.method || 'GET',
                        status: 0,
                        responseTime: endTime - startTime,
                        success: false,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    
                    throw error;
                }
            };
        },
        
        /**
         * 追蹤錯誤
         */
        trackError(errorData) {
            if (!this.config.enableErrorTracking) return;
            
            this.log('error', 'Error tracked', errorData);
            
            // 更新錯誤統計
            this.errorStats.totalErrors++;
            this.errorStats.errorsByType[errorData.type] = (this.errorStats.errorsByType[errorData.type] || 0) + 1;
            this.errorStats.errorsByPage[errorData.url] = (this.errorStats.errorsByPage[errorData.url] || 0) + 1;
            this.errorStats.lastErrorTime = new Date().toISOString();
            
            // 添加到日誌
            this.addLogEntry('error', errorData);
            
            // 立即發送到服務器（如果是嚴重錯誤）
            if (errorData.type === 'javascript_error' || errorData.type === 'promise_rejection') {
                this.sendToServer('error', errorData);
            }
        },
        
        /**
         * 追蹤性能指標
         */
        trackPerformance(perfData) {
            if (!this.config.enablePerformanceTracking) return;
            
            this.log('info', 'Performance tracked', perfData);
            
            // 添加到性能指標
            switch (perfData.type) {
                case 'page_load':
                    this.performanceMetrics.pageLoadTimes.push(perfData);
                    break;
                case 'api_response':
                    this.performanceMetrics.apiResponseTimes.push(perfData);
                    break;
                case 'memory_usage':
                    this.performanceMetrics.memoryUsage.push(perfData);
                    break;
            }
            
            // 限制數組大小
            this.limitArraySize(this.performanceMetrics.pageLoadTimes);
            this.limitArraySize(this.performanceMetrics.apiResponseTimes);
            this.limitArraySize(this.performanceMetrics.memoryUsage);
        },
        
        /**
         * 追蹤用戶行為
         */
        trackUserAction(actionData) {
            if (!this.config.enableUserTracking) return;
            
            this.log('debug', 'User action tracked', actionData);
            
            this.userActions.push(actionData);
            this.limitArraySize(this.userActions);
        },
        
        /**
         * 追蹤API調用
         */
        trackApiCall(apiData) {
            if (!this.config.enableApiTracking) return;
            
            this.log('info', 'API call tracked', apiData);
            
            this.performanceMetrics.networkRequests.push(apiData);
            this.limitArraySize(this.performanceMetrics.networkRequests);
        },
        
        /**
         * 記錄日誌
         */
        log(level, message, data = null) {
            const logEntry = {
                level: level,
                message: message,
                data: data,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };
            
            this.addLogEntry(level, logEntry);
            
            // 控制台輸出
            if (this.shouldLog(level)) {
                const consoleMethod = this.getConsoleMethod(level);
                consoleMethod(`[${level.toUpperCase()}] ${message}`, data);
            }
        },
        
        /**
         * 添加日誌條目
         */
        addLogEntry(level, entry) {
            this.logs.push(entry);
            
            // 限制日誌數量
            if (this.logs.length > this.config.maxLogEntries) {
                this.logs = this.logs.slice(-this.config.maxLogEntries);
            }
        },
        
        /**
         * 檢查是否應該記錄
         */
        shouldLog(level) {
            const levels = ['debug', 'info', 'warn', 'error'];
            const currentLevelIndex = levels.indexOf(this.config.logLevel);
            const messageLevelIndex = levels.indexOf(level);
            
            return messageLevelIndex >= currentLevelIndex;
        },
        
        /**
         * 獲取控制台方法
         */
        getConsoleMethod(level) {
            switch (level) {
                case 'debug': return console.debug;
                case 'info': return console.info;
                case 'warn': return console.warn;
                case 'error': return console.error;
                default: return console.log;
            }
        },
        
        /**
         * 限制數組大小
         */
        limitArraySize(array, maxSize = 100) {
            if (array.length > maxSize) {
                array.splice(0, array.length - maxSize);
            }
        },
        
        /**
         * 獲取首次繪製時間
         */
        getFirstPaint() {
            const paintEntries = performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            return firstPaint ? firstPaint.startTime : null;
        },
        
        /**
         * 發送到服務器
         */
        async sendToServer(type, data) {
            if (!this.config.sendToServer) return;
            
            try {
                const payload = {
                    type: type,
                    data: data,
                    timestamp: new Date().toISOString(),
                    sessionId: this.getSessionId(),
                    userId: this.getUserId()
                };
                
                await fetch(this.config.serverEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            } catch (error) {
                console.error('發送監控數據失敗:', error);
            }
        },
        
        /**
         * 定期報告
         */
        startPeriodicReporting() {
            // 每5分鐘發送一次統計數據
            setInterval(() => {
                this.sendPeriodicReport();
            }, 5 * 60 * 1000);
        },
        
        /**
         * 發送定期報告
         */
        async sendPeriodicReport() {
            const report = {
                errorStats: this.errorStats,
                performanceSummary: this.getPerformanceSummary(),
                userActionSummary: this.getUserActionSummary(),
                timestamp: new Date().toISOString()
            };
            
            await this.sendToServer('periodic_report', report);
        },
        
        /**
         * 獲取性能摘要
         */
        getPerformanceSummary() {
            const pageLoadTimes = this.performanceMetrics.pageLoadTimes;
            const apiResponseTimes = this.performanceMetrics.apiResponseTimes;
            
            return {
                averagePageLoadTime: this.calculateAverage(pageLoadTimes.map(p => p.loadTime)),
                averageApiResponseTime: this.calculateAverage(apiResponseTimes.map(a => a.responseTime)),
                totalApiCalls: apiResponseTimes.length,
                successfulApiCalls: apiResponseTimes.filter(a => a.success).length,
                memoryUsage: this.performanceMetrics.memoryUsage.slice(-1)[0]
            };
        },
        
        /**
         * 獲取用戶行為摘要
         */
        getUserActionSummary() {
            const actions = this.userActions;
            const actionTypes = {};
            
            actions.forEach(action => {
                actionTypes[action.type] = (actionTypes[action.type] || 0) + 1;
            });
            
            return {
                totalActions: actions.length,
                actionTypes: actionTypes,
                lastAction: actions.slice(-1)[0]
            };
        },
        
        /**
         * 計算平均值
         */
        calculateAverage(numbers) {
            if (numbers.length === 0) return 0;
            return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        },
        
        /**
         * 獲取會話ID
         */
        getSessionId() {
            let sessionId = sessionStorage.getItem('monitoring_session_id');
            if (!sessionId) {
                sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('monitoring_session_id', sessionId);
            }
            return sessionId;
        },
        
        /**
         * 獲取用戶ID
         */
        getUserId() {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                return user.id || 'anonymous';
            } catch (error) {
                return 'anonymous';
            }
        },
        
        /**
         * 獲取監控報告
         */
        getReport() {
            return {
                config: this.config,
                errorStats: this.errorStats,
                performanceMetrics: this.performanceMetrics,
                userActions: this.userActions.slice(-50), // 最近50個動作
                logs: this.logs.slice(-100), // 最近100條日誌
                timestamp: new Date().toISOString()
            };
        },
        
        /**
         * 清除所有數據
         */
        clearData() {
            this.logs = [];
            this.errorStats = {
                totalErrors: 0,
                errorsByType: {},
                errorsByPage: {},
                lastErrorTime: null
            };
            this.performanceMetrics = {
                pageLoadTimes: [],
                apiResponseTimes: [],
                memoryUsage: [],
                networkRequests: []
            };
            this.userActions = [];
            
            console.log('監控數據已清除');
        },
        
        /**
         * 導出數據
         */
        exportData() {
            const data = this.getReport();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `portfolio-monitoring-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };
}

// 自動初始化監控系統
document.addEventListener('DOMContentLoaded', function() {
    if (typeof MonitoringSystem !== 'undefined') {
        MonitoringSystem.init();
    }
});

// 將監控系統暴露到全域
window.MonitoringSystem = MonitoringSystem;

// 匯出監控系統 (用於模組化)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MonitoringSystem;
}
