/**
 * 管理員統計分析 JavaScript
 * 包含圖表渲染、資料分析、匯出功能等
 */

// Chart.js 圖表實例
let mainChart = null;
let pieChart = null;

// 當前圖表類型
let currentChartType = 'users';

// 分析資料
let analyticsData = {
    users: {
        labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
        datasets: [{
            label: '學生',
            data: [120, 150, 180, 220, 280, 320],
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4
        }, {
            label: '企業',
            data: [20, 25, 30, 35, 40, 45],
            borderColor: '#f093fb',
            backgroundColor: 'rgba(240, 147, 251, 0.1)',
            tension: 0.4
        }]
    },
    portfolios: {
        labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
        datasets: [{
            label: '網頁設計',
            data: [45, 52, 68, 85, 102, 125],
            borderColor: '#4facfe',
            backgroundColor: 'rgba(79, 172, 254, 0.1)',
            tension: 0.4
        }, {
            label: '行動應用',
            data: [25, 32, 45, 58, 72, 89],
            borderColor: '#43e97b',
            backgroundColor: 'rgba(67, 233, 123, 0.1)',
            tension: 0.4
        }]
    },
    jobs: {
        labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
        datasets: [{
            label: '實習職缺',
            data: [8, 12, 15, 18, 22, 25],
            borderColor: '#fa709a',
            backgroundColor: 'rgba(250, 112, 154, 0.1)',
            tension: 0.4
        }, {
            label: '正職職缺',
            data: [5, 8, 12, 15, 18, 22],
            borderColor: '#fee140',
            backgroundColor: 'rgba(254, 225, 64, 0.1)',
            tension: 0.4
        }]
    },
    pieData: {
        labels: ['學生', '企業', '管理員'],
        datasets: [{
            data: [890, 156, 5],
            backgroundColor: [
                '#667eea',
                '#f093fb',
                '#4facfe'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    }
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDateRange();
    initEventListeners();
    loadAnalyticsData().then(() => {
        initializeCharts();
        updateStatsCards();
    });
});

// 從 API 載入分析資料
async function loadAnalyticsData() {
    try {
        const trends = await apiService.getAnalytics('trends');
        const data = trends?.data || trends;
        if (data && data.users && data.portfolios && data.jobs && data.pieData) {
            analyticsData = data;
            return;
        }
        // 兼容不同回傳結構，盡量映射
        const labels = data?.labels || ['1月','2月','3月','4月','5月','6月'];
        analyticsData = {
            users: { labels, datasets: data?.users?.datasets || analyticsData.users.datasets },
            portfolios: { labels, datasets: data?.portfolios?.datasets || analyticsData.portfolios.datasets },
            jobs: { labels, datasets: data?.jobs?.datasets || analyticsData.jobs.datasets },
            pieData: data?.pieData || analyticsData.pieData
        };
    } catch (e) {
        console.warn('載入分析資料失敗，使用預設資料。', e);
    }
}

// 初始化事件監聽器
function initEventListeners() {
    // 日期範圍變更
    document.getElementById('dateRange').addEventListener('change', function() {
        updateDateRange();
    });
    
    // 開始日期變更
    document.getElementById('startDate').addEventListener('change', function() {
        updateCharts();
    });
    
    // 結束日期變更
    document.getElementById('endDate').addEventListener('change', function() {
        updateCharts();
    });
}

// 初始化圖表
function initializeCharts() {
    // 主要圖表
    const mainCtx = document.getElementById('mainChart').getContext('2d');
    mainChart = new Chart(mainCtx, {
        type: 'line',
        data: analyticsData.users,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: '使用者成長趨勢'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });

    // 圓餅圖
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: analyticsData.pieData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: '使用者分布'
                }
            }
        }
    });
}

// 設定預設日期範圍
function setDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
}

// 更新日期範圍
function updateDateRange() {
    const range = document.getElementById('dateRange').value;
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
        case '7':
            startDate.setDate(endDate.getDate() - 7);
            break;
        case '30':
            startDate.setDate(endDate.getDate() - 30);
            break;
        case '90':
            startDate.setDate(endDate.getDate() - 90);
            break;
        case '365':
            startDate.setDate(endDate.getDate() - 365);
            break;
    }
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    
    updateCharts();
}

