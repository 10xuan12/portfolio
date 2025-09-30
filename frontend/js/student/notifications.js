/**
 * 學生通知中心 JavaScript - 完全採用企業版設計
 * 包含通知管理、篩選、批量操作等功能
 */

(function() {
    'use strict';

    // 通知資料陣列
    let notifications = [];

    // 當前篩選條件
    let currentFilter = 'all';

    // 初始化頁面
    document.addEventListener('DOMContentLoaded', function() {
        loadNotifications();
        // 如果沒有通知資料，載入測試資料
        setTimeout(() => {
            if (notifications.length === 0) {
                loadTestData();
            }
        }, 1000);
    });

    // 載入測試資料（用於演示）
    function loadTestData() {
        notifications = [
            { id: 1, type: 'like', status: 'unread', title: '有人讚了您的作品', text: '王小明讚了您的「網頁設計作品」', time: '5分鐘前', portfolioId: 1 },
            { id: 2, type: 'comment', status: 'unread', title: '新的評論', text: '李小花評論了您的作品', time: '1小時前', commentId: 1, portfolioId: 1 },
            { id: 3, type: 'view', status: 'read', title: '作品被瀏覽', text: '您的作品「UI設計」被瀏覽了', time: '2小時前', portfolioId: 2 },
            { id: 4, type: 'system', status: 'unread', title: '系統通知', text: '您的帳戶已成功驗證', time: '3小時前' },
            { id: 5, type: 'enterprise', status: 'unread', title: '企業聯絡', text: 'ABC公司對您的作品感興趣', time: '1天前', enterpriseId: 1 },
            { id: 6, type: 'like', status: 'read', title: '有人讚了您的作品', text: '張三讚了您的「APP設計」', time: '2天前', portfolioId: 3 },
            { id: 7, type: 'system', status: 'read', title: '系統更新', text: '系統將於今晚進行維護', time: '3天前' },
            { id: 8, type: 'comment', status: 'unread', title: '新的評論', text: '陳小華評論了您的作品', time: '4天前', commentId: 2, portfolioId: 4 },
            { id: 9, type: 'view', status: 'read', title: '作品被瀏覽', text: '您的作品「品牌設計」被瀏覽了', time: '5天前', portfolioId: 5 },
            { id: 10, type: 'enterprise', status: 'unread', title: '企業聯絡', text: 'XYZ公司邀請您面試', time: '1週前', enterpriseId: 2 },
            { id: 11, type: 'like', status: 'unread', title: '有人讚了您的作品', text: '劉小美讚了您的「海報設計」', time: '1週前', portfolioId: 6 },
            { id: 12, type: 'system', status: 'read', title: '系統通知', text: '您的個人資料已更新', time: '2週前' },
            { id: 13, type: 'comment', status: 'read', title: '新的評論', text: '王小強評論了您的作品', time: '2週前', commentId: 3, portfolioId: 7 },
            { id: 14, type: 'view', status: 'unread', title: '作品被瀏覽', text: '您的作品「插畫設計」被瀏覽了', time: '3週前', portfolioId: 8 }
        ];
        
        console.log('載入測試資料:', notifications.length, '個通知');
        renderNotifications();
        updateStats();
    }

    // 載入通知
    async function loadNotifications() {
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            // 使用標準化的API服務方法
            const result = await apiService.getNotifications(user.id);
            
            if (result.success) {
                notifications = result.data;
                console.log('載入通知成功:', notifications.length, '個通知');
                renderNotifications();
                updateStats();
            } else {
                throw new Error(result.message || '載入通知失敗');
            }
            
        } catch (error) {
            console.error('載入通知失敗:', error);
            Utils.showNotification(error.message || '載入通知失敗，請稍後再試', 'error');
            // 如果 API 失敗，顯示空狀態
            notifications = [];
            renderNotifications();
            updateStats();
        }
    }

    // 渲染通知列表
    function renderNotifications() {
        const list = document.getElementById('notificationsList');
        const countElement = document.getElementById('notificationsCount');
        
        // 根據當前篩選條件過濾通知
        let filteredNotifications = notifications;
        if (currentFilter !== 'all') {
            filteredNotifications = notifications.filter(n => n.type === currentFilter);
        }
        
        countElement.textContent = filteredNotifications.length;
        
        if (filteredNotifications.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <h3>沒有通知</h3>
                    <p>當有新的活動時，您會在這裡看到通知</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = filteredNotifications.map(notification => `
            <div class="notification-item ${notification.status === 'unread' ? 'unread' : ''}" 
                 data-type="${notification.type}" 
                 data-status="${notification.status}"
                 data-id="${notification.id}">
                <div class="notification-header">
                    <div class="notification-icon notification-${notification.type}">
                        <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-message">${notification.text}</div>
                        <div class="notification-meta">
                            <div class="notification-time">${notification.time}</div>
                            <div class="notification-actions">
                                ${getNotificationActions(notification)}
                            </div>
                        </div>
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

    // 篩選通知
    function filterNotifications(filter) {
        // 更新篩選按鈕狀態
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        currentFilter = filter;
        renderNotifications();
    }

    // 標記已讀
    async function markRead(button) {
        const notificationItem = button.closest('.notification-item');
        const notificationId = parseInt(notificationItem.dataset.id);
        
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            // 發送標記已讀請求到後端 API
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request('student/notifications.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'mark_read',
                    notification_id: notificationId,
                    user_id: user.id
                })
            });
            
            if (result.status === 200) {
                // 更新本地狀態
                const notification = notifications.find(n => n.id === notificationId);
                if (notification) {
                    notification.status = 'read';
                }
                
                notificationItem.classList.remove('unread');
                button.remove();
                
                updateStats();
                Utils.showNotification('已標記為已讀', 'success');
            } else {
                throw new Error(result.message || '標記已讀失敗');
            }
            
        } catch (error) {
            console.error('標記已讀失敗:', error);
            Utils.showNotification('標記已讀失敗，請稍後再試', 'error');
        }
    }

    // 全部標記已讀
    async function markAllAsRead() {
        const unreadNotifications = notifications.filter(n => n.status === 'unread');
        if (unreadNotifications.length === 0) {
            Utils.showNotification('沒有未讀通知', 'info');
            return;
        }
        
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            // 發送全部標記已讀請求到後端 API
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request('student/notifications.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'mark_all_read',
                    user_id: user.id
                })
            });
            
            if (result.status === 200) {
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
            } else {
                throw new Error(result.message || '全部標記已讀失敗');
            }
            
        } catch (error) {
            console.error('全部標記已讀失敗:', error);
            Utils.showNotification('全部標記已讀失敗，請稍後再試', 'error');
        }
    }

    // 清除通知
    async function clearNotifications() {
        if (notifications.length === 0) {
            Utils.showNotification('沒有通知可清除', 'info');
            return;
        }
        
        if (!confirm(`確定要清除所有通知嗎？`)) {
            return;
        }
        
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            // 發送清除通知請求到後端 API
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request('student/notifications.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'clear_all',
                    user_id: user.id
                })
            });
            
            if (result.status === 200) {
                // 更新本地狀態
                notifications = [];
                
                // 更新顯示
                renderNotifications();
                updateStats();
                
                Utils.showNotification('已清除所有通知', 'success');
            } else {
                throw new Error(result.message || '清除通知失敗');
            }
            
        } catch (error) {
            console.error('清除通知失敗:', error);
            Utils.showNotification('清除通知失敗，請稍後再試', 'error');
        }
    }

    // 更新統計資料
    function updateStats() {
        const unreadCount = notifications.filter(n => n.status === 'unread').length;
        const totalCount = notifications.length;
        const contactCount = notifications.filter(n => n.type === 'enterprise' || n.type === 'contact').length;
        const systemCount = notifications.filter(n => n.type === 'system').length;
        
        console.log('統計資料更新:', {
            total: totalCount,
            unread: unreadCount,
            contact: contactCount,
            system: systemCount
        });
        
        // 更新統計卡片
        const statNumbers = document.querySelectorAll('.number');
        if (statNumbers.length >= 4) {
            statNumbers[0].textContent = totalCount;
            statNumbers[1].textContent = unreadCount;
            statNumbers[2].textContent = contactCount;
            statNumbers[3].textContent = systemCount;
            console.log('統計卡片已更新');
        } else {
            console.warn('找不到足夠的統計卡片元素:', statNumbers.length);
        }
    }

    // 查看作品
    function viewPortfolio(portfolioId) {
        // 跳轉到作品詳情頁面
        window.location.href = `portfolio-detail.html?id=${portfolioId}`;
    }

    // 查看評論
    function viewComment(commentId) {
        // 跳轉到評論詳情頁面或顯示評論模態框
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            // 跳轉到作品詳情頁面並顯示評論
            window.location.href = `portfolio-detail.html?comment=${commentId}`;
            
        } catch (error) {
            console.error('查看評論失敗:', error);
            Utils.showNotification('查看評論失敗，請稍後再試', 'error');
        }
    }

    // 查看企業
    function viewEnterprise(enterpriseId) {
        // 跳轉到企業詳情頁面
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            // 跳轉到企業詳情頁面
            window.location.href = `../enterprise/profile.html?id=${enterpriseId}`;
            
        } catch (error) {
            console.error('查看企業失敗:', error);
            Utils.showNotification('查看企業失敗，請稍後再試', 'error');
        }
    }

    // 全域函數供 HTML 使用
    window.filterNotifications = filterNotifications;
    window.markAllAsRead = markAllAsRead;
    window.clearNotifications = clearNotifications;
    window.viewPortfolio = viewPortfolio;
    window.viewComment = viewComment;
    window.viewEnterprise = viewEnterprise;
    window.markRead = markRead;

})();