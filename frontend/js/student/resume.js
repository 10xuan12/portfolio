/**
 * 學生履歷生成 JavaScript
 * 包含模板選擇、資料編輯、預覽和匯出功能
 */

(function() {
    'use strict';

    // 當前選中的模板和配色
    let currentTemplate = 'executive';
    let currentColorScheme = 'blue';
    let currentFont = 'modern';

    // 配色方案定義
    const colorSchemes = {
        blue: { primary: '#2563eb', secondary: '#1e40af', text: '#1e293b' },
        slate: { primary: '#334155', secondary: '#1e293b', text: '#0f172a' },
        emerald: { primary: '#059669', secondary: '#047857', text: '#064e3b' },
        purple: { primary: '#7c3aed', secondary: '#6d28d9', text: '#4c1d95' }
    };

    // 字型定義
    const fontFamilies = {
        traditional: '"Times New Roman", Times, serif',
        modern: 'Arial, "Microsoft JhengHei", "微軟正黑體", sans-serif',
        elegant: 'Georgia, "Microsoft JhengHei", serif',
        tech: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    };

    // 履歷資料
    let resumeData = {
        template: 'executive',
        colorScheme: 'blue',
        font: 'modern',
        basic: {
            name: '',
            birthDate: '',
            email: '',
            phone: '',
            address: '',
            summary: ''
        },
        experience: [],
        education: [],
        skills: '',
        projects: [],
        certificates: []
    };

    // 初始化頁面
    document.addEventListener('DOMContentLoaded', function() {
        initEventListeners();
    });

    // 初始化事件監聽器
    function initEventListeners() {
        // 模板選擇
        const templateOptions = document.querySelectorAll('.template-option');
        if (templateOptions.length > 0) {
            templateOptions.forEach(option => {
                option.addEventListener('click', function() {
                    selectTemplate(this.dataset.template);
                });
            });
        }
        
        // 配色方案選擇
        const colorSchemes = document.querySelectorAll('.color-scheme');
        if (colorSchemes.length > 0) {
            colorSchemes.forEach(scheme => {
                scheme.addEventListener('click', function() {
                    selectColorScheme(this.dataset.color);
                });
            });
        }
        
        // 表單資料變更
        const formInputs = document.querySelectorAll('input, textarea, select');
        if (formInputs.length > 0) {
            formInputs.forEach(input => {
                input.addEventListener('input', function() {
                    updateResumeData();
                    renderPreview();
                });
            });
        }
    }

    // 選擇模板
    function selectTemplate(template) {
        currentTemplate = template;
        resumeData.template = template;
        
        // 更新選中狀態
        const templateOptions = document.querySelectorAll('.template-option');
        if (templateOptions.length > 0) {
            templateOptions.forEach(option => {
                option.classList.remove('selected');
            });
        }
        
        const selectedOption = document.querySelector(`[data-template="${template}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        renderPreview();
        
        // 檢查 Utils 是否存在
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification(`已切換到 ${getTemplateName(template)} 模板`, 'success');
        }
    }

    // 取得模板名稱
    function getTemplateName(template) {
        const names = {
            'executive': '高階主管',
            'professional': '專業商務',
            'modern': '現代科技',
            'academic': '學術研究'
        };
        return names[template] || template;
    }

    // 選擇配色方案
    function selectColorScheme(color) {
        currentColorScheme = color;
        resumeData.colorScheme = color;
        
        // 更新選中狀態
        const colorSchemes = document.querySelectorAll('.color-scheme');
        if (colorSchemes.length > 0) {
            colorSchemes.forEach(scheme => {
                scheme.classList.remove('selected');
            });
        }
        
        const selectedScheme = document.querySelector(`[data-color="${color}"]`);
        if (selectedScheme) {
            selectedScheme.classList.add('selected');
        }
        
        renderPreview();
        
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('配色方案已更新', 'success');
        }
    }

    // 更改字型
    function changeFontFamily(font) {
        currentFont = font;
        resumeData.font = font;
        renderPreview();
        
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('字型已更新', 'success');
        }
    }

    // 填入範例資料
    function fillSampleData() {
        if (!confirm('這將會覆蓋現有的履歷資料，是否繼續？')) {
            return;
        }
        
        resumeData = {
            template: currentTemplate,
            colorScheme: currentColorScheme,
            font: currentFont,
            basic: {
                name: '王小明',
                birthDate: '1995-03-15',
                email: 'wang.xiaoming@example.com',
                phone: '0912-345-678',
                address: '台北市信義區',
                summary: '擁有5年以上的軟體開發經驗，專精於前端與後端技術。熱衷於學習新技術，具備良好的團隊合作能力與問題解決能力。曾參與多個大型專案的開發與維護，致力於提供高品質的程式碼與使用者體驗。'
            },
            experience: [
                {
                    company: 'ABC 科技股份有限公司',
                    position: '資深全端工程師',
                    startDate: '2021-03',
                    endDate: '至今',
                    description: '負責電商平台的開發與維護，包含前端 React 介面設計、後端 Node.js API 開發、資料庫設計與優化。帶領團隊完成多個重大功能更新，提升系統效能 40%。'
                },
                {
                    company: 'XYZ 網路公司',
                    position: '前端工程師',
                    startDate: '2019-07',
                    endDate: '2021-02',
                    description: '開發響應式網頁應用程式，使用 Vue.js 框架。優化網站載入速度，提升使用者體驗。參與敏捷開發流程，與設計師、後端工程師密切合作。'
                }
            ],
            education: [
                {
                    school: '國立臺灣大學',
                    degree: '資訊工程學系',
                    type: '學士',
                    year: '2015-2019',
                    gpa: '3.8/4.0',
                    courses: '資料結構、演算法、作業系統、資料庫系統、軟體工程'
                }
            ],
            skills: 'JavaScript, TypeScript, React, Vue.js, Node.js, Express, Python, Django, MySQL, MongoDB, Git, Docker, AWS, Linux, Agile, RESTful API',
            projects: [
                {
                    name: '電商平台重構專案',
                    tech: 'React, Node.js, PostgreSQL, Redis',
                    url: 'https://example.com',
                    github: 'https://github.com/example/project',
                    description: '主導電商平台的前後端重構，採用微服務架構，提升系統穩定性與擴展性。實作購物車、訂單管理、金流串接等核心功能。'
                },
                {
                    name: '即時聊天系統',
                    tech: 'Socket.io, Vue.js, MongoDB',
                    url: '',
                    github: 'https://github.com/example/chat',
                    description: '開發支援多人即時通訊的聊天系統，實作訊息推播、檔案傳輸、群組管理等功能。'
                }
            ],
            certificates: [
                {
                    name: 'AWS Certified Solutions Architect',
                    issuer: 'Amazon Web Services',
                    date: '2022-06',
                    expiry: '2025-06'
                },
                {
                    name: 'Google Cloud Professional Developer',
                    issuer: 'Google Cloud',
                    date: '2021-09',
                    expiry: '2024-09'
                }
            ]
        };
        
        fillFormData();
        renderPreview();
        
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('範例資料已填入', 'success');
        }
    }

    // 載入履歷資料
    async function loadResumeData() {
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                console.warn('無法獲取使用者資訊，使用空白履歷');
                resumeData = getDefaultResumeData();
                fillFormData();
                renderPreview();
                return;
            }
            
            // 顯示載入提示
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('正在載入履歷資料...', 'info');
            }
            
            // 從後端 API 載入履歷資料（統一透過 ApiService）
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request(`student/resume.php?action=get&user_id=${user.id}`);
            
            if (result.status === 200 && result.data) {
                // 成功載入資料
                resumeData = {
                    template: result.data.template || currentTemplate,
                    colorScheme: result.data.colorScheme || currentColorScheme,
                    font: result.data.font || currentFont,
                    basic: {
                        name: result.data.basic?.name || '',
                        birthDate: result.data.basic?.birthDate || '',
                        email: result.data.basic?.email || '',
                        phone: result.data.basic?.phone || '',
                        address: result.data.basic?.address || '',
                        summary: result.data.basic?.summary || ''
                    },
                    experience: result.data.experience || [],
                    education: result.data.education || [],
                    skills: result.data.skills || '',
                    projects: result.data.projects || [],
                    certificates: result.data.certificates || []
                };
                
                // 更新當前模板和配色
                if (result.data.template) {
                    currentTemplate = result.data.template;
                    selectTemplate(currentTemplate);
                }
                if (result.data.colorScheme) {
                    currentColorScheme = result.data.colorScheme;
                    selectColorScheme(currentColorScheme);
                }
                if (result.data.font) {
                    currentFont = result.data.font;
                    const fontSelector = document.getElementById('fontFamily');
                    if (fontSelector) {
                        fontSelector.value = currentFont;
                    }
                }
                
                if (typeof Utils !== 'undefined' && Utils.showNotification) {
                    Utils.showNotification('履歷資料載入成功', 'success');
                }
            }
            
        } catch (error) {
            console.error('載入履歷資料失敗:', error);
            
            // API 失敗，嘗試只載入使用者基本資料
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (user && user.id) {
                    const svc = window.apiService || window.initializeApiService?.();
                    const profileResult = await svc.request(`student/profile.php?action=get&user_id=${user.id}`);
                    
                    if (profileResult.status === 200 && profileResult.data) {
                        // 組合姓名
                        const firstName = profileResult.data.first_name || '';
                        const lastName = profileResult.data.last_name || '';
                        const displayName = profileResult.data.display_name || '';
                        const fullName = displayName || `${lastName}${firstName}`.trim() || profileResult.data.name || user.name || '';
                        
            resumeData.basic = {
                            name: fullName,
                            birthDate: profileResult.data.birth_date || '',
                            email: profileResult.data.email || user.email || '',
                            phone: profileResult.data.phone || '',
                            address: profileResult.data.address || '',
                            summary: profileResult.data.bio || ''
                        };
                        
                        // 如果有教育背景資料
                        if (profileResult.data.school) {
                            resumeData.education = [{
                                school: profileResult.data.school,
                                degree: profileResult.data.major || '',
                                type: '學士',
                                year: profileResult.data.graduation_year || '',
                                gpa: '',
                                courses: ''
                            }];
                        }
                        
                        // 如果有技能資料
                        if (profileResult.data.skills) {
                            resumeData.skills = profileResult.data.skills;
                        }
                    }
                }
            } catch (profileError) {
                console.error('載入個人資料也失敗:', profileError);
            }
            
            // 確保有基本結構
            if (!resumeData.basic) {
                resumeData = getDefaultResumeData();
            }
        }
        
        // 確保 DOM 已載入後再填充表單資料
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                fillFormData();
                renderPreview();
                hideLoadingOverlay();
            });
        } else {
            fillFormData();
            renderPreview();
            hideLoadingOverlay();
        }
    }

    // 填充表單資料
    function fillFormData() {
        // 基本資料
        const nameElement = document.getElementById('name');
        const birthDateElement = document.getElementById('birthDate');
        const emailElement = document.getElementById('email');
        const phoneElement = document.getElementById('phone');
        const addressElement = document.getElementById('address');
        const summaryElement = document.getElementById('summary');
        const skillsElement = document.getElementById('skills');
        
        if (nameElement) nameElement.value = resumeData.basic?.name || '';
        if (birthDateElement) birthDateElement.value = resumeData.basic?.birthDate || '';
        if (emailElement) emailElement.value = resumeData.basic?.email || '';
        if (phoneElement) phoneElement.value = resumeData.basic?.phone || '';
        if (addressElement) addressElement.value = resumeData.basic?.address || '';
        if (summaryElement) summaryElement.value = resumeData.basic?.summary || '';
        if (skillsElement) skillsElement.value = resumeData.skills || '';
        
        // 清空現有的動態內容
        const experienceList = document.getElementById('experienceList');
        const educationList = document.getElementById('educationList');
        const projectList = document.getElementById('projectList');
        const certificateList = document.getElementById('certificateList');
        
        if (experienceList) experienceList.innerHTML = '';
        if (educationList) educationList.innerHTML = '';
        if (projectList) projectList.innerHTML = '';
        if (certificateList) certificateList.innerHTML = '';
        
        // 填充工作經驗
        if (resumeData.experience && resumeData.experience.length > 0) {
            resumeData.experience.forEach(exp => {
                addExperienceItem(exp);
            });
        }
        
        // 填充教育背景
        if (resumeData.education && resumeData.education.length > 0) {
            resumeData.education.forEach(edu => {
                addEducationItem(edu);
            });
        }
        
        // 填充專案作品
        if (resumeData.projects && resumeData.projects.length > 0) {
            resumeData.projects.forEach(project => {
                addProjectItem(project);
            });
        }
        
        // 填充證照獎項
        if (resumeData.certificates && resumeData.certificates.length > 0) {
            resumeData.certificates.forEach(cert => {
                addCertificateItem(cert);
            });
        }
    }

    // 取得預設履歷資料
    function getDefaultResumeData() {
        return {
            template: 'executive',
            colorScheme: 'blue',
            font: 'modern',
                    basic: {
            name: '',
                birthDate: '',
            email: '',
            phone: '',
            address: '',
            summary: ''
        },
            skills: '',
            experience: [],
            education: [],
            projects: [],
            certificates: []
        };
    }

    // 更新履歷資料
    function updateResumeData() {
        const nameElement = document.getElementById('name');
        const birthDateElement = document.getElementById('birthDate');
        const emailElement = document.getElementById('email');
        const phoneElement = document.getElementById('phone');
        const addressElement = document.getElementById('address');
        const summaryElement = document.getElementById('summary');
        const skillsElement = document.getElementById('skills');
        
        resumeData.basic.name = nameElement ? nameElement.value : '';
        resumeData.basic.birthDate = birthDateElement ? birthDateElement.value : '';
        resumeData.basic.email = emailElement ? emailElement.value : '';
        resumeData.basic.phone = phoneElement ? phoneElement.value : '';
        resumeData.basic.address = addressElement ? addressElement.value : '';
        resumeData.basic.summary = summaryElement ? summaryElement.value : '';
        resumeData.skills = skillsElement ? skillsElement.value : '';
        
        // 更新工作經驗
        resumeData.experience = [];
        document.querySelectorAll('#experienceList .experience-item').forEach(item => {
            const inputs = item.querySelectorAll('input, textarea');
            resumeData.experience.push({
                company: inputs[0].value,
                position: inputs[1].value,
                startDate: inputs[2].value,
                endDate: inputs[3].value,
                description: inputs[4].value
            });
        });
        
        // 更新教育背景
        resumeData.education = [];
        document.querySelectorAll('#educationList .education-item').forEach(item => {
            const inputs = item.querySelectorAll('input, textarea');
            resumeData.education.push({
                school: inputs[0].value,
                degree: inputs[1].value,
                type: inputs[2].value,
                year: parseInt(inputs[3].value),
                gpa: inputs[4].value,
                courses: inputs[5].value
            });
        });
        
        // 更新專案作品
        resumeData.projects = [];
        document.querySelectorAll('#projectList .experience-item').forEach(item => {
            const inputs = item.querySelectorAll('input, textarea');
            resumeData.projects.push({
                name: inputs[0].value,
                tech: inputs[1].value,
                url: inputs[2].value,
                github: inputs[3].value,
                description: inputs[4].value
            });
        });
        
        // 更新證照獎項
        resumeData.certificates = [];
        document.querySelectorAll('#certificateList .experience-item').forEach(item => {
            const inputs = item.querySelectorAll('input');
            resumeData.certificates.push({
                name: inputs[0].value,
                issuer: inputs[1].value,
                date: inputs[2].value,
                expiry: inputs[3].value
            });
        });
    }

    // 渲染預覽
    function renderPreview() {
        const preview = document.getElementById('resumePreview');
        
        if (!preview) {
            console.warn('找不到預覽元素，跳過渲染');
            return;
        }
        
        // 根據模板選擇渲染函數
        if (currentTemplate === 'executive') {
            preview.innerHTML = renderExecutiveTemplate();
        } else if (currentTemplate === 'professional') {
            preview.innerHTML = renderProfessionalTemplate();
        } else if (currentTemplate === 'modern') {
            preview.innerHTML = renderModernTemplate();
        } else if (currentTemplate === 'academic') {
            preview.innerHTML = renderAcademicTemplate();
        } else {
            preview.innerHTML = renderExecutiveTemplate(); // 預設使用高階主管模板
        }
        
        // 應用字型到預覽容器
        const font = getFont();
        preview.style.fontFamily = font;
    }
    
    // 獲取當前配色
    function getColors() {
        return colorSchemes[currentColorScheme] || colorSchemes.blue;
    }
    
    // 獲取當前字型
    function getFont() {
        return fontFamilies[currentFont] || fontFamilies.modern;
    }

    // 高階主管模板 - 最專業正式
    function renderExecutiveTemplate() {
        const colors = getColors();
        
        return `
            <div style="line-height: 1.8; color: ${colors.text}; max-width: 100%;">
                <!-- 頁首 -->
                <div style="border-bottom: 4px solid ${colors.primary}; padding-bottom: 1.75rem; margin-bottom: 2.5rem;">
                    <h1 style="font-size: 3.25rem; font-weight: 700; color: ${colors.text}; margin: 0 0 0.75rem 0; letter-spacing: -0.5px; line-height: 1.2;">
                        ${resumeData.basic.name || '您的姓名'}
                    </h1>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; font-size: 1.235rem; color: #475569; line-height: 1.6; margin-top: 1rem;">
                        ${resumeData.basic.email ? `<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: ${colors.primary};">📧</span><span>${resumeData.basic.email}</span></div>` : ''}
                        ${resumeData.basic.phone ? `<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: ${colors.primary};">📱</span><span>${resumeData.basic.phone}</span></div>` : ''}
                        ${resumeData.basic.birthDate ? `<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: ${colors.primary};">🎂</span><span>${resumeData.basic.birthDate}</span></div>` : ''}
                        ${resumeData.basic.address ? `<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: ${colors.primary};">📍</span><span>${resumeData.basic.address}</span></div>` : ''}
                    </div>
                </div>
                
                <!-- 專業摘要 -->
                ${resumeData.basic.summary ? `
                <div style="margin-bottom: 2.5rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 700; color: ${colors.text}; margin: 0 0 1rem 0; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0;">
                        <span style="display: inline-block; width: 4px; height: 24px; background: ${colors.primary}; border-radius: 2px;"></span>
                        專業摘要
                    </h2>
                    <p style="color: #334155; line-height: 2; text-align: justify; font-size: 1rem; text-indent: 2em;">
                        ${resumeData.basic.summary}
                    </p>
                </div>
                ` : ''}
                
                <!-- 工作經驗 -->
                ${resumeData.experience && resumeData.experience.length > 0 ? `
                <div style="margin-bottom: 2.5rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 700; color: ${colors.text}; margin: 0 0 1.25rem 0; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0;">
                        <span style="display: inline-block; width: 4px; height: 24px; background: ${colors.primary}; border-radius: 2px;"></span>
                        專業經驗
                    </h2>
                    ${resumeData.experience.map((exp, index) => `
                        <div style="margin-bottom: 2rem; padding: 1.5rem; background: ${index % 2 === 0 ? '#f8fafc' : 'white'}; border-radius: 8px; border-left: 3px solid ${colors.primary};">
                            <div style="margin-bottom: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                                    <h3 style="font-size: 1.125rem; font-weight: 700; color: ${colors.text}; margin: 0; flex: 1;">
                                        ${exp.position || '職位名稱'}
                                    </h3>
                                    <span style="font-size: 0.875rem; color: #64748b; font-weight: 500; white-space: nowrap; background: white; padding: 0.25rem 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                                        ${exp.startDate || ''} - ${exp.endDate || ''}
                                    </span>
                                </div>
                                <p style="font-size: 1rem; font-weight: 600; color: ${colors.primary}; margin: 0;">
                                    ${exp.company || '公司名稱'}
                                </p>
                            </div>
                            <p style="color: #334155; line-height: 1.9; text-align: justify; margin: 0; font-size: 0.95rem;">
                                ${exp.description || ''}
                            </p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                <!-- 教育背景 -->
                ${resumeData.education && resumeData.education.length > 0 ? `
                <div style="margin-bottom: 2.5rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 700; color: ${colors.text}; margin: 0 0 1.25rem 0; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0;">
                        <span style="display: inline-block; width: 4px; height: 24px; background: ${colors.primary}; border-radius: 2px;"></span>
                        教育背景
                    </h2>
                    ${resumeData.education.map((edu, index) => `
                        <div style="margin-bottom: 1.5rem; padding: 1.25rem; background: ${index % 2 === 0 ? '#f8fafc' : 'white'}; border-radius: 8px; border-left: 3px solid ${colors.secondary};">
                            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <h3 style="font-size: 1.063rem; font-weight: 700; color: ${colors.text}; margin: 0; flex: 1;">
                                    ${edu.degree || '學位'} ${edu.type ? `(${edu.type})` : ''}
                                </h3>
                                <span style="font-size: 0.875rem; color: #64748b; font-weight: 500; white-space: nowrap; background: white; padding: 0.25rem 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                                    ${edu.year || ''}
                                </span>
                            </div>
                            <p style="font-weight: 600; color: ${colors.primary}; margin: 0 0 0.5rem 0; font-size: 1rem;">
                                ${edu.school || '學校名稱'}
                            </p>
                            ${edu.gpa ? `<p style="font-size: 0.9rem; color: #475569; margin: 0.25rem 0;"><strong>GPA:</strong> ${edu.gpa}</p>` : ''}
                            ${edu.courses ? `<p style="font-size: 0.9rem; color: #475569; margin: 0.25rem 0; line-height: 1.7;"><strong>主要課程:</strong> ${edu.courses}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                <!-- 專業技能 -->
                ${resumeData.skills && typeof resumeData.skills === 'string' && resumeData.skills.trim() ? `
                <div style="margin-bottom: 2.5rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 700; color: ${colors.text}; margin: 0 0 1.25rem 0; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0;">
                        <span style="display: inline-block; width: 4px; height: 24px; background: ${colors.primary}; border-radius: 2px;"></span>
                        專業技能
                    </h2>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.625rem;">
                        ${resumeData.skills.split(',').filter(s => s.trim()).map(skill => `
                            <span style="background: white; color: ${colors.primary}; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.9rem; font-weight: 600; border: 2px solid ${colors.primary}; transition: all 0.2s;">
                                ${skill.trim()}
                            </span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- 專案經歷 -->
                ${resumeData.projects && resumeData.projects.length > 0 ? `
                <div style="margin-bottom: 2.5rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 700; color: ${colors.text}; margin: 0 0 1.25rem 0; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0;">
                        <span style="display: inline-block; width: 4px; height: 24px; background: ${colors.primary}; border-radius: 2px;"></span>
                        專案經歷
                    </h2>
                    ${resumeData.projects.map((project, index) => `
                        <div style="margin-bottom: 1.75rem; padding: 1.5rem; background: ${index % 2 === 0 ? '#f8fafc' : 'white'}; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <h3 style="font-size: 1.063rem; font-weight: 700; color: ${colors.text}; margin: 0 0 0.75rem 0;">
                                ${project.name || '專案名稱'}
                            </h3>
                            ${project.tech && typeof project.tech === 'string' ? `
                            <div style="margin-bottom: 0.75rem;">
                                <span style="font-size: 0.875rem; font-weight: 600; color: #64748b;">技術：</span>
                                ${project.tech.split(',').filter(t => t.trim()).map(tech => `
                                    <span style="display: inline-block; background: white; color: ${colors.secondary}; padding: 0.25rem 0.625rem; border-radius: 4px; font-size: 0.8rem; font-weight: 500; margin: 0.25rem 0.25rem 0.25rem 0; border: 1px solid ${colors.secondary};">
                                        ${tech.trim()}
                                    </span>
                                `).join('')}
                            </div>
                            ` : ''}
                            <p style="color: #334155; line-height: 1.9; text-align: justify; margin: 0 0 0.75rem 0; font-size: 0.95rem;">
                                ${project.description || ''}
                            </p>
                            ${project.url || project.github ? `
                            <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem;">
                                ${project.url ? `<a href="${project.url}" target="_blank" style="color: ${colors.primary}; text-decoration: none; font-size: 0.875rem; font-weight: 500; display: flex; align-items: center; gap: 0.25rem; padding: 0.375rem 0.75rem; background: white; border: 1px solid ${colors.primary}; border-radius: 6px;">🔗 專案連結</a>` : ''}
                                ${project.github ? `<a href="${project.github}" target="_blank" style="color: ${colors.primary}; text-decoration: none; font-size: 0.875rem; font-weight: 500; display: flex; align-items: center; gap: 0.25rem; padding: 0.375rem 0.75rem; background: white; border: 1px solid ${colors.primary}; border-radius: 6px;">💻 GitHub</a>` : ''}
                            </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                <!-- 證照與獎項 -->
                ${resumeData.certificates && resumeData.certificates.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 700; color: ${colors.text}; margin: 0 0 1.25rem 0; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0;">
                        <span style="display: inline-block; width: 4px; height: 24px; background: ${colors.primary}; border-radius: 2px;"></span>
                        證照與獎項
                    </h2>
                    ${resumeData.certificates.map((cert, index) => `
                        <div style="margin-bottom: 1.25rem; padding: 1rem 1.25rem; background: ${index % 2 === 0 ? '#f8fafc' : 'white'}; border-radius: 8px; border-left: 3px solid ${colors.primary};">
                            <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <h3 style="font-size: 1rem; font-weight: 700; color: ${colors.text}; margin: 0; flex: 1;">
                                    ${cert.name || '證照名稱'}
                                </h3>
                                <span style="font-size: 0.875rem; color: #64748b; font-weight: 500; white-space: nowrap; background: white; padding: 0.25rem 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                                    ${cert.date || ''}
                                </span>
                            </div>
                            <p style="font-size: 0.95rem; color: ${colors.primary}; margin: 0; font-weight: 600;">
                                ${cert.issuer || '發證機構'}
                            </p>
                            ${cert.expiry ? `<p style="font-size: 0.875rem; color: #475569; margin: 0.5rem 0 0 0;">有效期限: ${cert.expiry}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;
    }
    
    // 現代科技模板
    function renderModernTemplate() {
        const colors = getColors();
        const font = getFont();
        
        return `
            <div style="font-family: ${font}; line-height: 1.6;">
                <div style="text-align: center; margin-bottom: 2rem; border-bottom: 3px solid ${colors.primary}; padding-bottom: 1rem;">
                    <h1 style="font-size: 2.5rem; color: #2d3748; margin: 0 0 1rem 0;">${resumeData.basic.name || '您的姓名'}</h1>
                                         <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 1rem; font-size: 0.9rem; color: #718096;">
                         ${resumeData.basic.email ? `<span>📧 ${resumeData.basic.email}</span>` : ''}
                         ${resumeData.basic.phone ? `<span>📱 ${resumeData.basic.phone}</span>` : ''}
                         ${resumeData.basic.birthDate ? `<span>🎂 ${resumeData.basic.birthDate}</span>` : ''}
                         ${resumeData.basic.address ? `<span>📍 ${resumeData.basic.address}</span>` : ''}
                     </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">個人簡介</h2>
                    <p style="color: #4a5568;">${resumeData.basic.summary}</p>
                </div>
                
                ${resumeData.experience && resumeData.experience.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">工作經驗</h2>
                    ${resumeData.experience.map(exp => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="color: #2d3748; margin: 0;">${exp.position}</h3>
                                <span style="color: #718096; font-size: 0.9rem;">${exp.startDate} - ${exp.endDate}</span>
                            </div>
                            <p style="color: #667eea; font-weight: 600; margin: 0.5rem 0;">${exp.company}</p>
                            <p style="color: #4a5568;">${exp.description}</p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${resumeData.education && resumeData.education.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">教育背景</h2>
                    ${resumeData.education.map(edu => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="color: #2d3748; margin: 0;">${edu.degree}</h3>
                                <span style="color: #718096; font-size: 0.9rem;">${edu.year}</span>
                            </div>
                            <p style="color: #667eea; font-weight: 600; margin: 0.5rem 0;">${edu.school}</p>
                            <p style="color: #4a5568;">GPA: ${edu.gpa} | 相關課程: ${edu.courses}</p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${resumeData.skills && typeof resumeData.skills === 'string' && resumeData.skills.trim() ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">技能專長</h2>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${resumeData.skills.split(',').filter(s => s.trim()).map(skill => `
                            <span style="background: #667eea; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.9rem;">${skill.trim()}</span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${resumeData.projects && resumeData.projects.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">專案作品</h2>
                    ${resumeData.projects.map(project => `
                        <div style="margin-bottom: 1rem;">
                            <h3 style="color: #2d3748; margin: 0;">${project.name}</h3>
                            <p style="color: #667eea; font-weight: 600; margin: 0.5rem 0;">${project.tech}</p>
                            <p style="color: #4a5568;">${project.description}</p>
                            <div style="font-size: 0.9rem; color: #718096;">
                                ${project.url ? `<span>🌐 <a href="${project.url}" target="_blank">專案連結</a></span>` : ''}
                                ${project.github ? `<span>📁 <a href="${project.github}" target="_blank">GitHub</a></span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${resumeData.certificates && resumeData.certificates.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">證照獎項</h2>
                    ${resumeData.certificates.map(cert => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="color: #2d3748; margin: 0;">${cert.name}</h3>
                                <span style="color: #718096; font-size: 0.9rem;">${cert.date}</span>
                            </div>
                            <p style="color: #667eea; font-weight: 600; margin: 0.5rem 0;">${cert.issuer}</p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;
    }

    // 學術研究模板
    function renderAcademicTemplate() {
        const colors = getColors();
        const font = getFont();
        
        return `
            <div style="font-family: ${font}; line-height: 1.8; color: ${colors.text};">
                <div style="text-align: center; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 2px solid ${colors.primary};">
                    <h1 style="font-size: 2rem; font-weight: 700; color: ${colors.text}; margin: 0 0 1rem 0;">
                        ${resumeData.basic.name || '您的姓名'}
                    </h1>
                    <div style="font-size: 0.875rem; color: #64748b; display: flex; justify-content: center; flex-wrap: wrap; gap: 0.75rem;">
                        ${resumeData.basic.email ? `<span>${resumeData.basic.email}</span>` : ''}
                        ${resumeData.basic.phone ? `<span>${resumeData.basic.phone}</span>` : ''}
                        ${resumeData.basic.birthDate ? `<span>🎂 ${resumeData.basic.birthDate}</span>` : ''}
                        ${resumeData.basic.address ? `<span>${resumeData.basic.address}</span>` : ''}
                     </div>
                </div>
                
                ${resumeData.basic.summary ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 600; color: ${colors.primary}; margin: 0 0 0.75rem 0; border-bottom: 2px solid ${colors.primary}; padding-bottom: 0.5rem;">
                        RESEARCH INTERESTS
                    </h2>
                    <p style="color: #475569; text-align: justify; line-height: 1.9;">
                        ${resumeData.basic.summary}
                    </p>
                </div>
                ` : ''}
                
                ${resumeData.education && resumeData.education.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 600; color: ${colors.primary}; margin: 0 0 1rem 0; border-bottom: 2px solid ${colors.primary}; padding-bottom: 0.5rem;">
                        EDUCATION
                    </h2>
                    ${resumeData.education.map(edu => `
                        <div style="margin-bottom: 1.25rem;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                <h3 style="font-size: 1rem; font-weight: 600; color: ${colors.text}; margin: 0;">
                                    ${edu.school || '學校名稱'}
                                </h3>
                                <span style="font-size: 0.875rem; color: #64748b;">
                                    ${edu.year || ''}
                                </span>
                            </div>
                            <p style="font-style: italic; color: ${colors.secondary}; margin: 0.25rem 0;">
                                ${edu.type || ''} in ${edu.degree || '學位'}
                            </p>
                            ${edu.gpa ? `<p style="font-size: 0.9rem; color: #64748b; margin: 0.25rem 0;">GPA: ${edu.gpa}</p>` : ''}
                            ${edu.courses ? `<p style="font-size: 0.875rem; color: #64748b; margin: 0.25rem 0;"><em>Relevant Coursework:</em> ${edu.courses}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${resumeData.projects && resumeData.projects.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 600; color: ${colors.primary}; margin: 0 0 1rem 0; border-bottom: 2px solid ${colors.primary}; padding-bottom: 0.5rem;">
                        RESEARCH & PROJECTS
                    </h2>
                    ${resumeData.projects.map(project => `
                        <div style="margin-bottom: 1.25rem;">
                            <h3 style="font-size: 1rem; font-weight: 600; color: ${colors.text}; margin: 0 0 0.25rem 0;">
                                ${project.name || '專案名稱'}
                            </h3>
                            <p style="font-size: 0.875rem; color: ${colors.secondary}; margin: 0 0 0.5rem 0; font-style: italic;">
                                ${project.tech || ''}
                            </p>
                            <p style="color: #475569; line-height: 1.8; text-align: justify;">
                                ${project.description || ''}
                            </p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${resumeData.skills && typeof resumeData.skills === 'string' && resumeData.skills.trim() ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 600; color: ${colors.primary}; margin: 0 0 0.75rem 0; border-bottom: 2px solid ${colors.primary}; padding-bottom: 0.5rem;">
                        TECHNICAL SKILLS
                    </h2>
                    <p style="color: #475569; line-height: 1.8;">${resumeData.skills}</p>
                </div>
                ` : ''}
                
                ${resumeData.certificates && resumeData.certificates.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="font-size: 1.125rem; font-weight: 600; color: ${colors.primary}; margin: 0 0 1rem 0; border-bottom: 2px solid ${colors.primary}; padding-bottom: 0.5rem;">
                        HONORS & AWARDS
                    </h2>
                    ${resumeData.certificates.map(cert => `
                        <div style="margin-bottom: 0.75rem;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                <span style="font-weight: 600; color: ${colors.text};">
                                    ${cert.name || '證照名稱'}
                                </span>
                                <span style="font-size: 0.875rem; color: #64748b;">
                                    ${cert.date || ''}
                                </span>
                     </div>
                            <p style="font-size: 0.875rem; color: #64748b; margin: 0.125rem 0 0 0;">
                                ${cert.issuer || '發證機構'}
                            </p>
                </div>
                        `).join('')}
                </div>
                ` : ''}
            </div>
        `;
    }

    // 專業商務模板
    function renderProfessionalTemplate() {
        const colors = getColors();
        const font = getFont();
        
        return `
            <div style="font-family: ${font}; line-height: 1.6;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 2.5rem; color: #1a202c; margin: 0 0 1rem 0; text-transform: uppercase;">${resumeData.basic.name || '您的姓名'}</h1>
                                         <div style="border-top: 2px solid #2d3748; padding-top: 1rem; font-size: 0.9rem; color: #718096; display: flex; justify-content: center; flex-wrap: wrap; gap: 1rem;">
                         ${resumeData.basic.email ? `<span>${resumeData.basic.email}</span>` : ''}
                         ${resumeData.basic.phone ? `<span>${resumeData.basic.phone}</span>` : ''}
                         ${resumeData.basic.birthDate ? `<span>🎂 ${resumeData.basic.birthDate}</span>` : ''}
                         ${resumeData.basic.address ? `<span>${resumeData.basic.address}</span>` : ''}
                     </div>
                </div>
                
                ${resumeData.basic.summary ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #2d3748; border-bottom: 1px solid #2d3748; padding-bottom: 0.5rem; text-transform: uppercase;">專業摘要</h2>
                    <p style="color: #4a5568; text-align: justify;">${resumeData.basic.summary}</p>
                </div>
                ` : ''}
                
                ${resumeData.experience && resumeData.experience.length > 0 ? `
                        <div style="margin-bottom: 2rem;">
                    <h2 style="color: #2d3748; border-bottom: 1px solid #2d3748; padding-bottom: 0.5rem; text-transform: uppercase;">專業經驗</h2>
                    ${resumeData.experience.map(exp => `
                        <div style="margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="color: #2d3748; margin: 0; font-size: 1.1rem;">${exp.position}</h3>
                                <span style="color: #718096; font-size: 0.9rem;">${exp.startDate} - ${exp.endDate}</span>
                            </div>
                            <p style="color: #4a5568; font-weight: 600; margin: 0.5rem 0;">${exp.company}</p>
                            <p style="color: #4a5568; text-align: justify;">${exp.description}</p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${resumeData.education && resumeData.education.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #2d3748; border-bottom: 1px solid #2d3748; padding-bottom: 0.5rem; text-transform: uppercase;">教育背景</h2>
                    ${resumeData.education.map(edu => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="color: #2d3748; margin: 0;">${edu.degree || '學位'}</h3>
                                <span style="color: #718096; font-size: 0.9rem;">${edu.year || ''}</span>
                            </div>
                            <p style="color: #4a5568; font-weight: 600; margin: 0.5rem 0;">${edu.school || '學校'}</p>
                            ${edu.gpa || edu.courses ? `<p style="color: #4a5568;">${edu.gpa ? 'GPA: ' + edu.gpa : ''}${edu.gpa && edu.courses ? ' | ' : ''}${edu.courses ? '相關課程: ' + edu.courses : ''}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${resumeData.skills && typeof resumeData.skills === 'string' && resumeData.skills.trim() ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #2d3748; border-bottom: 1px solid #2d3748; padding-bottom: 0.5rem; text-transform: uppercase;">專業技能</h2>
                    <p style="color: #4a5568;">${resumeData.skills}</p>
                </div>
                ` : ''}
            </div>
        `;
    }

    // 新增工作經驗
    function addExperience() {
        addExperienceItem();
    }

    // 添加工作經驗項目
    function addExperienceItem(data = {}) {
        const container = document.getElementById('experienceList');
        const experienceItem = document.createElement('div');
        experienceItem.className = 'experience-item';
        experienceItem.innerHTML = `
            <div class="item-header">
                <div class="item-title">${data.position || '新增工作經驗'}</div>
                <div class="item-actions">
                    <button class="btn-icon" onclick="editExperience(this)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" onclick="removeExperience(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>公司名稱</label>
                    <input type="text" value="${data.company || ''}">
                </div>
                <div class="form-group">
                    <label>職位</label>
                    <input type="text" value="${data.position || ''}">
                </div>
                <div class="form-group">
                    <label>開始日期</label>
                    <input type="date" value="${data.startDate || ''}" lang="ja-JP">
                </div>
                <div class="form-group">
                    <label>結束日期</label>
                    <input type="date" value="${data.endDate || ''}" lang="ja-JP">
                </div>
                <div class="form-group full-width">
                    <label>工作描述</label>
                    <textarea rows="3">${data.description || ''}</textarea>
                </div>
            </div>
        `;
        container.appendChild(experienceItem);
        
        // 添加事件監聽器
        experienceItem.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', function() {
                updateResumeData();
                renderPreview();
            });
        });
    }

    // 移除工作經驗
    function removeExperience(button) {
        if (confirm('確定要移除這個工作經驗嗎？')) {
            button.closest('.experience-item').remove();
            updateResumeData();
            renderPreview();
        }
    }

    // 編輯工作經驗
    function editExperience(button) {
        // 這裡可以實作編輯功能，例如開啟模態框
        Utils.showNotification('編輯功能開發中', 'info');
    }

    // 新增教育背景
    function addEducation() {
        addEducationItem();
    }

    // 添加教育背景項目
    function addEducationItem(data = {}) {
        const container = document.getElementById('educationList');
        const educationItem = document.createElement('div');
        educationItem.className = 'education-item';
        educationItem.innerHTML = `
            <div class="item-header">
                <div class="item-title">${data.degree || '新增教育背景'}</div>
                <div class="item-actions">
                    <button class="btn-icon" onclick="editEducation(this)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" onclick="removeEducation(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>學校名稱</label>
                    <input type="text" value="${data.school || ''}">
                </div>
                <div class="form-group">
                    <label>科系</label>
                    <input type="text" value="${data.degree || ''}">
                </div>
                <div class="form-group">
                    <label>學位</label>
                    <input type="text" value="${data.type || ''}">
                </div>
                <div class="form-group">
                    <label>畢業年份</label>
                    <input type="number" value="${data.year || ''}" min="2000" max="2030">
                </div>
                <div class="form-group">
                    <label>GPA</label>
                    <input type="text" value="${data.gpa || ''}">
                </div>
                <div class="form-group full-width">
                    <label>相關課程</label>
                    <textarea rows="2">${data.courses || ''}</textarea>
                </div>
            </div>
        `;
        container.appendChild(educationItem);
        
        // 添加事件監聽器
        educationItem.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', function() {
                updateResumeData();
                renderPreview();
            });
        });
    }

    // 移除教育背景
    function removeEducation(button) {
        if (confirm('確定要移除這個教育背景嗎？')) {
            button.closest('.education-item').remove();
            updateResumeData();
            renderPreview();
        }
    }

    // 編輯教育背景
    function editEducation(button) {
        Utils.showNotification('編輯功能開發中', 'info');
    }

    // 新增專案作品
    function addProject() {
        addProjectItem();
    }

    // 添加專案作品項目
    function addProjectItem(data = {}) {
        const container = document.getElementById('projectList');
        const projectItem = document.createElement('div');
        projectItem.className = 'experience-item';
        projectItem.innerHTML = `
            <div class="item-header">
                <div class="item-title">${data.name || '新增專案作品'}</div>
                <div class="item-actions">
                    <button class="btn-icon" onclick="editProject(this)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" onclick="removeProject(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>專案名稱</label>
                    <input type="text" value="${data.name || ''}">
                </div>
                <div class="form-group">
                    <label>技術</label>
                    <input type="text" value="${data.tech || ''}">
                </div>
                <div class="form-group">
                    <label>專案連結</label>
                    <input type="url" value="${data.url || ''}">
                </div>
                <div class="form-group">
                    <label>GitHub</label>
                    <input type="url" value="${data.github || ''}">
                </div>
                <div class="form-group full-width">
                    <label>專案描述</label>
                    <textarea rows="3">${data.description || ''}</textarea>
                </div>
            </div>
        `;
        container.appendChild(projectItem);
        
        // 添加事件監聽器
        projectItem.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', function() {
                updateResumeData();
                renderPreview();
            });
        });
    }

    // 移除專案作品
    function removeProject(button) {
        if (confirm('確定要移除這個專案作品嗎？')) {
            button.closest('.experience-item').remove();
            updateResumeData();
            renderPreview();
        }
    }

    // 編輯專案作品
    function editProject(button) {
        Utils.showNotification('編輯功能開發中', 'info');
    }

    // 新增證照獎項
    function addCertificate() {
        addCertificateItem();
    }

    // 添加證照獎項項目
    function addCertificateItem(data = {}) {
        const container = document.getElementById('certificateList');
        const certificateItem = document.createElement('div');
        certificateItem.className = 'experience-item';
        certificateItem.innerHTML = `
            <div class="item-header">
                <div class="item-title">${data.name || '新增證照獎項'}</div>
                <div class="item-actions">
                    <button class="btn-icon" onclick="editCertificate(this)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" onclick="removeCertificate(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>證照名稱</label>
                    <input type="text" value="${data.name || ''}">
                </div>
                <div class="form-group">
                    <label>發證機構</label>
                    <input type="text" value="${data.issuer || ''}">
                </div>
                <div class="form-group">
                    <label>取得日期</label>
                    <input type="date" value="${data.date || ''}" lang="ja-JP">
                </div>
                <div class="form-group">
                    <label>有效期限</label>
                    <input type="date" value="${data.expiry || ''}" lang="ja-JP">
                </div>
            </div>
        `;
        container.appendChild(certificateItem);
        
        // 添加事件監聽器
        certificateItem.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', function() {
                updateResumeData();
                renderPreview();
            });
        });
    }

    // 移除證照獎項
    function removeCertificate(button) {
        if (confirm('確定要移除這個證照獎項嗎？')) {
            button.closest('.experience-item').remove();
            updateResumeData();
            renderPreview();
        }
    }

    // 編輯證照獎項
    function editCertificate(button) {
        Utils.showNotification('編輯功能開發中', 'info');
    }

         // 儲存履歷草稿（不生成 PDF）
     async function saveResume() {
         try {
             updateResumeData();
             
             // 驗證必填欄位
             if (!resumeData.basic.name || !resumeData.basic.email) {
                 if (typeof Utils !== 'undefined' && Utils.showNotification) {
                     Utils.showNotification('請填寫姓名和電子郵件', 'error');
                 } else {
                     alert('請填寫姓名和電子郵件');
                 }
                 return;
             }
             
             // 從 localStorage 獲取使用者資訊
             const user = JSON.parse(localStorage.getItem('user'));
             if (!user || !user.id) {
                 throw new Error('無法獲取使用者資訊');
             }
             
             // 顯示載入提示
             if (typeof Utils !== 'undefined' && Utils.showNotification) {
                 Utils.showNotification('正在儲存草稿...', 'info');
             }
             
             // 發送儲存請求（使用 POST 方法）
             const svc = window.apiService || window.initializeApiService?.();
             const result = await svc.request('student/resume.php', {
                 method: 'POST',
                 body: JSON.stringify({
                     action: 'save',
                     resume_data: resumeData
                 })
             });
             
             if (result.status === 200 || result.status === 201) {
                 if (typeof Utils !== 'undefined' && Utils.showNotification) {
                     Utils.showNotification('履歷草稿已儲存', 'success');
                 } else {
                     alert('履歷草稿已儲存');
                 }
             } else {
                 throw new Error(result.message || '儲存失敗');
             }
             
         } catch (error) {
             if (typeof Utils !== 'undefined' && Utils.showNotification) {
                 Utils.showNotification('儲存失敗：' + error.message, 'error');
             } else {
                 alert('儲存失敗，請稍後再試');
             }
             console.error('儲存履歷錯誤:', error);
         }
     }

    // 匯出履歷（呼叫 exportPDF）
    async function exportResume() {
        await exportPDF();
    }

    // 匯出 PDF（生成並下載）
    async function exportPDF() {
        try {
            updateResumeData();
            
            // 驗證必填欄位
            if (!resumeData.basic.name || !resumeData.basic.email) {
                if (typeof Utils !== 'undefined' && Utils.showNotification) {
                    Utils.showNotification('請填寫姓名和電子郵件', 'error');
                } else {
                    alert('請填寫姓名和電子郵件');
                }
                return;
            }
            
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            // 顯示載入提示
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('正在生成 PDF...', 'info');
            }
            
            // 呼叫 API 生成 PDF
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request('student/resume.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'generate_pdf',
                    resume_data: resumeData
                })
            });
            
            if (result.status === 200 && result.data) {
                // 檢查是否返回 base64 PDF（Railway 環境）
                if (result.data.pdf_base64) {
                    // 將 base64 轉換為 Blob 並下載
                    const binaryString = atob(result.data.pdf_base64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = result.data.file_name || 'resume.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    
                    if (typeof Utils !== 'undefined' && Utils.showNotification) {
                        Utils.showNotification('PDF 已生成並下載', 'success');
                    } else {
                        alert('PDF 已生成並下載');
                    }
                } 
                // 檢查是否返回 URL（本地環境向後兼容）
                else if (result.data.pdf_url) {
                    window.open(result.data.pdf_url, '_blank');
                    
                    if (typeof Utils !== 'undefined' && Utils.showNotification) {
                        Utils.showNotification('PDF 已生成，正在下載...', 'success');
                    } else {
                        alert('PDF 已生成，正在下載...');
                    }
                } else {
                    throw new Error('無法獲取 PDF 檔案');
                }
            } else {
                throw new Error(result.message || '生成失敗');
            }
            
        } catch (error) {
            console.error('匯出 PDF 錯誤:', error);
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('匯出失敗：' + error.message, 'error');
            } else {
                alert('匯出失敗，請稍後再試');
            }
        }
    }

    // 匯出 Word
    function exportWord() {
        if (typeof Utils !== 'undefined' && Utils.showNotification) {
            Utils.showNotification('Word 匯出功能開發中', 'info');
        } else {
            alert('Word 匯出功能開發中');
        }
    }

    // 列印履歷
    function printResume() {
        window.print();
    }

    // ==================== AI 優化建議功能 ====================
    
    // 履歷分析器類別
    class ResumeAnalyzer {
        constructor(resumeData) {
            this.data = resumeData;
            this.suggestions = [];
        }
        
        analyze() {
            this.checkCompleteness();      // 完整度檢查
            this.checkQuality();           // 品質檢查
            this.checkKeywords();          // 關鍵字檢查
            this.checkLength();            // 長度檢查
            this.checkFormatting();        // 格式檢查
            
            return this.generateReport();
        }
        
        addSuggestion(type, section, message, priority) {
            this.suggestions.push({ type, section, message, priority });
        }
        
        // 檢查完整度
        checkCompleteness() {
            const sections = {
                '基本資料': this.data.basic.name && this.data.basic.email,
                '個人簡介': this.data.basic.summary,
                '工作經驗': this.data.experience && this.data.experience.length > 0,
                '教育背景': this.data.education && this.data.education.length > 0,
                '技能專長': this.data.skills
            };
            
            Object.entries(sections).forEach(([name, filled]) => {
                if (!filled) {
                    this.addSuggestion('error', name, '此區塊尚未填寫，建議完整填寫以提升履歷完整度', 'high');
                }
            });
            
            // 檢查聯絡資訊
            if (!this.data.basic.phone) {
                this.addSuggestion('warning', '基本資料', '建議填寫電話號碼，方便企業聯繫', 'medium');
            }
            
            // 檢查是否有專案或證照
            if ((!this.data.projects || this.data.projects.length === 0) && 
                (!this.data.certificates || this.data.certificates.length === 0)) {
                this.addSuggestion('tip', '額外資訊', '建議加入專案作品或證照獎項，提升競爭力', 'medium');
            }
        }
        
        // 檢查內容品質
        checkQuality() {
            // 檢查個人簡介
            if (this.data.basic.summary) {
                const summary = this.data.basic.summary;
                
                if (summary.length < 50) {
                    this.addSuggestion('warning', '個人簡介', 
                        `簡介過短（${summary.length}字），建議增加到80-150字，更詳細地描述您的專業背景`, 'high');
                } else if (summary.length > 300) {
                    this.addSuggestion('warning', '個人簡介', 
                        `簡介過長（${summary.length}字），建議精簡到150-200字，突出重點`, 'medium');
                } else if (summary.length >= 80 && summary.length <= 200) {
                    this.addSuggestion('success', '個人簡介', 
                        '長度適中，內容充實！', 'low');
                }
                
                // 檢查是否使用行動動詞
                const hasActionWords = /負責|開發|設計|管理|帶領|優化|實作|建立|執行|協調|分析|規劃/.test(summary);
                if (!hasActionWords) {
                    this.addSuggestion('tip', '個人簡介', 
                        '建議使用行動動詞（如：開發、設計、管理等）來描述您的能力', 'medium');
                }
                
                // 檢查是否有專業關鍵字
                const hasProfessionalTerms = /專業|經驗|技術|專長|能力|擅長|熟悉/.test(summary);
                if (!hasProfessionalTerms) {
                    this.addSuggestion('tip', '個人簡介', 
                        '建議加入專業關鍵字（如：專業、經驗、技術等）', 'low');
                }
            }
            
            // 檢查工作經驗
            if (this.data.experience && this.data.experience.length > 0) {
                this.data.experience.forEach((exp, i) => {
                    if (exp.description) {
                        // 長度檢查
                        if (exp.description.length < 30) {
                            this.addSuggestion('warning', `工作經驗 ${i+1}`, 
                                '工作描述過短，建議詳細說明您的職責、使用的技術和具體成就', 'high');
                        }
                        
                        // 量化數據檢查
                        if (!/\d+%|\d+[位人個件項張]|\d+萬|\d+倍|[0-9]+/.test(exp.description)) {
                            this.addSuggestion('tip', `工作經驗 ${i+1}`, 
                                '建議加入具體數據（如：提升效能40%、管理5人團隊、完成20個專案）', 'high');
                        } else {
                            this.addSuggestion('success', `工作經驗 ${i+1}`, 
                                '包含量化數據，很好！', 'low');
                        }
                        
                        // STAR 原則檢查
                        const hasContext = /負責|參與|加入|擔任/.test(exp.description);
                        const hasAction = /開發|設計|建立|優化|改善|實作|導入/.test(exp.description);
                        const hasResult = /成功|完成|提升|降低|增加|改善|優化/.test(exp.description);
                        
                        if (hasContext && hasAction && hasResult) {
                            this.addSuggestion('success', `工作經驗 ${i+1}`, 
                                '描述完整，符合 STAR 原則！', 'low');
                        } else if (!(hasAction && hasResult)) {
                            this.addSuggestion('tip', `工作經驗 ${i+1}`, 
                                '建議使用 STAR 原則：說明情境 → 執行行動 → 展現結果', 'medium');
                        }
                    }
                    
                    // 檢查日期格式
                    if (!exp.startDate || !exp.endDate) {
                        this.addSuggestion('warning', `工作經驗 ${i+1}`, 
                            '請填寫起訖日期', 'medium');
                    }
                });
                
                // 工作經驗數量建議
                if (this.data.experience.length === 1) {
                    this.addSuggestion('tip', '工作經驗', 
                        '如有其他相關經驗（實習、兼職等），建議一併列出', 'low');
                }
            }
            
            // 檢查教育背景
            if (this.data.education && this.data.education.length > 0) {
                this.data.education.forEach((edu, i) => {
                    if (edu.gpa && parseFloat(edu.gpa) >= 3.5) {
                        this.addSuggestion('success', `教育背景 ${i+1}`, 
                            'GPA 優異，是很好的加分項！', 'low');
                    }
                    
                    if (edu.courses && edu.courses.split(',').length >= 3) {
                        this.addSuggestion('success', `教育背景 ${i+1}`, 
                            '列出相關課程，展現專業學習背景！', 'low');
                    } else if (!edu.courses) {
                        this.addSuggestion('tip', `教育背景 ${i+1}`, 
                            '建議列出與應徵職位相關的課程', 'low');
                    }
                });
            }
            
            // 檢查專案作品
            if (this.data.projects && this.data.projects.length > 0) {
                this.data.projects.forEach((project, i) => {
                    if (!project.tech || project.tech.split(',').length < 2) {
                        this.addSuggestion('tip', `專案作品 ${i+1}`, 
                            '建議詳細列出使用的技術，展現技術廣度', 'medium');
                    }
                    
                    if (project.url || project.github) {
                        this.addSuggestion('success', `專案作品 ${i+1}`, 
                            '提供專案連結，讓企業可以直接查看成果！', 'low');
                    } else {
                        this.addSuggestion('tip', `專案作品 ${i+1}`, 
                            '如有線上展示或 GitHub 連結，建議加入', 'low');
                    }
                });
            }
        }
        
        // 檢查關鍵字
        checkKeywords() {
            if (!this.data.skills || typeof this.data.skills !== 'string') return;
            
            const skills = this.data.skills.toLowerCase();
            const jobFamily = this.detectJobFamily();
            
            const keywordSets = {
                frontend: {
                    keywords: ['react', 'vue', 'angular', 'typescript', 'webpack', 'css3', 'html5', 'sass'],
                    name: '前端開發'
                },
                backend: {
                    keywords: ['node.js', 'python', 'java', 'spring', 'api', 'database', 'sql', 'php'],
                    name: '後端開發'
                },
                fullstack: {
                    keywords: ['git', 'docker', 'ci/cd', 'aws', 'azure', 'kubernetes', 'restful'],
                    name: '全端開發'
                },
                data: {
                    keywords: ['python', 'sql', 'pandas', 'machine learning', 'data analysis', 'r', 'tableau'],
                    name: '數據分析'
                }
            };
            
            if (jobFamily && keywordSets[jobFamily]) {
                const set = keywordSets[jobFamily];
                const missing = set.keywords.filter(kw => !skills.includes(kw));
                const hasCount = set.keywords.filter(kw => skills.includes(kw)).length;
                
                if (hasCount >= 4) {
                    this.addSuggestion('success', '技能專長', 
                        `${set.name}相關技能完整，涵蓋主流技術！`, 'low');
                } else if (missing.length > 0 && missing.length <= 3) {
                    this.addSuggestion('tip', '技能專長', 
                        `建議考慮加入以下熱門技能：${missing.slice(0, 3).join('、')}`, 'medium');
                }
            }
            
            // 檢查技能數量
            const skillCount = this.data.skills ? this.data.skills.split(',').filter(s => s.trim()).length : 0;
            if (skillCount < 5) {
                this.addSuggestion('tip', '技能專長', 
                    `目前僅列出 ${skillCount} 項技能，建議列出 8-15 項相關技能`, 'medium');
            } else if (skillCount > 20) {
                this.addSuggestion('warning', '技能專長', 
                    `技能列表過長（${skillCount} 項），建議精簡至 10-15 項核心技能`, 'low');
            } else if (skillCount >= 8 && skillCount <= 15) {
                this.addSuggestion('success', '技能專長', 
                    '技能數量適中，涵蓋面廣！', 'low');
            }
        }
        
        // 檢查長度
        checkLength() {
            // 計算總字數
            let totalWords = 0;
            totalWords += (this.data.basic.summary || '').length;
            
            if (this.data.experience) {
                this.data.experience.forEach(exp => {
                    totalWords += (exp.description || '').length;
                });
            }
            
            if (totalWords < 200) {
                this.addSuggestion('warning', '整體內容', 
                    `履歷內容過少（約 ${totalWords} 字），建議增加到 400-800 字`, 'high');
            } else if (totalWords > 1500) {
                this.addSuggestion('warning', '整體內容', 
                    `履歷內容過多（約 ${totalWords} 字），建議精簡到 800-1200 字`, 'medium');
            } else if (totalWords >= 400 && totalWords <= 1000) {
                this.addSuggestion('success', '整體內容', 
                    '內容長度適中，詳略得當！', 'low');
            }
        }
        
        // 檢查格式
        checkFormatting() {
            // 檢查 Email 格式
            if (this.data.basic.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(this.data.basic.email)) {
                    this.addSuggestion('error', '基本資料', 
                        'Email 格式不正確，請檢查', 'high');
                }
            }
            
            // 檢查電話格式
            if (this.data.basic.phone) {
                const phoneRegex = /^[\d\-\+\(\)\s]+$/;
                if (!phoneRegex.test(this.data.basic.phone)) {
                    this.addSuggestion('warning', '基本資料', 
                        '電話號碼格式建議使用數字和符號（如：0912-345-678）', 'low');
                }
            }
        }
        
        // 偵測職位類型
        detectJobFamily() {
            const title = (this.data.basic?.title || '').toLowerCase();
            const skills = (typeof this.data.skills === 'string' ? this.data.skills : '').toLowerCase();
            const combined = title + ' ' + skills;
            
            if (/前端|front.?end|react|vue|angular/.test(combined)) return 'frontend';
            if (/後端|back.?end|java|python|node/.test(combined)) return 'backend';
            if (/全端|full.?stack/.test(combined)) return 'fullstack';
            if (/數據|data|分析|analyst/.test(combined)) return 'data';
            
            return null;
        }
        
        // 生成報告
        generateReport() {
            const score = this.calculateScore();
            
            return {
                score: score,
                level: this.getLevel(score),
                suggestions: this.suggestions.sort((a, b) => {
                    const priority = { high: 3, medium: 2, low: 1 };
                    return priority[b.priority] - priority[a.priority];
                }),
                summary: this.generateSummary(score),
                stats: this.generateStats()
            };
        }
        
        // 計算分數
        calculateScore() {
            let score = 100;
            
            this.suggestions.forEach(s => {
                if (s.type === 'error') score -= 15;
                else if (s.type === 'warning') score -= 8;
                else if (s.type === 'tip') score -= 3;
            });
            
            return Math.max(0, Math.min(100, score));
        }
        
        // 取得等級
        getLevel(score) {
            if (score >= 90) return { text: '優秀', color: '#059669', icon: '🌟' };
            if (score >= 75) return { text: '良好', color: '#2563eb', icon: '👍' };
            if (score >= 60) return { text: '尚可', color: '#f59e0b', icon: '📝' };
            return { text: '需改進', color: '#ef4444', icon: '⚠️' };
        }
        
        // 生成摘要
        generateSummary(score) {
            if (score >= 90) {
                return '您的履歷非常完整且專業！僅有一些小建議可以讓履歷更加完美。';
            } else if (score >= 75) {
                return '您的履歷整體不錯，但還有一些可以優化的地方。';
            } else if (score >= 60) {
                return '您的履歷有基本內容，但需要加強多個部分以提升競爭力。';
            } else {
                return '建議您根據以下建議完善履歷內容，以提升求職成功率。';
            }
        }
        
        // 生成統計
        generateStats() {
            const typeCount = {
                error: this.suggestions.filter(s => s.type === 'error').length,
                warning: this.suggestions.filter(s => s.type === 'warning').length,
                tip: this.suggestions.filter(s => s.type === 'tip').length,
                success: this.suggestions.filter(s => s.type === 'success').length
            };
            
            return {
                total: this.suggestions.length,
                ...typeCount
            };
        }
    }
    
    // 分析履歷功能
    function analyzeResume() {
        updateResumeData(); // 確保資料是最新的
        
        const analyzer = new ResumeAnalyzer(resumeData);
        const report = analyzer.analyze();
        
        displayAnalysisReport(report);
    }
    
    // 顯示分析報告
    function displayAnalysisReport(report) {
        const panel = document.getElementById('suggestions-panel');
        if (!panel) {
            console.error('找不到建議面板元素');
            return;
        }
        
        // 更新分數
        const scoreValue = document.getElementById('score-value');
        const scoreLevel = document.getElementById('score-level');
        const scoreCircle = document.querySelector('.score-circle');
        
        if (scoreValue) {
            scoreValue.textContent = report.score;
            scoreValue.style.color = report.level.color;
        }
        
        if (scoreLevel) {
            scoreLevel.textContent = `${report.level.icon} ${report.level.text}`;
            scoreLevel.style.color = report.level.color;
        }
        
        if (scoreCircle) {
            scoreCircle.style.borderColor = report.level.color;
        }
        
        // 更新摘要
        const summary = document.getElementById('analysis-summary');
        if (summary) {
            summary.textContent = report.summary;
        }
        
        // 更新統計
        const stats = document.getElementById('analysis-stats');
        if (stats) {
            stats.innerHTML = `
                <div class="stat-item">
                    <span class="stat-icon error">❌</span>
                    <span class="stat-label">錯誤</span>
                    <span class="stat-value">${report.stats.error}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon warning">⚠️</span>
                    <span class="stat-label">警告</span>
                    <span class="stat-value">${report.stats.warning}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon tip">💡</span>
                    <span class="stat-label">建議</span>
                    <span class="stat-value">${report.stats.tip}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon success">✅</span>
                    <span class="stat-label">優點</span>
                    <span class="stat-value">${report.stats.success}</span>
                </div>
            `;
        }
        
        // 更新建議列表
        const suggestionsList = document.getElementById('suggestions-list');
        if (suggestionsList) {
            if (report.suggestions.length === 0) {
                suggestionsList.innerHTML = '<div class="no-suggestions">🎉 太棒了！您的履歷沒有需要改進的地方！</div>';
            } else {
                suggestionsList.innerHTML = report.suggestions.map(s => {
                    const icons = {
                        error: '❌',
                        warning: '⚠️',
                        tip: '💡',
                        success: '✅'
                    };
                    
                    return `
                        <div class="suggestion-item ${s.type}">
                            <div class="suggestion-header">
                                <span class="suggestion-icon">${icons[s.type]}</span>
                                <span class="suggestion-section">${s.section}</span>
                                <span class="suggestion-priority priority-${s.priority}">${s.priority === 'high' ? '重要' : s.priority === 'medium' ? '中等' : '次要'}</span>
                            </div>
                            <div class="suggestion-message">${s.message}</div>
                        </div>
                    `;
                }).join('');
            }
        }
        
        // 顯示面板
        panel.style.display = 'block';
        
        // 平滑滾動到面板
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // 關閉建議面板
    function closeSuggestions() {
        const panel = document.getElementById('suggestions-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    /**
     * 隱藏載入覆蓋層
     */
    function hideLoadingOverlay() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const mainContent = document.getElementById('mainContent');
        
        if (loadingOverlay && mainContent) {
            // 顯示主要內容
            mainContent.style.display = 'block';
            
            // 隱藏載入動畫
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                
                // 完全移除載入覆蓋層
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 500);
            }, 300);
        }
    }

    // 全域函數供 HTML 使用
    window.selectTemplate = selectTemplate;
    window.selectColorScheme = selectColorScheme;
    window.changeFontFamily = changeFontFamily;
    window.fillSampleData = fillSampleData;
    window.loadResumeData = loadResumeData;
    window.addExperience = addExperience;
    window.removeExperience = removeExperience;
    window.editExperience = editExperience;
    window.addEducation = addEducation;
    window.removeEducation = removeEducation;
    window.editEducation = editEducation;
    window.addProject = addProject;
    window.removeProject = removeProject;
    window.editProject = editProject;
    window.addCertificate = addCertificate;
    window.removeCertificate = removeCertificate;
    window.editCertificate = editCertificate;
    window.saveResume = saveResume;
    window.exportResume = exportResume;
    window.exportPDF = exportPDF;
    window.exportWord = exportWord;
    window.printResume = printResume;
    window.analyzeResume = analyzeResume;
    window.closeSuggestions = closeSuggestions;
    window.hideLoadingOverlay = hideLoadingOverlay;

})(); 