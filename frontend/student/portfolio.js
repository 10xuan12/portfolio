/**
 * 學生作品集管理 JavaScript
 * 包含作品篩選、編輯、刪除等功能
 */

// TODO: 從後端 API 載入作品資料
let portfolios = [
    {
        id: 1,
        title: '響應式網站設計',
        description: '使用 HTML5、CSS3 和 JavaScript 製作的現代化響應式網站，支援各種裝置尺寸。',
        category: 'web',
        status: 'published',
        tags: ['HTML5', 'CSS3', 'JavaScript', '響應式'],
        image: 'https://via.placeholder.com/400x200/667eea/ffffff?text=Web+Design',
        url: 'https://example.com',
        github: 'https://github.com/example/web-design',
        views: 156,
        likes: 23,
        comments: 8,
        created_at: '2024-01-15'
    },
    {
        id: 2,
        title: '行動應用程式',
        description: '使用 React Native 開發的跨平台行動應用程式，提供流暢的使用者體驗。',
        category: 'mobile',
        status: 'published',
        tags: ['React Native', 'JavaScript', 'Firebase', '跨平台'],
        image: 'https://via.placeholder.com/400x200/764ba2/ffffff?text=Mobile+App',
        url: 'https://example.com/app',
        github: 'https://github.com/example/mobile-app',
        views: 203,
        likes: 45,
        comments: 12,
        created_at: '2024-01-14'
    },
    {
        id: 3,
        title: 'UI/UX 設計作品',
        description: '使用 Figma 設計的現代化使用者介面，注重使用者體驗和視覺美感。',
        category: 'design',
        status: 'review',
        tags: ['Figma', 'UI/UX', '設計系統', '原型設計'],
        image: 'https://via.placeholder.com/400x200/f093fb/ffffff?text=UI+Design',
        url: '',
        github: '',
        views: 0,
        likes: 0,
        comments: 0,
        created_at: '2024-01-13'
    },
    {
        id: 4,
        title: '數據視覺化專案',
        description: '使用 D3.js 製作的互動式數據視覺化專案，展示複雜數據的清晰呈現。',
        category: 'data',
        status: 'draft',
        tags: ['D3.js', 'Python', 'Pandas', '數據分析'],
        image: 'https://via.placeholder.com/400x200/4ade80/ffffff?text=Data+Viz',
        url: '',
        github: '',
        views: 0,
        likes: 0,
        comments: 0,
        created_at: '2024-01-12'
    }
];

// 當前篩選條件
let currentFilters = {
    status: '',
    category: '',
    search: ''
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    renderPortfolios();
    initEventListeners();
});

// 初始化事件監聽器
function initEventListeners() {
    // 篩選器事件
    document.getElementById('statusFilter').addEventListener('change', function() {
        currentFilters.status = this.value;
        applyFilters();
    });
    
    document.getElementById('categoryFilter').addEventListener('change', function() {
        currentFilters.category = this.value;
        applyFilters();
    });
    
    document.getElementById('searchFilter').addEventListener('input', Utils.debounce(function() {
        currentFilters.search = this.value;
        applyFilters();
    }, 300));
    
    // 表單提交事件
    document.getElementById('portfolioForm').addEventListener('submit', handleFormSubmit);
}

