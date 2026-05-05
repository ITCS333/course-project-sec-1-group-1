<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../../common/db.php';
$db = getDBConnection();

$method = $_SERVER['REQUEST_METHOD'];
$rawData = file_get_contents('php://input');
$data    = json_decode($rawData, true) ?? [];

$action  = $_GET['action']   ?? null;
$id      = $_GET['id']       ?? null;
$topicId = $_GET['topic_id'] ?? null;

function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if (!in_array($method, ['GET', 'POST', 'PUT', 'DELETE'])) {
    sendResponse(['success' => false], 405);
}

if ($action === 'replies' && $method === 'GET') {
    getRepliesByTopicId($db, $topicId);
} elseif ($action === 'reply' && $method === 'POST') {
    createReply($db, $data);
} elseif ($action === 'reply' && $method === 'DELETE' && $id) {
    deleteReply($db, $id);
} elseif ($method === 'GET' && $id) {
    getTopicById($db, $id);
} elseif ($method === 'GET') {
    getAllTopics($db);
} elseif ($method === 'POST') {
    createTopic($db, $data);
} elseif ($method === 'PUT') {
    updateTopic($db, $data);
} elseif ($method === 'DELETE' && $id) {
    deleteTopic($db, $id);
} else {
    sendResponse(['success' => false], 405);
}

function getAllTopics(PDO $db): void {
    $search = $_GET['search'] ?? '';
    $sort = in_array($_GET['sort'] ?? '', ['subject', 'author', 'created_at']) ? $_GET['sort'] : 'created_at';
    $order = strtolower($_GET['order'] ?? '') === 'asc' ? 'ASC' : 'DESC';
    $query = "SELECT id, subject, message, author, created_at FROM topics";
    $params = [];
    if ($search !== '') {
        $query .= " WHERE subject LIKE :s OR message LIKE :s OR author LIKE :s";
        $params['s'] = "%$search%";
    }
    $query .= " ORDER BY $sort $order";
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    sendResponse(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function getTopicById(PDO $db, $id): void {
    if (!$id || !is_numeric($id)) sendResponse(['success' => false], 400);
    $stmt = $db->prepare("SELECT * FROM topics WHERE id = ?");
    $stmt->execute([$id]);
    $topic = $stmt->fetch(PDO::FETCH_ASSOC);
    $topic ? sendResponse(['success' => true, 'data' => $topic]) : sendResponse(['success' => false], 404);
}

function createTopic(PDO $db, array $data): void {
    if (empty($data['subject']) || empty($data['message']) || empty($data['author'])) sendResponse(['success' => false], 400);
    $stmt = $db->prepare("INSERT INTO topics (subject, message, author) VALUES (?, ?, ?)");
    if ($stmt->execute([trim($data['subject']), trim($data['message']), trim($data['author'])])) {
        sendResponse(['success' => true, 'id' => (int)$db->lastInsertId()], 201);
    }
    sendResponse(['success' => false], 500);
}

function updateTopic(PDO $db, array $data): void {
    if (empty($data['id'])) sendResponse(['success' => false], 400);
    $check = $db->prepare("SELECT id FROM topics WHERE id = ?");
    $check->execute([$data['id']]);
    if (!$check->fetch()) sendResponse(['success' => false], 404);
    $fields = []; $params = [];
    if (isset($data['subject'])) { $fields[] = "subject = ?"; $params[] = $data['subject']; }
    if (isset($data['message'])) { $fields[] = "message = ?"; $params[] = $data['message']; }
    if (empty($fields)) sendResponse(['success' => false], 400);
    $params[] = $data['id'];
    $stmt = $db->prepare("UPDATE topics SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($params);
    sendResponse(['success' => true]);
}

function deleteTopic(PDO $db, $id): void {
    $check = $db->prepare("SELECT id FROM topics WHERE id = ?");
    $check->execute([$id]);
    if (!$check->fetch()) sendResponse(['success' => false], 404);
    $stmt = $db->prepare("DELETE FROM topics WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(['success' => true]);
}

function getRepliesByTopicId(PDO $db, $topicId): void {
    $stmt = $db->prepare("SELECT id, topic_id, text, author, created_at FROM replies WHERE topic_id = ? ORDER BY created_at ASC");
    $stmt->execute([$topicId]);
    sendResponse(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function createReply(PDO $db, array $data): void {
    if (empty($data['topic_id']) || empty($data['text']) || empty($data['author'])) sendResponse(['success' => false], 400);
    $check = $db->prepare("SELECT id FROM topics WHERE id = ?");
    $check->execute([$data['topic_id']]);
    if (!$check->fetch()) sendResponse(['success' => false], 404);
    $stmt = $db->prepare("INSERT INTO replies (topic_id, text, author) VALUES (?, ?, ?)");
    if ($stmt->execute([$data['topic_id'], $data['text'], $data['author']])) {
        $newId = $db->lastInsertId();
        $stmt = $db->prepare("SELECT id, topic_id, text, author, created_at FROM replies WHERE id = ?");
        $stmt->execute([$newId]);
        sendResponse(['success' => true, 'data' => $stmt->fetch(PDO::FETCH_ASSOC)], 201);
    }
    sendResponse(['success' => false], 500);
}

function deleteReply(PDO $db, $id): void {
    if (!$id) {
        sendResponse(['success' => false], 400);
    }
    $stmt = $db->prepare("DELETE FROM replies WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(['success' => true]);
}
