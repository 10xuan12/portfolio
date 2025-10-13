<?php
/**
 * 面試安排 API
 * 處理企業與學生的面試安排功能
 */

require_once 'config.php';

// 檢查用戶權限
$userId = checkPermission();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'list':
                    // 取得面試列表
                    getInterviews($userId);
                    break;
                case 'detail':
                    // 取得面試詳情
                    getInterviewDetail();
                    break;
                case 'calendar':
                    // 取得行事曆資料
                    getCalendar($userId);
                    break;
                case 'availability':
                    // 取得可用時間
                    getAvailability();
                    break;
                default:
                    sendApiError('無效的操作', 400, 'INVALID_ACTION');
            }
        } else {
            sendApiError('缺少 action 參數', 400, 'MISSING_ACTION');
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'create':
                    // 建立面試
                    createInterview($userId, $input);
                    break;
                case 'confirm':
                    // 確認面試
                    confirmInterview($userId, $input);
                    break;
                case 'reschedule':
                    // 改期
                    rescheduleInterview($userId, $input);
                    break;
                case 'cancel':
                    // 取消面試
                    cancelInterview($userId, $input);
                    break;
                case 'complete':
                    // 完成面試並給回饋
                    completeInterview($userId, $input);
                    break;
                case 'set_availability':
                    // 設定可用時間
                    setAvailability($userId, $input);
                    break;
                default:
                    sendApiError('無效的操作', 400, 'INVALID_ACTION');
            }
        } else {
            sendApiError('缺少 action 參數', 400, 'MISSING_ACTION');
        }
        break;
        
    default:
        sendApiError('不支援的 HTTP 方法', 405, 'METHOD_NOT_ALLOWED');
}

/**
 * 建立面試
 */
