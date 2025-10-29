/**
 * 企業人才搜尋 JavaScript
 * 包含進階搜尋、匹配度計算、結果篩選等功能
 */

// 從後端 API 載入學生資料
let students = [];

// 當前搜尋條件
let currentSearch = {
    query: '',
    department: '',
    grade: '',
    skills: [],
    minMatch: 0
};

// 搜尋歷史
let searchHistory = ['JavaScript', 'React', 'Python', 'UI/UX', '前端開發'];

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 先確保 API 服務就緒（延長等待時間）
        if (typeof ensureApiServiceReady === 'function') {
            await ensureApiServiceReady(50, 100);
        }
    } catch (_) { /* 繼續執行，後續每次請求仍會各自保險 */ }
    injectRefreshRecommendationsButton();
    loadFilterOptions();
    initEventListeners();
    loadSearchHistory();
    // 初始載入：顯示所有有作品的學生
    performSearch();
});

// 初始化事件監聽器
function initEventListeners() {
    // 搜尋輸入
    const searchInputEl = document.getElementById('searchInput');
    if (searchInputEl) {
        searchInputEl.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    const deptSel = document.getElementById('departmentFilter');
    if (deptSel) {
        deptSel.addEventListener('change', function() {
            currentSearch.department = this.value;
            performSearch();
        });
    }
    
    const gradeSel = document.getElementById('gradeFilter');
    if (gradeSel) {
        gradeSel.addEventListener('change', function() {
            currentSearch.grade = this.value;
            performSearch();
        });
    }
    
    // 技能 Tag 輸入
    const tagInput = document.getElementById('skillTagInput');
    if (tagInput) {
        tagInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const val = this.value.trim().replace(/^,|,$/g, '');
                if (val && !currentSearch.skills.includes(val)) {
                    currentSearch.skills.push(val);
                    renderSkillTags();
                    performSearch();
                }
                this.value = '';
            } else if (e.key === 'Backspace' && this.value === '') {
                // 刪除最後一個 tag
                currentSearch.skills.pop();
                renderSkillTags();
                performSearch();
            }
        });
    }
    
    const matchSel = document.getElementById('matchFilter');
    if (matchSel) {
        matchSel.addEventListener('change', function() {
            currentSearch.minMatch = parseInt(this.value);
            performSearch();
        });
    }
}

// 執行搜尋
async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    currentSearch.query = query;

    // 添加到搜尋歷史（僅在有字時）
    if (query) addToSearchHistory(query);

    try {
        const svc = await ensureApiServiceReady();

        const params = new URLSearchParams({
            q: currentSearch.query || '',
            skills: currentSearch.skills.join(',') || '',
            department: currentSearch.department || '',
            grade: currentSearch.grade || '',
            minMatch: String(currentSearch.minMatch || 0)
        });

        const res = await svc.request(`enterprise/search.php?${params.toString()}`);
        const list = res?.data?.students || res?.students || [];

        // 後端返回已含 matchScore / stats；標準化欄位
        students = (Array.isArray(list) ? list : []).map(s => ({
            id: s.id,
            name: s.name,
            department: s.department || '',
            grade: s.grade || '',
            skills: Array.isArray(s.skills) ? s.skills : [],
            avatar: s.avatar || 'https://via.placeholder.com/60x60/9CA3AF/ffffff?text=?',
            stats: s.stats || { portfolios: 0, views: 0, likes: 0 },
            matchScore: typeof s.matchScore === 'number' ? s.matchScore : 0
        }));


        renderSearchResults(students);
        updateResultsCount(students.length);
    } catch (err) {
        console.error('搜尋失敗:', err);
        Utils.showNotification(err.message || '搜尋失敗', 'error');
    }
}

// 設定搜尋關鍵字
function setSearchTerm(term) {
    document.getElementById('searchInput').value = term;
    currentSearch.query = term;
    addToSearchHistory(term);
    performSearch();
}

// 添加到搜尋歷史
function addToSearchHistory(query) {
    if (!searchHistory.includes(query)) {
        searchHistory.unshift(query);
        searchHistory = searchHistory.slice(0, 10); // 只保留最近10個
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
}

// 載入搜尋歷史
function loadSearchHistory() {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
        searchHistory = JSON.parse(saved);
    }
}

// 應用篩選器
// 後端已處理篩選與匹配度，此函數改為觸發伺服器端搜尋
function applyFilters() { performSearch(); }

// 計算匹配度
// 匹配度已由後端提供
function calculateMatchScore(student) { return student.matchScore || 0; }

