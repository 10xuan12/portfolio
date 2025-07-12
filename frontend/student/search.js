/**
 * 學生搜尋功能 JavaScript
 * 包含搜尋、篩選、排序、搜尋建議等功能
 */

// TODO: 從後端 API 載入搜尋結果
let searchResults = [
    {
        id: 1,
        title: '響應式網站設計',
        author: '張小明',
        description: '使用 HTML5、CSS3 和 JavaScript 製作的現代化響應式網站，支援各種裝置尺寸。',
        category: 'web',
        tags: ['HTML5', 'CSS3', 'JavaScript', '響應式'],
        image: 'https://via.placeholder.com/400x200/667eea/ffffff?text=Web+Design',
        views: 156,
        likes: 23,
        created_at: '2024-01-15'
    },
    {
        id: 2,
        title: '行動應用程式',
        author: '李大明',
        description: '使用 React Native 開發的跨平台行動應用程式，提供流暢的使用者體驗。',
        category: 'mobile',
        tags: ['React Native', 'JavaScript', 'Firebase', '跨平台'],
        image: 'https://via.placeholder.com/400x200/764ba2/ffffff?text=Mobile+App',
        views: 203,
        likes: 45,
        created_at: '2024-01-14'
    },
    {
        id: 3,
        title: 'UI/UX 設計作品',
        author: '王小美',
        description: '使用 Figma 設計的現代化使用者介面，注重使用者體驗和視覺美感。',
        category: 'design',
        tags: ['Figma', 'UI/UX', '設計系統', '原型設計'],
        image: 'https://via.placeholder.com/400x200/f093fb/ffffff?text=UI+Design',
        views: 89,
        likes: 12,
        created_at: '2024-01-13'
    }
];

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
});