// 更新圖表
async function updateCharts() {
    try {
        Utils.showNotification('正在更新圖表...', 'info');
        const start = document.getElementById('startDate').value;
        const end = document.getElementById('endDate').value;
        const filters = { start, end, type: currentChartType };
        const resp = await apiService.getAnalytics('trends');
        const data = resp?.data || resp;
        if (data && data[currentChartType]) {
            analyticsData[currentChartType] = data[currentChartType];
        }
        if (data?.pieData) {
            analyticsData.pieData = data.pieData;
        }
        if (mainChart) {
            mainChart.data = analyticsData[currentChartType];
            mainChart.options.plugins.title.text = getChartTitle(currentChartType);
            mainChart.update();
        }
        if (pieChart) {
            pieChart.data = analyticsData.pieData;
            pieChart.update();
        }
        Utils.showNotification('圖表已更新', 'success');
    } catch (e) {
        console.error('更新圖表失敗:', e);
        // 失敗則維持既有假資料刷新
        if (mainChart) {
            mainChart.data = analyticsData[currentChartType];
            mainChart.update();
        }
        if (pieChart) {
            pieChart.update();
        }
        Utils.showNotification('使用暫存資料更新圖表', 'warning');
    }
}

// 切換圖表類型
function switchChart(type) {
    currentChartType = type;
    
    // 更新按鈕狀態
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 更新圖表資料
    if (mainChart && analyticsData[type]) {
        mainChart.data = analyticsData[type];
        mainChart.options.plugins.title.text = getChartTitle(type);
        mainChart.update();
    }
}

// 取得圖表標題
function getChartTitle(type) {
    const titles = {
        'users': '使用者成長趨勢',
        'portfolios': '作品上傳趨勢',
        'jobs': '職缺發布趨勢'
    };
    return titles[type] || '統計趨勢';
}

// 更新圖表類型
function updateChartType() {
    const chartType = document.getElementById('chartType').value;
    
    if (mainChart) {
        mainChart.config.type = chartType;
        mainChart.update();
    }
    
    if (pieChart) {
        pieChart.config.type = chartType;
        pieChart.update();
    }
}

// 重新整理分析資料
async function refreshAnalytics() {
    Utils.showNotification('正在重新整理分析資料...', 'info');
    await loadAnalyticsData();
    updateStatsCards();
    await updateCharts();
}

// 更新統計卡片
async function updateStatsCards() {
    try {
        const resp = await apiService.getAdminDashboard();
        const data = resp?.data || resp;
        const stats = data?.stats || {};
        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length >= 4) {
            statNumbers[0].textContent = Utils.formatNumber(stats.totalUsers || 0);
            statNumbers[1].textContent = Utils.formatNumber(stats.totalPortfolios || 0);
            statNumbers[2].textContent = Utils.formatNumber(stats.totalJobs || 0);
            statNumbers[3].textContent = Utils.formatNumber(stats.thisMonthUsers || 0);
        }
    } catch (e) {
        console.warn('載入統計卡片失敗，使用預設值。', e);
    }
}

