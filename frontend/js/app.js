/**
 * Portfolio+ 主要 JavaScript 檔案
 * 包含通用功能和互動效果
 */

// 本地佔位圖片生成器
function createPlaceholderImage(width, height, bgColor, textColor, text) {
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${bgColor}"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="${textColor}" text-anchor="middle" dy=".3em">${text}</text>
        </svg>
    `;
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

// 預設佔位圖片
const PLACEHOLDER_IMAGES = {
    webDesign: createPlaceholderImage(300, 200, '#667eea', '#ffffff', 'Web Design'),
    mobileApp: createPlaceholderImage(300, 200, '#764ba2', '#ffffff', 'Mobile App'),
    dataViz: createPlaceholderImage(300, 200, '#f093fb', '#ffffff', 'Data Viz'),
    uiDesign: createPlaceholderImage(300, 200, '#4facfe', '#ffffff', 'UI Design'),
    portfolio: createPlaceholderImage(300, 200, '#667eea', '#ffffff', 'Portfolio')
};

// 注意：APP_CONFIG 現在在 config.js 中定義
// 如果需要存取配置，請使用 config.js 中的 APP_CONFIG

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
        // 檢查 APP_CONFIG 是否存在，如果不存在則使用預設值
        const apiBaseUrl = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.API_BASE_URL) 
            ? APP_CONFIG.API_BASE_URL 
            : '/api';
        const url = apiBaseUrl + endpoint;
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
        this.loadNavbar(); // 新增：載入導航欄
    },
    
    // 新增：載入導航欄函數
    loadNavbar: function() {
        const navbarPlaceholder = document.getElementById('navbar-placeholder');
        if (!navbarPlaceholder) return;
        
        const role = (localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).role) || null;
        const path = this.getNavbarPath();
        
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                const temp = document.createElement('div');
                temp.innerHTML = html;
                
                let tplId = 'navbar-visitor';
                if (role === 'student') tplId = 'navbar-student';
                else if (role === 'enterprise') tplId = 'navbar-enterprise';
                else if (role === 'admin') tplId = 'navbar-admin';
                
                const tpl = temp.querySelector('#' + tplId);
                if (tpl) {
                    navbarPlaceholder.innerHTML = tpl.innerHTML;
                    // 載入完成後初始化導航功能
                    this.initNavigationAfterLoad();
                } else {
                    console.error('找不到導航欄模板:', tplId);
                    navbarPlaceholder.innerHTML = '<nav class="navbar"><div class="container"><div class="navbar-brand"><a href="../index.html" class="navbar-logo"><i class="fas fa-briefcase"></i><span>Portfolio+</span></a></div></div></nav>';
                }
            })
            .catch(error => {
                console.error('載入導航欄失敗:', error);
                // 顯示錯誤訊息並使用預設導航欄
                navbarPlaceholder.innerHTML = '<nav class="navbar"><div class="container"><div class="navbar-brand"><a href="../index.html" class="navbar-logo"><i class="fas fa-briefcase"></i><span>Portfolio+</span></a></div></div></nav>';
                Utils.showNotification('導航欄載入失敗，請重新整理頁面', 'error');
            });
    },
    
    // 新增：取得導航欄路徑
    getNavbarPath: function() {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/student/') || currentPath.includes('/enterprise/') || currentPath.includes('/admin/')) {
            return '../navbar.html';
        } else {
            return 'navbar.html';
        }
    },
    
    // 新增：導航欄載入完成後的初始化
    initNavigationAfterLoad: function() {
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
        
        // 初始化導航連結
        this.initNavLinks();
    },
    
    // 新增：初始化導航連結
    initNavLinks: function() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // 移除其他連結的活動狀態
                navLinks.forEach(l => l.classList.remove('active'));
                // 添加當前連結的活動狀態
                link.classList.add('active');
            });
        });
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
            // 即時驗證
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
                
                input.addEventListener('input', () => {
                    if (input.classList.contains('error')) {
                        this.validateField(input);
                    }
                });
            });
            
            // 提交驗證
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    Utils.showNotification('請檢查表單中的錯誤', 'error');
                }
            });
        });
    },
    
    // 表單驗證
    validateForm: function(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    },
    
    // 欄位驗證
    validateField: function(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        const minLength = field.getAttribute('minlength');
        const maxLength = field.getAttribute('maxlength');
        const pattern = field.getAttribute('pattern');
        
        // 清除之前的錯誤
        this.clearFieldError(field);
        
        // 必填驗證
        if (required && !value) {
            this.showFieldError(field, '此欄位為必填');
            return false;
        }
        
        // 如果欄位為空且非必填，則跳過其他驗證
        if (!value && !required) {
            return true;
        }
        
        // 長度驗證
        if (minLength && value.length < parseInt(minLength)) {
            this.showFieldError(field, `最少需要 ${minLength} 個字元`);
            return false;
        }
        
        if (maxLength && value.length > parseInt(maxLength)) {
            this.showFieldError(field, `最多只能 ${maxLength} 個字元`);
            return false;
        }
        
        // 類型驗證
        switch (type) {
            case 'email':
                if (!this.isValidEmail(value)) {
                    this.showFieldError(field, '請輸入有效的電子郵件地址');
                    return false;
                }
                break;
            case 'tel':
                if (!this.isValidPhone(value)) {
                    this.showFieldError(field, '請輸入有效的電話號碼');
                    return false;
                }
                break;
            case 'url':
                if (!this.isValidUrl(value)) {
                    this.showFieldError(field, '請輸入有效的網址');
                    return false;
                }
                break;
            case 'password':
                if (!this.isValidPassword(value)) {
                    this.showFieldError(field, '密碼至少需要8個字元，包含大小寫字母和數字');
                    return false;
                }
                break;
        }
        
        // 正則表達式驗證
        if (pattern && !new RegExp(pattern).test(value)) {
            const customMessage = field.getAttribute('data-error-message');
            this.showFieldError(field, customMessage || '格式不正確');
            return false;
        }
        
        // 自定義驗證
        const customValidation = field.getAttribute('data-validation');
        if (customValidation && !this.customValidation(customValidation, value)) {
            const customMessage = field.getAttribute('data-error-message');
            this.showFieldError(field, customMessage || '驗證失敗');
            return false;
        }
        
        return true;
    },
    
    // 電子郵件驗證
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // 電話號碼驗證
    isValidPhone: function(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
    },
    
    // URL驗證
    isValidUrl: function(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    // 密碼驗證
    isValidPassword: function(password) {
        // 至少8個字元，包含大小寫字母和數字
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    },
    
    // 自定義驗證
    customValidation: function(type, value) {
        switch (type) {
            case 'username':
                return /^[a-zA-Z0-9_]{3,20}$/.test(value);
            case 'chinese-name':
                return /^[\u4e00-\u9fa5]{2,10}$/.test(value);
            case 'student-id':
                return /^\d{8,10}$/.test(value);
            default:
                return true;
        }
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
            animation: slideIn 0.3s ease;
        `;
        
        field.parentNode.appendChild(errorDiv);
        field.classList.add('error');
        field.style.borderColor = '#f87171';
    },
    
    // 清除欄位錯誤
    clearFieldError: function(field) {
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        field.classList.remove('error');
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
                    <img src="${portfolio.image || PLACEHOLDER_IMAGES.portfolio}" alt="${portfolio.title}">
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
    try {
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
        
        // 初始化頁面特定功能
        initPageSpecificFeatures();
        
    } catch (error) {
        console.error('頁面初始化錯誤:', error);
        Utils.showNotification('頁面載入失敗，請重新整理', 'error');
    }
    
    // 全域錯誤處理
    window.addEventListener('error', function(e) {
        console.error('全域錯誤:', e.error);
        handleGlobalError(e.error);
    });
    
    // 未處理的 Promise 拒絕
    window.addEventListener('unhandledrejection', function(e) {
        console.error('未處理的 Promise 拒絕:', e.reason);
        handleGlobalError(e.reason);
    });
    
    // 載入頁腳
    loadFooter();
});