// 初始化事件監聽器
function initEventListeners() {
    // 搜尋輸入
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 篩選器事件
    document.getElementById('categoryFilter').addEventListener('change', function() {
        currentSearch.category = this.value;
        applyFilters();
    });
    
    document.getElementById('tagFilter').addEventListener('input', Utils.debounce(function() {
        currentSearch.tags = this.value;
        applyFilters();
    }, 300));
    
    document.getElementById('authorFilter').addEventListener('input', Utils.debounce(function() {
        currentSearch.author = this.value;
        applyFilters();
    }, 300));
    
    document.getElementById('timeFilter').addEventListener('change', function() {
        currentSearch.time = this.value;
        applyFilters();
    });
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
    const suggestions = searchSuggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (suggestions.length > 0) {
        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" onclick="selectSuggestion('${suggestion}')">
                <i class="fas fa-search" style="margin-right: var(--spacing-sm); color: var(--gray-500);"></i>
                ${suggestion}
            </div>
        `).join('');
        suggestionsContainer.style.display = 'block';
    } else {
        hideSearchSuggestions();
    }
}

// 隱藏搜尋建議
function hideSearchSuggestions() {
    document.getElementById('searchSuggestions').style.display = 'none';
}

// 選擇搜尋建議
function selectSuggestion(suggestion) {
    document.getElementById('searchInput').value = suggestion;
    currentSearch.query = suggestion;
    hideSearchSuggestions();
    performSearch();
}

// 執行搜尋
async function performSearch() {
    const query = currentSearch.query.trim();
    
    if (!query) {
        Utils.showNotification('請輸入搜尋關鍵字', 'warning');
        return;
    }
    
    try {
        // 顯示搜尋中狀態
        Utils.showNotification('搜尋中...', 'info');
        
        // TODO: 發送搜尋請求到後端 API
        // const response = await fetch('/api/search', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(currentSearch)
        // });
        // searchResults = await response.json();
        
        // 模擬搜尋結果
        const filteredResults = searchResults.filter(result => 
            result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.description.toLowerCase().includes(query.toLowerCase()) ||
            result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
            result.author.toLowerCase().includes(query.toLowerCase())
        );
        
        // 添加搜尋歷史
        addToSearchHistory(query);
        
        // 更新顯示
        renderSearchResults(filteredResults);
        updateResultsCount(filteredResults.length);
        
        hideSearchSuggestions();
        
        Utils.showNotification(`找到 ${filteredResults.length} 個結果`, 'success');
        
    } catch (error) {
        Utils.showNotification('搜尋失敗，請稍後再試', 'error');
        console.error('搜尋錯誤:', error);
    }
}

// 應用篩選器
function applyFilters() {
    let filteredResults = searchResults;
    
    // 關鍵字搜尋
    if (currentSearch.query) {
        filteredResults = filteredResults.filter(result => 
            result.title.toLowerCase().includes(currentSearch.query.toLowerCase()) ||
            result.description.toLowerCase().includes(currentSearch.query.toLowerCase()) ||
            result.tags.some(tag => tag.toLowerCase().includes(currentSearch.query.toLowerCase())) ||
            result.author.toLowerCase().includes(currentSearch.query.toLowerCase())
        );
    }
    
    // 分類篩選
    if (currentSearch.category) {
        filteredResults = filteredResults.filter(result => result.category === currentSearch.category);
    }
    
    // 標籤篩選
    if (currentSearch.tags) {
        const tags = currentSearch.tags.split(',').map(tag => tag.trim().toLowerCase());
        filteredResults = filteredResults.filter(result => 
            tags.some(tag => result.tags.some(resultTag => resultTag.toLowerCase().includes(tag)))
        );
    }
    
    // 作者篩選
    if (currentSearch.author) {
        filteredResults = filteredResults.filter(result => 
            result.author.toLowerCase().includes(currentSearch.author.toLowerCase())
        );
    }
    
    // 時間篩選
    if (currentSearch.time) {
        const now = new Date();
        filteredResults = filteredResults.filter(result => {
            const createdDate = new Date(result.created_at);
            const diffTime = Math.abs(now - createdDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            switch (currentSearch.time) {
                case 'week':
                    return diffDays <= 7;
                case 'month':
                    return diffDays <= 30;
                case 'year':
                    return diffDays <= 365;
                default:
                    return true;
            }
        });
    }
    
    // 排序
    sortResults(filteredResults);
    
    // 更新顯示
    renderSearchResults(filteredResults);
    updateResultsCount(filteredResults.length);
}

// 排序結果
function sortResults(results) {
    switch (currentSearch.sort) {
        case 'date':
            results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'views':
            results.sort((a, b) => b.views - a.views);
            break;
        case 'likes':
            results.sort((a, b) => b.likes - a.likes);
            break;
        case 'relevance':
        default:
            // 相關性排序（基於關鍵字匹配度）
            if (currentSearch.query) {
                results.sort((a, b) => {
                    const query = currentSearch.query.toLowerCase();
                    const aScore = getRelevanceScore(a, query);
                    const bScore = getRelevanceScore(b, query);
                    return bScore - aScore;
                });
            }
            break;
    }
}

// 計算相關性分數
function getRelevanceScore(result, query) {
    let score = 0;
    
    // 標題匹配
    if (result.title.toLowerCase().includes(query)) {
        score += 10;
    }
    
    // 標籤匹配
    result.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
            score += 5;
        }
    });
    
    // 描述匹配
    if (result.description.toLowerCase().includes(query)) {
        score += 3;
    }
    
    // 作者匹配
    if (result.author.toLowerCase().includes(query)) {
        score += 2;
    }
    
    return score;
}

// 渲染搜尋結果
function renderSearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    const emptyState = document.getElementById('emptyState');
    
    if (results.length === 0) {
        resultsContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    resultsContainer.style.display = 'grid';
    emptyState.style.display = 'none';
    
    resultsContainer.innerHTML = results.map(result => `
        <div class="result-item">
            <div class="result-image">
                <img src="${result.image}" alt="${result.title}">
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
                        <div class="result-author">by ${result.author}</div>
                    </div>
                    <div class="result-stats">
                        <span><i class="fas fa-eye"></i> ${result.views}</span>
                        <span><i class="fas fa-heart"></i> ${result.likes}</span>
                    </div>
                </div>
                <p class="result-description">
                    ${result.description}
                </p>
                <div class="result-tags">
                    ${result.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
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
    document.getElementById('resultsCount').textContent = `找到 ${count} 個結果`;
}

// 改變排序方式
function changeSort(sortType) {
    currentSearch.sort = sortType;
    
    // 更新排序按鈕狀態
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-sort="${sortType}"]`).classList.add('active');
    
    // 重新應用篩選
    applyFilters();
}

// 添加搜尋歷史
function addToSearchHistory(query) {
    if (!searchHistory.includes(query)) {
        searchHistory.unshift(query);
        searchHistory = searchHistory.slice(0, 10); // 保留最近10個
        saveSearchHistory();
        loadSearchHistory();
    }
}

// 從搜尋歷史搜尋
function searchFromHistory(query) {
    document.getElementById('searchInput').value = query;
    currentSearch.query = query;
    performSearch();
}

// 載入搜尋歷史
function loadSearchHistory() {
    const historyContainer = document.getElementById('searchHistory');
    const historyTags = document.getElementById('historyTags');
    
    if (searchHistory.length > 0) {
        historyContainer.style.display = 'block';
        historyTags.innerHTML = searchHistory.map(query => 
            `<span class="history-tag" onclick="searchFromHistory('${query}')">${query}</span>`
        ).join('');
    } else {
        historyContainer.style.display = 'none';
    }
}

// 儲存搜尋歷史
function saveSearchHistory() {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

// 載入儲存的搜尋歷史
function loadStoredSearchHistory() {
    const stored = localStorage.getItem('searchHistory');
    if (stored) {
        searchHistory = JSON.parse(stored);
    }
}

// 查看作品
function viewPortfolio(portfolioId) {
    window.location.href = `portfolio-detail.html?id=${portfolioId}`;
}

// 讚作品
function likePortfolio(portfolioId) {
    // TODO: 實作讚功能
    Utils.showNotification('已讚作品', 'success');
}

// 聯絡作者
function contactAuthor(portfolioId) {
    // TODO: 實作聯絡作者功能
    Utils.showNotification('聯絡功能開發中', 'info');
}

// 全域函數供 HTML 使用
window.performSearch = performSearch;
window.applyFilters = applyFilters;
window.changeSort = changeSort;
window.selectSuggestion = selectSuggestion;
window.searchFromHistory = searchFromHistory;
window.viewPortfolio = viewPortfolio;
window.likePortfolio = likePortfolio;
window.contactAuthor = contactAuthor; 