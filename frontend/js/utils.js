/**
 * Portfolio+ 工具函數庫
 * 包含錯誤處理、通知顯示、數據驗證等通用功能
 */

// 避免重複宣告
if (typeof window.Utils === 'undefined') {
    window.Utils = {
        
        /**
         * 顯示通知訊息
         * @param {string} message - 通知訊息
         * @param {string} type - 通知類型: 'success', 'error', 'warning', 'info'
         * @param {number} duration - 顯示時間（毫秒），0表示不自動關閉
         */
        showNotification(message, type = 'info', duration = 5000) {
            // 移除現有的通知
            this.removeExistingNotifications();
            
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                    <span class="notification-message">${message}</span>
                    <button class="notification-close" onclick="Utils.closeNotification(this)">&times;</button>
                </div>
            `;
            
            // 添加樣式
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                min-width: 300px;
                max-width: 500px;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transform: translateX(100%);
                transition: transform 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            // 根據類型設置顏色
            const colors = {
                success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724', icon: '#28a745' },
                error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', icon: '#dc3545' },
                warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404', icon: '#ffc107' },
                info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', icon: '#17a2b8' }
            };
            
            const color = colors[type] || colors.info;
            notification.style.backgroundColor = color.bg;
            notification.style.border = `1px solid ${color.border}`;
            notification.style.color = color.text;
            
            document.body.appendChild(notification);
            
            // 動畫顯示
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 10);
            
            // 自動關閉
            if (duration > 0) {
                setTimeout(() => {
                    this.closeNotification(notification.querySelector('.notification-close'));
                }, duration);
            }
        },
        
        /**
         * 關閉通知
         */
        closeNotification(closeButton) {
            const notification = closeButton.closest('.notification');
            if (notification) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        },
        
        /**
         * 移除現有通知
         */
        removeExistingNotifications() {
            const existing = document.querySelectorAll('.notification');
            existing.forEach(notification => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        },
        
        /**
         * 取得通知圖標
         */
        getNotificationIcon(type) {
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };
            return icons[type] || icons.info;
        },
        
        /**
         * 處理API錯誤
         * @param {Error} error - 錯誤物件
         * @param {string} context - 錯誤上下文
         * @param {boolean} showNotification - 是否顯示通知
         */
        handleApiError(error, context = '', showNotification = true) {
            console.error(`API錯誤 ${context}:`, error);
            
            let message = '操作失敗，請稍後重試';
            let type = 'error';
            
            if (error.code) {
                switch (error.code) {
                    case 'UNAUTHORIZED':
                        message = '請先登入';
                        type = 'warning';
                        break;
                    case 'FORBIDDEN':
                        message = '權限不足';
                        type = 'warning';
                        break;
                    case 'NOT_FOUND':
                        message = '找不到請求的資源';
                        type = 'warning';
                        break;
                    case 'TIMEOUT':
                        message = '請求逾時，請檢查網路連接';
                        type = 'warning';
                        break;
                    case 'SERVER_ERROR':
                        message = '伺服器錯誤，請稍後重試';
                        type = 'error';
                        break;
                    default:
                        message = error.message || message;
                }
            } else if (error.message) {
                message = error.message;
            }
            
            if (showNotification) {
                this.showNotification(message, type);
            }
            
            return {
                success: false,
                message,
                code: error.code || 'UNKNOWN_ERROR',
                originalError: error
            };
        },
        
        /**
         * 驗證表單數據
         * @param {Object} data - 要驗證的數據
         * @param {Object} rules - 驗證規則
         */
        validateForm(data, rules) {
            const errors = {};
            
            for (const field in rules) {
                const rule = rules[field];
                const value = data[field];
                
                // 必填驗證
                if (rule.required && (!value || value.toString().trim() === '')) {
                    errors[field] = rule.message || `${field} 為必填欄位`;
                    continue;
                }
                
                // 長度驗證
                if (rule.minLength && value && value.length < rule.minLength) {
                    errors[field] = rule.message || `${field} 至少需要 ${rule.minLength} 個字符`;
                    continue;
                }
                
                if (rule.maxLength && value && value.length > rule.maxLength) {
                    errors[field] = rule.message || `${field} 不能超過 ${rule.maxLength} 個字符`;
                    continue;
                }
                
                // 格式驗證
                if (rule.pattern && value && !rule.pattern.test(value)) {
                    errors[field] = rule.message || `${field} 格式不正確`;
                    continue;
                }
                
                // 自定義驗證
                if (rule.validator && typeof rule.validator === 'function') {
                    const customError = rule.validator(value, data);
                    if (customError) {
                        errors[field] = customError;
                    }
                }
            }
            
            return {
                isValid: Object.keys(errors).length === 0,
                errors
            };
        },
        
        /**
         * 格式化日期
         * @param {Date|string} date - 日期
         * @param {string} format - 格式
         */
        formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
            if (!date) return '';
            
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('ss', seconds);
        },
        
        /**
         * 防抖函數
         * @param {Function} func - 要防抖的函數
         * @param {number} wait - 等待時間
         */
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        /**
         * 節流函數
         * @param {Function} func - 要節流的函數
         * @param {number} limit - 限制時間
         */
        throttle(func, limit) {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        /**
         * 深拷貝物件
         * @param {*} obj - 要拷貝的物件
         */
        deepClone(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
            if (typeof obj === 'object') {
                const clonedObj = {};
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        clonedObj[key] = this.deepClone(obj[key]);
                    }
                }
                return clonedObj;
            }
        },
        
        /**
         * 檢查是否為空值
         * @param {*} value - 要檢查的值
         */
        isEmpty(value) {
            if (value === null || value === undefined) return true;
            if (typeof value === 'string') return value.trim() === '';
            if (Array.isArray(value)) return value.length === 0;
            if (typeof value === 'object') return Object.keys(value).length === 0;
            return false;
        },
        
        /**
         * 生成唯一ID
         */
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },
        
        /**
         * 安全的JSON解析
         * @param {string} jsonString - JSON字符串
         * @param {*} defaultValue - 預設值
         */
        safeJsonParse(jsonString, defaultValue = null) {
            try {
                return JSON.parse(jsonString);
            } catch (error) {
                console.warn('JSON解析失敗:', error);
                return defaultValue;
            }
        }
    };
}

// 匯出工具函數 (用於模組化)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
