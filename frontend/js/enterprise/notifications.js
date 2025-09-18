/**
 * 企業通知 JavaScript
 * 包含通知管理、篩選、標記已讀等功能
 */

// TODO: 從後端 API 載入通知資料
let notifications = [
    {
        id: 1,
        type: 'application',
        title: '新的實習申請',
        message: '張小明申請了「前端開發實習生」職缺。請查看申請資料並回覆。',
        time: '2 小時前',
        isRead: false,
        actions: ['viewApplication', 'markAsRead']
    },
    {
        id: 2,
        type: 'job',
        title: '職缺瀏覽數增加',
        message: '「UI/UX 設計師」職缺今日瀏覽次數增加 15 次，共有 89 次瀏覽。',
        time: '4 小時前',
        isRead: false,
        actions: ['viewJob', 'markAsRead']
    },
    {
        id: 3,
        type: 'view',
        title: '作品被瀏覽',
        message: '李大明瀏覽了您的企業資料頁面，並對「前端開發實習生」職缺表示興趣。',
        time: '6 小時前',
        isRead: true,
        actions: ['viewStudent', 'contactStudent']
    },
    {
        id: 4,
        type: 'contact',
        title: '學生聯絡訊息',
        message: '王小美發送了一則聯絡訊息，詢問關於實習機會的詳細資訊。',
        time: '1 天前',
        isRead: true,
        actions: ['viewMessage', 'replyMessage']
    },
    {
        id: 5,
        type: 'system',
        title: '系統維護通知',
        message: '系統將於今晚 23:00-02:00 進行維護，期間可能無法使用部分功能。',
        time: '2 天前',
        isRead: true,
        actions: ['markAsRead']
    }
];

// 當前篩選條件
let currentFilter = 'all';

// 通知統計
let notificationStats = {
    total: 12,
    unread: 5,
    application: 3,
    job: 2,
    view: 4,
    contact: 2,
    system: 1
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    renderNotifications();
    updateStats();
    initEventListeners();
});

// 初始化事件監聽器
function initEventListeners() {
    // 通知項目點擊
    document.addEventListener('click', function(e) {
        if (e.target.closest('.notification-item')) {
            const notificationId = e.target.closest('.notification-item').dataset.id;
            if (notificationId && !e.target.closest('.notification-actions')) {
                markAsRead(notificationId);
            }
        }
    });
}

// 渲染通知列表
function renderNotifications(filteredNotifications = null) {
    const notificationsList = document.getElementById('notificationsList');
    const notificationsToRender = filteredNotifications || notifications;
    
    if (notificationsToRender.length === 0) {
        notificationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <h3>沒有通知</h3>
                <p>當有新的活動時，通知會出現在這裡</p>
            </div>
        `;
        return;
    }
    
    notificationsList.innerHTML = notificationsToRender.map(notification => `
        <div class="notification-item ${notification.isRead ? '' : 'unread'}" data-type="${notification.type}" data-id="${notification.id}">
            <div class="notification-header">
                <div class="notification-icon notification-${notification.type}">
                    <i class="fas ${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-meta">
                        <span class="notification-time">${notification.time}</span>
                        <div class="notification-actions">
                            ${renderNotificationActions(notification)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// 取得通知圖示
function getNotificationIcon(type) {
    const icons = {
        'application': 'fa-file-alt',
        'job': 'fa-briefcase',
        'view': 'fa-eye',
        'contact': 'fa-envelope',
        'system': 'fa-cog'
    };
    return icons[type] || 'fa-bell';
}

// 渲染通知操作按鈕
function renderNotificationActions(notification) {
    return notification.actions.map(action => {
        const actionText = getActionText(action);
        return `<button class="notification-action" onclick="${action}(${notification.id})">${actionText}</button>`;
    }).join('');
}

// 取得操作按鈕文字
function getActionText(action) {
    const actionTexts = {
        'viewApplication': '查看申請',
        'viewJob': '查看職缺',
        'viewStudent': '查看學生',
        'contactStudent': '聯絡學生',
        'viewMessage': '查看訊息',
        'replyMessage': '回覆',
        'markAsRead': '標記已讀'
    };
    return actionTexts[action] || action;
}

// 篩選通知
function filterNotifications(filter) {
    currentFilter = filter;
    
    // 更新篩選按鈕狀態
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    let filteredNotifications;
    
    switch (filter) {
        case 'unread':
            filteredNotifications = notifications.filter(n => !n.isRead);
            break;
        case 'application':
            filteredNotifications = notifications.filter(n => n.type === 'application');
            break;
        case 'job':
            filteredNotifications = notifications.filter(n => n.type === 'job');
            break;
        case 'view':
            filteredNotifications = notifications.filter(n => n.type === 'view');
            break;
        case 'contact':
            filteredNotifications = notifications.filter(n => n.type === 'contact');
            break;
        case 'system':
            filteredNotifications = notifications.filter(n => n.type === 'system');
            break;
        default:
            filteredNotifications = notifications;
    }
    
    renderNotifications(filteredNotifications);
    updateNotificationsCount(filteredNotifications.length);
}

// 更新通知數量
function updateNotificationsCount(count) {
    const countElement = document.getElementById('notificationsCount');
    if (countElement) {
        countElement.textContent = count;
    }
}

// 更新統計資料
function updateStats() {
    const stats = notificationStats;
    
    // 更新統計數字
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = stats.total;
        statNumbers[1].textContent = stats.unread;
        statNumbers[2].textContent = stats.application;
        statNumbers[3].textContent = stats.job;
    }
    
    // 更新類型統計
    const typeCounts = document.querySelectorAll('.type-count');
    if (typeCounts.length >= 5) {
        typeCounts[0].textContent = stats.application;
        typeCounts[1].textContent = stats.job;
        typeCounts[2].textContent = stats.view;
        typeCounts[3].textContent = stats.contact;
        typeCounts[4].textContent = stats.system;
    }
}

// 標記通知為已讀
async function markAsRead(notificationId) {
    try {
        // TODO: 發送標記已讀請求到後端 API
        // await fetch(`/api/enterprise/notifications/${notificationId}/read`, {
        //     method: 'PUT'
        // });
        
        // 更新本地狀態
        const notification = notifications.find(n => n.id == notificationId);
        if (notification) {
            notification.isRead = true;
            notificationStats.unread = Math.max(0, notificationStats.unread - 1);
            
            // 更新 UI
            const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
            if (notificationElement) {
                notificationElement.classList.remove('unread');
                // 加入一次性動畫類名
                notificationElement.classList.add('just-read');
                // 動畫結束後移除類名，避免重複堆疊
                setTimeout(() => notificationElement.classList.remove('just-read'), 900);
            }
            
            updateStats();
            Utils.showNotification('已標記為已讀', 'success');
        }
        
    } catch (error) {
        Utils.showNotification('操作失敗，請稍後再試', 'error');
        console.error('標記已讀錯誤:', error);
    }
}

// 全部標記已讀
async function markAllAsRead() {
    try {
        // TODO: 發送全部標記已讀請求到後端 API
        // await fetch('/api/enterprise/notifications/mark-all-read', {
        //     method: 'PUT'
        // });
        
        // 更新本地狀態
        notifications.forEach(n => n.isRead = true);
        notificationStats.unread = 0;
        
        // 更新 UI
        document.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('unread');
        });
        
        updateStats();
        Utils.showNotification('全部通知已標記為已讀', 'success');
        
    } catch (error) {
        Utils.showNotification('操作失敗，請稍後再試', 'error');
        console.error('全部標記已讀錯誤:', error);
    }
}