// 渲染搜尋結果
function renderSearchResults(filteredStudents = null) {
    const resultsContainer = document.getElementById('searchResults');
    const emptyState = document.getElementById('emptyState');
    
    const studentsToRender = filteredStudents || students;
    
    if (studentsToRender.length === 0) {
        resultsContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    resultsContainer.style.display = 'grid';
    emptyState.style.display = 'none';
    
    resultsContainer.innerHTML = studentsToRender.map(student => {
        const score = student.matchScore || 0;
        const scoreClass = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
        
        return `
        <div class="student-card" data-match-score="${score}">
            <div class="student-header">
                <img src="${student.avatar}" alt="${student.name}" class="student-avatar">
                <div class="student-info">
                    <div class="student-name">${student.name}</div>
                    <div class="student-department">${student.department || '未設定'} ${student.grade ? '- ' + student.grade : ''}</div>
                </div>
                <div class="match-score ${scoreClass}">
                    <span class="score">${score}%</span>
                    <span class="label">匹配度</span>
                </div>
            </div>
            <div class="student-skills">
                ${(student.skills || []).slice(0, 8).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                ${student.skills && student.skills.length > 8 ? `<span class="skill-tag more">+${student.skills.length - 8}</span>` : ''}
            </div>
            <div class="student-stats">
                <span><i class="fas fa-folder"></i> ${student.stats.portfolios} 個作品</span>
                <span><i class="fas fa-eye"></i> ${Utils.formatNumber(student.stats.views)} 次瀏覽</span>
                <span><i class="fas fa-heart"></i> ${student.stats.likes} 個讚</span>
            </div>
            <div class="student-actions">
                <button class="action-btn" onclick="viewStudentProfile(${student.id})">
                    <i class="fas fa-user"></i> 查看資料
                </button>
                <button class="action-btn primary" onclick="contactStudent(${student.id})">
                    <i class="fas fa-envelope"></i> 聯絡
                </button>
            </div>
        </div>
    `;
    }).join('');
}

// 更新結果數量
function updateResultsCount(count) {
    const title = document.querySelector('.search-title');
    if (title) {
        title.textContent = `人才搜尋 (${count} 個結果)`;
    }
}

// 查看學生資料
function viewStudentProfile(studentId) {
    window.location.href = `student-profile.html?id=${studentId}`;
}

// 聯絡學生
function contactStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) {
        Utils.showNotification('找不到學生資料', 'error');
        return;
    }
    (async () => {
        try {
            const svc = await ensureApiServiceReady();
            const subject = '企業聯絡';
            const message = `您好，我們對您的背景（${(student.skills || []).slice(0,3).join(', ')}）很感興趣，方便進一步聯繫嗎？`;
            const res = await svc.request('enterprise/portfolios.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'contact', student_id: Number(studentId), subject, message })
            });
            if (res && res.status === 200) {
                Utils.showNotification(`已發送聯絡訊息給 ${student.name}`, 'success');
            } else {
                throw new Error(res?.message || '聯絡失敗');
            }
        } catch (e) {
            console.error(e);
            Utils.showNotification('聯絡失敗，請稍後再試', 'error');
        }
    })();
}

// 清除搜尋
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('departmentFilter').value = '';
    document.getElementById('gradeFilter').value = '';
    document.getElementById('skillFilter').value = '';
    document.getElementById('matchFilter').value = '0';
    
    currentSearch = {
        query: '',
        department: '',
        grade: '',
        skills: [],
        minMatch: 0
    };
    
    performSearch();
    Utils.showNotification('已清除所有搜尋條件', 'info');
}


// 取得篩選後的學生
function getFilteredStudents() { return students; }

// 全域函數，供 HTML 直接調用
window.performSearch = performSearch;
window.setSearchTerm = setSearchTerm;
window.clearSearch = clearSearch;
window.viewStudentProfile = viewStudentProfile;
window.contactStudent = contactStudent; 

// 渲染技能 Tag 清單與移除功能
function renderSkillTags() {
    const list = document.getElementById('skillTags');
    if (!list) return;
    const tags = currentSearch.skills || [];
    list.innerHTML = tags.map((t, idx) => `
        <span class="tag-item" data-idx="${idx}">
            <span class="tag-text">${t}</span>
            <button type="button" class="tag-remove" aria-label="移除" onclick="removeSkillTag(${idx})">×</button>
        </span>
    `).join('');
}

function removeSkillTag(index) {
    if (index >= 0 && index < currentSearch.skills.length) {
        currentSearch.skills.splice(index, 1);
        renderSkillTags();
        performSearch();
    }
}

window.removeSkillTag = removeSkillTag;

// 刷新推薦：加入按鈕並呼叫後端 refresh
function injectRefreshRecommendationsButton() {
    const actions = document.querySelector('.search-actions');
    if (!actions) return;
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline';
    btn.innerHTML = '<i class="fas fa-rotate"></i> 刷新推薦';
    btn.onclick = refreshRecommendations;
    actions.insertBefore(btn, actions.firstChild);
}

async function refreshRecommendations() {
    try {
        const svc = await ensureApiServiceReady();
        await svc.request('enterprise/recommendations.php?action=refresh');
        Utils.showNotification('推薦已刷新', 'success');
    } catch (e) {
        console.error(e);
        Utils.showNotification('刷新推薦失敗', 'error');
    }
}