// 新增：初始化頁面特定功能
function initPageSpecificFeatures() {
    const currentPage = window.location.pathname;
    
    try {
        // 根據頁面類型初始化特定功能
        if (currentPage.includes('dashboard')) {
            initDashboardFeatures();
        } else if (currentPage.includes('portfolio')) {
            initPortfolioFeatures();
        } else if (currentPage.includes('upload')) {
            initUploadFeatures();
        } else if (currentPage.includes('profile')) {
            initProfileFeatures();
        } else if (currentPage.includes('search')) {
            initSearchFeatures();
        }
    } catch (error) {
        console.error('頁面特定功能初始化失敗:', error);
    }
}

// 新增：儀表板功能初始化
function initDashboardFeatures() {
    // 初始化統計數據
    const statElements = document.querySelectorAll('.stat-item .number');
    statElements.forEach(element => {
        animateNumber(element);
    });
    
    // 初始化圖表（如果有）
    const charts = document.querySelectorAll('canvas');
    charts.forEach(canvas => {
        if (typeof Chart !== 'undefined') {
            initChart(canvas);
        }
    });
}

// 新增：作品集功能初始化
function initPortfolioFeatures() {
    // 初始化作品篩選
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.dataset.filter;
            filterPortfolios(filter);
        });
    });
    
    // 初始化作品排序
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortPortfolios(this.value);
        });
    }
}

