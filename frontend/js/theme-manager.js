/**
 * Portfolio+ 主題管理器
 * 自動根據頁面路徑設定對應的主題
 */

class ThemeManager {
    constructor() {
        this.themes = {
            'main': 'main-theme',      // 主色調
            'student': 'student-theme', // 學生端
            'enterprise': 'enterprise-theme', // 企業端
            'admin': 'admin-theme'     // 管理員端
        };
        
        this.init();
    }
    
    init() {
        // 根據當前頁面路徑自動設定主題
        this.setThemeByPath();
        
        // 監聽頁面變化（用於 SPA 應用）
        this.observePageChanges();
    }
    
    setThemeByPath() {
        const path = window.location.pathname;
        let theme = 'main'; // 預設主色調
        
        // 根據路徑判斷主題
        if (path.includes('/student/')) {
            theme = 'student';
        } else if (path.includes('/enterprise/')) {
            theme = 'enterprise';
        } else if (path.includes('/admin/')) {
            theme = 'admin';
        } else if (path.includes('login.html') || path.includes('index.html')) {
            theme = 'main';
        }
        
        this.applyTheme(theme);
    }
    
    applyTheme(themeName) {
        // 移除所有主題類別
        document.body.classList.remove(...Object.values(this.themes));
        
        // 添加選定的主題類別
        if (this.themes[themeName]) {
            document.body.classList.add(this.themes[themeName]);
            console.log(`已套用主題: ${themeName}`);
        }
    }
    
    observePageChanges() {
        // 監聽 URL 變化
        let currentPath = window.location.pathname;
        
        setInterval(() => {
            if (window.location.pathname !== currentPath) {
                currentPath = window.location.pathname;
                this.setThemeByPath();
            }
        }, 1000);
    }
    
    // 手動切換主題
    switchTheme(themeName) {
        this.applyTheme(themeName);
        
        // 儲存主題偏好到 localStorage
        localStorage.setItem('preferred-theme', themeName);
    }
    
    // 從 localStorage 恢復主題偏好
    restoreTheme() {
        const savedTheme = localStorage.getItem('preferred-theme');
        if (savedTheme && this.themes[savedTheme]) {
            this.applyTheme(savedTheme);
        }
    }
    
    // 獲取當前主題
    getCurrentTheme() {
        for (const [name, className] of Object.entries(this.themes)) {
            if (document.body.classList.contains(className)) {
                return name;
            }
        }
        return 'main';
    }
    
    // 主題切換動畫
    animateThemeTransition() {
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }
}

// 全域主題管理器實例
window.themeManager = new ThemeManager();

// 提供全域函數供 HTML 使用
window.setTheme = function(themeName) {
    window.themeManager.switchTheme(themeName);
    window.themeManager.animateThemeTransition();
};

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    // 如果頁面已經有主題設定，則不覆蓋
    const hasTheme = document.body.classList.contains('main-theme') ||
                    document.body.classList.contains('student-theme') ||
                    document.body.classList.contains('enterprise-theme') ||
                    document.body.classList.contains('admin-theme');
    
    if (!hasTheme) {
        window.themeManager.setThemeByPath();
    }
    
    // 恢復使用者偏好主題
    window.themeManager.restoreTheme();
});

// 導出供模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
