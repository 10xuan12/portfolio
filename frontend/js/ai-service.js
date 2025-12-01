/**
 * AI 服務 - 智能生成系統
 * 提供作品描述生成和智能標籤生成功能
 * 
 * 使用智能模板生成系統（基於規則和模板的智能生成）
 * - 快速：即時生成，無需等待
 * - 穩定：不依賴外部 API，100% 可用
 * - 精準：針對作品集場景優化，支援多種作品類型
 * - 中文友好：完全支援繁體中文
 * 
 * 註：這是基於規則和模板的智能生成系統，不是深度學習 AI 模型
 * 但已針對作品集描述生成場景進行深度優化，提供更好的用戶體驗
 */

class AIService {
    constructor() {
        // 使用量統計（只追蹤本地智能生成）
        this.usageStats = {
            local: { description: 0, tags: 0 },
            daily: {}, // 按日期記錄
            lastReset: new Date().toDateString()
        };
        
        // 載入已保存的統計資料
        this.loadUsageStats();
        
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
            '響應式設計', '行動優先', 'PWA', 'SPA', 'SSR',
            // 傳播媒體類
            '新聞', '採訪', '報導', '傳播', '媒體', '新聞寫作', '內容創作',
            '文案', '寫作', '內容行銷', '編輯', '文字', '文學創作',
            '影片製作', '剪輯', 'Premiere Pro', 'After Effects', '攝影',
            '動畫製作', '音訊處理', '音效設計'
        ];
        
        // 標題關鍵字到技能標籤的映射（智能推斷）
        // 注意：關鍵字按優先順序排列，更精確的匹配應該放在前面
        this.titleToTagsMap = {
            // ========== 技術語言優先匹配 ==========
            'JAVA': ['Java', '後端開發', '物件導向', 'API', '資料庫'],
            'Java': ['Java', '後端開發', '物件導向', 'API', '資料庫'],
            'Python': ['Python', '資料分析', '後端開發', 'API', '資料庫'],
            'JavaScript': ['JavaScript', '前端開發', 'Node.js', 'React', 'Vue'],
            'React': ['React', '前端開發', 'JavaScript', 'UI', 'UX'],
            'Vue': ['Vue', '前端開發', 'JavaScript', 'UI', 'UX'],
            'Angular': ['Angular', '前端開發', 'TypeScript', 'UI', 'UX'],
            'PHP': ['PHP', '後端開發', '資料庫', 'API'],
            'Node.js': ['Node.js', '後端開發', 'JavaScript', 'API'],
            'TypeScript': ['TypeScript', '前端開發', 'JavaScript'],
            'C#': ['C#', '後端開發', '.NET', 'API'],
            'Swift': ['Swift', 'iOS', '行動應用', '行動開發'],
            'Kotlin': ['Kotlin', 'Android', '行動應用', '行動開發'],
            
            // ========== 程式開發類 ==========
            '記帳': ['Java', '資料庫', '後端開發', '財務管理', '資料處理'],
            '電商': ['前端開發', 'UI', 'UX', 'JavaScript', 'React', 'Vue', 'HTML', 'CSS', '電商', '電子商務'],
            '網站': ['前端開發', 'HTML', 'CSS', 'JavaScript', 'UI', 'UX', '響應式設計'],
            '網頁': ['前端開發', 'HTML', 'CSS', 'JavaScript', 'UI', 'UX', '響應式設計'],
            '系統': ['後端開發', '資料庫', 'API', '架構設計', 'Node.js', 'Python'],
            '平台': ['全端開發', '架構設計', 'API', '微服務', '雲端'],
            '分析': ['資料分析', 'Python', 'SQL', '數據分析', '商業分析'],
            '資料分析': ['資料分析', 'Python', 'SQL', 'Excel', '數據分析'],
            '數據分析': ['資料分析', 'Python', 'SQL', 'Excel', '數據分析'],
            'API': ['API', '後端開發', 'RESTful', 'WebSocket'],
            '資料庫': ['資料庫', 'SQL', 'MySQL', 'MongoDB', 'PostgreSQL'],
            
            // ========== 行動應用 ==========
            '行動應用': ['React Native', 'Flutter', 'iOS', 'Android', '行動應用'],
            '手機': ['React Native', 'Flutter', 'iOS', 'Android', '行動應用'],
            '行動': ['React Native', 'Flutter', 'iOS', 'Android', '行動應用'],
            'APP': ['React Native', 'Flutter', 'iOS', 'Android', '行動應用'],
            
            // ========== 設計類 ==========
            '設計': ['UI', 'UX', 'Figma', '設計', '視覺設計', '品牌設計'],
            'UI': ['UI', 'UI設計', 'Figma', '視覺設計', '介面設計'],
            'UX': ['UX', 'UX設計', '使用者體驗', '使用者研究', '互動設計'],
            '視覺設計': ['視覺設計', 'UI', 'UX', 'Figma', 'Adobe'],
            '品牌設計': ['品牌設計', 'Logo設計', '視覺識別', '品牌識別'],
            'Logo': ['Logo設計', '品牌設計', '視覺識別', 'Illustrator'],
            '插畫': ['插畫', '繪圖', 'Illustrator', 'Procreate', '創意'],
            '繪圖': ['插畫', '繪圖', 'Illustrator', 'Procreate', '創意'],
            '3D': ['3D建模', 'Blender', 'Maya', '3ds Max', '3D設計'],
            '建模': ['3D建模', 'Blender', 'Maya', '3ds Max', '3D設計'],
            
            // ========== 多媒體類 ==========
            '攝影': ['攝影', 'Photoshop', 'Lightroom', '影像處理'],
            '影片': ['影片製作', 'Premiere Pro', 'After Effects', '剪輯'],
            '剪輯': ['影片製作', 'Premiere Pro', 'After Effects', '剪輯'],
            '動畫': ['動畫製作', 'After Effects', '動畫設計', 'Motion Graphics'],
            '音訊': ['音訊處理', '音效設計', '音樂製作'],
            
            // ========== 商管行銷類 ==========
            '行銷': ['數位行銷', '行銷', 'SEO', '內容行銷', '社群媒體'],
            '數位行銷': ['數位行銷', 'SEO', '內容行銷', '社群媒體', 'Google Analytics'],
            'SEO': ['SEO', '數位行銷', '內容行銷', 'Google Analytics'],
            '企劃': ['專案管理', '企劃', 'Scrum', '敏捷開發', '團隊協作'],
            '專案管理': ['專案管理', 'Scrum', '敏捷開發', '團隊協作'],
            '財務': ['財務管理', '會計', 'Excel', '資料分析', '商業分析'],
            '會計': ['財務管理', '會計', 'Excel', '資料分析'],
            '商業': ['商業分析', '市場策略', '商業模式', '數據分析'],
            '管理': ['專案管理', '團隊協作', '商業管理', '管理實務'],
            
            // ========== 文學傳播類 ==========
            '文案': ['文案', '內容創作', '寫作', '內容行銷'],
            '寫作': ['寫作', '內容創作', '文案', '文學創作'],
            '內容創作': ['內容創作', '文案', '寫作', '內容行銷'],
            '新聞': ['新聞', '採訪', '報導', '傳播', '媒體', '新聞寫作', '內容創作'],
            '報導': ['新聞', '採訪', '報導', '傳播', '媒體', '新聞寫作', '內容創作'],
            '記者': ['新聞', '採訪', '報導', '傳播', '媒體', '新聞寫作', '內容創作'],
            '傳播': ['傳播', '媒體', '新聞', '內容創作', '新聞寫作'],
            
            // ========== 遊戲開發 ==========
            '遊戲': ['遊戲開發', 'Unity', 'Unreal Engine', '遊戲設計'],
            'Unity': ['Unity', '遊戲開發', 'C#', '3D建模'],
            'Unreal': ['Unreal Engine', '遊戲開發', 'C++', '3D建模'],
            
            // ========== 其他專業領域 ==========
            '研究': ['研究', '數據分析', '科學研究', '實驗分析'],
            '實驗': ['實驗分析', '數據分析', '科學研究', '研究'],
            '報告': ['報告', '資料分析', '數據分析', '商業分析'],
            '論文': ['研究', '學術', '數據分析', '研究'],
            '學術': ['研究', '學術', '數據分析', '研究']
        };
        
