/*** 
 * 學生作品上傳 JavaScript
 * 包含檔案上傳、表單驗證、預覽功能等
 */

// 顯示通知
function showNotification(message, type = 'info') {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加樣式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    // 根據類型設定背景色
    if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a52)';
    } else if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #51cf66, #40c057)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }
    
    // 添加到頁面
    document.body.appendChild(notification);
    
    // 3秒後自動移除
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 添加動畫樣式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 上傳狀態
let currentStep = 1;
let uploadedFiles = [];
let coverImageFile = null; // 儲存封面圖片檔案
let portfolioData = {
    title: '',
    category: '',
    description: '',
    tags: [],
    status: 'draft',
    files: [],
    url: '',
    github: '',
    cover_image: null // 封面圖片路徑
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
        step1Content.style.setProperty('display', 'block', 'important');
        step1Content.style.visibility = 'visible';
        step1Content.style.opacity = '1';
        
        console.log('設定後 step1Content 樣式:', {
            display: step1Content.style.display,
            visibility: step1Content.style.visibility,
            opacity: step1Content.style.opacity
        });
    }
    
    // 確保第二步驟和第三步驟被隱藏
    const step2Content = document.getElementById('step2Content');
    const step3Content = document.getElementById('step3Content');
    
    if (step2Content) {
        step2Content.style.setProperty('display', 'none', 'important');
        console.log('第二步驟已隱藏');
    }
    
    if (step3Content) {
        step3Content.style.setProperty('display', 'none', 'important');
        console.log('第三步驟已隱藏');
    }
    
    initEventListeners();
    initCoverImageUpload(); // 初始化封面圖片上傳
    initAIFeatures(); // 初始化AI功能
    initTagsCollapse(); // 初始化標籤收合功能
    initProgressIndicator(); // 初始化進度指示器
    
    // 動態載入學群分類
    loadCategories();
    
    // 動態載入技能標籤
    loadSkillTags();
    
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

// 防止重複初始化的標記
let coverImageInitialized = false;

// 初始化封面圖片上傳
function initCoverImageUpload() {
    // 防止重複初始化
    if (coverImageInitialized) {
        console.log('封面圖片上傳已經初始化，跳過');
        return;
    }
    
    const coverUploadArea = document.getElementById('coverUploadArea');
    const coverImageInput = document.getElementById('coverImageInput');
    
    if (coverUploadArea && coverImageInput) {
        console.log('✅ 找到封面圖片上傳元素:', { coverUploadArea, coverImageInput });
        
        // 由於使用了 <label for="coverImageInput">，瀏覽器會自動處理點擊
        // 我們只需要監聽檔案選擇事件
        coverImageInput.addEventListener('change', handleCoverImageSelect);
        
        coverImageInitialized = true;
        console.log('封面圖片上傳事件已初始化（使用原生 label 觸發）');
    }
}

// 處理封面圖片選擇
function handleCoverImageSelect(event) {
    console.log('🖼️ handleCoverImageSelect 被調用');
    console.log('event.target:', event.target);
    console.log('event.target.id:', event.target.id);
    console.log('files:', event.target.files);
    
    const file = event.target.files[0];
    if (!file) {
        console.log('沒有選擇檔案，返回');
        return;
    }
    
    console.log('選擇的封面圖片:', file.name, file.size, file.type);
    
    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
        showNotification('請選擇圖片檔案', 'error');
        return;
    }
    
    // 檢查檔案大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
        showNotification('圖片檔案不能超過 5MB', 'error');
        return;
    }
    
    // 儲存封面圖片檔案
    coverImageFile = file;
    console.log('✅ coverImageFile 已設置:', coverImageFile.name);
    
    // 預覽圖片
    const reader = new FileReader();
    reader.onload = function(e) {
        const coverPreview = document.getElementById('coverPreview');
        const coverPreviewImage = document.getElementById('coverPreviewImage');
        const coverUploadArea = document.getElementById('coverUploadArea');
        
        if (coverPreviewImage) {
            coverPreviewImage.src = e.target.result;
            console.log('預覽圖片已設置');
        }
        
        if (coverPreview) {
            coverPreview.style.display = 'block';
        }
        
        if (coverUploadArea) {
            coverUploadArea.style.display = 'none';
        }
        
        showNotification('封面圖片已選擇', 'success');
        console.log('封面圖片選擇完成');
    };
    
    reader.readAsDataURL(file);
}

// 移除封面圖片
function removeCoverImage() {
    coverImageFile = null;
    portfolioData.cover_image = null;
    
    const coverPreview = document.getElementById('coverPreview');
    const coverPreviewImage = document.getElementById('coverPreviewImage');
    const coverUploadArea = document.getElementById('coverUploadArea');
    const coverImageInput = document.getElementById('coverImageInput');
    
    if (coverPreviewImage) {
        coverPreviewImage.src = '';
    }
    
    if (coverPreview) {
        coverPreview.style.display = 'none';
    }
    
    if (coverUploadArea) {
        coverUploadArea.style.display = 'block';
    }
    
    if (coverImageInput) {
        coverImageInput.value = '';
    }
    
    showNotification('封面圖片已移除', 'info');
}

// 上傳封面圖片
async function uploadCoverImage(file, userId) {
    try {
        const formData = new FormData();
        formData.append('action', 'upload_cover');
        formData.append('cover_image', file);
        formData.append('user_id', userId);
        
        const apiService = window.apiService || window.initializeApiService?.();
        if (!apiService) {
            throw new Error('API服務未初始化');
        }
        
        const uploadUrl = apiService.getApiUrl('student/portfolio.php');
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'X-User-ID': userId
            },
            body: formData
        });
        
        const result = await response.json();
        console.log('封面圖片上傳結果:', result);
        
        if (result.status === 200 && result.data && result.data.cover_image_path) {
            return result.data.cover_image_path;
        } else {
            throw new Error(result.message || '上傳失敗');
        }
    } catch (error) {
        console.error('封面圖片上傳失敗:', error);
        showNotification('封面圖片上傳失敗：' + error.message, 'error');
        return null;
    }
}

// 初始化AI功能
function initAIFeatures() {
    console.log('初始化AI功能...');
    
    // AI描述生成按鈕
    const aiDescriptionBtn = document.getElementById('aiGenerateDescriptionBtn');
    if (aiDescriptionBtn) {
        aiDescriptionBtn.addEventListener('click', handleAIGenerateDescription);
        console.log('AI描述生成按鈕已綁定');
    }
    
    // AI標籤生成按鈕
    const aiTagsBtn = document.getElementById('aiGenerateTagsBtn');
    if (aiTagsBtn) {
        aiTagsBtn.addEventListener('click', handleAIGenerateTags);
        console.log('AI標籤生成按鈕已綁定');
    }
}

