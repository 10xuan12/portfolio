/**
 * 企業人才搜尋 JavaScript
 * 包含進階搜尋、匹配度計算、結果篩選等功能
 */

// TODO: 從後端 API 載入學生資料
let students = [
    {
        id: 1,
        name: '張小明',
        department: '資訊管理學系',
        grade: '大學三年級',
        skills: ['JavaScript', 'React', 'Node.js', 'UI/UX Design', 'HTML5', 'CSS3'],
        avatar: 'https://via.placeholder.com/60x60/667eea/ffffff?text=張',
        stats: {
            portfolios: 12,
            views: 1234,
            likes: 89
        },
        matchScore: 95
    },
    {
        id: 2,
        name: '李大明',
        department: '資訊工程學系',
        grade: '大學四年級',
        skills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL', 'TensorFlow'],
        avatar: 'https://via.placeholder.com/60x60/764ba2/ffffff?text=李',
        stats: {
            portfolios: 8,
            views: 856,
            likes: 45
        },
        matchScore: 88
    },
    {
        id: 3,
        name: '王小美',
        department: '設計學系',
        grade: '大學三年級',
        skills: ['Figma', 'Adobe Creative Suite', 'UI/UX Design', 'Prototyping', 'Sketch'],
        avatar: 'https://via.placeholder.com/60x60/f093fb/ffffff?text=王',
        stats: {
            portfolios: 15,
            views: 1567,
            likes: 123
        },
        matchScore: 82
    },
    {
        id: 4,
        name: '陳小華',
        department: '資訊管理學系',
        grade: '大學二年級',
        skills: ['Java', 'Spring Boot', 'MySQL', 'Git', 'Docker'],
        avatar: 'https://via.placeholder.com/60x60/4ade80/ffffff?text=陳',
        stats: {
            portfolios: 6,
            views: 432,
            likes: 28
        },
        matchScore: 75
    }
];

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
document.addEventListener('DOMContentLoaded', function() {
    renderSearchResults();
    initEventListeners();
    loadSearchHistory();
});

// 初始化事件監聽器
function initEventListeners() {
    // 搜尋輸入
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 篩選器變更
    document.getElementById('departmentFilter').addEventListener('change', function() {
        currentSearch.department = this.value;
        applyFilters();
    });
    
    document.getElementById('gradeFilter').addEventListener('change', function() {
        currentSearch.grade = this.value;
        applyFilters();
    });
    
    document.getElementById('skillFilter').addEventListener('input', Utils.debounce(function() {
        currentSearch.skills = this.value.split(',').map(s => s.trim()).filter(s => s);
        applyFilters();
    }, 300));
    
    document.getElementById('matchFilter').addEventListener('change', function() {
        currentSearch.minMatch = parseInt(this.value);
        applyFilters();
    });
}

// 執行搜尋
function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        Utils.showNotification('請輸入搜尋關鍵字', 'warning');
        return;
    }
    
    currentSearch.query = query;
    
    // 添加到搜尋歷史
    addToSearchHistory(query);
    
    // 執行篩選
    applyFilters();
    
    Utils.showNotification(`找到 ${getFilteredStudents().length} 個符合條件的人才`, 'success');
}

