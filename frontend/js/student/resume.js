/**
 * 學生履歷生成 JavaScript
 * 包含模板選擇、資料編輯、預覽和匯出功能
 */

(function() {
    'use strict';

    // 當前選中的模板
    let currentTemplate = 'modern';

    // 履歷資料
    let resumeData = {
        template: 'modern',
        basic: {
            name: '',
            title: '',
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
            'modern': '現代簡約',
            'professional': '專業商務',
            'creative': '創意設計',
            'minimal': '極簡風格'
        };
        return names[template] || template;
    }

    // 載入履歷資料
    async function loadResumeData() {
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            // 從後端 API 載入履歷資料（統一透過 ApiService）
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request(`student/resume.php?action=get&user_id=${user.id}`);
            
            if (result.status === 200 && result.data) {
                resumeData = result.data;
            } else {
                throw new Error(result.message || '載入履歷資料失敗');
            }
            
        } catch (error) {
            console.error('載入履歷資料失敗:', error);
            // 如果 API 失敗，使用預設資料
            resumeData = getDefaultResumeData();
        }
        
        // 確保 resumeData.basic 存在
        if (!resumeData.basic) {
            resumeData.basic = {
                name: '',
                title: '',
                email: '',
                phone: '',
                address: '',
                summary: ''
            };
        }
        
        // 確保 DOM 已載入後再填充表單資料
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                fillFormData();
                renderPreview();
            });
        } else {
            fillFormData();
            renderPreview();
        }
    }

    // 填充表單資料
    function fillFormData() {
        // 基本資料
        const nameElement = document.getElementById('name');
        const titleElement = document.getElementById('title');
        const emailElement = document.getElementById('email');
        const phoneElement = document.getElementById('phone');
        const addressElement = document.getElementById('address');
        const summaryElement = document.getElementById('summary');
        const skillsElement = document.getElementById('skills');
        
        if (nameElement) nameElement.value = resumeData.basic.name || '';
        if (titleElement) titleElement.value = resumeData.basic.title || '';
        if (emailElement) emailElement.value = resumeData.basic.email || '';
        if (phoneElement) phoneElement.value = resumeData.basic.phone || '';
        if (addressElement) addressElement.value = resumeData.basic.address || '';
        if (summaryElement) summaryElement.value = resumeData.basic.summary || '';
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
                    basic: {
            name: '',
            title: '',
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
        const titleElement = document.getElementById('title');
        const emailElement = document.getElementById('email');
        const phoneElement = document.getElementById('phone');
        const addressElement = document.getElementById('address');
        const summaryElement = document.getElementById('summary');
        const skillsElement = document.getElementById('skills');
        
        resumeData.basic.name = nameElement ? nameElement.value : '';
        resumeData.basic.title = titleElement ? titleElement.value : '';
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
        
        if (currentTemplate === 'modern') {
            preview.innerHTML = renderModernTemplate();
        } else if (currentTemplate === 'professional') {
            preview.innerHTML = renderProfessionalTemplate();
        } else if (currentTemplate === 'creative') {
            preview.innerHTML = renderCreativeTemplate();
        } else if (currentTemplate === 'minimal') {
            preview.innerHTML = renderMinimalTemplate();
        }
    }

    // 現代簡約模板
    function renderModernTemplate() {
        return `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6;">
                <div style="text-align: center; margin-bottom: 2rem; border-bottom: 3px solid #667eea; padding-bottom: 1rem;">
                    <h1 style="font-size: 2.5rem; color: #2d3748; margin: 0;">${resumeData.basic.name}</h1>
                    <p style="font-size: 1.2rem; color: #667eea; margin: 0.5rem 0;">${resumeData.basic.title}</p>
                                         <div style="display: flex; justify-content: center; gap: 1rem; font-size: 0.9rem; color: #718096;">
                         <span>📧 ${resumeData.basic.email}</span>
                         <span>📱 ${resumeData.basic.phone}</span>
                         <span>📍 ${resumeData.basic.address}</span>
                     </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">個人簡介</h2>
                    <p style="color: #4a5568;">${resumeData.basic.summary}</p>
                </div>
                
                ${resumeData.experience.length > 0 ? `
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
                
                ${resumeData.education.length > 0 ? `
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
                
                ${resumeData.skills ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #667eea; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">技能專長</h2>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${resumeData.skills.split(',').map(skill => `
                            <span style="background: #667eea; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.9rem;">${skill.trim()}</span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${resumeData.projects.length > 0 ? `
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
                
                ${resumeData.certificates.length > 0 ? `
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

    // 專業商務模板
    function renderProfessionalTemplate() {
        return `
            <div style="font-family: 'Times New Roman', serif; line-height: 1.5;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 2.5rem; color: #1a202c; margin: 0; text-transform: uppercase;">${resumeData.basic.name}</h1>
                    <p style="font-size: 1.1rem; color: #4a5568; margin: 0.5rem 0; font-style: italic;">${resumeData.basic.title}</p>
                                         <div style="border-top: 2px solid #2d3748; padding-top: 1rem; font-size: 0.9rem; color: #718096;">
                         <span>${resumeData.basic.email}</span> | 
                         <span>${resumeData.basic.phone}</span> | 
                         <span>${resumeData.basic.address}</span>
                     </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #2d3748; border-bottom: 1px solid #2d3748; padding-bottom: 0.5rem; text-transform: uppercase;">專業摘要</h2>
                    <p style="color: #4a5568; text-align: justify;">${resumeData.basic.summary}</p>
                </div>
                
                ${resumeData.experience.length > 0 ? `
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
                
                ${resumeData.education.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #2d3748; border-bottom: 1px solid #2d3748; padding-bottom: 0.5rem; text-transform: uppercase;">教育背景</h2>
                    ${resumeData.education.map(edu => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="color: #2d3748; margin: 0;">${edu.degree}</h3>
                                <span style="color: #718096; font-size: 0.9rem;">${edu.year}</span>
                            </div>
                            <p style="color: #4a5568; font-weight: 600; margin: 0.5rem 0;">${edu.school}</p>
                            <p style="color: #4a5568;">GPA: ${edu.gpa} | 相關課程: ${edu.courses}</p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${resumeData.skills ? `
                <div style="margin-bottom: 2rem;">
                    <h2 style="color: #2d3748; border-bottom: 1px solid #2d3748; padding-bottom: 0.5rem; text-transform: uppercase;">專業技能</h2>
                    <p style="color: #4a5568;">${resumeData.skills}</p>
                </div>
                ` : ''}
            </div>
        `;
    }

    // 創意設計模板
    function renderCreativeTemplate() {
        return `
            <div style="font-family: 'Arial', sans-serif; line-height: 1.6; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 1rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 3rem; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${resumeData.basic.name}</h1>
                    <p style="font-size: 1.3rem; margin: 0.5rem 0; opacity: 0.9;">${resumeData.basic.title}</p>
                                         <div style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;">
                         <span>📧 ${resumeData.basic.email}</span> | 
                         <span>📱 ${resumeData.basic.phone}</span> | 
                         <span>📍 ${resumeData.basic.address}</span>
                     </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem;">
                    <h2 style="margin: 0 0 1rem 0; font-size: 1.5rem;">✨ 關於我</h2>
                    <p style="margin: 0; opacity: 0.9;">${resumeData.basic.summary}</p>
                </div>
                
                ${resumeData.skills ? `
                <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem;">
                    <h2 style="margin: 0 0 1rem 0; font-size: 1.5rem;">🛠️ 技能專長</h2>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${resumeData.skills.split(',').map(skill => `
                            <span style="background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 2rem; font-size: 0.9rem;">${skill.trim()}</span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${resumeData.projects.length > 0 ? `
                <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem;">
                    <h2 style="margin: 0 0 1rem 0; font-size: 1.5rem;">🎨 作品集</h2>
                    ${resumeData.projects.map(project => `
                        <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 0.5rem;">
                            <h3 style="margin: 0 0 0.5rem 0; color: #fbbf24;">${project.name}</h3>
                            <p style="margin: 0 0 0.5rem 0; opacity: 0.9;"><strong>技術:</strong> ${project.tech}</p>
                            <p style="margin: 0; opacity: 0.8;">${project.description}</p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;
    }

    // 極簡風格模板
    function renderMinimalTemplate() {
        return `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #333;">
                <div style="margin-bottom: 3rem;">
                    <h1 style="font-size: 2.5rem; font-weight: 300; margin: 0; color: #000;">${resumeData.basic.name}</h1>
                    <p style="font-size: 1.1rem; color: #666; margin: 0.5rem 0; font-weight: 300;">${resumeData.basic.title}</p>
                                         <div style="margin-top: 1rem; font-size: 0.9rem; color: #999;">
                         ${resumeData.basic.email} • ${resumeData.basic.phone} • ${resumeData.basic.address}
                     </div>
                </div>
                
                <div style="margin-bottom: 3rem;">
                    <p style="color: #666; font-size: 1rem; line-height: 1.6;">${resumeData.basic.summary}</p>
                </div>
                
                ${resumeData.experience.length > 0 ? `
                <div style="margin-bottom: 3rem;">
                    <h2 style="font-size: 1.2rem; font-weight: 400; margin: 0 0 2rem 0; color: #000;">Experience</h2>
                    ${resumeData.experience.map(exp => `
                        <div style="margin-bottom: 2rem;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
                                <h3 style="font-size: 1rem; font-weight: 500; margin: 0; color: #000;">${exp.position}</h3>
                                <span style="font-size: 0.9rem; color: #999;">${exp.startDate} - ${exp.endDate}</span>
                            </div>
                            <p style="font-size: 0.9rem; color: #666; margin: 0 0 0.5rem 0;">${exp.company}</p>
                            <p style="font-size: 0.9rem; color: #666; line-height: 1.5;">${exp.description}</p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${resumeData.education.length > 0 ? `
                <div style="margin-bottom: 3rem;">
                    <h2 style="font-size: 1.2rem; font-weight: 400; margin: 0 0 2rem 0; color: #000;">Education</h2>
                    ${resumeData.education.map(edu => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
                                <h3 style="font-size: 1rem; font-weight: 500; margin: 0; color: #000;">${edu.degree}</h3>
                                <span style="font-size: 0.9rem; color: #999;">${edu.year}</span>
                            </div>
                            <p style="font-size: 0.9rem; color: #666; margin: 0;">${edu.school}</p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                ${resumeData.skills ? `
                <div style="margin-bottom: 3rem;">
                    <h2 style="font-size: 1.2rem; font-weight: 400; margin: 0 0 2rem 0; color: #000;">Skills</h2>
                    <p style="font-size: 0.9rem; color: #666; line-height: 1.6;">${resumeData.skills}</p>
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
                    <label>技術棧</label>
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
            
            if (result.status === 200 && result.data && result.data.pdf_url) {
                // 下載 PDF
                window.open(result.data.pdf_url, '_blank');
                
                if (typeof Utils !== 'undefined' && Utils.showNotification) {
                    Utils.showNotification('PDF 已生成，正在下載...', 'success');
                } else {
                    alert('PDF 已生成，正在下載...');
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

    // 全域函數供 HTML 使用
    window.selectTemplate = selectTemplate;
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

})(); 