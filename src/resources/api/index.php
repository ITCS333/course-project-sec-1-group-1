<?php

// HEADERS AND INITIALIZATION

 
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
 
require_once '../../common/db.php';
$db = getDBConnection();
 
$method  = $_SERVER['REQUEST_METHOD'];
$rawData = file_get_contents('php://input');
$data    = json_decode($rawData, true) ?? [];
 
$action     = isset($_GET['action'])     ? trim($_GET['action'])     : null;
$id         = isset($_GET['id'])         && $_GET['id'] !== ''         ? (int)$_GET['id']         : null;
$resourceId = isset($_GET['resource_id'])&& $_GET['resource_id'] !== '' ? (int)$_GET['resource_id'] : null;
$commentId  = isset($_GET['comment_id']) && $_GET['comment_id'] !== ''  ? (int)$_GET['comment_id']  : null;
 
// RESOURCE FUNCTIONS

 
function getAllResources($db) {
    $search = isset($_GET['search']) && $_GET['search'] !== '' ? trim($_GET['search']) : null;
    $sort   = isset($_GET['sort'])   && $_GET['sort']   !== '' ? trim($_GET['sort'])   : 'created_at';
    $order  = isset($_GET['order'])  && $_GET['order']  !== '' ? trim($_GET['order'])  : 'desc';
 
    $sql    = 'SELECT id, title, description, link, created_at FROM resources';
    $params = [];
 
    if ($search !== null) {
        $sql             .= ' WHERE title LIKE :search OR description LIKE :search';
        $params[':search'] = '%' . $search . '%';
    }
 
    $allowedSort = ['title', 'created_at'];
    if (!in_array($sort, $allowedSort, true)) {
        $sort = 'created_at';
    }
 
    $order = strtolower($order) === 'asc' ? 'ASC' : 'DESC';
    $sql  .= " ORDER BY {$sort} {$order}";
 
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);
 
    sendResponse(['success' => true, 'data' => $resources]);
}
 
function getResourceById($db, $resourceId) {
    if (!$resourceId || !is_numeric($resourceId)) {
        sendResponse(['success' => false, 'message' => 'Invalid resource ID.'], 400);
    }
 
    $stmt = $db->prepare(
        'SELECT id, title, description, link, created_at FROM resources WHERE id = ?'
    );
    $stmt->execute([$resourceId]);
    $resource = $stmt->fetch(PDO::FETCH_ASSOC);
 
    if (!$resource) {
        sendResponse(['success' => false, 'message' => 'Resource not found.'], 404);
    }
 
    sendResponse(['success' => true, 'data' => $resource]);
}
 
function createResource($db, $data) {
    $validation = validateRequiredFields($data, ['title', 'link']);
    if (!$validation['valid']) {
        sendResponse(['success' => false, 'message' => 'Title and link are required.'], 400);
    }
 
    $title       = sanitizeInput($data['title']);
    $link        = sanitizeInput($data['link']);
    $description = isset($data['description']) ? sanitizeInput($data['description']) : '';
 
    if (!validateUrl($link)) {
        sendResponse(['success' => false, 'message' => 'Invalid URL format.'], 400);
    }
 
    $stmt = $db->prepare(
        'INSERT INTO resources (title, description, link) VALUES (?, ?, ?)'
    );
    $stmt->execute([$title, $description, $link]);
 
    if ($stmt->rowCount() > 0) {
        sendResponse(['success' => true, 'message' => 'Resource created successfully.', 'id' => (int)$db->lastInsertId()], 201);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to create resource.'], 500);
    }
}
 
function updateResource($db, $data) {
    if (empty($data['id'])) {
        sendResponse(['success' => false, 'message' => 'Resource ID is required.'], 400);
    }
 
    $id = (int)$data['id'];
 
    $check = $db->prepare('SELECT id FROM resources WHERE id = ?');
    $check->execute([$id]);
    if (!$check->fetch()) {
        sendResponse(['success' => false, 'message' => 'Resource not found.'], 404);
    }
 
    $setClauses = [];
    $params     = [];
 
    if (isset($data['title']) && $data['title'] !== '') {
        $setClauses[] = 'title = ?';
        $params[]     = sanitizeInput($data['title']);
    }
    if (isset($data['description'])) {
        $setClauses[] = 'description = ?';
        $params[]     = sanitizeInput($data['description']);
    }
    if (isset($data['link']) && $data['link'] !== '') {
        if (!validateUrl($data['link'])) {
            sendResponse(['success' => false, 'message' => 'Invalid URL format.'], 400);
        }
        $setClauses[] = 'link = ?';
        $params[]     = sanitizeInput($data['link']);
    }
 
    if (empty($setClauses)) {
        sendResponse(['success' => false, 'message' => 'No fields to update.'], 400);
    }
 
    $params[] = $id;
    $sql      = 'UPDATE resources SET ' . implode(', ', $setClauses) . ' WHERE id = ?';
    $stmt     = $db->prepare($sql);
    $ok       = $stmt->execute($params);
 
    if ($ok) {
        sendResponse(['success' => true, 'message' => 'Resource updated successfully.']);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to update resource.'], 500);
    }
}
 
