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
let __analyticsCache = { stats: null, trends: null, skills: null, departments: null, popularPortfolios: [] };
let __charts = { trends: null, skills: null, departments: null };

async function initializeAnalytics(days = 30) {
    try {
        const svc = window.apiService || window.initializeApiService?.();
        if (!svc) throw new Error('API 服務未就緒');

        // 併行取回統計與趨勢
        const [statsRes, analyticsRes] = await Promise.all([
            svc.request('enterprise/dashboard.php?action=stats'),
            svc.request(`enterprise/dashboard.php?action=analytics&days=${encodeURIComponent(String(days))}`)
        ]);

        const stats = statsRes?.data || statsRes || {};
        const analytics = analyticsRes?.data || analyticsRes || {};
        const trends = analytics || { views: [], contacts: [], applications: [], top_skills: [] };

        // 快取
        __analyticsCache.stats = stats;
        __analyticsCache.trends = trends;
        __analyticsCache.skills = (trends.top_skills || []).map(s => ({ name: s.skill || s.name || '', percentage: s.count || s.percentage || 0 }));
        __analyticsCache.departments = []; // 如需可從後端擴充

        updateStats({
            total_views: stats?.portfolios?.total_views ?? 0,
            total_favorites: stats?.portfolios?.total_bookmarks ?? 0,
            total_contacts: stats?.contacts?.total ?? 0,
            total_jobs: stats?.jobs?.total ?? 0
        });
        await ensureChartJs();
        updateSkillsChart(__analyticsCache.skills);
        updateDepartmentChart(__analyticsCache.departments);
        updatePopularPortfolios(__analyticsCache.popularPortfolios);
        setupCharts(__analyticsCache.trends);
    } catch (e) {
        console.error('載入分析資料失敗:', e);
    }
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
    const wrap = document.querySelector('.skills-chart');
    if (!wrap) return;
    wrap.innerHTML = '<canvas id="skillsChartCanvas" height="220"></canvas>';
    const ctx = document.getElementById('skillsChartCanvas').getContext('2d');
    if (typeof Chart !== 'undefined' && window.__charts && window.__charts.skills) {
        window.__charts.skills.destroy();
    }
    window.__charts = window.__charts || { trends: null, skills: null, departments: null };
    const labels = skills.map(s => s.name);
    const data = skills.map(s => Number(s.percentage || s.count || 0));
    window.__charts.skills = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: '熱門技能', data, backgroundColor: '#60A5FA' }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
}

/**
 * 更新科系分布圖表
 */
function updateDepartmentChart(departments) {
    const wrap = document.querySelector('.department-chart');
    if (!wrap) return;
    wrap.innerHTML = '<canvas id="deptChartCanvas" height="220"></canvas>';
    const ctx = document.getElementById('deptChartCanvas').getContext('2d');
    if (typeof Chart !== 'undefined' && window.__charts && window.__charts.departments) {
        window.__charts.departments.destroy();
    }
    window.__charts = window.__charts || { trends: null, skills: null, departments: null };
    const labels = departments.map(d => d.name || d.department || '');
    const data = departments.map(d => Number(d.percentage || d.count || 0));
    window.__charts.departments = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ label: '科系分布', data, backgroundColor: ['#6366F1','#34D399','#F59E0B','#EF4444','#10B981','#3B82F6','#F472B6','#A78BFA'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
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
    const container = document.querySelector('.trend-charts');
    if (!container) return;
    container.innerHTML = '<canvas id="trendChartCanvas" height="260"></canvas>';
    const ctx = document.getElementById('trendChartCanvas').getContext('2d');
    if (typeof Chart !== 'undefined' && window.__charts && window.__charts.trends) {
        window.__charts.trends.destroy();
    }
    window.__charts = window.__charts || { trends: null, skills: null, departments: null };
    const dates = (trends.views || []).map(d => d.date);
    const ds = key => (Array.isArray(trends[key]) ? trends[key].map(d => Number(d.count || d[key] || 0)) : []);
    window.__charts.trends = new Chart(ctx, {
        type: 'line',
        data: { labels: dates, datasets: [
            { label: '瀏覽', data: ds('views'), borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.15)', tension: 0.3, fill: true },
            { label: '聯絡', data: ds('contacts'), borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.15)', tension: 0.3, fill: true },
            { label: '申請', data: ds('applications'), borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)', tension: 0.3, fill: true }
        ] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, stacked: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
    });
}

/**
 * 更新趨勢圖表
 */
async function updateTrendChart(period) {
    const days = parseInt(period, 10) || 30;
    await initializeAnalytics(days);
}

/**
 * 匯出分析報表
 */
function exportAnalytics() {
    try {
        const payload = {
            exportedAt: new Date().toISOString(),
            stats: __analyticsCache.stats,
            trends: __analyticsCache.trends,
            skills: __analyticsCache.skills,
            departments: __analyticsCache.departments,
            popularPortfolios: __analyticsCache.popularPortfolios
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enterprise-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('分析報表已匯出', 'success');
    } catch (e) {
        showNotification('匯出失敗', 'error');
    }
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