// 渲染作品列表
function renderPortfolios(filteredPortfolios = null) {
    const grid = document.getElementById('portfolioGrid');
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
        <div class="portfolio-item" data-status="${portfolio.status}" data-category="${portfolio.category}">
            <div class="portfolio-image">
                <img src="${portfolio.image}" alt="${portfolio.title}">
                <div class="portfolio-overlay">
                    <button class="overlay-btn" onclick="editPortfolio(${portfolio.id})">
                        <i class="fas fa-edit"></i> 編輯
                    </button>
                    <button class="overlay-btn" onclick="viewPortfolio(${portfolio.id})">
                        <i class="fas fa-eye"></i> 預覽
                    </button>
                    <button class="overlay-btn" onclick="deletePortfolio(${portfolio.id})">
                        <i class="fas fa-trash"></i> 刪除
                    </button>
                </div>
            </div>
            <div class="portfolio-content">
                <div class="portfolio-header-content">
                    <div class="portfolio-title-content">
                        <h3>${portfolio.title}</h3>
                        <small>${portfolio.created_at} 建立</small>
                    </div>
                    <span class="portfolio-status status-${portfolio.status}">${getStatusText(portfolio.status)}</span>
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
            </div>
        </div>
    `).join('');
}

// 取得狀態文字
function getStatusText(status) {
    const statusMap = {
        'published': '已發布',
        'draft': '草稿',
        'review': '審核中'
    };
    return statusMap[status] || status;
}

// 應用篩選器
function applyFilters() {
    let filteredPortfolios = portfolios;
    
    // 狀態篩選
    if (currentFilters.status) {
        filteredPortfolios = filteredPortfolios.filter(p => p.status === currentFilters.status);
    }
    
    // 分類篩選
    if (currentFilters.category) {
        filteredPortfolios = filteredPortfolios.filter(p => p.category === currentFilters.category);
    }
    
    // 搜尋篩選
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredPortfolios = filteredPortfolios.filter(p => 
            p.title.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    renderPortfolios(filteredPortfolios);
}

// 開啟上傳模態框
function openUploadModal() {
    document.getElementById('modalTitle').textContent = '新增作品';
    document.getElementById('portfolioForm').reset();
    document.getElementById('portfolioId').value = '';
    document.getElementById('portfolioModal').classList.add('show');
}

// 關閉模態框
function closeModal() {
    document.getElementById('portfolioModal').classList.remove('show');
}

// 編輯作品
function editPortfolio(id) {
    const portfolio = portfolios.find(p => p.id === id);
    if (!portfolio) {
        Utils.showNotification('找不到作品', 'error');
        return;
    }
    
    document.getElementById('modalTitle').textContent = '編輯作品';
    document.getElementById('portfolioId').value = portfolio.id;
    document.getElementById('portfolioTitle').value = portfolio.title;
    document.getElementById('portfolioCategory').value = portfolio.category;
    document.getElementById('portfolioDescription').value = portfolio.description;
    document.getElementById('portfolioTags').value = portfolio.tags.join(', ');
    document.getElementById('portfolioStatus').value = portfolio.status;
    document.getElementById('portfolioUrl').value = portfolio.url || '';
    document.getElementById('portfolioGithub').value = portfolio.github || '';
    
    document.getElementById('portfolioModal').classList.add('show');
}

// 預覽作品
function viewPortfolio(id) {
    const portfolio = portfolios.find(p => p.id === id);
    if (!portfolio) {
        Utils.showNotification('找不到作品', 'error');
        return;
    }
    
    // TODO: 開啟作品預覽頁面
    if (portfolio.url) {
        window.open(portfolio.url, '_blank');
    } else {
        Utils.showNotification('此作品尚未設定連結', 'warning');
    }
}

// 刪除作品
function deletePortfolio(id) {
    if (!confirm('確定要刪除此作品嗎？此操作無法復原。')) {
        return;
    }
    
    // TODO: 發送刪除請求到後端 API
    // fetch(`/api/portfolios/${id}`, { method: 'DELETE' })
    
    // 從本地陣列中移除
    portfolios = portfolios.filter(p => p.id !== id);
    renderPortfolios();
    Utils.showNotification('作品已刪除', 'success');
}

// 處理表單提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const portfolioData = {
        id: formData.get('id') || null,
        title: formData.get('title'),
        category: formData.get('category'),
        description: formData.get('description'),
        tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
        status: formData.get('status'),
        url: formData.get('url'),
        github: formData.get('github'),
        created_at: new Date().toISOString().split('T')[0]
    };
    
    if (portfolioData.id) {
        // 更新現有作品
        updatePortfolio(portfolioData);
    } else {
        // 新增作品
        createPortfolio(portfolioData);
    }
}

// 建立新作品
function createPortfolio(data) {
    // TODO: 發送建立請求到後端 API
    // const response = await fetch('/api/portfolios', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(data)
    // });
    
    // 模擬 API 回應
    const newPortfolio = {
        ...data,
        id: Date.now(),
        image: 'https://via.placeholder.com/400x200/667eea/ffffff?text=New+Portfolio',
        views: 0,
        likes: 0,
        comments: 0
    };
    
    portfolios.unshift(newPortfolio);
    renderPortfolios();
    closeModal();
    Utils.showNotification('作品已建立', 'success');
}

// 更新作品
function updatePortfolio(data) {
    // TODO: 發送更新請求到後端 API
    // const response = await fetch(`/api/portfolios/${data.id}`, {
    //     method: 'PUT',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(data)
    // });
    
    // 更新本地資料
    const index = portfolios.findIndex(p => p.id == data.id);
    if (index !== -1) {
        portfolios[index] = { ...portfolios[index], ...data };
        renderPortfolios();
        closeModal();
        Utils.showNotification('作品已更新', 'success');
    }
}

// 匯出作品集
function exportPortfolio() {
    // TODO: 實作作品集匯出功能
    // 可以匯出為 PDF 或 JSON 格式
    
    const exportData = {
        student: {
            name: '張小明',
            department: '資訊管理學系',
            grade: '大學三年級'
        },
        portfolios: portfolios.filter(p => p.status === 'published'),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `portfolio_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    Utils.showNotification('作品集已匯出', 'success');
}

// 檔案上傳處理
function handleFileUpload(file) {
    // TODO: 實作檔案上傳到後端
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.readAsDataURL(file);
    });
}

// 標籤自動完成
function initTagAutocomplete() {
    const tagInput = document.getElementById('portfolioTags');
    const commonTags = [
        'HTML5', 'CSS3', 'JavaScript', 'React', 'Vue.js', 'Angular',
        'Node.js', 'Python', 'Java', 'C++', 'PHP', 'MySQL',
        'MongoDB', 'Firebase', 'AWS', 'Docker', 'Git', 'Figma',
        'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'UI/UX',
        '響應式', '跨平台', 'PWA', 'API', 'REST', 'GraphQL'
    ];
    
    tagInput.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        const lastTag = value.split(',').pop().trim();
        
        if (lastTag.length > 0) {
            const suggestions = commonTags.filter(tag => 
                tag.toLowerCase().includes(lastTag) && 
                !value.toLowerCase().includes(tag.toLowerCase())
            );
            
            // TODO: 顯示標籤建議
            console.log('標籤建議:', suggestions);
        }
    });
}

// 初始化標籤自動完成
document.addEventListener('DOMContentLoaded', function() {
    initTagAutocomplete();
});

// 全域函數供 HTML 使用
window.openUploadModal = openUploadModal;
window.closeModal = closeModal;
window.editPortfolio = editPortfolio;
window.viewPortfolio = viewPortfolio;
window.deletePortfolio = deletePortfolio;
window.applyFilters = applyFilters;
window.exportPortfolio = exportPortfolio; 