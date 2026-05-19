<?php



if (!function_exists('getDBConnection')) {
    function getDBConnection(): PDO
    {
        static $pdo = null;

        if ($pdo === null) {
            $host = 'localhost';
            $db   = 'course';
            $user = 'admin';
            $pass = 'password123';

            $dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";

            $pdo = new PDO($dsn, $user, $pass);
            $pdo->setAttribute(PDO::ATTR_ERRMODE,           PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        }

        return $pdo;
    }
}

define('DB_HOST', 'localhost');
define('DB_NAME', 'itcs333');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        DB_HOST, DB_NAME, DB_CHARSET
    );
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
        exit;
    }
    return $pdo;
}


function jsonResponse(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Get JSON body from request.
 */
function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Return current logged-in user from session, or null.
 */
function getSessionUser(): ?array {
    if (session_status() === PHP_SESSION_NONE) session_start();
    return $_SESSION['user'] ?? null;
}

/**
 * Require authentication; return user or send 401.
 */
function requireAuth(bool $adminOnly = false): array {
    $user = getSessionUser();
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Unauthorised. Please log in.'], 401);
    }
    if ($adminOnly && empty($user['is_admin'])) {
        jsonResponse(['success' => false, 'message' => 'Forbidden. Admin access required.'], 403);
    }
    return $user;
}