        // 技術關鍵字優先級列表（用於從標題中提取技術）
        this.techKeywords = [
            // 程式語言
            'JAVA', 'Java', 'Python', 'JavaScript', 'React', 'Vue', 'Angular', 
            'PHP', 'Node.js', 'C#', 'C++', 'Swift', 'Kotlin', 'Go', 'Rust',
            'HTML', 'CSS', 'TypeScript', 'MySQL', 'MongoDB', 'PostgreSQL',
            // 框架和工具
            'React Native', 'Flutter', 'Django', 'Flask', 'Laravel', 'Spring',
            'Express', 'Next.js', 'Nuxt.js', 'Svelte', 'Tailwind', 'Bootstrap',
            // 設計工具
            'Figma', 'Adobe', 'Photoshop', 'Illustrator', 'After Effects', 'Premiere',
            'Blender', 'Maya', '3ds Max', 'Unity', 'Unreal Engine',
            // 資料庫和工具
            'Redis', 'Firebase', 'AWS', 'Azure', 'Docker', 'Kubernetes',
            'Git', 'GitHub', 'Excel', 'PowerBI', 'Tableau'
        ];
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
            source: 'local', // 統一為本地智能生成
            model: 'smart_template',
            timestamp: new Date().toISOString()
        };
        
        try {
            console.log('🤖 [AI服務] 開始生成作品描述...', { title, category });
            
            // 直接使用本地智能生成（快速、穩定、完全支援繁體中文）
            const description = this.generateDescriptionLocally(title, category);
            metadata.source = 'local';
            metadata.model = 'smart_template'; // 標記為本地智能模板生成
            this.recordUsage('local', 'description');
            console.log('✅ [AI服務] 使用本地智能生成完成', { 
                source: 'local', 
                model: 'smart_template',
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
            source: 'local',
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

    // （遠端 Hugging Face 與後端代理調用已移除，僅使用本地智能生成）

    /**
     * 根據標題智能推斷標籤
     */
    inferTagsFromTitle(title) {
        const inferred = [];
        const lowerTitle = title.toLowerCase();
        const upperTitle = title.toUpperCase();
        
        // 1. 優先檢查技術關鍵字（精確匹配）
        const foundTech = [];
        for (const tech of this.techKeywords) {
            const techLower = tech.toLowerCase();
            const techUpper = tech.toUpperCase();
            // 檢查是否包含技術關鍵字（作為單詞，避免部分匹配）
            if (lowerTitle.includes(techLower) || upperTitle.includes(techUpper)) {
                // 確保是完整單詞匹配（避免 "JavaScript" 匹配到 "Java"）
                const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (regex.test(title)) {
                    foundTech.push(tech);
                }
            }
        }
        
        // 如果找到技術關鍵字，優先使用技術相關標籤
        if (foundTech.length > 0) {
            // 為每個找到的技術添加相關標籤
            foundTech.forEach(tech => {
                if (this.titleToTagsMap[tech]) {
                    inferred.push(...this.titleToTagsMap[tech]);
                } else {
                    // 如果沒有預定義映射，添加技術本身
                    inferred.push(tech);
                }
            });
        }
        
        // 2. 檢查應用類型關鍵字（需要更精確的匹配，按優先順序）
        // 優先檢查新聞/傳播類（避免被其他關鍵字誤匹配）
        const journalismKeywords = ['記者', '報導', '新聞', '傳播', '採訪'];
        for (const keyword of journalismKeywords) {
            if (lowerTitle.includes(keyword.toLowerCase())) {
                if (this.titleToTagsMap[keyword]) {
                    this.titleToTagsMap[keyword].forEach(tag => {
                        if (!inferred.includes(tag)) {
                            inferred.push(tag);
                        }
                    });
                    break;
                }
            }
        }
        
        // 如果已經找到新聞/傳播類標籤，跳過其他匹配
        if (inferred.length === 0) {
            const appTypeKeywords = ['記帳', '電商', '網站', '系統', '平台', '分析', '設計', '行動應用', '手機', '行動'];
            
            for (const keyword of appTypeKeywords) {
                // 使用更精確的匹配（避免 "APP" 匹配到 "App"）
                if (title.includes(keyword)) {
                    // 檢查是否是完整詞組匹配
                    const keywordLower = keyword.toLowerCase();
                    const keywordIndex = lowerTitle.indexOf(keywordLower);
                    
                    // 確保是完整詞組（前後不是字母或數字）
                    const before = keywordIndex > 0 ? title[keywordIndex - 1] : '';
                    const after = keywordIndex + keyword.length < title.length ? title[keywordIndex + keyword.length] : '';
                    const isWordBoundary = !/[a-zA-Z0-9]/.test(before) && !/[a-zA-Z0-9]/.test(after);
                    
                    if (isWordBoundary && this.titleToTagsMap[keyword]) {
                        // 合併標籤，避免重複
                        this.titleToTagsMap[keyword].forEach(tag => {
                            if (!inferred.includes(tag)) {
                                inferred.push(tag);
                            }
                        });
                        break; // 找到第一個匹配就停止
                    }
                }
            }
        }
        
        // 3. 如果沒有找到技術關鍵字，檢查通用關鍵字
        if (inferred.length === 0) {
            for (const [keyword, tags] of Object.entries(this.titleToTagsMap)) {
                // 跳過技術關鍵字（已經處理過）
                if (this.techKeywords.includes(keyword)) {
                    continue;
                }
                
                if (lowerTitle.includes(keyword.toLowerCase())) {
                    inferred.push(...tags);
                    break; // 找到第一個匹配就停止
                }
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
            'mass-communication': '大眾傳播',
            'mass_communication': '大眾傳播',
            'communication': '傳播',
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
            'engineering': { name: '工程學群', keywords: ['系統設計', '技術實現', '工程方法', '實務應用'], tech: ['系統架構', '技術整合', '工程實務'] },
            'information': { name: '資訊學群', keywords: ['程式開發', '系統架構', '資訊技術', '數位化'], tech: ['前端開發', '後端開發', '資料庫設計', 'API開發'] },
            'info': { name: '資訊學群', keywords: ['程式開發', '系統架構', '資訊技術', '數位化'], tech: ['前端開發', '後端開發', '資料庫設計', 'API開發'] },
            'business': { name: '商管學群', keywords: ['商業分析', '市場策略', '管理實務', '商業模式'], tech: ['數據分析', '市場研究', '商業規劃'] },
            'design': { name: '設計學群', keywords: ['視覺設計', '使用者體驗', '創意設計', '美學呈現'], tech: ['UI設計', 'UX設計', '視覺傳達', '品牌設計'] },
            'education': { name: '教育學群', keywords: ['教學設計', '學習方法', '教育科技', '知識傳遞'], tech: ['教學平台', '學習系統', '教育科技'] },
            'arts': { name: '藝術學群', keywords: ['藝術創作', '美學表現', '創意表達', '視覺藝術'], tech: ['視覺藝術', '創意設計', '藝術表現'] },
            'humanities': { name: '人文學群', keywords: ['人文思考', '文化研究', '社會觀察', '價值探討'], tech: ['文化研究', '社會分析', '人文應用'] },
            'social': { name: '社會學群', keywords: ['社會分析', '社會議題', '社會服務', '社會影響'], tech: ['社會研究', '社會服務', '社會分析'] },
            'science': { name: '自然科學學群', keywords: ['科學研究', '實驗分析', '數據驗證', '理論應用'], tech: ['科學計算', '數據分析', '實驗設計'] },
            'medicine': { name: '醫藥衛生學群', keywords: ['醫療應用', '健康照護', '醫學研究', '公共衛生'], tech: ['醫療系統', '健康管理', '醫學資訊'] },
            'agriculture': { name: '農業學群', keywords: ['農業技術', '永續發展', '生態保護', '農業創新'], tech: ['農業科技', '環境監測', '永續技術'] },
            'tourism': { name: '觀光餐旅學群', keywords: ['服務設計', '體驗規劃', '餐飲管理', '觀光規劃'], tech: ['服務系統', '體驗設計', '管理平台'] },
            'sports': { name: '體育學群', keywords: ['運動科學', '訓練方法', '體能分析', '運動表現'], tech: ['運動分析', '訓練系統', '體能監測'] },
            'mass-communication': { name: '大眾傳播學群', keywords: ['新聞採訪', '報導寫作', '媒體製作', '傳播策略'], tech: ['新聞寫作', '媒體製作', '內容創作', '傳播規劃'] },
            'mass_communication': { name: '大眾傳播學群', keywords: ['新聞採訪', '報導寫作', '媒體製作', '傳播策略'], tech: ['新聞寫作', '媒體製作', '內容創作', '傳播規劃'] },
            'communication': { name: '傳播學群', keywords: ['新聞採訪', '報導寫作', '媒體製作', '傳播策略'], tech: ['新聞寫作', '媒體製作', '內容創作', '傳播規劃'] },
            'other': { name: '其他', keywords: ['創新應用', '跨領域整合', '實務專案', '綜合應用'], tech: ['創新技術', '跨領域', '綜合應用'] }
        };
        
        const categoryInfo = categoryMap[category] || categoryMap['other'];
        const categoryName = categoryInfo.name;
        const keywords = categoryInfo.keywords;
        const techKeywords = categoryInfo.tech;
        
        // 從標題中提取關鍵字和技術相關詞
        const titleKeywords = this.extractKeywordsFromTitle(title);
        const titleTechWords = this.extractTechWordsFromTitle(title);
        
        // 選擇相關的關鍵字和技術詞
        const selectedKeywords = this.selectRelevantKeywords(titleKeywords, keywords);
        const selectedTech = this.selectRelevantKeywords(titleTechWords, techKeywords);
        
        // 根據標題內容智能生成描述（傳入 category 以便判斷類型）
        let description = this.buildSmartDescription(title, categoryName, selectedKeywords, selectedTech, titleKeywords, category);
        
        return description;
    }
    
    /**
     * 從標題中提取技術相關詞
     */
    extractTechWordsFromTitle(title) {
        const techWords = {
            '網站': ['前端開發', 'HTML', 'CSS', 'JavaScript', '響應式設計'],
            '電商': ['前端開發', 'UI', 'UX', '電子商務', '購物車', '支付系統'],
            '系統': ['後端開發', '資料庫', 'API', '系統架構'],
            'App': ['行動應用', 'React Native', 'Flutter', 'iOS', 'Android'],
            '平台': ['全端開發', '雲端服務', '微服務', 'API'],
            '設計': ['UI設計', 'UX設計', '視覺設計', 'Figma'],
            '分析': ['數據分析', 'Python', 'SQL', '商業分析'],
            '管理': ['管理系統', '資料庫', '後端開發', 'API']
        };
        
        const extracted = [];
        const lowerTitle = title.toLowerCase();
        
        for (const [keyword, techs] of Object.entries(techWords)) {
            if (lowerTitle.includes(keyword)) {
                extracted.push(...techs);
            }
        }
        
        return extracted;
    }
    
    /**
     * 智能構建描述（增強版：更自然、更多樣、更精準）
     */
    buildSmartDescription(title, categoryName, keywords, techWords, titleKeywords, category = '') {
        // 添加多樣化的開頭和結尾模板
        const openings = [
            `${title}是`,
            `本作品${title}是`,
            `這是一個`,
            `作品${title}展現了`,
            `${title}作為一個`
        ];
        
        const connectors = [
            '，', '。', '；', '，同時', '，並且', '，此外'
        ];
        
        const endings = [
            '，展現了作品的專業水準和實用價值。',
            '，證明了作品的技術實力和創新能力。',
            '，體現了作者在該領域的專業素養。',
            '，為使用者提供了優質的解決方案。',
            '，展現了作品的實用性和創新價值。',
            '，證明了作品的專業品質和技術水準。'
        ];
        
        // 隨機選擇開頭和結尾，增加多樣性
        const opening = openings[Math.floor(Math.random() * openings.length)];
        const ending = endings[Math.floor(Math.random() * endings.length)];
        // 檢測作品類型（按優先順序，更精確的匹配在前）
        const lowerTitle = title.toLowerCase();
        
        // 程式開發類
        const isAccounting = lowerTitle.includes('記帳') || lowerTitle.includes('會計') || lowerTitle.includes('帳務');
        const isWebsite = lowerTitle.includes('網站') || lowerTitle.includes('網頁') || lowerTitle.includes('web');
        const isEcommerce = lowerTitle.includes('電商') || lowerTitle.includes('購物') || lowerTitle.includes('商城');
        const isApp = (lowerTitle.includes('app') && !lowerTitle.includes('記帳app')) || 
                      (lowerTitle.includes('應用') && !lowerTitle.includes('記帳應用')) ||
                      lowerTitle.includes('行動應用') || lowerTitle.includes('手機');
        const isSystem = lowerTitle.includes('系統') || lowerTitle.includes('平台') || lowerTitle.includes('管理');
        const isDataAnalysis = lowerTitle.includes('分析') || lowerTitle.includes('資料分析') || lowerTitle.includes('數據分析');
        const isGame = lowerTitle.includes('遊戲') || lowerTitle.includes('game') || lowerTitle.includes('unity') || lowerTitle.includes('unreal');
        
        // 設計類
        const isDesign = lowerTitle.includes('設計') || lowerTitle.includes('ui') || lowerTitle.includes('ux');
        const isBrandDesign = lowerTitle.includes('品牌') || lowerTitle.includes('logo') || lowerTitle.includes('識別');
        const isIllustration = lowerTitle.includes('插畫') || lowerTitle.includes('繪圖') || lowerTitle.includes('繪畫');
        const is3D = lowerTitle.includes('3d') || lowerTitle.includes('建模') || lowerTitle.includes('blender') || lowerTitle.includes('maya');
        
        // 多媒體類
        const isPhotography = lowerTitle.includes('攝影') || lowerTitle.includes('photo') || lowerTitle.includes('photography');
        const isVideo = lowerTitle.includes('影片') || lowerTitle.includes('video') || lowerTitle.includes('剪輯') || lowerTitle.includes('premiere');
        const isAnimation = lowerTitle.includes('動畫') || lowerTitle.includes('animation') || lowerTitle.includes('after effects');
        const isAudio = lowerTitle.includes('音訊') || lowerTitle.includes('audio') || lowerTitle.includes('音效');
        
        // 商管行銷類
        const isMarketing = lowerTitle.includes('行銷') || lowerTitle.includes('marketing') || lowerTitle.includes('seo') || lowerTitle.includes('數位行銷');
        const isProjectManagement = lowerTitle.includes('專案') || lowerTitle.includes('企劃') || lowerTitle.includes('project') || lowerTitle.includes('scrum');
        const isFinance = lowerTitle.includes('財務') || lowerTitle.includes('finance') || lowerTitle.includes('會計') || lowerTitle.includes('accounting');
        const isBusiness = lowerTitle.includes('商業') || lowerTitle.includes('business') || lowerTitle.includes('管理');
        
        // 文學傳播類
        const isWriting = lowerTitle.includes('文案') || lowerTitle.includes('寫作') || lowerTitle.includes('writing') || lowerTitle.includes('內容創作');
        const isJournalism = lowerTitle.includes('新聞') || lowerTitle.includes('journalism') || lowerTitle.includes('報導') || lowerTitle.includes('傳播');
        
        // 研究學術類
        const isResearch = lowerTitle.includes('研究') || lowerTitle.includes('research') || lowerTitle.includes('實驗') || lowerTitle.includes('論文');
        
        let description = '';
        
        // 為新聞/傳播類作品添加專門處理
        if (isJournalism || category === 'mass-communication' || category === 'mass_communication' || category === 'communication') {
        const templates = [
                () => {
                    return `${opening}專業的新聞報導${categoryName}作品${connectors[0]}展現了優秀的新聞採訪和報導寫作能力。作品透過深入的採訪和嚴謹的資料收集，呈現出具有新聞價值和社會意義的報導內容。在${keywords.length > 0 ? keywords[0] : '新聞寫作'}和${keywords.length > 1 ? keywords[1] : '內容呈現'}方面，運用了專業的新聞寫作技巧和媒體製作方法，確保報導能夠準確傳達訊息並引起讀者共鳴。透過完整的採訪、寫作和編輯流程，作品展現了良好的新聞素養和專業水準${ending}`;
                },
                () => {
                    return `本新聞報導${categoryName}作品${title}${connectors[0]}結合了新聞專業素養和創意思維，${keywords.length > 0 ? `在${keywords[0]}方面` : '在報導寫作方面'}表現出色。作品透過系統化的採訪方法和嚴謹的資料驗證，創造出具有深度和廣度的新聞報導。${keywords.length > 1 ? `特別在${keywords[1]}方面，` : ''}運用了專業的新聞寫作技巧和媒體呈現方法，確保報導能夠有效傳達訊息並產生社會影響。經過完整的採訪和編輯流程，作品展現了優秀的新聞價值和專業水準${ending}`;
                }
            ];
            description = templates[Math.floor(Math.random() * templates.length)]();
            return description;
        }
        
        // 根據作品類型生成特定描述（按優先順序，使用更自然的語言）
        if (isAccounting) {
            // 多樣化的描述模板
            const templates = [
                () => {
                    const tech = this.inferTechFromTitle(title, ['Java', '資料庫', '後端開發']);
                    const techStr = (tech && tech.length > 0) ? `（${tech.join('、')}）` : '';
                    return `${opening}一個功能完整的記帳管理${categoryName}作品${connectors[0]}採用穩定的後端技術架構${techStr}，實現了帳務記錄、分類管理、統計分析等核心功能。在${keywords.length > 0 ? keywords[0] : '資料處理'}和${keywords.length > 1 ? keywords[1] : '資料庫設計'}方面，運用了高效的資料結構和查詢優化技術，確保系統能夠快速且準確地處理大量財務資料。透過完整的開發流程和實際測試驗證，系統展現了良好的準確性和實用性${ending}`;
                },
                () => {
                    const tech = this.inferTechFromTitle(title, ['Java', '資料庫', '後端開發']);
                    const techStr = (tech && tech.length > 0) ? tech[0] : '現代化';
                    return `${opening}專業的記帳管理${categoryName}系統${connectors[0]}整合了${techStr}技術架構，提供完整的財務管理解決方案。系統核心功能包括帳務記錄、分類管理、統計分析等，${keywords.length > 0 ? `特別在${keywords[0]}方面` : '在資料處理方面'}採用優化的演算法，能夠高效處理複雜的財務數據。經過嚴謹的開發和測試流程，確保了系統的可靠性和實用價值${ending}`;
                },
                () => {
                    return `本記帳管理${categoryName}作品${title}${connectors[0]}以穩定的技術架構為基礎，實現了完整的財務管理功能。系統在${keywords.length > 0 ? keywords[0] : '資料處理'}方面表現出色，透過智能化的資料結構設計和查詢優化，能夠快速響應使用者的各種需求。${keywords.length > 1 ? `在${keywords[1]}方面，` : ''}系統展現了良好的擴展性和維護性，為使用者提供了一個可靠且易用的記帳解決方案${ending}`;
                }
            ];
            description = templates[Math.floor(Math.random() * templates.length)]();
        } else if (isPhotography) {
            const templates = [
                () => {
                    const styles = ['光影運用', '構圖技巧', '色彩調配', '景深控制', '視覺敘事'];
                    const style = styles[Math.floor(Math.random() * styles.length)];
                    return `${opening}專業的攝影${categoryName}作品${connectors[0]}展現了優秀的攝影技巧和視覺美感。透過精心的${style}和創意構思，創造出具有深刻藝術價值的影像作品。在${keywords.length > 0 ? keywords[0] : '影像處理'}方面，運用了專業的後製技術和色彩調整技巧，確保作品能夠傳達豐富的情感和強烈的視覺衝擊力。作品不僅展現了技術的純熟，更體現了對美學的深刻理解${ending}`;
                },
                () => {
                    return `這組攝影${categoryName}作品${title}${connectors[0]}透過獨特的視角捕捉生活中的美好瞬間。作品在${keywords.length > 0 ? keywords[0] : '視覺呈現'}和${keywords.length > 1 ? keywords[1] : '影像處理'}方面表現出色，運用了專業的攝影技術和後製技巧，創造出既真實又富有藝術感的影像。每張作品都經過精心構思和後期處理，展現了作者對光影、構圖和色彩的敏銳感知${ending}`;
                }
            ];
            description = templates[Math.floor(Math.random() * templates.length)]();
        } else if (isVideo) {
            description = `${title}是一個精心製作的影片${categoryName}作品。`;
            description += `作品結合了創意構思和專業技術，實現了流暢的敘事節奏和視覺效果。`;
            description += `在${keywords.length > 0 ? keywords[0] : '影片製作'}和${keywords.length > 1 ? keywords[1] : '後製剪輯'}方面，`;
            description += `運用了專業的剪輯技巧和特效處理，確保作品能夠有效傳達訊息並吸引觀眾。`;
            description += `透過完整的製作流程和專業呈現，展現了作品的創意價值和技術水準。`;
        } else if (isAnimation) {
            description = `${title}是一個創意十足的動畫${categoryName}作品。`;
            description += `作品展現了優秀的動畫設計能力和視覺創意，透過流暢的動態效果和精緻的視覺呈現，創造出引人入勝的動畫作品。`;
            description += `在${keywords.length > 0 ? keywords[0] : '動畫製作'}和${keywords.length > 1 ? keywords[1] : '視覺設計'}方面，`;
            description += `運用了專業的動畫技術和創意構思，確保作品能夠有效傳達故事和情感。`;
            description += `透過完整的製作流程和專業呈現，展現了作品的創意價值和技術水準。`;
        } else if (isIllustration) {
            description = `${title}是一個富有創意的插畫${categoryName}作品。`;
            description += `作品展現了優秀的繪畫技巧和藝術表現力，透過獨特的風格和色彩運用，創造出具有個人特色的視覺作品。`;
            description += `在${keywords.length > 0 ? keywords[0] : '視覺設計'}和${keywords.length > 1 ? keywords[1] : '創意表達'}方面，`;
            description += `運用了專業的繪畫技術和設計理念，確保作品能夠有效傳達創意和美感。`;
            description += `透過完整的創作流程和專業呈現，展現了作品的藝術價值和創意水準。`;
        } else if (is3D) {
            description = `${title}是一個專業的3D建模${categoryName}作品。`;
            description += `作品展現了優秀的3D建模技術和空間設計能力，透過精細的模型建構和材質渲染，創造出具有視覺衝擊力的3D作品。`;
            description += `在${keywords.length > 0 ? keywords[0] : '3D建模'}和${keywords.length > 1 ? keywords[1] : '視覺呈現'}方面，`;
            description += `運用了專業的建模技術和渲染技巧，確保作品能夠展現精緻的細節和真實的質感。`;
            description += `透過完整的製作流程和專業呈現，展現了作品的技術價值和藝術水準。`;
        } else if (isBrandDesign) {
            description = `${title}是一個專業的品牌設計${categoryName}作品。`;
            description += `作品展現了優秀的品牌識別設計能力和視覺傳達技巧，透過統一的視覺風格和創意構思，創造出具有識別度的品牌形象。`;
            description += `在${keywords.length > 0 ? keywords[0] : '品牌設計'}和${keywords.length > 1 ? keywords[1] : '視覺識別'}方面，`;
            description += `運用了專業的設計理念和視覺技巧，確保作品能夠有效傳達品牌價值和形象。`;
            description += `透過完整的設計流程和專業呈現，展現了作品的設計價值和商業價值。`;
        } else if (isMarketing) {
            description = `${title}是一個專業的行銷企劃${categoryName}作品。`;
            description += `作品展現了優秀的行銷策略規劃能力和市場分析技巧，透過系統化的行銷方案和創意執行，創造出具有實效的行銷成果。`;
            description += `在${keywords.length > 0 ? keywords[0] : '行銷策略'}和${keywords.length > 1 ? keywords[1] : '市場分析'}方面，`;
            description += `運用了專業的行銷理論和實務經驗，確保方案能夠有效達成行銷目標。`;
            description += `透過完整的企劃流程和實際執行，展現了作品的策略價值和實務價值。`;
        } else if (isProjectManagement) {
            description = `${title}是一個專業的專案管理${categoryName}作品。`;
            description += `作品展現了優秀的專案規劃能力和團隊協作技巧，透過系統化的管理方法和工具運用，確保專案能夠順利執行並達成目標。`;
            description += `在${keywords.length > 0 ? keywords[0] : '專案規劃'}和${keywords.length > 1 ? keywords[1] : '團隊協作'}方面，`;
            description += `運用了專業的管理理論和實務經驗，確保專案能夠有效管理和執行。`;
            description += `透過完整的專案流程和實際執行，展現了作品的管理價值和實務價值。`;
        } else if (isDataAnalysis) {
            description = `${title}是一個專業的資料分析${categoryName}作品。`;
            description += `作品展現了優秀的數據處理能力和分析技巧，透過系統化的分析方法和視覺化呈現，從數據中挖掘出有價值的洞察。`;
            description += `在${keywords.length > 0 ? keywords[0] : '數據分析'}和${keywords.length > 1 ? keywords[1] : '視覺化呈現'}方面，`;
            description += `運用了專業的分析工具和方法，確保分析結果能夠有效支持決策。`;
            description += `透過完整的分析流程和專業呈現，展現了作品的數據價值和決策支持價值。`;
        } else if (isGame) {
            description = `${title}是一個專業的遊戲開發${categoryName}作品。`;
            description += `作品展現了優秀的遊戲設計能力和程式開發技巧，透過創新的遊戲機制和流暢的遊戲體驗，創造出具有娛樂價值的遊戲作品。`;
            description += `在${keywords.length > 0 ? keywords[0] : '遊戲設計'}和${keywords.length > 1 ? keywords[1] : '程式開發'}方面，`;
            description += `運用了專業的遊戲引擎和開發技術，確保遊戲能夠提供良好的玩家體驗。`;
            description += `透過完整的開發流程和測試驗證，展現了作品的創意價值和技術水準。`;
        } else if (isWriting) {
            description = `${title}是一個專業的文案寫作${categoryName}作品。`;
            description += `作品展現了優秀的文字表達能力和創意思維，透過精準的文字運用和創意構思，創造出具有說服力和感染力的文案作品。`;
            description += `在${keywords.length > 0 ? keywords[0] : '內容創作'}和${keywords.length > 1 ? keywords[1] : '文字表達'}方面，`;
            description += `運用了專業的寫作技巧和創意思維，確保文案能夠有效傳達訊息並引起共鳴。`;
            description += `透過完整的創作流程和專業呈現，展現了作品的文字價值和創意水準。`;
        } else if (isResearch) {
            description = `${title}是一個專業的研究${categoryName}作品。`;
            description += `作品展現了優秀的研究能力和學術素養，透過系統化的研究方法和嚴謹的數據分析，得出具有學術價值的研究成果。`;
            description += `在${keywords.length > 0 ? keywords[0] : '研究方法'}和${keywords.length > 1 ? keywords[1] : '數據分析'}方面，`;
            description += `運用了專業的研究理論和方法，確保研究結果具有可信度和學術價值。`;
            description += `透過完整的研究流程和學術呈現，展現了作品的學術價值和研究水準。`;
        } else if (isEcommerce) {
            const tech = this.inferTechFromTitle(title, ['前端開發', 'React', 'Vue', 'JavaScript', 'HTML', 'CSS']);
            const templates = [
                () => {
                    const techStr = (tech && tech.length > 0) ? tech[0] : '前端';
                    return `${opening}功能完整的電子商務${categoryName}平台${connectors[0]}採用現代化的${techStr}技術架構，實現了商品展示、購物車管理、訂單處理、支付整合等完整的電商功能。在${keywords.length > 0 ? keywords[0] : '系統架構'}方面，運用了響應式設計和優化的使用者體驗設計，確保在不同裝置上都能提供流暢且直觀的購物體驗。系統經過完整的開發、測試和優化流程，展現了良好的穩定性和實用性${ending}`;
                },
                () => {
                    const techStr = (tech && tech.length > 0) ? tech.join('、') : '現代化前端技術';
                    return `本電商${categoryName}作品${title}${connectors[0]}整合了${techStr}，打造了一個功能豐富且易用的購物平台。系統核心功能包括商品管理、購物車、訂單處理等，${keywords.length > 0 ? `特別在${keywords[0]}方面` : '在用戶體驗方面'}採用了響應式設計和優化的互動流程，為使用者提供流暢的購物體驗。透過實際部署和用戶反饋，證明了系統的實用價值和技術水準${ending}`;
                }
            ];
            description = templates[Math.floor(Math.random() * templates.length)]();
        } else if (isWebsite) {
            const tech = this.inferTechFromTitle(title, ['HTML', 'CSS', 'JavaScript', '前端開發']);
            const templates = [
                () => {
                    const techStr = (tech && tech.length > 0) ? tech.slice(0, 2).join('、') : '前端';
                    return `${opening}精心設計的${categoryName}網站作品${connectors[0]}結合了現代化的${techStr}技術，實現了美觀的視覺設計和流暢的互動體驗。在${keywords.length > 0 ? keywords[0] : '前端開發'}和${keywords.length > 1 ? keywords[1] : '使用者體驗'}方面，運用了響應式設計原則和現代化的前端框架，確保網站在各種裝置上都能完美呈現。透過完整的開發流程和測試驗證，網站展現了良好的專業品質和實用價值${ending}`;
                },
                () => {
                    const techStr = (tech && tech.length > 0) ? tech.join('、') : '現代前端技術';
                    return `本網站${categoryName}作品${title}${connectors[0]}採用${techStr}打造，注重視覺美感和使用者體驗的平衡。${keywords.length > 0 ? `在${keywords[0]}方面，` : ''}網站運用了響應式設計和優化的互動流程，為使用者提供流暢且直觀的瀏覽體驗。經過完整的設計、開發和測試流程，作品展現了優秀的技術實力和設計水準${ending}`;
                }
            ];
            description = templates[Math.floor(Math.random() * templates.length)]();
        } else if (isApp) {
            const tech = this.inferTechFromTitle(title, ['React Native', 'Flutter', '行動應用']);
            const templates = [
                () => {
                    const techStr = (tech && tech.length > 0) ? tech[0] : '跨平台';
                    return `${opening}功能豐富的${categoryName}行動應用作品${connectors[0]}採用${techStr}開發技術，實現了流暢的使用者介面和穩定的功能運作。在${keywords.length > 0 ? keywords[0] : '應用開發'}方面，注重使用者體驗設計和效能優化，確保應用程式能夠在不同平台上提供一致且良好的使用體驗。透過實際部署和用戶測試，應用展現了良好的實用性和技術水準${ending}`;
                },
                () => {
                    const techStr = (tech && tech.length > 0) ? tech.join('、') : '現代化行動開發技術';
                    return `本行動應用${categoryName}作品${title}${connectors[0]}整合了${techStr}，打造了一個功能完整且易用的應用程式。${keywords.length > 0 ? `在${keywords[0]}方面，` : ''}應用特別注重使用者體驗的優化和效能提升，透過精心的介面設計和流暢的互動流程，為使用者提供優質的使用體驗。經過完整的開發和測試流程，應用證明了其技術實力和實用價值${ending}`;
                }
            ];
            description = templates[Math.floor(Math.random() * templates.length)]();
        } else if (isSystem) {
            const tech = this.inferTechFromTitle(title, ['後端開發', '資料庫', 'API']);
            const templates = [
                () => {
                    const techStr = (tech && tech.length > 0) ? tech.join('、') : '現代化';
                    return `${opening}完整的${categoryName}系統作品${connectors[0]}採用系統化的架構設計，實現了核心功能模組和資料管理機制。在${keywords.length > 0 ? keywords[0] : '系統架構'}和${keywords.length > 1 ? keywords[1] : '資料處理'}方面，運用了${techStr}的開發技術，確保系統具有良好的穩定性和擴展性。透過完整的開發流程和實際應用驗證，系統展現了優秀的專業水準和實用價值${ending}`;
                },
                () => {
                    const techStr = (tech && tech.length > 0) ? tech[0] : '現代化';
                    return `本系統${categoryName}作品${title}${connectors[0]}以穩定的技術架構為基礎，整合了多個功能模組和資料管理機制。${keywords.length > 0 ? `在${keywords[0]}方面，` : ''}系統運用了${techStr}技術和最佳實踐，確保了良好的效能和可維護性。經過完整的設計、開發和測試流程，系統展現了優秀的技術實力和實用性${ending}`;
                }
            ];
            description = templates[Math.floor(Math.random() * templates.length)]();
        } else if (isDesign) {
            const templates = [
                () => {
                    return `${opening}創意十足的${categoryName}設計作品${connectors[0]}展現了優秀的視覺設計能力和使用者體驗思維。在${keywords.length > 0 ? keywords[0] : '視覺設計'}和${keywords.length > 1 ? keywords[1] : '使用者體驗'}方面，運用了現代化的設計原則和美學概念，創造出既美觀又實用的設計方案。透過完整的設計流程和實作驗證，作品展現了良好的創意價值和專業水準${ending}`;
                },
                () => {
                    return `本設計${categoryName}作品${title}${connectors[0]}結合了創意思維和專業設計技巧，${keywords.length > 0 ? `在${keywords[0]}方面` : '在視覺呈現方面'}表現出色。作品運用了設計原則、色彩理論和使用者體驗最佳實踐，創造出具有視覺吸引力和實用性的設計方案。經過完整的設計流程和用戶測試，作品展現了優秀的設計水準和創新價值${ending}`;
                }
            ];
            description = templates[Math.floor(Math.random() * templates.length)]();
        } else {
            // 通用描述模板（增強版：更自然、更多樣）
            const tech = this.inferTechFromTitle(title);
            const templates = [
                () => {
                    const techStr = (tech && tech.length > 0) ? `作品運用了${tech.slice(0, 2).join('、')}等現代化技術，` : '';
                    return `${opening}優秀的${categoryName}作品${connectors[0]}${keywords.length > 0 ? `在${keywords[0]}方面` : '在技術實現方面'}展現了專業的能力和創新的思維。${techStr}${keywords.length > 1 ? `特別在${keywords[1]}和${keywords.length > 2 ? keywords[2] : '功能設計'}方面，` : ''}透過系統化的方法和嚴謹的實作，確保了作品的品質和實用性。經過完整的開發流程和實際應用驗證，作品展現了良好的專業水準和實用價值${ending}`;
                },
                () => {
                    const techStr = (tech && tech.length > 0) ? tech[0] : '現代化';
                    return `本${categoryName}作品${title}${connectors[0]}結合了${techStr}技術和創新思維，${keywords.length > 0 ? `在${keywords[0]}方面` : '在核心功能方面'}表現出色。${keywords.length > 1 ? `作品特別注重${keywords[1]}和${keywords.length > 2 ? keywords[2] : '使用者體驗'}的優化，` : ''}透過精心的設計和實作，創造出既實用又具有創新性的解決方案。作品經過完整的開發和測試流程，證明了其專業品質和技術實力${ending}`;
                },
                () => {
                    const techStr = (tech && tech.length > 0) ? tech.slice(0, 3).join('、') : '';
                    return `${opening}精心設計的${categoryName}作品${connectors[0]}展現了作者在${keywords.length > 0 ? keywords[0] : '技術實現'}方面的專業能力。${techStr ? `採用${techStr}等技術，` : ''}${keywords.length > 1 ? `特別在${keywords[1]}方面，` : ''}作品運用了現代化的方法和最佳實踐，確保了高品質的輸出。透過完整的開發週期和實際應用，作品展現了良好的實用性和專業水準${ending}`;
                }
            ];
            description = templates[Math.floor(Math.random() * templates.length)]();
        }
        
        return description;
    }
    
    /**
     * 從標題智能推斷使用的技術
     */
    inferTechFromTitle(title, defaultTech = []) {
        const tech = [];
        const lowerTitle = title.toLowerCase();
        
        // 技術語言推斷
        if (lowerTitle.includes('java') && !lowerTitle.includes('javascript')) {
            tech.push('Java');
        }
        if (lowerTitle.includes('python')) {
            tech.push('Python');
        }
        if (lowerTitle.includes('javascript') || lowerTitle.includes('js')) {
            tech.push('JavaScript');
        }
        if (lowerTitle.includes('react') && !lowerTitle.includes('native')) {
            tech.push('React');
        }
        if (lowerTitle.includes('vue')) {
            tech.push('Vue');
        }
        if (lowerTitle.includes('php')) {
            tech.push('PHP');
        }
        if (lowerTitle.includes('node')) {
            tech.push('Node.js');
        }
        
        // 前端技術推斷
        if (lowerTitle.includes('網站') || lowerTitle.includes('網頁') || lowerTitle.includes('web')) {
            if (!tech.includes('HTML')) tech.push('HTML');
            if (!tech.includes('CSS')) tech.push('CSS');
        }
        
        // 資料庫推斷
        if (lowerTitle.includes('資料') || lowerTitle.includes('數據') || lowerTitle.includes('記帳') || lowerTitle.includes('管理')) {
            if (!tech.includes('資料庫')) tech.push('資料庫');
        }
        
        // 如果沒有推斷到技術，使用預設值
        if (tech.length === 0 && defaultTech.length > 0) {
            return defaultTech;
        }
        
        return tech.length > 0 ? tech : defaultTech;
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
            this.usageStats.daily[today] = { local: 0 };
        }
        this.usageStats.daily[today][source]++;
        
        // 保存到 localStorage
        this.saveUsageStats();
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
                    // 保留本地統計
                    this.usageStats.local = parsed.local || { description: 0, tags: 0 };
                } else {
                    this.usageStats.local = parsed.local || { description: 0, tags: 0 };
                    this.usageStats.daily = parsed.daily || {};
                    this.usageStats.lastReset = parsed.lastReset || today;
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
        const todayStats = this.usageStats.daily[today] || { local: 0 };
        
        return {
            total: {
                local: {
                    description: this.usageStats.local.description,
                    tags: this.usageStats.local.tags,
                    total: this.usageStats.local.description + this.usageStats.local.tags
                }
            },
            today: {
                local: todayStats.local,
                total: todayStats.local,
                limit: null,
                remaining: null
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
        console.log('📅 今日統計:');
        console.log('  本地生成:', stats.today.local, '次');
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

