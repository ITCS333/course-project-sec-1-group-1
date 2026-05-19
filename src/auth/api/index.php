<?php

session_start();

header ('Content-Type: application/json');
header ('Access-Control-Allow-Origin: *');
header ('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header ('Access-Control-Allow-Headers: Content-Type');

require_once '../../common/db.php';

if($_SERVER['REQUEST_METHOD'] === 'OPTIONS'){

    http_response_code(200);
    exit;

}

if($_SERVER['REQUEST_METHOD'] !== 'POST'){

    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'  
    ]);
    exit;

}    


$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

     
if(!isset($data['email'])|| !isset($data['password'])) {

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required'


    ]);
    exit;

}

$email = trim($data['email']);
$password = trim($data['password']);


if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email format'
    ]);
    exit;

}


if(strlen($password)<8){
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Password must be at least 8 characters'
    ]);
    exit;

}

require_once '../common/db.php';

try {

$db = getDBConnection();
$sql = "SELECT id, name, email, password, is_admin FROM users WHERE email = :email";
$stmt = $db->prepare($sql);
$stmt->execute([':email' => $email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);


if(!$user){
     http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password'
        ]);
        exit;
    }

if(!password_verify($password, $user['password'])) {
      http_response_code(401);
         echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password'
        ]);
        exit;

    }
$_SESSION['user_id']=$user['id'];
$_SESSION['user_name']=$user['name'];
$_SESSION['user_email']=$user['email'];
$_SESSION['is_admin']=$user['is_admin'];
$_SESSION['logged_in'] = true;

$response = [
    'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'is_admin' => $user['is_admin']
        ]


];

http_response_code(200);
echo json_encode($response);
exit;

}

catch(PDOException $e) {
    error_log('Database error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error. Please try again later.'
    ]);
    exit;
}

catch(Exception $e) {
     http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit;


}




?>
