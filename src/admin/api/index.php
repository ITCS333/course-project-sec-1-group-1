<?php
header ('Content-Type: application/json');
header ('Access-Control-Allow-Origin: *');
header ('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header ('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS'){

    http_response_code(200);
    exit;

}

require_once '../../common/db.php';

$method = $_SERVER ['REQUEST_METHOD'];
$raw = file_get_contents ('php://input');
$data = json_decode($raw, true);


try {
    $db = getDBConnection();

    if ($method === 'GET'){
        if(isset($_GET['id']) && !empty($_GET['id'])){
            $id = (int)$_GET['id'];
            $sql = "SELECT id, name, email, is_admin, created_at FROM users WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([':id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC); 

            if (!$user) {
                
             http_response_code(404);
             echo json_encode(['success' => false, 'message' => 'User not found']);
              exit;
                
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $user]);
            exit;
        }
        else{
           $sql = "SELECT id, name, email, is_admin, created_at FROM users";
           $params = [];

           if(isset($_GET['search']) && !empty($_GET['search'])){
             $searchTerm = '%' . $_GET['search'] . '%';
             $sql .= " WHERE name LIKE :search OR email LIKE :search";
             $params[':search'] = $searchTerm;

           }

           if(isset($_GET['sort']) && in_array($_GET['sort'], ['name', 'email', 'is_admin'])){

            $sortField = $_GET['sort'];
            $order = (isset($_GET['order']) && $_GET['order'] === 'desc') ? 'DESC' : 'ASC';
            $sql .= " ORDER BY $sortField $order";

           }

           $stmt = $db ->prepare($sql);
           $stmt->execute($params);
           $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

           http_response_code(200);
           echo json_encode(['success' => true, 'data' => $users]);
            exit;
  
        }
    }

    elseif($method === 'POST') {
       if (isset($_GET['action']) && $_GET['action'] === 'change_password') {
           if (!isset($data['id']) || !isset($data['current_password']) || !isset($data['new_password'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                exit;
            }

            $id = (int)$data['id'];
            $currentPassword = $data['current_password'];
            $newPassword = $data['new_password'];


            if(strlen($newPassword) < 8){
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
                exit;
            }

            $sql = "SELECT password FROM users WHERE id = :id";
            $stmt = $db -> prepare($sql);
            $stmt->execute([':id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user){

                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
                exit;

            }

            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $sql = "UPDATE users SET password = :password WHERE id = :id";
            $stmt = $db -> prepare($sql);
            $stmt -> execute([':password' => $hashedPassword, ':id' => $id]);


            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
            exit;

        } 
        else {
            if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {

                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                exit;
            }

            $name = trim($data['name']);
            $email = trim($data['email']);
            $password = trim($data['password']);
            $isAdmin = isset($data['is_admin']) ? (int)$data['is_admin'] : 0;

            if (strlen($password) <8 ) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
                exit;

            }


            $sql = "SELECT id FROM users WHERE email = :email";
            $stmt = $db->prepare($sql);
            $stmt->execute([':email'=>$email]);

            if ($stmt -> fetch()){
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Email already exists']);
                exit;

            }
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $sql = "INSERT INTO users (name, email, password, is_admin) VALUES (:name, :email, :password, :is_admin)";
             $stmt = $db->prepare($sql);
            $stmt->execute([

                ':name' => $name,
                ':email' => $email,
                ':password' => $hashedPassword,
                ':is_admin' => $isAdmin

            ]);

            $userId = $db->lastInsertId();

            http_response_code(201);
            echo json_encode (['success' => true, 'message' => 'User created successfully', 'data' => ['id' => $userId]]);
            exit;


        }
    }

    elseif ($method === 'PUT') {
        
        if (!isset($data['id'])){


        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        exit;

        }

        $id = (int)$data['id'];
        $sql = "SELECT id FROM users WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);


        if (!$stmt->fetch()){

            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }

        $updates = [];
        $params = [':id' =>$id];

        if (isset($data['name'])) {

            $updates[] = "name = :name";
            $params[':name'] = trim($data['name']);

        }

        if (isset($data['email'])){

            $email = trim($data['email']);

             if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid email format']);
                exit;

             }

             $sql = "SELECT id FROM users WHERE email = :email AND id != :id";
             $stmt = $db->prepare($sql);
             $stmt->execute([':email' => $email, ':id' => $id]);

             if ($stmt->fetch()){

                http_response_code(409);
                echo json_encode (['success' => false, 'message' => 'Email already exists']);
                exit;

             }

             $updates[] = "email = :email";
             $params[':email'] = $email;

        }

        if (isset($data['is_admin'])) {

            $updates[] = "is_admin = :is_admin";
            $params[':is_admin'] = (int)$data['is_admin'];
        }

        if (empty($updates)) {

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'No changes made']);
            exit;
        }

        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'User updated successfully']);
        exit;
    }

    elseif ($method === 'DELETE') {

        if (!isset($_GET['id']) || empty($_GET['id'])) {

            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID is required']);
            exit;

        }

        $id = (int)$_GET['id'];

        $sql = "SELECT id FROM users WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);

        if (!$stmt->fetch()) {

            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit;
        }

        $sql = "DELETE FROM users WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);

        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
        exit;
    }

    else {

        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

} catch (PDOException $e) {

    error_log('Database error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
    exit;

} 

catch (Exception $e) {

    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}








function getUsers($db) {
    global $search, $sort, $order;
 
    $sql    = 'SELECT id, name, email, is_admin, created_at FROM users';
    $params = [];
 
    if ($search !== null && $search !== '') {
        $sql             .= ' WHERE name LIKE :search OR email LIKE :search';
        $params[':search'] = '%' . $search . '%';
    }
 
    $allowedSort = ['name', 'email', 'is_admin'];
    if ($sort !== null && in_array($sort, $allowedSort, true)) {
        $dir  = (strtolower($order) === 'desc') ? 'DESC' : 'ASC';
        $sql .= " ORDER BY {$sort} {$dir}";
    }
 
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
 
    sendResponse($users, 200);
}
 

function getUserById($db, $id) {
    $stmt = $db->prepare(
        'SELECT id, name, email, is_admin, created_at FROM users WHERE id = :id'
    );
    $stmt->execute([':id' => $id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
 
    if (!$user) {
        sendResponse('User not found.', 404);
    }
 
    sendResponse($user, 200);
}
 

function createUser($db, $data) {
    if (
        empty($data['name'])     ||
        empty($data['email'])    ||
        empty($data['password'])
    ) {
        sendResponse('Name, email, and password are required.', 400);
    }
 
    $name     = sanitizeInput($data['name']);
    $email    = sanitizeInput($data['email']);
    $password = trim($data['password']);
 
    if (!validateEmail($email)) {
        sendResponse('Invalid email address.', 400);
    }
 
    if (strlen($password) < 8) {
        sendResponse('Password must be at least 8 characters.', 400);
    }
 
    $stmt = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        sendResponse('Email address is already in use.', 409);
    }
 
    $hash = password_hash($password, PASSWORD_DEFAULT);
 
    $isAdmin = isset($data['is_admin']) && $data['is_admin'] == 1 ? 1 : 0;
 
    $stmt = $db->prepare(
        'INSERT INTO users (name, email, password, is_admin) VALUES (:name, :email, :password, :is_admin)'
    );
    $ok = $stmt->execute([
        ':name'     => $name,
        ':email'    => $email,
        ':password' => $hash,
        ':is_admin' => $isAdmin,
    ]);
 
    if ($ok) {
        sendResponse(['id' => (int)$db->lastInsertId()], 201);
    } else {
        sendResponse('Failed to create user.', 500);
    }
}
 
function updateUser($db, $data) {
    if (empty($data['id'])) {
        sendResponse('User ID is required.', 400);
    }
 
    $id = (int)$data['id'];
 
    $stmt = $db->prepare('SELECT id FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        sendResponse('User not found.', 404);
    }
 
    $setClauses = [];
    $params     = [':id' => $id];
 
    if (isset($data['name']) && $data['name'] !== '') {
        $setClauses[]    = 'name = :name';
        $params[':name'] = sanitizeInput($data['name']);
    }
 
    if (isset($data['email']) && $data['email'] !== '') {
        $email = sanitizeInput($data['email']);
        if (!validateEmail($email)) {
            sendResponse('Invalid email address.', 400);
        }
        $stmt2 = $db->prepare(
            'SELECT id FROM users WHERE email = :email AND id != :id LIMIT 1'
        );
        $stmt2->execute([':email' => $email, ':id' => $id]);
        if ($stmt2->fetch()) {
            sendResponse('Email address is already in use by another account.', 409);
        }
        $setClauses[]     = 'email = :email';
        $params[':email'] = $email;
    }
 
    if (isset($data['is_admin'])) {
        $setClauses[]        = 'is_admin = :is_admin';
        $params[':is_admin'] = $data['is_admin'] == 1 ? 1 : 0;
    }
 
    if (empty($setClauses)) {
        sendResponse('No fields to update.', 200);
    }
 
    $sql  = 'UPDATE users SET ' . implode(', ', $setClauses) . ' WHERE id = :id';
    $stmt = $db->prepare($sql);
    $ok   = $stmt->execute($params);
 
    if ($ok) {
        sendResponse('User updated successfully.', 200);
    } else {
        sendResponse('Failed to update user.', 500);
    }
}
 
function deleteUser($db, $id) {
    if (!$id) {
        sendResponse('User ID is required.', 400);
    }
 
    $stmt = $db->prepare('SELECT id FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        sendResponse('User not found.', 404);
    }
 
    $stmt = $db->prepare('DELETE FROM users WHERE id = :id');
    $ok   = $stmt->execute([':id' => $id]);
 
    if ($ok) {
        sendResponse('User deleted successfully.', 200);
    } else {
        sendResponse('Failed to delete user.', 500);
    }
}
 
function changePassword($db, $data) {
    if (
        empty($data['id'])               ||
        empty($data['current_password']) ||
        empty($data['new_password'])
    ) {
        sendResponse('id, current_password, and new_password are required.', 400);
    }
 
    $id              = (int)$data['id'];
    $currentPassword = $data['current_password'];
    $newPassword     = $data['new_password'];
 
    if (strlen($newPassword) < 8) {
        sendResponse('New password must be at least 8 characters.', 400);
    }
 
    $stmt = $db->prepare('SELECT password FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $row  = $stmt->fetch(PDO::FETCH_ASSOC);
 
    if (!$row) {
        sendResponse('User not found.', 404);
    }
 
    if (!password_verify($currentPassword, $row['password'])) {
        sendResponse('Current password is incorrect.', 401);
    }
 
    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $db->prepare('UPDATE users SET password = :password WHERE id = :id');
    $ok   = $stmt->execute([':password' => $hash, ':id' => $id]);
 
    if ($ok) {
        sendResponse('Password changed successfully.', 200);
    } else {
        sendResponse('Failed to update password.', 500);
    }
}
 
 
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    if ($statusCode < 400) {
        echo json_encode(['success' => true, 'data' => $data]);
    } else {
        echo json_encode(['success' => false, 'message' => $data]);
    }
    exit;
}

function validateEmail($email) {
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function sanitizeInput($data) {
    $data = trim($data);
    $data = strip_tags($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}
