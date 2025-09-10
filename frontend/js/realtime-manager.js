/**
 * Portfolio+ 實時通信管理器
 * 提供WebSocket連接、實時數據更新和事件處理
 */

// 避免重複宣告
if (typeof window.RealtimeManager === 'undefined') {
    window.RealtimeManager = {
        
        // WebSocket連接
        socket: null,
        
        // 連接狀態
        isConnected: false,
        
        // 重連配置
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        reconnectInterval: 3000,
        
        // 事件監聽器
        eventListeners: new Map(),
        
        // 心跳配置
        heartbeatInterval: 30000, // 30秒
        heartbeatTimer: null,
        
        /**
         * 初始化實時連接
         */
        init() {
            if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ENABLE_WEBSOCKET) {
                this.connect();
            } else {
                console.log('WebSocket功能已停用');
            }
        },
        
        /**
         * 建立WebSocket連接
         */
        connect() {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const host = window.location.host;
                const wsUrl = `${protocol}//${host}/portfolio/ws`;
                
                this.socket = new WebSocket(wsUrl);
                
                this.socket.onopen = (event) => {
                    console.log('WebSocket連接已建立');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.emit('connected', event);
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(event);
                };
                
                this.socket.onclose = (event) => {
                    console.log('WebSocket連接已關閉', event);
                    this.isConnected = false;
                    this.stopHeartbeat();
                    this.emit('disconnected', event);
                    
                    // 自動重連
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                };
                
                this.socket.onerror = (event) => {
                    console.error('WebSocket錯誤:', event);
                    this.emit('error', event);
                };
                
            } catch (error) {
                console.error('WebSocket連接失敗:', error);
                this.scheduleReconnect();
            }
        },
        
        /**
         * 處理接收到的訊息
         */
        handleMessage(event) {
            try {
                const data = JSON.parse(event.data);
                
                // 處理不同類型的訊息
                switch (data.type) {
                    case 'notification':
                        this.handleNotification(data.payload);
                        break;
                    case 'portfolio_update':
                        this.handlePortfolioUpdate(data.payload);
                        break;
                    case 'user_activity':
                        this.handleUserActivity(data.payload);
                        break;
                    case 'system_message':
                        this.handleSystemMessage(data.payload);
                        break;
                    case 'pong':
                        // 心跳回應
                        break;
                    default:
                        console.log('未知訊息類型:', data.type);
                }
                
                // 觸發通用訊息事件
                this.emit('message', data);
                
            } catch (error) {
                console.error('處理WebSocket訊息失敗:', error);
            }
        },
        
        /**
         * 處理通知
         */
        handleNotification(payload) {
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification(payload.message, payload.level || 'info');
            }
            
            // 觸發通知事件
            this.emit('notification', payload);
            
            // 如果當前頁面是通知頁面，刷新通知列表
            if (window.location.pathname.includes('notifications')) {
                this.refreshNotifications();
            }
        },
        
        /**
         * 處理作品更新
         */
        handlePortfolioUpdate(payload) {
            console.log('作品更新:', payload);
            
            // 觸發作品更新事件
            this.emit('portfolio_update', payload);
            
            // 如果當前頁面是作品頁面，刷新作品列表
            if (window.location.pathname.includes('portfolio')) {
                this.refreshPortfolios();
            }
        },
        
        /**
         * 處理用戶活動
         */
        handleUserActivity(payload) {
            console.log('用戶活動:', payload);
            
            // 觸發用戶活動事件
            this.emit('user_activity', payload);
            
            // 如果當前頁面是儀表板，刷新活動列表
            if (window.location.pathname.includes('dashboard')) {
                this.refreshActivities();
            }
        },
        
        /**
         * 處理系統訊息
         */
        handleSystemMessage(payload) {
            console.log('系統訊息:', payload);
            
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification(payload.message, 'info');
            }
            
            // 觸發系統訊息事件
            this.emit('system_message', payload);
        },
        
        /**
         * 發送訊息
         */
        send(type, payload) {
            if (!this.isConnected || !this.socket) {
                console.warn('WebSocket未連接，無法發送訊息');
                return false;
            }
            
            try {
                const message = {
                    type: type,
                    payload: payload,
                    timestamp: new Date().toISOString()
                };
                
                this.socket.send(JSON.stringify(message));
                return true;
            } catch (error) {
                console.error('發送WebSocket訊息失敗:', error);
                return false;
            }
        },
        
        /**
         * 訂閱事件
         */
        on(event, callback) {
            if (!this.eventListeners.has(event)) {
                this.eventListeners.set(event, []);
            }
            this.eventListeners.get(event).push(callback);
        },
        
        /**
         * 取消訂閱事件
         */
        off(event, callback) {
            if (this.eventListeners.has(event)) {
                const listeners = this.eventListeners.get(event);
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        },
        
        /**
         * 觸發事件
         */
        emit(event, data) {
            if (this.eventListeners.has(event)) {
                this.eventListeners.get(event).forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`事件處理器錯誤 (${event}):`, error);
                    }
                });
            }
        },
        
        /**
         * 開始心跳
         */
        startHeartbeat() {
            this.stopHeartbeat();
            this.heartbeatTimer = setInterval(() => {
                if (this.isConnected) {
                    this.send('ping', {});
                }
            }, this.heartbeatInterval);
        },
        
        /**
         * 停止心跳
         */
        stopHeartbeat() {
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
        },
        
        /**
         * 安排重連
         */
        scheduleReconnect() {
            this.reconnectAttempts++;
            const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`將在 ${delay}ms 後嘗試重連 (第 ${this.reconnectAttempts} 次)`);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        },
        
        /**
         * 斷開連接
         */
        disconnect() {
            this.stopHeartbeat();
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }
            this.isConnected = false;
        },
        
        /**
         * 刷新通知
         */
        refreshNotifications() {
            if (typeof window.loadNotifications === 'function') {
                window.loadNotifications();
            }
        },
        
        /**
         * 刷新作品
         */
        refreshPortfolios() {
            if (typeof window.loadPortfolios === 'function') {
                window.loadPortfolios();
            }
        },
        
        /**
         * 刷新活動
         */
        refreshActivities() {
            if (typeof window.loadActivities === 'function') {
                window.loadActivities();
            }
        },
        
        /**
         * 加入房間（用於特定功能）
         */
        joinRoom(roomId) {
            this.send('join_room', { room_id: roomId });
        },
        
        /**
         * 離開房間
         */
        leaveRoom(roomId) {
            this.send('leave_room', { room_id: roomId });
        },
        
        /**
         * 獲取連接狀態
         */
        getStatus() {
            return {
                connected: this.isConnected,
                reconnectAttempts: this.reconnectAttempts,
                socketReadyState: this.socket ? this.socket.readyState : null
            };
        }
    };
}

// 自動初始化實時管理器
document.addEventListener('DOMContentLoaded', function() {
    if (typeof RealtimeManager !== 'undefined') {
        RealtimeManager.init();
    }
});

// 頁面卸載時斷開連接
window.addEventListener('beforeunload', function() {
    if (typeof RealtimeManager !== 'undefined') {
        RealtimeManager.disconnect();
    }
});

// 匯出實時管理器 (用於模組化)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeManager;
}
