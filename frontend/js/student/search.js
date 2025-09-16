/**
 * 學生搜尋功能 JavaScript
 * 包含搜尋、篩選、排序、搜尋建議等功能
 */

// 搜尋結果
let searchResults = [];

// 搜尋歷史
let searchHistory = ['JavaScript', 'React', 'UI/UX', '響應式'];

// 當前搜尋條件
let currentSearch = {
    query: '',
    category: '',
    tags: '',
    author: '',
    time: '',
    sort: 'relevance'
};

// 搜尋建議
const searchSuggestions = [
    'JavaScript', 'React', 'Vue.js', 'Angular', 'Node.js',
    'Python', 'Java', 'C++', 'PHP', 'MySQL',
    'MongoDB', 'Firebase', 'AWS', 'Docker', 'Git',
    'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator',
    'UI/UX', '響應式', '跨平台', 'PWA', 'API',
    'REST', 'GraphQL', '微服務', '雲端', 'AI'
];

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadSearchHistory();
    loadCategoriesForSearch();
    // 不自動執行搜尋，讓用戶主動搜尋
});

// 初始化事件監聽器
function initEventListeners() {
    // 搜尋輸入
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // 篩選器事件
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentSearch.category = this.value;
            applyFilters();
        });
    }
    
    const tagFilter = document.getElementById('tagFilter');
    if (tagFilter) {
        tagFilter.addEventListener('input', Utils.debounce(function() {
            currentSearch.tags = this.value;
            applyFilters();
        }, 300));
    }
    
    const authorFilter = document.getElementById('authorFilter');
    if (authorFilter) {
        authorFilter.addEventListener('input', Utils.debounce(function() {
            currentSearch.author = this.value;
            applyFilters();
        }, 300));
    }
    
    // 時間篩選
    const timeFilter = document.getElementById('timeFilter');
    if (timeFilter) {
        timeFilter.addEventListener('change', function() {
            currentSearch.time = this.value;
            applyFilters();
        });
    }
    
    // 排序選擇
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSearch.sort = this.value;
            applyFilters();
        });
    }
}

// 動態載入分類（使用後端 categories）
async function loadCategoriesForSearch() {
    try {
        const service = window.apiService || window.initializeApiService?.();
        let result = null;
        // 先嘗試通用 categories 端點
        try {
            result = await (service?.request ? service.request('categories') : fetch((window.getApiUrl ? getApiUrl('categories') : '/api/categories')).then(r => r.json()));
        } catch (_) {}
        // 失敗再退回 student/portfolio.php?action=categories
        if (!result || (result && result.status !== 200 && !Array.isArray(result))) {
            result = await (service?.request ? service.request('student/portfolio.php?action=categories') : fetch((window.getApiUrl ? getApiUrl('student/portfolio.php?action=categories') : '/api/student/portfolio.php?action=categories')).then(r => r.json()));
        }
        const categories = Array.isArray(result) ? result : (result.data || []);
        const select = document.getElementById('categoryFilter');
        if (!select) return;
        const options = ['<option value="">全部分類</option>'].concat(categories.map(c => `<option value="${c.slug}">${c.name}</option>`));
        select.innerHTML = options.join('');
    } catch (e) {
        console.warn('載入分類失敗', e);
    }
}

// 處理搜尋輸入
function handleSearchInput(e) {
    const query = e.target.value.trim();
    currentSearch.query = query;
    
    if (query.length > 0) {
        showSearchSuggestions(query);
    } else {
        hideSearchSuggestions();
    }
}