function createInterview($userId, $data) {
    global $conn;
    
    validateRequired($data, ['student_id', 'title', 'scheduled_at']);
    
    $studentId = (int)$data['student_id'];
    $jobId = isset($data['job_id']) ? (int)$data['job_id'] : null;
    $applicationId = isset($data['application_id']) ? (int)$data['application_id'] : null;
    $title = sanitizeInput($data['title']);
    $type = isset($data['type']) ? sanitizeInput($data['type']) : 'video';
    $scheduledAt = sanitizeInput($data['scheduled_at']);
    $duration = isset($data['duration']) ? (int)$data['duration'] : 60;
    $location = isset($data['location']) ? sanitizeInput($data['location']) : null;
    $videoLink = isset($data['video_link']) ? sanitizeInput($data['video_link']) : null;
    $description = isset($data['description']) ? sanitizeInput($data['description']) : null;
    
    // 驗證面試類型
    $validTypes = ['phone', 'video', 'onsite', 'other'];
    if (!in_array($type, $validTypes)) {
        sendApiError('無效的面試類型', 400, 'INVALID_TYPE');
    }
    
    // 驗證時間格式
    $datetime = DateTime::createFromFormat('Y-m-d H:i:s', $scheduledAt);
    if (!$datetime) {
        sendApiError('無效的時間格式', 400, 'INVALID_DATETIME');
    }
    
    // 檢查時間是否在未來
    if ($datetime <= new DateTime()) {
        sendApiError('面試時間必須在未來', 400, 'PAST_DATETIME');
    }
    
    // 檢查時間衝突
    if (hasTimeConflict($studentId, $scheduledAt, $duration)) {
        sendApiError('該時間與其他面試衝突', 400, 'TIME_CONFLICT');
    }
    
    // 插入面試記錄
    $stmt = $conn->prepare("
        INSERT INTO interviews 
        (enterprise_id, student_id, job_id, application_id, title, type, scheduled_at, duration, 
         location, video_link, description, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("iiiississssi", 
        $userId, $studentId, $jobId, $applicationId, $title, $type, 
        $scheduledAt, $duration, $location, $videoLink, $description, $userId
    );
    
    if ($stmt->execute()) {
        $interviewId = $conn->insert_id;
        
        // 建立提醒（面試前1小時和前1天）
        createReminders($interviewId, $scheduledAt);
        
        sendApiResponse([
            'interview_id' => $interviewId,
            'message' => '面試已建立，已通知學生'
        ], 201, '面試建立成功');
    } else {
        sendApiError('面試建立失敗：' . $conn->error, 500, 'CREATE_FAILED');
    }
}

/**
 * 取得面試列表
 */
function getInterviews($userId) {
    global $conn;
    
    // 判斷用戶角色
    $stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $role = $stmt->get_result()->fetch_assoc()['role'];
    
    $status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : null;
    $startDate = isset($_GET['start_date']) ? sanitizeInput($_GET['start_date']) : null;
    $endDate = isset($_GET['end_date']) ? sanitizeInput($_GET['end_date']) : null;
    
    // 根據角色建立查詢
    $where = [];
    $params = [];
    $types = '';
    
    if ($role === 'student') {
        $where[] = "i.student_id = ?";
        $params[] = $userId;
        $types .= 'i';
    } else if ($role === 'enterprise') {
        $where[] = "i.enterprise_id = ?";
        $params[] = $userId;
        $types .= 'i';
    }
    
    if ($status) {
        $where[] = "i.status = ?";
        $params[] = $status;
        $types .= 's';
    }
    
    if ($startDate) {
        $where[] = "i.scheduled_at >= ?";
        $params[] = $startDate;
        $types .= 's';
    }
    
    if ($endDate) {
        $where[] = "i.scheduled_at <= ?";
        $params[] = $endDate;
        $types .= 's';
    }
    
    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    $query = "
        SELECT 
            i.*,
            ep.company_name,
            sp.display_name as student_name,
            j.title as job_title
        FROM interviews i
        LEFT JOIN enterprise_profiles ep ON i.enterprise_id = ep.user_id
        LEFT JOIN student_profiles sp ON i.student_id = sp.user_id
        LEFT JOIN jobs j ON i.job_id = j.id
        $whereClause
        ORDER BY i.scheduled_at ASC
    ";
    
    $stmt = $conn->prepare($query);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $interviews = [];
    while ($row = $result->fetch_assoc()) {
        $interviews[] = $row;
    }
    
    sendApiResponse(['interviews' => $interviews], 200, '查詢成功');
}

/**
 * 確認面試
 */
function confirmInterview($userId, $data) {
    global $conn;
    
    validateRequired($data, ['interview_id']);
    $interviewId = (int)$data['interview_id'];
    
    // 檢查面試是否存在且用戶有權限
    $stmt = $conn->prepare("
        SELECT enterprise_id, student_id, status 
        FROM interviews 
        WHERE id = ?
    ");
    $stmt->bind_param("i", $interviewId);
    $stmt->execute();
    $interview = $stmt->get_result()->fetch_assoc();
    
    if (!$interview) {
        sendApiError('面試不存在', 404, 'NOT_FOUND');
    }
    
    if ($interview['status'] !== 'scheduled') {
        sendApiError('只能確認狀態為 scheduled 的面試', 400, 'INVALID_STATUS');
    }
    
    // 判斷是學生還是企業確認
    if ($userId == $interview['student_id']) {
        $field = 'confirmed_by_student';
        $otherField = 'confirmed_by_enterprise';
    } else if ($userId == $interview['enterprise_id']) {
        $field = 'confirmed_by_enterprise';
        $otherField = 'confirmed_by_student';
    } else {
        sendApiError('無權限確認此面試', 403, 'FORBIDDEN');
    }
    
    // 更新確認狀態
    $stmt = $conn->prepare("UPDATE interviews SET $field = 1 WHERE id = ?");
    $stmt->bind_param("i", $interviewId);
    $stmt->execute();
    
    // 檢查是否雙方都已確認
    $stmt = $conn->prepare("SELECT $otherField FROM interviews WHERE id = ?");
    $stmt->bind_param("i", $interviewId);
    $stmt->execute();
    $otherConfirmed = $stmt->get_result()->fetch_assoc()[$otherField];
    
    if ($otherConfirmed) {
        // 雙方都確認，更新狀態為 confirmed
        $stmt = $conn->prepare("UPDATE interviews SET status = 'confirmed' WHERE id = ?");
        $stmt->bind_param("i", $interviewId);
        $stmt->execute();
    }
    
    sendApiResponse(['message' => '面試已確認'], 200, '確認成功');
}

/**
 * 改期面試
 */
function rescheduleInterview($userId, $data) {
    global $conn;
    
    validateRequired($data, ['interview_id', 'new_scheduled_at']);
    $interviewId = (int)$data['interview_id'];
    $newScheduledAt = sanitizeInput($data['new_scheduled_at']);
    $reason = isset($data['reason']) ? sanitizeInput($data['reason']) : null;
    
    // 檢查面試
    $stmt = $conn->prepare("SELECT scheduled_at, student_id, enterprise_id FROM interviews WHERE id = ?");
    $stmt->bind_param("i", $interviewId);
    $stmt->execute();
    $interview = $stmt->get_result()->fetch_assoc();
    
    if (!$interview) {
        sendApiError('面試不存在', 404, 'NOT_FOUND');
    }
    
    $conn->begin_transaction();
    
    try {
        // 記錄改期
        $stmt = $conn->prepare("
            INSERT INTO interview_reschedules 
            (interview_id, old_scheduled_at, new_scheduled_at, reason, requested_by)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("isssi", $interviewId, $interview['scheduled_at'], $newScheduledAt, $reason, $userId);
        $stmt->execute();
        
        // 更新面試時間
        $stmt = $conn->prepare("
            UPDATE interviews 
            SET scheduled_at = ?, 
                status = 'rescheduled',
                confirmed_by_student = 0,
                confirmed_by_enterprise = 0
            WHERE id = ?
        ");
        $stmt->bind_param("si", $newScheduledAt, $interviewId);
        $stmt->execute();
        
        // 重新建立提醒
        $stmt = $conn->prepare("DELETE FROM interview_reminders WHERE interview_id = ?");
        $stmt->bind_param("i", $interviewId);
        $stmt->execute();
        
        createReminders($interviewId, $newScheduledAt);
        
        $conn->commit();
        sendApiResponse(['message' => '面試時間已更新'], 200, '改期成功');
        
    } catch (Exception $e) {
        $conn->rollback();
        sendApiError('改期失敗：' . $e->getMessage(), 500, 'RESCHEDULE_FAILED');
    }
}

/**
 * 取消面試
 */
function cancelInterview($userId, $data) {
    global $conn;
    
    validateRequired($data, ['interview_id']);
    $interviewId = (int)$data['interview_id'];
    $reason = isset($data['reason']) ? sanitizeInput($data['reason']) : null;
    
    $stmt = $conn->prepare("
        UPDATE interviews 
        SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), '\n取消原因: ', ?)
        WHERE id = ? 
        AND (student_id = ? OR enterprise_id = ?)
    ");
    $stmt->bind_param("siii", $reason, $interviewId, $userId, $userId);
    
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        sendApiResponse(['message' => '面試已取消'], 200, '取消成功');
    } else {
        sendApiError('取消失敗', 500, 'CANCEL_FAILED');
    }
}

/**
 * 取得行事曆資料
 */
function getCalendar($userId) {
    global $conn;
    
    $month = isset($_GET['month']) ? sanitizeInput($_GET['month']) : date('Y-m');
    
    // 判斷用戶角色
    $stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $role = $stmt->get_result()->fetch_assoc()['role'];
    
    // 建立查詢
    $field = ($role === 'student') ? 'student_id' : 'enterprise_id';
    
    $stmt = $conn->prepare("
        SELECT 
            DATE(scheduled_at) as date,
            COUNT(*) as count,
            GROUP_CONCAT(title SEPARATOR '|') as titles
        FROM interviews
        WHERE $field = ?
        AND DATE_FORMAT(scheduled_at, '%Y-%m') = ?
        AND status IN ('scheduled', 'confirmed', 'rescheduled')
        GROUP BY DATE(scheduled_at)
    ");
    $stmt->bind_param("is", $userId, $month);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $calendar = [];
    while ($row = $result->fetch_assoc()) {
        $row['titles'] = explode('|', $row['titles']);
        $calendar[] = $row;
    }
    
    sendApiResponse(['calendar' => $calendar, 'month' => $month], 200, '查詢成功');
}

/**
 * 檢查時間衝突
 */
function hasTimeConflict($userId, $scheduledAt, $duration) {
    global $conn;
    
    $endTime = date('Y-m-d H:i:s', strtotime($scheduledAt) + ($duration * 60));
    
    $stmt = $conn->prepare("
        SELECT COUNT(*) as count 
        FROM interviews 
        WHERE student_id = ?
        AND status IN ('scheduled', 'confirmed')
        AND (
            (scheduled_at <= ? AND DATE_ADD(scheduled_at, INTERVAL duration MINUTE) > ?) OR
            (scheduled_at < ? AND scheduled_at >= ?)
        )
    ");
    $stmt->bind_param("issss", $userId, $scheduledAt, $scheduledAt, $endTime, $scheduledAt);
    $stmt->execute();
    
    $count = (int)$stmt->get_result()->fetch_assoc()['count'];
    return $count > 0;
}

/**
 * 建立提醒
 */
function createReminders($interviewId, $scheduledAt) {
    global $conn;
    
    $datetime = new DateTime($scheduledAt);
    
    // 面試前 1 小時提醒
    $remind1h = clone $datetime;
    $remind1h->modify('-1 hour');
    
    // 面試前 1 天提醒
    $remind1d = clone $datetime;
    $remind1d->modify('-1 day');
    
    $stmt = $conn->prepare("
        INSERT INTO interview_reminders (interview_id, remind_at, remind_type)
        VALUES (?, ?, 'both'), (?, ?, 'notification')
    ");
    $remind1hStr = $remind1h->format('Y-m-d H:i:s');
    $remind1dStr = $remind1d->format('Y-m-d H:i:s');
    $stmt->bind_param("isis", $interviewId, $remind1hStr, $interviewId, $remind1dStr);
    $stmt->execute();
}

/**
 * 完成面試並給回饋
 */
function completeInterview($userId, $data) {
    global $conn;
    
    validateRequired($data, ['interview_id']);
    $interviewId = (int)$data['interview_id'];
    $feedback = isset($data['feedback']) ? sanitizeInput($data['feedback']) : null;
    $rating = isset($data['rating']) ? (int)$data['rating'] : null;
    
    if ($rating && ($rating < 1 || $rating > 5)) {
        sendApiError('評分必須在 1-5 之間', 400, 'INVALID_RATING');
    }
    
    $stmt = $conn->prepare("
        UPDATE interviews 
        SET status = 'completed', feedback = ?, rating = ?
        WHERE id = ? AND enterprise_id = ?
    ");
    $stmt->bind_param("ssii", $feedback, $rating, $interviewId, $userId);
    
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        sendApiResponse(['message' => '面試已完成'], 200, '更新成功');
    } else {
        sendApiError('更新失敗', 500, 'UPDATE_FAILED');
    }
}

/**
 * 設定可用時間
 */
function setAvailability($userId, $data) {
    global $conn;
    
    validateRequired($data, ['timeslots']);
    $timeslots = $data['timeslots'];
    
    $conn->begin_transaction();
    
    try {
        // 刪除舊的時間設定
        $stmt = $conn->prepare("DELETE FROM available_timeslots WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        
        // 插入新的時間設定
        $stmt = $conn->prepare("
            INSERT INTO available_timeslots (user_id, day_of_week, start_time, end_time)
            VALUES (?, ?, ?, ?)
        ");
        
        foreach ($timeslots as $slot) {
            $dayOfWeek = (int)$slot['day_of_week'];
            $startTime = sanitizeInput($slot['start_time']);
            $endTime = sanitizeInput($slot['end_time']);
            
            $stmt->bind_param("iiss", $userId, $dayOfWeek, $startTime, $endTime);
            $stmt->execute();
        }
        
        $conn->commit();
        sendApiResponse(['message' => '可用時間已更新'], 200, '設定成功');
        
    } catch (Exception $e) {
        $conn->rollback();
        sendApiError('設定失敗：' . $e->getMessage(), 500, 'SET_FAILED');
    }
}

/**
 * 取得可用時間
 */
function getAvailability() {
    global $conn;
    
    validateRequired($_GET, ['user_id']);
    $userId = (int)$_GET['user_id'];
    
    $stmt = $conn->prepare("
        SELECT * FROM available_timeslots 
        WHERE user_id = ? AND is_active = 1
        ORDER BY day_of_week, start_time
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $timeslots = [];
    while ($row = $result->fetch_assoc()) {
        $timeslots[] = $row;
    }
    
    sendApiResponse(['timeslots' => $timeslots], 200, '查詢成功');
}
?>

