<?php
require_once '../config.php';

// 企業推薦快取 API（獨立檔）
// GET: list（取得本企業推薦）、refresh（重算並回存快取）

$enterpriseId = checkPermission('enterprise');

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $action = $_GET['action'] ?? 'list';
        if ($action === 'list') {
            listRecommendations($enterpriseId);
        } elseif ($action === 'refresh') {
            refreshRecommendations($enterpriseId);
        } else {
            sendError('無效的操作', 400);
        }
        break;
    default:
        sendError('不支援的 HTTP 方法', 405);
}

function listRecommendations($enterpriseId) {
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));
    $stmt = $GLOBALS['conn']->prepare(
        "SELECT er.student_id, er.score, er.reason, er.expires_at,
                sp.display_name, sp.first_name, sp.last_name, sp.avatar_url,
                sp.major, sp.school, sp.grade, sp.skills,
                COALESCE(COUNT(p.id),0) AS portfolio_count,
                COALESCE(SUM(p.view_count),0) AS total_views,
                COALESCE(SUM(p.like_count),0) AS total_likes
         FROM enterprise_recommendations er
         JOIN users u ON er.student_id = u.id AND u.role = 'student' AND u.status = 'active'
         LEFT JOIN student_profiles sp ON u.id = sp.user_id
         LEFT JOIN portfolios p ON p.user_id = u.id AND p.status = 'published'
         WHERE er.enterprise_id = ? AND (er.expires_at IS NULL OR er.expires_at > NOW())
         GROUP BY er.student_id
         ORDER BY er.score DESC, er.id DESC
         LIMIT ?"
    );
    $stmt->bind_param('ii', $enterpriseId, $limit);
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = $res->fetch_all(MYSQLI_ASSOC);

    $list = [];
    foreach ($rows as $r) {
        $list[] = [
            'id' => (int)$r['student_id'],
            'name' => $r['display_name'] ?: trim(($r['first_name'] ?? '').' '.($r['last_name'] ?? '')),
            'avatar' => $r['avatar_url'],
            'department' => $r['major'],
            'grade' => $r['grade'],
            'skills' => $r['skills'] ? array_map('trim', explode(',', $r['skills'])) : [],
            'stats' => [
                'portfolios' => (int)($r['portfolio_count'] ?? 0),
                'views' => (int)($r['total_views'] ?? 0),
                'likes' => (int)($r['total_likes'] ?? 0)
            ],
            'score' => (float)$r['score'],
            'reason' => $r['reason'],
            'expires_at' => $r['expires_at']
        ];
    }

    sendResponse(['recommendations' => $list], 200, '取得推薦成功');
}

function refreshRecommendations($enterpriseId) {
    // 取企業最近瀏覽與職缺技能，計算簡單分數後回存快取
    $limit = min(100, max(10, (int)($_GET['limit'] ?? 30)));

    // 企業最近瀏覽所對應的技能關鍵字（簡化：從相關學生 skills 聚合）
    $kwStmt = $GLOBALS['conn']->prepare(
        "SELECT sp.skills
         FROM enterprise_views ev
         JOIN portfolios p ON ev.portfolio_id = p.id
         JOIN users u ON p.user_id = u.id
         LEFT JOIN student_profiles sp ON u.id = sp.user_id
         WHERE ev.enterprise_id = ? AND p.status = 'published'
         ORDER BY ev.view_date DESC
         LIMIT 200"
    );
    $kwStmt->bind_param('i', $enterpriseId);
    $kwStmt->execute();
    $kwRes = $kwStmt->get_result();
    $kwPool = [];
    while ($r = $kwRes->fetch_assoc()) {
        $arr = $r['skills'] ? array_map('trim', explode(',', $r['skills'])) : [];
        foreach ($arr as $w) { if ($w !== '') $kwPool[strtolower($w)] = true; }
    }
    $kwList = array_slice(array_keys($kwPool), 0, 15);

    // 候選學生：有公開作品者
    $candStmt = $GLOBALS['conn']->prepare(
        "SELECT u.id AS student_id, sp.display_name, sp.first_name, sp.last_name, sp.skills,
                COALESCE(COUNT(p.id),0) AS portfolio_count,
                COALESCE(SUM(p.view_count),0) AS total_views,
                COALESCE(SUM(p.like_count),0) AS total_likes
         FROM users u
         LEFT JOIN student_profiles sp ON u.id = sp.user_id
         LEFT JOIN portfolios p ON p.user_id = u.id AND p.status = 'published'
         WHERE u.role = 'student' AND u.status = 'active'
         GROUP BY u.id
         HAVING portfolio_count > 0
         ORDER BY total_views DESC, total_likes DESC, portfolio_count DESC
         LIMIT ?"
    );
    $candStmt->bind_param('i', $limit);
    $candStmt->execute();
    $candRes = $candStmt->get_result();

    // 先清除過期紀錄（不強制刪全部）
    $GLOBALS['conn']->query("DELETE FROM enterprise_recommendations WHERE enterprise_id = ".(int)$enterpriseId." AND expires_at IS NOT NULL AND expires_at < NOW()");

    // 計算分數並 upsert
    $expireAt = date('Y-m-d H:i:s', time() + 7 * 24 * 3600);
    while ($r = $candRes->fetch_assoc()) {
        $skillsArr = $r['skills'] ? array_map('trim', explode(',', $r['skills'])) : [];
        $match = 0;
        foreach ($skillsArr as $s) {
            if (isset($kwPool[strtolower($s)])) { $match++; }
        }
        $score = 40 + min(40, (int)round($match * 8));
        $score += min(10, (int)floor(($r['total_views'] ?? 0) / 100));
        $score += min(10, (int)($r['portfolio_count'] ?? 0));
        $score = min(100, $score);

        $reason = $match > 0 ? '與近期瀏覽技能相符' : '熱門優質學生';

        // upsert（先刪後插，維持唯一）
        $del = $GLOBALS["conn"]->prepare("DELETE FROM enterprise_recommendations WHERE enterprise_id = ? AND student_id = ?");
        $del->bind_param('ii', $enterpriseId, $r['student_id']);
        $del->execute();

        $ins = $GLOBALS['conn']->prepare(
            "INSERT INTO enterprise_recommendations (enterprise_id, student_id, score, reason, meta, created_at, expires_at)
             VALUES (?, ?, ?, ?, ?, NOW(), ?)"
        );
        $meta = json_encode(['kw' => $kwList]);
        $ins->bind_param('iidsss', $enterpriseId, $r['student_id'], $score, $reason, $meta, $expireAt);
        $ins->execute();
    }

    sendResponse([], 200, '推薦已刷新');
}


