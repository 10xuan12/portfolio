/**
 * 學生作品集管理 JavaScript
 * 包含作品篩選、編輯、刪除等功能
 */

(function() {
    'use strict';

    // 作品資料陣列
    let portfolios = [];

    // 當前篩選條件
    let currentFilters = {
        status: '',
        category: '',
        search: ''
    };

    // 初始化頁面
    document.addEventListener('DOMContentLoaded', function() {
        loadPortfolios();
        initEventListeners();
        initTagAutocomplete();
    });

    // 載入作品資料
    async function loadPortfolios() {
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            // 從後端 API 載入作品資料（統一透過 ApiService）
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request(`student/portfolio.php?action=list&user_id=${user.id}`);
            
            if (result.status === 200 && result.data) {
                portfolios = Array.isArray(result.data) ? result.data : [];
                renderPortfolios();
            } else {
                throw new Error(result.message || '載入作品資料失敗');
            }
            
        } catch (error) {
            console.error('載入作品資料失敗:', error);
            Utils.showNotification('載入作品資料失敗，請稍後再試', 'error');
            // 如果 API 失敗，顯示空狀態
            portfolios = [];
            renderPortfolios();
        }
    }

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
                    <img src="${portfolio.cover_image || 'https://via.placeholder.com/400x200/667eea/ffffff?text=Portfolio'}" alt="${portfolio.title}">
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
        
        if (portfolio.url) {
            window.open(portfolio.url, '_blank');
        } else {
            Utils.showNotification('此作品尚未設定連結', 'warning');
        }
    }

    // 刪除作品
    async function deletePortfolio(id) {
        if (!confirm('確定要刪除此作品嗎？此操作無法復原。')) {
            return;
        }
        
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request('student/portfolio.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'delete',
                    portfolio_id: id,
                    user_id: user.id
                })
            });
            
            if (result.status === 200) {
                // 從本地陣列中移除
                portfolios = portfolios.filter(p => p.id !== id);
                renderPortfolios();
                Utils.showNotification('作品已刪除', 'success');
            } else {
                throw new Error(result.message || '刪除失敗');
            }
            
        } catch (error) {
            console.error('刪除作品失敗:', error);
            Utils.showNotification('刪除作品失敗，請稍後再試', 'error');
        }
    }

    // 處理表單提交
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const portfolioData = {
            title: formData.get('title'),
            category: formData.get('category'),
            description: formData.get('description'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
            status: formData.get('status'),
            url: formData.get('url'),
            github: formData.get('github')
        };
        
        const portfolioId = formData.get('id');
        
        if (portfolioId) {
            // 更新現有作品
            portfolioData.id = portfolioId;
            updatePortfolio(portfolioData);
        } else {
            // 新增作品
            createPortfolio(portfolioData);
        }
    }

    // 建立新作品
    async function createPortfolio(data) {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request('student/portfolio.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'create',
                    ...data
                })
            });
            
            if (result.status === 201) {
                // 重新載入作品列表
                await loadPortfolios();
                closeModal();
                Utils.showNotification('作品已建立', 'success');
            } else {
                throw new Error(result.message || '建立失敗');
            }
            
        } catch (error) {
            console.error('建立作品失敗:', error);
            Utils.showNotification('建立作品失敗，請稍後再試', 'error');
        }
    }

    // 更新作品
    async function updatePortfolio(data) {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request('student/portfolio.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update',
                    ...data
                })
            });
            
            if (result.status === 200) {
                // 重新載入作品列表
                await loadPortfolios();
                closeModal();
                Utils.showNotification('作品已更新', 'success');
            } else {
                throw new Error(result.message || '更新失敗');
            }
            
        } catch (error) {
            console.error('更新作品失敗:', error);
            Utils.showNotification('更新作品失敗，請稍後再試', 'error');
        }
    }

    // 匯出作品集
    function exportPortfolio() {
        const user = JSON.parse(localStorage.getItem('user')) || {};
        
        const exportData = {
            student: {
                name: user.name || '學生',
                department: user.department || '資訊管理學系',
                grade: user.grade || '大學三年級'
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
    async function handleFileUpload(file) {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            const formData = new FormData();
            formData.append('files[]', file);
            formData.append('portfolio_id', document.getElementById('portfolioId').value || '0');
            
            const uploadUrl = (window.apiService || window.initializeApiService?.()).getApiUrl('student/portfolio.php');
            const response = await fetch(uploadUrl, { method: 'POST', headers: { 'X-User-ID': user.id }, body: formData });
            const result = await response.json();
            
            if (result.status === 200) {
                return result.data.uploaded_files[0].file_path;
            } else {
                throw new Error(result.message || '上傳失敗');
            }
            
        } catch (error) {
            console.error('檔案上傳失敗:', error);
            Utils.showNotification('檔案上傳失敗，請稍後再試', 'error');
            return null;
        }
    }

    // 標籤自動完成
    function initTagAutocomplete() {
        const tagInput = document.getElementById('portfolioTags');
        if (!tagInput) return;
        
        const commonTags = [
            'HTML5', 'CSS3', 'JavaScript', 'React', 'Vue.js', 'Angular',
            'Node.js', 'Python', 'Java', 'C++', 'PHP', 'MySQL',
            'MongoDB', 'Firebase', 'AWS', 'Docker', 'Git', 'Figma',
            'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'UI/UX',
            '響應式', '跨平台', 'PWA', 'API', 'REST', 'GraphQL'
        ];
        
        // 建立建議容器
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'tag-suggestions';
        suggestionsContainer.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;
        
        tagInput.parentNode.style.position = 'relative';
        tagInput.parentNode.appendChild(suggestionsContainer);
        
        tagInput.addEventListener('input', function() {
            const value = this.value.toLowerCase();
            const lastTag = value.split(',').pop().trim();
            
            if (lastTag.length > 0) {
                const suggestions = commonTags.filter(tag => 
                    tag.toLowerCase().includes(lastTag) && 
                    !value.toLowerCase().includes(tag.toLowerCase())
                );
                
                if (suggestions.length > 0) {
                    suggestionsContainer.innerHTML = suggestions.map(tag => 
                        `<div class="suggestion-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;">${tag}</div>`
                    ).join('');
                    
                    suggestionsContainer.style.display = 'block';
                    
                    // 點擊建議項目
                    suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
                        item.addEventListener('click', function() {
                            const tagText = this.textContent;
                            const currentValue = tagInput.value;
                            const tags = currentValue.split(',').slice(0, -1);
                            tags.push(tagText);
                            tagInput.value = tags.join(', ');
                            suggestionsContainer.style.display = 'none';
                            tagInput.focus();
                        });
                    });
                } else {
                    suggestionsContainer.style.display = 'none';
                }
            } else {
                suggestionsContainer.style.display = 'none';
            }
        });
        
        // 點擊外部關閉建議
        document.addEventListener('click', function(e) {
            if (!tagInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });
    }

    // 全域函數供 HTML 使用
    window.openUploadModal = openUploadModal;
    window.closeModal = closeModal;
    window.editPortfolio = editPortfolio;
    window.viewPortfolio = viewPortfolio;
    window.deletePortfolio = deletePortfolio;
    window.applyFilters = applyFilters;
    window.exportPortfolio = exportPortfolio;

})(); 