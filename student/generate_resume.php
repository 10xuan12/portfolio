<?php
session_start();
header('Content-Type: application/json');

use Dompdf\Dompdf;
use Dompdf\Options;

// 驗證登入
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
    http_response_code(403);
    echo json_encode(['error' => '未授權']);
    exit;
}

$email = $_SESSION['email'];
$language = $_POST['language'] ?? $_GET['language'] ?? '中文';
$position = $_POST['position'] ?? $_GET['position'] ?? '軟體工程師';

require '../includes/db_connect.php';



try {
    $pdo = new PDO($dsn, $user, $pass);
    $stmt = $pdo->prepare("SELECT * FROM student_profiles WHERE email = ?");
    $stmt->execute([$email]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(['error' => '找不到學生資料']);
        exit;
    }
} catch (PDOException $e) {
    echo json_encode(['error' => '資料庫錯誤：' . $e->getMessage()]);
    exit;
}

// 將學生資料轉為 prompt 內容
function formatStudentInfo($student, $language) {
    if ($language === 'English') {
        return <<<EOT
Name: {$student['name']}
Gender: {$student['gender']}
Birthday: {$student['birthday']}
Student ID: {$student['student_id']}
Department: {$student['department']}
Grade: {$student['grade']}
Email: {$student['email']}
Phone: {$student['phone']}
Address: {$student['address']}
GitHub: {$student['github']}
Instagram: {$student['instagram']}
Facebook: {$student['facebook']}
Profile: {$student['bio']}
Skills: {$student['skills']}
Languages: {$student['languages']}
Education: {$student['school']}
Background: {$student['professional_background']}
EOT;
    } else {
        return <<<EOT
姓名：{$student['name']}
性別：{$student['gender']}
生日：{$student['birthday']}
學號：{$student['student_id']}
科系：{$student['department']}
年級：{$student['grade']}
電子郵件：{$student['email']}
聯絡電話：{$student['phone']}
地址：{$student['address']}
GitHub：{$student['github']}
Instagram：{$student['instagram']}
Facebook：{$student['facebook']}
自我介紹：{$student['bio']}
技能：{$student['skills']}
語言能力：{$student['languages']}
畢業學校：{$student['school']}
專業背景：{$student['professional_background']}
EOT;
    }
}

$student_text = formatStudentInfo($student, $language);

// 準備 GPT-2 Prompt
$prompt_main = ($language === 'English') ? 
    "Based on the following information, generate a professional resume for applying to the position of \"$position\".\n\n$student_text" :
    "根據以下資訊，產生一份針對「$position」職位的專業履歷：\n\n$student_text";

$prompt_keywords = ($language === 'English') ? 
    "Based on the previous resume, list keywords or strengths that can make the resume more convincing for a \"$position\" position." :
    "根據上述履歷，列出可以讓履歷更有說服力的關鍵字或強項（條列式）。";

// Hugging Face API 設定
// 修正: 使用getenv正確獲取環境變數，或直接設置API金鑰
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../'); // 指定 .env 文件的路徑
$dotenv->load();
$api_key = $api_key = getenv('HUGGING_FACE_API_KEY'); // 從環境變數中讀取 API 金鑰
$endpoint = 'https://api-inference.huggingface.co/models/gpt2';
$headers = [
    "Authorization: Bearer $api_key",
    "Content-Type: application/json"
];

// 呼叫 Hugging Face GPT-2 產生履歷
function callGPT($prompt, $headers, $endpoint) {
    $postData = [
        "inputs" => $prompt,
        "parameters" => [
            "max_length" => 500, // 可以調整生成的長度
            "temperature" => 0.7,
            "top_p" => 1.0
        ]
    ];

    $ch = curl_init($endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    // 添加錯誤處理
    $response = curl_exec($ch);
    $curl_error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // 檢查cURL錯誤
    if ($curl_error) {
        return json_encode(['error' => 'API請求失敗: ' . $curl_error]);
    }

    // 檢查HTTP狀態碼
    if ($http_code >= 400) {
        return json_encode(['error' => 'API錯誤，狀態碼: ' . $http_code . ', 回應: ' . $response]);
    }

    // 嘗試解析回應
    $responseData = json_decode($response, true);
    
    // 檢查解析是否成功
    if (json_last_error() !== JSON_ERROR_NONE) {
        return json_encode(['error' => '無法解析API回應: ' . $response]);
    }
    
    // 檢查回應格式並返回結果
    if (isset($responseData[0]['generated_text'])) {
        return $responseData[0]['generated_text'];
    } else {
        return json_encode(['generated_text' => '無法產生文字，API回應: ' . json_encode($responseData)]);
    }
}

// 產生履歷與建議
try {
    $resume_text = callGPT($prompt_main, $headers, $endpoint);
    $keyword_suggestions = callGPT($prompt_keywords, $headers, $endpoint);

    // 檢查是否為JSON錯誤訊息
    $resume_decoded = json_decode($resume_text, true);
    if (json_last_error() === JSON_ERROR_NONE && isset($resume_decoded['error'])) {
        echo json_encode(['error' => $resume_decoded['error']]);
        exit;
    }

    // 若為下載 PDF
    if (isset($_GET['download_pdf'])) {
        require 'vendor/autoload.php'; // dompdf 套件

        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $dompdf = new Dompdf($options);

        $html = "<h2>履歷</h2><pre style='font-family: sans-serif;'>{$resume_text}</pre><h3>關鍵字建議</h3><pre>{$keyword_suggestions}</pre>";
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $dompdf->stream("resume.pdf", ["Attachment" => true]);
        exit;
    }

    // 否則回傳 JSON 給前端
    echo json_encode([
        'resume_text' => $resume_text,
        'keyword_suggestions' => $keyword_suggestions
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => '處理過程發生錯誤: ' . $e->getMessage()]);
    exit;
}
?>