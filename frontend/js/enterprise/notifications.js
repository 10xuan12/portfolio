/**
 * 企業通知 JavaScript
 * 包含通知管理、篩選、標記已讀等功能
 */

// 從後端 API 載入通知資料
let notifications = [];

// 當前篩選條件
let currentFilter = 'all';

// 通知統計（初始為 0，載入後由實際資料覆蓋）
let notificationStats = {
    total: 0,
    unread: 0,
    application: 0,
    job: 0,
    view: 0,
    contact: 0,
    system: 0
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    await loadNotifications();
    renderNotifications();
    updateStats();
    initEventListeners();
});

// 載入通知
async function loadNotifications(page = 1) {
    try {
        // 確保 API 服務已初始化
        if (!window.apiService) {
            window.apiService = new ApiService();
        }
        
        const svc = window.apiService;
        const params = new URLSearchParams({ action: 'list', page: String(page), limit: '20' });
        const res = await svc.request(`enterprise/notifications.php?${params.toString()}`);
        const data = res?.data || res || {};
        const list = Array.isArray(data.notifications) ? data.notifications : (Array.isArray(data) ? data : []);
        notifications = list.map(n => {
            // 後端型別對應：enterprise → contact；其他保持原樣
            let mappedType = n.type || 'system';
            if (mappedType === 'enterprise') mappedType = 'contact';
            // 其他類型保持原樣

            return {
                id: n.id,
                type: mappedType,
                title: n.title || '',
                message: n.message || '',
                time: n.time_ago || n.created_at || '',
                isRead: !!n.is_read,
                actions: ['markAsRead']
            };
        });
        // 依通知陣列即時計算統計
        computeAndUpdateStatsFromNotifications();
    } catch (e) {
        console.error('載入通知失敗', e);
        notifications = [];
        // 顯示錯誤訊息
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('載入通知失敗，請稍後再試', 'error');
        }
    }
}
// 根據目前通知陣列計算統計並更新UI
function computeAndUpdateStatsFromNotifications() {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const contact = notifications.filter(n => n.type === 'contact').length;
    const system = notifications.filter(n => n.type === 'system').length;
    const like = notifications.filter(n => n.type === 'like').length;
    const comment = notifications.filter(n => n.type === 'comment').length;
    const view = notifications.filter(n => n.type === 'view').length;
    
    notificationStats = { total, unread, contact, system, like, comment, view };
    // 更新 header 數量
    updateNotificationsCount(total);
    // 更新側邊統計
    updateStats();
}

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
        'contact': 'fa-envelope',
        'system': 'fa-cog',
        'like': 'fa-heart',
        'comment': 'fa-comment',
        'view': 'fa-eye'
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
        case 'contact':
            filteredNotifications = notifications.filter(n => n.type === 'contact');
            break;
        case 'system':
            filteredNotifications = notifications.filter(n => n.type === 'system');
            break;
        case 'like':
            filteredNotifications = notifications.filter(n => n.type === 'like');
            break;
        case 'comment':
            filteredNotifications = notifications.filter(n => n.type === 'comment');
            break;
        case 'view':
            filteredNotifications = notifications.filter(n => n.type === 'view');
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

// 更新統計資料（套用到通知頁側欄樣式）
function updateStats() {
    const stats = notificationStats || { total: 0, unread: 0, contact: 0, system: 0 };
    const sidebarNumbers = document.querySelectorAll('.notification-stats .number');
    if (sidebarNumbers && sidebarNumbers.length >= 4) {
        sidebarNumbers[0].textContent = String(stats.total || 0);
        sidebarNumbers[1].textContent = String(stats.unread || 0);
        sidebarNumbers[2].textContent = String(stats.contact || 0);
        sidebarNumbers[3].textContent = String(stats.system || 0);
    }
}

// 標記通知為已讀
async function markAsRead(notificationId) {
    try {
        // 確保 API 服務已初始化
        if (!window.apiService) {
            window.apiService = new ApiService();
        }
        
        const svc = window.apiService;
        await svc.request('enterprise/notifications.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'mark_read', notification_id: Number(notificationId) })
        });
        
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
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('已標記為已讀', 'success');
            }
        }
        
    } catch (error) {
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('操作失敗，請稍後再試', 'error');
        }
        console.error('標記已讀錯誤:', error);
    }
}

// 全部標記已讀
async function markAllAsRead() {
    try {
        // 確保 API 服務已初始化
        if (!window.apiService) {
            window.apiService = new ApiService();
        }
        
        const svc = window.apiService;
        await svc.request('enterprise/notifications.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'mark_all_read' })
        });
        
        // 更新本地狀態
        notifications.forEach(n => n.isRead = true);
        notificationStats.unread = 0;
        
        // 更新 UI
        document.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('unread');
        });
        
        updateStats();
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('全部通知已標記為已讀', 'success');
        }
        
    } catch (error) {
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('操作失敗，請稍後再試', 'error');
        }
        console.error('全部標記已讀錯誤:', error);
    }
}

// 清除通知
function clearNotifications() {
    if (confirm('確定要清除所有通知嗎？此操作無法復原。')) {
        try {
            // 確保 API 服務已初始化
            if (!window.apiService) {
                window.apiService = new ApiService();
            }
            
            const svc = window.apiService;
            svc.request('enterprise/notifications.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'clear_all' })
            });
            
            // 清除本地資料
            notifications = [];
            notificationStats = {
                total: 0,
                unread: 0,
                contact: 0,
                system: 0,
                like: 0,
                comment: 0,
                view: 0
            };
            
            renderNotifications();
            updateStats();
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('所有通知已清除', 'success');
            }
            
        } catch (error) {
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('清除失敗，請稍後再試', 'error');
            }
            console.error('清除通知錯誤:', error);
        }
    }
}

// 查看申請
function viewApplication(notificationId) {
    window.location.href = `applications.html?notification=${notificationId}`;
}

// 查看職缺
function viewJob(notificationId) {
    window.location.href = `jobs.html?notification=${notificationId}`;
}

// 查看學生
function viewStudent(notificationId) {
    window.location.href = `student-profile.html?notification=${notificationId}`;
}

// 聯絡學生
function contactStudent(notificationId) {
    if (typeof Utils !== 'undefined' && Utils.showNotification) {
        Utils.showNotification('聯絡學生功能將導引至搜尋頁', 'info');
    }
    window.location.href = `search.html?contact_from_notification=${notificationId}`;
}

// 查看訊息
function viewMessage(notificationId) {
    if (typeof Utils !== 'undefined' && Utils.showNotification) {
        Utils.showNotification(`訊息 ${notificationId}`, 'info');
    }
}

// 回覆訊息
function replyMessage(notificationId) {
    if (typeof Utils !== 'undefined' && Utils.showNotification) {
        Utils.showNotification(`回覆訊息 ${notificationId}`, 'info');
    }
}

// 重新整理通知
function refreshNotifications() {
    if (typeof Utils !== 'undefined' && Utils.showNotification) {
        Utils.showNotification('正在重新整理...', 'info');
    }
    loadNotifications().then(() => {
        renderNotifications();
        computeAndUpdateStatsFromNotifications();
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('通知已更新', 'success');
        }
    }).catch(() => {
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('通知更新失敗', 'error');
        }
    });
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