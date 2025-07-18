/**
 * 學生上傳作品 JavaScript
 * 包含步驟控制、檔案上傳、預覽等功能
 */

// 當前步驟
let currentStep = 1;
const totalSteps = 3;

// 上傳的檔案
let uploadedFiles = [];

// 作品資料
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
    // 檔案上傳
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    
    // 拖拽上傳
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', () => document.getElementById('fileInput').click());
    
    // 表單提交
    document.getElementById('uploadForm').addEventListener('submit', handleFormSubmit);
    
    // 上傳選項選擇
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function() {
            selectUploadOption(this);
        });
    });
    
    // 即時預覽
    document.getElementById('title').addEventListener('input', updatePreview);
    document.getElementById('description').addEventListener('input', updatePreview);
    document.getElementById('tags').addEventListener('input', updatePreview);
}

// 下一步
function nextStep() {
    if (currentStep < totalSteps) {
        if (validateCurrentStep()) {
            currentStep++;
            updateStepDisplay();
        }
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
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < currentStep) {
            step.classList.add('completed');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
        }
    });
    
    // 顯示對應的內容
    document.getElementById('step1Content').style.display = currentStep === 1 ? 'block' : 'none';
    document.getElementById('step2Content').style.display = currentStep === 2 ? 'block' : 'none';
    document.getElementById('step3Content').style.display = currentStep === 3 ? 'block' : 'none';
    
    // 更新按鈕
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    nextBtn.style.display = currentStep < totalSteps ? 'inline-flex' : 'none';
    submitBtn.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';
    
    // 更新按鈕文字
    if (currentStep === 1) {
        nextBtn.innerHTML = '下一步 <i class="fas fa-arrow-right"></i>';
    } else if (currentStep === 2) {
        nextBtn.innerHTML = '下一步 <i class="fas fa-arrow-right"></i>';
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

// 驗證步驟 1
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
    portfolioData.tags = document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    portfolioData.status = document.getElementById('status').value;
    
    return true;
}

// 驗證步驟 2
function validateStep2() {
    if (uploadedFiles.length === 0) {
        Utils.showNotification('請至少上傳一個檔案', 'error');
        return false;
    }
    
    portfolioData.files = uploadedFiles;
    return true;
}

// 驗證步驟 3
function validateStep3() {
    // 最後確認，可以添加額外的驗證邏輯
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
    e.currentTarget.classList.add('dragover');
}

// 處理拖拽離開
function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

// 處理檔案拖拽
function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
}

// 添加檔案
function addFiles(files) {
    files.forEach(file => {
        // 驗證檔案類型
        if (!validateFile(file)) {
            return;
        }
        
        // 檢查檔案大小
        if (file.size > 10 * 1024 * 1024) { // 10MB
            Utils.showNotification(`檔案 ${file.name} 超過 10MB 限制`, 'error');
            return;
        }
        
        // 檢查是否重複
        const existingFile = uploadedFiles.find(f => f.name === file.name);
        if (existingFile) {
            Utils.showNotification(`檔案 ${file.name} 已存在`, 'warning');
            return;
        }
        
        // 添加檔案
        uploadedFiles.push(file);
    });
    
    updateFilePreview();
}

// 驗證檔案
function validateFile(file) {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/zip',
        'application/x-rar-compressed',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (!allowedTypes.includes(file.type)) {
        Utils.showNotification(`不支援的檔案類型: ${file.name}`, 'error');
        return false;
    }
    
    return true;
}

