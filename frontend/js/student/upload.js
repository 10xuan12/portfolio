/*** 
 * 學生作品上傳 JavaScript
 * 包含檔案上傳、表單驗證、預覽功能等
 */

// 上傳狀態
let currentStep = 1;
let uploadedFiles = [];
let portfolioData = {
    title: '',
    category: '',
    description: '',
    tags: [],
    status: 'draft',
    files: [],
    url: '',
    github: ''
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    updateStepDisplay();
});

// 初始化事件監聽器
function initEventListeners() {
    // 檔案上傳相關
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }
    
    // 表單提交
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFormSubmit);
    }
    
    // 標籤輸入
    const tagInput = document.getElementById('tagInput');
    if (tagInput) {
        tagInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });
    }
}

// 下一步
function nextStep() {
    if (validateCurrentStep()) {
        currentStep++;
        updateStepDisplay();
    }
}

// 上一步
function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

// 更新步驟顯示
function updateStepDisplay() {
    // 更新步驟指示器
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        if (index + 1 <= currentStep) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
    
    // 更新步驟內容
    document.querySelectorAll('.step-content').forEach((content, index) => {
        if (index + 1 === currentStep) {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    });
    
    // 更新按鈕狀態
    const prevBtn = document.querySelector('.btn-outline');
    const nextBtn = document.querySelector('.btn-primary');
    
    if (prevBtn) {
        prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-block';
    }
    
    if (nextBtn) {
        if (currentStep === 3) {
            nextBtn.textContent = '上傳作品';
            nextBtn.onclick = handleFormSubmit;
        } else {
            nextBtn.textContent = '下一步';
            nextBtn.onclick = nextStep;
        }
    }
}

// 驗證當前步驟
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        default:
            return true;
    }
}

// 驗證步驟1 - 基本資訊
function validateStep1() {
    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value.trim();
    
    if (!title) {
        Utils.showNotification('請輸入作品標題', 'error');
        return false;
    }
    
    if (!category) {
        Utils.showNotification('請選擇作品分類', 'error');
        return false;
    }
    
    if (!description) {
        Utils.showNotification('請輸入作品描述', 'error');
        return false;
    }
    
    // 儲存資料
    portfolioData.title = title;
    portfolioData.category = category;
    portfolioData.description = description;
    
    return true;
}

// 驗證步驟2 - 檔案上傳
function validateStep2() {
    if (uploadedFiles.length === 0) {
        Utils.showNotification('請至少上傳一個檔案', 'error');
        return false;
    }
    
    return true;
}

// 驗證步驟3 - 詳細資訊
function validateStep3() {
    // 步驟3的驗證是可選的，主要是標籤和連結
    const tags = document.querySelectorAll('.tag-item');
    portfolioData.tags = Array.from(tags).map(tag => tag.textContent.replace('×', '').trim());
    
    const url = document.getElementById('url').value.trim();
    const github = document.getElementById('github').value.trim();
    
    portfolioData.url = url;
    portfolioData.github = github;
    
    return true;
}

// 處理檔案選擇
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

// 處理拖拽懸停
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

// 處理拖拽離開
function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
}

// 處理檔案拖拽
function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
}

// 添加檔案
function addFiles(files) {
    files.forEach(file => {
        if (validateFile(file)) {
            uploadedFiles.push(file);
        }
    });
    
    updateFilePreview();
}

// 驗證檔案
function validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/zip', 'application/x-rar-compressed',
        'text/plain', 'text/html', 'text/css', 'text/javascript',
        'application/json', 'application/xml'
    ];
    
    if (file.size > maxSize) {
        Utils.showNotification(`檔案 ${file.name} 超過 10MB 限制`, 'error');
        return false;
    }
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|gif|webp|pdf|zip|rar|txt|html|css|js|json|xml)$/i)) {
        Utils.showNotification(`檔案 ${file.name} 格式不支援`, 'error');
        return false;
    }
    
    return true;
}

// 更新檔案預覽
function updateFilePreview() {
    const previewContainer = document.getElementById('filePreview');
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';
    
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-icon">
                <i class="fas ${getFileIcon(file.type)}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <button type="button" class="remove-file" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        previewContainer.appendChild(fileItem);
    });
}

// 移除檔案
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateFilePreview();
}

// 取得檔案圖示
function getFileIcon(type) {
    const iconMap = {
        'image/jpeg': 'fa-image',
        'image/png': 'fa-image',
        'image/gif': 'fa-image',
        'image/webp': 'fa-image',
        'application/pdf': 'fa-file-pdf',
        'application/zip': 'fa-file-archive',
        'application/x-rar-compressed': 'fa-file-archive',
        'text/plain': 'fa-file-alt',
        'text/html': 'fa-file-code',
        'text/css': 'fa-file-code',
        'text/javascript': 'fa-file-code',
        'application/json': 'fa-file-code',
        'application/xml': 'fa-file-code'
    };
    
    return iconMap[type] || 'fa-file';
}

