/**
 * 管理員使用者管理 JavaScript
 * 包含使用者搜尋、篩選、批量操作、狀態管理等功能
 */

// TODO: 從後端 API 載入使用者資料
let users = [
    {
        id: 1,
        name: '張小明',
        email: 'zhang@example.com',
        type: 'student',
        department: '資訊管理學系',
        status: 'active',
        stats: {
            portfolios: 8,
            views: 1234,
            likes: 89
        },
        registered_at: '2024-01-15',
        last_login: '2024-01-20 14:30'
    },
    {
        id: 2,
        name: '台灣微軟',
        email: 'hr@microsoft.com.tw',
        type: 'enterprise',
        department: '科技公司',
        status: 'active',
        stats: {
            jobs: 5,
            applications: 23,
            views: 567
        },
        registered_at: '2024-01-10',
        last_login: '2024-01-20 16:45'
    },
    {
        id: 3,
        name: '李大明',
        email: 'li@example.com',
        type: 'student',
        department: '資訊工程學系',
        status: 'pending',
        stats: {
            portfolios: 6,
            views: 890,
            likes: 67
        },
        registered_at: '2024-01-18',
        last_login: '2024-01-19 09:15'
    },
    {
        id: 4,
        name: '王小美',
        email: 'wang@example.com',
        type: 'student',
        department: '設計學系',
        status: 'suspended',
        stats: {
            portfolios: 4,
            views: 456,
            likes: 34
        },
        registered_at: '2024-01-12',
        last_login: '2024-01-15 11:20'
    }
];

// 當前篩選條件
let currentFilters = {
    search: '',
    type: '',
    status: '',
    department: ''
};

// 當前頁面
let currentPage = 1;
const itemsPerPage = 10;

// 選中的使用者
let selectedUsers = new Set();

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    renderUsers();
    initEventListeners();
});

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
    
    // 科系篩選
    document.getElementById('departmentFilter').addEventListener('change', function() {
        currentFilters.department = this.value;
        applyFilters();
    });
}

