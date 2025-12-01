/**
 * AI 服務 - 使用 Hugging Face Inference API
 * 提供作品描述生成和智能標籤生成功能
 * 完全免費，無需API金鑰
 */

class AIService {
    constructor() {
        // Hugging Face Inference API 端點（免費，無需API金鑰）
        // 使用公開的文本生成模型
        this.baseUrl = 'https://api-inference.huggingface.co/models';
        
        // 使用量統計（追蹤API調用）
        this.usageStats = {
            local: { description: 0, tags: 0 },
            huggingface: { description: 0, tags: 0 },
            daily: {}, // 按日期記錄
            lastReset: new Date().toDateString()
        };
        
        // 載入已保存的統計資料
        this.loadUsageStats();
        
        // 備用模型列表（如果一個失敗，嘗試下一個）
        // 優先使用支援中文的模型
        this.textGenerationModels = [
            'google/flan-t5-large',  // 更好的多語言支援，包括中文
            'google/flan-t5-base',  // 輕量級，快速響應
            'microsoft/DialoGPT-medium',  // 對話模型
            'gpt2'  // 備用模型（對中文支援較弱）
        ];
        
        // 文本分類模型（用於標籤生成）
        this.classificationModels = [
            'distilbert-base-uncased',  // 輕量級分類模型
            'bert-base-uncased'  // 備用模型
        ];
        
        // 技能關鍵字列表（用於標籤生成）
        this.skillKeywords = [
            'HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'Angular', 'TypeScript',
            'Node.js', 'Python', 'PHP', 'Java', 'C#', 'C++', 'Go', 'Rust',
            'UI', 'UX', '設計', 'Figma', 'Adobe', 'Photoshop', 'Illustrator',
            '資料庫', 'SQL', 'MySQL', 'MongoDB', 'PostgreSQL',
            '資料分析', '機器學習', '深度學習', 'AI', '數據分析',
            'iOS', 'Android', 'React Native', 'Flutter', 'Swift', 'Kotlin',
            'Git', 'GitHub', '版本控制', '專案管理', '敏捷開發',
            'SEO', '行銷', '數位行銷', '社群媒體', '內容行銷',
            '網路安全', '資訊安全', '滲透測試',
            '雲端', 'AWS', 'Azure', 'Docker', 'Kubernetes',
            '3D建模', 'Blender', 'Maya', 'Unity', 'Unreal Engine',
            '前端', '前端開發', '後端', '後端開發', '全端', '全端開發',
            '電商', '電子商務', '購物車', '支付', '金流', '物流',
            'API', 'RESTful', 'WebSocket', '微服務', '架構設計',
            '響應式設計', '行動優先', 'PWA', 'SPA', 'SSR'
        ];
        
        // 標題關鍵字到技能標籤的映射（智能推斷）
        this.titleToTagsMap = {
            '電商': ['前端開發', 'UI', 'UX', 'JavaScript', 'React', 'Vue', 'HTML', 'CSS', '電商', '電子商務'],
            '網站': ['前端開發', 'HTML', 'CSS', 'JavaScript', 'UI', 'UX', '響應式設計'],
            '系統': ['後端開發', '資料庫', 'API', '架構設計', 'Node.js', 'Python'],
            'App': ['React Native', 'Flutter', 'iOS', 'Android', '行動應用'],
            '平台': ['全端開發', '架構設計', 'API', '微服務', '雲端'],
            '分析': ['資料分析', 'Python', 'SQL', '數據分析', '商業分析'],
            '設計': ['UI', 'UX', 'Figma', '設計', '視覺設計', '品牌設計']
        };
    }