// 處理AI生成描述
async function handleAIGenerateDescription() {
    const titleInput = document.getElementById('title');
    const categorySelect = document.getElementById('categoryFilter');
    const descriptionTextarea = document.getElementById('description');
    const loadingDiv = document.getElementById('aiDescriptionLoading');
    const generateBtn = document.getElementById('aiGenerateDescriptionBtn');
    
    if (!titleInput || !categorySelect || !descriptionTextarea) {
        showNotification('請先填寫作品標題和分類', 'error');
        return;
    }
    
    const title = titleInput.value.trim();
    const category = categorySelect.value;
    
    if (!title) {
        showNotification('請先輸入作品標題', 'error');
        return;
    }
    
    if (!category) {
        showNotification('請先選擇作品分類', 'error');
        return;
    }
    
    // 檢查AI服務是否可用
    if (!window.aiService) {
        showNotification('AI服務未載入，請重新整理頁面', 'error');
        return;
    }
    
    try {
        // 顯示載入狀態
        if (loadingDiv) loadingDiv.style.display = 'block';
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>生成中...</span>';
        }
        
        // 調用AI服務生成描述（獲取元數據以顯示來源）
        const result = await window.aiService.generateDescription(title, category, true);
        
        // 處理返回結果（可能是字串或物件）
        let description, metadata;
        if (typeof result === 'string') {
            description = result;
            metadata = { source: 'local' };
        } else {
            description = result.description;
            metadata = result.metadata;
        }
        
        // 填入描述
        if (description && descriptionTextarea) {
            descriptionTextarea.value = description;
            // 觸發input事件以更新資料
            descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            
            // 顯示來源資訊
            const sourceText = metadata.source === 'huggingface' 
                ? `使用 Hugging Face API (模型: ${metadata.model || '未知'})` 
                : '使用本地智能生成';
            console.log('📊 [生成結果]', { source: metadata.source, model: metadata.model, timestamp: metadata.timestamp });
            showNotification(`AI描述生成成功！(${sourceText})`, 'success');
        } else {
            showNotification('AI描述生成失敗，請稍後再試', 'error');
        }
    } catch (error) {
        console.error('AI描述生成錯誤:', error);
        showNotification('AI描述生成失敗：' + error.message, 'error');
    } finally {
        // 隱藏載入狀態
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i><span>AI生成描述</span>';
        }
    }
}

// 處理AI生成標籤
async function handleAIGenerateTags() {
    const titleInput = document.getElementById('title');
    const descriptionTextarea = document.getElementById('description');
    const loadingDiv = document.getElementById('aiTagsLoading');
    const generateBtn = document.getElementById('aiGenerateTagsBtn');
    
    if (!titleInput) {
        showNotification('請先填寫作品標題', 'error');
        return;
    }
    
    const title = titleInput.value.trim();
    const description = descriptionTextarea ? descriptionTextarea.value.trim() : '';
    
    if (!title && !description) {
        showNotification('請先填寫作品標題或描述', 'error');
        return;
    }
    
    // 檢查AI服務是否可用
    if (!window.aiService) {
        showNotification('AI服務未載入，請重新整理頁面', 'error');
        return;
    }
    
    try {
        // 顯示載入狀態
        if (loadingDiv) loadingDiv.style.display = 'block';
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>生成中...</span>';
        }
        
        // 調用AI服務生成標籤（獲取元數據以顯示來源）
        const result = await window.aiService.generateTags(title, description, true);
        
        // 處理返回結果（可能是陣列或物件）
        let tags, metadata;
        if (Array.isArray(result)) {
            tags = result;
            metadata = { source: 'local', method: 'keyword_matching' };
        } else {
            tags = result.tags;
            metadata = result.metadata;
        }
        
        if (tags && tags.length > 0) {
            // 展開標籤區域
            expandTagsSection();
            // 自動選中匹配的標籤
            selectTagsByValues(tags);
            
            // 顯示來源資訊
            const methodText = metadata.method === 'ai_analysis' 
                ? 'AI分析' 
                : '關鍵字匹配';
            const sourceText = metadata.source === 'huggingface' 
                ? `Hugging Face API` 
                : '本地';
            console.log('📊 [生成結果]', { 
                source: metadata.source, 
                method: metadata.method, 
                tagCount: tags.length,
                timestamp: metadata.timestamp 
            });
            showNotification(`AI已為您生成 ${tags.length} 個相關標籤！(來源: ${sourceText}, 方法: ${methodText})`, 'success');
        } else {
            showNotification('AI未能生成標籤，請手動選擇', 'info');
        }
    } catch (error) {
        console.error('AI標籤生成錯誤:', error);
        showNotification('AI標籤生成失敗：' + error.message, 'error');
    } finally {
        // 隱藏載入狀態
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i><span>AI生成標籤</span>';
        }
    }
}

// 根據標籤值自動選中標籤
function selectTagsByValues(tagValues) {
    if (!Array.isArray(tagValues) || tagValues.length === 0) return;
    
    console.log('開始選中標籤:', tagValues);
    console.log('所有可用標籤列表:', allTagsList);
    
    let selectedCount = 0;
    const tagsToSelect = [...tagValues]; // 複製陣列以避免修改原始陣列
    
    // 先處理當前頁面上的標籤
    tagsToSelect.forEach(tagValue => {
        // 嘗試精確匹配
        let checkbox = document.querySelector(`input[name="tags"][value="${tagValue}"]`);
        
        // 如果精確匹配失敗，嘗試模糊匹配（不區分大小寫）
        if (!checkbox) {
            const allCheckboxes = document.querySelectorAll('input[name="tags"]');
            allCheckboxes.forEach(cb => {
                if (cb.value.toLowerCase() === tagValue.toLowerCase()) {
                    checkbox = cb;
                }
            });
        }
        
        // 如果找到匹配的checkbox，選中它
        if (checkbox) {
            if (!checkbox.checked) {
                checkbox.checked = true;
                // 觸發 change 事件以確保相關處理邏輯被執行
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                selectedCount++;
                console.log(`✓ 已選中標籤: ${tagValue}`);
            } else {
                console.log(`✓ 標籤已選中: ${tagValue}`);
                selectedCount++;
            }
        } else {
            // 標籤不在當前頁，檢查它是否存在於 allTagsList 中
            const tagExists = allTagsList.some(tag => 
                tag.toLowerCase() === tagValue.toLowerCase() || 
                tag === tagValue
            );
            
            if (tagExists) {
                // 找到標籤在列表中的索引，切換到對應頁面
                const tagIndex = allTagsList.findIndex(tag => 
                    tag.toLowerCase() === tagValue.toLowerCase() || 
                    tag === tagValue
                );
                
                if (tagIndex !== -1) {
                    const targetPage = Math.floor(tagIndex / tagsPerPage) + 1;
                    console.log(`標籤 ${tagValue} 在第 ${targetPage} 頁，切換到該頁`);
                    
                    // 切換到包含該標籤的頁面
                    if (targetPage !== currentTagsPage) {
                        goToTagsPage(targetPage);
                        
                        // 等待DOM更新後再選中
                        setTimeout(() => {
                            const checkbox = document.querySelector(`input[name="tags"][value="${allTagsList[tagIndex]}"]`);
                            if (checkbox && !checkbox.checked) {
                                checkbox.checked = true;
                                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log(`✓ 已選中標籤: ${allTagsList[tagIndex]}`);
                            }
                        }, 100);
                    }
                }
            } else {
                console.warn(`⚠ 標籤不存在於列表中: ${tagValue}`);
            }
        }
    });
    
    // 更新已選標籤顯示
    updateSelectedTags();
    collectFormData();
    
    console.log(`總共已自動選中 ${selectedCount} 個標籤`);
}

