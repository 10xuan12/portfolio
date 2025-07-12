/**
 * 學生履歷生成 JavaScript
 * 包含模板選擇、資料編輯、預覽和匯出功能
 */

// 當前選中的模板
let currentTemplate = 'modern';

// 履歷資料
let resumeData = {
    template: 'modern',
    basic: {
        name: '張小明',
        title: '前端開發工程師',
        email: 'zhang@example.com',
        phone: '0912-345-678',
        address: '台北市大安區復興南路一段 390 號',
        website: 'https://zhangxiaoming.dev',
        summary: '我是一名資訊管理學系的學生，專精於前端開發和 UI/UX 設計。我熱愛學習新技術，並且喜歡將創意轉化為實際的作品。我具備良好的團隊合作能力和溝通技巧，能夠快速適應新環境。'
    },
    experience: [
        {
            company: '台灣微軟股份有限公司',
            position: '前端開發實習生',
            startDate: '2024-06-01',
            endDate: '2024-08-31',
            description: '負責公司內部系統的前端開發，使用 React 和 TypeScript 開發響應式網頁應用程式。參與敏捷開發流程，與後端團隊協作完成專案。'
        }
    ],
    education: [
        {
            school: '國立台灣大學',
            degree: '資訊管理學系',
            type: '學士',
            year: 2025,
            gpa: '3.8/4.0',
            courses: '程式設計、資料結構、演算法、資料庫系統、網路程式設計、軟體工程'
        }
    ],
    skills: 'JavaScript, React, Node.js, TypeScript, HTML5, CSS3, Git, Docker, AWS, UI/UX Design, Figma, Adobe Creative Suite',
    projects: [
        {
            name: '響應式網站設計',
            tech: 'HTML5, CSS3, JavaScript',
            url: 'https://example.com',
            github: 'https://github.com/example/web-design',
            description: '使用 HTML5、CSS3 和 JavaScript 製作的現代化響應式網站，支援各種裝置尺寸。包含動畫效果和互動功能。'
        }
    ],
    certificates: [
        {
            name: 'AWS Certified Solutions Architect',
            issuer: 'Amazon Web Services',
            date: '2024-03-15',
            expiry: '2027-03-15'
        }
    ]
};

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadResumeData();
    renderPreview();
});

// 初始化事件監聽器
function initEventListeners() {
    // 模板選擇
    document.querySelectorAll('.template-option').forEach(option => {
        option.addEventListener('click', function() {
            selectTemplate(this.dataset.template);
        });
    });
    
    // 表單資料變更
    document.querySelectorAll('input, textarea, select').forEach(input => {
        input.addEventListener('input', function() {
            updateResumeData();
            renderPreview();
        });
    });
}

