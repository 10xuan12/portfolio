/**
 * 管理員報告管理 JavaScript
 * 包含報告處理、狀態管理、篩選功能等
 */

// 檢舉報告資料（可從後端 API 載入：/api/admin/reviews）
let reports = [
    {
        id: 1,
        type: 'inappropriate',
        reporter: '張小明',
        reported: '李大明',
        status: 'pending',
        submitted_at: '2024-01-20 16:20',
        reason: '作品描述包含不當用語',
        description: '報告李大明作品「行動應用程式」包含不當內容，違反平台規範。',
        details: '作品描述中使用了不適合的語言，可能對其他使用者造成困擾。',
        content_type: 'portfolio',
        content_id: 123
    },
    {
        id: 2,
        type: 'spam',
        reporter: '系統',
        reported: '某企業',
        status: 'resolved',
        submitted_at: '2024-01-20 14:30',
        reason: '職缺描述包含過多連結和推銷內容',
        description: '系統自動檢測到某企業發布的職缺包含垃圾訊息內容。',
        details: '已移除該職缺並警告企業',
        content_type: 'job',
        content_id: 456,
        resolved_at: '2024-01-20 15:00',
        resolved_by: '系統管理員'
    },
    {
        id: 3,
        type: 'fake',
        reporter: '王小美',
        reported: '某學生',
        status: 'dismissed',
        submitted_at: '2024-01-20 12:15',
        reason: '作品描述與實際技能不符',
        description: '報告某學生作品包含虛假的技能和經驗描述。',
        details: '經查證後發現報告內容不實',
        content_type: 'portfolio',
        content_id: 789,
        dismissed_at: '2024-01-20 13:00',
        dismissed_by: '系統管理員',
        dismiss_reason: '報告內容不實'
    }
];

// 當前篩選條件
let currentFilters = {
    search: '',
    type: '',
    status: '',
    date: ''
};

// 當前頁面
let currentPage = 1;
const itemsPerPage = 10;

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    const grid = document.getElementById('reportsGrid');
    if (grid) grid.innerHTML = `<div style="display:flex;justify-content:center;padding:20px;color:var(--text-secondary);"><i class=\"fas fa-spinner fa-spin\" style=\"margin-right:8px;\"></i>載入中...</div>`;
    loadReports();
});

// 從 API 載入報告資料
async function loadReports() {
    try {
        Utils.showNotification('載入報告資料中...', 'info');
        const resp = await apiService.getAdminReports(buildReportFilters());
        const data = resp?.data || resp;
        reports = Array.isArray(data) ? data : (Array.isArray(data?.reports) ? data.reports : reports);
        renderReports();
        updateStats();
        Utils.showNotification('報告資料已載入', 'success');
        if (!reports || reports.length === 0) {
            const grid = document.getElementById('reportsGrid');
            if (grid) grid.innerHTML = `<div class="empty-state"><i class="fas fa-flag"></i><h3>沒有符合條件的報告</h3></div>`;
        }
    } catch (e) {
        console.warn('載入報告失敗，使用本地假資料。', e);
        renderReports();
        updateStats();
    }
}

function buildReportFilters() {
    const f = {};
    if (currentFilters.search) f.q = currentFilters.search;
    if (currentFilters.type) f.type = currentFilters.type;
    if (currentFilters.status) f.status = currentFilters.status;
    if (currentFilters.date) f.date = currentFilters.date;
    return f;
}

// 初始化事件監聽器
function initEventListeners() {
    // 搜尋篩選
    document.getElementById('searchFilter').addEventListener('input', Utils.debounce(function() {
        currentFilters.search = this.value;
        applyFilters();
    }, 300));
    
    // 類型篩選
    document.getElementById('typeFilter').addEventListener('change', function() {
        currentFilters.type = this.value;
        applyFilters();
    });
    
    // 狀態篩選
    document.getElementById('statusFilter').addEventListener('change', function() {
        currentFilters.status = this.value;
        applyFilters();
    });
    
    // 日期篩選
    document.getElementById('dateFilter').addEventListener('change', function() {
        currentFilters.date = this.value;
        applyFilters();
    });
}

