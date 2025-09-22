/**
 * 企業作品瀏覽 JavaScript
 * 包含搜尋、篩選、排序、收藏等功能
 */

// 從後端 API 載入作品資料
let portfolios = [];

// 當前篩選條件
let currentFilters = {
    search: '',
    category: '',
    department: '',
    sort: 'relevance'
};

// 收藏的作品
let likedPortfolios = new Set();

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    await loadPortfolios();
    renderPortfolios();
    initEventListeners();
    loadLikedPortfolios();
});

// 初始化事件監聽器
function initEventListeners() {
    // 搜尋篩選
    document.getElementById('searchFilter').addEventListener('input', Utils.debounce(function() {
        currentFilters.search = this.value;
        applyFilters();
    }, 300));
    
    // 分類篩選
    document.getElementById('categoryFilter').addEventListener('change', function() {
        currentFilters.category = this.value;
        applyFilters();
    });
    
    // 科系篩選
    document.getElementById('departmentFilter').addEventListener('change', function() {
        currentFilters.department = this.value;
        applyFilters();
    });
    
    // 排序方式
    document.getElementById('sortFilter').addEventListener('change', function() {
        currentFilters.sort = this.value;
        applyFilters();
    });
}

// 渲染作品列表
function renderPortfolios(filteredPortfolios = null) {
    const grid = document.getElementById('portfoliosGrid');
    const emptyState = document.getElementById('emptyState');
    
    const portfoliosToRender = filteredPortfolios || portfolios;
    
    if (portfoliosToRender.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = portfoliosToRender.map(portfolio => `
        <div class="portfolio-item" data-category="${portfolio.category}" data-department="${portfolio.department}">
            <div class="portfolio-image">
                <img src="${portfolio.image}" alt="${portfolio.title}">
                <div class="portfolio-overlay">
                    <button class="overlay-btn" onclick="viewPortfolio(${portfolio.id})">
                        <i class="fas fa-eye"></i> 查看
                    </button>
                    <button class="overlay-btn" onclick="contactStudent(${portfolio.id})">
                        <i class="fas fa-envelope"></i> 聯絡
                    </button>
                    <button class="overlay-btn" onclick="likePortfolio(${portfolio.id})">
                        <i class="fas fa-heart"></i> ${likedPortfolios.has(portfolio.id) ? '取消收藏' : '收藏'}
                    </button>
                </div>
            </div>
            <div class="portfolio-content">
                <div class="portfolio-header">
                    <div class="portfolio-title">
                        <h3>${portfolio.title}</h3>
                        <p class="portfolio-author">${portfolio.author} - ${portfolio.department}</p>
                    </div>
                    <span class="portfolio-category">${getCategoryText(portfolio.category)}</span>
                </div>
                <p class="portfolio-description">${portfolio.description}</p>
                <div class="portfolio-tags">
                    ${portfolio.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="portfolio-stats">
                    <span><i class="fas fa-eye"></i> ${portfolio.views} 次瀏覽</span>
                    <span><i class="fas fa-heart"></i> ${portfolio.likes} 個讚</span>
                    <span><i class="fas fa-comment"></i> ${portfolio.comments} 則評論</span>
                </div>
                <div class="portfolio-actions">
                    <button class="action-btn" onclick="viewPortfolio(${portfolio.id})">
                        <i class="fas fa-eye"></i> 查看詳情
                    </button>
                    <button class="action-btn primary" onclick="contactStudent(${portfolio.id})">
                        <i class="fas fa-envelope"></i> 聯絡作者
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// 取得分類文字
function getCategoryText(category) {
    const categoryMap = {
        'web': '網頁設計',
        'mobile': '行動應用',
        'design': 'UI/UX 設計',
        'data': '數據分析',
        'other': '其他'
    };
    return categoryMap[category] || category;
}

// 應用篩選器
function applyFilters() {
    let filteredPortfolios = portfolios;
    
    // 搜尋篩選
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredPortfolios = filteredPortfolios.filter(p => 
            p.title.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.author.toLowerCase().includes(searchTerm) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    // 分類篩選
    if (currentFilters.category) {
        filteredPortfolios = filteredPortfolios.filter(p => p.category === currentFilters.category);
    }
    
    // 科系篩選
    if (currentFilters.department) {
        filteredPortfolios = filteredPortfolios.filter(p => p.department === currentFilters.department);
    }
    
    // 排序
    filteredPortfolios = sortPortfolios(filteredPortfolios, currentFilters.sort);
    
    renderPortfolios(filteredPortfolios);
    updateResultsCount(filteredPortfolios.length);
}

// 排序作品
function sortPortfolios(portfolios, sortBy) {
    switch (sortBy) {
        case 'date':
            return portfolios.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'views':
            return portfolios.sort((a, b) => b.views - a.views);
        case 'likes':
            return portfolios.sort((a, b) => b.likes - a.likes);
        case 'relevance':
        default:
            return portfolios.sort((a, b) => b.views + b.likes - (a.views + a.likes));
    }
}

// 更新結果數量
function updateResultsCount(count) {
    const title = document.querySelector('.portfolios-title');
    if (title) {
        title.textContent = `作品瀏覽 (${count} 個結果)`;
    }
}

// 查看作品詳情
function viewPortfolio(portfolioId) {
    window.location.href = `portfolio-detail.html?id=${portfolioId}`;
}

// 聯絡學生
function contactStudent(portfolioId) {
    const portfolio = portfolios.find(p => p.id === portfolioId);
    if (portfolio) {
        const svc = window.apiService || window.initializeApiService?.();
        if (!svc) return Utils.showNotification('API 服務未就緒', 'error');
        const msg = `您好，我們對您的作品「${portfolio.title}」很感興趣，方便進一步聯繫嗎？`;
        svc.request('enterprise/portfolios.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'contact', student_id: null, subject: `關於作品 ${portfolio.title}`, message: msg })
        }).then(() => {
            Utils.showNotification(`已發送聯絡訊息給 ${portfolio.author}`, 'success');
        }).catch(() => Utils.showNotification('聯絡失敗', 'error'));
    }
}

// 收藏/取消收藏作品
function likePortfolio(portfolioId) {
    if (likedPortfolios.has(portfolioId)) {
        likedPortfolios.delete(portfolioId);
        Utils.showNotification('已取消收藏', 'info');
    } else {
        likedPortfolios.add(portfolioId);
        Utils.showNotification('已加入收藏', 'success');
    }
    
    // 儲存收藏狀態
    localStorage.setItem('likedPortfolios', JSON.stringify(Array.from(likedPortfolios)));
    
    // 重新渲染以更新按鈕狀態
    applyFilters();
}

// 載入收藏的作品
function loadLikedPortfolios() {
    const saved = localStorage.getItem('likedPortfolios');
    if (saved) {
        likedPortfolios = new Set(JSON.parse(saved));
    }
}

// 從後端載入作品（企業端預設取最近瀏覽作品）
async function loadPortfolios() {
    try {
        const svc = window.apiService || window.initializeApiService?.();
        if (!svc) throw new Error('API 服務未就緒');
        const res = await svc.request('enterprise/dashboard.php?action=recent_portfolios&limit=20');
        const list = res?.data || res || [];
        portfolios = (Array.isArray(list) ? list : []).map(p => ({
            id: p.id,
            title: p.title,
            author: p.student_name || p.display_name || '',
            department: p.major || '',
            description: p.description || '',
            category: p.category_slug || 'other',
            tags: p.tags || [],
            image: p.cover_image || p.thumbnail_url || '',
            views: p.view_count ?? 0,
            likes: p.like_count ?? 0,
            comments: p.comment_count ?? 0,
            created_at: p.created_at || p.published_at || ''
        }));
    } catch (e) {
        console.error('載入作品失敗', e);
        portfolios = [];
    }
}

// 重新整理作品列表
function refreshPortfolios() {
    Utils.showNotification('正在重新整理...', 'info');
    loadPortfolios().then(() => {
        applyFilters();
        Utils.showNotification('作品列表已更新', 'success');
    }).catch(() => {
        Utils.showNotification('作品列表更新失敗', 'error');
    });
}

// 匯出作品結果
function exportPortfolios() {
    try {
        const filteredPortfolios = getFilteredPortfolios();
        const data = {
            exportDate: new Date().toISOString(),
            filters: currentFilters,
            portfolios: filteredPortfolios.map(p => ({
                id: p.id,
                title: p.title,
                author: p.author,
                department: p.department,
                category: p.category,
                description: p.description,
                tags: p.tags,
                stats: {
                    views: p.views,
                    likes: p.likes,
                    comments: p.comments
                },
                created_at: p.created_at
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolios-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('作品資料已匯出', 'success');
    } catch (error) {
        Utils.showNotification('匯出失敗，請稍後再試', 'error');
        console.error('匯出作品資料錯誤:', error);
    }
}

// 取得篩選後的作品
function getFilteredPortfolios() {
    let filtered = portfolios;
    
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.author.toLowerCase().includes(searchTerm) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    if (currentFilters.category) {
        filtered = filtered.filter(p => p.category === currentFilters.category);
    }
    
    if (currentFilters.department) {
        filtered = filtered.filter(p => p.department === currentFilters.department);
    }
    
    return sortPortfolios(filtered, currentFilters.sort);
}

// 清除所有篩選器
function clearFilters() {
    document.getElementById('searchFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('departmentFilter').value = '';
    document.getElementById('sortFilter').value = 'relevance';
    
    currentFilters = {
        search: '',
        category: '',
        department: '',
        sort: 'relevance'
    };
    
    applyFilters();
    Utils.showNotification('已清除所有篩選器', 'info');
}

// 全域函數，供 HTML 直接調用
window.viewPortfolio = viewPortfolio;
window.contactStudent = contactStudent;
window.likePortfolio = likePortfolio;
window.refreshPortfolios = refreshPortfolios;
window.exportPortfolios = exportPortfolios;
window.clearFilters = clearFilters; 