// 初始化事件監聽器
function initEventListeners() {
    console.log('初始化事件監聽器...');
    
    // 檔案上傳相關
    const fileInput = document.getElementById('fileInput');
    const folderInput = document.getElementById('folderInput');
    const uploadArea = document.getElementById('uploadArea');
    
    console.log('fileInput:', fileInput);
    console.log('folderInput:', folderInput);
    console.log('uploadArea:', uploadArea);
    
    if (fileInput) {
        // 移除舊的事件監聽器（如果有的話）
        fileInput.removeEventListener('change', handleFileSelect);
        fileInput.addEventListener('change', handleFileSelect);
        console.log('檔案輸入事件監聽器已綁定');
    }
    
    if (folderInput) {
        // 移除舊的事件監聽器（如果有的話）
        folderInput.removeEventListener('change', handleFolderSelect);
        folderInput.addEventListener('change', handleFolderSelect);
        console.log('資料夾輸入事件監聽器已綁定');
    }
    
    // 更新：使用upload-zone作為拖拽區域
    const uploadZone = document.getElementById('uploadZone');
    if (uploadZone) {
        uploadZone.removeEventListener('dragover', handleDragOver);
        uploadZone.removeEventListener('dragleave', handleDragLeave);
        uploadZone.removeEventListener('drop', handleDrop);
        
        uploadZone.addEventListener('dragover', handleDragOver);
        uploadZone.addEventListener('dragleave', handleDragLeave);
        uploadZone.addEventListener('drop', handleDrop);
        console.log('拖拽事件監聽器已綁定到 uploadZone');
    }
    
    // 保留舊的uploadArea以兼容
    if (uploadArea) {
        uploadArea.removeEventListener('dragover', handleDragOver);
        uploadArea.removeEventListener('dragleave', handleDragLeave);
        uploadArea.removeEventListener('drop', handleDrop);
        
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        console.log('拖拽事件監聽器已綁定到 uploadArea');
    }
    
    // 表單提交
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.removeEventListener('submit', handleFormSubmit);
        uploadForm.addEventListener('submit', handleFormSubmit);
        console.log('表單提交事件監聽器已綁定');
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
    
    console.log('事件監聽器初始化完成');
}

// 下一步
function nextStep() {
    console.log('nextStep 被調用，當前步驟:', currentStep);
    
    if (validateCurrentStep()) {
        // 收集當前步驟的表單資料
        collectFormData();
        console.log('收集的資料:', portfolioData);
        
        currentStep++;
        console.log('進入步驟:', currentStep);
        updateStepDisplay();
        
        // 如果進入第三步驟，確保預覽是最新的
        if (currentStep === 3) {
            console.log('進入第三步驟，準備更新預覽');
            setTimeout(() => {
                updatePreview();
            }, 200);
        }
    } else {
        console.log('步驟驗證失敗');
    }
}

// 上一步
function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

// 初始化進度指示器
function initProgressIndicator() {
    updateProgressIndicator();
}

// 更新進度指示器
function updateProgressIndicator() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressPercentage');
    
    if (progressFill && progressText) {
        const percentage = (currentStep / 3) * 100;
        progressFill.style.width = percentage + '%';
        progressText.textContent = Math.round(percentage) + '%';
    }
}

// 初始化標籤收合功能
function initTagsCollapse() {
    const tagsHeader = document.getElementById('tagsHeader');
    const tagsContent = document.getElementById('tagsContent');
    
    if (tagsHeader && tagsContent) {
        // 點擊header時切換收合狀態（但排除AI按鈕）
        tagsHeader.addEventListener('click', function(e) {
            // 如果點擊的是AI按鈕或其子元素，不處理
            if (e.target.closest('.btn-ai-generate')) {
                return;
            }
            
            const isExpanded = tagsContent.style.display !== 'none';
            tagsContent.style.display = isExpanded ? 'none' : 'block';
            
            // 更新圖標（找到chevron圖標）
            const icons = tagsHeader.querySelectorAll('i');
            icons.forEach(icon => {
                if (icon.classList.contains('fa-chevron-down') || icon.classList.contains('fa-chevron-up')) {
                    icon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
                    icon.style.color = '#718096';
                }
            });
        });
        
        // 初始狀態：收合
        tagsContent.style.display = 'none';
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
    
    // 更新進度指示器
    updateProgressIndicator();
    
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
                content.style.setProperty('display', 'block', 'important');
            } else {
                console.log(`隱藏步驟 ${index + 1} 內容`);
                content.style.setProperty('display', 'none', 'important');
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
    
    // 當進入第三步驟時更新預覽
    if (currentStep === 3) {
        // 延遲一點時間確保DOM已更新
        setTimeout(() => {
            console.log('第三步驟顯示完成，開始更新預覽');
            updatePreview();
        }, 100);
    }
}

// 顯示指定步驟
function showStep(step) {
    currentStep = step;
    updateStepDisplay();
    
    // 如果進入第三步驟，強制更新預覽
    if (step === 3) {
        setTimeout(() => {
            console.log('強制更新第三步驟預覽');
            updatePreview();
        }, 200);
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
    console.log('驗證步驟1開始');
    
    const titleElement = document.getElementById('title');
    const title = titleElement ? titleElement.value.trim() : '';
    
    const categorySelect = document.getElementById('categoryFilter') || document.getElementById('category');
    const category = categorySelect ? categorySelect.value : '';
    
    const descriptionElement = document.getElementById('description');
    const description = descriptionElement ? descriptionElement.value.trim() : '';
    
    console.log('表單資料:', { title, category, description });
    
    if (!title) {
        showNotification('請輸入作品標題', 'error');
        return false;
    }
    
    if (!category) {
        showNotification('請選擇作品學群分類', 'error');
        return false;
    }
    
    if (!description) {
        showNotification('請輸入作品描述', 'error');
        return false;
    }
    
    // 儲存資料
    portfolioData.title = title;
    portfolioData.category = category;
    portfolioData.description = description;
    
    console.log('步驟1驗證通過，資料已儲存:', portfolioData);
    return true;
}

// 驗證步驟2 - 檔案上傳或連結
function validateStep2() {
    console.log('驗證步驟2開始，檔案數量:', uploadedFiles.length);
    
    // 收集作品連結
    const portfolioUrl = document.getElementById('portfolioUrl');
    let hasUrl = false;
    if (portfolioUrl && portfolioUrl.value && portfolioUrl.value.trim()) {
        // 驗證 URL 格式
        const urlPattern = /^https?:\/\/.+/;
        const urlValue = portfolioUrl.value.trim();
        if (urlValue && !urlPattern.test(urlValue)) {
            showNotification('請輸入有效的 URL（需以 http:// 或 https:// 開頭）', 'error');
            return false;
        }
        portfolioData.url = urlValue;
        hasUrl = true;
        console.log('作品連結已收集:', portfolioData.url);
    }
    
    // 檢查：至少要有檔案或連結其中一個
    if (uploadedFiles.length === 0 && !hasUrl) {
        showNotification('請至少上傳一個檔案或輸入作品連結', 'error');
        return false;
    }
    
    // 收集標籤資料（現在在第二步驟）
    const tagsInput = document.getElementById('tags');
    if (tagsInput && tagsInput.value) {
        portfolioData.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        console.log('標籤已收集:', portfolioData.tags);
    }
    
    console.log('步驟2驗證通過');
    return true;
}

// 驗證步驟3 - 發布設定
function validateStep3() {
    console.log('驗證步驟3開始');
    
    // 收集發布狀態（現在在第三步驟）
    const statusInput = document.getElementById('status');
    if (statusInput && statusInput.value) {
        portfolioData.status = statusInput.value;
        console.log('發布狀態已收集:', portfolioData.status);
    }
    
    // 收集其他可選資料
    const githubUrl = document.getElementById('githubUrl');
    if (githubUrl && githubUrl.value) {
        portfolioData.github = githubUrl.value.trim();
        console.log('GitHub URL已收集:', portfolioData.github);
    }
    
    // 收集作品連結
    const portfolioUrl = document.getElementById('portfolioUrl');
    if (portfolioUrl && portfolioUrl.value) {
        // 驗證 URL 格式
        const urlPattern = /^https?:\/\/.+/;
        const urlValue = portfolioUrl.value.trim();
        if (urlValue && !urlPattern.test(urlValue)) {
            showNotification('請輸入有效的 URL（需以 http:// 或 https:// 開頭）', 'error');
            return false;
        }
        portfolioData.url = urlValue;
        console.log('作品連結已收集:', portfolioData.url);
    }
    
    console.log('步驟3驗證通過');
    return true;
}

// 處理檔案選擇
function handleFileSelect(e) {
    console.log('檔案選擇事件觸發:', e.target.files);
    const files = Array.from(e.target.files);
    console.log('選擇的檔案:', files);
    addFiles(files);
}

// 處理資料夾選擇
function handleFolderSelect(e) {
    console.log('資料夾選擇事件觸發:', e.target.files);
    const files = Array.from(e.target.files);
    console.log('選擇的資料夾檔案:', files);
    
    if (files.length > 0) {
        // 顯示資料夾信息
        const folderName = files[0].webkitRelativePath.split('/')[0];
        console.log('資料夾名稱:', folderName);
        
        // 組織檔案結構
        const folderStructure = organizeFolderStructure(files);
        console.log('資料夾結構:', folderStructure);
        
        addFiles(files, folderName, folderStructure);
    }
}

// 組織資料夾結構
function organizeFolderStructure(files) {
    const structure = {};
    
    files.forEach(file => {
        const path = file.webkitRelativePath;
        const pathParts = path.split('/');
        
        let current = structure;
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (!current[part]) {
                current[part] = { type: 'folder', children: {} };
            }
            current = current[part].children;
        }
        
        const fileName = pathParts[pathParts.length - 1];
        current[fileName] = {
            type: 'file',
            file: file,
            size: file.size,
            lastModified: file.lastModified
        };
    });
    
    return structure;
}

// 處理拖拽進入
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
}

