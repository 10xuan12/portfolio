/**
 * 作品收藏夾系統
 * 純前端實現，使用 localStorage 儲存
 */

class FavoritesSystem {
    constructor() {
        this.storageKey = 'portfolio_favorites';
        this.foldersKey = 'portfolio_folders';
        this.currentFolder = 'all';
        this.init();
    }

    /**
     * 初始化系統
     */
    init() {
        // 確保有預設資料夾
        this.ensureDefaultFolders();
        
        // 創建面板 UI
        this.createPanel();
        
        // 創建浮動按鈕
        this.createFloatingButton();
        
        // 更新收藏計數
        this.updateCount();
    }

    /**
     * 確保有預設資料夾
     */
    ensureDefaultFolders() {
        let folders = this.getFolders();
        if (folders.length === 0) {
            folders = [
                { id: 'all', name: '全部收藏', icon: '📚' },
                { id: 'web', name: '網頁設計', icon: '🌐' },
                { id: 'mobile', name: '行動應用', icon: '📱' },
                { id: 'design', name: '視覺設計', icon: '🎨' }
            ];
            localStorage.setItem(this.foldersKey, JSON.stringify(folders));
        }
    }

    /**
     * 創建收藏夾面板
     */
    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'favorites-panel';
        panel.id = 'favoritesPanel';
        
        panel.innerHTML = `
            <div class="favorites-header">
                <h2>
                    <span>❤️</span>
                    <span>我的收藏</span>
                </h2>
                <button class="favorites-close" onclick="favoritesSystem.closePanel()">×</button>
            </div>
            
            <div class="favorites-tabs" id="favoritesTabs">
                <!-- 分類標籤將動態生成 -->
            </div>
            
            <div class="favorites-list" id="favoritesList">
                <!-- 收藏列表將動態生成 -->
            </div>
            
            <div class="favorites-stats">
                <span>已收藏 <span class="favorites-count" id="favoritesCount">0</span> 件作品</span>
                <button class="add-folder-btn" onclick="favoritesSystem.addFolder()">
                    <i class="fas fa-folder-plus"></i> 新增分類
                </button>
            </div>
            
            <div class="favorites-actions">
                <button class="favorites-action-btn secondary" onclick="favoritesSystem.exportFavorites()">
                    <i class="fas fa-download"></i> 匯出
                </button>
                <button class="favorites-action-btn" onclick="favoritesSystem.clearFavorites()">
                    <i class="fas fa-trash"></i> 清空
                </button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 渲染分類標籤
        this.renderTabs();
        
        // 渲染收藏列表
        this.renderList();
    }

    /**
     * 創建浮動按鈕
     */
    createFloatingButton() {
        const btn = document.createElement('button');
        btn.className = 'floating-favorites-btn';
        btn.id = 'floatingFavoritesBtn';
        btn.innerHTML = `
            <i class="fas fa-heart"></i>
            <span class="badge" id="favoritesBadge">0</span>
        `;
        btn.onclick = () => this.openPanel();
        
        document.body.appendChild(btn);
    }

    /**
     * 渲染分類標籤
     */
    renderTabs() {
        const folders = this.getFolders();
        const tabsContainer = document.getElementById('favoritesTabs');
        
        tabsContainer.innerHTML = folders.map(folder => `
            <button class="favorites-tab ${folder.id === this.currentFolder ? 'active' : ''}" 
                    onclick="favoritesSystem.switchFolder('${folder.id}')">
                ${folder.icon} ${folder.name}
            </button>
        `).join('');
    }

    /**
     * 渲染收藏列表
     */
    renderList() {
        const favorites = this.getFavorites();
        const listContainer = document.getElementById('favoritesList');
        
        // 根據當前資料夾篩選
        let filteredFavorites = favorites;
        if (this.currentFolder !== 'all') {
            filteredFavorites = favorites.filter(f => f.folder === this.currentFolder);
        }
        
        if (filteredFavorites.length === 0) {
            listContainer.innerHTML = `
                <div class="favorites-empty">
                    <div class="favorites-empty-icon">📦</div>
                    <p class="favorites-empty-text">還沒有收藏作品</p>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = filteredFavorites.map(item => `
            <div class="favorite-item" onclick="favoritesSystem.viewPortfolio(${item.id})">
                <img src="${item.image || 'https://via.placeholder.com/80'}" 
                     alt="${item.title}" 
                     class="favorite-item-image"
                     onerror="this.src='https://via.placeholder.com/80?text=作品'">
                <div class="favorite-item-content">
                    <h3 class="favorite-item-title">${item.title}</h3>
                    <p class="favorite-item-author">by ${item.author || '未知'}</p>
                    <div class="favorite-item-stats">
                        <span><i class="fas fa-eye"></i> ${item.views || 0}</span>
                        <span><i class="fas fa-heart"></i> ${item.likes || 0}</span>
                        <span><i class="fas fa-comment"></i> ${item.comments || 0}</span>
                    </div>
                </div>
                <button class="remove-favorite-btn" 
                        onclick="event.stopPropagation(); favoritesSystem.removeFavorite(${item.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    /**
     * 添加收藏
     */
    addFavorite(portfolioData) {
        const favorites = this.getFavorites();
        
        // 檢查是否已收藏
        if (favorites.some(f => f.id === portfolioData.id)) {
            console.log('已經收藏過了');
            return false;
        }
        
        // 添加到收藏
        const favoriteItem = {
            id: portfolioData.id,
            title: portfolioData.title,
            author: portfolioData.author || portfolioData.authorName,
            image: portfolioData.image || portfolioData.imageUrl || portfolioData.thumbnail_url,
            views: portfolioData.views || 0,
            likes: portfolioData.likes || 0,
            comments: portfolioData.comments || 0,
            folder: this.currentFolder === 'all' ? 'web' : this.currentFolder,
            addedAt: new Date().toISOString()
        };
        
        favorites.push(favoriteItem);
        localStorage.setItem(this.storageKey, JSON.stringify(favorites));
        
        // 更新 UI
        this.updateCount();
        this.renderList();
        
        // 顯示通知
        this.showNotification('已加入收藏 ❤️');
        
        return true;
    }

    /**
     * 移除收藏
     */
    removeFavorite(portfolioId) {
        let favorites = this.getFavorites();
        favorites = favorites.filter(f => f.id !== portfolioId);
        localStorage.setItem(this.storageKey, JSON.stringify(favorites));
        
        // 更新 UI
        this.updateCount();
        this.renderList();
        
        // 顯示通知
        this.showNotification('已取消收藏');
    }

    /**
     * 切換收藏狀態
     */
    toggleFavorite(portfolioData) {
        const favorites = this.getFavorites();
        const isFavorited = favorites.some(f => f.id === portfolioData.id);
        
        if (isFavorited) {
            this.removeFavorite(portfolioData.id);
            return false;
        } else {
            this.addFavorite(portfolioData);
            return true;
        }
    }

    /**
     * 檢查是否已收藏
     */
    isFavorited(portfolioId) {
        const favorites = this.getFavorites();
        return favorites.some(f => f.id === portfolioId);
    }

    /**
     * 切換資料夾
     */
    switchFolder(folderId) {
        this.currentFolder = folderId;
        this.renderTabs();
        this.renderList();
    }

    /**
     * 新增資料夾
     */
    addFolder() {
        const name = prompt('請輸入資料夾名稱：');
        if (!name) return;
        
        const folders = this.getFolders();
        const newFolder = {
            id: 'folder_' + Date.now(),
            name: name,
            icon: '📁'
        };
        
        folders.push(newFolder);
        localStorage.setItem(this.foldersKey, JSON.stringify(folders));
        
        this.renderTabs();
        this.showNotification(`已新增資料夾「${name}」`);
    }

    /**
     * 打開面板
     */
    openPanel() {
        const panel = document.getElementById('favoritesPanel');
        panel.classList.add('open');
        this.renderList();
    }

    /**
     * 關閉面板
     */
    closePanel() {
        const panel = document.getElementById('favoritesPanel');
        panel.classList.remove('open');
    }

    /**
     * 查看作品
     */
    viewPortfolio(portfolioId) {
        this.closePanel();
        // 跳轉到作品詳情頁
        window.location.href = `student/portfolio-detail.html?id=${portfolioId}`;
    }

    /**
     * 匯出收藏
     */
    exportFavorites() {
        const favorites = this.getFavorites();
        const dataStr = JSON.stringify(favorites, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `favorites_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('已匯出收藏清單');
    }