// 渲染使用者列表
function renderUsers(filteredUsers = null) {
    const tbody = document.getElementById('usersTableBody');
    const usersToRender = filteredUsers || users;
    
    if (usersToRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>沒有找到符合條件的使用者</h3>
                        <p>請嘗試調整搜尋條件或篩選器</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = usersToRender.map(user => `
        <tr>
            <td>
                <input type="checkbox" class="user-select" value="${user.id}" onchange="toggleUserSelection(${user.id})">
            </td>
            <td>
                <div class="user-info">
                    <div class="user-avatar avatar-${user.type}">
                        <i class="fas ${user.type === 'student' ? 'fa-user-graduate' : user.type === 'enterprise' ? 'fa-building' : 'fa-user-shield'}"></i>
                    </div>
                    <div class="user-details">
                        <h4>${user.name}</h4>
                        <p>${user.email}</p>
                        <p>${user.department}</p>
                    </div>
                </div>
            </td>
            <td>${getUserTypeText(user.type)}</td>
            <td>
                <span class="user-status status-${user.status}">${getUserStatusText(user.status)}</span>
            </td>
            <td>
                <div class="user-stats">
                    ${user.type === 'student' ? `
                        <span>${user.stats.portfolios} 作品</span>
                        <span>${user.stats.views} 瀏覽</span>
                        <span>${user.stats.likes} 讚</span>
                    ` : `
                        <span>${user.stats.jobs} 職缺</span>
                        <span>${user.stats.applications} 申請</span>
                        <span>${user.stats.views} 瀏覽</span>
                    `}
                </div>
            </td>
            <td>${user.registered_at}</td>
            <td>${user.last_login}</td>
            <td>
                <div class="user-actions">
                    <button class="action-btn" onclick="viewUser(${user.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.status === 'pending' ? `
                        <button class="action-btn" onclick="approveUser(${user.id})">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="action-btn" onclick="rejectUser(${user.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : `
                        <button class="action-btn" onclick="toggleSuspendUser(${user.id})" title="${user.status === 'suspended' ? '恢復使用者' : '暫停使用者'}">
                            <i class="fas ${user.status === 'suspended' ? 'fa-play' : 'fa-pause'}"></i>
                        </button>
                    `}
                    <button class="action-btn danger" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 取得使用者類型文字
function getUserTypeText(type) {
    const typeMap = {
        'student': '學生',
        'enterprise': '企業',
        'admin': '管理員'
    };
    return typeMap[type] || type;
}

// 取得使用者狀態文字
function getUserStatusText(status) {
    const statusMap = {
        'active': '啟用',
        'inactive': '停用',
        'suspended': '暫停',
        'pending': '待審核'
    };
    return statusMap[status] || status;
}

// 應用篩選器
function applyFilters() {
    let filteredUsers = users;
    
    // 搜尋篩選
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.department.toLowerCase().includes(searchTerm)
        );
    }
    
    // 類型篩選
    if (currentFilters.type) {
        filteredUsers = filteredUsers.filter(user => user.type === currentFilters.type);
    }
    
    // 狀態篩選
    if (currentFilters.status) {
        filteredUsers = filteredUsers.filter(user => user.status === currentFilters.status);
    }
    
    // 科系篩選
    if (currentFilters.department) {
        filteredUsers = filteredUsers.filter(user => user.department === currentFilters.department);
    }
    
    renderUsers(filteredUsers);
    updateResultsCount(filteredUsers.length);
}

// 更新結果數量
function updateResultsCount(count) {
    const title = document.querySelector('.users-title');
    if (title) {
        title.textContent = `使用者管理 (${count} 個結果)`;
    }
}

// 切換使用者選擇
function toggleUserSelection(userId) {
    if (selectedUsers.has(userId)) {
        selectedUsers.delete(userId);
    } else {
        selectedUsers.add(userId);
    }
    
    updateBulkActions();
}

// 切換全選
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllHeader');
    const userCheckboxes = document.querySelectorAll('.user-select');
    
    if (selectAllCheckbox.checked) {
        userCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
            selectedUsers.add(parseInt(checkbox.value));
        });
    } else {
        userCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
            selectedUsers.delete(parseInt(checkbox.value));
        });
    }
    
    updateBulkActions();
}

// 更新批量操作
function updateBulkActions() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedUsers.size > 0) {
        bulkActions.style.display = 'block';
        selectedCount.textContent = selectedUsers.size;
    } else {
        bulkActions.style.display = 'none';
    }
}

// 切換批量操作顯示
function toggleBulkActions() {
    const bulkActions = document.getElementById('bulkActions');
    if (bulkActions.style.display === 'none') {
        bulkActions.style.display = 'block';
    } else {
        bulkActions.style.display = 'none';
    }
}

// 查看使用者
function viewUser(userId) {
    window.location.href = `user-detail.html?id=${userId}`;
}

// 編輯使用者
function editUser(userId) {
    window.location.href = `user-edit.html?id=${userId}`;
}

// 核准使用者
async function approveUser(userId) {
    try {
        // TODO: 發送核准請求到後端 API
        // await fetch(`/api/admin/users/${userId}/approve`, {
        //     method: 'PUT'
        // });
        
        // 更新本地狀態
        const user = users.find(u => u.id === userId);
        if (user) {
            user.status = 'active';
            renderUsers();
            Utils.showNotification('使用者已核准', 'success');
        }
        
    } catch (error) {
        Utils.showNotification('操作失敗，請稍後再試', 'error');
        console.error('核准使用者錯誤:', error);
    }
}

// 拒絕使用者
async function rejectUser(userId) {
    if (confirm('確定要拒絕這個使用者嗎？')) {
        try {
            // TODO: 發送拒絕請求到後端 API
            // await fetch(`/api/admin/users/${userId}/reject`, {
            //     method: 'PUT'
            // });
            
            // 更新本地狀態
            const user = users.find(u => u.id === userId);
            if (user) {
                user.status = 'inactive';
                renderUsers();
                Utils.showNotification('使用者已拒絕', 'success');
            }
            
        } catch (error) {
            Utils.showNotification('操作失敗，請稍後再試', 'error');
            console.error('拒絕使用者錯誤:', error);
        }
    }
}

// 暫停/恢復 使用者（切換）
async function toggleSuspendUser(userId) {
    try {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        if (user.status === 'suspended') {
            if (!confirm('確定要恢復這個使用者並設定為啟用嗎？')) return;
            // TODO: 呼叫後端恢復 API
            // await fetch(`/api/admin/users/${userId}/resume`, { method: 'PUT' });
            user.status = 'active';
            renderUsers();
            Utils.showNotification('使用者已恢復並啟用', 'success');
        } else {
            if (!confirm('確定要暫停這個使用者嗎？')) return;
            // TODO: 呼叫後端暫停 API
            // await fetch(`/api/admin/users/${userId}/suspend`, { method: 'PUT' });
            user.status = 'suspended';
            renderUsers();
            Utils.showNotification('使用者已暫停', 'success');
        }
    } catch (error) {
        Utils.showNotification('操作失敗，請稍後再試', 'error');
        console.error('切換暫停/恢復錯誤:', error);
    }
}

// 暫停使用者
async function suspendUser(userId) {
    if (confirm('確定要暫停這個使用者嗎？')) {
        try {
            // TODO: 發送暫停請求到後端 API
            // await fetch(`/api/admin/users/${userId}/suspend`, {
            //     method: 'PUT'
            // });
            
            // 更新本地狀態
            const user = users.find(u => u.id === userId);
            if (user) {
                user.status = 'suspended';
                renderUsers();
                Utils.showNotification('使用者已暫停', 'success');
            }
            
        } catch (error) {
            Utils.showNotification('操作失敗，請稍後再試', 'error');
            console.error('暫停使用者錯誤:', error);
        }
    }
}

// 刪除使用者
async function deleteUser(userId) {
    if (confirm('確定要刪除這個使用者嗎？此操作無法復原。')) {
        try {
            // TODO: 發送刪除請求到後端 API
            // await fetch(`/api/admin/users/${userId}`, {
            //     method: 'DELETE'
            // });
            
            // 從本地列表中移除
            users = users.filter(u => u.id !== userId);
            renderUsers();
            Utils.showNotification('使用者已刪除', 'success');
            
        } catch (error) {
            Utils.showNotification('刪除失敗，請稍後再試', 'error');
            console.error('刪除使用者錯誤:', error);
        }
    }
}

// 批量啟用
async function bulkActivate() {
    if (selectedUsers.size === 0) {
        Utils.showNotification('請先選擇使用者', 'warning');
        return;
    }
    
    if (confirm(`確定要啟用選中的 ${selectedUsers.size} 個使用者嗎？`)) {
        try {
            // TODO: 發送批量啟用請求到後端 API
            // await fetch('/api/admin/users/bulk-activate', {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(Array.from(selectedUsers))
            // });
            
            // 更新本地狀態
            users.forEach(user => {
                if (selectedUsers.has(user.id)) {
                    user.status = 'active';
                }
            });
            
            selectedUsers.clear();
            renderUsers();
            updateBulkActions();
            Utils.showNotification('選中的使用者已啟用', 'success');
            
        } catch (error) {
            Utils.showNotification('操作失敗，請稍後再試', 'error');
            console.error('批量啟用錯誤:', error);
        }
    }
}

// 批量停用
async function bulkDeactivate() {
    if (selectedUsers.size === 0) {
        Utils.showNotification('請先選擇使用者', 'warning');
        return;
    }
    
    if (confirm(`確定要停用選中的 ${selectedUsers.size} 個使用者嗎？`)) {
        try {
            // TODO: 發送批量停用請求到後端 API
            // await fetch('/api/admin/users/bulk-deactivate', {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(Array.from(selectedUsers))
            // });
            
            // 更新本地狀態
            users.forEach(user => {
                if (selectedUsers.has(user.id)) {
                    user.status = 'inactive';
                }
            });
            
            selectedUsers.clear();
            renderUsers();
            updateBulkActions();
            Utils.showNotification('選中的使用者已停用', 'success');
            
        } catch (error) {
            Utils.showNotification('操作失敗，請稍後再試', 'error');
            console.error('批量停用錯誤:', error);
        }
    }
}

// 批量刪除
async function bulkDelete() {
    if (selectedUsers.size === 0) {
        Utils.showNotification('請先選擇使用者', 'warning');
        return;
    }
    
    if (confirm(`確定要刪除選中的 ${selectedUsers.size} 個使用者嗎？此操作無法復原。`)) {
        try {
            // TODO: 發送批量刪除請求到後端 API
            // await fetch('/api/admin/users/bulk-delete', {
            //     method: 'DELETE',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(Array.from(selectedUsers))
            // });
            
            // 從本地列表中移除
            users = users.filter(user => !selectedUsers.has(user.id));
            
            selectedUsers.clear();
            renderUsers();
            updateBulkActions();
            Utils.showNotification('選中的使用者已刪除', 'success');
            
        } catch (error) {
            Utils.showNotification('刪除失敗，請稍後再試', 'error');
            console.error('批量刪除錯誤:', error);
        }
    }
}

// 新增使用者
function createUser() {
    window.location.href = 'user-create.html';
}

// 重新整理使用者列表
function refreshUsers() {
    // TODO: 從後端 API 重新載入使用者資料
    Utils.showNotification('正在重新整理...', 'info');
    
    setTimeout(() => {
        applyFilters();
        Utils.showNotification('使用者列表已更新', 'success');
    }, 1000);
}

// 匯出使用者資料
function exportUsers() {
    try {
        const filteredUsers = getFilteredUsers();
        const data = {
            exportDate: new Date().toISOString(),
            filters: currentFilters,
            users: filteredUsers.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                type: user.type,
                department: user.department,
                status: user.status,
                stats: user.stats,
                registered_at: user.registered_at,
                last_login: user.last_login
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('使用者資料已匯出', 'success');
    } catch (error) {
        Utils.showNotification('匯出失敗，請稍後再試', 'error');
        console.error('匯出使用者資料錯誤:', error);
    }
}

// 取得篩選後的使用者
function getFilteredUsers() {
    let filtered = users;
    
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filtered = filtered.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.department.toLowerCase().includes(searchTerm)
        );
    }
    
    if (currentFilters.type) {
        filtered = filtered.filter(user => user.type === currentFilters.type);
    }
    
    if (currentFilters.status) {
        filtered = filtered.filter(user => user.status === currentFilters.status);
    }
    
    if (currentFilters.department) {
        filtered = filtered.filter(user => user.department === currentFilters.department);
    }
    
    return filtered;
}

// 切換頁面
function changePage(page) {
    currentPage = page;
    // TODO: 實作分頁功能
    Utils.showNotification(`切換到第 ${page} 頁`, 'info');
}

// 返回上一頁
function goBack() {
    window.history.back();
}

// 全域函數，供 HTML 直接調用
window.toggleUserSelection = toggleUserSelection;
window.toggleSelectAll = toggleSelectAll;
window.toggleBulkActions = toggleBulkActions;
window.viewUser = viewUser;
window.editUser = editUser;
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.suspendUser = suspendUser;
window.toggleSuspendUser = toggleSuspendUser;
window.deleteUser = deleteUser;
window.bulkActivate = bulkActivate;
window.bulkDeactivate = bulkDeactivate;
window.bulkDelete = bulkDelete;
window.createUser = createUser;
window.refreshUsers = refreshUsers;
window.exportUsers = exportUsers;
window.changePage = changePage;
window.goBack = goBack; 