// 新增：上傳功能初始化
function initUploadFeatures() {
    // 初始化檔案上傳
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    // 初始化拖拽上傳
    const dropZone = document.querySelector('.drop-zone');
    if (dropZone) {
        initDropZone(dropZone);
    }
}

// 新增：個人資料功能初始化
function initProfileFeatures() {
    // 初始化圖片上傳
    const avatarInput = document.querySelector('.avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarUpload);
    }
    
    // 初始化表單自動儲存
    const form = document.querySelector('form');
    if (form) {
        initAutoSave(form);
    }
}

// 新增：搜尋功能初始化
function initSearchFeatures() {
    // 初始化搜尋建議
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        initSearchSuggestions(searchInput);
    }
    
    // 初始化進階篩選
    const filterForm = document.querySelector('.filter-form');
    if (filterForm) {
        initAdvancedFilters(filterForm);
    }
}

// 新增：全域錯誤處理
function handleGlobalError(error) {
    let errorMessage = '發生未知錯誤';
    
    if (error instanceof TypeError) {
        errorMessage = '資料載入失敗，請檢查網路連線';
    } else if (error instanceof ReferenceError) {
        errorMessage = '頁面功能異常，請重新整理';
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    Utils.showNotification(errorMessage, 'error');
    
    // 記錄錯誤到控制台
    console.error('錯誤詳情:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
    });
}

// 新增：載入頁腳
function loadFooter() {
    const footer = document.getElementById('footer-placeholder');
    if (!footer) return;
    
    try {
        const path = getFooterPath();
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                const temp = document.createElement('div');
                temp.innerHTML = html;
                
                const role = (localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).role) || null;
                let tplId = 'footer-visitor';
                
                if (role === 'student') tplId = 'footer-student';
                else if (role === 'enterprise') tplId = 'footer-enterprise';
                else if (role === 'admin') tplId = 'footer-admin';
                
                const tpl = temp.querySelector('#' + tplId);
                if (tpl) {
                    footer.innerHTML = tpl.innerHTML;
                } else {
                    footer.innerHTML = '<footer class="footer"><div class="container"><p>&copy; 2024 Portfolio+. All rights reserved.</p></div></footer>';
                }
            })
            .catch(error => {
                console.error('載入頁腳失敗:', error);
                footer.innerHTML = '<footer class="footer"><div class="container"><p>&copy; 2024 Portfolio+. All rights reserved.</p></div></footer>';
            });
    } catch (error) {
        console.error('頁腳載入錯誤:', error);
        footer.innerHTML = '<footer class="footer"><div class="container"><p>&copy; 2024 Portfolio+. All rights reserved.</p></div></footer>';
    }
}

