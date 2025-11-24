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
        
        // 備用模型列表（如果一個失敗，嘗試下一個）
        this.textGenerationModels = [
            'google/flan-t5-base',  // 輕量級，快速響應
            'microsoft/DialoGPT-medium',  // 對話模型
            'gpt2'  // 備用模型
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
            'SEO', '行銷', '數位行銷', '社群媒體',
            '網路安全', '資訊安全', '滲透測試',
            '雲端', 'AWS', 'Azure', 'Docker', 'Kubernetes',
            '3D建模', 'Blender', 'Maya', 'Unity', 'Unreal Engine'
        ];
    }

    /**
     * 生成作品描述
     * @param {string} title - 作品標題
     * @param {string} category - 作品分類
     * @returns {Promise<string>} 生成的描述
     */
    async generateDescription(title, category) {
        try {
            // 由於Hugging Face API對中文支援有限，我們使用智能本地生成
            // 但保留API調用的結構以便未來擴展
            console.log('開始生成作品描述...', { title, category });
            
            // 先嘗試使用本地智能生成（更可靠）
            let description = this.generateDescriptionLocally(title, category);
            
            // 如果本地生成成功，直接返回
            if (description && description.length > 20) {
                return description;
            }
            
            // 備用：嘗試API（如果網路允許）
            try {
                const prompt = this.buildDescriptionPrompt(title, category);
                const apiDescription = await this.callTextGenerationAPI(prompt, this.textGenerationModels[0]);
                if (apiDescription && apiDescription.length > 10) {
                    return apiDescription;
                }
            } catch (apiError) {
                console.log('API調用失敗，使用本地生成:', apiError);
            }
            
            // 最終備用：使用本地生成
            return this.generateDescriptionLocally(title, category);
        } catch (error) {
            console.error('AI描述生成錯誤:', error);
            // 發生錯誤時使用本地生成邏輯
            return this.generateDescriptionLocally(title, category);
        }
    }

    /**
     * 生成智能標籤
     * @param {string} title - 作品標題
     * @param {string} description - 作品描述
     * @returns {Promise<Array<string>>} 生成的標籤陣列
     */
    async generateTags(title, description) {
        try {
            // 組合文本
            const text = `${title} ${description}`.toLowerCase();
            
            // 從技能關鍵字列表中匹配
            const matchedTags = this.matchSkillKeywords(text);
            
            // 如果匹配的標籤太少，使用AI分析
            if (matchedTags.length < 3) {
                const aiTags = await this.analyzeTextWithAI(text);
                matchedTags.push(...aiTags);
            }
            
            // 去重並限制數量
            const uniqueTags = [...new Set(matchedTags)].slice(0, 10);
            
            return uniqueTags;
        } catch (error) {
            console.error('AI標籤生成錯誤:', error);
            // 發生錯誤時使用本地匹配邏輯
            return this.matchSkillKeywords(`${title} ${description}`.toLowerCase());
        }
    }

    /**
     * 調用文本生成API
     */
    async callTextGenerationAPI(prompt, model) {
        try {
            const response = await fetch(`${this.baseUrl}/${model}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_length: 150,
                        temperature: 0.7,
                        do_sample: true
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API錯誤: ${response.status}`);
            }

            const data = await response.json();
            
            // 處理不同的回應格式
            if (Array.isArray(data) && data[0] && data[0].generated_text) {
                return data[0].generated_text.trim();
            } else if (data.generated_text) {
                return data.generated_text.trim();
            } else if (typeof data === 'string') {
                return data.trim();
            }
            
            return null;
        } catch (error) {
            console.error(`模型 ${model} 調用失敗:`, error);
            return null;
        }
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
     * 構建描述生成提示詞
     */
    buildDescriptionPrompt(title, category) {
        const categoryMap = {
            'engineering': '工程',
            'information': '資訊',
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
        
        return `請為以下${categoryName}學群的作品生成一段專業的描述（50-100字）：
作品標題：${title}

描述應包含：
1. 作品的主要功能和特色
2. 使用的技術或方法
3. 作品的價值和意義

描述：`;
    }

    /**
     * 本地生成描述（智能生成，基於標題和分類）
     */
    generateDescriptionLocally(title, category) {
        const categoryMap = {
            'engineering': { name: '工程', keywords: ['系統設計', '技術實現', '工程方法', '實務應用'] },
            'information': { name: '資訊', keywords: ['程式開發', '系統架構', '資訊技術', '數位化'] },
            'business': { name: '商管', keywords: ['商業分析', '市場策略', '管理實務', '商業模式'] },
            'design': { name: '設計', keywords: ['視覺設計', '使用者體驗', '創意設計', '美學呈現'] },
            'education': { name: '教育', keywords: ['教學設計', '學習方法', '教育科技', '知識傳遞'] },
            'arts': { name: '藝術', keywords: ['藝術創作', '美學表現', '創意表達', '視覺藝術'] },
            'humanities': { name: '人文', keywords: ['人文思考', '文化研究', '社會觀察', '價值探討'] },
            'social': { name: '社會', keywords: ['社會分析', '社會議題', '社會服務', '社會影響'] },
            'science': { name: '自然科學', keywords: ['科學研究', '實驗分析', '數據驗證', '理論應用'] },
            'medicine': { name: '醫藥衛生', keywords: ['醫療應用', '健康照護', '醫學研究', '公共衛生'] },
            'agriculture': { name: '農業', keywords: ['農業技術', '永續發展', '生態保護', '農業創新'] },
            'tourism': { name: '觀光餐旅', keywords: ['服務設計', '體驗規劃', '餐飲管理', '觀光規劃'] },
            'sports': { name: '體育', keywords: ['運動科學', '訓練方法', '體能分析', '運動表現'] },
            'other': { name: '其他', keywords: ['創新應用', '跨領域整合', '實務專案', '綜合應用'] }
        };
        
        const categoryInfo = categoryMap[category] || categoryMap['other'];
        const categoryName = categoryInfo.name;
        const keywords = categoryInfo.keywords;
        
        // 從標題中提取關鍵字
        const titleKeywords = this.extractKeywordsFromTitle(title);
        
        // 選擇相關的關鍵字
        const selectedKeywords = this.selectRelevantKeywords(titleKeywords, keywords);
        
        // 生成多樣化的描述模板
        const templates = [
            `這是一個${categoryName}學群的優秀作品。${title}${selectedKeywords.length > 0 ? `在${selectedKeywords[0]}方面` : ''}展現了創新的思維和專業的技能。作品結合了理論與實務，具有很高的實用價值和學習意義，能夠有效解決實際問題並提供良好的使用者體驗。`,
            `${title}是一個精心設計的${categoryName}學群作品。作品${selectedKeywords.length > 0 ? `在${selectedKeywords[0]}和${selectedKeywords[1] || '功能設計'}方面` : '在技術實現和功能設計方面'}都表現出色，展現了作者的專業能力和創意思維。透過系統化的開發流程，確保了作品的品質和可用性。`,
            `本作品${title}屬於${categoryName}學群，展現了作者在該領域的專業素養。作品設計精良，功能完善，${selectedKeywords.length > 0 ? `特別在${selectedKeywords[0]}方面` : '在整體架構和實作細節方面'}具有很好的示範價值。透過實際應用驗證，證明了作品的實用性和有效性。`
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
}

// 創建全局實例
window.aiService = new AIService();

// 導出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIService;
}