// 選擇模板
function selectTemplate(template) {
    currentTemplate = template;
    resumeData.template = template;
    
    // 更新選中狀態
    document.querySelectorAll('.template-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`[data-template="${template}"]`).classList.add('selected');
    
    renderPreview();
    Utils.showNotification(`已切換到 ${getTemplateName(template)} 模板`, 'success');
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
function loadResumeData() {
    // TODO: 從後端 API 載入履歷資料
    // const response = await fetch('/api/student/resume');
    // resumeData = await response.json();
    
    // 填充表單資料
    document.getElementById('name').value = resumeData.basic.name;
    document.getElementById('title').value = resumeData.basic.title;
    document.getElementById('email').value = resumeData.basic.email;
    document.getElementById('phone').value = resumeData.basic.phone;
    document.getElementById('address').value = resumeData.basic.address;
    document.getElementById('website').value = resumeData.basic.website;
    document.getElementById('summary').value = resumeData.basic.summary;
    document.getElementById('skills').value = resumeData.skills;
}

// 更新履歷資料
function updateResumeData() {
    resumeData.basic.name = document.getElementById('name').value;
    resumeData.basic.title = document.getElementById('title').value;
    resumeData.basic.email = document.getElementById('email').value;
    resumeData.basic.phone = document.getElementById('phone').value;
    resumeData.basic.address = document.getElementById('address').value;
    resumeData.basic.website = document.getElementById('website').value;
    resumeData.basic.summary = document.getElementById('summary').value;
    resumeData.skills = document.getElementById('skills').value;
    
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
                    <span>🌐 ${resumeData.basic.website}</span>
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
                    <span>${resumeData.basic.website}</span>
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
                    <span>🌐 ${resumeData.basic.website}</span>
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
                    ${resumeData.basic.email} • ${resumeData.basic.phone} • ${resumeData.basic.website}
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
    const container = document.getElementById('experienceList');
    const experienceItem = document.createElement('div');
    experienceItem.className = 'experience-item';
    experienceItem.innerHTML = `
        <div class="item-header">
            <div class="item-title">新增工作經驗</div>
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
                <input type="text" value="">
            </div>
            <div class="form-group">
                <label>職位</label>
                <input type="text" value="">
            </div>
            <div class="form-group">
                <label>開始日期</label>
                <input type="date" value="">
            </div>
            <div class="form-group">
                <label>結束日期</label>
                <input type="date" value="">
            </div>
            <div class="form-group full-width">
                <label>工作描述</label>
                <textarea rows="3"></textarea>
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
    const container = document.getElementById('educationList');
    const educationItem = document.createElement('div');
    educationItem.className = 'education-item';
    educationItem.innerHTML = `
        <div class="item-header">
            <div class="item-title">新增教育背景</div>
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
                <input type="text" value="">
            </div>
            <div class="form-group">
                <label>科系</label>
                <input type="text" value="">
            </div>
            <div class="form-group">
                <label>學位</label>
                <input type="text" value="">
            </div>
            <div class="form-group">
                <label>畢業年份</label>
                <input type="number" value="" min="2000" max="2030">
            </div>
            <div class="form-group">
                <label>GPA</label>
                <input type="text" value="">
            </div>
            <div class="form-group full-width">
                <label>相關課程</label>
                <textarea rows="2"></textarea>
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
    const container = document.getElementById('projectList');
    const projectItem = document.createElement('div');
    projectItem.className = 'experience-item';
    projectItem.innerHTML = `
        <div class="item-header">
            <div class="item-title">新增專案作品</div>
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
                <input type="text" value="">
            </div>
            <div class="form-group">
                <label>技術棧</label>
                <input type="text" value="">
            </div>
            <div class="form-group">
                <label>專案連結</label>
                <input type="url" value="">
            </div>
            <div class="form-group">
                <label>GitHub</label>
                <input type="url" value="">
            </div>
            <div class="form-group full-width">
                <label>專案描述</label>
                <textarea rows="3"></textarea>
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
    const container = document.getElementById('certificateList');
    const certificateItem = document.createElement('div');
    certificateItem.className = 'experience-item';
    certificateItem.innerHTML = `
        <div class="item-header">
            <div class="item-title">新增證照獎項</div>
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
                <input type="text" value="">
            </div>
            <div class="form-group">
                <label>發證機構</label>
                <input type="text" value="">
            </div>
            <div class="form-group">
                <label>取得日期</label>
                <input type="date" value="">
            </div>
            <div class="form-group">
                <label>有效期限</label>
                <input type="date" value="">
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

// 儲存履歷
async function saveResume() {
    try {
        updateResumeData();
        
        // TODO: 發送儲存請求到後端 API
        // const response = await fetch('/api/student/resume', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(resumeData)
        // });
        
        Utils.showNotification('履歷已儲存', 'success');
    } catch (error) {
        Utils.showNotification('儲存失敗，請稍後再試', 'error');
        console.error('儲存履歷錯誤:', error);
    }
}

// 匯出履歷
function exportResume() {
    Utils.showNotification('匯出功能開發中', 'info');
}

// 匯出 PDF
function exportPDF() {
    Utils.showNotification('PDF 匯出功能開發中', 'info');
}

// 匯出 Word
function exportWord() {
    Utils.showNotification('Word 匯出功能開發中', 'info');
}

// 列印履歷
function printResume() {
    window.print();
} 