    /**
     * 生成作品描述
     * @param {string} title - 作品標題
     * @param {string} category - 作品分類
     * @param {boolean} returnMetadata - 是否返回元數據（包含來源資訊）
     * @returns {Promise<string|Object>} 生成的描述（或包含元數據的物件）
     */
    async generateDescription(title, category, returnMetadata = false) {
        const metadata = {
            source: 'local', // 'local' 或 'huggingface'
            model: null,
            timestamp: new Date().toISOString()
        };
        
        try {
            console.log('🤖 [AI服務] 開始生成作品描述...', { title, category });
            
            // 優先嘗試使用 Hugging Face API（更智能的 AI 生成）
            try {
                console.log('🌐 [AI服務] 優先嘗試使用 Hugging Face API...');
                const prompt = this.buildDescriptionPrompt(title, category);
                
                // 嘗試多個模型，直到找到可用的
                let apiDescription = null;
                let usedModel = null;
                
                for (const model of this.textGenerationModels) {
                    try {
                        apiDescription = await this.callTextGenerationAPI(prompt, model);
                        if (apiDescription && apiDescription.length > 20) {
                            usedModel = model;
                            break;
                        }
                    } catch (modelError) {
                        // 如果是模型載入中或超時，跳過該模型繼續嘗試下一個
                        if (modelError.message === 'MODEL_LOADING' || modelError.message === 'TIMEOUT') {
                            console.log(`⏳ [AI服務] 模型 ${model} ${modelError.message === 'MODEL_LOADING' ? '正在載入中' : '響應超時'}，嘗試下一個模型...`);
                        } else {
                            console.log(`⚠️ [AI服務] 模型 ${model} 調用失敗，嘗試下一個模型...`);
                        }
                        continue;
                    }
                }
                
                if (apiDescription && apiDescription.length > 20) {
                    metadata.source = 'huggingface';
                    metadata.model = usedModel;
                    this.recordUsage('huggingface', 'description');
                    console.log('✅ [AI服務] 使用 Hugging Face API 生成完成', { 
                        source: 'huggingface', 
                        model: usedModel,
                        descriptionLength: apiDescription.length 
                    });
                    
                    if (returnMetadata) {
                        return { description: apiDescription, metadata };
                    }
                    return apiDescription;
                } else {
                    console.log('⚠️ [AI服務] Hugging Face API 返回結果不理想，改用本地生成');
                }
            } catch (apiError) {
                console.log('❌ [AI服務] Hugging Face API 調用失敗，改用本地生成:', apiError.message);
            }
            
            // 備用方案：使用本地智能生成（更可靠，對中文支援更好）
            const description = this.generateDescriptionLocally(title, category);
            metadata.source = 'local';
            this.recordUsage('local', 'description');
            console.log('✅ [AI服務] 使用本地生成完成（備用方案）', { 
                source: 'local', 
                descriptionLength: description.length 
            });
            
            if (returnMetadata) {
                return { description, metadata };
            }
            return description;
        } catch (error) {
            console.error('❌ [AI服務] AI描述生成錯誤:', error);
            // 發生錯誤時使用本地生成邏輯
            metadata.source = 'local';
            this.recordUsage('local', 'description');
            const fallbackDescription = this.generateDescriptionLocally(title, category);
            
            if (returnMetadata) {
                return { description: fallbackDescription, metadata };
            }
            return fallbackDescription;
        }
    }

