<?php
require_once '../config.php';

// 學生履歷管理 API
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'list':
                    getResumeList();
                    break;
                case 'get':
                    getResumeData();
                    break;
                case 'detail':
                    getResumeDetail();
                    break;
                case 'templates':
                    getResumeTemplates();
                    break;
                case 'export':
                    exportResume();
                    break;
                default:
                    sendError('無效的操作', 400);
            }
        } else {
            sendError('缺少操作類型', 400);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'save':
                    saveResumeData($input);
                    break;
                case 'create':
                    createResume($input);
                    break;
                case 'update':
                    updateResume($input);
                    break;
                case 'delete':
                    deleteResume($input);
                    break;
                case 'duplicate':
                    duplicateResume($input);
                    break;
                case 'publish':
                    publishResume($input);
                    break;
                case 'archive':
                    archiveResume($input);
                    break;
                case 'generate_pdf':
                    generateAndSavePDF($input);
                    break;
                default:
                    sendError('無效的操作', 400);
            }
        } else {
            sendError('缺少操作類型', 400);
        }
        break;
        
    default:
        sendError('不支援的 HTTP 方法', 405);
}

// 取得履歷列表
function getResumeList() {
    $userId = checkPermission('student');
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT id, title, template, is_public, download_count, view_count, status, version, created_at, updated_at
        FROM resumes 
        WHERE user_id = ?
        ORDER BY version DESC, updated_at DESC
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $resumes = [];
    while ($row = $result->fetch_assoc()) {
        $resumes[] = $row;
    }
    
    sendResponse($resumes, 200);
}

