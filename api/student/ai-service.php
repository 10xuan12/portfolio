<?php
// 關閉錯誤顯示，避免破壞 JSON 輸出
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// 啟用輸出緩衝
if (ob_get_level() === 0) {
    ob_start();
}

require_once '../config.php';

// 設定 CORS 與回應格式
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID');
header('Content-Type: application/json; charset=utf-8');

// 預檢請求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 錯誤處理
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    // 只記錄錯誤，不輸出
    error_log("PHP Error [{$errno}]: {$errstr} in {$errfile} on line {$errline}");
    return true;
});

// 異常處理
set_exception_handler(function($exception) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'status' => 500,
        'success' => false,
        'message' => '伺服器內部錯誤：' . $exception->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit();
});

// AI 服務 API
try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) {
                $input = [];
            }
            
            $action = $input['action'] ?? '';
            switch ($action) {
                case 'generate_description':
                    generateDescription($input);
                    break;
                case 'generate_tags':
                    generateTags($input);
                    break;
                default:
                    sendError('無效的操作', 400);
            }
            break;
            
        default:
            sendError('不支援的 HTTP 方法', 405);
    }
} catch (Throwable $e) {
    // 捕獲所有錯誤和異常
    ob_clean();
    error_log("AI Service Fatal Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    error_log("Stack trace: " . $e->getTraceAsString());
    sendError('伺服器內部錯誤：' . $e->getMessage(), 500);
}

/**
 * 生成作品描述（代理 Hugging Face API）
 */
function generateDescription($input) {
    $title = $input['title'] ?? '';
    $category = $input['category'] ?? '';
    
    if (empty($title) || empty($category)) {
        sendError('缺少必要參數：title 和 category', 400);
    }
    
    try {
        // Hugging Face API 端點
        $baseUrl = 'https://router.huggingface.co';
        
        // 模型列表（按優先順序）
        $models = [
            'google/flan-t5-large',
            'google/flan-t5-base',
            'microsoft/DialoGPT-medium',
            'gpt2'
        ];
        
        // 構建提示詞
        $categoryMap = [
            'engineering' => '工程',
            'information' => '資訊',
            'info' => '資訊',
            'business' => '商管',
            'design' => '設計',
            'education' => '教育',
            'arts' => '藝術',
            'humanities' => '人文',
            'social' => '社會',
            'science' => '自然科學',
            'medicine' => '醫藥衛生',
            'agriculture' => '農業',
            'tourism' => '觀光餐旅',
            'sports' => '體育',
            'mass-communication' => '大眾傳播',
            'mass_communication' => '大眾傳播',
            'communication' => '傳播',
            'other' => '其他'
        ];
        
        $categoryName = $categoryMap[$category] ?? '作品';
        $prompt = "Generate a professional description (50-100 words) for a {$categoryName} portfolio work.\n\nTitle: {$title}\n\nThe description should include:\n1. Main features and highlights\n2. Technologies or methods used\n3. Value and significance\n\nDescription (in Traditional Chinese):";
        
        // 嘗試每個模型
        $description = null;
        $usedModel = null;
        $error = null;
        
        foreach ($models as $model) {
            try {
                $url = "{$baseUrl}/{$model}";
                
                $ch = curl_init($url);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST => true,
                    CURLOPT_HTTPHEADER => [
                        'Content-Type: application/json',
                        'User-Agent: Portfolio-Plus/1.0'
                    ],
                    CURLOPT_POSTFIELDS => json_encode([
                        'inputs' => $prompt,
                        'parameters' => [
                            'max_length' => 200,
                            'temperature' => 0.8,
                            'do_sample' => true,
                            'top_p' => 0.95,
                            'repetition_penalty' => 1.2
                        ]
                    ]),
                    CURLOPT_TIMEOUT => 30, // 增加到30秒（Railway 上可能需要更長時間）
                    CURLOPT_CONNECTTIMEOUT => 10, // 增加到10秒
                    CURLOPT_SSL_VERIFYPEER => true, // 驗證 SSL 證書
                    CURLOPT_FOLLOWLOCATION => true, // 跟隨重定向
                    CURLOPT_MAXREDIRS => 3 // 最多跟隨3次重定向
                ]);
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $curlError = curl_error($ch);
                curl_close($ch);
                
                if ($curlError) {
                    error_log("Hugging Face API curl error for {$model}: {$curlError}");
                    // 在 Railway 上記錄更詳細的錯誤信息以便調試
                    if (isset($_ENV['RAILWAY_ENVIRONMENT']) || isset($_ENV['RAILWAY'])) {
                        $curlInfo = curl_getinfo($ch);
                        error_log("Railway Environment - curl info: " . json_encode($curlInfo));
                    }
                    continue;
                }
                
                if ($httpCode === 503) {
                    // 模型正在載入中，可能需要等待
                    error_log("Hugging Face model {$model} is loading (HTTP 503)");
                    // 可以選擇等待後重試，但為了速度，先嘗試下一個模型
                    continue;
                }
                
                if ($httpCode === 429) {
                    // 請求過於頻繁（Rate Limit）
                    error_log("Hugging Face API rate limit exceeded for {$model} (HTTP 429)");
                    continue;
                }
                
                if ($httpCode !== 200) {
                    $errorBody = substr($response, 0, 200); // 只記錄前200字符避免日誌過長
                    error_log("Hugging Face API error for {$model}: HTTP {$httpCode} - Response: {$errorBody}");
                    continue;
                }
                
                $data = json_decode($response, true);
                
                if (!$data) {
                    continue;
                }
                
                // 處理不同的回應格式
                $generatedText = null;
                if (isset($data[0]['generated_text'])) {
                    $generatedText = $data[0]['generated_text'];
                } elseif (isset($data['generated_text'])) {
                    $generatedText = $data['generated_text'];
                } elseif (is_string($data)) {
                    $generatedText = $data;
                }
                
                if ($generatedText && strlen(trim($generatedText)) > 20) {
                    // 清理生成的文本（移除提示詞部分）
                    $cleanedText = trim(str_replace($prompt, '', $generatedText));
                    if (strlen($cleanedText) > 10) {
                        $description = $cleanedText;
                    } else {
                        $description = trim($generatedText);
                    }
                    $usedModel = $model;
                    break;
                }
            } catch (Exception $e) {
                error_log("Hugging Face API exception for {$model}: " . $e->getMessage());
                $error = $e->getMessage();
                continue;
            }
        }
        
        if ($description) {
            sendSuccess([
                'description' => $description,
                'source' => 'huggingface',
                'model' => $usedModel
            ]);
        } else {
            // 如果所有模型都失敗，返回錯誤
            sendError('Hugging Face API 調用失敗，請稍後再試', 503);
        }
        
    } catch (Exception $e) {
        error_log("AI service error: " . $e->getMessage());
        sendError('生成描述時發生錯誤：' . $e->getMessage(), 500);
    }
}

/**
 * 生成標籤（目前使用本地邏輯，未來可擴展）
 */
function generateTags($input) {
    $title = $input['title'] ?? '';
    $description = $input['description'] ?? '';
    
    if (empty($title) && empty($description)) {
        sendError('缺少必要參數：title 或 description', 400);
    }
    
    // 目前標籤生成使用前端邏輯，這裡可以未來擴展
    sendError('標籤生成功能暫未實現', 501);
}

/**
 * 發送成功回應
 */
function sendSuccess($data, $message = '成功') {
    http_response_code(200);
    echo json_encode([
        'status' => 200,
        'success' => true,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * 發送錯誤回應
 */
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'status' => $code,
        'success' => false,
        'message' => $message
    ], JSON_UNESCAPED_UNICODE);
    exit();
}
?>