    /**
     * 生成智能標籤
     * @param {string} title - 作品標題
     * @param {string} description - 作品描述
     * @param {boolean} returnMetadata - 是否返回元數據（包含來源資訊）
     * @returns {Promise<Array<string>|Object>} 生成的標籤陣列（或包含元數據的物件）
     */
    async generateTags(title, description, returnMetadata = false) {
        const metadata = {
            source: 'local', // 'local' 或 'huggingface'
            method: 'keyword_matching', // 'keyword_matching' 或 'ai_analysis' 或 'title_inference'
            timestamp: new Date().toISOString()
        };
        
        try {
            console.log('🏷️ [AI服務] 開始生成智能標籤...', { title, description: description?.substring(0, 50) });
            
            // 組合文本
            const text = `${title} ${description}`.toLowerCase();
            const matchedTags = [];
            
            // 1. 先根據標題智能推斷標籤
            const inferredTags = this.inferTagsFromTitle(title);
            if (inferredTags.length > 0) {
                matchedTags.push(...inferredTags);
                metadata.method = 'title_inference';
                console.log(`🎯 [標題推斷] 從標題推斷出 ${inferredTags.length} 個標籤:`, inferredTags);
            }
            
            // 2. 從技能關鍵字列表中匹配
            const keywordTags = this.matchSkillKeywords(text);
            if (keywordTags.length > 0) {
                matchedTags.push(...keywordTags);
                // 如果還沒有從標題推斷，則標記為關鍵字匹配
                if (metadata.method === 'keyword_matching') {
                    metadata.method = 'keyword_matching';
                }
                console.log(`💻 [關鍵字匹配] 找到 ${keywordTags.length} 個匹配標籤:`, keywordTags);
            }
            
            // 3. 如果匹配的標籤太少，使用AI分析
            if (matchedTags.length < 3) {
                console.log('🤖 [AI服務] 標籤數量不足，嘗試使用AI分析...');
                const aiTags = await this.analyzeTextWithAI(text);
                if (aiTags && aiTags.length > 0) {
                    matchedTags.push(...aiTags);
                    metadata.method = 'ai_analysis';
                    console.log(`✅ [AI分析] 額外找到 ${aiTags.length} 個標籤:`, aiTags);
                }
            }
            
            // 記錄使用量（標籤生成主要使用本地匹配）
            this.recordUsage('local', 'tags');
            
            // 去重並限制數量
            const uniqueTags = [...new Set(matchedTags)].slice(0, 10);
            console.log(`✅ [AI服務] 標籤生成完成，共 ${uniqueTags.length} 個標籤`, { 
                source: metadata.source, 
                method: metadata.method,
                tags: uniqueTags 
            });
            
            if (returnMetadata) {
                return { tags: uniqueTags, metadata };
            }
            return uniqueTags;
        } catch (error) {
            console.error('❌ [AI服務] AI標籤生成錯誤:', error);
            // 發生錯誤時使用本地匹配邏輯
            metadata.source = 'local';
            metadata.method = 'keyword_matching';
            this.recordUsage('local', 'tags');
            const fallbackTags = this.matchSkillKeywords(`${title} ${description}`.toLowerCase());
            
            if (returnMetadata) {
                return { tags: fallbackTags, metadata };
            }
            return fallbackTags;
        }
    }