// 顯示搜尋建議
function showSearchSuggestions(query) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (!suggestionsContainer) return;
    
    const suggestions = searchSuggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    
    if (suggestions.length > 0) {
        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" onclick="selectSuggestion('${suggestion}')">
                <i class="fas fa-search"></i>
                <span>${suggestion}</span>
            </div>
        `).join('');
        suggestionsContainer.style.display = 'block';
    } else {
        hideSearchSuggestions();
    }
}

// 隱藏搜尋建議
function hideSearchSuggestions() {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

// 選擇搜尋建議
function selectSuggestion(suggestion) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = suggestion;
        currentSearch.query = suggestion;
        hideSearchSuggestions();
        performSearch();
    }
}

// 執行搜尋
async function performSearch() {
    try {
        Utils.showNotification('搜尋中...', 'info');
        
        // 構建搜尋參數
        const searchParams = new URLSearchParams();
        if (currentSearch.query.trim()) {
            searchParams.append('q', currentSearch.query.trim());
        }
        if (currentSearch.category) {
            searchParams.append('category', currentSearch.category);
        }
        if (currentSearch.tags) {
            searchParams.append('tags', currentSearch.tags);
        }
        if (currentSearch.author) {
            searchParams.append('author', currentSearch.author);
        }
        if (currentSearch.time) {
            searchParams.append('time', currentSearch.time);
        }
        if (currentSearch.sort) {
            searchParams.append('sort', currentSearch.sort);
        }
        
        // 改用統一 API 服務
        const result = await apiService.searchAllPortfolios(searchParams);
        
        if (result && (result.status === 200 || result.success)) {
            const data = result.data || result;
            searchResults = Array.isArray(data) ? data : (data.data || []);
            renderSearchResults(searchResults);
            updateResultsCount(searchResults.length);
            
            // 添加到搜尋歷史
            if (currentSearch.query.trim()) {
                addToSearchHistory(currentSearch.query);
            }
            
            Utils.showNotification(`找到 ${searchResults.length} 個結果`, 'success');
        } else {
            throw new Error(result?.message || '搜尋失敗');
        }
        
    } catch (error) {
        console.error('搜尋錯誤:', error);
        Utils.showNotification('搜尋失敗，請稍後再試', 'error');
        searchResults = [];
        renderSearchResults([]);
        updateResultsCount(0);
    }
}

// 應用篩選器
function applyFilters() {
    // 重新執行搜尋
    performSearch();
}

// 排序結果
function sortResults(results) {
    const sortType = currentSearch.sort;
    
    switch (sortType) {
        case 'relevance':
            return results.sort((a, b) => getRelevanceScore(b, currentSearch.query) - getRelevanceScore(a, currentSearch.query));
        case 'date':
            return results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'views':
            return results.sort((a, b) => (b.views || 0) - (a.views || 0));
        case 'likes':
            return results.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        default:
            return results;
    }
}

// 計算相關性分數
function getRelevanceScore(result, query) {
    if (!query) return 0;
    
    const queryLower = query.toLowerCase();
    let score = 0;
    
    // 標題匹配
    if (result.title && result.title.toLowerCase().includes(queryLower)) {
        score += 10;
    }
    
    // 描述匹配
    if (result.description && result.description.toLowerCase().includes(queryLower)) {
        score += 5;
    }
    
    // 標籤匹配
    if (result.tags && Array.isArray(result.tags)) {
        result.tags.forEach(tag => {
            if (tag.toLowerCase().includes(queryLower)) {
                score += 3;
            }
        });
    }
    
    // 作者匹配
    if (result.author && result.author.toLowerCase().includes(queryLower)) {
        score += 2;
    }
    
    return score;
}

// 渲染搜尋結果
function renderSearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>沒有找到相關結果</h3>
                <p>請嘗試使用不同的關鍵字或調整篩選條件</p>
            </div>
        `;
        return;
    }
    
    const sortedResults = sortResults([...results]);
    
    resultsContainer.innerHTML = sortedResults.map(result => `
        <div class="result-item">
            <div class="result-image">
                <img src="${result.cover_image || 'https://via.placeholder.com/400x200/667eea/ffffff?text=Portfolio'}" alt="${result.title}">
                <div class="result-overlay">
                    <button class="overlay-btn" onclick="viewPortfolio(${result.id})">
                        <i class="fas fa-eye"></i> 查看
                    </button>
                    <button class="overlay-btn" onclick="likePortfolio(${result.id})">
                        <i class="fas fa-heart"></i> 讚
                    </button>
                </div>
            </div>
            <div class="result-content">
                <div class="result-header">
                    <div class="result-title">
                        <h3>${result.title}</h3>
                        <div class="result-author">by ${result.author_name || result.author || '未知作者'}</div>
                    </div>
                    <div class="result-stats">
                        <span><i class="fas fa-eye"></i> ${result.view_count || result.views || 0}</span>
                        <span><i class="fas fa-heart"></i> ${result.like_count || result.likes || 0}</span>
                    </div>
                </div>
                <p class="result-description">${result.description}</p>
                <div class="result-tags">
                    ${(result.tags ? (Array.isArray(result.tags) ? result.tags : result.tags.split(',')) : []).map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                </div>
                <div class="result-actions">
                    <button class="result-btn" onclick="viewPortfolio(${result.id})">
                        <i class="fas fa-eye"></i> 查看
                    </button>
                    <button class="result-btn" onclick="likePortfolio(${result.id})">
                        <i class="fas fa-heart"></i> 讚
                    </button>
                    <button class="result-btn primary" onclick="contactAuthor(${result.id})">
                        <i class="fas fa-envelope"></i> 聯絡
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// 更新結果數量
function updateResultsCount(count) {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        countElement.textContent = `${count} 個結果`;
    }
}

// 改變排序方式
function changeSort(sortType) {
    // 更新按鈕狀態
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-sort="${sortType}"]`).classList.add('active');
    
    currentSearch.sort = sortType;
    applyFilters();
}

