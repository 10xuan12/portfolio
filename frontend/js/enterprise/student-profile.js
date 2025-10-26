(function() {
    function getQueryId() {
        try { return Number(new URLSearchParams(location.search).get('id')) || null; } catch (_) { return null; }
    }

    async function fetchPublicProfile(studentId) {
        const svc = window.apiService || window.initializeApiService?.();
        return svc.request(`enterprise/profile.php?action=get_student_public_profile&student_id=${studentId}`);
    }

    async function fetchPublicPortfolios(studentId) {
        const svc = window.apiService || window.initializeApiService?.();
        return svc.request(`enterprise/profile.php?action=get_student_public_portfolios&student_id=${studentId}`);
    }

    function renderProfile(profile) {
        const name = profile.display_name || profile.username || `${profile.first_name || ''}${profile.last_name || ''}` || '學生';
        const schoolMajor = [profile.school, profile.major].filter(Boolean).join(' · ');
        const gradeGrad = [profile.grade, profile.graduation_year].filter(Boolean).join(' · ');
        const meta = [schoolMajor, gradeGrad].filter(Boolean).join(' | ');
        const initial = (name || '學').trim().charAt(0);

        const avatar = document.getElementById('spAvatar');
        if (avatar) {
            if (profile.avatar_url) {
                // API 已返回完整路徑（/portfolio/... 或 http://...），直接使用
                avatar.src = profile.avatar_url;
            } else {
                avatar.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initial)}`;
            }
            avatar.alt = name;
        }
        const nameEl = document.getElementById('spName'); if (nameEl) nameEl.textContent = name;
        const infoEl = document.getElementById('spInfo'); if (infoEl) infoEl.textContent = meta;
        const bioEl = document.getElementById('spBio'); if (bioEl) bioEl.textContent = profile.bio || '';

        const stats = profile.stats || {};
        const spStatPortfolios = document.getElementById('spStatPortfolios'); if (spStatPortfolios) spStatPortfolios.textContent = `${stats.portfolio_count || 0} 個作品`;
        const spStatViews = document.getElementById('spStatViews'); if (spStatViews) spStatViews.textContent = `${stats.total_views || 0} 次瀏覽`;
        const spStatLikes = document.getElementById('spStatLikes'); if (spStatLikes) spStatLikes.textContent = `${stats.total_likes || 0} 個讚`;

        // 社群
        const socialUl = document.getElementById('spSocial');
        if (socialUl) {
            const social = profile.social_media || {};
            const entries = Object.entries(social);
            socialUl.innerHTML = entries.length ? entries.map(([platform, url]) => (
                `<li><a href="${url}" target="_blank" rel="noopener noreferrer"><i class="fab fa-${platform}"></i> ${platform}</a></li>`
            )).join('') : '<li>尚無公開社群連結</li>';
        }
    }

    function renderWorks(list) {
        const container = document.getElementById('spWorks');
        if (!container) return;
        container.innerHTML = (list || []).map(w => `
            <div class="work-card" onclick="window.location.href='../student/portfolio-detail.html?id=${w.id}'">
                <div class="work-cover" style="background-image:url('${(w.cover_image || '').replace(/'/g, "\\'")}');"></div>
                <div class="work-body">
                    <div class="work-title">${escapeHtml(w.title || '')}</div>
                    <div class="work-desc">${escapeHtml(w.description || '')}</div>
                    <div class="work-stats"><i class="fas fa-eye"></i> ${w.views || 0} · <i class="fas fa-heart"></i> ${w.likes || 0}</div>
                </div>
            </div>
        `).join('');
    }

    function escapeHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    document.addEventListener('DOMContentLoaded', async function() {
        if (typeof initializeApiService === 'function') {
            initializeApiService();
        }
        const id = getQueryId();
        if (!id) {
            alert('缺少學生 ID');
            return;
        }
        try {
            const [p1, p2] = await Promise.all([
                fetchPublicProfile(id),
                fetchPublicPortfolios(id)
            ]);
            const profile = p1.data || p1;
            const works = p2.data || p2;
            renderProfile(profile);
            renderWorks(Array.isArray(works) ? works : []);
            setupBookmarkButton(id);
        } catch (e) {
            console.error('載入學生公開資料失敗', e);
            alert('無法載入學生資料');
        }
    });

    // 設定收藏按鈕
    function setupBookmarkButton(studentId) {
        const btnBookmark = document.getElementById('btnBookmark');
        if (!btnBookmark) return;
        
        btnBookmark.addEventListener('click', async function() {
            // 注意：這裡收藏的是學生，不是作品
            // 如果系統有學生收藏功能，可以在這裡實現
            // 暫時顯示通知
            showNotification('學生收藏功能開發中，請先收藏學生的作品', 'info');
        });
        
        const btnContact = document.getElementById('btnContact');
        if (btnContact) {
            btnContact.addEventListener('click', function() {
                showNotification('聯絡功能開發中', 'info');
            });
        }
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
})();


