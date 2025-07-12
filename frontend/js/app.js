/**
 * Portfolio+ 主要 JavaScript 檔案
 * 包含通用功能和互動效果
 */

// TODO: 實作全域變數和設定
const APP_CONFIG = {
    API_BASE_URL: '/api', // TODO: 設定實際的 API 端點
    DEBUG_MODE: true,
    VERSION: '2.0.1'
};

// TODO: 實作工具函數
const Utils = {
    // 顯示通知訊息
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // 添加樣式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 自動移除
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // 手動關閉
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    },
    
    getNotificationIcon: function(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },
    
    getNotificationColor: function(type) {
        const colors = {
            success: '#4ade80',
            error: '#f87171',
            warning: '#fbbf24',
            info: '#667eea'
        };
        return colors[type] || '#667eea';
    },
    
    // 格式化日期
    formatDate: function(date) {
        return new Intl.DateTimeFormat('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },
    
    // 格式化數字
    formatNumber: function(num) {
        return new Intl.NumberFormat('zh-TW').format(num);
    },
    
    // 防抖函數
    debounce: function(func, wait) {
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
    
    // 節流函數
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// TODO: 實作 API 服務
const API = {
    // 基礎請求函數
    request: async function(endpoint, options = {}) {
        const url = APP_CONFIG.API_BASE_URL + endpoint;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        };
        
        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API 請求錯誤:', error);
            Utils.showNotification('網路連線錯誤，請稍後再試', 'error');
            throw error;
        }
    },
    
    // GET 請求
    get: function(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    // POST 請求
    post: function(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    // PUT 請求
    put: function(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    // DELETE 請求
    delete: function(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

// TODO: 實作認證服務
const Auth = {
    // 檢查是否已登入
    isLoggedIn: function() {
        return localStorage.getItem('auth_token') !== null;
    },
    
    // 取得使用者資訊
    getUser: function() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // 取得使用者角色
    getUserRole: function() {
        const user = this.getUser();
        return user ? user.role : null;
    },
    
    // 登入
    login: async function(credentials) {
        try {
            const response = await API.post('/auth/login', credentials);
            
            if (response.success) {
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                Utils.showNotification('登入成功！', 'success');
                return response;
            } else {
                Utils.showNotification(response.message || '登入失敗', 'error');
                throw new Error(response.message);
            }
        } catch (error) {
            Utils.showNotification('登入失敗，請檢查您的帳號密碼', 'error');
            throw error;
        }
    },
    
    // 登出
    logout: function() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        Utils.showNotification('已登出', 'info');
        window.location.href = '/index.html';
    },
    
    // 註冊
    register: async function(userData) {
        try {
            const response = await API.post('/auth/register', userData);
            
            if (response.success) {
                Utils.showNotification('註冊成功！', 'success');
                return response;
            } else {
                Utils.showNotification(response.message || '註冊失敗', 'error');
                throw new Error(response.message);
            }
        } catch (error) {
            Utils.showNotification('註冊失敗，請稍後再試', 'error');
            throw error;
        }
    }
};

// TODO: 實作 UI 互動功能
const UI = {
    // 初始化頁面
    init: function() {
        this.initNavigation();
        this.initScrollEffects();
        this.initFormValidation();
        this.initTooltips();
        this.initModals();
    },
    
    // 初始化導航功能
    initNavigation: function() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        // 滾動時改變導航欄樣式
        window.addEventListener('scroll', Utils.throttle(() => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, 100));
        
        // 行動裝置選單切換
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navbarMenu = document.querySelector('.navbar-menu');
        
        if (mobileMenuToggle && navbarMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                navbarMenu.classList.toggle('active');
            });
        }
    },
    
    // 初始化滾動效果
    initScrollEffects: function() {
        // 滾動動畫
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // 觀察所有需要動畫的元素
        document.querySelectorAll('.feature-card, .role-card, .portfolio-card, .stat-item').forEach(el => {
            observer.observe(el);
        });
    },
    
    // 初始化表單驗證
    initFormValidation: function() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });
    },
    
    // 表單驗證
    validateForm: function(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.showFieldError(input, '此欄位為必填');
                isValid = false;
            } else {
                this.clearFieldError(input);
            }
        });
        
        return isValid;
    },
    
    // 顯示欄位錯誤
    showFieldError: function(field, message) {
        this.clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #f87171;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        `;
        
        field.parentNode.appendChild(errorDiv);
        field.style.borderColor = '#f87171';
    },
    
    // 清除欄位錯誤
    clearFieldError: function(field) {
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        field.style.borderColor = '';
    },
    
    // 初始化工具提示
    initTooltips: function() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = e.target.dataset.tooltip;
                tooltip.style.cssText = `
                    position: absolute;
                    background: #1f2937;
                    color: white;
                    padding: 0.5rem;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                    z-index: 1000;
                    pointer-events: none;
                `;
                
                document.body.appendChild(tooltip);
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
            });
            
            element.addEventListener('mouseleave', () => {
                const tooltip = document.querySelector('.tooltip');
                if (tooltip) {
                    tooltip.remove();
                }
            });
        });
    },
    
    // 初始化模態框
    initModals: function() {
        const modalTriggers = document.querySelectorAll('[data-modal]');
        
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = trigger.dataset.modal;
                this.openModal(modalId);
            });
        });
        
        // 關閉模態框
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
                this.closeModal();
            }
        });
    },
    
    // 開啟模態框
    openModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    },
    
    // 關閉模態框
    closeModal: function() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
    }
};

