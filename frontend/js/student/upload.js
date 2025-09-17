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
function initializeUpload() {
    console.log('開始初始化上傳頁面...');
    
    // 檢查DOM元素
    const step1Content = document.getElementById('step1Content');
    const titleInput = document.getElementById('title');
    const categorySelect = document.getElementById('categoryFilter');
    const descriptionTextarea = document.getElementById('description');
    
    console.log('DOM元素檢查:');
    console.log('- step1Content:', step1Content);
    console.log('- titleInput:', titleInput);
    console.log('- categorySelect:', categorySelect);
    console.log('- descriptionTextarea:', descriptionTextarea);
    
    if (step1Content) {
        console.log('step1Content 樣式:', {
            display: step1Content.style.display,
            visibility: step1Content.style.visibility,
            opacity: step1Content.style.opacity,
            computedDisplay: window.getComputedStyle(step1Content).display
        });
        
        // 強制設定第一步驟為顯示
        step1Content.style.display = 'block';
        step1Content.style.visibility = 'visible';
        step1Content.style.opacity = '1';
        
        console.log('設定後 step1Content 樣式:', {
            display: step1Content.style.display,
            visibility: step1Content.style.visibility,
            opacity: step1Content.style.opacity
        });
    }
    
    initEventListeners();

    // 動態載入學群分類
    loadCategories();
    
    // 設定當前步驟為1，但不調用updateStepDisplay避免重複設定
    currentStep = 1;
    
    // 只更新步驟指示器，不更新內容顯示
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    console.log('初始化完成');
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeUpload();
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
    
    // 初始化工具提示控制（暫時禁用以測試）
    // initTooltipControl();
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
    console.log('updateStepDisplay 被調用，當前步驟:', currentStep);
    
    // 更新步驟指示器
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    // 更新步驟內容
    const stepContents = [
        document.getElementById('step1Content'),
        document.getElementById('step2Content'),
        document.getElementById('step3Content')
    ];
    
    stepContents.forEach((content, index) => {
        if (content) {
            if (index + 1 === currentStep) {
                console.log(`顯示步驟 ${index + 1} 內容`);
                content.style.display = 'block';
            } else {
                console.log(`隱藏步驟 ${index + 1} 內容`);
                content.style.display = 'none';
            }
        }
    });
    
    // 更新按鈕狀態
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) {
        prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
    }
    
    if (nextBtn) {
        if (currentStep === 3) {
            nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'inline-flex';
        } else {
            nextBtn.style.display = 'inline-flex';
            if (submitBtn) submitBtn.style.display = 'none';
        }
    }
}