// 取得使用者履歷資料
function getResumeData() {
    try {
        $userId = checkPermission('student');
        
        // 檢查資料庫連接
        if (!isset($GLOBALS['conn']) || $GLOBALS['conn']->connect_error) {
            sendError('資料庫連接失敗', 500);
        }
        
        // 先嘗試從 resumes 表取得已儲存的履歷
        $stmt = $GLOBALS['conn']->prepare("
            SELECT content, template
            FROM resumes 
            WHERE user_id = ?
            ORDER BY updated_at DESC
            LIMIT 1
        ");
        
        if ($stmt) {
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $resume = $result->fetch_assoc();
                $savedData = json_decode($resume['content'], true);
                
                // 檢查是否有基本資料，如果基本資料是空的，則不使用已儲存的履歷
                if ($savedData && is_array($savedData)) {
                    $hasBasicData = !empty($savedData['basic']['name']) || 
                                   !empty($savedData['basic']['email']) || 
                                   !empty($savedData['basic']['phone']);
                    
                    if ($hasBasicData) {
                        // 有已儲存的履歷且有基本資料，直接返回
                        sendResponse($savedData, 200);
                        return;
                    }
                    // 已儲存的履歷沒有基本資料，繼續從個人資料載入
                }
            }
        }
        
        // 沒有已儲存的履歷，從個人資料建立基本履歷
        $stmt = $GLOBALS['conn']->prepare("
            SELECT 
                sp.first_name, 
                sp.last_name, 
                sp.display_name,
                u.email, 
                sp.phone, 
                sp.address, 
                sp.birth_date,
                sp.bio, 
                sp.school, 
                sp.major, 
                sp.grade,
                sp.graduation_year,
                sp.skills,
                sp.student_id
            FROM student_profiles sp
            LEFT JOIN users u ON sp.user_id = u.id
            WHERE sp.user_id = ?
        ");
        
        if (!$stmt) {
            sendError('SQL 準備失敗: ' . $GLOBALS['conn']->error, 500);
        }
        
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $profile = $result->fetch_assoc();
        
        if (!$profile) {
            // 如果找不到 student_profiles 記錄，返回空白履歷
            $resumeData = [
                'template' => 'executive',
                'colorScheme' => 'blue',
                'font' => 'modern',
                'basic' => [
                    'name' => '',
                    'birthDate' => '',
                    'email' => '',
                    'phone' => '',
                    'address' => '',
                    'summary' => ''
                ],
                'skills' => '',
                'experience' => [],
                'education' => [],
                'projects' => [],
                'certificates' => []
            ];
            sendResponse($resumeData, 200);
            return;
        }
        
        // 取得使用者的作品集
        $stmt = $GLOBALS['conn']->prepare("
            SELECT id, title, description, tags, cover_image, created_at, status
            FROM portfolios 
            WHERE user_id = ? AND status = 'published'
            ORDER BY created_at DESC
            LIMIT 10
        ");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $portfolios = [];
        while ($row = $result->fetch_assoc()) {
            $portfolios[] = [
                'name' => $row['title'],
                'tech' => $row['tags'] ?: '', // 使用 tags 作為技術
                'url' => '', // portfolios 表沒有此欄位
                'github' => '', // portfolios 表沒有此欄位
                'description' => $row['description']
            ];
        }
        
        // 取得技能（優先使用個人資料中的 skills，如果沒有則從作品集提取）
        $skills = [];
        
        // 優先使用 student_profiles 的 skills 欄位
        if (!empty($profile['skills'])) {
            $profileSkills = explode(',', $profile['skills']);
            foreach ($profileSkills as $skill) {
                $skill = trim($skill);
                if ($skill && !in_array($skill, $skills)) {
                    $skills[] = $skill;
                }
            }
        }
        
        // 如果個人資料沒有技能，從作品集提取
        if (empty($skills)) {
            $stmt = $GLOBALS['conn']->prepare("
                SELECT tags
                FROM portfolios 
                WHERE user_id = ? AND tags IS NOT NULL AND tags != ''
                ORDER BY created_at DESC
            ");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            while ($row = $result->fetch_assoc()) {
                if ($row['tags']) {
                    $tags = explode(',', $row['tags']);
                    foreach ($tags as $tag) {
                        $tag = trim($tag);
                        if ($tag && !in_array($tag, $skills)) {
                            $skills[] = $tag;
                        }
                    }
                }
            }
        }
        
        // 從個人資料建立教育背景
        $education = [];
        if ($profile && $profile['school']) {
            $education[] = [
                'school' => $profile['school'],
                'degree' => $profile['major'] ?: '',
                'type' => '學士',
                'year' => $profile['graduation_year'] ?: '',
                'gpa' => '',
                'courses' => ''
            ];
        }
        
        // 組合姓名（優先使用 display_name）
        $fullName = '';
        if (!empty($profile['display_name'])) {
            $fullName = $profile['display_name'];
        } else {
            $fullName = trim(($profile['first_name'] ?? '') . ' ' . ($profile['last_name'] ?? ''));
        }
        
        // 組合履歷資料
        $resumeData = [
            'template' => 'executive',
            'colorScheme' => 'blue',
            'font' => 'modern',
            'basic' => [
                'name' => $fullName ?: '',
                'birthDate' => $profile['birth_date'] ?? '',
                'email' => $profile['email'] ?? '',
                'phone' => $profile['phone'] ?? '',
                'address' => $profile['address'] ?? '',
                'summary' => $profile['bio'] ?? ''
            ],
            'skills' => !empty($skills) ? implode(', ', $skills) : '',
            'experience' => [], // 工作經驗需要使用者自己填寫
            'education' => $education,
            'projects' => $portfolios,
            'certificates' => [] // 證照需要使用者自己填寫
        ];
        
        sendResponse($resumeData, 200);
        
    } catch (Exception $e) {
        sendError('取得履歷資料失敗: ' . $e->getMessage(), 500);
    }
}

// 儲存履歷資料（不生成 PDF）
function saveResumeData($input) {
    $userId = checkPermission('student');
    
    if (!$input || !isset($input['resume_data'])) {
        sendError('缺少履歷資料', 400);
    }
    
    $resumeData = $input['resume_data'];
    
    // 檢查是否已有履歷記錄
    $stmt = $GLOBALS['conn']->prepare("SELECT id, version FROM resumes WHERE user_id = ? ORDER BY version DESC LIMIT 1");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $title = $resumeData['basic']['name'] . ' 的履歷';
    $template = $resumeData['template'] ?? 'modern';
    $content = json_encode($resumeData, JSON_UNESCAPED_UNICODE);
    
    if ($result->num_rows > 0) {
        // 更新現有履歷
        $existingResume = $result->fetch_assoc();
        
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE resumes 
            SET title = ?, template = ?, content = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->bind_param("sssi", $title, $template, $content, $existingResume['id']);
        
        if ($stmt->execute()) {
            sendResponse([
                'message' => '履歷草稿已儲存',
                'resume_id' => $existingResume['id']
            ], 200, '儲存成功');
        } else {
            sendError('儲存失敗：' . $stmt->error, 500);
        }
    } else {
        // 建立新履歷
        $stmt = $GLOBALS['conn']->prepare("
            INSERT INTO resumes (user_id, title, template, content, is_public, status, version, created_at, updated_at)
            VALUES (?, ?, ?, ?, 0, 'draft', 1, NOW(), NOW())
        ");
        $stmt->bind_param("isss", $userId, $title, $template, $content);
        
        if ($stmt->execute()) {
            $resumeId = $GLOBALS['conn']->insert_id;
            sendResponse([
                'message' => '履歷草稿已儲存',
                'resume_id' => $resumeId
            ], 201, '儲存成功');
        } else {
            sendError('儲存失敗：' . $stmt->error, 500);
        }
    }
}

// 取得履歷詳情
function getResumeDetail() {
    $userId = checkPermission('student');
    $resumeId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if (!$resumeId) {
        sendError('缺少履歷 ID', 400);
    }
    
    $stmt = $GLOBALS['conn']->prepare("
        SELECT * FROM resumes WHERE id = ? AND user_id = ?
    ");
    $stmt->bind_param("ii", $resumeId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $resume = $result->fetch_assoc();
    
    if (!$resume) {
        sendError('找不到履歷或無權限存取', 404);
    }
    
    // 解析 JSON 內容
    $resume['content'] = json_decode($resume['content'], true);
    
    sendResponse($resume, 200);
}

// 取得履歷模板
function getResumeTemplates() {
    $templates = [
        [
            'id' => 'modern',
            'name' => '現代簡約',
            'description' => '簡潔現代的設計風格，適合技術職位',
            'preview' => 'modern_preview.jpg',
            'features' => ['響應式設計', '清晰排版', '專業外觀']
        ],
        [
            'id' => 'professional',
            'name' => '專業商務',
            'description' => '傳統商務風格，適合企業環境',
            'preview' => 'professional_preview.jpg',
            'features' => ['正式設計', '結構清晰', '易於閱讀']
        ],
        [
            'id' => 'creative',
            'name' => '創意設計',
            'description' => '富有創意的設計風格，適合設計相關職位',
            'preview' => 'creative_preview.jpg',
            'features' => ['獨特設計', '視覺衝擊', '創意表達']
        ],
        [
            'id' => 'minimal',
            'name' => '極簡風格',
            'description' => '極簡主義設計，突出內容本身',
            'preview' => 'minimal_preview.jpg',
            'features' => ['極簡設計', '內容為重', '清爽視覺']
        ]
    ];
    
    sendResponse($templates, 200);
}

// 建立履歷
function createResume($data) {
    $userId = checkPermission('student');
    
    validateRequired($data, ['title', 'template', 'content']);
    
    $title = sanitizeInput($data['title']);
    $template = sanitizeInput($data['template']);
    $content = $data['content'];
    $isPublic = isset($data['is_public']) ? (bool)$data['is_public'] : false;
    
    // 驗證模板
    $validTemplates = ['modern', 'professional', 'creative', 'minimal'];
    if (!in_array($template, $validTemplates)) {
        sendError('無效的模板', 400);
    }
    
    // 驗證內容結構
    if (!is_array($content)) {
        sendError('內容格式錯誤', 400);
    }
    
    // 將內容轉為 JSON
    $contentJson = json_encode($content, JSON_UNESCAPED_UNICODE);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('內容 JSON 格式錯誤', 400);
    }
    
    $stmt = $GLOBALS['conn']->prepare("
        INSERT INTO resumes (user_id, title, template, content, is_public)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param("isssi", $userId, $title, $template, $contentJson, $isPublic);
    
    if ($stmt->execute()) {
        $resumeId = $GLOBALS['conn']->insert_id;
        
        sendResponse([
            'resume_id' => $resumeId,
            'message' => '履歷建立成功'
        ], 201, '建立成功');
    } else {
        sendError('建立失敗: ' . $stmt->error, 500);
    }
}

// 更新履歷
function updateResume($data) {
    $userId = checkPermission('student');
    
    validateRequired($data, ['id', 'title', 'template', 'content']);
    
    $resumeId = (int)$data['id'];
    $title = sanitizeInput($data['title']);
    $template = sanitizeInput($data['template']);
    $content = $data['content'];
    $isPublic = isset($data['is_public']) ? (bool)$data['is_public'] : false;
    
    // 檢查履歷是否存在且屬於該使用者
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM resumes WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $resumeId, $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        sendError('找不到履歷或無權限編輯', 404);
    }
    
    // 驗證模板
    $validTemplates = ['modern', 'professional', 'creative', 'minimal'];
    if (!in_array($template, $validTemplates)) {
        sendError('無效的模板', 400);
    }
    
    // 驗證內容結構
    if (!is_array($content)) {
        sendError('內容格式錯誤', 400);
    }
    
    // 將內容轉為 JSON
    $contentJson = json_encode($content, JSON_UNESCAPED_UNICODE);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('內容 JSON 格式錯誤', 400);
    }
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE resumes SET 
            title = ?, template = ?, content = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    ");
    
    $stmt->bind_param("sssiii", $title, $template, $contentJson, $isPublic, $resumeId, $userId);
    
    if ($stmt->execute()) {
        sendResponse(['message' => '履歷更新成功'], 200, '更新成功');
    } else {
        sendError('更新失敗: ' . $stmt->error, 500);
    }
}

// 刪除履歷
function deleteResume($data) {
    $userId = checkPermission('student');
    
    validateRequired($data, ['id']);
    
    $resumeId = (int)$data['id'];
    
    // 檢查履歷是否存在且屬於該使用者
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM resumes WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $resumeId, $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        sendError('找不到履歷或無權限刪除', 404);
    }
    
    $stmt = $GLOBALS['conn']->prepare("DELETE FROM resumes WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $resumeId, $userId);
    
    if ($stmt->execute()) {
        sendResponse(['message' => '履歷刪除成功'], 200, '刪除成功');
    } else {
        sendError('刪除失敗: ' . $stmt->error, 500);
    }
}

// 複製履歷
function duplicateResume($data) {
    $userId = checkPermission('student');
    
    validateRequired($data, ['id']);
    
    $resumeId = (int)$data['id'];
    
    // 檢查履歷是否存在且屬於該使用者
    $stmt = $GLOBALS['conn']->prepare("SELECT * FROM resumes WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $resumeId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $originalResume = $result->fetch_assoc();
    
    if (!$originalResume) {
        sendError('找不到履歷或無權限複製', 404);
    }
    
    // 取得最新版本號
    $stmt = $GLOBALS['conn']->prepare("SELECT MAX(version) as max_version FROM resumes WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $versionResult = $result->fetch_assoc();
    $newVersion = ($versionResult['max_version'] ?? 0) + 1;
    
    // 建立新標題
    $newTitle = $originalResume['title'] . ' (複製)';
    
    $stmt = $GLOBALS['conn']->prepare("
        INSERT INTO resumes (user_id, title, template, content, is_public, status, version)
        VALUES (?, ?, ?, ?, ?, 'draft', ?)
    ");
    
    $isPublic = false; // 複製的履歷預設為私人
    $stmt->bind_param("isssii", $userId, $newTitle, $originalResume['template'], $originalResume['content'], $isPublic, $newVersion);
    
    if ($stmt->execute()) {
        $newResumeId = $GLOBALS['conn']->insert_id;
        
        sendResponse([
            'resume_id' => $newResumeId,
            'message' => '履歷複製成功'
        ], 201, '複製成功');
    } else {
        sendError('複製失敗: ' . $stmt->error, 500);
    }
}

// 發布履歷
function publishResume($data) {
    $userId = checkPermission('student');
    
    validateRequired($data, ['id']);
    
    $resumeId = (int)$data['id'];
    
    // 檢查履歷是否存在且屬於該使用者
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM resumes WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $resumeId, $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        sendError('找不到履歷或無權限發布', 404);
    }
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE resumes SET status = 'published', updated_at = NOW() WHERE id = ? AND user_id = ?
    ");
    $stmt->bind_param("ii", $resumeId, $userId);
    
    if ($stmt->execute()) {
        sendResponse(['message' => '履歷發布成功'], 200, '發布成功');
    } else {
        sendError('發布失敗: ' . $stmt->error, 500);
    }
}

// 封存履歷
function archiveResume($data) {
    $userId = checkPermission('student');
    
    validateRequired($data, ['id']);
    
    $resumeId = (int)$data['id'];
    
    // 檢查履歷是否存在且屬於該使用者
    $stmt = $GLOBALS['conn']->prepare("SELECT id FROM resumes WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $resumeId, $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        sendError('找不到履歷或無權限封存', 404);
    }
    
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE resumes SET status = 'archived', updated_at = NOW() WHERE id = ? AND user_id = ?
    ");
    $stmt->bind_param("ii", $resumeId, $userId);
    
    if ($stmt->execute()) {
        sendResponse(['message' => '履歷封存成功'], 200, '封存成功');
    } else {
        sendError('封存失敗: ' . $stmt->error, 500);
    }
}

// 增加瀏覽次數
function incrementViewCount($resumeId) {
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE resumes SET view_count = view_count + 1 WHERE id = ?
    ");
    $stmt->bind_param("i", $resumeId);
    $stmt->execute();
}

// 匯出履歷
function exportResume() {
    $userId = checkPermission('student');
    $resumeId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $format = isset($_GET['format']) ? $_GET['format'] : 'pdf';
    
    if (!$resumeId) {
        sendError('缺少履歷 ID', 400);
    }
    
    // 檢查履歷是否存在且屬於該使用者
    $stmt = $GLOBALS['conn']->prepare("SELECT * FROM resumes WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $resumeId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $resume = $result->fetch_assoc();
    
    if (!$resume) {
        sendError('找不到履歷或無權限匯出', 404);
    }
    
    // 更新下載次數和瀏覽次數
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE resumes SET download_count = download_count + 1, view_count = view_count + 1 WHERE id = ?
    ");
    $stmt->bind_param("i", $resumeId);
    $stmt->execute();
    
    // 根據格式生成檔案
    switch ($format) {
        case 'pdf':
            generatePDFResume($resume);
            break;
        case 'docx':
            generateDOCXResume($resume);
            break;
        case 'html':
            generateHTMLResume($resume);
            break;
        default:
            sendError('不支援的匯出格式', 400);
    }
}

// 生成履歷 PDF 文件
function generateResumePDF($resumeData, $userId) {
    require_once __DIR__ . '/../../vendor/autoload.php';
    
    try {
        // 檢查 MPDF 是否可用
        if (!class_exists('\Mpdf\Mpdf')) {
            throw new Exception('MPDF 類別未找到，請檢查 Composer 安裝');
        }
        
        // 建立 mPDF 實例
        $mpdf = new \Mpdf\Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 16,
            'margin_bottom' => 16,
            'margin_header' => 9,
            'margin_footer' => 9,
            'default_font' => 'dejavusans',
            'tempDir' => sys_get_temp_dir(),
            'allow_charset_conversion' => true,
            'charset_in' => 'UTF-8'
        ]);
        
        // 設定中文字體支援
        $mpdf->autoScriptToLang = true;
        $mpdf->autoLangToFont = true;
        
        // 設定字體
        $mpdf->SetDefaultFont('dejavusans');
        
        // 生成 HTML 內容
        $html = generateResumeHTML($resumeData);
        
        // 寫入 PDF
        $mpdf->WriteHTML($html);
        
        // 確保目錄存在
        $uploadDir = __DIR__ . '/../../uploads/resumes/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        // 生成檔案名稱
        $fileName = 'resume_' . $userId . '_' . time() . '.pdf';
        $filePath = $uploadDir . $fileName;
        
        // 儲存 PDF
        $mpdf->Output($filePath, \Mpdf\Output\Destination::FILE);
        
        // 返回相對路徑
        return 'uploads/resumes/' . $fileName;
        
    } catch (Exception $e) {
        error_log('PDF 生成失敗: ' . $e->getMessage());
        throw new Exception('PDF 生成失敗: ' . $e->getMessage());
    }
}

// 生成履歷 HTML 內容
function generateResumeHTML($resumeData) {
    $template = $resumeData['template'] ?? 'executive';
    $colorScheme = $resumeData['colorScheme'] ?? 'blue';
    $font = $resumeData['font'] ?? 'modern';
    
    // 配色方案
    $colors = [
        'blue' => ['primary' => '#2563eb', 'secondary' => '#1e40af', 'text' => '#1e293b'],
        'slate' => ['primary' => '#334155', 'secondary' => '#1e293b', 'text' => '#0f172a'],
        'emerald' => ['primary' => '#059669', 'secondary' => '#047857', 'text' => '#064e3b'],
        'purple' => ['primary' => '#7c3aed', 'secondary' => '#6d28d9', 'text' => '#4c1d95']
    ];
    
    $currentColor = $colors[$colorScheme] ?? $colors['blue'];
    
    // 字型 - 使用 MPDF 支援的字體
    $fonts = [
        'traditional' => 'dejavuserif',
        'modern' => 'dejavusans',
        'elegant' => 'dejavuserif',
        'tech' => 'dejavusans'
    ];
    
    $currentFont = $fonts[$font] ?? $fonts['modern'];
    
    $css = '
        body { 
            font-family: ' . $currentFont . ', "DejaVu Sans", sans-serif; 
            line-height: 1.7; 
            color: ' . $currentColor['text'] . '; 
            margin: 0; 
            padding: 20px;
        }
        h1 { font-size: 28px; margin: 0 0 10px 0; color: ' . $currentColor['text'] . '; font-weight: 700; }
        h2 { 
            font-size: 16px; 
            margin: 20px 0 10px 0; 
            color: ' . $currentColor['primary'] . '; 
            border-left: 4px solid ' . $currentColor['primary'] . '; 
            padding-left: 10px; 
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        h3 { font-size: 15px; margin: 10px 0 5px 0; color: ' . $currentColor['text'] . '; font-weight: 600; }
        p { margin: 5px 0; }
        .header { border-bottom: 3px solid ' . $currentColor['primary'] . '; padding-bottom: 15px; margin-bottom: 25px; }
        .subtitle { font-size: 15px; color: ' . $currentColor['primary'] . '; margin: 5px 0; font-weight: 500; }
        .contact-info { font-size: 11px; color: #64748b; margin: 10px 0 0 0; }
        .section { margin-bottom: 20px; }
        .item { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; }
        .item-header { margin-bottom: 5px; }
        .item-title { font-size: 15px; font-weight: 600; color: ' . $currentColor['text'] . '; }
        .item-period { color: #64748b; font-size: 11px; margin-left: 10px; }
        .company { color: ' . $currentColor['secondary'] . '; font-weight: 500; font-size: 13px; }
        .skill-tag { 
            display: inline-block;
            background: ' . $currentColor['primary'] . '; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 4px; 
            font-size: 11px;
            margin: 3px;
            font-weight: 500;
        }
        .description { color: #475569; font-size: 12px; line-height: 1.7; text-align: justify; }
    ';
    
    $html = '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>' . $css . '</style>
    </head>
    <body>';
    
    // 基本資料
    $html .= '<div class="header">';
    $html .= '<h1>' . htmlspecialchars($resumeData['basic']['name'] ?? '您的姓名') . '</h1>';
    $html .= '<div class="contact-info">';
    $contactParts = [];
    if (!empty($resumeData['basic']['email'])) {
        $contactParts[] = '<strong>Email:</strong> ' . htmlspecialchars($resumeData['basic']['email']);
    }
    if (!empty($resumeData['basic']['phone'])) {
        $contactParts[] = '<strong>電話:</strong> ' . htmlspecialchars($resumeData['basic']['phone']);
    }
    if (!empty($resumeData['basic']['birthDate'])) {
        $contactParts[] = '<strong>生日:</strong> ' . htmlspecialchars($resumeData['basic']['birthDate']);
    }
    if (!empty($resumeData['basic']['address'])) {
        $contactParts[] = '<strong>地址:</strong> ' . htmlspecialchars($resumeData['basic']['address']);
    }
    $html .= implode(' &nbsp;|&nbsp; ', $contactParts);
    $html .= '</div></div>';
    
    // 個人簡介
    if (!empty($resumeData['basic']['summary'])) {
        $html .= '<div class="section">';
        $html .= '<h2>個人簡介</h2>';
        $html .= '<p class="description">' . nl2br(htmlspecialchars($resumeData['basic']['summary'])) . '</p>';
        $html .= '</div>';
    }
    
    // 工作經驗
    if (!empty($resumeData['experience']) && count($resumeData['experience']) > 0) {
        $html .= '<div class="section">';
        $html .= '<h2>專業經驗</h2>';
        foreach ($resumeData['experience'] as $exp) {
            $html .= '<div class="item">';
            $html .= '<div class="item-header">';
            $html .= '<span class="item-title">' . htmlspecialchars($exp['position'] ?? '職位名稱') . '</span>';
            $html .= '<span class="item-period">' . htmlspecialchars($exp['startDate'] ?? '') . ' - ' . htmlspecialchars($exp['endDate'] ?? '') . '</span>';
            $html .= '</div>';
            $html .= '<p class="company">' . htmlspecialchars($exp['company'] ?? '公司名稱') . '</p>';
            $html .= '<p class="description">' . nl2br(htmlspecialchars($exp['description'] ?? '')) . '</p>';
            $html .= '</div>';
        }
        $html .= '</div>';
    }
    
    // 教育背景
    if (!empty($resumeData['education']) && count($resumeData['education']) > 0) {
        $html .= '<div class="section">';
        $html .= '<h2>教育背景</h2>';
        foreach ($resumeData['education'] as $edu) {
            $html .= '<div class="item">';
            $html .= '<div class="item-header">';
            $html .= '<span class="item-title">' . htmlspecialchars($edu['degree'] ?? '學位') . ' - ' . htmlspecialchars($edu['type'] ?? '') . '</span>';
            $html .= '<span class="item-period">' . htmlspecialchars($edu['year'] ?? '') . '</span>';
            $html .= '</div>';
            $html .= '<p class="company">' . htmlspecialchars($edu['school'] ?? '學校名稱') . '</p>';
            if (!empty($edu['gpa'])) {
                $html .= '<p class="description">GPA: ' . htmlspecialchars($edu['gpa']) . '</p>';
            }
            if (!empty($edu['courses'])) {
                $html .= '<p class="description"><strong>主要課程:</strong> ' . htmlspecialchars($edu['courses']) . '</p>';
            }
            $html .= '</div>';
        }
        $html .= '</div>';
    }
    
    // 技能專長
    if (!empty($resumeData['skills'])) {
        $html .= '<div class="section">';
        $html .= '<h2>技能專長</h2>';
        $html .= '<div>';
        $skills = explode(',', $resumeData['skills']);
        foreach ($skills as $skill) {
            $skill = trim($skill);
            if ($skill) {
                $html .= '<span class="skill-tag">' . htmlspecialchars($skill) . '</span>';
            }
        }
        $html .= '</div></div>';
    }
    
    // 專案作品
    if (!empty($resumeData['projects']) && count($resumeData['projects']) > 0) {
        $html .= '<div class="section">';
        $html .= '<h2>專案經歷</h2>';
        foreach ($resumeData['projects'] as $project) {
            $html .= '<div class="item">';
            $html .= '<div class="item-header">';
            $html .= '<span class="item-title">' . htmlspecialchars($project['name'] ?? '專案名稱') . '</span>';
            $html .= '</div>';
            if (!empty($project['tech'])) {
                $html .= '<p class="company"><strong>技術:</strong> ' . htmlspecialchars($project['tech']) . '</p>';
            }
            $html .= '<p class="description">' . nl2br(htmlspecialchars($project['description'] ?? '')) . '</p>';
            if (!empty($project['url']) || !empty($project['github'])) {
                $html .= '<p class="description" style="font-size: 10px; color: #64748b;">';
                if (!empty($project['url'])) {
                    $html .= '🔗 專案連結: ' . htmlspecialchars($project['url']) . ' &nbsp;&nbsp;';
                }
                if (!empty($project['github'])) {
                    $html .= '💻 GitHub: ' . htmlspecialchars($project['github']);
                }
                $html .= '</p>';
            }
            $html .= '</div>';
        }
        $html .= '</div>';
    }
    
    // 證照獎項
    if (!empty($resumeData['certificates']) && count($resumeData['certificates']) > 0) {
        $html .= '<div class="section">';
        $html .= '<h2>證照與獎項</h2>';
        foreach ($resumeData['certificates'] as $cert) {
            $html .= '<div class="item">';
            $html .= '<div class="item-header">';
            $html .= '<span class="item-title">' . htmlspecialchars($cert['name'] ?? '證照名稱') . '</span>';
            $html .= '<span class="item-period">' . htmlspecialchars($cert['date'] ?? '') . '</span>';
            $html .= '</div>';
            $html .= '<p class="company">' . htmlspecialchars($cert['issuer'] ?? '發證機構') . '</p>';
            if (!empty($cert['expiry'])) {
                $html .= '<p class="description">有效期限: ' . htmlspecialchars($cert['expiry']) . '</p>';
            }
            $html .= '</div>';
        }
        $html .= '</div>';
    }
    
    $html .= '</body></html>';
    
    return $html;
}

// 生成並儲存 PDF（從前端呼叫）
function generateAndSavePDF($input) {
    require_once __DIR__ . '/../../vendor/autoload.php';
    $userId = checkPermission('student');
    
    if (!$input || !isset($input['resume_data'])) {
        sendError('缺少履歷資料', 400);
    }
    
    $resumeData = $input['resume_data'];
    
    try {
        // 檢查 MPDF 是否可用
        if (!class_exists('\Mpdf\Mpdf')) {
            throw new Exception('MPDF 類別未找到，請檢查 Composer 安裝');
        }
        
        // 建立 mPDF 實例（優化配置以減少記憶體使用）
        $mpdf = new \Mpdf\Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 16,
            'margin_bottom' => 16,
            'margin_header' => 9,
            'margin_footer' => 9,
            'default_font' => 'dejavusans',
            'tempDir' => sys_get_temp_dir(),
            'allow_charset_conversion' => true,
            'charset_in' => 'UTF-8',
            // 優化免費版效能
            'simpleTables' => true,
            'packTableData' => true
        ]);
        
        // 設定中文字體支援
        $mpdf->autoScriptToLang = true;
        $mpdf->autoLangToFont = true;
        $mpdf->SetDefaultFont('dejavusans');
        
        // 生成 HTML 內容
        $html = generateResumeHTML($resumeData);
        
        // 寫入 PDF
        $mpdf->WriteHTML($html);
        
        // 生成 PDF 到記憶體（優化記憶體使用）
        $pdfContent = $mpdf->Output('', \Mpdf\Output\Destination::STRING_RETURN);
        
        // 檢查 PDF 大小（如果太大可能會有問題）
        $pdfSize = strlen($pdfContent);
        if ($pdfSize > 5 * 1024 * 1024) { // 5MB 限制
            throw new Exception('PDF 檔案過大，請簡化履歷內容');
        }
        
        // 將 PDF 轉換為 base64
        $pdfBase64 = base64_encode($pdfContent);
        
        // 釋放記憶體
        unset($pdfContent);
        
        // 生成檔案名稱
        $fileName = 'resume_' . ($resumeData['basic']['name'] ?? 'resume') . '_' . date('YmdHis') . '.pdf';
        
        // 更新資料庫（可選，記錄生成歷史）
        $stmt = $GLOBALS['conn']->prepare("SELECT id FROM resumes WHERE user_id = ? ORDER BY version DESC LIMIT 1");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $resume = $result->fetch_assoc();
            $stmt = $GLOBALS['conn']->prepare("
                UPDATE resumes 
                SET download_count = download_count + 1, status = 'published', updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->bind_param("i", $resume['id']);
            $stmt->execute();
        }
        
        // 清除輸出緩衝區
        if (ob_get_length()) { 
            @ob_clean(); 
        }
        
        // 返回 base64 編碼的 PDF
        sendResponse([
            'message' => 'PDF 已生成',
            'pdf_base64' => $pdfBase64,
            'file_name' => $fileName
        ], 200, '生成成功');
        
    } catch (Exception $e) {
        error_log('PDF 生成失敗: ' . $e->getMessage());
        sendError('PDF 生成失敗: ' . $e->getMessage(), 500);
    }
}

// 生成 PDF 履歷（用於匯出功能）
function generatePDFResume($resume) {
    $content = json_decode($resume['content'], true);
    
    // 如果已經有 PDF 檔案，直接返回
    if (!empty($resume['file_path']) && file_exists(__DIR__ . '/../../' . $resume['file_path'])) {
        $filePath = __DIR__ . '/../../' . $resume['file_path'];
        
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . basename($resume['file_path']) . '"');
        header('Content-Length: ' . filesize($filePath));
        
        readfile($filePath);
        exit();
    }
    
    // 如果沒有 PDF 檔案，現場生成
    try {
        $userId = $resume['user_id'];
        $pdfPath = generateResumePDF($content, $userId);
        
        // 更新資料庫
        $stmt = $GLOBALS['conn']->prepare("
            UPDATE resumes 
            SET file_path = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->bind_param("si", $pdfPath, $resume['id']);
        $stmt->execute();
        
        // 返回生成的 PDF
        $filePath = __DIR__ . '/../../' . $pdfPath;
        
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . basename($pdfPath) . '"');
        header('Content-Length: ' . filesize($filePath));
        
        readfile($filePath);
        exit();
        
    } catch (Exception $e) {
        sendError('PDF 生成失敗: ' . $e->getMessage(), 500);
    }
}

// 生成 DOCX 履歷
function generateDOCXResume($resume) {
    // 這裡需要實作 DOCX 生成邏輯
    // 可以使用 PHPWord 或其他 DOCX 庫
    sendError('DOCX 匯出功能尚未實作', 501);
}

// 生成 HTML 履歷
function generateHTMLResume($resume) {
    $content = json_decode($resume['content'], true);
    $template = $resume['template'];
    
    // 根據模板生成 HTML
    $html = generateHTMLByTemplate($resume, $content, $template);
    
    // 設定標頭
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: inline; filename="' . $resume['title'] . '.html"');
    
    echo $html;
    exit();
}

// 根據模板生成 HTML
function generateHTMLByTemplate($resume, $content, $template) {
    $css = '';
    $html = '';
    
    switch ($template) {
        case 'modern':
            $css = getModernCSS();
            $html = getModernHTML($resume, $content);
            break;
        case 'professional':
            $css = getProfessionalCSS();
            $html = getProfessionalHTML($resume, $content);
            break;
        case 'creative':
            $css = getCreativeCSS();
            $html = getCreativeHTML($resume, $content);
            break;
        case 'minimal':
            $css = getMinimalCSS();
            $html = getMinimalHTML($resume, $content);
            break;
        default:
            $css = getModernCSS();
            $html = getModernHTML($resume, $content);
    }
    
    return "<!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>{$resume['title']}</title>
        <style>$css</style>
    </head>
    <body>$html</body>
    </html>";
}

// 各種模板的 CSS 和 HTML 函數
function getModernCSS() {
    return "
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header .subtitle { margin: 10px 0 0 0; font-size: 1.2em; opacity: 0.9; }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 1.5em; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 20px; }
        .info-item { margin-bottom: 15px; }
        .info-label { font-weight: bold; color: #555; }
        .experience-item { margin-bottom: 25px; padding: 20px; background: #f9f9f9; border-radius: 8px; }
        .experience-title { font-size: 1.2em; font-weight: bold; color: #333; margin-bottom: 5px; }
        .experience-company { color: #667eea; font-weight: 500; }
        .experience-period { color: #888; font-size: 0.9em; }
        .skills { display: flex; flex-wrap: wrap; gap: 10px; }
        .skill-tag { background: #667eea; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9em; }
    ";
}

function getModernHTML($resume, $content) {
    $html = "<div class='container'>
        <div class='header'>
            <h1>{$content['basic_info']['name']}</h1>
            <div class='subtitle'>{$content['basic_info']['title']}</div>
        </div>
        <div class='content'>";
    
    if (isset($content['contact'])) {
        $html .= "<div class='section'>
            <div class='section-title'>聯絡資訊</div>";
        foreach ($content['contact'] as $key => $value) {
            $html .= "<div class='info-item'>
                <span class='info-label'>" . ucfirst($key) . ":</span> $value
            </div>";
        }
        $html .= "</div>";
    }
    
    if (isset($content['education'])) {
        $html .= "<div class='section'>
            <div class='section-title'>教育背景</div>";
        foreach ($content['education'] as $edu) {
            $html .= "<div class='experience-item'>
                <div class='experience-title'>{$edu['degree']}</div>
                <div class='experience-company'>{$edu['school']}</div>
                <div class='experience-period'>{$edu['year']}</div>
            </div>";
        }
        $html .= "</div>";
    }
    
    if (isset($content['skills'])) {
        $html .= "<div class='section'>
            <div class='section-title'>技能專長</div>
            <div class='skills'>";
        foreach ($content['skills'] as $skill) {
            $html .= "<span class='skill-tag'>$skill</span>";
        }
        $html .= "</div></div>";
    }
    
    $html .= "</div></div>";
    return $html;
}

// 其他模板的 CSS 和 HTML 函數可以類似實作
function getProfessionalCSS() { return getModernCSS(); }
function getProfessionalHTML($resume, $content) { return getModernHTML($resume, $content); }
function getCreativeCSS() { return getModernCSS(); }
function getCreativeHTML($resume, $content) { return getModernHTML($resume, $content); }
function getMinimalCSS() { return getModernCSS(); }
function getMinimalHTML($resume, $content) { return getModernHTML($resume, $content); }

// 注意：sendResponse 和 sendError 函數已在 config.php 中定義
?>
