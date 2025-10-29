/**
 * 企業收藏管理 JavaScript
 * 顯示和管理企業收藏的作品
 */

let bookmarks = [];
let filteredBookmarks = [];

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    loadBookmarks();
    setupEventListeners();
});

/**
 * 載入收藏作品
 */
async function loadBookmarks() {
    try {
        showLoadingState();
        
        const svc = window.apiService || window.initializeApiService?.();
        if (!svc) {
            throw new Error('API 服務未就緒');
        }

        const response = await svc.request('enterprise/portfolios.php?action=bookmarks');
        const data = response?.data || response || [];
        
        // 使用 Map 去重，確保每個作品只出現一次
        const uniqueBookmarks = Array.isArray(data) ? data : [];
        const bookmarksMap = new Map();
        uniqueBookmarks.forEach(bookmark => {
            if (bookmark.id && !bookmarksMap.has(bookmark.id)) {
                bookmarksMap.set(bookmark.id, bookmark);
            }
        });
        
        bookmarks = Array.from(bookmarksMap.values());
        filteredBookmarks = [...bookmarks];
        
        updateStats();
        renderBookmarks();
        hideLoadingState();
        
        console.log('載入了', bookmarks.length, '個收藏作品（已去重）');
        console.log('收藏作品 IDs:', bookmarks.map(b => b.id));
    } catch (error) {
        console.error('載入收藏作品失敗:', error);
        hideLoadingState();
        showEmptyState();
        showNotification('載入收藏作品失敗', 'error');
    }
}

/**
 * 更新統計數據
 */
function updateStats() {
    const totalElement = document.getElementById('totalBookmarks');
    if (totalElement) {
        totalElement.textContent = bookmarks.length;
    }
}

/**
 * 渲染收藏作品
 */
