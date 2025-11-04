/**
 * Portfolio+ 移動端選單控制
 * 統一的漢堡選單功能
 */

(function() {
    'use strict';

    // 等待 DOM 載入完成
    function initMobileMenu() {
        console.log('📱 initMobileMenu 被調用');
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
            console.log('❌ 找不到 .navbar');
            return;
        }

        const container = navbar.querySelector('.container');
        if (!container) {
            console.log('❌ 找不到 .container');
            return;
        }

        // 檢查是否已經有漢堡按鈕
        let menuToggle = navbar.querySelector('.mobile-menu-toggle');
        console.log('漢堡按鈕存在:', !!menuToggle);
        
        if (!menuToggle) {
            // 創建漢堡選單按鈕
            menuToggle = document.createElement('button');
            menuToggle.className = 'mobile-menu-toggle';
            menuToggle.setAttribute('aria-label', '開啟選單');
            menuToggle.innerHTML = `
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            `;

            // 插入到 navbar-brand 之後
            const brand = navbar.querySelector('.navbar-brand');
            if (brand) {
                brand.parentNode.insertBefore(menuToggle, brand.nextSibling);
            }
        }

        const navbarMenu = navbar.querySelector('.navbar-menu');
        const navbarActions = navbar.querySelector('.navbar-actions');

        // 切換選單
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('🖱️ 漢堡選單被點擊');
            const isActive = menuToggle.classList.contains('active');
            console.log('選單當前狀態:', isActive ? '開啟' : '關閉');
            
            if (isActive) {
                console.log('準備關閉選單');
                closeMenu();
            } else {
                console.log('準備開啟選單');
                openMenu();
            }
        });

        function openMenu() {
            console.log('✅ openMenu 執行');
            console.log('navbarMenu 存在:', !!navbarMenu);
            console.log('navbarActions 存在:', !!navbarActions);
            
            menuToggle.classList.add('active');
            menuToggle.setAttribute('aria-label', '關閉選單');
            if (navbarMenu) {
                navbarMenu.classList.add('active');
                console.log('✅ navbarMenu 已添加 active');
            }
            if (navbarActions) {
                navbarActions.classList.add('active');
                console.log('✅ navbarActions 已添加 active');
            }
            document.body.style.overflow = 'hidden'; // 防止背景滾動
            console.log('✅ 選單已開啟');
        }

        function closeMenu() {
            console.log('🔽 closeMenu 執行');
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-label', '開啟選單');
            if (navbarMenu) navbarMenu.classList.remove('active');
            if (navbarActions) navbarActions.classList.remove('active');
            document.body.style.overflow = ''; // 恢復滾動
            console.log('🔽 選單已關閉');
        }

        // 點擊選單項目後關閉選單
        if (navbarMenu) {
            const menuLinks = navbarMenu.querySelectorAll('.nav-link:not(.dropdown-toggle)');
            menuLinks.forEach(link => {
                link.addEventListener('click', closeMenu);
            });
        }

        // 點擊外部關閉選單
        document.addEventListener('click', function(e) {
            if (!navbar.contains(e.target) && menuToggle.classList.contains('active')) {
                closeMenu();
            }
        });

        // 處理下拉選單（行動版）
        const dropdownToggles = navbar.querySelectorAll('.dropdown-toggle');
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                // 在手機版時，阻止預設行為並切換下拉選單
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const dropdown = this.nextElementSibling;
                    const parent = this.closest('.nav-dropdown');
                    
                    if (dropdown && dropdown.classList.contains('dropdown-menu')) {
                        parent.classList.toggle('active');
                    }
                }
            });
        });

        // 視窗大小改變時關閉選單
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth > 768 && menuToggle.classList.contains('active')) {
                    closeMenu();
                }
            }, 250);
        });
    }

    // 當 DOM 載入完成時初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }

    // 如果是通過模板載入導航欄，需要等待模板載入後再初始化
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    const navbar = document.querySelector('.navbar');
                    if (navbar && !navbar.querySelector('.mobile-menu-toggle')) {
                        initMobileMenu();
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
})();

