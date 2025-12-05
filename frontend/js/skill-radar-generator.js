/**
 * 技能雷達圖生成器 - 履歷風格
 * 基於學生作品自動分析技能並生成雷達圖
 */

// 輔助函數：獲取 API 基礎 URL
function getApiBase() {
    return (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.API_BASE_URL) 
        ? APP_CONFIG.API_BASE_URL 
        : '/api';
}

class SkillRadarGenerator {
    constructor(containerId, studentId) {
        this.container = document.getElementById(containerId);
        this.studentId = studentId;
        this.chart = null;
        this.skillsData = {};
        this.init();
    }

    async init() {
        this.renderLoading();
        await this.fetchSkillAnalysis();
        this.renderRadarChart();
        this.renderSkillBreakdown();
    }

    renderLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }

    updatePageSubtitle(student, portfolioCount) {
        const subtitleElement = document.getElementById('pageSubtitle');
        if (subtitleElement && student) {
            const studentName = student.display_name || student.first_name || student.username || '您';
            const portfolioText = portfolioCount > 0 ? `，已分析 ${portfolioCount} 個作品` : '';
            subtitleElement.textContent = `${studentName} 的技能分析雷達圖${portfolioText}`;
        }
    }

    async fetchSkillAnalysis() {
        try {
            console.log('正在為學生 ID', this.studentId, '獲取技能分析數據...');
            const response = await fetch(`${getApiBase()}/student/skill-analysis.php?action=get_skill_analysis&student_id=${this.studentId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('技能分析 API 回應:', data);

            if (data.status === 200 || data.success) {
                this.skillsData = data.data;
                
                // 驗證返回的數據是否為當前請求的學生
                const returnedStudentId = data.data.student_id || data.data.student?.id;
                if (returnedStudentId && returnedStudentId != this.studentId) {
                    console.warn('警告：返回的學生ID與請求的不符！', {
                        requested: this.studentId,
                        returned: returnedStudentId
                    });
                }
                
                console.log('成功載入學生', this.studentId, '的技能數據', {
                    studentName: data.data.student?.display_name || data.data.student?.username,
                    portfolioCount: data.data.portfolio_count || data.data.portfolios?.length || 0
                });
                
                // 更新頁面副標題顯示學生姓名
                this.updatePageSubtitle(data.data.student, data.data.portfolio_count || data.data.portfolios?.length || 0);
            } else {
                this.showErrorState('技能分析失敗：' + (data.message || '未知錯誤'));
                console.error("Skill analysis API error:", data.message);
            }
        } catch (error) {
            this.showErrorState('載入技能分析時發生錯誤：' + error.message);
            console.error("Error fetching skill analysis for student", this.studentId, ":", error);
        }
    }

    renderRadarChart() {
        if (!this.skillsData || !this.skillsData.radarChartData) {
            this.container.innerHTML = `
                <div class="no-data-state">
                    <div class="no-data-icon"></div>
                    <h3>暫無技能分析資料</h3>
                    <p>請先上傳一些作品，我們將為您生成技能雷達圖</p>
                </div>
            `;
            this.hideLoading();
            return;
        }

        // 生成唯一的 canvas ID
        const canvasId = `skillRadarChart_${this.studentId}_${Date.now()}`;
        
        this.container.innerHTML = `
            <div class="radar-chart-wrapper">
                <canvas id="${canvasId}"></canvas>
            </div>
        `;

        this.hideLoading();
        
        // 確保 DOM 元素已經創建並渲染
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.createChart(canvasId);
            });
        });
    }

    createChart(canvasId) {
        console.log('Creating chart with canvas ID:', canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('Canvas element not found:', canvasId);
            console.log('Available elements with similar IDs:', 
                Array.from(document.querySelectorAll('[id*="skillRadar"]')).map(el => el.id));
            return;
        }
        
        if (typeof canvas.getContext !== 'function') {
            console.error('Canvas element does not have getContext method:', canvas);
            console.log('Canvas element type:', typeof canvas);
            console.log('Canvas element constructor:', canvas.constructor.name);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'radar',
            data: this.skillsData.radarChartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            color: '#64748b'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + Math.round(context.raw) + '%';
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        min: 0,
                        ticks: {
                            stepSize: 20,
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            color: '#94a3b8',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        pointLabels: {
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            color: '#475569',
                            padding: 15
                        },
                        grid: {
                            color: '#e2e8f0',
                            lineWidth: 1
                        },
                        angleLines: {
                            color: '#e2e8f0',
                            lineWidth: 1
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3,
                        tension: 0.1
                    },
                    point: {
                        radius: 6,
                        hoverRadius: 8,
                        borderWidth: 2
                    }
                }
            }
        });
        
        // 創建雷達圖後渲染技能詳細分析
        this.renderSkillBreakdown();
    }

    renderSkillBreakdown() {
        if (!this.skillsData || !this.skillsData.skill_analysis) {
            return;
        }

        const breakdownContainer = document.getElementById('skillBreakdown');
        if (!breakdownContainer) return;

        const categories = this.skillsData.skill_analysis;
        const categoryNames = {
            // 程式開發類
            '前端開發': 'frontend',
            '後端開發': 'backend',
            '行動開發': 'mobile',
            '資料庫': 'database',
            
            // 數據與AI類
            '資料分析': 'data',
            '機器學習': 'ml',
            
            // 設計創意類
            'UI/UX設計': 'design',
            '平面設計': 'graphic',
            '3D設計': '3d',
            
            // 多媒體製作類
            '影片剪輯': 'video',
            '動畫特效': 'animation',
            '音訊製作': 'audio',
            '攝影': 'photography',
            
            // 工程技術類
            '工業自動化': 'industrial',
            '機器人學': 'robotics',
            '建築營建': 'architecture',
            '網路安全': 'security',
            
            // 科學研究類
            '數學統計': 'math',
            '物理': 'physics',
            '醫療健康': 'medical',
            '生物資訊': 'bioinfo',
            
            // 人文社科類
            '心理學': 'psychology',
            '數位媒體': 'media',
            '跨文化溝通': 'communication',
            
            // 商業管理類
            '專案管理': 'management',
            '數位行銷': 'marketing',
            '電商商業': 'ecommerce',
            
            // 其他專業類
            '雲端技術': 'cloud',
            '爬蟲自動化': 'automation',
            '其他技能': 'other'
        };

        let breakdownHtml = '';
        
        Object.entries(categories).forEach(([category, data]) => {
            const score = data.score || 0;
            if (score > 0) {
                const categoryClass = categoryNames[category] || 'other';
                const level = this.getSkillLevel(score);
                const portfolioCount = data.portfolio_count || 0;
                const keywords = data.keywords_matched || [];
                
                breakdownHtml += `
                    <div class="skill-item skill-${categoryClass}">
                        <div class="skill-icon">
                            <div class="skill-icon-inner"></div>
                        </div>
                        <div class="skill-info">
                            <h4 class="skill-name">${category}</h4>
                            <p class="skill-score">技能強度: ${score}%</p>
                            <p class="skill-details">相關作品: ${portfolioCount} 個</p>
                            ${keywords.length > 0 ? `<p class="skill-keywords">關鍵詞: ${keywords.slice(0, 3).join(', ')}</p>` : ''}
                        </div>
                        <div class="skill-level">
                            <div class="level-bar">
                                <div class="level-fill" style="width: ${score}%"></div>
                            </div>
                            <span class="level-text">${level}</span>
                        </div>
                    </div>
                `;
            }
        });

        breakdownContainer.innerHTML = breakdownHtml;
    }

    getSkillLevel(score) {
        if (score >= 80) return '專家';
        if (score >= 60) return '熟練';
        if (score >= 40) return '中等';
        if (score >= 20) return '初學';
        return '新手';
    }

    showErrorState(message) {
        this.container.innerHTML = `
            <div class="error-state">
                <div class="error-icon"></div>
                <h3>載入失敗</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="location.reload()">
                    <div class="btn-icon refresh-icon"></div>
                    重新載入
                </button>
            </div>
        `;
        this.hideLoading();
    }

    exportChart() {
        if (this.chart) {
            const image = this.chart.toBase64Image('image/png', 1.0);
            const link = document.createElement('a');
            link.href = image;
            link.download = `skill_radar_chart_${this.studentId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

// 全域函數
function refreshAnalysis() {
    location.reload();
}

function exportRadarChart() {
    if (window.skillRadarGenerator) {
        window.skillRadarGenerator.exportChart();
    }
}