// 設定搜尋關鍵字
function setSearchTerm(term) {
    document.getElementById('searchInput').value = term;
    currentSearch.query = term;
    addToSearchHistory(term);
    applyFilters();
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
function applyFilters() {
    let filteredStudents = students;
    
    // 關鍵字搜尋
    if (currentSearch.query) {
        const query = currentSearch.query.toLowerCase();
        filteredStudents = filteredStudents.filter(student => 
            student.name.toLowerCase().includes(query) ||
            student.department.toLowerCase().includes(query) ||
            student.skills.some(skill => skill.toLowerCase().includes(query))
        );
    }
    
    // 科系篩選
    if (currentSearch.department) {
        filteredStudents = filteredStudents.filter(student => 
            student.department === currentSearch.department
        );
    }
    
    // 年級篩選
    if (currentSearch.grade) {
        filteredStudents = filteredStudents.filter(student => 
            student.grade === currentSearch.grade
        );
    }
    
    // 技能篩選
    if (currentSearch.skills.length > 0) {
        filteredStudents = filteredStudents.filter(student => 
            currentSearch.skills.some(skill => 
                student.skills.some(studentSkill => 
                    studentSkill.toLowerCase().includes(skill.toLowerCase())
                )
            )
        );
    }
    
    // 計算匹配度
    filteredStudents = filteredStudents.map(student => ({
        ...student,
        matchScore: calculateMatchScore(student)
    }));
    
    // 匹配度篩選
    if (currentSearch.minMatch > 0) {
        filteredStudents = filteredStudents.filter(student => 
            student.matchScore >= currentSearch.minMatch
        );
    }
    
    // 按匹配度排序
    filteredStudents.sort((a, b) => b.matchScore - a.matchScore);
    
    renderSearchResults(filteredStudents);
    updateResultsCount(filteredStudents.length);
}

// 計算匹配度
function calculateMatchScore(student) {
    let score = 0;
    const totalSkills = student.skills.length;
    
    // 基礎分數
    score += 30;
    
    // 技能匹配加分
    if (currentSearch.skills.length > 0) {
        const matchedSkills = currentSearch.skills.filter(searchSkill => 
            student.skills.some(studentSkill => 
                studentSkill.toLowerCase().includes(searchSkill.toLowerCase())
            )
        );
        score += (matchedSkills.length / currentSearch.skills.length) * 40;
    }
    
    // 作品數量加分
    score += Math.min(student.stats.portfolios * 2, 20);
    
    // 瀏覽次數加分
    score += Math.min(student.stats.views / 100, 10);
    
    return Math.round(score);
}

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
    
    resultsContainer.innerHTML = studentsToRender.map(student => `
        <div class="student-card">
            <div class="student-header">
                <img src="${student.avatar}" alt="${student.name}" class="student-avatar">
                <div class="student-info">
                    <div class="student-name">${student.name}</div>
                    <div class="student-department">${student.department} - ${student.grade}</div>
                </div>
                <div class="match-score">
                    <span class="score">${student.matchScore}%</span>
                    <span class="label">匹配</span>
                </div>
            </div>
            <div class="student-skills">
                ${student.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
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
    `).join('');
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
    if (student) {
        // TODO: 實作聯絡學生功能
        Utils.showNotification(`正在聯絡 ${student.name}...`, 'info');
        
        // 模擬聯絡功能
        setTimeout(() => {
            Utils.showNotification(`已發送聯絡訊息給 ${student.name}`, 'success');
        }, 1000);
    }
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
    
    renderSearchResults();
    updateResultsCount(students.length);
    Utils.showNotification('已清除所有搜尋條件', 'info');
}

// 匯出搜尋結果
function exportResults() {
    try {
        const filteredStudents = getFilteredStudents();
        const data = {
            exportDate: new Date().toISOString(),
            searchCriteria: currentSearch,
            students: filteredStudents.map(student => ({
                id: student.id,
                name: student.name,
                department: student.department,
                grade: student.grade,
                skills: student.skills,
                matchScore: student.matchScore,
                stats: student.stats
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `talent-search-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('搜尋結果已匯出', 'success');
    } catch (error) {
        Utils.showNotification('匯出失敗，請稍後再試', 'error');
        console.error('匯出搜尋結果錯誤:', error);
    }
}

// 取得篩選後的學生
function getFilteredStudents() {
    let filtered = students;
    
    if (currentSearch.query) {
        const query = currentSearch.query.toLowerCase();
        filtered = filtered.filter(student => 
            student.name.toLowerCase().includes(query) ||
            student.department.toLowerCase().includes(query) ||
            student.skills.some(skill => skill.toLowerCase().includes(query))
        );
    }
    
    if (currentSearch.department) {
        filtered = filtered.filter(student => 
            student.department === currentSearch.department
        );
    }
    
    if (currentSearch.grade) {
        filtered = filtered.filter(student => 
            student.grade === currentSearch.grade
        );
    }
    
    if (currentSearch.skills.length > 0) {
        filtered = filtered.filter(student => 
            currentSearch.skills.some(skill => 
                student.skills.some(studentSkill => 
                    studentSkill.toLowerCase().includes(skill.toLowerCase())
                )
            )
        );
    }
    
    filtered = filtered.map(student => ({
        ...student,
        matchScore: calculateMatchScore(student)
    }));
    
    if (currentSearch.minMatch > 0) {
        filtered = filtered.filter(student => 
            student.matchScore >= currentSearch.minMatch
        );
    }
    
    return filtered.sort((a, b) => b.matchScore - a.matchScore);
}

// 全域函數，供 HTML 直接調用
window.performSearch = performSearch;
window.setSearchTerm = setSearchTerm;
window.clearSearch = clearSearch;
window.exportResults = exportResults;
window.viewStudentProfile = viewStudentProfile;
window.contactStudent = contactStudent; 