// 格式化檔案大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 選擇上傳選項
function selectUploadOption(card) {
    // 移除所有選中的狀態
    document.querySelectorAll('.upload-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 添加選中狀態
    card.classList.add('selected');
    
    // 根據選擇顯示對應的輸入區域
    const option = card.dataset.option;
    if (option === 'link') {
        showLinkInput();
    }
}

// 顯示連結輸入
function showLinkInput() {
    const linkInput = document.getElementById('linkInput');
    if (linkInput) {
        linkInput.style.display = 'block';
    }
}

// 更新預覽
function updatePreview() {
    const previewContainer = document.getElementById('previewContainer');
    if (!previewContainer) return;
    
    const title = document.getElementById('title').value || '作品標題';
    const description = document.getElementById('description').value || '作品描述';
    const category = document.getElementById('category').value || 'web';
    
    previewContainer.innerHTML = `
        <div class="preview-card">
            <div class="preview-header">
                <h3>${title}</h3>
                <span class="category-badge">${category}</span>
            </div>
            <div class="preview-content">
                <p>${description}</p>
                <div class="preview-files">
                    <h4>上傳的檔案 (${uploadedFiles.length})</h4>
                    <ul>
                        ${uploadedFiles.map(file => `<li><i class="fas ${getFileIcon(file.type)}"></i> ${file.name}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// 處理表單提交
async function handleFormSubmit(e) {
    if (e) {
        e.preventDefault();
    }
    
    if (!validateCurrentStep()) {
        return;
    }
    
    try {
        // 顯示上傳中狀態
        Utils.showNotification('正在上傳作品...', 'info');
        
        // 準備上傳資料
        const formData = new FormData();
        formData.append('title', portfolioData.title);
        formData.append('category', portfolioData.category);
        formData.append('description', portfolioData.description);
        formData.append('tags', JSON.stringify(portfolioData.tags));
        formData.append('status', portfolioData.status);
        formData.append('url', portfolioData.url);
        formData.append('github', portfolioData.github);
        
        // 添加檔案
        uploadedFiles.forEach((file) => {
            formData.append('files[]', file);
        });
        
        // 使用API服務上傳
        const response = await apiService.createPortfolio(formData);
        
        if (response.success) {
            Utils.showNotification('作品上傳成功！', 'success');
            
            // 重置表單
            resetForm();
            
            // 跳轉到作品集頁面
            setTimeout(() => {
                window.location.href = 'portfolio.html';
            }, 1500);
        } else {
            throw new Error(response.message || '上傳失敗');
        }
        
    } catch (error) {
        Utils.showNotification('上傳失敗，請稍後再試', 'error');
        console.error('上傳作品錯誤:', error);
    }
}

// 重置表單
function resetForm() {
    // 重置步驟
    currentStep = 1;
    updateStepDisplay();
    
    // 清空檔案
    uploadedFiles = [];
    updateFilePreview();
    
    // 重置表單資料
    document.getElementById('uploadForm').reset();
    portfolioData = {
        title: '',
        category: '',
        description: '',
        tags: [],
        status: 'draft',
        files: [],
        url: '',
        github: ''
    };
    
    // 重置上傳區域
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <h3>拖拽檔案到這裡或點擊上傳</h3>
            <p>支援 JPG, PNG, GIF, PDF, ZIP 等格式，單檔最大 10MB</p>
            <button type="button" class="upload-btn" onclick="document.getElementById('fileInput').click()">
                <i class="fas fa-upload"></i>
                選擇檔案
            </button>
            <input type="file" id="fileInput" multiple accept="image/*,.pdf,.zip,.rar,.txt,.html,.css,.js,.json,.xml" style="display: none;">
        `;
        
        // 重新綁定事件
        initEventListeners();
    }
}

// 上傳進度處理
function handleUploadProgress(progress) {
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

// 添加標籤
function addTag() {
    const tagInput = document.getElementById('tagInput');
    const tag = tagInput.value.trim();
    
    if (tag && !portfolioData.tags.includes(tag)) {
        portfolioData.tags.push(tag);
        renderTags();
        tagInput.value = '';
    }
}

// 移除標籤
function removeTag(index) {
    portfolioData.tags.splice(index, 1);
    renderTags();
}

// 渲染標籤
function renderTags() {
    const tagsContainer = document.getElementById('tagsContainer');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = portfolioData.tags.map((tag, index) => `
        <span class="tag-item">
            ${tag}
            <button type="button" onclick="removeTag(${index})">×</button>
        </span>
    `).join('');
}

// 全域函數供 HTML 使用
window.nextStep = nextStep;
window.previousStep = previousStep;
window.removeFile = removeFile;
window.selectUploadOption = selectUploadOption;
window.addTag = addTag;
window.removeTag = removeTag; 