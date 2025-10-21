/**
 * 學生個人資料管理 JavaScript
 * 包含資料編輯、頭像上傳、密碼修改等功能
 */

(function() {
    'use strict';

    // 學生資料結構，將由後端 API 填充
    let studentData = {
        id: null,
        name: '',
        gender: '',
        birth: '',
        student_id: '',
        department: '',
        grade: '',
        email: '',
        phone: '',
        address: '',
        github: '',
        linkedin: '',
        instagram: '',
        facebook: '',
        bio: '',
        skills: '',
        languages: '',
        interests: '',
        avatar: '',
        social_media: {},
        badges: [],
        activities: [],
        settings: {}
    };

    // 初始化頁面
    document.addEventListener('DOMContentLoaded', function() {
        loadStudentData();
        loadUserSettings();
        loadOptions();
        initEventListeners();
        renderBadges();
        renderActivities();
    });

    // 載入選項資料（科系、年級等）
    async function loadOptions() {
        try {
            const svc = window.apiService || window.initializeApiService?.();
            const result = await (svc ? svc.request('student/options.php?action=all') : Promise.reject(new Error('API 服務未初始化')));

            if (result && (result.status === 200 || result.success) && result.data) {
                populateDepartmentOptions(result.data.departments);
                populateGradeOptions(result.data.grades);
            } else {
                throw new Error(result?.message || '載入選項失敗');
            }
        } catch (error) {
            console.error('載入選項失敗:', error);
            // 如果 API 失敗，使用預設選項
            loadDefaultOptions();
        }
    }

    // 填充科系選項
    function populateDepartmentOptions(departments) {
        const departmentSelects = [
            document.getElementById('department'),
            document.getElementById('modal-department')
        ];

        departmentSelects.forEach(select => {
            if (select) {
                // 保留預設選項
                const defaultOption = select.querySelector('option[value=""]');
                select.innerHTML = '';
                if (defaultOption) {
                    select.appendChild(defaultOption);
                }

                // 添加科系選項
                departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.name;
                    option.textContent = dept.name;
                    option.dataset.id = dept.id;
                    option.dataset.code = dept.code;
                    option.dataset.school = dept.school;
                    select.appendChild(option);
                });
            }
        });
    }

    // 填充年級選項
    function populateGradeOptions(grades) {
        const gradeSelects = [
            document.getElementById('grade'),
            document.getElementById('modal-grade')
        ];

        gradeSelects.forEach(select => {
            if (select) {
                // 保留預設選項
                const defaultOption = select.querySelector('option[value=""]');
                select.innerHTML = '';
                if (defaultOption) {
                    select.appendChild(defaultOption);
                }

                // 添加年級選項
                grades.forEach(grade => {
                    const option = document.createElement('option');
                    option.value = grade.name;
                    option.textContent = grade.name;
                    option.dataset.id = grade.id;
                    option.dataset.level = grade.level;
                    option.dataset.year = grade.year;
                    select.appendChild(option);
                });
            }
        });
    }

    // 載入預設選項（當 API 失敗時使用）
    function loadDefaultOptions() {
        const defaultDepartments = [
            '資訊管理學系',
            '財務金融學系',
            '國際企業學系',
            '資訊工程學系',
            '統計學系'
        ];

        const defaultGrades = [
            '大學一年級',
            '大學二年級',
            '大學三年級',
            '大學四年級',
            '碩士生',
            '博士生'
        ];

        populateDepartmentOptions(defaultDepartments.map((name, index) => ({
            id: index + 1,
            name: name,
            code: '',
            school: '國立台灣大學'
        })));

        populateGradeOptions(defaultGrades.map((name, index) => ({
            id: index + 1,
            name: name,
            level: index < 4 ? 'undergraduate' : index === 4 ? 'graduate' : 'phd',
            year: index < 4 ? index + 1 : 1
        })));
    }

    // 載入學生資料
    async function loadStudentData() {
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user || !user.id) {
                console.error('無法獲取使用者資訊，請重新登入');
                if (typeof Utils !== 'undefined' && Utils.showNotification) {
                    Utils.showNotification('請重新登入', 'error');
                }
                return;
            }

            // 檢查 API 服務是否可用
            let svc = window.apiService;
            if (!svc && typeof window.initializeApiService === 'function') {
                svc = window.initializeApiService();
                // 等待一下再檢查
                await new Promise(resolve => setTimeout(resolve, 200));
                if (!svc) {
                    throw new Error('API 服務初始化失敗，請檢查後端服務是否正常運行');
                }
            }
            
            if (!svc) {
                throw new Error('API 服務未初始化');
            }

            console.log('載入個人資料，使用者 ID:', user.id);
            console.log('API 服務狀態:', typeof svc, svc);
            console.log('API Base URL:', svc.baseUrl);

            // 並行載入個人資料、徽章和活動
            const [profileResult, badgesResult, activitiesResult] = await Promise.all([
                svc.request(`student/profile.php?action=get&user_id=${user.id}`),
                svc.request(`student/badges.php?action=get&user_id=${user.id}`),
                svc.request(`student/activities.php?action=get&user_id=${user.id}`)
            ]);

            // 處理個人資料回應
            if (profileResult) {
                console.log('載入的個人資料:', profileResult);

                if ((profileResult.status === 200 || profileResult.success) && profileResult.data) {
                    // 檢查是否為首次登入
                    if (profileResult.data.is_first_login) {
                        console.log('首次登入，需要完善個人資料');
                        showFirstLoginModal();
                    }
                    
                    // 完全使用後端 API 資料
                    studentData = {
                        id: profileResult.data.id,
                        name: profileResult.data.display_name || `${profileResult.data.first_name} ${profileResult.data.last_name}`,
                        gender: profileResult.data.gender || '',
                        birth: profileResult.data.birth_date || '',
                        student_id: profileResult.data.student_id || '',
                        department: profileResult.data.major || '',
                        grade: profileResult.data.grade || '',
                        email: profileResult.data.email || '',
                        phone: profileResult.data.phone || '',
                        address: profileResult.data.address || '',
                        github: profileResult.data.social_media?.github?.url || '',
                        linkedin: profileResult.data.social_media?.linkedin?.url || '',
                        instagram: profileResult.data.social_media?.instagram?.url || '',
                        facebook: profileResult.data.social_media?.facebook?.url || '',
                        bio: profileResult.data.bio || '',
                        skills: profileResult.data.skills || '',
                        languages: profileResult.data.languages || '',
                        interests: profileResult.data.interests || '',
                        avatar: (() => {
                            const url = profileResult.data.avatar_url;
                            if (!url || url.trim() === '') return '';
                            // 外部 URL（如 DiceBear API），直接使用
                            if (/^https?:\/\//i.test(url)) return url;
                            // 本地檔案路徑，轉換為相對路徑
                            if (url.startsWith('/portfolio/')) {
                                return url.replace('/portfolio/', '../');
                            }
                            // 其他情況，直接使用
                            return url;
                        })(),
                        social_media: profileResult.data.social_media || {},
                        badges: [],
                        activities: []
                    };
                }
            }

            // 處理徽章回應
            if (badgesResult && (badgesResult.status === 200 || badgesResult.success)) {
                let badges = [];
                if (Array.isArray(badgesResult.data)) {
                    badges = badgesResult.data;
                } else if (Array.isArray(badgesResult.data?.badges)) {
                    badges = badgesResult.data.badges;
                } else if (Array.isArray(badgesResult.badges)) {
                    badges = badgesResult.badges;
                }
                studentData.badges = badges;
                console.log('個人資料徽章數據處理結果:', badges);
            }

            // 處理活動回應
            if (activitiesResult && (activitiesResult.status === 200 || activitiesResult.success)) {
                if (activitiesResult.data) {
                    studentData.activities = activitiesResult.data;
                }
            }
            
            // 更新頁面顯示
            updatePageDisplay();
            
            // 重新渲染徽章和活動
            renderBadges();
            renderActivities();
            
        } catch (error) {
            console.error('載入個人資料失敗:', error);
            
            // 顯示更詳細的錯誤訊息
            let errorMessage = '載入資料失敗，請稍後再試';
            if (error.message.includes('API 服務初始化失敗')) {
                errorMessage = '後端服務未啟動，請檢查伺服器狀態';
            } else if (error.message.includes('無法獲取使用者資訊')) {
                errorMessage = '請重新登入';
            } else if (error.message.includes('Network Error') || error.message.includes('fetch')) {
                errorMessage = '網路連線錯誤，請檢查網路狀態';
            }
            
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification(errorMessage, 'error');
            } else {
                alert(errorMessage);
            }
        }
        
        // 填充表單資料
        fillFormData();
        
        // 更新頭像
        updateAvatarDisplay();
        
    }

    // 更新頭像顯示
    function updateAvatarDisplay() {
        const imgEl = document.getElementById('avatarImage');
        const placeholderEl = document.getElementById('avatarPlaceholder');
        
        if (!imgEl || !placeholderEl) return;
        
        if (studentData.avatar && studentData.avatar.trim() !== '') {
            // 有頭貼，顯示圖片
            imgEl.style.display = 'block';
            placeholderEl.style.display = 'none';
            
            imgEl.onload = function() {
                // 圖片載入成功
                imgEl.style.display = 'block';
                placeholderEl.style.display = 'none';
            };
            
            imgEl.onerror = function() {
                // 圖片載入失敗，顯示預設頭像
                console.warn('頭貼載入失敗:', studentData.avatar);
                imgEl.style.display = 'none';
                placeholderEl.style.display = 'flex';
            };
            
            imgEl.src = studentData.avatar;
        } else {
            // 沒有頭貼，顯示預設圖示
            imgEl.style.display = 'none';
            placeholderEl.style.display = 'flex';
        }
    }

    // 填充表單資料
    function fillFormData() {
        const formFields = {
            'name': studentData.name,
            'gender': studentData.gender,
            'birth': studentData.birth,
            'student_id': studentData.student_id,
            'department': studentData.department,
            'grade': studentData.grade,
            'email': studentData.email,
            'phone': studentData.phone,
            'address': studentData.address,
            'github': studentData.github,
            'linkedin': studentData.linkedin,
            'instagram': studentData.instagram,
            'facebook': studentData.facebook,
            'bio': studentData.bio,
            'skills': studentData.skills,
            'languages': studentData.languages,
            'interests': studentData.interests
        };
        
        Object.entries(formFields).forEach(([fieldId, value]) => {
            const element = document.getElementById(fieldId);
            if (element && value !== undefined) {
                element.value = value;
            }
        });
    }

    // 初始化事件監聽器
    function initEventListeners() {
        // 個人資料表單提交
        document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
        
        // 密碼表單提交
        document.getElementById('passwordForm').addEventListener('submit', handlePasswordSubmit);
        
        // 頭像上傳
        document.getElementById('avatarInput').addEventListener('change', handleAvatarUpload);
        
        // 設定變更事件
        initSettingsChangeListeners();
        
        // 表單驗證
        initFormValidation();
    }

    // 處理個人資料表單提交
    async function handleProfileSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const profileData = {
            name: formData.get('name'),
            gender: formData.get('gender'),
            birth: formData.get('birth'),
            student_id: formData.get('student_id'),
            department: formData.get('department'),
            grade: formData.get('grade'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            github: formData.get('github'),
            linkedin: formData.get('linkedin'),
            instagram: formData.get('instagram'),
            facebook: formData.get('facebook'),
            bio: formData.get('bio'),
            skills: formData.get('skills'),
            languages: formData.get('languages'),
            interests: formData.get('interests')
        };
        
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }

            // 準備要發送的資料
            const updateData = {
                action: 'update',
                user_id: user.id,
                first_name: profileData.name.split(' ')[0] || profileData.name,
                last_name: profileData.name.split(' ').slice(1).join(' ') || '',
                display_name: profileData.name,
                gender: profileData.gender,
                birth_date: profileData.birth,
                phone: profileData.phone,
                address: profileData.address,
                bio: profileData.bio,
                student_id: profileData.student_id,
                major: profileData.department,
                school: '國立台灣大學', // 預設值
                grade: profileData.grade,
                skills: profileData.skills,
                interests: profileData.interests,
                social_media: {
                    github: { url: profileData.github, is_public: true },
                    linkedin: { url: profileData.linkedin, is_public: true },
                    instagram: { url: profileData.instagram, is_public: true },
                    facebook: { url: profileData.facebook, is_public: true }
                }
            };

            // 發送更新請求到後端 API
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request('student/profile.php', {
                method: 'POST',
                body: JSON.stringify(updateData)
            });
            console.log('更新結果:', result);

            if (result.status === 200) {
                // 更新本地資料
                Object.assign(studentData, profileData);
                Utils.showNotification('個人資料已更新', 'success');
                
                // 重新載入資料以確保同步
                await loadStudentData();
            } else {
                throw new Error(result.message || '更新失敗');
            }
        } catch (error) {
            Utils.showNotification('更新失敗，請稍後再試', 'error');
            console.error('更新個人資料錯誤:', error);
        }
    }

    // 處理密碼表單提交
    async function handlePasswordSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        
        // 驗證密碼
        if (!currentPassword) {
            Utils.showNotification('請輸入目前密碼', 'error');
            return;
        }
        
        if (!newPassword) {
            Utils.showNotification('請輸入新密碼', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            Utils.showNotification('新密碼與確認密碼不符', 'error');
            return;
        }
        
        if (newPassword.length < 8) {
            Utils.showNotification('新密碼至少需要 8 個字元', 'error');
            return;
        }
        
        // 檢查新密碼是否與目前密碼相同
        if (currentPassword === newPassword) {
            Utils.showNotification('新密碼不能與目前密碼相同', 'error');
            return;
        }
        
        // 檢查密碼強度
        const passwordStrength = checkPasswordStrength(newPassword);
        if (passwordStrength < 2) {
            Utils.showNotification('密碼強度不足，建議包含大小寫字母、數字和特殊符號', 'warning');
        }
        
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }

            // 發送密碼修改請求到後端 API
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request('student/password.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'change_password',
                    user_id: user.id,
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            if (result.status === 200) {
                e.target.reset();
                Utils.showNotification('密碼已成功修改', 'success');
                
                // 可選：登出使用者，要求重新登入
                if (confirm('密碼已修改，建議重新登入以確保安全。是否要登出？')) {
                    localStorage.removeItem('user');
                    window.location.href = '/portfolio/frontend/login.html';
                }
            } else {
                throw new Error(result.message || '密碼修改失敗');
            }
        } catch (error) {
            Utils.showNotification(error.message || '密碼修改失敗，請檢查目前密碼是否正確', 'error');
            console.error('修改密碼錯誤:', error);
        }
    }

    // 處理頭像上傳
    async function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 驗證檔案類型
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            Utils.showNotification('只允許上傳 JPG、PNG 或 GIF 格式的圖片', 'error');
            return;
        }
        
        // 驗證檔案大小 (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            Utils.showNotification(`圖片檔案大小不能超過 ${Math.round(maxSize / 1024 / 1024)}MB`, 'error');
            return;
        }
        
        // 驗證圖片尺寸
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = async function() {
            URL.revokeObjectURL(url);
            
            if (img.width < 100 || img.height < 100) {
                Utils.showNotification('圖片尺寸太小，建議至少 100x100 像素', 'warning');
            }
            
            if (img.width > 2000 || img.height > 2000) {
                Utils.showNotification('圖片尺寸太大，建議不超過 2000x2000 像素', 'warning');
            }
            
            // 開始上傳
            await uploadAvatarFile(file);
        };
        
        img.onerror = function() {
            URL.revokeObjectURL(url);
            Utils.showNotification('無法讀取圖片檔案，請選擇有效的圖片', 'error');
        };
        
        img.src = url;
    }

    // 上傳頭像檔案
    async function uploadAvatarFile(file) {
        try {
            // 顯示上傳中狀態
            Utils.showNotification('正在上傳頭像...', 'info');
            
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }

            // 準備 FormData 並上傳檔案到後端
            const formData = new FormData();
            formData.append('avatar', file);
            formData.append('action', 'upload_avatar');
            formData.append('user_id', user.id);

            const uploadUrl = (window.apiService || window.initializeApiService?.()).getApiUrl('student/profile.php');
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'X-User-ID': user.id },
                body: formData
            });
            const result = await response.json();
            
            if (result.status === 200) {
                // 更新頭像顯示
                const avatarUrl = result.data.avatar_url;
                studentData.avatar = avatarUrl;
                
                // 更新頭像顯示
                updateAvatarDisplay();
                
                // 更新 localStorage 中的使用者資訊
                const currentUser = JSON.parse(localStorage.getItem('user'));
                currentUser.avatar = avatarUrl;
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                Utils.showNotification('頭像上傳成功', 'success');
            } else {
                throw new Error(result.message || '頭像上傳失敗');
            }
            
        } catch (error) {
            Utils.showNotification(error.message || '頭像上傳失敗，請稍後再試', 'error');
            console.error('上傳頭像錯誤:', error);
        }
    }

    // 重置表單
    function resetForm() {
        if (confirm('確定要重置所有變更嗎？')) {
            loadStudentData();
            Utils.showNotification('表單已重置', 'info');
        }
    }


    // 更新頁面顯示
    function updatePageDisplay() {
        // 更新個人資料標題區域
        const profileName = document.getElementById('profile-name');
        if (profileName) {
            profileName.textContent = studentData.name || '未設定';
        }
        
        const profileDeptGrade = document.getElementById('profile-department-grade');
        if (profileDeptGrade) {
            if (studentData.department && studentData.grade) {
                profileDeptGrade.textContent = `${studentData.department} · ${studentData.grade}`;
            } else if (studentData.department) {
                profileDeptGrade.textContent = studentData.department;
            } else {
                profileDeptGrade.textContent = '未設定';
            }
        }
        
        const profileStudentId = document.getElementById('profile-student-id');
        if (profileStudentId) {
            profileStudentId.textContent = `學生編號: ${studentData.student_id || '未設定'}`;
        }
        
        
        // 更新頭像
        updateAvatarDisplay();
    }

    // 渲染徽章
    function renderBadges() {
        const badgeGrid = document.getElementById('badge-grid');
        if (!badgeGrid) return;
        
        const badges = studentData.badges || [];
        
        // 調試：輸出徽章數據
        console.log('個人資料徽章數據:', badges);
        
        if (badges.length > 0) {
            badgeGrid.innerHTML = badges.map((badge, index) => {
                // 根據徽章名稱或類別決定CSS類別
                const badgeType = getBadgeType(badge.name, badge.category);
                const badgeClass = badge.earned ? `earned badge-${badgeType}` : 'not-earned';
                
                // 調試：輸出每個徽章的資訊
                console.log(`個人資料徽章 ${index}:`, {
                    name: badge.name,
                    icon: badge.icon,
                    earned: badge.earned,
                    category: badge.category,
                    badgeType: badgeType,
                    badgeClass: badgeClass
                });
                
                return `
                    <li class="badge-item ${badgeClass}">
                        <div class="badge-icon">
                            <i class="${badge.icon || getDefaultIcon(badgeType)}"></i>
                        </div>
                        <div>
                            <div>${badge.name || '未知徽章'}</div>
                            <small>${badge.description || '暫無描述'}</small>
                            ${badge.earned_date ? `<small>獲得於 ${badge.earned_date}</small>` : ''}
                        </div>
                    </li>
                `;
            }).join('');
        } else {
            badgeGrid.innerHTML = `
                <li class="badge-item loading-placeholder">
                    <div class="badge-icon">
                        <i class="bi bi-star"></i>
                    </div>
                    <div>
                        <div>目前還沒有徽章</div>
                        <small>完成更多作品來獲得徽章</small>
                    </div>
                </li>
            `;
        }
    }

    /**
     * 根據徽章名稱或類別決定徽章類型
     */
    function getBadgeType(badgeName, category) {
        // 簡化版：所有徽章都使用 achievement 類型
        return 'achievement';
    }

    /**
     * 根據徽章類型獲取預設圖標 - Bootstrap Icons
     */
    function getDefaultIcon(badgeType) {
        const iconMap = {
            'login': 'bi bi-box-arrow-in-right',
            'upload': 'bi bi-cloud-upload',
            'profile': 'bi bi-person-circle',
            'creator': 'bi bi-star-fill',
            'popular': 'bi bi-fire',
            'social': 'bi bi-people-fill',
            'achievement': 'bi bi-trophy-fill',
            'special': 'bi bi-gem'
        };
        
        return iconMap[badgeType] || 'bi bi-star-fill';
    }

    // 渲染活動記錄
    function renderActivities() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        const activities = studentData.activities || [];
        
        if (activities.length > 0) {
            activityList.innerHTML = activities.map(activity => `
                <li class="activity-item">
                    <div class="activity-icon activity-${activity.type || 'default'}">
                        <i class="fas fa-${getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">${activity.text || activity.message || '未知活動'}</div>
                        <div class="activity-time">${activity.time || activity.created_at || '未知時間'}</div>
                    </div>
                </li>
            `).join('');
        } else {
            activityList.innerHTML = `
                <li class="no-activities">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">目前還沒有活動記錄</div>
                        <div class="activity-time">開始使用系統來記錄活動</div>
                    </div>
                </li>
            `;
        }
    }

    // 取得活動圖示
    function getActivityIcon(type) {
        const iconMap = {
            'upload': 'upload',
            'view': 'eye',
            'like': 'heart',
            'comment': 'comment'
        };
        return iconMap[type] || 'info-circle';
    }

    // 初始化表單驗證
    function initFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                // 即時驗證
                input.addEventListener('blur', function() {
                    validateField(this);
                });
                
                // 輸入時清除錯誤
                input.addEventListener('input', function() {
                    clearFieldError(this);
                });
            });
        });
    }

    // 驗證欄位
    function validateField(field) {
        const value = field.value.trim();
        
        // 必填欄位驗證
        if (field.hasAttribute('required') && !value) {
            showFieldError(field, '此欄位為必填');
            return false;
        }
        
        // 電子郵件驗證
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                showFieldError(field, '請輸入有效的電子郵件地址');
                return false;
            }
        }
        
        // URL 驗證
        if (field.type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                showFieldError(field, '請輸入有效的網址');
                return false;
            }
        }
        
        // 電話號碼驗證
        if (field.name === 'phone' && value) {
            const phoneRegex = /^[\d\-\+\(\)\s]+$/;
            if (!phoneRegex.test(value)) {
                showFieldError(field, '請輸入有效的電話號碼');
                return false;
            }
        }
        
        clearFieldError(field);
        return true;
    }

    // 顯示欄位錯誤
    function showFieldError(field, message) {
        clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #f87171;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        `;
        
        field.parentNode.appendChild(errorDiv);
        field.style.borderColor = '#f87171';
    }

    // 清除欄位錯誤
    function clearFieldError(field) {
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        field.style.borderColor = '';
    }

    // 匯出個人資料
    function exportProfileData() {
        // 顯示匯出選項
        const exportType = prompt('請選擇匯出格式：\n1. JSON 格式\n2. CSV 格式\n3. PDF 格式\n\n輸入數字 1-3：');
        
        if (!exportType) return;
        
        try {
            switch (exportType.trim()) {
                case '1':
                    exportAsJSON();
                    break;
                case '2':
                    exportAsCSV();
                    break;
                case '3':
                    exportAsPDF();
                    break;
                default:
                    Utils.showNotification('無效的選擇，請輸入 1-3', 'error');
                    return;
            }
        } catch (error) {
            console.error('匯出失敗:', error);
            Utils.showNotification('匯出失敗，請稍後再試', 'error');
        }
    }

    // 匯出為 JSON 格式
    function exportAsJSON() {
        const exportData = {
            ...studentData,
            exportDate: new Date().toISOString(),
            exportFormat: 'JSON'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `profile_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        Utils.showNotification('個人資料已匯出為 JSON 格式', 'success');
    }

    // 匯出為 CSV 格式
    function exportAsCSV() {
        const csvData = [
            ['欄位', '值'],
            ['姓名', studentData.name || ''],
            ['性別', studentData.gender || ''],
            ['生日', studentData.birth || ''],
            ['學號', studentData.student_id || ''],
            ['科系', studentData.department || ''],
            ['年級', studentData.grade || ''],
            ['電子郵件', studentData.email || ''],
            ['電話', studentData.phone || ''],
            ['地址', studentData.address || ''],
            ['GitHub', studentData.github || ''],
            ['LinkedIn', studentData.linkedin || ''],
            ['Instagram', studentData.instagram || ''],
            ['Facebook', studentData.facebook || ''],
            ['個人簡介', studentData.bio || ''],
            ['技能專長', studentData.skills || ''],
            ['語言能力', studentData.languages || ''],
            ['興趣愛好', studentData.interests || ''],
            ['匯出日期', (() => {
                const d = new Date();
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}/${month}/${day}`;
            })()]
        ];
        
        const csvContent = csvData.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `profile_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        Utils.showNotification('個人資料已匯出為 CSV 格式', 'success');
    }

    // 匯出為 PDF 格式
    function exportAsPDF() {
        // 檢查是否有 jsPDF 函式庫（處理 UMD 匯出）
        const JsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!JsPDFClass) {
            // 若已在載入中，避免重複提示
            if (!window.__isLoadingJsPDF) {
                window.__isLoadingJsPDF = true;
                Utils.showNotification('PDF 匯出功能需要 jsPDF 函式庫，正在載入...', 'warning');
                // 嘗試載入 jsPDF
                loadJSPDF().then(() => {
                    window.__isLoadingJsPDF = false;
                    exportAsPDF();
                }).catch(() => {
                    window.__isLoadingJsPDF = false;
                    Utils.showNotification('無法載入 PDF 函式庫，請使用其他格式匯出', 'error');
                });
            }
            return;
        }
        
        try {
            const doc = new JsPDFClass();
            
            // 設定中文字體（如果支援）
            doc.setFont('helvetica');
            doc.setFontSize(16);
            
            // 標題
            doc.text('個人資料', 105, 20, { align: 'center' });
            
            // 基本資料
            doc.setFontSize(12);
            doc.text(`姓名：${studentData.name || ''}`, 20, 40);
            doc.text(`性別：${studentData.gender || ''}`, 20, 50);
            doc.text(`生日：${studentData.birth || ''}`, 20, 60);
            doc.text(`學號：${studentData.student_id || ''}`, 20, 70);
            doc.text(`科系：${studentData.department || ''}`, 20, 80);
            doc.text(`年級：${studentData.grade || ''}`, 20, 90);
            doc.text(`電子郵件：${studentData.email || ''}`, 20, 100);
            doc.text(`電話：${studentData.phone || ''}`, 20, 110);
            doc.text(`地址：${studentData.address || ''}`, 20, 120);
            
            // 社群媒體
            doc.text(`GitHub：${studentData.github || ''}`, 20, 140);
            doc.text(`LinkedIn：${studentData.linkedin || ''}`, 20, 150);
            doc.text(`Instagram：${studentData.instagram || ''}`, 20, 160);
            doc.text(`Facebook：${studentData.facebook || ''}`, 20, 170);
            
            // 專業資訊
            doc.text(`個人簡介：${studentData.bio || ''}`, 20, 190);
            doc.text(`技能專長：${studentData.skills || ''}`, 20, 200);
            doc.text(`語言能力：${studentData.languages || ''}`, 20, 210);
            doc.text(`興趣愛好：${studentData.interests || ''}`, 20, 220);
            
            // 匯出日期
            const exportDate = (() => {
                const d = new Date();
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}/${month}/${day}`;
            })();
            doc.text(`匯出日期：${exportDate}`, 20, 240);
            
            // 儲存檔案
            doc.save(`profile_${new Date().toISOString().split('T')[0]}.pdf`);
            
            Utils.showNotification('個人資料已匯出為 PDF 格式', 'success');
        } catch (error) {
            console.error('PDF 匯出錯誤:', error);
            Utils.showNotification('PDF 匯出失敗，請使用其他格式', 'error');
        }
    }

    // 載入 jsPDF 函式庫
    async function loadJSPDF() {
        return new Promise((resolve, reject) => {
            const alreadyHas = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
            if (alreadyHas) {
                resolve();
                return;
            }
            const existing = document.querySelector('script[data-lib="jspdf"]');
            if (existing) {
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', () => reject(new Error('無法載入 jsPDF')));
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.setAttribute('data-lib', 'jspdf');
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('無法載入 jsPDF'));
            document.head.appendChild(script);
        });
    }

    // 載入使用者設定
    async function loadUserSettings() {
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                return;
            }

            // 嘗試從 localStorage 載入已儲存的設定
            const savedSettings = localStorage.getItem('user_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                updateSettingsUI(settings);
                studentData.settings = settings;
                return;
            }

            // 如果沒有本地設定，從後端 API 載入
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request(`student/settings.php?action=get&user_id=${user.id}`);
            if (result && (result.status === 200 || result.success)) {
                if (result.data) {
                    const settings = {
                        emailNotification: result.data.email_notification || false,
                        publicProfile: result.data.public_profile || true,
                        twoFactor: result.data.two_factor_auth || false
                    };
                    
                    // 更新 UI 和本地儲存
                    updateSettingsUI(settings);
                    studentData.settings = settings;
                    localStorage.setItem('user_settings', JSON.stringify(settings));
                }
            }
        } catch (error) {
            console.error('載入使用者設定失敗:', error);
            // 使用預設設定
            const defaultSettings = {
                emailNotification: true,
                publicProfile: true,
                twoFactor: false
            };
            updateSettingsUI(defaultSettings);
            studentData.settings = defaultSettings;
        }
    }

    // 更新設定 UI
    function updateSettingsUI(settings) {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        if (checkboxes.length >= 3) {
            checkboxes[0].checked = settings.emailNotification;
            checkboxes[1].checked = settings.publicProfile;
            checkboxes[2].checked = settings.twoFactor;
        }
    }

    // 初始化設定變更事件監聽器
    function initSettingsChangeListeners() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', function() {
                // 延遲儲存，避免頻繁 API 呼叫
                clearTimeout(this.saveTimeout);
                this.saveTimeout = setTimeout(() => {
                    updateAccountSettings();
                }, 1000);
            });
        });
    }

    // 檢查密碼強度
    function checkPasswordStrength(password) {
        let strength = 0;
        
        // 長度檢查
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // 包含小寫字母
        if (/[a-z]/.test(password)) strength++;
        
        // 包含大寫字母
        if (/[A-Z]/.test(password)) strength++;
        
        // 包含數字
        if (/\d/.test(password)) strength++;
        
        // 包含特殊符號
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
        
        return strength;
    }

    // 更新帳號設定
    async function updateAccountSettings() {
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }

            // 獲取設定值
            const emailNotification = document.querySelector('input[type="checkbox"]').checked;
            const publicProfile = document.querySelectorAll('input[type="checkbox"]')[1].checked;
            const twoFactor = document.querySelectorAll('input[type="checkbox"]')[2].checked;
            
            // 發送設定更新請求到後端 API
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request('student/settings.php', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update_settings',
                    user_id: user.id,
                    email_notification: emailNotification,
                    public_profile: publicProfile,
                    two_factor_auth: twoFactor
                })
            });
            
            if (result.status === 200) {
                Utils.showNotification('帳號設定已更新', 'success');
                
                // 更新本地資料
                studentData.settings = {
                    emailNotification,
                    publicProfile,
                    twoFactor
                };
                
                // 可選：儲存到 localStorage
                localStorage.setItem('user_settings', JSON.stringify({
                    emailNotification,
                    publicProfile,
                    twoFactor
                }));
            } else {
                throw new Error(result.message || '設定更新失敗');
            }
            
        } catch (error) {
            Utils.showNotification(error.message || '設定更新失敗，請稍後再試', 'error');
            console.error('更新帳號設定錯誤:', error);
        }
    }

    // 顯示首次登入模態框
    function showFirstLoginModal() {
        const modal = document.getElementById('firstLoginModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // 關閉首次登入模態框
    function closeFirstLoginModal() {
        const modal = document.getElementById('firstLoginModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 提交首次登入資料
    async function submitFirstLogin() {
        const form = document.getElementById('firstLoginForm');
        const formData = new FormData(form);
        
        // 驗證必填欄位
        const firstName = formData.get('first_name');
        const lastName = formData.get('last_name');
        
        if (!firstName || !lastName) {
            Utils.showNotification('請填寫名字和姓氏', 'error');
            return;
        }
        
        try {
            // 從 localStorage 獲取使用者資訊
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.id) {
                throw new Error('無法獲取使用者資訊');
            }
            
            // 準備要發送的資料
            const updateData = {
                action: 'update',
                user_id: user.id,
                first_name: firstName,
                last_name: lastName,
                display_name: `${lastName}${firstName}`,
                phone: formData.get('phone') || '',
                major: formData.get('major') || '',
                grade: formData.get('grade') || '',
                bio: formData.get('bio') || '',
                school: '國立台灣大學', // 預設值
                is_public: true
            };
            
            // 發送更新請求到後端 API
            const svc = window.apiService || window.initializeApiService?.();
            const result = await svc.request('student/profile.php', {
                method: 'POST',
                body: JSON.stringify(updateData)
            });
            console.log('首次登入資料更新結果:', result);
            
            if (result.status === 200) {
                Utils.showNotification('個人資料設定完成！', 'success');
                
                // 關閉模態框
                closeFirstLoginModal();
                
                // 重新載入資料
                await loadStudentData();
            } else {
                throw new Error(result.message || '更新失敗');
            }
        } catch (error) {
            Utils.showNotification('設定失敗，請稍後再試', 'error');
            console.error('首次登入設定錯誤:', error);
        }
    }

    // 全域函數供 HTML 使用
    window.resetForm = resetForm;
    window.exportProfileData = exportProfileData;
    window.updateAccountSettings = updateAccountSettings;
    window.submitFirstLogin = submitFirstLogin;
    window.closeFirstLoginModal = closeFirstLoginModal;

})(); 