// 匯出分析報告
function exportAnalytics() {
    try {
        const data = {
            exportDate: new Date().toISOString(),
            dateRange: {
                start: document.getElementById('startDate').value,
                end: document.getElementById('endDate').value
            },
            analytics: {
                users: analyticsData.users,
                portfolios: analyticsData.portfolios,
                jobs: analyticsData.jobs,
                pieData: analyticsData.pieData
            },
            summary: {
                totalUsers: 1234,
                totalPortfolios: 2345,
                activeJobs: 89,
                todayActivity: 456
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('分析報告已匯出', 'success');
    } catch (error) {
        Utils.showNotification('匯出失敗，請稍後再試', 'error');
        console.error('匯出分析報告錯誤:', error);
    }
}

// 匯出特定報告
function exportReport(type) {
    try {
        let reportData = {};
        let fileName = '';
        
        switch (type) {
            case 'users':
                reportData = {
                    type: 'users',
                    title: '使用者分析報告',
                    data: analyticsData.users,
                    summary: {
                        totalUsers: 1234,
                        students: 890,
                        enterprises: 156,
                        admins: 5
                    }
                };
                fileName = 'users-analysis';
                break;
                
            case 'portfolios':
                reportData = {
                    type: 'portfolios',
                    title: '作品分析報告',
                    data: analyticsData.portfolios,
                    summary: {
                        totalPortfolios: 2345,
                        webDesign: 1234,
                        mobileApp: 567,
                        uiuxDesign: 345,
                        dataAnalysis: 199
                    }
                };
                fileName = 'portfolios-analysis';
                break;
                
            case 'jobs':
                reportData = {
                    type: 'jobs',
                    title: '職缺分析報告',
                    data: analyticsData.jobs,
                    summary: {
                        totalJobs: 89,
                        internships: 45,
                        fulltime: 32,
                        parttime: 12
                    }
                };
                fileName = 'jobs-analysis';
                break;
                
            case 'activity':
                reportData = {
                    type: 'activity',
                    title: '活動分析報告',
                    data: {
                        dailyActivity: [120, 145, 167, 189, 234, 256, 289],
                        userEngagement: 78.5,
                        averageSessionTime: '12分鐘',
                        bounceRate: '23%'
                    },
                    summary: {
                        totalActivity: 456,
                        activeUsers: 234,
                        newRegistrations: 23
                    }
                };
                fileName = 'activity-analysis';
                break;
        }
        
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification(`${reportData.title}已匯出`, 'success');
    } catch (error) {
        Utils.showNotification('匯出失敗，請稍後再試', 'error');
        console.error('匯出報告錯誤:', error);
    }
}

// 生成 PDF 報告
async function generatePDFReport() {
    try {
        const svc = await ensureApiServiceReady();
        Utils.showNotification('正在生成 PDF 報告...', 'info');
        
        // API: POST /api/admin/reports/generate-pdf
        const response = await svc.generatePDFReport();
        const data = response?.data || response;
        
        // 下載 PDF
        if (data.url) {
            const link = document.createElement('a');
            link.href = data.url;
            link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
        }
        
        Utils.showNotification('PDF 報告已生成', 'success');
    } catch (error) {
        Utils.showNotification('生成 PDF 失敗', 'error');
        console.error(error);
    }
}

// 生成 Excel 報告
async function generateExcelReport() {
    try {
        const svc = await ensureApiServiceReady();
        Utils.showNotification('正在生成 Excel 報告...', 'info');
        
        // API: POST /api/admin/reports/generate-excel
        const response = await svc.generateExcelReport();
        const data = response?.data || response;
        
        // 下載 Excel
        if (data.url) {
            const link = document.createElement('a');
            link.href = data.url;
            link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
        }
        
        Utils.showNotification('Excel 報告已生成', 'success');
    } catch (error) {
        Utils.showNotification('生成 Excel 失敗', 'error');
        console.error(error);
    }
}

// 分享報告
async function shareReport() {
    try {
        const svc = await ensureApiServiceReady();
        
        // API: POST /api/admin/reports/generate-share-link
        const response = await svc.generateShareLink();
        const shareUrl = response?.data?.url || window.location.href;
        
        // 使用 Web Share API（現代瀏覽器支援）
        if (navigator.share) {
            await navigator.share({
                title: '平台數據分析報告',
                text: '查看最新的平台統計數據',
                url: shareUrl
            });
            Utils.showNotification('報告分享成功', 'success');
        } else {
            showShareDialog(shareUrl);
        }
    } catch (error) {
        console.error(error);
        showShareDialog(window.location.href);
    }
}

// 顯示分享對話框
function showShareDialog(shareUrl) {
    prompt('複製以下連結進行分享：', shareUrl);
    Utils.showNotification('連結已複製', 'info');
}

// 全域函數，供 HTML 直接調用
window.switchChart = switchChart;
window.updateDateRange = updateDateRange;
window.updateCharts = updateCharts;
window.updateChartType = updateChartType;
window.refreshAnalytics = refreshAnalytics;
window.exportAnalytics = exportAnalytics;
window.exportReport = exportReport;
window.generatePDFReport = generatePDFReport;
window.generateExcelReport = generateExcelReport;
window.shareReport = shareReport; 