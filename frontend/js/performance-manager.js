/**
 * Portfolio+ 性能優化管理器
 * 提供資源管理、性能監控和優化建議
 */

// 避免重複宣告
if (typeof window.PerformanceManager === 'undefined') {
    window.PerformanceManager = {
        
        // 性能指標
        metrics: {
            pageLoadTime: 0,
            domContentLoaded: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            firstInputDelay: 0,
            totalBlockingTime: 0
        },
        
        // 資源使用情況
        resourceUsage: {
            memoryUsage: 0,
            networkRequests: 0,
            cacheHitRate: 0,
            apiResponseTime: 0
        },
        
        // 優化建議
        optimizationSuggestions: [],
        
        /**
         * 初始化性能管理器
         */
        init() {
            this.measurePageLoadPerformance();
            this.setupResourceMonitoring();
            this.setupPerformanceObserver();
            this.startPerformanceTracking();
            
            console.log('性能管理器已初始化');
        },
        
        /**
         * 測量頁面載入性能
         */
        measurePageLoadPerformance() {
            window.addEventListener('load', () => {
                // 使用 Performance API 獲取詳細指標
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart;
                    this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
                }
                
                // 獲取繪製指標
                const paintEntries = performance.getEntriesByType('paint');
                paintEntries.forEach(entry => {
                    switch (entry.name) {
                        case 'first-paint':
                            this.metrics.firstPaint = entry.startTime;
                            break;
                        case 'first-contentful-paint':
                            this.metrics.firstContentfulPaint = entry.startTime;
                            break;
                    }
                });
                
                // 獲取LCP
                const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
                if (lcpEntries.length > 0) {
                    this.metrics.largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
                }
                
                this.analyzePerformance();
            });
        },
        
        /**
         * 設置資源監控
         */
        setupResourceMonitoring() {
            // 監控記憶體使用
            if ('memory' in performance) {
                setInterval(() => {
                    this.resourceUsage.memoryUsage = performance.memory.usedJSHeapSize;
                    this.checkMemoryUsage();
                }, 30000); // 每30秒檢查一次
            }
            
            // 監控網路請求
            this.setupNetworkMonitoring();
        },
        
        /**
         * 設置網路監控
         */
        setupNetworkMonitoring() {
            const originalFetch = window.fetch;
            let requestCount = 0;
            let totalResponseTime = 0;
            
            window.fetch = async (...args) => {
                requestCount++;
                const startTime = performance.now();
                
                try {
                    const response = await originalFetch(...args);
                    const endTime = performance.now();
                    const responseTime = endTime - startTime;
                    
                    totalResponseTime += responseTime;
                    this.resourceUsage.apiResponseTime = totalResponseTime / requestCount;
                    this.resourceUsage.networkRequests = requestCount;
                    
                    return response;
                } catch (error) {
                    const endTime = performance.now();
                    const responseTime = endTime - startTime;
                    totalResponseTime += responseTime;
                    
                    throw error;
                }
            };
        },
        
        /**
         * 設置性能觀察器
         */
        setupPerformanceObserver() {
            if ('PerformanceObserver' in window) {
                // 觀察LCP
                try {
                    const lcpObserver = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        this.metrics.largestContentfulPaint = lastEntry.startTime;
                    });
                    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                } catch (e) {
                    console.warn('LCP觀察器不支持:', e);
                }
                
                // 觀察CLS
                try {
                    const clsObserver = new PerformanceObserver((list) => {
                        let clsValue = 0;
                        for (const entry of list.getEntries()) {
                            if (!entry.hadRecentInput) {
                                clsValue += entry.value;
                            }
                        }
                        this.metrics.cumulativeLayoutShift = clsValue;
                    });
                    clsObserver.observe({ entryTypes: ['layout-shift'] });
                } catch (e) {
                    console.warn('CLS觀察器不支持:', e);
                }
                
                // 觀察FID
                try {
                    const fidObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
                        }
                    });
                    fidObserver.observe({ entryTypes: ['first-input'] });
                } catch (e) {
                    console.warn('FID觀察器不支持:', e);
                }
            }
        },
        
        /**
         * 開始性能追蹤
         */
        startPerformanceTracking() {
            // 每分鐘收集一次性能數據
            setInterval(() => {
                this.collectPerformanceData();
            }, 60000);
        },
        
        /**
         * 收集性能數據
         */
        collectPerformanceData() {
            const data = {
                metrics: this.metrics,
                resourceUsage: this.resourceUsage,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };
            
            // 發送到監控系統
            if (typeof MonitoringSystem !== 'undefined') {
                MonitoringSystem.trackPerformance(data);
            }
            
            // 檢查是否需要優化
            this.checkOptimizationNeeds();
        },
        
        /**
         * 分析性能
         */
        analyzePerformance() {
            this.optimizationSuggestions = [];
            
            // 頁面載入時間分析
            if (this.metrics.pageLoadTime > 3000) {
                this.optimizationSuggestions.push({
                    type: 'page_load',
                    severity: 'high',
                    message: '頁面載入時間過長，建議優化資源載入',
                    suggestion: '考慮使用代碼分割、延遲載入或CDN加速'
                });
            }
            
            // 首次繪製時間分析
            if (this.metrics.firstPaint > 1500) {
                this.optimizationSuggestions.push({
                    type: 'first_paint',
                    severity: 'medium',
                    message: '首次繪製時間較長',
                    suggestion: '優化關鍵渲染路徑，減少阻塞資源'
                });
            }
            
            // LCP分析
            if (this.metrics.largestContentfulPaint > 2500) {
                this.optimizationSuggestions.push({
                    type: 'lcp',
                    severity: 'high',
                    message: '最大內容繪製時間過長',
                    suggestion: '優化圖片載入、使用預載入或優化服務器響應時間'
                });
            }
            
            // CLS分析
            if (this.metrics.cumulativeLayoutShift > 0.1) {
                this.optimizationSuggestions.push({
                    type: 'cls',
                    severity: 'medium',
                    message: '累積佈局偏移較大',
                    suggestion: '為圖片和廣告預留空間，避免動態插入內容'
                });
            }
            
            // FID分析
            if (this.metrics.firstInputDelay > 100) {
                this.optimizationSuggestions.push({
                    type: 'fid',
                    severity: 'medium',
                    message: '首次輸入延遲較大',
                    suggestion: '減少JavaScript執行時間，使用Web Workers'
                });
            }
        },
        
        /**
         * 檢查記憶體使用
         */
        checkMemoryUsage() {
            if (this.resourceUsage.memoryUsage > 50 * 1024 * 1024) { // 50MB
                this.optimizationSuggestions.push({
                    type: 'memory',
                    severity: 'medium',
                    message: '記憶體使用量較高',
                    suggestion: '檢查記憶體洩漏，清理不需要的對象和事件監聽器'
                });
            }
        },
        
        /**
         * 檢查優化需求
         */
        checkOptimizationNeeds() {
            // 檢查API響應時間
            if (this.resourceUsage.apiResponseTime > 1000) {
                this.optimizationSuggestions.push({
                    type: 'api_response',
                    severity: 'medium',
                    message: 'API響應時間較長',
                    suggestion: '優化後端查詢、添加緩存或使用CDN'
                });
            }
            
            // 檢查網路請求數量
            if (this.resourceUsage.networkRequests > 50) {
                this.optimizationSuggestions.push({
                    type: 'network_requests',
                    severity: 'low',
                    message: '網路請求數量較多',
                    suggestion: '合併請求、使用HTTP/2或減少不必要的請求'
                });
            }
        },
        
        /**
         * 優化建議
         */
        getOptimizationSuggestions() {
            return this.optimizationSuggestions;
        },
        
        /**
         * 應用優化建議
         */
        applyOptimizations() {
            const suggestions = this.getOptimizationSuggestions();
            
            suggestions.forEach(suggestion => {
                switch (suggestion.type) {
                    case 'page_load':
                        this.optimizePageLoad();
                        break;
                    case 'first_paint':
                        this.optimizeFirstPaint();
                        break;
                    case 'lcp':
                        this.optimizeLCP();
                        break;
                    case 'cls':
                        this.optimizeCLS();
                        break;
                    case 'memory':
                        this.optimizeMemory();
                        break;
                }
            });
        },
        
        /**
         * 優化頁面載入
         */
        optimizePageLoad() {
            // 預載入關鍵資源
            this.preloadCriticalResources();
            
            // 延遲載入非關鍵資源
            this.deferNonCriticalResources();
        },
        
        /**
         * 預載入關鍵資源
         */
        preloadCriticalResources() {
            const criticalResources = [
                '/portfolio/frontend/css/app.css',
                '/portfolio/frontend/js/config.js',
                '/portfolio/frontend/js/api-service.js'
            ];
            
            criticalResources.forEach(resource => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource;
                link.as = resource.endsWith('.css') ? 'style' : 'script';
                document.head.appendChild(link);
            });
        },
        
        /**
         * 延遲載入非關鍵資源
         */
        deferNonCriticalResources() {
            const nonCriticalScripts = document.querySelectorAll('script[data-defer]');
            nonCriticalScripts.forEach(script => {
                script.defer = true;
            });
        },
        
        /**
         * 優化首次繪製
         */
        optimizeFirstPaint() {
            // 內聯關鍵CSS
            this.inlineCriticalCSS();
            
            // 移除阻塞渲染的腳本
            this.removeRenderBlockingScripts();
        },
        
        /**
         * 內聯關鍵CSS
         */
        inlineCriticalCSS() {
            // 這裡可以實現關鍵CSS的內聯
            console.log('內聯關鍵CSS');
        },
        
        /**
         * 移除阻塞渲染的腳本
         */
        removeRenderBlockingScripts() {
            const scripts = document.querySelectorAll('script:not([async]):not([defer])');
            scripts.forEach(script => {
                if (!script.src.includes('critical')) {
                    script.defer = true;
                }
            });
        },
        
        /**
         * 優化LCP
         */
        optimizeLCP() {
            // 優化圖片載入
            this.optimizeImageLoading();
            
            // 使用預載入
            this.preloadLCPResources();
        },
        
        /**
         * 優化圖片載入
         */
        optimizeImageLoading() {
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        },
        
        /**
         * 預載入LCP資源
         */
        preloadLCPResources() {
            const lcpElement = document.querySelector('img, video, [style*="background-image"]');
            if (lcpElement) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = lcpElement.src || lcpElement.getAttribute('data-src');
                link.as = lcpElement.tagName.toLowerCase();
                document.head.appendChild(link);
            }
        },
        
        /**
         * 優化CLS
         */
        optimizeCLS() {
            // 為圖片預留空間
            this.reserveImageSpace();
            
            // 避免動態插入內容
            this.avoidDynamicContent();
        },
        
        /**
         * 為圖片預留空間
         */
        reserveImageSpace() {
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                if (!img.style.aspectRatio && img.naturalWidth && img.naturalHeight) {
                    img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
                }
            });
        },
        
        /**
         * 避免動態插入內容
         */
        avoidDynamicContent() {
            // 在頁面載入完成後再插入動態內容
            window.addEventListener('load', () => {
                setTimeout(() => {
                    // 插入動態內容
                    this.insertDynamicContent();
                }, 100);
            });
        },
        
        /**
         * 插入動態內容
         */
        insertDynamicContent() {
            // 這裡可以實現動態內容的插入
            console.log('插入動態內容');
        },
        
        /**
         * 優化記憶體
         */
        optimizeMemory() {
            // 清理事件監聽器
            this.cleanupEventListeners();
            
            // 清理緩存
            this.cleanupCache();
        },
        
        /**
         * 清理事件監聽器
         */
        cleanupEventListeners() {
            // 移除不需要的事件監聽器
            const elements = document.querySelectorAll('[data-cleanup]');
            elements.forEach(element => {
                element.removeEventListener('click', element._clickHandler);
                delete element._clickHandler;
            });
        },
        
        /**
         * 清理緩存
         */
        cleanupCache() {
            if (typeof apiService !== 'undefined' && apiService.clearCache) {
                apiService.clearCache();
            }
        },
        
        /**
         * 獲取性能報告
         */
        getPerformanceReport() {
            return {
                metrics: this.metrics,
                resourceUsage: this.resourceUsage,
                suggestions: this.optimizationSuggestions,
                timestamp: new Date().toISOString(),
                score: this.calculatePerformanceScore()
            };
        },
        
        /**
         * 計算性能分數
         */
        calculatePerformanceScore() {
            let score = 100;
            
            // 根據各項指標扣分
            if (this.metrics.pageLoadTime > 3000) score -= 20;
            if (this.metrics.firstPaint > 1500) score -= 15;
            if (this.metrics.largestContentfulPaint > 2500) score -= 20;
            if (this.metrics.cumulativeLayoutShift > 0.1) score -= 15;
            if (this.metrics.firstInputDelay > 100) score -= 10;
            if (this.resourceUsage.apiResponseTime > 1000) score -= 10;
            if (this.resourceUsage.memoryUsage > 50 * 1024 * 1024) score -= 10;
            
            return Math.max(0, score);
        },
        
        /**
         * 導出性能報告
         */
        exportPerformanceReport() {
            const report = this.getPerformanceReport();
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `portfolio-performance-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };
}

// 自動初始化性能管理器
document.addEventListener('DOMContentLoaded', function() {
    if (typeof PerformanceManager !== 'undefined') {
        PerformanceManager.init();
    }
});

// 將性能管理器暴露到全域
window.PerformanceManager = PerformanceManager;

// 匯出性能管理器 (用於模組化)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceManager;
}
