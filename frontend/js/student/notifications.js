/**
 * 學生通知中心 JavaScript
 * 包含通知管理、篩選、批量操作等功能
 */

// 通知資料陣列
let notifications = [];

// 當前篩選條件
let currentFilters = {
    type: '',
    status: '',
    time: ''
};

// 選中的通知
let selectedNotifications = new Set();

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    loadNotifications();
    initEventListeners();
    updateStats();
});

// 載入通知
async function loadNotifications() {
    try {
        // 從 localStorage 獲取使用者資訊
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            throw new Error('無法獲取使用者資訊');
        }
        
        // 從後端 API 載入通知
        const response = await fetch(`/portfolio/api/student/notifications.php?action=get&user_id=${user.id}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': user.id
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
            notifications = Array.isArray(result.data) ? result.data : [];
            renderNotifications();
        } else {
            throw new Error(result.message || '載入通知失敗');
        }
        
    } catch (error) {
        console.error('載入通知失敗:', error);
        Utils.showNotification('載入通知失敗，請稍後再試', 'error');
        // 如果 API 失敗，顯示空狀態
        notifications = [];
        renderNotifications();
    }
}

// 初始化事件監聽器
function initEventListeners() {
    // 篩選器事件
    document.getElementById('typeFilter').addEventListener('change', function() {
        currentFilters.type = this.value;
        applyFilters();
    });
    
    document.getElementById('statusFilter').addEventListener('change', function() {
        currentFilters.status = this.value;
        applyFilters();
    });
    
    document.getElementById('timeFilter').addEventListener('change', function() {
        currentFilters.time = this.value;
        applyFilters();
    });
}

// 渲染通知列表
function renderNotifications(filteredNotifications = null) {
    const list = document.getElementById('notificationsList');
    const emptyState = document.getElementById('emptyState');
    
    const notificationsToRender = filteredNotifications || notifications;
    
    if (notificationsToRender.length === 0) {
        list.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    list.style.display = 'block';
    emptyState.style.display = 'none';
    
    list.innerHTML = notificationsToRender.map(notification => `
        <div class="notification-item ${notification.status === 'unread' ? 'unread' : ''}" 
             data-type="${notification.type}" 
             data-status="${notification.status}"
             data-id="${notification.id}">
            <input type="checkbox" class="notification-checkbox" onchange="updateSelection()">
            <div class="notification-icon ${notification.type}">
                <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-header">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-time">${notification.time}</div>
                </div>
                <div class="notification-text">
                    ${notification.text}
                </div>
                ${notification.preview ? `<div class="notification-preview">${notification.preview}</div>` : ''}
                <div class="notification-actions">
                    ${getNotificationActions(notification)}
                </div>
            </div>
        </div>
    `).join('');
}

// 取得通知圖示
function getNotificationIcon(type) {
    const iconMap = {
        'like': 'heart',
        'comment': 'comment',
        'view': 'eye',
        'system': 'cog',
        'enterprise': 'building'
    };
    return iconMap[type] || 'bell';
}

// 取得通知操作按鈕
function getNotificationActions(notification) {
    let actions = '';
    
    switch (notification.type) {
        case 'like':
        case 'view':
            actions += `<button class="notification-action" onclick="viewPortfolio(${notification.portfolioId})">
                <i class="fas fa-eye"></i> 查看作品
            </button>`;
            break;
        case 'comment':
            actions += `<button class="notification-action" onclick="viewComment(${notification.commentId})">
                <i class="fas fa-eye"></i> 查看評論
            </button>`;
            break;
        case 'enterprise':
            actions += `<button class="notification-action" onclick="viewEnterprise(${notification.enterpriseId})">
                <i class="fas fa-building"></i> 查看企業
            </button>`;
            break;
        case 'system':
            actions += `<button class="notification-action" onclick="viewPortfolio(${notification.portfolioId})">
                <i class="fas fa-eye"></i> 查看作品
            </button>`;
            break;
    }
    
    if (notification.status === 'unread') {
        actions += `<button class="notification-action" onclick="markRead(this)">
            <i class="fas fa-check"></i> 標記已讀
        </button>`;
    }
    
    return actions;
}

// 應用篩選器
function applyFilters() {
    let filteredNotifications = notifications;
    
    // 類型篩選
    if (currentFilters.type) {
        filteredNotifications = filteredNotifications.filter(n => n.type === currentFilters.type);
    }
    
    // 狀態篩選
    if (currentFilters.status) {
        filteredNotifications = filteredNotifications.filter(n => n.status === currentFilters.status);
    }
    
    // 時間篩選
    if (currentFilters.time) {
        filteredNotifications = filteredNotifications.filter(n => {
            const time = n.time;
            const now = new Date();
            
            switch (currentFilters.time) {
                case 'today':
                    return time.includes('分鐘前') || time.includes('小時前') || time.includes('今天');
                case 'week':
                    return time.includes('天前') && parseInt(time) <= 7;
                case 'month':
                    return time.includes('天前') && parseInt(time) <= 30;
                default:
                    return true;
            }
        });
    }
    
    renderNotifications(filteredNotifications);
}

// 更新選中狀態
function updateSelection() {
    const checkboxes = document.querySelectorAll('.notification-checkbox:checked');
    selectedNotifications.clear();
    
    checkboxes.forEach(checkbox => {
        const notificationItem = checkbox.closest('.notification-item');
        const notificationId = parseInt(notificationItem.dataset.id);
        selectedNotifications.add(notificationId);
    });
    
    updateBulkActions();
}

// 更新批量操作
function updateBulkActions() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedNotifications.size > 0) {
        bulkActions.classList.add('show');
        selectedCount.textContent = `已選擇 ${selectedNotifications.size} 項`;
    } else {
        bulkActions.classList.remove('show');
    }
}

// 全選
function selectAll() {
    const checkboxes = document.querySelectorAll('.notification-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
    
    updateSelection();
}

// 標記已讀
function markRead(button) {
    const notificationItem = button.closest('.notification-item');
    const notificationId = parseInt(notificationItem.dataset.id);
    
    // TODO: 發送標記已讀請求到後端 API
    // fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
    
    // 更新本地狀態
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.status = 'read';
    }
    
    notificationItem.classList.remove('unread');
    button.remove();
    
    updateStats();
    Utils.showNotification('已標記為已讀', 'success');
}

// 標記選中的為已讀
function markSelectedRead() {
    if (selectedNotifications.size === 0) {
        Utils.showNotification('請先選擇要標記的通知', 'warning');
        return;
    }
    
    // TODO: 發送批量標記已讀請求到後端 API
    // fetch('/api/notifications/mark-read', {
    //     method: 'PUT',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ ids: Array.from(selectedNotifications) })
    // });
    
    // 更新本地狀態
    selectedNotifications.forEach(id => {
        const notification = notifications.find(n => n.id === id);
        if (notification) {
            notification.status = 'read';
        }
        
        const notificationItem = document.querySelector(`[data-id="${id}"]`);
        if (notificationItem) {
            notificationItem.classList.remove('unread');
            const markReadBtn = notificationItem.querySelector('.notification-action:last-child');
            if (markReadBtn && markReadBtn.textContent.includes('標記已讀')) {
                markReadBtn.remove();
            }
        }
    });
    
    selectedNotifications.clear();
    updateBulkActions();
    updateStats();
    renderNotifications();
    
    Utils.showNotification('已標記選中的通知為已讀', 'success');
}

// 全部標記已讀
function markAllRead() {
    if (notifications.filter(n => n.status === 'unread').length === 0) {
        Utils.showNotification('沒有未讀通知', 'info');
        return;
    }
    
    // TODO: 發送全部標記已讀請求到後端 API
    // fetch('/api/notifications/mark-all-read', { method: 'PUT' });
    
    // 更新本地狀態
    notifications.forEach(notification => {
        notification.status = 'read';
    });
    
    // 更新顯示
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread');
        const markReadBtn = item.querySelector('.notification-action:last-child');
        if (markReadBtn && markReadBtn.textContent.includes('標記已讀')) {
            markReadBtn.remove();
        }
    });
    
    updateStats();
    Utils.showNotification('已標記所有通知為已讀', 'success');
}

// 刪除選中的通知
function deleteSelected() {
    if (selectedNotifications.size === 0) {
        Utils.showNotification('請先選擇要刪除的通知', 'warning');
        return;
    }
    
    if (!confirm(`確定要刪除選中的 ${selectedNotifications.size} 個通知嗎？`)) {
        return;
    }
    
    // TODO: 發送批量刪除請求到後端 API
    // fetch('/api/notifications/delete', {
    //     method: 'DELETE',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ ids: Array.from(selectedNotifications) })
    // });
    
    // 更新本地狀態
    selectedNotifications.forEach(id => {
        const index = notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            notifications.splice(index, 1);
        }
        
        const notificationItem = document.querySelector(`[data-id="${id}"]`);
        if (notificationItem) {
            notificationItem.remove();
        }
    });
    
    selectedNotifications.clear();
    updateBulkActions();
    updateStats();
    
    Utils.showNotification('已刪除選中的通知', 'success');
}

// 更新統計資料
function updateStats() {
    const unreadCount = notifications.filter(n => n.status === 'unread').length;
    const totalCount = notifications.length;
    const todayCount = notifications.filter(n => {
        const time = n.time;
        return time.includes('分鐘前') || time.includes('小時前') || time.includes('今天');
    }).length;
    const enterpriseCount = notifications.filter(n => n.type === 'enterprise').length;
    
    // 更新統計卡片
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = unreadCount;
        statNumbers[1].textContent = totalCount;
        statNumbers[2].textContent = todayCount;
        statNumbers[3].textContent = enterpriseCount;
    }
}

// 查看作品
function viewPortfolio(portfolioId) {
    // 跳轉到作品詳情頁面
    window.location.href = `portfolio-detail.html?id=${portfolioId}`;
}

// 查看評論
function viewComment(commentId) {
    // TODO: 跳轉到評論詳情頁面或顯示評論模態框
    Utils.showNotification('查看評論功能開發中', 'info');
}

// 查看企業
function viewEnterprise(enterpriseId) {
    // TODO: 跳轉到企業詳情頁面
    Utils.showNotification('查看企業功能開發中', 'info');
}

// 全域函數供 HTML 使用
window.selectAll = selectAll;
window.markAllRead = markAllRead;
window.deleteSelected = deleteSelected;
window.markSelectedRead = markSelectedRead;
window.updateSelection = updateSelection;
window.applyFilters = applyFilters;
window.viewPortfolio = viewPortfolio;
window.viewComment = viewComment;
window.viewEnterprise = viewEnterprise;
window.markRead = markRead; 