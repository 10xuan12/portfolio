/**
 * 即時成就通知動畫系統
 * 支援徽章獲得、里程碑達成、等級提升等通知
 */

class AchievementNotificationSystem {
    constructor() {
        this.container = null;
        this.queue = [];
        this.isShowing = false;
        this.init();
    }

    // 初始化系統
    init() {
        // 創建通知容器
        this.container = document.createElement('div');
        this.container.className = 'achievement-notification-container';
        document.body.appendChild(this.container);
    }

    // 顯示成就通知
    show(options) {
        const {
            type = 'badge', // badge, milestone, level-up, trending
            title = '成就解鎖！',
            subtitle = '恭喜你',
            description = '你獲得了新成就',
            icon = '🏆',
            reward = null,
            duration = 5000,
            sound = true,
            confetti = false
        } = options;

        // 創建通知元素
        const notification = this.createNotification({
            type,
            title,
            subtitle,
            description,
            icon,
            reward,
            duration
        });

        // 添加到容器
        this.container.appendChild(notification);

        // 播放音效
        if (sound) {
            this.playSound(type);
        }

        // 顯示紙屑效果
        if (confetti) {
            this.showConfetti();
        }

        // 觸發顯示動畫
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 自動隱藏
        setTimeout(() => {
            this.hide(notification);
        }, duration);

        return notification;
    }

    // 創建通知元素
    createNotification(data) {
        const notification = document.createElement('div');
        notification.className = `achievement-notification ${data.type}`;
        
        notification.innerHTML = `
            <div class="achievement-stars">✨</div>
            <button class="achievement-close" onclick="this.parentElement.remove()">✕</button>
            <div class="achievement-notification-header">
                <div class="achievement-icon">${data.icon}</div>
                <div>
                    <p class="achievement-subtitle">${data.subtitle}</p>
                    <h3 class="achievement-title">${data.title}</h3>
                </div>
            </div>
            <div class="achievement-notification-body">
                <p class="achievement-description">${data.description}</p>
                ${data.reward ? `<span class="achievement-reward">🎁 ${data.reward}</span>` : ''}
            </div>
            <div class="achievement-progress"></div>
        `;

        // 點擊關閉
        notification.addEventListener('click', (e) => {
            if (!e.target.classList.contains('achievement-close')) {
                this.hide(notification);
            }
        });

        return notification;
    }

    // 隱藏通知
    hide(notification) {
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        setTimeout(() => {
            notification.remove();
        }, 500);
    }

    // 播放音效
    playSound(type) {
        try {
            const audio = new Audio();
            // 不同類型使用不同音效
            const soundMap = {
                'badge': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCl+zPDahzwKE1yy6OSXTAwNTKXh77ZpHwU7k9n0zHouBSJ0xO/glEIKD1ms5+mnVRIJP5nZ88p5LQUndsTv3Y0+ChFYrOPnmk4LDEqh4O64bCAFO5Ha9c17LwYgccLu4JFDC' // 簡化的音效
            };
            
            // 使用 Web Audio API 生成簡單音效
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = type === 'badge' ? 800 : 600;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('音效播放失敗（瀏覽器可能不支援）');
        }
    }

    // 顯示紙屑效果
    showConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);

        const colors = ['#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confettiContainer.appendChild(confetti);
        }

        // 3秒後移除紙屑容器
        setTimeout(() => {
            confettiContainer.remove();
        }, 6000);
    }

    // 快捷方法：顯示徽章獲得通知
    showBadgeUnlocked(badgeName, description) {
        return this.show({
            type: 'badge',
            title: badgeName,
            subtitle: '🎖️ 徽章解鎖',
            description: description,
            icon: '🏆',
            reward: '+50 經驗值',
            confetti: true
        });
    }

    // 快捷方法：顯示里程碑達成通知
    showMilestone(milestone, count) {
        return this.show({
            type: 'milestone',
            title: milestone,
            subtitle: '🎯 里程碑達成',
            description: `恭喜！你已經達成 ${count} 的成就`,
            icon: '🎯',
            reward: '+100 經驗值',
            confetti: true
        });
    }

    // 快捷方法：顯示等級提升通知
    showLevelUp(level) {
        return this.show({
            type: 'level-up',
            title: `等級 ${level}`,
            subtitle: '⬆️ 等級提升',
            description: '你的技能得到了提升！',
            icon: '⭐',
            reward: `解鎖新功能`,
            confetti: true
        });
    }

    // 快捷方法：顯示作品熱門通知
    showTrending(portfolioName, views) {
        return this.show({
            type: 'trending',
            title: '作品熱門！',
            subtitle: '🔥 正在流行',
            description: `你的作品「${portfolioName}」已獲得 ${views} 次瀏覽`,
            icon: '🔥',
            duration: 6000
        });
    }

    // 快捷方法：顯示自定義成就
    showCustom(title, description, icon = '✨') {
        return this.show({
            type: 'badge',
            title: title,
            subtitle: '成就解鎖',
            description: description,
            icon: icon
        });
    }
}

// 創建全局實例
window.achievementSystem = new AchievementNotificationSystem();

// 便捷的全局方法
window.showAchievement = (options) => window.achievementSystem.show(options);
window.showBadgeUnlocked = (name, desc) => window.achievementSystem.showBadgeUnlocked(name, desc);
window.showMilestone = (milestone, count) => window.achievementSystem.showMilestone(milestone, count);
window.showLevelUp = (level) => window.achievementSystem.showLevelUp(level);
window.showTrending = (name, views) => window.achievementSystem.showTrending(name, views);

// 示例：監聽徽章獲得事件（可整合到您現有的系統）
document.addEventListener('DOMContentLoaded', function() {
    // 示例：模擬徽章獲得
    // setTimeout(() => {
    //     showBadgeUnlocked('創作者', '上傳了第一件作品');
    // }, 2000);
});

// 匯出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementNotificationSystem;
}