    /**
     * 調用文本生成API
     */
    async callTextGenerationAPI(prompt, model, timeout = 10000) {
        try {
            console.log(`🌐 [Hugging Face] 正在調用模型: ${model}`);
            const startTime = Date.now();
            
            // 創建超時控制器
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            try {
                const response = await fetch(`${this.baseUrl}/${model}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: prompt,
                        parameters: {
                            max_length: 200,  // 增加長度以生成更完整的描述
                            temperature: 0.8,  // 稍微提高創造性
                            do_sample: true,
                            top_p: 0.95,
                            repetition_penalty: 1.2  // 減少重複
                        }
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const responseTime = Date.now() - startTime;
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ [Hugging Face] API錯誤 ${response.status}:`, errorText);
                    
                    // 如果是模型正在載入，返回特殊標記
                    if (response.status === 503) {
                        console.log('⏳ [Hugging Face] 模型正在載入中，請稍候...');
                        throw new Error('MODEL_LOADING');
                    }
                    
                    throw new Error(`API錯誤: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                console.log(`✅ [Hugging Face] API調用成功 (耗時: ${responseTime}ms)`, { model, responseTime });
                
                // 處理不同的回應格式
                let generatedText = null;
                if (Array.isArray(data) && data[0]) {
                    if (data[0].generated_text) {
                        generatedText = data[0].generated_text;
                    } else if (data[0].summary_text) {
                        generatedText = data[0].summary_text;
                    }
                } else if (data.generated_text) {
                    generatedText = data.generated_text;
                } else if (typeof data === 'string') {
                    generatedText = data;
                }
                
                if (generatedText) {
                    // 清理生成的文本（移除提示詞部分，只保留生成的部分）
                    const cleanedText = generatedText.replace(prompt, '').trim();
                    return cleanedText.length > 10 ? cleanedText : generatedText.trim();
                }
                
                console.warn('⚠️ [Hugging Face] API返回格式未預期:', data);
                return null;
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    console.error(`⏱️ [Hugging Face] 模型 ${model} 調用超時 (${timeout}ms)`);
                    throw new Error('TIMEOUT');
                }
                throw fetchError;
            }
        } catch (error) {
            if (error.message === 'MODEL_LOADING' || error.message === 'TIMEOUT') {
                throw error; // 重新拋出特殊錯誤，讓調用者知道可以重試
            }
            console.error(`❌ [Hugging Face] 模型 ${model} 調用失敗:`, error);
            return null;
        }
    }

    /**
     * 根據標題智能推斷標籤
     */
    inferTagsFromTitle(title) {
        const inferred = [];
        const lowerTitle = title.toLowerCase();
        
        // 檢查標題關鍵字映射
        for (const [keyword, tags] of Object.entries(this.titleToTagsMap)) {
            if (lowerTitle.includes(keyword.toLowerCase())) {
                inferred.push(...tags);
                break; // 找到第一個匹配就停止
            }
        }
        
        return inferred;
    }

    /**
     * 使用AI分析文本
     */
    async analyzeTextWithAI(text) {
        // 由於Hugging Face的文本分類API較複雜，這裡使用關鍵字匹配
        // 實際應用中可以調用NER（命名實體識別）模型
        return this.matchSkillKeywords(text);
    }

    /**
     * 匹配技能關鍵字
     */
    matchSkillKeywords(text) {
        const matched = [];
        const lowerText = text.toLowerCase();
        
        this.skillKeywords.forEach(keyword => {
            const lowerKeyword = keyword.toLowerCase();
            if (lowerText.includes(lowerKeyword)) {
                matched.push(keyword);
            }
        });
        
        return matched;
    }
    
    /**
     * 獲取最後一次生成操作的元數據（用於調試）
     */
    getLastGenerationMetadata() {
        return this.lastMetadata || null;
    }

    /**
     * 構建描述生成提示詞
     */
    buildDescriptionPrompt(title, category) {
        const categoryMap = {
            'engineering': '工程',
            'information': '資訊',
            'info': '資訊', // 支援 'info' slug
            'business': '商管',
            'design': '設計',
            'education': '教育',
            'arts': '藝術',
            'humanities': '人文',
            'social': '社會',
            'science': '自然科學',
            'medicine': '醫藥衛生',
            'agriculture': '農業',
            'tourism': '觀光餐旅',
            'sports': '體育',
            'other': '其他'
        };
        
        const categoryName = categoryMap[category] || '作品';
        
        // 使用更簡潔且對 AI 模型友好的提示詞
        // 對於多語言模型，使用中英文混合提示詞效果更好
        return `Generate a professional description (50-100 words) for a ${categoryName} portfolio work.

Title: ${title}

The description should include:
1. Main features and highlights
2. Technologies or methods used
3. Value and significance

Description (in Traditional Chinese):`;
    }

    /**
     * 本地生成描述（智能生成，基於標題和分類）
     */
    generateDescriptionLocally(title, category) {
        console.log('💻 [本地生成] 開始生成描述...', { title, category });
        const categoryMap = {
            'engineering': { name: '工程學群', keywords: ['系統設計', '技術實現', '工程方法', '實務應用'] },
            'information': { name: '資訊學群', keywords: ['程式開發', '系統架構', '資訊技術', '數位化'] },
            'info': { name: '資訊學群', keywords: ['程式開發', '系統架構', '資訊技術', '數位化'] }, // 支援 'info' slug
            'business': { name: '商管學群', keywords: ['商業分析', '市場策略', '管理實務', '商業模式'] },
            'design': { name: '設計學群', keywords: ['視覺設計', '使用者體驗', '創意設計', '美學呈現'] },
            'education': { name: '教育學群', keywords: ['教學設計', '學習方法', '教育科技', '知識傳遞'] },
            'arts': { name: '藝術學群', keywords: ['藝術創作', '美學表現', '創意表達', '視覺藝術'] },
            'humanities': { name: '人文學群', keywords: ['人文思考', '文化研究', '社會觀察', '價值探討'] },
            'social': { name: '社會學群', keywords: ['社會分析', '社會議題', '社會服務', '社會影響'] },
            'science': { name: '自然科學學群', keywords: ['科學研究', '實驗分析', '數據驗證', '理論應用'] },
            'medicine': { name: '醫藥衛生學群', keywords: ['醫療應用', '健康照護', '醫學研究', '公共衛生'] },
            'agriculture': { name: '農業學群', keywords: ['農業技術', '永續發展', '生態保護', '農業創新'] },
            'tourism': { name: '觀光餐旅學群', keywords: ['服務設計', '體驗規劃', '餐飲管理', '觀光規劃'] },
            'sports': { name: '體育學群', keywords: ['運動科學', '訓練方法', '體能分析', '運動表現'] },
            'other': { name: '其他', keywords: ['創新應用', '跨領域整合', '實務專案', '綜合應用'] }
        };
        
        const categoryInfo = categoryMap[category] || categoryMap['other'];
        const categoryName = categoryInfo.name;
        const keywords = categoryInfo.keywords;
        
        // 從標題中提取關鍵字
        const titleKeywords = this.extractKeywordsFromTitle(title);
        
        // 選擇相關的關鍵字
        const selectedKeywords = this.selectRelevantKeywords(titleKeywords, keywords);
        
        // 生成多樣化的描述模板（categoryName 已經包含「學群」後綴）
        const templates = [
            `這是一個${categoryName}的優秀作品。${title}${selectedKeywords.length > 0 ? `在${selectedKeywords[0]}方面` : ''}展現了創新的思維和專業的技能。作品結合了理論與實務，具有很高的實用價值和學習意義，能夠有效解決實際問題並提供良好的使用者體驗。`,
            `${title}是一個精心設計的${categoryName}作品。作品${selectedKeywords.length > 0 ? `在${selectedKeywords[0]}和${selectedKeywords[1] || '功能設計'}方面` : '在技術實現和功能設計方面'}都表現出色，展現了作者的專業能力和創意思維。透過系統化的開發流程，確保了作品的品質和可用性。`,
            `本作品${title}屬於${categoryName}，展現了作者在該領域的專業素養。作品設計精良，功能完善，${selectedKeywords.length > 0 ? `特別在${selectedKeywords[0]}方面` : '在整體架構和實作細節方面'}具有很好的示範價值。透過實際應用驗證，證明了作品的實用性和有效性。`
        ];
        
        // 根據標題長度選擇模板（長標題用簡短描述，短標題用詳細描述）
        let selectedTemplate;
        if (title.length > 20) {
            selectedTemplate = templates[0]; // 較簡短
        } else if (title.length > 10) {
            selectedTemplate = templates[1]; // 中等
        } else {
            selectedTemplate = templates[2]; // 較詳細
        }
        
        return selectedTemplate;
    }
    
    /**
     * 從標題中提取關鍵字
     */
    extractKeywordsFromTitle(title) {
        const commonTechWords = ['系統', '應用', '平台', '網站', 'App', '程式', '設計', '分析', '管理', '服務', '工具', '框架', '資料庫', 'API', '介面'];
        const extracted = [];
        
        commonTechWords.forEach(word => {
            if (title.includes(word)) {
                extracted.push(word);
            }
        });
        
        return extracted;
    }
    
    /**
     * 選擇相關的關鍵字
     */
    selectRelevantKeywords(titleKeywords, categoryKeywords) {
        const selected = [];
        
        // 優先選擇標題中出現的關鍵字
        titleKeywords.forEach(keyword => {
            categoryKeywords.forEach(catKeyword => {
                if (catKeyword.includes(keyword) || keyword.includes(catKeyword)) {
                    if (!selected.includes(catKeyword)) {
                        selected.push(catKeyword);
                    }
                }
            });
        });
        
        // 如果沒有匹配，隨機選擇2-3個分類關鍵字
        if (selected.length === 0) {
            const shuffled = [...categoryKeywords].sort(() => 0.5 - Math.random());
            selected.push(...shuffled.slice(0, Math.min(2, shuffled.length)));
        }
        
        return selected;
    }
    
    /**
     * 記錄使用量統計
     */
    recordUsage(source, type) {
        const today = new Date().toDateString();
        
        // 如果日期改變，重置每日統計
        if (this.usageStats.lastReset !== today) {
            this.usageStats.daily = {};
            this.usageStats.lastReset = today;
        }
        
        // 更新統計
        this.usageStats[source][type]++;
        
        // 更新每日統計
        if (!this.usageStats.daily[today]) {
            this.usageStats.daily[today] = { local: 0, huggingface: 0 };
        }
        this.usageStats.daily[today][source]++;
        
        // 保存到 localStorage
        this.saveUsageStats();
        
        // 檢查每日限制（Hugging Face 免費層：每天 1000 次）
        const todayHuggingFaceUsage = this.usageStats.daily[today]?.huggingface || 0;
        if (source === 'huggingface' && todayHuggingFaceUsage >= 900) {
            console.warn(`⚠️ [使用量警告] 今日已使用 ${todayHuggingFaceUsage} 次 Hugging Face API，接近每日限制（1000次）`);
        }
    }
    
    /**
     * 保存使用量統計到 localStorage
     */
    saveUsageStats() {
        try {
            localStorage.setItem('aiService_usageStats', JSON.stringify(this.usageStats));
        } catch (error) {
            console.warn('無法保存使用量統計:', error);
        }
    }
    
    /**
     * 從 localStorage 載入使用量統計
     */
    loadUsageStats() {
        try {
            const saved = localStorage.getItem('aiService_usageStats');
            if (saved) {
                const parsed = JSON.parse(saved);
                const today = new Date().toDateString();
                
                // 如果日期改變，重置每日統計但保留總計
                if (parsed.lastReset !== today) {
                    this.usageStats.daily = {};
                    this.usageStats.lastReset = today;
                    // 保留總計統計
                    this.usageStats.local = parsed.local || { description: 0, tags: 0 };
                    this.usageStats.huggingface = parsed.huggingface || { description: 0, tags: 0 };
                } else {
                    this.usageStats = parsed;
                }
            }
        } catch (error) {
            console.warn('無法載入使用量統計:', error);
        }
    }
    
    /**
     * 獲取使用量統計
     */
    getUsageStats() {
        const today = new Date().toDateString();
        const todayStats = this.usageStats.daily[today] || { local: 0, huggingface: 0 };
        
        return {
            total: {
                local: {
                    description: this.usageStats.local.description,
                    tags: this.usageStats.local.tags,
                    total: this.usageStats.local.description + this.usageStats.local.tags
                },
                huggingface: {
                    description: this.usageStats.huggingface.description,
                    tags: this.usageStats.huggingface.tags,
                    total: this.usageStats.huggingface.description + this.usageStats.huggingface.tags
                }
            },
            today: {
                local: todayStats.local,
                huggingface: todayStats.huggingface,
                total: todayStats.local + todayStats.huggingface,
                limit: 1000, // Hugging Face 免費層每日限制
                remaining: Math.max(0, 1000 - todayStats.huggingface)
            },
            daily: this.usageStats.daily
        };
    }
    
    /**
     * 重置使用量統計
     */
    resetUsageStats() {
        this.usageStats = {
            local: { description: 0, tags: 0 },
            huggingface: { description: 0, tags: 0 },
            daily: {},
            lastReset: new Date().toDateString()
        };
        this.saveUsageStats();
        console.log('✅ [統計] 使用量統計已重置');
    }
    
    /**
     * 顯示使用量統計（在控制台）
     */
    showUsageStats() {
        const stats = this.getUsageStats();
        console.group('📊 AI 服務使用量統計');
        console.log('📈 總計統計:');
        console.log('  本地生成:', stats.total.local);
        console.log('  Hugging Face API:', stats.total.huggingface);
        console.log('📅 今日統計:');
        console.log('  本地生成:', stats.today.local, '次');
        console.log('  Hugging Face API:', stats.today.huggingface, '次 /', stats.today.limit, '次');
        console.log('  剩餘配額:', stats.today.remaining, '次');
        console.log('📊 使用率:', ((stats.today.huggingface / stats.today.limit) * 100).toFixed(2) + '%');
        console.groupEnd();
        return stats;
    }
}

// 創建全局實例
window.aiService = new AIService();

// 導出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIService;
}

