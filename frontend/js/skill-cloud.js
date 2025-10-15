/**
 * 技能標籤雲視覺化系統
 * 動態展示技能標籤，支援篩選和互動
 */

class SkillCloudSystem {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            interactive: true,
            showStats: true,
            showFilter: false,
            mode3d: false,
            darkTheme: false,
            onClick: null,
            maxSkills: 50,
            ...options
        };
        
        this.skills = [];
        this.selectedSkills = [];
        this.currentFilter = 'all';
        
        this.themes = ['blue', 'pink', 'cyan', 'green', 'orange', 'purple'];
        
        if (this.container) {
            this.init();
        }
    }

    /**
     * 初始化技能雲
     */
    init() {
        this.container.className = 'skill-cloud-container';
        if (this.options.mode3d) {
            this.container.classList.add('mode-3d');
        }
        if (this.options.darkTheme) {
            this.container.classList.add('dark-theme');
        }
    }

    /**
     * 設定技能數據
     * @param {Array} skills - 技能陣列，每個技能包含 { name, level, category, count }
     */
    setSkills(skills) {
        this.skills = skills.slice(0, this.options.maxSkills);
        this.render();
    }

    /**
     * 渲染技能雲
     */
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        // 添加標題
        const title = document.createElement('h2');
        title.className = 'skill-cloud-title';
        title.textContent = '技能分布';
        this.container.appendChild(title);
        
        // 添加篩選器（如果啟用）
        if (this.options.showFilter && this.hasCategories()) {
            this.renderFilter();
        }
        
        // 添加技能雲
        const cloud = document.createElement('div');
        cloud.className = 'skill-cloud';
        if (this.options.interactive) {
            cloud.classList.add('interactive');
        }
        
        const filteredSkills = this.getFilteredSkills();
        
        if (filteredSkills.length === 0) {
            this.renderEmpty(cloud);
        } else {
            filteredSkills.forEach(skill => {
                const tag = this.createSkillTag(skill);
                cloud.appendChild(tag);
            });
        }
        
        this.container.appendChild(cloud);
        
        // 添加統計信息（如果啟用）
        if (this.options.showStats) {
            this.renderStats();
        }
    }

    /**
     * 創建技能標籤
     */
    createSkillTag(skill) {
        const tag = document.createElement('div');
        const level = skill.level || this.calculateLevel(skill.count);
        const theme = this.themes[Math.floor(Math.random() * this.themes.length)];
        
        tag.className = `skill-tag level-${level} theme-${theme}`;
        tag.setAttribute('data-skill', skill.name);
        tag.setAttribute('data-category', skill.category || 'general');
        
        // 添加圖標（如果有）
        const icon = skill.icon || this.getIconForSkill(skill.name);
        tag.innerHTML = `
            ${icon ? `<span class="skill-tag-icon">${icon}</span>` : ''}
            <span class="skill-tag-name">${skill.name}</span>
            ${skill.showLevel ? `<span class="skill-level-indicator">${level}</span>` : ''}
        `;
        
        // 添加點擊事件
        if (this.options.interactive) {
            tag.addEventListener('click', () => this.handleSkillClick(skill, tag));
        }
        
        // 添加提示信息
        if (skill.count !== undefined) {
            tag.setAttribute('title', `使用次數: ${skill.count}`);
        }
        
        return tag;
    }

    /**
     * 處理技能點擊
     */
    handleSkillClick(skill, tag) {
        // 切換選中狀態
        tag.classList.toggle('selected');
        
        const index = this.selectedSkills.indexOf(skill.name);
        if (index > -1) {
            this.selectedSkills.splice(index, 1);
        } else {
            this.selectedSkills.push(skill.name);
        }
        
        // 調用回調函數
        if (this.options.onClick) {
            this.options.onClick(skill, this.selectedSkills);
        }
        
        // 觸發自定義事件
        const event = new CustomEvent('skillclick', {
            detail: { skill, selectedSkills: this.selectedSkills }
        });
        this.container.dispatchEvent(event);
    }

    /**
     * 渲染篩選器
     */
    renderFilter() {
        const categories = this.getCategories();
        const filterContainer = document.createElement('div');
        filterContainer.className = 'skill-cloud-filter';
        
        // 全部按鈕
        const allBtn = document.createElement('button');
        allBtn.className = 'skill-filter-btn active';
        allBtn.textContent = '全部';
        allBtn.addEventListener('click', () => this.setFilter('all'));
        filterContainer.appendChild(allBtn);
        
        // 分類按鈕
        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'skill-filter-btn';
            btn.textContent = category;
            btn.addEventListener('click', () => this.setFilter(category));
            filterContainer.appendChild(btn);
        });
        
        this.container.appendChild(filterContainer);
    }

    /**
     * 設定篩選器
     */
    setFilter(filter) {
        this.currentFilter = filter;
        
        // 更新按鈕狀態
        const buttons = this.container.querySelectorAll('.skill-filter-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if ((filter === 'all' && btn.textContent === '全部') ||
                btn.textContent === filter) {
                btn.classList.add('active');
            }
        });
        
        // 重新渲染
        this.render();
    }

    /**
     * 渲染統計信息
     */
    renderStats() {
        const stats = document.createElement('div');
        stats.className = 'skill-cloud-stats';
        
        const totalSkills = this.skills.length;
        const avgLevel = this.calculateAverageLevel();
        const topSkills = this.getTopSkills(3);
        
        stats.innerHTML = `
            <div class="skill-stat">
                <div class="skill-stat-value">${totalSkills}</div>
                <div class="skill-stat-label">總技能數</div>
            </div>
            <div class="skill-stat">
                <div class="skill-stat-value">${avgLevel.toFixed(1)}</div>
                <div class="skill-stat-label">平均等級</div>
            </div>
            <div class="skill-stat">
                <div class="skill-stat-value">${topSkills.length}</div>
                <div class="skill-stat-label">精通技能</div>
            </div>
        `;
        
        this.container.appendChild(stats);
    }

    /**
     * 渲染空狀態
     */
    renderEmpty(cloud) {
        cloud.innerHTML = `
            <div class="skill-cloud-empty">
                <div class="skill-cloud-empty-icon">🔍</div>
                <div class="skill-cloud-empty-text">尚無技能數據</div>
            </div>
        `;
    }

    /**
     * 顯示載入狀態
     */
    showLoading() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="skill-cloud-loading">
                <div class="skill-cloud-loading-spinner"></div>
            </div>
        `;
    }

    /**
     * 獲取篩選後的技能
     */
    getFilteredSkills() {
        if (this.currentFilter === 'all') {
            return this.skills;
        }
        return this.skills.filter(skill => skill.category === this.currentFilter);
    }

    /**
     * 根據使用次數計算等級 (1-5)
     */
    calculateLevel(count) {
        if (!count) return 1;
        if (count >= 50) return 5;
        if (count >= 30) return 4;
        if (count >= 15) return 3;
        if (count >= 5) return 2;
        return 1;
    }

    /**
     * 計算平均等級
     */
    calculateAverageLevel() {
        if (this.skills.length === 0) return 0;
        const total = this.skills.reduce((sum, skill) => {
            const level = skill.level || this.calculateLevel(skill.count);
            return sum + level;
        }, 0);
        return total / this.skills.length;
    }

    /**
     * 獲取頂級技能
     */
    getTopSkills(limit = 5) {
        return this.skills
            .filter(skill => (skill.level || this.calculateLevel(skill.count)) >= 4)
            .slice(0, limit);
    }

    /**
     * 獲取所有分類
     */
    getCategories() {
        const categories = new Set();
        this.skills.forEach(skill => {
            if (skill.category) {
                categories.add(skill.category);
            }
        });
        return Array.from(categories);
    }

    /**
     * 檢查是否有分類
     */
    hasCategories() {
        return this.skills.some(skill => skill.category);
    }

    /**
     * 根據技能名稱獲取圖標
     */
    getIconForSkill(skillName) {
        const iconMap = {
            'JavaScript': '💛',
            'Python': '🐍',
            'React': '⚛️',
            'Vue': '💚',
            'Node.js': '💚',
            'HTML': '🌐',
            'CSS': '🎨',
            'Java': '☕',
            'C++': '⚙️',
            'PHP': '🐘',
            'SQL': '🗄️',
            'MongoDB': '🍃',
            'Git': '📦',
            'Docker': '🐳',
            'AWS': '☁️',
            'UI/UX': '🎨',
            'Figma': '🎨',
            'Photoshop': '🖼️',
            'Design': '✨'
        };
        
        return iconMap[skillName] || '';
    }

    /**
     * 獲取選中的技能
     */
    getSelectedSkills() {
        return this.selectedSkills;
    }

    /**
     * 清除選擇
     */
    clearSelection() {
        this.selectedSkills = [];
        const tags = this.container.querySelectorAll('.skill-tag.selected');
        tags.forEach(tag => tag.classList.remove('selected'));
    }

    /**
     * 更新技能數據
     */
    updateSkill(skillName, updates) {
        const skill = this.skills.find(s => s.name === skillName);
        if (skill) {
            Object.assign(skill, updates);
            this.render();
        }
    }

    /**
     * 銷毀實例
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// 全局快捷方法
window.createSkillCloud = function(containerId, skills, options = {}) {
    const cloud = new SkillCloudSystem(containerId, options);
    cloud.setSkills(skills);
    return cloud;
};

// 匯出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillCloudSystem;
}