// 添加到搜尋歷史
function addToSearchHistory(query) {
    if (!searchHistory.includes(query)) {
        searchHistory.unshift(query);
        if (searchHistory.length > 10) {
            searchHistory.pop();
        }
        saveSearchHistory();
        loadSearchHistory();
    }
}

// 從歷史記錄搜尋
function searchFromHistory(query) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = query;
        currentSearch.query = query;
        performSearch();
    }
}

// 載入搜尋歷史
function loadSearchHistory() {
    const historyContainer = document.getElementById('searchHistory');
    if (!historyContainer) return;
    
    const storedHistory = loadStoredSearchHistory();
    if (storedHistory.length > 0) {
        searchHistory = storedHistory;
    }
    
    if (searchHistory.length > 0) {
        historyContainer.innerHTML = `
            <h4>搜尋歷史</h4>
            <div class="history-list">
                ${searchHistory.map(query => `
                    <div class="history-item" onclick="searchFromHistory('${query}')">
                        <i class="fas fa-history"></i>
                        <span>${query}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        historyContainer.innerHTML = '';
    }
}

// 保存搜尋歷史
function saveSearchHistory() {
    try {
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    } catch (error) {
        console.error('保存搜尋歷史失敗:', error);
    }
}

// 載入儲存的搜尋歷史
function loadStoredSearchHistory() {
    try {
        const stored = localStorage.getItem('searchHistory');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('載入搜尋歷史失敗:', error);
        return [];
    }
}

// 查看作品詳情
function viewPortfolio(portfolioId) {
    window.location.href = `portfolio-detail.html?id=${portfolioId}`;
}

// 讚作品
async function likePortfolio(portfolioId) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            Utils.showNotification('請先登入', 'warning');
            return;
        }
        
        const svc = window.apiService || window.initializeApiService?.();
        const result = await svc.request('student/portfolio.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'toggle_like',
                portfolio_id: portfolioId,
                user_id: user.id
            })
        });
        
        if (result.status === 200 || result.success) {
            Utils.showNotification('已讚作品！', 'success');
            // 更新UI
            const likeButton = document.querySelector(`[onclick*="likePortfolio(${portfolioId})"]`);
            if (likeButton) {
                likeButton.classList.add('liked');
                likeButton.innerHTML = '<i class="fas fa-heart"></i> 已讚';
            }
        } else {
            throw new Error(result.message || '讚失敗');
        }
        
    } catch (error) {
        console.error('讚作品錯誤:', error);
        Utils.showNotification('讚失敗，請稍後再試', 'error');
    }
}

// 聯絡作者
async function contactAuthor(portfolioId) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            Utils.showNotification('請先登入', 'warning');
            return;
        }
        
        const portfolio = searchResults.find(r => r.id === portfolioId);
        if (!portfolio) {
            Utils.showNotification('找不到作品資訊', 'error');
            return;
        }
        
        // 跳轉到聯絡頁面
        const contactUrl = `contact.html?portfolio_id=${portfolioId}&author=${encodeURIComponent(portfolio.author_name || portfolio.author || '未知作者')}`;
        window.open(contactUrl, '_blank');
        
    } catch (error) {
        console.error('聯絡作者錯誤:', error);
        Utils.showNotification('聯絡失敗，請稍後再試', 'error');
    }
}

// 取得分類名稱
function getCategoryName(category) {
    const categoryMap = {
        'web': '網頁設計',
        'mobile': '行動應用',
        'design': 'UI/UX設計',
        'data': '數據分析',
        'ai': '人工智慧',
        'game': '遊戲開發',
        'other': '其他'
    };
    
    return categoryMap[category] || category;
}

// 清除搜尋歷史
function clearSearchHistory() {
    if (confirm('確定要清除搜尋歷史嗎？')) {
        searchHistory = [];
        saveSearchHistory();
        loadSearchHistory();
        Utils.showNotification('搜尋歷史已清除', 'success');
    }
}

// 全域函數供 HTML 使用
window.performSearch = performSearch;
window.selectSuggestion = selectSuggestion;
window.changeSort = changeSort;
window.viewPortfolio = viewPortfolio;
window.likePortfolio = likePortfolio;
window.contactAuthor = contactAuthor;
window.searchFromHistory = searchFromHistory;
window.clearSearchHistory = clearSearchHistory; 