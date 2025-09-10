/**
 * Portfolio+ 學生端整合測試
 * 用於驗證前端與後端API的整合情況
 */

// 避免重複宣告
if (typeof window.IntegrationTest === 'undefined') {
    window.IntegrationTest = {
        
        /**
         * 執行完整的整合測試
         */
        async runFullTest() {
            console.log('🚀 開始執行學生端整合測試...');
            
            const results = {
                apiService: await this.testApiService(),
                authentication: await this.testAuthentication(),
                dataConsistency: await this.testDataConsistency(),
                errorHandling: await this.testErrorHandling(),
                frontendIntegration: await this.testFrontendIntegration()
            };
            
            this.displayResults(results);
            return results;
        },
        
        /**
         * 測試API服務
         */
        async testApiService() {
            console.log('📡 測試API服務...');
            const results = [];
            
            try {
                // 測試API服務初始化
                if (typeof apiService !== 'undefined' && apiService) {
                    results.push({ test: 'API服務初始化', status: 'PASS', message: 'API服務已正確初始化' });
                } else {
                    results.push({ test: 'API服務初始化', status: 'FAIL', message: 'API服務未初始化' });
                }
                
                // 測試配置
                if (typeof getApiBaseUrl === 'function') {
                    const baseUrl = getApiBaseUrl();
                    results.push({ test: 'API基礎URL', status: 'PASS', message: `基礎URL: ${baseUrl}` });
                } else {
                    results.push({ test: 'API基礎URL', status: 'FAIL', message: '無法取得API基礎URL' });
                }
                
                // 測試假資料模式
                if (typeof isUsingMockData === 'function') {
                    const useMock = isUsingMockData();
                    results.push({ test: '假資料模式', status: 'PASS', message: `使用${useMock ? '假資料' : '真實API'}` });
                } else {
                    results.push({ test: '假資料模式', status: 'FAIL', message: '無法檢查假資料模式' });
                }
                
            } catch (error) {
                results.push({ test: 'API服務測試', status: 'ERROR', message: error.message });
            }
            
            return results;
        },
        
        /**
         * 測試認證機制
         */
        async testAuthentication() {
            console.log('🔐 測試認證機制...');
            const results = [];
            
            try {
                // 測試認證狀態檢查
                if (typeof apiService !== 'undefined' && apiService.checkAuthStatus) {
                    const authStatus = await apiService.checkAuthStatus();
                    results.push({ 
                        test: '認證狀態檢查', 
                        status: authStatus.success ? 'PASS' : 'WARN', 
                        message: authStatus.message 
                    });
                } else {
                    results.push({ test: '認證狀態檢查', status: 'FAIL', message: '認證檢查方法不存在' });
                }
                
                // 測試用戶信息獲取
                if (typeof apiService !== 'undefined' && apiService.getCurrentUser) {
                    const user = apiService.getCurrentUser();
                    results.push({ 
                        test: '用戶信息獲取', 
                        status: user ? 'PASS' : 'WARN', 
                        message: user ? `用戶: ${user.username}` : '未登入' 
                    });
                } else {
                    results.push({ test: '用戶信息獲取', status: 'FAIL', message: '用戶信息獲取方法不存在' });
                }
                
                // 測試localStorage
                const userData = localStorage.getItem('user');
                const token = localStorage.getItem('auth_token');
                results.push({ 
                    test: '本地儲存', 
                    status: userData && token ? 'PASS' : 'WARN', 
                    message: userData ? '用戶數據已儲存' : '未儲存用戶數據' 
                });
                
            } catch (error) {
                results.push({ test: '認證測試', status: 'ERROR', message: error.message });
            }
            
            return results;
        },
        
        /**
         * 測試數據一致性
         */
        async testDataConsistency() {
            console.log('📊 測試數據一致性...');
            const results = [];
            
            try {
                // 測試通知API
                if (typeof apiService !== 'undefined' && apiService.getNotifications) {
                    const notifications = await apiService.getNotifications();
                    const hasConsistentFormat = notifications && 
                        typeof notifications.success === 'boolean' && 
                        Array.isArray(notifications.data);
                    
                    results.push({ 
                        test: '通知API格式', 
                        status: hasConsistentFormat ? 'PASS' : 'FAIL', 
                        message: hasConsistentFormat ? '數據格式一致' : '數據格式不一致' 
                    });
                } else {
                    results.push({ test: '通知API格式', status: 'SKIP', message: '通知API不可用' });
                }
                
                // 測試活動API
                if (typeof apiService !== 'undefined' && apiService.getActivities) {
                    const activities = await apiService.getActivities();
                    const hasConsistentFormat = activities && 
                        typeof activities.success === 'boolean' && 
                        Array.isArray(activities.data);
                    
                    results.push({ 
                        test: '活動API格式', 
                        status: hasConsistentFormat ? 'PASS' : 'FAIL', 
                        message: hasConsistentFormat ? '數據格式一致' : '數據格式不一致' 
                    });
                } else {
                    results.push({ test: '活動API格式', status: 'SKIP', message: '活動API不可用' });
                }
                
                // 測試徽章API
                if (typeof apiService !== 'undefined' && apiService.getBadges) {
                    const badges = await apiService.getBadges();
                    const hasConsistentFormat = badges && 
                        typeof badges.success === 'boolean' && 
                        Array.isArray(badges.data);
                    
                    results.push({ 
                        test: '徽章API格式', 
                        status: hasConsistentFormat ? 'PASS' : 'FAIL', 
                        message: hasConsistentFormat ? '數據格式一致' : '數據格式不一致' 
                    });
                } else {
                    results.push({ test: '徽章API格式', status: 'SKIP', message: '徽章API不可用' });
                }
                
            } catch (error) {
                results.push({ test: '數據一致性測試', status: 'ERROR', message: error.message });
            }
            
            return results;
        },
        
        /**
         * 測試錯誤處理
         */
        async testErrorHandling() {
            console.log('⚠️ 測試錯誤處理...');
            const results = [];
            
            try {
                // 測試Utils工具類
                if (typeof Utils !== 'undefined') {
                    results.push({ test: 'Utils工具類', status: 'PASS', message: 'Utils工具類已載入' });
                    
                    // 測試錯誤處理方法
                    if (typeof Utils.handleApiError === 'function') {
                        results.push({ test: '錯誤處理方法', status: 'PASS', message: '錯誤處理方法可用' });
                    } else {
                        results.push({ test: '錯誤處理方法', status: 'FAIL', message: '錯誤處理方法不存在' });
                    }
                    
                    // 測試通知顯示
                    if (typeof Utils.showNotification === 'function') {
                        results.push({ test: '通知顯示', status: 'PASS', message: '通知顯示方法可用' });
                    } else {
                        results.push({ test: '通知顯示', status: 'FAIL', message: '通知顯示方法不存在' });
                    }
                } else {
                    results.push({ test: 'Utils工具類', status: 'FAIL', message: 'Utils工具類未載入' });
                }
                
                // 測試API錯誤處理
                if (typeof apiService !== 'undefined' && apiService.handleApiError) {
                    results.push({ test: 'API錯誤處理', status: 'PASS', message: 'API錯誤處理方法可用' });
                } else {
                    results.push({ test: 'API錯誤處理', status: 'FAIL', message: 'API錯誤處理方法不存在' });
                }
                
            } catch (error) {
                results.push({ test: '錯誤處理測試', status: 'ERROR', message: error.message });
            }
            
            return results;
        },
        
        /**
         * 測試前端整合
         */
        async testFrontendIntegration() {
            console.log('🎨 測試前端整合...');
            const results = [];
            
            try {
                // 檢查必要的JavaScript文件
                const requiredFiles = [
                    'api-service.js',
                    'config.js',
                    'utils.js'
                ];
                
                for (const file of requiredFiles) {
                    const script = document.querySelector(`script[src*="${file}"]`);
                    if (script) {
                        results.push({ test: `載入${file}`, status: 'PASS', message: `${file}已載入` });
                    } else {
                        results.push({ test: `載入${file}`, status: 'WARN', message: `${file}未找到` });
                    }
                }
                
                // 檢查學生端JavaScript文件
                const studentFiles = [
                    'dashboard.js',
                    'portfolio.js',
                    'notifications.js',
                    'profile.js'
                ];
                
                for (const file of studentFiles) {
                    const script = document.querySelector(`script[src*="student/${file}"]`);
                    if (script) {
                        results.push({ test: `載入學生端${file}`, status: 'PASS', message: `${file}已載入` });
                    } else {
                        results.push({ test: `載入學生端${file}`, status: 'WARN', message: `${file}未找到` });
                    }
                }
                
                // 檢查全域變數
                const globalVars = ['apiService', 'Utils', 'APP_CONFIG'];
                for (const varName of globalVars) {
                    if (typeof window[varName] !== 'undefined') {
                        results.push({ test: `全域變數${varName}`, status: 'PASS', message: `${varName}已定義` });
                    } else {
                        results.push({ test: `全域變數${varName}`, status: 'FAIL', message: `${varName}未定義` });
                    }
                }
                
            } catch (error) {
                results.push({ test: '前端整合測試', status: 'ERROR', message: error.message });
            }
            
            return results;
        },
        
        /**
         * 顯示測試結果
         */
        displayResults(results) {
            console.log('\n📋 整合測試結果:');
            console.log('='.repeat(50));
            
            let totalTests = 0;
            let passedTests = 0;
            let failedTests = 0;
            let warningTests = 0;
            let errorTests = 0;
            
            for (const category in results) {
                console.log(`\n🔍 ${category.toUpperCase()}:`);
                console.log('-'.repeat(30));
                
                for (const test of results[category]) {
                    totalTests++;
                    const status = test.status;
                    const icon = this.getStatusIcon(status);
                    
                    console.log(`${icon} ${test.test}: ${test.message}`);
                    
                    switch (status) {
                        case 'PASS': passedTests++; break;
                        case 'FAIL': failedTests++; break;
                        case 'WARN': warningTests++; break;
                        case 'ERROR': errorTests++; break;
                    }
                }
            }
            
            console.log('\n📊 測試摘要:');
            console.log('='.repeat(50));
            console.log(`總測試數: ${totalTests}`);
            console.log(`✅ 通過: ${passedTests}`);
            console.log(`❌ 失敗: ${failedTests}`);
            console.log(`⚠️ 警告: ${warningTests}`);
            console.log(`🚨 錯誤: ${errorTests}`);
            
            const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
            console.log(`\n🎯 成功率: ${successRate}%`);
            
            if (successRate >= 80) {
                console.log('🎉 整合狀況良好！');
            } else if (successRate >= 60) {
                console.log('⚠️ 整合狀況需要改進');
            } else {
                console.log('🚨 整合狀況需要緊急修復');
            }
        },
        
        /**
         * 取得狀態圖標
         */
        getStatusIcon(status) {
            const icons = {
                'PASS': '✅',
                'FAIL': '❌',
                'WARN': '⚠️',
                'ERROR': '🚨',
                'SKIP': '⏭️'
            };
            return icons[status] || '❓';
        },
        
        /**
         * 快速測試
         */
        async quickTest() {
            console.log('⚡ 執行快速整合測試...');
            
            const quickResults = {
                apiService: typeof apiService !== 'undefined' && apiService ? 'PASS' : 'FAIL',
                utils: typeof Utils !== 'undefined' ? 'PASS' : 'FAIL',
                config: typeof APP_CONFIG !== 'undefined' ? 'PASS' : 'FAIL',
                auth: typeof apiService !== 'undefined' && apiService.checkAuthStatus ? 'PASS' : 'FAIL'
            };
            
            console.log('快速測試結果:', quickResults);
            return quickResults;
        }
    };
}

// 將測試工具暴露到全域
window.runIntegrationTest = () => IntegrationTest.runFullTest();
window.runQuickTest = () => IntegrationTest.quickTest();

// 自動執行快速測試（如果不在生產環境）
if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ENVIRONMENT === 'development') {
    console.log('🔧 開發環境檢測到，執行快速整合測試...');
    setTimeout(() => {
        IntegrationTest.quickTest();
    }, 1000);
}