// 處理拖拽離開
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
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
function addFiles(files, folderName = null, folderStructure = null) {
    console.log('addFiles 被調用，檔案數量:', files.length);
    console.log('資料夾名稱:', folderName);
    console.log('資料夾結構:', folderStructure);
    
    let addedCount = 0;
    let folderInfo = null;
    
    if (folderName && folderStructure) {
        folderInfo = {
            name: folderName,
            structure: folderStructure,
            totalFiles: files.length,
            totalSize: files.reduce((sum, file) => sum + file.size, 0)
        };
    }
    
    files.forEach(file => {
        console.log('處理檔案:', file.name, '大小:', file.size);
        if (validateFile(file)) {
            // 為檔案添加資料夾信息
            if (folderName) {
                file.folderName = folderName;
                file.folderPath = file.webkitRelativePath;
            }
            
            uploadedFiles.push(file);
            addedCount++;
            console.log('檔案添加成功:', file.name);
        } else {
            console.log('檔案驗證失敗:', file.name);
        }
    });
    
    console.log('總共添加檔案數:', addedCount, '當前檔案總數:', uploadedFiles.length);
    
    if (addedCount > 0) {
        if (folderName) {
            showNotification(`成功添加資料夾 "${folderName}"，包含 ${addedCount} 個檔案`, 'success');
        } else {
            showNotification(`成功添加 ${addedCount} 個檔案`, 'success');
        }
        
        updateFilePreview();
        
        // 同步更新 fileInput 的 files 屬性
        updateFileInput();
    }
}

// 更新檔案輸入框的 files 屬性
function updateFileInput() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput && uploadedFiles.length > 0) {
        // 創建新的 DataTransfer 物件來設定 files
        const dt = new DataTransfer();
        uploadedFiles.forEach(file => dt.items.add(file));
        fileInput.files = dt.files;
    }
}

// 驗證檔案
function validateFile(file) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedExtensions = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
        'mp4', 'avi', 'mov', 'wmv', 'webm',
        'mp3', 'wav', 'flac', 'aac',
        'pdf', 'doc', 'docx', 'txt',
        'zip', 'rar', '7z',
        'html', 'css', 'js', 'json', 'xml',
        'obj', 'stl', 'fbx', 'glb', 'gltf'
    ];
    
    // 檢查檔案大小
    if (file.size > maxSize) {
        showNotification(`檔案 ${file.name} 超過 50MB 限制`, 'error');
        return false;
    }
    
    // 檢查檔案副檔名
    const extension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
        showNotification(`檔案 ${file.name} 格式不支援`, 'error');
        return false;
    }
    
    return true;
}

// 更新檔案預覽
function updateFilePreview() {
    console.log('updateFilePreview 被調用，檔案數量:', uploadedFiles.length);
    
    const fileList = document.getElementById('fileList');
    const fileItems = document.getElementById('fileItems');
    const fileCount = document.getElementById('fileCount');
    
    console.log('DOM元素:', { fileList, fileItems, fileCount });
    
    if (!fileList || !fileItems || !fileCount) {
        console.error('找不到必要的DOM元素');
        return;
    }
    
    // 更新檔案數量
    fileCount.textContent = `${uploadedFiles.length} 個檔案`;
    console.log('檔案數量已更新:', fileCount.textContent);
    
    // 顯示或隱藏檔案列表
    if (uploadedFiles.length > 0) {
        fileList.style.display = 'block';
        fileItems.innerHTML = '';
        
        uploadedFiles.forEach((file, index) => {
            const fileItem = createFileItem(file, index);
            fileItems.appendChild(fileItem);
            console.log('檔案項目已添加:', file.name);
        });
        
        console.log('檔案列表已顯示');
    } else {
        fileList.style.display = 'none';
        console.log('檔案列表已隱藏');
    }
}