    /**
     * 清空收藏
     */
    clearFavorites() {
        if (!confirm('確定要清空所有收藏嗎？此操作無法恢復。')) {
            return;
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify([]));
        this.updateCount();
        this.renderList();
        this.showNotification('已清空收藏');
    }

    /**
     * 獲取收藏列表
     */
    getFavorites() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    /**
     * 獲取資料夾列表
     */
    getFolders() {
        const data = localStorage.getItem(this.foldersKey);
        return data ? JSON.parse(data) : [];
    }

    /**
     * 更新收藏計數
     */
    updateCount() {
        const count = this.getFavorites().length;
        
        const countElements = document.querySelectorAll('#favoritesCount, #favoritesBadge');
        countElements.forEach(el => {
            if (el) el.textContent = count;
        });
        
        // 隱藏/顯示徽章
        const badge = document.getElementById('favoritesBadge');
        if (badge) {
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    /**
     * 顯示通知
     */
    showNotification(message) {
        // 如果有成就系統，使用成就通知
        if (typeof showAchievement === 'function') {
            showAchievement({
                type: 'badge',
                title: message,
                subtitle: '收藏夾',
                icon: '❤️',
                duration: 2000
            });
        } else {
            // 簡單的通知
            alert(message);
        }
    }
}

// 創建全局實例
window.favoritesSystem = new FavoritesSystem();

// 全局方法
window.toggleFavorite = function(portfolioData) {
    return window.favoritesSystem.toggleFavorite(portfolioData);
};

window.isFavorited = function(portfolioId) {
    return window.favoritesSystem.isFavorited(portfolioId);
};