// 更新檔案預覽
function updateFilePreview() {
    const previewContainer = document.getElementById('filePreview');
    const previewList = document.getElementById('previewList');
    
    if (uploadedFiles.length === 0) {
        previewContainer.classList.remove('show');
        return;
    }
    
    previewContainer.classList.add('show');
    
    previewList.innerHTML = uploadedFiles.map((file, index) => `
        <div class="preview-item">
            <div class="preview-icon">
                <i class="${getFileIcon(file.type)}"></i>
            </div>
            <div class="preview-info">
                <div class="preview-name">${file.name}</div>
                <div class="preview-size">${formatFileSize(file.size)}</div>
            </div>
            <button type="button" class="preview-remove" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// 移除檔案
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateFilePreview();
}

// 取得檔案圖示
function getFileIcon(type) {
    if (type.startsWith('image/')) {
        return 'fas fa-image';
    } else if (type === 'application/pdf') {
        return 'fas fa-file-pdf';
    } else if (type.includes('zip') || type.includes('rar')) {
        return 'fas fa-file-archive';
    } else if (type.includes('word')) {
        return 'fas fa-file-word';
    } else if (type.includes('powerpoint')) {
        return 'fas fa-file-powerpoint';
    } else {
        return 'fas fa-file';
    }
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
    // 移除其他選項的選中狀態
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    
    // 選中當前選項
    card.classList.add('selected');
    
    const type = card.dataset.type;
    
    // 根據選項類型調整檔案輸入
    const fileInput = document.getElementById('fileInput');
    switch (type) {
        case 'image':
            fileInput.accept = 'image/*';
            break;
        case 'document':
            fileInput.accept = '.pdf,.doc,.docx,.ppt,.pptx';
            break;
        case 'archive':
            fileInput.accept = '.zip,.rar';
            break;
        case 'link':
            // 顯示連結輸入框
            showLinkInput();
            break;
    }
}

// 顯示連結輸入
function showLinkInput() {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
        <i class="fas fa-link"></i>
        <h3>輸入作品連結</h3>
        <p>請輸入您的作品網址或影片連結</p>
        <div style="margin-top: var(--spacing-lg);">
            <input type="url" id="portfolioUrl" placeholder="https://example.com" style="width: 100%; padding: var(--spacing-md); border: 2px solid var(--gray-200); border-radius: var(--radius-lg); margin-bottom: var(--spacing-md);">
            <input type="url" id="portfolioGithub" placeholder="GitHub 連結 (選填)" style="width: 100%; padding: var(--spacing-md); border: 2px solid var(--gray-200); border-radius: var(--radius-lg);">
        </div>
    `;
}

// 更新預覽
function updatePreview() {
    if (currentStep === 3) {
        document.getElementById('previewTitle').textContent = portfolioData.title || '作品標題';
        document.getElementById('previewDescription').textContent = portfolioData.description || '作品描述';
        
        const tagsContainer = document.getElementById('previewTags');
        if (portfolioData.tags.length > 0) {
            tagsContainer.innerHTML = portfolioData.tags.map(tag => 
                `<span class="preview-tag">${tag}</span>`
            ).join('');
        } else {
            tagsContainer.innerHTML = '<span style="color: var(--gray-500);">無標籤</span>';
        }
        
        // 更新檔案預覽
        const previewFiles = document.getElementById('previewFiles');
        if (uploadedFiles.length > 0) {
            previewFiles.innerHTML = uploadedFiles.map(file => `
                <div class="preview-item">
                    <div class="preview-icon">
                        <i class="${getFileIcon(file.type)}"></i>
                    </div>
                    <div class="preview-info">
                        <div class="preview-name">${file.name}</div>
                        <div class="preview-size">${formatFileSize(file.size)}</div>
                    </div>
                </div>
            `).join('');
        } else {
            previewFiles.innerHTML = '<span style="color: var(--gray-500);">無檔案</span>';
        }
    }
}

// 處理表單提交
async function handleFormSubmit(e) {
    e.preventDefault();
    
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
        
        // 添加檔案
        uploadedFiles.forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });
        
        // TODO: 發送上傳請求到後端 API
        // const response = await fetch('/api/portfolios', {
        //     method: 'POST',
        //     body: formData
        // });
        
        // 模擬上傳成功
        setTimeout(() => {
            Utils.showNotification('作品上傳成功！', 'success');
            
            // 重置表單
            resetForm();
            
            // 跳轉到作品集頁面
            setTimeout(() => {
                window.location.href = 'portfolio.html';
            }, 1500);
        }, 2000);
        
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
    uploadArea.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <h3>拖拽檔案到這裡或點擊上傳</h3>
        <p>支援 JPG, PNG, GIF, PDF, ZIP 等格式，單檔最大 10MB</p>
        <button type="button" class="upload-btn" onclick="document.getElementById('fileInput').click()">
            <i class="fas fa-upload"></i>
            選擇檔案
        </button>
        <input type="file" id="fileInput" multiple accept="image/*,.pdf,.zip,.rar" style="display: none;">
    `;
    
    // 重新綁定事件
    initEventListeners();
}

// 上傳進度處理
function handleUploadProgress(progress) {
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

// 全域函數供 HTML 使用
window.nextStep = nextStep;
window.previousStep = previousStep;
window.removeFile = removeFile; 