// 建立檔案項目
function createFileItem(file, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileType = getFileType(file);
    const icon = getFileIcon(fileType);
    
    // 檢查是否為資料夾中的檔案
    const isFromFolder = file.folderName && file.folderPath;
    const displayName = isFromFolder ? `${file.folderName}/${file.name}` : file.name;
    
    fileItem.innerHTML = `
        <div class="file-icon">
            <i class="${icon}"></i>
        </div>
        <div class="file-info">
            <div class="file-name" title="${displayName}">${displayName}</div>
            <div class="file-details">
                <span class="file-type">${fileType.toUpperCase()}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
                ${isFromFolder ? `<span class="folder-indicator">📁 資料夾</span>` : ''}
            </div>
        </div>
        <div class="file-actions">
            <button type="button" class="btn-remove" onclick="removeFile(${index})" title="移除文件">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    return fileItem;
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
    updateFileInput();
    
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
    const urlElement = document.getElementById('githubUrl');
    const branchElement = document.getElementById('githubBranch');
    
    if (!urlElement || !branchElement) {
        console.warn('GitHub 相關元素未找到');
        return;
    }
    
    const url = urlElement.value;
    const branch = branchElement.value;
    
    if (!url) {
        showNotification('請輸入GitHub專案URL', 'error');
        return;
    }
    
    try {
        // 這裡應該調用GitHub API，目前使用模擬資料
        const repoInfo = await mockGithubAPI(url, branch);
        displayGithubInfo(repoInfo);
    } catch (error) {
        console.error('GitHub API 錯誤:', error);
        showNotification('無法獲取GitHub專案資訊，請檢查URL是否正確', 'error');
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

// 收集表單資料
function collectFormData() {
    console.log('collectFormData 被調用');
    
    // 收集第一步驟的資料
    const title = document.getElementById('title');
    const category = document.getElementById('categoryFilter');
    const description = document.getElementById('description');
    const tags = document.getElementById('tags');
    const status = document.getElementById('status');
    
    console.log('表單元素:', { title, category, description, tags, status });
    
    if (title && title.value) {
        portfolioData.title = title.value.trim();
        console.log('標題:', portfolioData.title);
    }
    if (category && category.value) {
        portfolioData.category = category.value;
        console.log('分類:', portfolioData.category);
    }
    if (description && description.value) {
        portfolioData.description = description.value.trim();
        console.log('描述:', portfolioData.description);
    }
    // 收集選中的標籤（checkbox）
    const tagCheckboxes = document.querySelectorAll('input[name="tags"]:checked');
    if (tagCheckboxes && tagCheckboxes.length > 0) {
        portfolioData.tags = Array.from(tagCheckboxes).map(cb => cb.value);
        console.log('標籤:', portfolioData.tags);
    } else {
        portfolioData.tags = [];
    }
    if (status && status.value) {
        portfolioData.status = status.value;
        console.log('狀態:', portfolioData.status);
    }
    
    // 收集第三步驟的額外資料
    const githubUrl = document.getElementById('githubUrl');
    if (githubUrl && githubUrl.value) {
        portfolioData.github = githubUrl.value.trim();
        console.log('GitHub URL:', portfolioData.github);
    }
    
    // 收集作品連結
    const portfolioUrl = document.getElementById('portfolioUrl');
    if (portfolioUrl && portfolioUrl.value) {
        portfolioData.url = portfolioUrl.value.trim();
        console.log('作品連結:', portfolioData.url);
    }
    
    console.log('收集的表單資料:', portfolioData);
}

// 更新預覽
function updatePreview() {
    console.log('updatePreview 被調用');
    console.log('當前 portfolioData:', portfolioData);
    console.log('當前 uploadedFiles:', uploadedFiles);
    
    // 確保資料是最新的
    collectFormData();
    
    const previewTitle = document.getElementById('previewTitle');
    const previewDescription = document.getElementById('previewDescription');
    const previewTags = document.getElementById('previewTags');
    const previewFiles = document.getElementById('previewFiles');
    
    console.log('預覽DOM元素:', { previewTitle, previewDescription, previewTags, previewFiles });
    
    if (previewTitle) {
        const titleText = portfolioData.title || '作品標題';
        previewTitle.textContent = titleText;
        console.log('標題已更新:', titleText);
    }
    
    if (previewDescription) {
        const descText = portfolioData.description || '作品描述';
        previewDescription.textContent = descText;
        console.log('描述已更新:', descText);
    }
    
    if (previewTags) {
        if (portfolioData.tags && portfolioData.tags.length > 0) {
            previewTags.innerHTML = portfolioData.tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('');
            console.log('標籤已更新:', portfolioData.tags);
        } else {
            previewTags.innerHTML = '<span class="text-muted">無標籤</span>';
            console.log('標籤為空，顯示預設文字');
        }
    }
    
    // 更新作品連結預覽
    const previewUrl = document.getElementById('previewUrl');
    if (previewUrl) {
        if (portfolioData.url && portfolioData.url.trim()) {
            previewUrl.innerHTML = `
                <a href="${portfolioData.url}" target="_blank" rel="noopener noreferrer" style="color: #667eea; text-decoration: none; word-break: break-all;">
                    ${portfolioData.url} <i class="fas fa-external-link-alt" style="font-size: 0.8rem; margin-left: 0.3rem;"></i>
                </a>
            `;
            previewUrl.closest('.preview-item').style.display = 'block';
            console.log('作品連結已更新:', portfolioData.url);
        } else {
            previewUrl.closest('.preview-item').style.display = 'none';
        }
    }
    
    if (previewFiles) {
        const hasFiles = uploadedFiles && uploadedFiles.length > 0;
        const hasUrl = portfolioData.url && portfolioData.url.trim();
        
        if (hasFiles) {
            previewFiles.innerHTML = uploadedFiles.map(file => {
                const fileType = getFileType(file);
                const icon = getFileIcon(fileType);
                const displayName = file.folderName ? `${file.folderName}/${file.name}` : file.name;
                
                return `
                    <div class="file-preview-item">
                        <i class="${icon}"></i>
                        <div class="preview-file-name" title="${displayName}">${displayName}</div>
                        ${file.folderName ? '<div class="folder-badge">📁</div>' : ''}
                    </div>
                `;
            }).join('');
            console.log('檔案預覽已更新，檔案數量:', uploadedFiles.length);
        } else if (hasUrl) {
            previewFiles.innerHTML = `
                <div class="file-preview-item" style="text-align: center; padding: 1.5rem;">
                    <i class="fas fa-link" style="font-size: 2rem; color: #667eea; margin-bottom: 0.5rem;"></i>
                    <div class="preview-file-name">
                        <a href="${portfolioData.url}" target="_blank" rel="noopener noreferrer" style="color: #667eea; text-decoration: none;">
                            ${portfolioData.url} <i class="fas fa-external-link-alt" style="font-size: 0.8rem;"></i>
                        </a>
                    </div>
                    <small style="color: #718096;">僅提供連結，無上傳檔案</small>
                </div>
            `;
            console.log('僅連結預覽已更新');
        } else {
            previewFiles.innerHTML = '<div class="text-muted">無檔案或連結</div>';
            console.log('無檔案和連結，顯示預設文字');
        }
    }
    
    console.log('預覽更新完成');
}

// 處理表單提交
async function handleFormSubmit(e) {
    if (e) {
        e.preventDefault();
    }
    
    console.log('handleFormSubmit 被調用');
    console.log('當前步驟:', currentStep);
    console.log('portfolioData:', portfolioData);
    console.log('uploadedFiles:', uploadedFiles);
    
    // 確保所有步驟都已完成驗證
    if (currentStep < 3) {
        showNotification('請完成所有步驟', 'error');
        return;
    }
    
    if (!validateCurrentStep()) {
        console.log('步驟驗證失敗');
        return;
    }
    
    try {
        // 檢查用戶登入狀態
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('用戶資訊:', user);
        if (!user || !user.id) {
            throw new Error('請先登入後再上傳作品');
        }
        
        // 檢查是否有封面圖片
        console.log('🔍 檢查 coverImageFile:', coverImageFile);
        if (!coverImageFile) {
            console.error('❌ coverImageFile 為 null 或 undefined');
            showNotification('請上傳封面圖片', 'error');
            return;
        }
        
        console.log('✅ coverImageFile 存在:', coverImageFile.name);
        
        // 顯示上傳中狀態
        showUploadProgress(true);
        showNotification('正在上傳封面圖片...', 'info');
        
        console.log('📤 開始上傳封面圖片到服務器...');
        
        // 先上傳封面圖片
        const coverImagePath = await uploadCoverImage(coverImageFile, user.id);
        
        console.log('封面圖片上傳返回結果:', coverImagePath);
        
        if (!coverImagePath) {
            console.error('❌ 封面圖片路徑為空');
            throw new Error('封面圖片上傳失敗');
        }
        
        console.log('✅ 封面圖片上傳成功:', coverImagePath);
        portfolioData.cover_image = coverImagePath;
        
        showNotification('正在上傳作品...', 'info');
        
        // 準備上傳資料
        const formData = new FormData();
        formData.append('action', 'create');
        formData.append('title', portfolioData.title);
        formData.append('category', portfolioData.category);
        formData.append('description', portfolioData.description);
        // 將標籤陣列轉換為逗號分隔的字串（後端期待這個格式）
        formData.append('tags', Array.isArray(portfolioData.tags) ? portfolioData.tags.join(',') : '');
        formData.append('status', portfolioData.status);
        formData.append('url', portfolioData.url || '');
        formData.append('github', portfolioData.github || '');
        formData.append('cover_image', coverImagePath); // 添加封面圖片路徑
        formData.append('user_id', user.id); // 明確添加用戶ID
        
        console.log('準備上傳的資料:');
        console.log('- 標題:', portfolioData.title);
        console.log('- 分類:', portfolioData.category);
        console.log('- 描述:', portfolioData.description);
        console.log('- 標籤:', portfolioData.tags);
        console.log('- 狀態:', portfolioData.status);
        console.log('- 用戶ID:', user.id);
        console.log('- 檔案數量:', uploadedFiles.length);
        
        // 添加檔案
        if (uploadedFiles && uploadedFiles.length > 0) {
            uploadedFiles.forEach((file, index) => {
                formData.append('files[]', file);
                console.log(`檔案 ${index + 1}:`, file.name, file.size);
            });
        }
        
        // 使用API服務上傳
        const apiService = window.apiService || window.initializeApiService?.();
        if (!apiService) {
            throw new Error('API服務未初始化');
        }
        
        console.log('開始調用 API 服務...');
        const response = await apiService.createPortfolio(formData);
        console.log('API 回應:', response);
        
        if (response.success) {
            showUploadProgress(false);
            const portfolioId = response.data?.portfolio_id;
            console.log('✅ 作品上傳成功！作品 ID:', portfolioId);
            
            showNotification('作品上傳成功！即將跳轉到作品詳情頁...', 'success');
            
            // 添加成功動畫
            const uploadContent = document.querySelector('.upload-content');
            if (uploadContent) {
                uploadContent.classList.add('success-animation');
            }
            
            // 延遲後跳轉到作品詳情頁
            setTimeout(() => {
                if (portfolioId) {
                    // 跳轉到作品詳情頁
                    window.location.href = `portfolio-detail.html?id=${portfolioId}`;
                } else {
                    // 如果沒有作品ID，顯示通知並停留在上傳頁面
                    showNotification('作品上傳成功！', 'success');
                    if (uploadContent) {
                        uploadContent.classList.remove('success-animation');
                        setTimeout(() => {
                            resetForm();
                        }, 1000);
                    }
                }
            }, 1500);
        } else {
            throw new Error(response.message || '上傳失敗');
        }
        
    } catch (error) {
        showUploadProgress(false);
        showNotification(`上傳失敗: ${error.message}`, 'error');
        console.error('上傳作品錯誤:', error);
        
        // 添加錯誤動畫
        const uploadContent = document.querySelector('.upload-content');
        if (uploadContent) {
            uploadContent.classList.add('error-shake');
            setTimeout(() => {
                uploadContent.classList.remove('error-shake');
            }, 500);
        }
    }
}

// 顯示/隱藏上傳進度
function showUploadProgress(show) {
    const progressBar = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    
    // 檢查元素是否存在
    if (!progressBar || !progressFill) {
        console.warn('進度條元素未找到:', { progressBar, progressFill });
        return;
    }
    
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
    updateFileInput();
    
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
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
}

// 獲取 API base URL
function getApiBase() {
    return (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.API_BASE_URL) 
        ? APP_CONFIG.API_BASE_URL 
        : '/api';
}

// 載入技能標籤
async function loadSkillTags() {
    try {
        console.log('開始載入技能標籤...');
        
        const response = await fetch(`${getApiBase()}/student/skill-tags.php?action=get_tags`);
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
            console.log('標籤載入成功:', result.data);
            renderSkillTags(result.data);
            initTagSelection();
        } else {
            throw new Error(result.message || '載入標籤失敗');
        }
    } catch (error) {
        console.error('載入技能標籤失敗:', error);
        // 使用預設標籤
        const defaultTags = getDefaultTags();
        renderSkillTags(defaultTags);
        initTagSelection();
    }
}

// 標籤分頁相關變數
let allTagsList = [];
let currentTagsPage = 1;
let tagsPerPage = 50; // 每頁顯示50個標籤（5行，每行10個）

// 渲染技能標籤選項（簡化版：無分類，傳統勾選式，帶分頁）
function renderSkillTags(tagsData) {
    const container = document.getElementById('tagsOptionsContainer');
    if (!container) {
        console.error('找不到標籤容器');
        return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 收集所有標籤（不分類）
    allTagsList = [];
    const categoryOrder = [
        '前端開發',
        '後端開發',
        'UI/UX設計',
        '資料分析',
        '行動開發',
        '專案管理',
        '數位行銷',
        '網路安全',
        '工業自動化',
        '機器人學',
        '建築/營建',
        '數學/統計',
        '物理',
        '醫療資訊',
        '公共衛生',
        '生物資訊',
        '品牌設計',
        '心理學',
        '數位媒體',
        '跨文化溝通',
        '電商/商業',
        '爬蟲/自動化',
        '雲端/DevOps',
        '其他技能'
    ];
    
    // 收集所有標籤到一個陣列
    categoryOrder.forEach(category => {
        const tags = tagsData[category] || [];
        tags.forEach(tag => {
            const tagName = typeof tag === 'string' ? tag : (tag.name || tag);
            if (!allTagsList.includes(tagName)) {
                allTagsList.push(tagName);
            }
        });
    });
    
    // 按字母順序排序
    allTagsList.sort();
    
    // 重置到第一頁
    currentTagsPage = 1;
    
    // 渲染標籤（帶分頁）
    renderTagsPage();
    
    // 重新初始化標籤選擇功能
    initTagSelection();
    
    console.log('標籤渲染完成（簡化版，共', allTagsList.length, '個標籤）');
}

// 渲染當前頁的標籤
function renderTagsPage() {
    const container = document.getElementById('tagsOptionsContainer');
    if (!container) return;
    
    // 清空容器
    container.innerHTML = '';
    
    // 計算分頁
    const totalPages = Math.ceil(allTagsList.length / tagsPerPage);
    const startIndex = (currentTagsPage - 1) * tagsPerPage;
    const endIndex = Math.min(startIndex + tagsPerPage, allTagsList.length);
    const currentPageTags = allTagsList.slice(startIndex, endIndex);
    
    // 創建網格容器
    const gridContainer = document.createElement('div');
    gridContainer.className = 'tags-grid';
    
    // 渲染當前頁的標籤
    currentPageTags.forEach(tagName => {
        const tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'tags';
        checkbox.value = tagName;
        checkbox.id = `tag-${tagName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`;
        checkbox.className = 'tag-checkbox';
        
        const label = document.createElement('label');
        label.className = 'tag-label';
        label.setAttribute('for', `tag-${tagName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`);
        label.textContent = tagName;
        
        tagItem.appendChild(checkbox);
        tagItem.appendChild(label);
        gridContainer.appendChild(tagItem);
    });
    
    container.appendChild(gridContainer);
    
    // 更新分頁控制
    updateTagsPagination();
    
    // 重新初始化標籤選擇功能（因為DOM更新了）
    initTagSelection();
}

// 更新分頁控制
function updateTagsPagination() {
    const paginationDiv = document.getElementById('tagsPagination');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationNumbers = document.getElementById('paginationNumbers');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (!paginationDiv || !paginationInfo || !paginationNumbers) return;
    
    const totalPages = Math.ceil(allTagsList.length / tagsPerPage);
    
    // 如果只有一頁或沒有標籤，隱藏分頁控制
    if (totalPages <= 1) {
        paginationDiv.style.display = 'none';
        return;
    }
    
    // 顯示分頁控制
    paginationDiv.style.display = 'flex';
    
    // 更新分頁資訊
    paginationInfo.textContent = `第 ${currentTagsPage} 頁，共 ${totalPages} 頁（共 ${allTagsList.length} 個標籤）`;
    
    // 更新上一頁/下一頁按鈕狀態
    if (prevBtn) {
        prevBtn.disabled = currentTagsPage === 1;
        prevBtn.style.opacity = currentTagsPage === 1 ? '0.5' : '1';
        prevBtn.style.cursor = currentTagsPage === 1 ? 'not-allowed' : 'pointer';
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentTagsPage === totalPages;
        nextBtn.style.opacity = currentTagsPage === totalPages ? '0.5' : '1';
        nextBtn.style.cursor = currentTagsPage === totalPages ? 'not-allowed' : 'pointer';
    }
    
    // 生成頁碼按鈕
    paginationNumbers.innerHTML = '';
    
    // 計算要顯示的頁碼範圍
    let startPage = Math.max(1, currentTagsPage - 2);
    let endPage = Math.min(totalPages, currentTagsPage + 2);
    
    // 如果接近開頭，顯示更多後面的頁碼
    if (currentTagsPage <= 3) {
        endPage = Math.min(5, totalPages);
    }
    
    // 如果接近結尾，顯示更多前面的頁碼
    if (currentTagsPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
    }
    
    // 第一頁
    if (startPage > 1) {
        const firstBtn = createPageButton(1);
        paginationNumbers.appendChild(firstBtn);
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationNumbers.appendChild(ellipsis);
        }
    }
    
    // 中間頁碼
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createPageButton(i);
        paginationNumbers.appendChild(pageBtn);
    }
    
    // 最後一頁
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationNumbers.appendChild(ellipsis);
        }
        const lastBtn = createPageButton(totalPages);
        paginationNumbers.appendChild(lastBtn);
    }
}

// 創建頁碼按鈕
function createPageButton(pageNum) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pagination-number';
    if (pageNum === currentTagsPage) {
        btn.classList.add('active');
    }
    btn.textContent = pageNum;
    btn.onclick = () => goToTagsPage(pageNum);
    return btn;
}

// 切換標籤頁面
function changeTagsPage(direction) {
    const totalPages = Math.ceil(allTagsList.length / tagsPerPage);
    const newPage = currentTagsPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentTagsPage = newPage;
        renderTagsPage();
        
        // 滾動到標籤區域頂部
        const tagsContent = document.getElementById('tagsContent');
        if (tagsContent) {
            tagsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// 跳轉到指定頁面
function goToTagsPage(pageNum) {
    const totalPages = Math.ceil(allTagsList.length / tagsPerPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
        currentTagsPage = pageNum;
        renderTagsPage();
        
        // 滾動到標籤區域頂部
        const tagsContent = document.getElementById('tagsContent');
        if (tagsContent) {
            tagsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// 將函數暴露到全局
window.changeTagsPage = changeTagsPage;
window.goToTagsPage = goToTagsPage;

// 獲取預設標籤（當 API 失敗時使用）
function getDefaultTags() {
    return {
        '前端開發': ['HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'Angular', '前端', 'UI', '響應式', 'TypeScript'],
        '後端開發': ['Node.js', 'Python', 'PHP', 'Java', 'C#', '後端', 'API', '資料庫', 'SQL', 'MySQL', 'MongoDB'],
        'UI/UX設計': ['UX', '設計', 'Figma', 'Adobe', 'Photoshop', 'Illustrator', '使用者體驗'],
        '資料分析': ['R', 'Excel', 'PowerBI', 'Tableau', '數據分析', '統計', '機器學習', 'Python'],
        '行動開發': ['iOS', 'Android', 'React Native', 'Flutter', 'Swift', 'Kotlin', '行動應用'],
        '專案管理': ['專案管理', '敏捷', 'Scrum', '團隊協作', 'Git', '版本控制', '管理'],
        '數位行銷': ['行銷', 'SEO', 'Google Analytics', '社群媒體', '內容行銷', '數位行銷'],
        '網路安全': ['網路安全', '滲透測試', '弱點評估', '資訊安全'],
        '工業自動化': ['PLC', 'SCADA', '物聯網', '工業自動化', 'IoT'],
        '機器人學': ['機器人學', '控制系統', 'PID控制', '路徑規劃', 'Arduino'],
        '建築/營建': ['BIM', 'Revit', '3D建模', '建築學', '永續建築', '綠建築'],
        '數學/統計': ['數學建模', '最佳化', '線性規劃', '統計學', 'R'],
        '物理': ['物理學', 'LabVIEW', '實驗數據', 'MATLAB'],
        '醫療資訊': ['醫療資訊', '護理資訊學', '病患照護'],
        '公共衛生': ['公共衛生', '流行病學', '健康統計'],
        '生物資訊': ['生物資訊學', '基因組學', '蛋白質分析'],
        '品牌設計': ['品牌識別', 'Logo設計', '視覺識別'],
        '心理學': ['心理測驗', '評估', '統計學'],
        '數位媒體': ['數位媒體', '內容創作', '影片製作', 'Premiere Pro'],
        '跨文化溝通': ['跨文化溝通', '語言教學', '培訓設計'],
        '電商/商業': ['電商', '用戶行為', '商業分析'],
        '爬蟲/自動化': ['爬蟲', '自動化', 'Selenium', 'Python'],
        '雲端/DevOps': ['AWS', 'Docker', 'CI/CD', 'Git'],
        '其他技能': ['創意', '創新', '解決問題', '溝通', '領導']
    };
}

// 初始化標籤選擇功能
function initTagSelection() {
    console.log('初始化標籤選擇功能...');
    
    // 為所有標籤 checkbox 添加事件監聽
    const tagCheckboxes = document.querySelectorAll('input[name="tags"]');
    tagCheckboxes.forEach(checkbox => {
        // 移除舊的事件監聽器
        const newCheckbox = checkbox.cloneNode(true);
        checkbox.parentNode.replaceChild(newCheckbox, checkbox);
        
        newCheckbox.addEventListener('change', function() {
            updateSelectedTags();
            collectFormData(); // 更新 portfolioData.tags
        });
    });
    
    // 初始更新已選標籤顯示
    updateSelectedTags();
}

// 更新已選標籤顯示
function updateSelectedTags() {
    const selectedTagsContainer = document.getElementById('selectedTags');
    const selectedTagsList = document.getElementById('selectedTagsList');
    
    if (!selectedTagsContainer || !selectedTagsList) return;
    
    // 獲取所有選中的標籤
    const checkedBoxes = document.querySelectorAll('input[name="tags"]:checked');
    const selectedTags = Array.from(checkedBoxes).map(cb => cb.value);
    
    if (selectedTags.length > 0) {
        selectedTagsContainer.style.display = 'block';
        selectedTagsList.innerHTML = selectedTags.map(tag => `
            <div class="selected-tag-item">
                <span>${tag}</span>
                <button type="button" class="tag-remove-btn" onclick="removeTagByValue('${tag}')" aria-label="移除標籤">×</button>
            </div>
        `).join('');
    } else {
        selectedTagsContainer.style.display = 'none';
        selectedTagsList.innerHTML = '';
    }
}

// 根據值移除標籤
function removeTagByValue(tagValue) {
    // 使用 value 屬性查找，因為 value 是原始標籤名稱
    const checkbox = document.querySelector(`input[name="tags"][value="${tagValue}"]`);
    if (checkbox) {
        checkbox.checked = false;
        updateSelectedTags();
        collectFormData(); // 更新 portfolioData.tags
    }
}

// 展開標籤區域（當AI生成標籤時）
function expandTagsSection() {
    const tagsContent = document.getElementById('tagsContent');
    const tagsHeader = document.getElementById('tagsHeader');
    
    if (tagsContent && tagsContent.style.display === 'none') {
        tagsContent.style.display = 'block';
        // 更新圖標
        const icons = tagsHeader?.querySelectorAll('i');
        icons?.forEach(icon => {
            if (icon.classList.contains('fa-chevron-down') || icon.classList.contains('fa-chevron-up')) {
                icon.className = 'fas fa-chevron-up';
                icon.style.color = '#718096';
            }
        });
    }
}

// 添加標籤（保留以兼容舊代碼）
function addTag() {
    const tagInput = document.getElementById('tagInput');
    if (!tagInput) return;
    
    const tag = tagInput.value.trim();
    
    if (tag && !portfolioData.tags.includes(tag)) {
        portfolioData.tags.push(tag);
        renderTags();
        tagInput.value = '';
    }
}

// 移除標籤（保留以兼容舊代碼）
function removeTag(index) {
    portfolioData.tags.splice(index, 1);
    renderTags();
}

// 渲染標籤（保留以兼容舊代碼）
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

// 測試函數
window.testUpload = function() {
    console.log('=== 測試上傳功能 ===');
    console.log('當前步驟:', currentStep);
    console.log('上傳檔案數量:', uploadedFiles.length);
    console.log('作品資料:', portfolioData);
    
    // 測試檔案添加
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    addFiles([testFile]);
    
    // 測試預覽更新
    setTimeout(() => {
        updatePreview();
    }, 1000);
};

// 測試資料夾上傳函數
window.testFolderUpload = function() {
    console.log('=== 測試資料夾上傳功能 ===');
    
    // 創建模擬的資料夾檔案
    const folderFiles = [
        new File(['content1'], 'folder1/file1.txt', { type: 'text/plain' }),
        new File(['content2'], 'folder1/file2.txt', { type: 'text/plain' }),
        new File(['content3'], 'folder1/subfolder/file3.txt', { type: 'text/plain' })
    ];
    
    // 為每個檔案添加 webkitRelativePath 屬性
    folderFiles.forEach(file => {
        file.webkitRelativePath = file.name;
    });
    
    addFiles(folderFiles, 'folder1', organizeFolderStructure(folderFiles));
    
    setTimeout(() => {
        updatePreview();
    }, 1000);
};

// 測試步驟切換功能
window.testStepNavigation = function() {
    console.log('=== 測試步驟切換功能 ===');
    
    // 填寫第一步驟資料
    const titleInput = document.getElementById('title');
    const categorySelect = document.getElementById('categoryFilter');
    const descriptionTextarea = document.getElementById('description');
    
    if (titleInput) titleInput.value = '測試作品標題';
    if (categorySelect) categorySelect.value = 'information';
    if (descriptionTextarea) descriptionTextarea.value = '這是一個測試作品描述';
    
    console.log('第一步驟資料已填寫');
    
    // 測試進入第二步驟
    setTimeout(() => {
        nextStep();
        console.log('已進入第二步驟，當前步驟:', currentStep);
        
        // 添加測試檔案
        const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
        addFiles([testFile]);
        
        // 測試進入第三步驟
        setTimeout(() => {
            nextStep();
            console.log('已進入第三步驟，當前步驟:', currentStep);
            console.log('預覽應該已更新');
        }, 1000);
    }, 1000);
};

// 測試預覽功能
window.testPreview = function() {
    console.log('=== 測試預覽功能 ===');
    
    // 確保有資料
    collectFormData();
    console.log('收集的資料:', portfolioData);
    console.log('上傳的檔案:', uploadedFiles);
    
    // 更新預覽
    updatePreview();
    console.log('預覽已更新');
};

// 測試完整流程
window.testFullFlow = function() {
    console.log('=== 測試完整上傳流程 ===');
    
    // 填寫第一步驟資料
    const titleInput = document.getElementById('title');
    const categorySelect = document.getElementById('categoryFilter');
    const descriptionTextarea = document.getElementById('description');
    
    if (titleInput) titleInput.value = '測試作品標題';
    if (categorySelect) categorySelect.value = 'information';
    if (descriptionTextarea) descriptionTextarea.value = '這是一個測試作品描述';
    
    console.log('第一步驟資料已填寫');
    
    // 測試進入第二步驟
    setTimeout(() => {
        nextStep();
        console.log('已進入第二步驟，當前步驟:', currentStep);
        
        // 填寫標籤
        const tagsInput = document.getElementById('tags');
        if (tagsInput) tagsInput.value = 'JavaScript, React, UI/UX';
        
        // 添加測試檔案
        const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
        addFiles([testFile]);
        
        // 測試進入第三步驟
        setTimeout(() => {
            nextStep();
            console.log('已進入第三步驟，當前步驟:', currentStep);
            
            // 設定發布狀態
            const statusSelect = document.getElementById('status');
            if (statusSelect) statusSelect.value = 'published';
            
            console.log('預覽應該已更新');
        }, 1000);
    }, 1000);
};


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

// 測試步驟切換功能
function testStepSwitch() {
    console.log('測試步驟切換功能...');
    
    // 檢查當前步驟
    console.log('當前步驟:', currentStep);
    
    // 檢查各步驟的顯示狀態
    const step1 = document.getElementById('step1Content');
    const step2 = document.getElementById('step2Content');
    const step3 = document.getElementById('step3Content');
    
    console.log('步驟1顯示狀態:', step1 ? step1.style.display : '未找到');
    console.log('步驟2顯示狀態:', step2 ? step2.style.display : '未找到');
    console.log('步驟3顯示狀態:', step3 ? step3.style.display : '未找到');
    
    // 強制切換到第二步驟
    if (currentStep === 1) {
        console.log('強制切換到第二步驟');
        currentStep = 2;
        updateStepDisplay();
        
        // 再次檢查顯示狀態
        setTimeout(() => {
            console.log('切換後步驟2顯示狀態:', step2 ? step2.style.display : '未找到');
            console.log('切換後步驟1顯示狀態:', step1 ? step1.style.display : '未找到');
        }, 100);
    }
}