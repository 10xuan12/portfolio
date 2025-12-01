/**
 * 學生端職缺詳情 JavaScript
 */

// 當前職缺資料
let jobDetail = null;
let isBookmarked = false;

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', async function() {
    await loadJobDetail();
    initEventListeners();
});

/**
 * 從 URL 獲取職缺 ID
 */
function getJobIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    return id ? parseInt(id) : null;
}

/**
 * 載入職缺詳情
 */
async function loadJobDetail() {
    try {
        const jobId = getJobIdFromUrl();
        if (!jobId) {
            throw new Error('缺少職缺 ID');
        }

        // 確保 API 服務已初始化
        if (typeof apiService === 'undefined' || !apiService) {
            if (typeof window.initializeApiService === 'function') {
                window.initializeApiService();
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        if (typeof apiService === 'undefined' || !apiService) {
            throw new Error('API 服務未初始化');
        }

        // 載入職缺詳情
        const result = await apiService.request(`student/jobs.php?action=detail&id=${jobId}`);
        
        if (result && (result.status === 200 || result.success)) {
            const data = result.data || result;
            jobDetail = data;
            renderJobDetail();
            checkBookmarkStatus();
        } else {
            throw new Error(result?.message || '載入職缺詳情失敗');
        }
    } catch (error) {
        console.error('載入職缺詳情錯誤:', error);
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('載入職缺詳情失敗，請稍後再試', 'error');
        } else {
            alert('載入職缺詳情失敗，請稍後再試');
        }
        
        // 顯示錯誤訊息
        const container = document.querySelector('.job-detail-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h3>載入失敗</h3>
                    <p>${error.message || '無法載入職缺詳情'}</p>
                    <button class="btn btn-primary" onclick="window.location.href='dashboard.html'">返回主頁</button>
                </div>
            `;
        }
    }
}

/**
 * 渲染職缺詳情
 */
function renderJobDetail() {
    if (!jobDetail) return;

    // 標題
    const jobTitle = document.getElementById('jobTitle');
    if (jobTitle) jobTitle.textContent = jobDetail.title || '未命名職缺';

    // 企業資訊
    const companyName = document.getElementById('companyName');
    if (companyName) companyName.textContent = jobDetail.company_name || '企業';

    const companyLogo = document.getElementById('companyLogo');
    if (companyLogo) {
        if (jobDetail.logo_url) {
            companyLogo.src = jobDetail.logo_url;
            companyLogo.style.display = 'block';
        } else {
            companyLogo.style.display = 'none';
        }
    }

    // 狀態
    const jobStatus = document.getElementById('jobStatus');
    if (jobStatus) {
        jobStatus.textContent = getJobStatusText(jobDetail.status);
        jobStatus.className = `job-status status-${jobDetail.status || 'active'}`;
    }

    // 基本資訊
    const jobMeta = document.getElementById('jobMeta');
    if (jobMeta) {
        jobMeta.innerHTML = `
            <span><i class="bi bi-building"></i> ${jobDetail.department || '未指定'}</span>
            <span><i class="bi bi-briefcase"></i> ${jobDetail.job_type || '未指定'}</span>
            <span><i class="bi bi-geo-alt"></i> ${jobDetail.location || '未指定'}</span>
        `;
    }

    // 職缺描述
    const jobDescription = document.getElementById('jobDescription');
    if (jobDescription) {
        jobDescription.innerHTML = formatText(jobDetail.description || '暫無描述');
    }

    // 技能要求
    const requirementsList = document.getElementById('requirementsList');
    if (requirementsList) {
        const skills = Array.isArray(jobDetail.skills_required) 
            ? jobDetail.skills_required 
            : (jobDetail.skills_required ? jobDetail.skills_required.split(',') : []);
        
        if (skills.length > 0) {
            requirementsList.innerHTML = skills.map(skill => 
                `<span class="requirement-tag">${skill.trim()}</span>`
            ).join('');
        } else {
            requirementsList.innerHTML = '<span class="no-requirements">暫無技能要求</span>';
        }
    }

    // 工作職責
    if (jobDetail.responsibilities) {
        const responsibilitiesSection = document.getElementById('responsibilitiesSection');
        const jobResponsibilities = document.getElementById('jobResponsibilities');
        if (responsibilitiesSection) responsibilitiesSection.style.display = 'block';
        if (jobResponsibilities) {
            jobResponsibilities.innerHTML = formatText(jobDetail.responsibilities);
        }
    }

    // 職位要求
    const experienceLevel = document.getElementById('experienceLevel');
    if (experienceLevel) experienceLevel.textContent = jobDetail.experience_level || '不拘';

    const educationLevel = document.getElementById('educationLevel');
    if (educationLevel) educationLevel.textContent = jobDetail.education_level || '不拘';

    // 薪資
    const salaryRange = document.getElementById('salaryRange');
    if (salaryRange) {
        salaryRange.textContent = jobDetail.salary_range || '面議';
    }

    // 福利
    if (jobDetail.benefits) {
        const benefitsContent = document.getElementById('benefitsContent');
        const benefitsText = document.getElementById('benefitsText');
        if (benefitsContent) benefitsContent.style.display = 'block';
        if (benefitsText) {
            benefitsText.innerHTML = formatText(jobDetail.benefits);
        }
    }

    // 企業資訊
    const companyInfoGrid = document.getElementById('companyInfoGrid');
    if (companyInfoGrid) {
        let companyInfoHTML = '';
        if (jobDetail.company_description) {
            companyInfoHTML += `<div class="company-description">${formatText(jobDetail.company_description)}</div>`;
        }
        if (jobDetail.contact_email) {
            companyInfoHTML += `<div class="info-row"><i class="bi bi-envelope"></i><span>${jobDetail.contact_email}</span></div>`;
        }
        if (jobDetail.website) {
            companyInfoHTML += `<div class="info-row"><i class="bi bi-globe"></i><a href="${jobDetail.website}" target="_blank">${jobDetail.website}</a></div>`;
        }
        if (jobDetail.address) {
            companyInfoHTML += `<div class="info-row"><i class="bi bi-geo-alt"></i><span>${jobDetail.address}</span></div>`;
        }
        companyInfoGrid.innerHTML = companyInfoHTML || '<p>暫無企業資訊</p>';
    }

    // 側邊欄資訊
    const publishedDate = document.getElementById('publishedDate');
    if (publishedDate && jobDetail.published_at) {
        publishedDate.textContent = formatDate(jobDetail.published_at);
    }

    if (jobDetail.deadline) {
        const deadlineItem = document.getElementById('deadlineItem');
        const deadlineDate = document.getElementById('deadlineDate');
        if (deadlineItem) deadlineItem.style.display = 'block';
        if (deadlineDate) deadlineDate.textContent = formatDate(jobDetail.deadline);
    }

    // 標題區域的日期資訊（variant-5 使用）
    const publishedDateHeader = document.getElementById('publishedDateHeader');
    if (publishedDateHeader && jobDetail.published_at) {
        publishedDateHeader.textContent = formatDateShort(jobDetail.published_at);
    }

    if (jobDetail.deadline) {
        const deadlineRowHeader = document.getElementById('deadlineRowHeader');
        const deadlineDateHeader = document.getElementById('deadlineDateHeader');
        if (deadlineRowHeader) deadlineRowHeader.style.display = 'flex';
        if (deadlineDateHeader) deadlineDateHeader.textContent = formatDateShort(jobDetail.deadline);
    }

    const viewCount = document.getElementById('viewCount');
    if (viewCount) viewCount.textContent = jobDetail.view_count || 0;

    const applicationCount = document.getElementById('applicationCount');
    if (applicationCount) applicationCount.textContent = jobDetail.application_count || 0;

}

/**
 * 檢查收藏狀態
 */
async function checkBookmarkStatus() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) return;

        // 這裡可以調用 API 檢查是否已收藏
        // 暫時使用 localStorage
        const bookmarks = JSON.parse(localStorage.getItem('job_bookmarks') || '[]');
        isBookmarked = bookmarks.includes(jobDetail.id);

        updateBookmarkButton();
    } catch (error) {
        console.error('檢查收藏狀態錯誤:', error);
    }
}

/**
 * 更新收藏按鈕狀態
 */
function updateBookmarkButton() {
    // 側邊欄的收藏按鈕
    const bookmarkIcon = document.getElementById('bookmarkIcon');
    const bookmarkText = document.getElementById('bookmarkText');
    
    if (bookmarkIcon && bookmarkText) {
        if (isBookmarked) {
            bookmarkIcon.className = 'bi bi-bookmark-fill';
            bookmarkText.textContent = '已收藏';
        } else {
            bookmarkIcon.className = 'bi bi-bookmark';
            bookmarkText.textContent = '收藏職缺';
        }
    }

    // 標題區域的收藏按鈕（variant-5 使用）
    const bookmarkIconHeader = document.getElementById('bookmarkIconHeader');
    const bookmarkTextHeader = document.getElementById('bookmarkTextHeader');
    
    if (bookmarkIconHeader && bookmarkTextHeader) {
        if (isBookmarked) {
            bookmarkIconHeader.className = 'bi bi-bookmark-fill';
            bookmarkTextHeader.textContent = '已收藏';
        } else {
            bookmarkIconHeader.className = 'bi bi-bookmark';
            bookmarkTextHeader.textContent = '收藏職缺';
        }
    }
}

/**
 * 切換收藏狀態
 */
async function toggleBookmark() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('請先登入', 'warning');
            } else {
                alert('請先登入');
            }
            return;
        }

        // 切換收藏狀態
        isBookmarked = !isBookmarked;
        const bookmarks = JSON.parse(localStorage.getItem('job_bookmarks') || '[]');
        
        if (isBookmarked) {
            if (!bookmarks.includes(jobDetail.id)) {
                bookmarks.push(jobDetail.id);
            }
        } else {
            const index = bookmarks.indexOf(jobDetail.id);
            if (index > -1) {
                bookmarks.splice(index, 1);
            }
        }
        
        localStorage.setItem('job_bookmarks', JSON.stringify(bookmarks));
        updateBookmarkButton();

        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification(isBookmarked ? '已收藏職缺' : '已取消收藏', 'success');
        }
    } catch (error) {
        console.error('切換收藏狀態錯誤:', error);
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('操作失敗，請稍後再試', 'error');
        }
    }
}

/**
 * 申請職缺
 */
async function applyJob() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('請先登入', 'warning');
            } else {
                alert('請先登入');
            }
            window.location.href = '../auth/login.html';
            return;
        }

        // 跳轉到申請頁面（如果有的話）
        // 或者顯示申請表單
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('申請功能開發中，即將推出', 'info');
        } else {
            alert('申請功能開發中，即將推出');
        }
        
        // 這裡可以實現申請功能
        // window.location.href = `job-apply.html?job_id=${jobDetail.id}`;
    } catch (error) {
        console.error('申請職缺錯誤:', error);
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('申請失敗，請稍後再試', 'error');
        }
    }
}

/**
 * 初始化事件監聽器
 */
function initEventListeners() {
    // 可以在這裡添加其他事件監聽器
}

/**
 * 取得職缺狀態文字
 */
function getJobStatusText(status) {
    const statusMap = {
        'active': '招募中',
        'paused': '暫停招募',
        'closed': '已結束',
        'draft': '草稿'
    };
    return statusMap[status] || status;
}

/**
 * 格式化日期
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * 格式化日期（簡潔版，用於標題區域）
 */
function formatDateShort(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * 格式化文字（保留換行）
 */
function formatText(text) {
    if (!text) return '暫無內容';
    return text.replace(/\n/g, '<br>');
}

// 全域函數
window.applyJob = applyJob;
window.toggleBookmark = toggleBookmark;