function renderBookmarks() {
    const grid = document.getElementById('bookmarksGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!grid) return;
    
    if (filteredBookmarks.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = filteredBookmarks.map(bookmark => createBookmarkCard(bookmark)).join('');
}

/**
 * 創建收藏卡片
 */
function createBookmarkCard(bookmark) {
    const coverImage = bookmark.cover_image && bookmark.cover_image !== 'null' 
        ? getImageUrl(bookmark.cover_image) 
        : getDefaultThumbnail(bookmark.category_name);
    
    const studentName = bookmark.display_name || 
                       (bookmark.first_name && bookmark.last_name ? `${bookmark.first_name} ${bookmark.last_name}` : '') ||
                       bookmark.username || '學生';
    
    const studentInfo = [bookmark.major, bookmark.school, bookmark.grade].filter(Boolean).join(' · ');
    
    const tags = Array.isArray(bookmark.tags) ? bookmark.tags : 
                 (typeof bookmark.tags === 'string' ? bookmark.tags.split(',') : []);
    
    const bookmarkedDate = bookmark.bookmarked_at ? formatDate(bookmark.bookmarked_at) : '';
    
    return `
        <div class="bookmark-card" data-id="${bookmark.id}">
            <div class="bookmark-image" onclick="viewPortfolio(${bookmark.id})">
                <img src="${coverImage}" alt="${escapeHtml(bookmark.title)}" loading="lazy">
                <div class="bookmark-overlay">
                    <button class="btn-view" onclick="event.stopPropagation(); viewPortfolio(${bookmark.id})">
                        <i class="fas fa-eye"></i> 查看作品
                    </button>
                </div>
            </div>
            
            <div class="bookmark-content">
                <div class="bookmark-header">
                    <h3 class="bookmark-title" onclick="viewPortfolio(${bookmark.id})">${escapeHtml(bookmark.title)}</h3>
                    <button class="btn-unbookmark" onclick="removeBookmark(${bookmark.id})" title="取消收藏">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
                
                <p class="bookmark-description">${escapeHtml(bookmark.description || '暫無描述')}</p>
                
                ${tags.length > 0 ? `
                <div class="bookmark-tags">
                    ${tags.slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag.trim())}</span>`).join('')}
                </div>
                ` : ''}
                
                <div class="bookmark-author" onclick="viewStudentProfile(${bookmark.user_id || 0})">
                    <img src="${bookmark.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}`}" 
                         alt="${studentName}" class="author-avatar">
                    <div class="author-info">
                        <div class="author-name">${studentName}</div>
                        ${studentInfo ? `<div class="author-detail">${studentInfo}</div>` : ''}
                    </div>
                </div>
                
                <div class="bookmark-stats">
                    <span><i class="fas fa-eye"></i> ${formatNumber(bookmark.view_count || 0)}</span>
                    <span><i class="fas fa-heart"></i> ${formatNumber(bookmark.like_count || 0)}</span>
                    <span><i class="fas fa-comment"></i> ${formatNumber(bookmark.comment_count || 0)}</span>
                </div>
                
                ${bookmarkedDate ? `
                <div class="bookmark-meta">
                    <small><i class="fas fa-clock"></i> 收藏於 ${bookmarkedDate}</small>
                </div>
                ` : ''}
                
                ${bookmark.bookmark_notes ? `
                <div class="bookmark-notes">
                    <i class="fas fa-sticky-note"></i>
                    <span>${escapeHtml(bookmark.bookmark_notes)}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * 移除收藏
 */
async function removeBookmark(portfolioId) {
    if (!confirm('確定要取消收藏這個作品嗎？')) {
        return;
    }
    
    try {
        const svc = window.apiService || window.initializeApiService?.();
        if (!svc) {
            throw new Error('API 服務未就緒');
        }

        // 調用後端 API 切換收藏狀態（因為是切換，所以已收藏的會被取消）
        const response = await svc.request('enterprise/portfolios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                action: 'bookmark',
                portfolio_id: portfolioId 
            })
        });
        
        // 從列表中移除
        bookmarks = bookmarks.filter(b => b.id !== portfolioId);
        filteredBookmarks = filteredBookmarks.filter(b => b.id !== portfolioId);
        
        updateStats();
        renderBookmarks();
        showNotification('已取消收藏', 'success');
    } catch (error) {
        console.error('取消收藏失敗:', error);
        showNotification('取消收藏失敗', 'error');
    }
}

/**
 * 查看作品詳情
 */
function viewPortfolio(portfolioId) {
    window.location.href = `../student/portfolio-detail.html?id=${portfolioId}`;
}

/**
 * 查看學生資料
 */
function viewStudentProfile(studentId) {
    if (studentId) {
        window.location.href = `student-profile.html?id=${studentId}`;
    }
}

/**
 * 設定事件監聽器
 */
function setupEventListeners() {
    // 搜尋框
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // 排序選擇器
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', handleSort);
    }
}

/**
 * 處理搜尋
 */
function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    
    if (!query) {
        filteredBookmarks = [...bookmarks];
    } else {
        filteredBookmarks = bookmarks.filter(bookmark => {
            const title = (bookmark.title || '').toLowerCase();
            const description = (bookmark.description || '').toLowerCase();
            const studentName = (bookmark.display_name || bookmark.username || '').toLowerCase();
            const tags = Array.isArray(bookmark.tags) ? bookmark.tags.join(' ').toLowerCase() : '';
            
            return title.includes(query) || 
                   description.includes(query) || 
                   studentName.includes(query) ||
                   tags.includes(query);
        });
    }
    
    renderBookmarks();
}

/**
 * 處理排序
 */
function handleSort(event) {
    const sortBy = event.target.value;
    
    switch (sortBy) {
        case 'recent':
            filteredBookmarks.sort((a, b) => new Date(b.bookmarked_at) - new Date(a.bookmarked_at));
            break;
        case 'oldest':
            filteredBookmarks.sort((a, b) => new Date(a.bookmarked_at) - new Date(b.bookmarked_at));
            break;
        case 'views':
            filteredBookmarks.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
            break;
        case 'likes':
            filteredBookmarks.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
            break;
    }
    
    renderBookmarks();
}

/**
 * 顯示載入狀態
 */
function showLoadingState() {
    const loadingElement = document.getElementById('loadingState');
    const grid = document.getElementById('bookmarksGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (loadingElement) loadingElement.style.display = 'flex';
    if (grid) grid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
}

/**
 * 隱藏載入狀態
 */
function hideLoadingState() {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * 顯示空狀態
 */
function showEmptyState() {
    const grid = document.getElementById('bookmarksGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (grid) grid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
}

/**
 * 工具函數：防抖
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 工具函數：格式化數字
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * 工具函數：格式化日期
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

/**
 * 工具函數：HTML 轉義
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 工具函數：獲取圖片 URL
 */
function getImageUrl(path) {
    if (!path || path === 'null') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // 確保路徑以 / 開頭
    return path.startsWith('/') ? path : '/' + path;
}

/**
 * 工具函數：獲取默認縮圖
 */
function getDefaultThumbnail(category) {
    const defaultImages = {
        '網頁設計': 'https://via.placeholder.com/400x300/4A90E2/ffffff?text=網頁設計',
        '平面設計': 'https://via.placeholder.com/400x300/E24A90/ffffff?text=平面設計',
        '程式開發': 'https://via.placeholder.com/400x300/90E24A/ffffff?text=程式開發',
        '多媒體': 'https://via.placeholder.com/400x300/E2904A/ffffff?text=多媒體'
    };
    return defaultImages[category] || 'https://via.placeholder.com/400x300/cccccc/ffffff?text=作品';
}

/**
 * 工具函數：顯示通知
 */
function showNotification(message, type = 'info') {
    // 使用全域通知系統（如果有的話）- 但要避免遞歸
    if (typeof window.Utils !== 'undefined' && typeof window.Utils.showNotification === 'function') {
        window.Utils.showNotification(message, type);
        return;
    }
    
    // 簡單的通知實現
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