// 渲染報告列表
function renderReports(filteredReports = null) {
    const grid = document.getElementById('reportsGrid');
    const reportsToRender = filteredReports || reports;
    
    if (reportsToRender.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-flag"></i>
                <h3>沒有找到符合條件的報告</h3>
                <p>請嘗試調整搜尋條件或篩選器</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = reportsToRender.map(report => `
        <div class="report-item ${report.type}">
            <div class="report-header">
                <div class="report-info">
                    <h3>${getReportTypeText(report.type)}報告</h3>
                    <div class="report-meta">
                        <span>報告者：${report.reporter}</span>
                        <span>報告時間：${report.submitted_at}</span>
                    </div>
                </div>
                <span class="report-status status-${report.status}">${getStatusText(report.status)}</span>
            </div>
            <div class="report-content">
                <p class="report-description">${report.description}</p>
                <div class="report-details">
                    <p><strong>報告類型：</strong>${getReportTypeText(report.type)}</p>
                    <p><strong>被報告者：</strong>${report.reported}</p>
                    <p><strong>報告原因：</strong>${report.reason}</p>
                    <p><strong>詳細說明：</strong>${report.details}</p>
                    ${report.status === 'resolved' ? `<p><strong>處理結果：</strong>${report.details}</p>` : ''}
                    ${report.status === 'dismissed' ? `<p><strong>駁回原因：</strong>${report.dismiss_reason || '未提供'}</p>` : ''}
                </div>
            </div>
            <div class="report-actions">
                <button class="action-btn" onclick="viewReport(${report.id})">
                    <i class="fas fa-eye"></i> 查看詳情
                </button>
                ${report.status === 'pending' ? `
                    <button class="action-btn resolve" onclick="resolveReport(${report.id})">
                        <i class="fas fa-check"></i> 處理完成
                    </button>
                    <button class="action-btn dismiss" onclick="dismissReport(${report.id})">
                        <i class="fas fa-times"></i> 駁回報告
                    </button>
                ` : `
                    <button class="action-btn" onclick="reopenReport(${report.id})">
                        <i class="fas fa-redo"></i> 重新開啟
                    </button>
                `}
            </div>
        </div>
    `).join('');
}

// 取得報告類型文字
function getReportTypeText(type) {
    const typeMap = {
        'inappropriate': '不當內容',
        'spam': '垃圾訊息',
        'fake': '虛假資訊',
        'other': '其他'
    };
    return typeMap[type] || type;
}

// 取得狀態文字
function getStatusText(status) {
    const statusMap = {
        'pending': '待處理',
        'resolved': '已處理',
        'dismissed': '已駁回'
    };
    return statusMap[status] || status;
}

// 應用篩選器
function applyFilters() {
    let filteredReports = reports;
    
    // 搜尋篩選
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredReports = filteredReports.filter(report => 
            report.reporter.toLowerCase().includes(searchTerm) ||
            report.reported.toLowerCase().includes(searchTerm) ||
            report.reason.toLowerCase().includes(searchTerm) ||
            report.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // 類型篩選
    if (currentFilters.type) {
        filteredReports = filteredReports.filter(report => report.type === currentFilters.type);
    }
    
    // 狀態篩選
    if (currentFilters.status) {
        filteredReports = filteredReports.filter(report => report.status === currentFilters.status);
    }
    
    // 日期篩選
    if (currentFilters.date) {
        const today = new Date();
        const filterDate = new Date();
        
        switch (currentFilters.date) {
            case 'today':
                filterDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                filterDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                filterDate.setMonth(today.getMonth() - 1);
                break;
        }
        
        filteredReports = filteredReports.filter(report => {
            const submittedDate = new Date(report.submitted_at);
            return submittedDate >= filterDate;
        });
    }
    
    renderReports(filteredReports);
    updateResultsCount(filteredReports.length);
}

// 更新結果數量
function updateResultsCount(count) {
    const title = document.querySelector('.reports-title');
    if (title) {
        title.textContent = `報告管理 (${count} 個結果)`;
    }
}

// 更新統計資料
function updateStats() {
    const stats = {
        pending: reports.filter(r => r.status === 'pending').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        dismissed: reports.filter(r => r.status === 'dismissed').length,
        total: reports.length
    };
    
    // 更新統計卡片
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = stats.pending;
        statNumbers[1].textContent = stats.resolved;
        statNumbers[2].textContent = stats.dismissed;
        statNumbers[3].textContent = stats.total;
    }
}

// 查看報告詳情
function viewReport(reportId) {
    window.location.href = `report-detail.html?id=${reportId}`;
}

// 處理報告
async function resolveReport(reportId) {
    try {
        await apiService.resolveAdminReport(reportId);
        
        // 更新本地狀態
        const report = reports.find(r => r.id === reportId);
        if (report) {
            report.status = 'resolved';
            report.resolved_at = new Date().toISOString();
            report.resolved_by = '系統管理員';
            renderReports();
            updateStats();
            Utils.showNotification('報告已處理完成', 'success');
        }
        
    } catch (error) {
        Utils.showNotification('處理報告失敗，請稍後再試', 'error');
        console.error('處理報告錯誤:', error);
    }
}

// 駁回報告
async function dismissReport(reportId) {
    const dismissReason = prompt('請輸入駁回原因：');
    if (dismissReason === null) return; // 使用者取消
    
    try {
        await apiService.dismissAdminReport(reportId, dismissReason);
        
        // 更新本地狀態
        const report = reports.find(r => r.id === reportId);
        if (report) {
            report.status = 'dismissed';
            report.dismissed_at = new Date().toISOString();
            report.dismissed_by = '系統管理員';
            report.dismiss_reason = dismissReason;
            renderReports();
            updateStats();
            Utils.showNotification('報告已駁回', 'success');
        }
        
    } catch (error) {
        Utils.showNotification('駁回報告失敗，請稍後再試', 'error');
        console.error('駁回報告錯誤:', error);
    }
}

// 重新開啟報告
async function reopenReport(reportId) {
    if (confirm('確定要重新開啟這個報告嗎？')) {
        try {
            await apiService.reopenAdminReport(reportId);
            
            // 更新本地狀態
            const report = reports.find(r => r.id === reportId);
            if (report) {
                report.status = 'pending';
                delete report.resolved_at;
                delete report.resolved_by;
                delete report.dismissed_at;
                delete report.dismissed_by;
                delete report.dismiss_reason;
                renderReports();
                updateStats();
                Utils.showNotification('報告已重新開啟', 'success');
            }
            
        } catch (error) {
            Utils.showNotification('重新開啟報告失敗，請稍後再試', 'error');
            console.error('重新開啟報告錯誤:', error);
        }
    }
}

// 重新整理報告列表
function refreshReports() {
    Utils.showNotification('正在重新整理...', 'info');
    loadReports();
}

// 匯出報告資料
function exportReports() {
    try {
        const filteredReports = getFilteredReports();
        const data = {
            exportDate: new Date().toISOString(),
            filters: currentFilters,
            reports: filteredReports.map(report => ({
                id: report.id,
                type: report.type,
                reporter: report.reporter,
                reported: report.reported,
                status: report.status,
                reason: report.reason,
                description: report.description,
                submitted_at: report.submitted_at,
                resolved_at: report.resolved_at,
                dismissed_at: report.dismissed_at
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reports-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('報告資料已匯出', 'success');
    } catch (error) {
        Utils.showNotification('匯出失敗，請稍後再試', 'error');
        console.error('匯出報告資料錯誤:', error);
    }
}

// 取得篩選後的報告
function getFilteredReports() {
    let filtered = reports;
    
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filtered = filtered.filter(report => 
            report.reporter.toLowerCase().includes(searchTerm) ||
            report.reported.toLowerCase().includes(searchTerm) ||
            report.reason.toLowerCase().includes(searchTerm) ||
            report.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (currentFilters.type) {
        filtered = filtered.filter(report => report.type === currentFilters.type);
    }
    
    if (currentFilters.status) {
        filtered = filtered.filter(report => report.status === currentFilters.status);
    }
    
    if (currentFilters.date) {
        const today = new Date();
        const filterDate = new Date();
        
        switch (currentFilters.date) {
            case 'today':
                filterDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                filterDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                filterDate.setMonth(today.getMonth() - 1);
                break;
        }
        
        filtered = filtered.filter(report => {
            const submittedDate = new Date(report.submitted_at);
            return submittedDate >= filterDate;
        });
    }
    
    return filtered;
}

// 切換頁面
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    
    // 重新渲染報告列表
    renderReportTable();
    
    // 更新分頁按鈕狀態
    updatePaginationButtons();
    
    // 滾動到頁面頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 更新分頁按鈕狀態
function updatePaginationButtons() {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    
    // 上一頁按鈕
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-sm btn-outline-primary me-2';
    prevBtn.innerHTML = '<i class="bi bi-chevron-left"></i> 上一頁';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => changePage(currentPage - 1);
    paginationContainer.appendChild(prevBtn);
    
    // 頁碼按鈕
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'} me-1`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => changePage(i);
            paginationContainer.appendChild(pageBtn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const dots = document.createElement('span');
            dots.className = 'mx-2';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
    }
    
    // 下一頁按鈕
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-sm btn-outline-primary ms-2';
    nextBtn.innerHTML = '下一頁 <i class="bi bi-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => changePage(currentPage + 1);
    paginationContainer.appendChild(nextBtn);
}

// 返回上一頁
function goBack() {
    window.history.back();
}

// 全域函數，供 HTML 直接調用
window.viewReport = viewReport;
window.resolveReport = resolveReport;
window.dismissReport = dismissReport;
window.reopenReport = reopenReport;
window.refreshReports = refreshReports;
window.exportReports = exportReports;
window.changePage = changePage;
window.goBack = goBack; 