// 新增：取得頁腳路徑
function getFooterPath() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/student/') || currentPath.includes('/enterprise/') || currentPath.includes('/admin/')) {
        return '../footer.html';
    } else {
        return 'footer.html';
    }
}

// 新增：數字動畫
function animateNumber(element) {
    const target = parseInt(element.textContent.replace(/,/g, ''));
    const duration = 1000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// 新增：圖表初始化
function initChart(canvas) {
    const ctx = canvas.getContext('2d');
    const chartType = canvas.dataset.chartType || 'line';
    
    // 這裡可以根據需要初始化不同的圖表類型
    console.log('初始化圖表:', chartType);
}

// 新增：作品篩選
function filterPortfolios(filter) {
    const portfolios = document.querySelectorAll('.portfolio-card');
    portfolios.forEach(portfolio => {
        if (filter === 'all' || portfolio.dataset.category === filter) {
            portfolio.style.display = 'block';
        } else {
            portfolio.style.display = 'none';
        }
    });
}

// 新增：作品排序
function sortPortfolios(sortBy) {
    const container = document.querySelector('.portfolios-grid');
    const portfolios = Array.from(container.children);
    
    portfolios.sort((a, b) => {
        const aValue = a.dataset[sortBy] || 0;
        const bValue = b.dataset[sortBy] || 0;
        return bValue - aValue;
    });
    
    portfolios.forEach(portfolio => container.appendChild(portfolio));
}

// 新增：檔案上傳處理
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // 這裡可以添加檔案驗證和上傳邏輯
        console.log('檔案已選擇:', file.name);
    }
}

// 新增：拖拽上傳初始化
function initDropZone(dropZone) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload({ target: { files } });
        }
    });
}

// 新增：頭像上傳處理
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatar = document.querySelector('.avatar-preview');
            if (avatar) {
                avatar.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}

// 新增：自動儲存初始化
function initAutoSave(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    let saveTimeout;
    
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveFormData(form);
            }, 1000);
        });
    });
}

// 新增：儲存表單資料
function saveFormData(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // 儲存到 localStorage
    localStorage.setItem('form_autosave', JSON.stringify(data));
    console.log('表單資料已自動儲存');
}

// 新增：搜尋建議初始化
function initSearchSuggestions(searchInput) {
    let suggestionTimeout;
    
    searchInput.addEventListener('input', () => {
        clearTimeout(suggestionTimeout);
        suggestionTimeout = setTimeout(() => {
            const query = searchInput.value.trim();
            if (query.length > 2) {
                loadSearchSuggestions(query);
            }
        }, 300);
    });
}

// 新增：載入搜尋建議
function loadSearchSuggestions(query) {
    // 這裡可以實作搜尋建議邏輯
    console.log('載入搜尋建議:', query);
}

// 新增：進階篩選初始化
function initAdvancedFilters(filterForm) {
    const filterInputs = filterForm.querySelectorAll('input, select');
    filterInputs.forEach(input => {
        input.addEventListener('change', () => {
            applyFilters(filterForm);
        });
    });
}

// 新增：套用篩選
function applyFilters(filterForm) {
    const formData = new FormData(filterForm);
    const filters = Object.fromEntries(formData);
    
    // 這裡可以實作篩選邏輯
    console.log('套用篩選:', filters);
}

// TODO: 實作全域函數供其他腳本使用
window.PortfolioApp = {
    Utils,
    API,
    Auth,
    UI,
    DataLoader,
    config: (typeof APP_CONFIG !== 'undefined') ? APP_CONFIG : {
        API_BASE_URL: '/api',
        DEBUG_MODE: true,
        VERSION: '2.0.1'
    }
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
    
    .field-error {
        animation: slideIn 0.3s ease;
    }
    
    .error {
        border-color: #f87171 !important;
    }
    
    .dragover {
        border-color: var(--primary-color);
        background-color: rgba(39, 62, 195, 0.1);
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