function deleteResource($db, $resourceId) {
    if (!$resourceId || !is_numeric($resourceId)) {
        sendResponse(['success' => false, 'message' => 'Invalid resource ID.'], 400);
    }
 
    $check = $db->prepare('SELECT id FROM resources WHERE id = ?');
    $check->execute([$resourceId]);
    if (!$check->fetch()) {
        sendResponse(['success' => false, 'message' => 'Resource not found.'], 404);
    }
 
    $stmt = $db->prepare('DELETE FROM resources WHERE id = ?');
    $stmt->execute([$resourceId]);
 
    if ($stmt->rowCount() > 0) {
        sendResponse(['success' => true, 'message' => 'Resource deleted successfully.']);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to delete resource.'], 500);
    }
}
 
// COMMENT FUNCTIONS
 
function getCommentsByResourceId($db, $resourceId) {
    if (!$resourceId || !is_numeric($resourceId)) {
        sendResponse(['success' => false, 'message' => 'Invalid resource ID.'], 400);
    }
 
    $stmt = $db->prepare(
        'SELECT id, resource_id, author, text, created_at
         FROM comments_resource
         WHERE resource_id = ?
         ORDER BY created_at ASC'
    );
    $stmt->execute([$resourceId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
 
    sendResponse(['success' => true, 'data' => $comments]);
}
 
function createComment($db, $data) {
    $validation = validateRequiredFields($data, ['resource_id', 'author', 'text']);
    if (!$validation['valid']) {
        sendResponse(['success' => false, 'message' => 'resource_id, author, and text are required.'], 400);
    }
 
    if (!is_numeric($data['resource_id'])) {
        sendResponse(['success' => false, 'message' => 'resource_id must be numeric.'], 400);
    }
 
    $resourceId = (int)$data['resource_id'];
 
    $check = $db->prepare('SELECT id FROM resources WHERE id = ?');
    $check->execute([$resourceId]);
    if (!$check->fetch()) {
        sendResponse(['success' => false, 'message' => 'Resource not found.'], 404);
    }
 
    $author = sanitizeInput($data['author']);
    $text   = sanitizeInput($data['text']);
 
    $stmt = $db->prepare(
        'INSERT INTO comments_resource (resource_id, author, text) VALUES (?, ?, ?)'
    );
    $stmt->execute([$resourceId, $author, $text]);
 
    if ($stmt->rowCount() > 0) {
        sendResponse(['success' => true, 'message' => 'Comment added successfully.', 'id' => (int)$db->lastInsertId()], 201);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to add comment.'], 500);
    }
}
 
function deleteComment($db, $commentId) {
    if (!$commentId || !is_numeric($commentId)) {
        sendResponse(['success' => false, 'message' => 'Invalid comment ID.'], 400);
    }
 
    $check = $db->prepare('SELECT id FROM comments_resource WHERE id = ?');
    $check->execute([$commentId]);
    if (!$check->fetch()) {
        sendResponse(['success' => false, 'message' => 'Comment not found.'], 404);
    }
 
    $stmt = $db->prepare('DELETE FROM comments_resource WHERE id = ?');
    $stmt->execute([$commentId]);
 
    if ($stmt->rowCount() > 0) {
        sendResponse(['success' => true, 'message' => 'Comment deleted successfully.']);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to delete comment.'], 500);
    }
}

// MAIN REQUEST ROUTER
 
try {
 
    if ($method === 'GET') {
        if ($action === 'comments') {
            getCommentsByResourceId($db, $resourceId);
        } elseif ($id !== null) {
            getResourceById($db, $id);
        } else {
            getAllResources($db);
        }
 
    } elseif ($method === 'POST') {
        if ($action === 'comment') {
            createComment($db, $data);
        } else {
            createResource($db, $data);
        }
 
    } elseif ($method === 'PUT') {
        updateResource($db, $data);
 
    } elseif ($method === 'DELETE') {
        if ($action === 'delete_comment') {
            deleteComment($db, $commentId);
        } else {
            deleteResource($db, $id);
        }
 
    } else {
        sendResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
    }
 
} catch (PDOException $e) {
    error_log($e->getMessage());
    sendResponse(['success' => false, 'message' => 'A database error occurred. Please try again later.'], 500);
 
} catch (Exception $e) {
    error_log($e->getMessage());
    sendResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
 
 
// HELPER FUNCTIONS

 
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    if (!is_array($data)) {
        $data = ['success' => false, 'message' => $data];
    }
    echo json_encode($data);
    exit;
}
 
function validateUrl($url) {
    return (bool) filter_var($url, FILTER_VALIDATE_URL);
}
 
function sanitizeInput($data) {
    $data = trim($data);
    $data = strip_tags($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}
 
function validateRequiredFields($data, $requiredFields) {
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
            $missing[] = $field;
        }
    }
    return ['valid' => count($missing) === 0, 'missing' => $missing];
}