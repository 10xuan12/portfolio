<?php
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

$checks = [];
$status = 'ok';

// DB 連線檢查
$dbOk = isset($GLOBALS['conn']) && !$GLOBALS['conn']->connect_error;
$checks['database'] = $dbOk ? 'ok' : ('error: ' . ($GLOBALS['conn']->connect_error ?? 'not connected'));
if (!$dbOk) { $status = 'degraded'; }

// 重要路由存在性檢查（檔案存在即可）
$studentEndpoints = [
    'student/auth.php', 'student/profile.php', 'student/portfolio.php', 'student/resume.php',
    'student/notifications.php', 'student/activities.php', 'student/badges.php', 'student/settings.php',
    'student/password.php', 'student/stats.php', 'student/search.php', 'student/options.php', 'student/account.php'
];

$missing = [];
foreach ($studentEndpoints as $rel) {
    if (!file_exists(__DIR__ . DIRECTORY_SEPARATOR . $rel)) {
        $missing[] = $rel;
    }
}
$checks['student_endpoints'] = empty($missing) ? 'ok' : ['missing' => $missing];
if (!empty($missing)) { $status = 'degraded'; }

// 回傳
sendResponse([
    'status' => $status,
    'checks' => $checks,
    'timestamp' => date('c')
], 200, 'health');

?>