// 動態載入篩選選單與熱門搜尋（與 dashboard 共用 meta 端點）
async function loadFilterOptions() {
    try {
        const svc = await ensureApiServiceReady();
        const res = await svc.request('enterprise/meta.php?action=search_filters');
        const data = res?.data || res || {};
        const skills = Array.isArray(data.skills) ? data.skills : [];
        const departments = Array.isArray(data.departments) ? data.departments : [];
        const categories = Array.isArray(data.categories) ? data.categories : [];
        const grades = Array.isArray(data.grades) ? data.grades : [];

        // 部門/科系
        const deptSel = document.getElementById('departmentFilter');
        if (deptSel) {
            const cur = deptSel.value;
            if (departments.length > 0) {
                deptSel.innerHTML = '<option value="">全部科系</option>' + departments.map(d => `<option value="${d}">${d}</option>`).join('');
            } else {
                // 備用選項
                deptSel.innerHTML = `<option value="">全部科系</option>
                    <option value="資訊管理學系">資訊管理學系</option>
                    <option value="資訊工程學系">資訊工程學系</option>
                    <option value="資訊安全學系">資訊安全學系</option>
                    <option value="資料科學學系">資料科學學系</option>
                    <option value="人工智慧學系">人工智慧學系</option>
                    <option value="企業管理學系">企業管理學系</option>
                    <option value="財務金融學系">財務金融學系</option>
                    <option value="國際企業學系">國際企業學系</option>`;
            }
            if (cur) deptSel.value = cur;
        }

        // 年級
        const gradeSel = document.getElementById('gradeFilter');
        if (gradeSel) {
            const cur = gradeSel.value;
            if (grades.length > 0) {
                gradeSel.innerHTML = '<option value="">全部年級</option>' + grades.map(g => `<option value="${g}">${g}</option>`).join('');
            } else {
                // 備用選項
                gradeSel.innerHTML = `<option value="">全部年級</option>
                    <option value="大學一年級">大學一年級</option>
                    <option value="大學二年級">大學二年級</option>
                    <option value="大學三年級">大學三年級</option>
                    <option value="大學四年級">大學四年級</option>
                    <option value="碩士生">碩士生</option>
                    <option value="博士生">博士生</option>`;
            }
            if (cur) gradeSel.value = cur;
        }

        // 熱門搜尋標籤（技能）
        const suggWrap = document.querySelector('.suggestion-tags');
        if (suggWrap) {
            if (skills.length > 0) {
                suggWrap.innerHTML = skills.slice(0, 12).map(s => {
                    const safe = String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');
                    return `<span class="suggestion-tag" onclick="addSkillTag(\"${safe}\")">${safe}</span>`;
                }).join('');
            } else {
                // 備用熱門技能
                const defaultSkills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS', 'UI/UX', 'Git'];
                suggWrap.innerHTML = defaultSkills.map(s => {
                    return `<span class="suggestion-tag" onclick="addSkillTag('${s}')">${s}</span>`;
                }).join('');
            }
        }
        
        console.log('篩選選項載入成功:', { departments: departments.length, grades: grades.length, skills: skills.length });
    } catch (e) {
        console.error('載入搜尋篩選元資料失敗', e);
        
        // 發生錯誤時，載入備用選項
        const deptSel = document.getElementById('departmentFilter');
        if (deptSel && deptSel.options.length <= 1) {
            deptSel.innerHTML = `<option value="">全部科系</option>
                <option value="資訊管理學系">資訊管理學系</option>
                <option value="資訊工程學系">資訊工程學系</option>
                <option value="資訊安全學系">資訊安全學系</option>
                <option value="資料科學學系">資料科學學系</option>
                <option value="人工智慧學系">人工智慧學系</option>
                <option value="企業管理學系">企業管理學系</option>
                <option value="財務金融學系">財務金融學系</option>
                <option value="國際企業學系">國際企業學系</option>`;
        }
        
        const gradeSel = document.getElementById('gradeFilter');
        if (gradeSel && gradeSel.options.length <= 1) {
            gradeSel.innerHTML = `<option value="">全部年級</option>
                <option value="大學一年級">大學一年級</option>
                <option value="大學二年級">大學二年級</option>
                <option value="大學三年級">大學三年級</option>
                <option value="大學四年級">大學四年級</option>
                <option value="碩士生">碩士生</option>
                <option value="博士生">博士生</option>`;
        }
    }
}

// 將熱門技能加入為 Tag 並觸發搜尋
function addSkillTag(name) {
    const val = String(name || '').trim();
    if (!val) return;
    if (!currentSearch.skills.includes(val)) {
        currentSearch.skills.push(val);
        renderSkillTags();
        performSearch();
    }
}

window.addSkillTag = addSkillTag;

// 確保 API 服務就緒（帶重試）
async function ensureApiServiceReady(maxRetries = 10, delayMs = 100) {
    // 立即可用
    if (window.apiService) return window.apiService;
    // 嘗試初始化
    if (typeof window.initializeApiService === 'function') {
        try { window.initializeApiService(); } catch (_) {}
    }
    // 重試等待
    for (let i = 0; i < maxRetries; i++) {
        if (window.apiService) return window.apiService;
        await new Promise(r => setTimeout(r, delayMs));
    }
    // 最後嘗試一次直接建構（若類別可用）
    if (!window.apiService && typeof window.ApiService === 'function') {
        try {
            window.apiService = new window.ApiService();
            return window.apiService;
        } catch (_) {}
    }
    throw new Error('API 服務未就緒');
}