// 顯示指定步驟
function showStep(step) {
    currentStep = step;
    updateStepDisplay();
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
    const titleElement = document.getElementById('title');
    const title = titleElement ? titleElement.value.trim() : '';
    
    const categorySelect = document.getElementById('categoryFilter') || document.getElementById('category');
    const category = categorySelect ? categorySelect.value : '';
    
    const descriptionElement = document.getElementById('description');
    const description = descriptionElement ? descriptionElement.value.trim() : '';
    
    if (!title) {
        Utils.showNotification('請輸入作品標題', 'error');
        return false;
    }
    
    if (!category) {
        Utils.showNotification('請選擇作品學群分類', 'error');
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
    const fileInput = document.getElementById('fileInput');
    const files = fileInput ? Array.from(fileInput.files) : [];
    
    if (files.length === 0) {
        Utils.showNotification('請至少上傳一個檔案', 'error');
        return false;
    }
    
    // 更新上傳檔案列表
    uploadedFiles = files;
    
    return true;
}

// 驗證步驟3 - 詳細資訊
function validateStep3() {
    // 步驟3的驗證是可選的，主要是標籤和連結
    const tagsInput = document.getElementById('tags');
    if (tagsInput) {
        const tagsText = tagsInput.value.trim();
        portfolioData.tags = tagsText ? tagsText.split(',').map(tag => tag.trim()) : [];
    }
    
    const githubUrl = document.getElementById('githubUrl');
    if (githubUrl) {
        portfolioData.github = githubUrl.value.trim();
    }
    
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
    const previewList = document.getElementById('previewList');
    if (!previewList) return;
    
    previewList.innerHTML = '';
    
    uploadedFiles.forEach((file, index) => {
        const previewItem = createFilePreview(file, index);
        previewList.appendChild(previewItem);
    });
}

// 建立檔案預覽項目
function createFilePreview(file, index) {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    
    const fileType = getFileType(file);
    const icon = getFileIcon(fileType);
    
    previewItem.innerHTML = `
        <div class="preview-icon">
            <i class="${icon}"></i>
        </div>
        <div class="preview-info">
            <div class="preview-name">${file.name}</div>
            <div class="preview-size">${formatFileSize(file.size)}</div>
            <div class="preview-type">${fileType}</div>
        </div>
        <div class="preview-actions">
            <button type="button" class="btn-remove" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    return previewItem;
}

// 取得檔案類型
function getFileType(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'webm'];
    const audioTypes = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
    const model3dTypes = ['obj', 'stl', 'fbx', 'glb', 'gltf'];
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    
    if (videoTypes.includes(extension)) return '影片';
    if (audioTypes.includes(extension)) return '音頻';
    if (model3dTypes.includes(extension)) return '3D模型';
    if (imageTypes.includes(extension)) return '圖片';
    if (extension === 'pdf') return 'PDF文件';
    if (['zip', 'rar', '7z'].includes(extension)) return '壓縮檔';
    return '文件';
}

// 取得檔案圖示
function getFileIcon(fileType) {
    const iconMap = {
        '影片': 'fas fa-video',
        '音頻': 'fas fa-music',
        '3D模型': 'fas fa-cube',
        '圖片': 'fas fa-image',
        'PDF文件': 'fas fa-file-pdf',
        '壓縮檔': 'fas fa-file-archive',
        '文件': 'fas fa-file'
    };
    return iconMap[fileType] || 'fas fa-file';
}

// 移除檔案
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    
    // 更新檔案輸入框
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        const dt = new DataTransfer();
        uploadedFiles.forEach(file => dt.items.add(file));
        fileInput.files = dt.files;
    }
    
    updateFilePreview();
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
    document.querySelectorAll('.option-card').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 添加選中狀態
    card.classList.add('selected');
    
    // 根據選擇顯示對應的輸入區域
    const type = card.dataset.type;
    if (type === 'github') {
        showGithubIntegration();
    } else {
        hideGithubIntegration();
    }
}

// GitHub 整合功能
function showGithubIntegration() {
    const githubIntegration = document.getElementById('githubIntegration');
    if (githubIntegration) {
        githubIntegration.style.display = 'block';
    }
}

function hideGithubIntegration() {
    const githubIntegration = document.getElementById('githubIntegration');
    if (githubIntegration) {
        githubIntegration.style.display = 'none';
    }
}

async function fetchGithubInfo() {
    const url = document.getElementById('githubUrl').value;
    const branch = document.getElementById('githubBranch').value;
    
    if (!url) {
        Utils.showNotification('請輸入GitHub專案URL', 'error');
        return;
    }
    
    try {
        // 這裡應該調用GitHub API，目前使用模擬資料
        const repoInfo = await mockGithubAPI(url, branch);
        displayGithubInfo(repoInfo);
    } catch (error) {
        console.error('GitHub API 錯誤:', error);
        Utils.showNotification('無法獲取GitHub專案資訊，請檢查URL是否正確', 'error');
    }
}

async function mockGithubAPI(url, branch) {
    // 模擬GitHub API回應
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const repoName = url.split('/').pop();
    const username = url.split('/')[3];
    
    return {
        name: repoName,
        full_name: `${username}/${repoName}`,
        description: '這是一個示例GitHub專案描述',
        language: 'JavaScript',
        stars: Math.floor(Math.random() * 1000),
        forks: Math.floor(Math.random() * 100),
        branch: branch,
        last_commit: new Date().toISOString(),
        readme: '# 專案說明\n\n這是一個示例專案的README檔案。'
    };
}

function displayGithubInfo(repoInfo) {
    const description = document.getElementById('githubDescription');
    if (description) {
        description.value = `專案名稱: ${repoInfo.name}\n語言: ${repoInfo.language}\n星數: ${repoInfo.stars}\n分支: ${repoInfo.branch}\n\n${repoInfo.description}`;
    }
}

// 更新預覽
function updatePreview() {
    const previewTitle = document.getElementById('previewTitle');
    const previewDescription = document.getElementById('previewDescription');
    const previewTags = document.getElementById('previewTags');
    const previewFiles = document.getElementById('previewFiles');
    
    if (previewTitle) {
        previewTitle.textContent = portfolioData.title || '作品標題';
    }
    
    if (previewDescription) {
        previewDescription.textContent = portfolioData.description || '作品描述';
    }
    
    if (previewTags) {
        previewTags.innerHTML = portfolioData.tags.map(tag => 
            `<span class="tag">${tag}</span>`
        ).join('');
    }
    
    if (previewFiles) {
        previewFiles.innerHTML = uploadedFiles.map(file => 
            `<div class="file-item">
                <i class="fas ${getFileIcon(getFileType(file))}"></i>
                <span>${file.name}</span>
            </div>`
        ).join('');
    }
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
        showUploadProgress(true);
        Utils.showNotification('正在上傳作品...', 'info');
        
        // 準備上傳資料
        const formData = new FormData();
        formData.append('action', 'create');
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
        const response = await window.apiService.createPortfolio(formData);
        
        if (response.success) {
            showUploadProgress(false);
            Utils.showNotification('作品上傳成功！', 'success');
            
            // 添加成功動畫
            document.querySelector('.upload-content').classList.add('success-animation');
            
            // 重置表單
            setTimeout(() => {
                resetForm();
                document.querySelector('.upload-content').classList.remove('success-animation');
            }, 2000);
            
            // 跳轉到作品集頁面
            setTimeout(() => {
                window.location.href = 'portfolio.html';
            }, 3000);
        } else {
            throw new Error(response.message || '上傳失敗');
        }
        
    } catch (error) {
        showUploadProgress(false);
        Utils.showNotification('上傳失敗，請稍後再試', 'error');
        console.error('上傳作品錯誤:', error);
        
        // 添加錯誤動畫
        document.querySelector('.upload-content').classList.add('error-shake');
        setTimeout(() => {
            document.querySelector('.upload-content').classList.remove('error-shake');
        }, 500);
    }
}

// 顯示/隱藏上傳進度
function showUploadProgress(show) {
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    
    if (show) {
        progressBar.style.display = 'block';
        progressFill.style.width = '0%';
        
        // 模擬進度
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
            
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 200);
        
        // 儲存 interval ID 以便後續清除
        window.uploadProgressInterval = interval;
    } else {
        if (window.uploadProgressInterval) {
            clearInterval(window.uploadProgressInterval);
        }
        progressFill.style.width = '100%';
        setTimeout(() => {
            progressBar.style.display = 'none';
        }, 1000);
    }
}

// 重置表單
function resetForm() {
    // 重置步驟
    currentStep = 1;
    showStep(1);
    
    // 清空檔案
    uploadedFiles = [];
    updateFilePreview();
    
    // 重置表單資料
    const form = document.getElementById('uploadForm');
    if (form) {
        form.reset();
    }
    
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
    
    // 隱藏 GitHub 整合
    hideGithubIntegration();
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
window.showGithubIntegration = showGithubIntegration;
window.hideGithubIntegration = hideGithubIntegration;
window.fetchGithubInfo = fetchGithubInfo;
window.initializeUpload = initializeUpload;
window.showUploadProgress = showUploadProgress; 

// 由後端載入 categories 並填入下拉
async function loadCategories() {
    try {
        const svc = window.apiService || window.initializeApiService?.();
        // 從統一 options 端點載入，以便未來同頁需要其他選項
        const result = await svc.request('student/options.php?action=all');
        const categories = result?.data?.categories || [];
        const select = document.getElementById('categoryFilter') || document.getElementById('category');
        if (!select) return;

        // 保留第一個佔位（如果存在）
        const placeholder = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (placeholder) {
            select.appendChild(placeholder);
        } else {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = '全部分類';
            select.appendChild(opt);
        }

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.slug; // 用 slug 作為值
            option.textContent = cat.name; // 顯示中文名稱
            option.dataset.id = cat.id;
            option.dataset.color = cat.color || '';
            option.dataset.icon = cat.icon || '';
            select.appendChild(option);
        });
    } catch (err) {
        console.error('載入學群分類失敗:', err);
    }
}