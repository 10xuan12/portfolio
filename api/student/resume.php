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
        SELECT id, title, template, is_public, download_count, created_at, updated_at
        FROM resumes 
        WHERE user_id = ?
        ORDER BY updated_at DESC
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
    
    // 建立新標題
    $newTitle = $originalResume['title'] . ' (複製)';
    
    $stmt = $GLOBALS['conn']->prepare("
        INSERT INTO resumes (user_id, title, template, content, is_public)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $isPublic = false; // 複製的履歷預設為私人
    $stmt->bind_param("isssi", $userId, $newTitle, $originalResume['template'], $originalResume['content'], $isPublic);
    
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
    
    // 更新下載次數
    $stmt = $GLOBALS['conn']->prepare("
        UPDATE resumes SET download_count = download_count + 1 WHERE id = ?
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

// 生成 PDF 履歷
function generatePDFResume($resume) {
    // 這裡需要實作 PDF 生成邏輯
    // 可以使用 mPDF 或其他 PDF 庫
    
    $content = json_decode($resume['content'], true);
    $template = $resume['template'];
    
    // 簡單的 HTML 輸出（實際應該生成 PDF）
    $html = "<!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <title>{$resume['title']}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h1>{$resume['title']}</h1>
        </div>";
    
    if (isset($content['basic_info'])) {
        $html .= "<div class='section'>
            <div class='section-title'>基本資料</div>
            <p>姓名: {$content['basic_info']['name']}</p>
            <p>職稱: {$content['basic_info']['title']}</p>
            <p>電子郵件: {$content['basic_info']['email']}</p>
        </div>";
    }
    
    if (isset($content['education'])) {
        $html .= "<div class='section'>
            <div class='section-title'>教育背景</div>";
        foreach ($content['education'] as $edu) {
            $html .= "<p>{$edu['degree']} - {$edu['school']} ({$edu['year']})</p>";
        }
        $html .= "</div>";
    }
    
    if (isset($content['experience'])) {
        $html .= "<div class='section'>
            <div class='section-title'>工作經驗</div>";
        foreach ($content['experience'] as $exp) {
            $html .= "<p><strong>{$exp['position']}</strong> - {$exp['company']} ({$exp['period']})</p>
            <p>{$exp['description']}</p>";
        }
        $html .= "</div>";
    }
    
    $html .= "</body></html>";
    
    // 設定標頭
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: inline; filename="' . $resume['title'] . '.html"');
    
    echo $html;
    exit();
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
?>
