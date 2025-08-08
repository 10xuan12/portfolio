/**
 * 企業分析頁面 JavaScript
 */

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeAnalytics();
    setupEventListeners();
});

/**
 * 初始化分析頁面
 */
function initializeAnalytics() {
    // 使用統一假資料
    const analyticsData = {
        stats: MockData.stats.enterprise,
        trends: MockData.analytics.trends,
        skills: MockData.analytics.skills,
        departments: MockData.analytics.departments,
        popularPortfolios: MockData.analytics.popularPortfolios
    };
    
    updateStats(analyticsData.stats);
    updateSkillsChart(analyticsData.skills);
    updateDepartmentChart(analyticsData.departments);
    updatePopularPortfolios(analyticsData.popularPortfolios);
    setupCharts(analyticsData.trends);
}

/**
 * 設定事件監聽器
 */
function setupEventListeners() {
    // 圖表週期選擇
    const chartPeriod = document.querySelector('.chart-period');
    if (chartPeriod) {
        chartPeriod.addEventListener('change', function() {
            updateTrendChart(this.value);
        });
    }

    // 重新整理按鈕
    const refreshBtn = document.querySelector('.btn-primary');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshAnalytics);
    }
}

/**
 * 更新統計資料
 */
function updateStats(stats) {
    // 更新統計數字
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = MockData.formatNumber(stats.total_views);
        statNumbers[1].textContent = MockData.formatNumber(stats.total_favorites);
        statNumbers[2].textContent = MockData.formatNumber(stats.total_contacts);
        statNumbers[3].textContent = MockData.formatNumber(stats.total_jobs);
    }
}

/**
 * 更新技能圖表
 */
function updateSkillsChart(skills) {
    const skillsChart = document.querySelector('.skills-chart');
    if (!skillsChart) return;

    skillsChart.innerHTML = '';
    
    skills.forEach(skill => {
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';
        skillItem.innerHTML = `
            <span class="skill-name">${skill.name}</span>
            <div class="skill-bar">
                <div class="skill-progress" style="width: ${skill.percentage}%"></div>
            </div>
            <span class="skill-percentage">${skill.percentage}%</span>
        `;
        skillsChart.appendChild(skillItem);
    });
}

/**
 * 更新科系分布圖表
 */
function updateDepartmentChart(departments) {
    const departmentChart = document.querySelector('.department-chart');
    if (!departmentChart) return;

    departmentChart.innerHTML = '';
    
    departments.forEach(dept => {
        const deptItem = document.createElement('div');
        deptItem.className = 'department-item';
        deptItem.innerHTML = `
            <span class="department-name">${dept.name}</span>
            <div class="department-bar">
                <div class="department-progress" style="width: ${dept.percentage}%"></div>
            </div>
            <span class="department-percentage">${dept.percentage}%</span>
        `;
        departmentChart.appendChild(deptItem);
    });
}

/**
 * 更新熱門作品
 */
function updatePopularPortfolios(portfolios) {
    const popularPortfolios = document.querySelector('.popular-portfolios');
    if (!popularPortfolios) return;

    popularPortfolios.innerHTML = '';
    
    portfolios.forEach((portfolio, index) => {
        const portfolioItem = document.createElement('div');
        portfolioItem.className = 'portfolio-item';
        portfolioItem.innerHTML = `
            <div class="portfolio-rank">${index + 1}</div>
            <div class="portfolio-info">
                <h4>${portfolio.title}</h4>
                <p>${portfolio.author} • ${portfolio.department}</p>
            </div>
            <div class="portfolio-stats">
                <span><i class="fas fa-eye"></i> ${portfolio.views}</span>
                <span><i class="fas fa-heart"></i> ${portfolio.likes}</span>
            </div>
        `;
        popularPortfolios.appendChild(portfolioItem);
    });
}

/**
 * 設定圖表
 */
function setupCharts(trends) {
    // TODO: 實作實際的圖表庫 (如 Chart.js 或 D3.js)
    console.log('圖表功能待實作');
    console.log('趨勢資料:', trends);
}

/**
 * 更新趨勢圖表
 */
function updateTrendChart(period) {
    // TODO: 根據選擇的週期更新趨勢圖表
    console.log(`更新趨勢圖表，週期: ${period} 天`);
    
    // 這裡可以根據週期從 MockData.analytics.trends 中取得對應的資料
    const trends = MockData.analytics.trends;
    console.log('趨勢資料:', trends);
}

/**
 * 匯出分析報表
 */
function exportAnalytics() {
    // TODO: 實作匯出功能
    showNotification('報表匯出功能開發中...', 'info');
}

/**
 * 重新整理分析資料
 */
function refreshAnalytics() {
    showNotification('正在重新整理資料...', 'info');
    
    // 模擬載入延遲
    setTimeout(() => {
        initializeAnalytics();
        showNotification('資料已更新', 'success');
    }, 1000);
}

/**
 * 顯示通知
 */
function showNotification(message, type = 'info') {
    // 使用全域的 Utils.showNotification 或實作本地版本
    if (typeof Utils !== 'undefined' && Utils.showNotification) {
        Utils.showNotification(message, type);
    } else {
        // 本地實作
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 自動移除
        setTimeout(() => {
            notification.remove();
        }, 3000);
        
        // 手動關閉
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

/**
 * 取得通知圖示
 */
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * 取得通知顏色
 */
function getNotificationColor(type) {
    const colors = {
        success: '#4ade80',
        error: '#f87171',
        warning: '#fbbf24',
        info: '#667eea'
    };
    return colors[type] || '#667eea';
}

// 全域函數，供 HTML 呼叫
window.exportAnalytics = exportAnalytics;
window.refreshAnalytics = refreshAnalytics;