// TODO: 實作資料載入功能
const DataLoader = {
    // 載入假資料
    loadMockData: function(type) {
        const mockData = {
            portfolios: [
                {
                    id: 1,
                    title: '響應式網站設計',
                    description: '使用 HTML5、CSS3 和 JavaScript 製作的現代化響應式網站',
                    author: '張小明',
                    views: 156,
                    likes: 23,
                    comments: 8,
                    tags: ['HTML5', 'CSS3', 'JavaScript'],
                    status: 'published',
                    created_at: '2024-01-15'
                },
                {
                    id: 2,
                    title: '行動應用程式',
                    description: '使用 React Native 開發的跨平台行動應用程式',
                    author: '李小華',
                    views: 203,
                    likes: 45,
                    comments: 12,
                    tags: ['React Native', 'JavaScript', 'Firebase'],
                    status: 'published',
                    created_at: '2024-01-14'
                }
            ],
            users: [
                {
                    id: 1,
                    name: '張小明',
                    role: 'student',
                    department: '資訊管理學系',
                    grade: '大學三年級',
                    avatar: '張'
                },
                {
                    id: 2,
                    name: '李小華',
                    role: 'student',
                    department: '資訊管理學系',
                    grade: '大學四年級',
                    avatar: '李'
                }
            ],
            enterprises: [
                {
                    id: 1,
                    name: '科技公司 A',
                    industry: '科技業',
                    size: '51-200人',
                    description: '專注於軟體開發的科技公司'
                },
                {
                    id: 2,
                    name: '設計工作室 B',
                    industry: '服務業',
                    size: '11-50人',
                    description: '專業的 UI/UX 設計工作室'
                }
            ]
        };
        
        return mockData[type] || [];
    },
    
    // 渲染作品列表
    renderPortfolios: function(container, portfolios) {
        if (!container) return;
        
        container.innerHTML = portfolios.map(portfolio => `
            <div class="portfolio-card">
                <div class="portfolio-image">
                    <img src="https://via.placeholder.com/300x200/667eea/ffffff?text=${encodeURIComponent(portfolio.title)}" alt="${portfolio.title}">
                </div>
                <div class="portfolio-content">
                    <h3>${portfolio.title}</h3>
                    <p>${portfolio.description}</p>
                    <div class="portfolio-tags">
                        ${portfolio.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="portfolio-stats">
                        <span><i class="fas fa-eye"></i> ${portfolio.views}</span>
                        <span><i class="fas fa-heart"></i> ${portfolio.likes}</span>
                        <span><i class="fas fa-comment"></i> ${portfolio.comments}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    // 渲染使用者列表
    renderUsers: function(container, users) {
        if (!container) return;
        
        container.innerHTML = users.map(user => `
            <div class="user-card">
                <div class="user-avatar">${user.avatar}</div>
                <div class="user-info">
                    <h3>${user.name}</h3>
                    <p>${user.department} • ${user.grade}</p>
                </div>
            </div>
        `).join('');
    }
};

// TODO: 實作事件監聽器
document.addEventListener('DOMContentLoaded', function() {
    // 初始化 UI
    UI.init();
    
    // 載入假資料（如果頁面需要）
    const portfolioContainer = document.querySelector('.portfolios-grid');
    if (portfolioContainer) {
        const portfolios = DataLoader.loadMockData('portfolios');
        DataLoader.renderPortfolios(portfolioContainer, portfolios);
    }
    
    // 檢查登入狀態
    if (Auth.isLoggedIn()) {
        console.log('使用者已登入:', Auth.getUser());
    } else {
        console.log('使用者未登入');
    }
    
    // 全域錯誤處理
    window.addEventListener('error', function(e) {
        console.error('全域錯誤:', e.error);
        Utils.showNotification('發生錯誤，請重新整理頁面', 'error');
    });
    
    // 未處理的 Promise 拒絕
    window.addEventListener('unhandledrejection', function(e) {
        console.error('未處理的 Promise 拒絕:', e.reason);
        Utils.showNotification('網路連線錯誤', 'error');
    });
});

// TODO: 實作全域函數供其他腳本使用
window.PortfolioApp = {
    Utils,
    API,
    Auth,
    UI,
    DataLoader,
    config: APP_CONFIG
};

// 添加全域樣式
const globalStyles = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes animateIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-in {
        animation: animateIn 0.6s ease forwards;
    }
    
    .navbar.scrolled {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
    }
    
    @media (max-width: 768px) {
        .navbar-menu {
            display: none;
        }
        
        .navbar-menu.active {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 1rem;
        }
    }
`;

// 注入全域樣式
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet); 