// 清除通知
function clearNotifications() {
    if (confirm('確定要清除所有通知嗎？此操作無法復原。')) {
        try {
            // TODO: 發送清除通知請求到後端 API
            // await fetch('/api/enterprise/notifications', {
            //     method: 'DELETE'
            // });
            
            // 清除本地資料
            notifications = [];
            notificationStats = {
                total: 0,
                unread: 0,
                application: 0,
                job: 0,
                view: 0,
                contact: 0,
                system: 0
            };
            
            renderNotifications();
            updateStats();
            Utils.showNotification('所有通知已清除', 'success');
            
        } catch (error) {
            Utils.showNotification('清除失敗，請稍後再試', 'error');
            console.error('清除通知錯誤:', error);
        }
    }
}

// 查看申請
function viewApplication(notificationId) {
    // TODO: 跳轉到申請詳情頁面
    window.location.href = `applications.html?notification=${notificationId}`;
}

// 查看職缺
function viewJob(notificationId) {
    // TODO: 跳轉到職缺詳情頁面
    window.location.href = `jobs.html?notification=${notificationId}`;
}

// 查看學生
function viewStudent(notificationId) {
    // TODO: 跳轉到學生資料頁面
    window.location.href = `student-profile.html?notification=${notificationId}`;
}

// 聯絡學生
function contactStudent(notificationId) {
    // TODO: 開啟聯絡對話框
    Utils.showNotification('聯絡功能開發中', 'info');
}

// 查看訊息
function viewMessage(notificationId) {
    // TODO: 開啟訊息詳情對話框
    Utils.showNotification('訊息功能開發中', 'info');
}

// 回覆訊息
function replyMessage(notificationId) {
    // TODO: 開啟回覆對話框
    Utils.showNotification('回覆功能開發中', 'info');
}

// 重新整理通知
function refreshNotifications() {
    // TODO: 從後端重新載入通知
    Utils.showNotification('正在重新整理...', 'info');
    
    setTimeout(() => {
        renderNotifications();
        updateStats();
        Utils.showNotification('通知已更新', 'success');
    }, 1000);
}

// 全域函數，供 HTML 直接調用
window.filterNotifications = filterNotifications;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.clearNotifications = clearNotifications;
window.viewApplication = viewApplication;
window.viewJob = viewJob;
window.viewStudent = viewStudent;
window.contactStudent = contactStudent;
window.viewMessage = viewMessage;
window.replyMessage = replyMessage;
window.refreshNotifications = refreshNotifications; 