<?php
// api/AuthController.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;
session_start();

class Database {
    private $conn;

    public function getConnection() {
        if ($this->conn) return $this->conn;

        try {
            $this->conn = new PDO(
                "mysql:host=localhost;dbname=classsync_db",
                "root",
                "",
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            $this->conn->exec("SET NAMES utf8");
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Connection error']);
            exit;
        }
        return $this->conn;
    }
}

class AuthController {
    private PDO $conn;
    private string $table = 'users';

    public function __construct(PDO $db) {
        $this->conn = $db;
    }

    private function input() {
        return json_decode(file_get_contents("php://input"), true) ?? [];
    }

    private function exists($field, $value) {
        $stmt = $this->conn->prepare("SELECT id FROM {$this->table} WHERE {$field} = :val");
        $stmt->execute([':val' => $value]);
        return $stmt->rowCount() > 0;
    }

    public function signup() {
        $d = $this->input();

        foreach (['email','password','role','firstName','middleName','surname'] as $f)
            if (empty($d[$f])) return ['success'=>false,'message'=>'Required fields missing'];

        if ($this->exists('email', $d['email']))
            return ['success'=>false,'message'=>'Email already registered'];

        if (!empty($d['studentId']) && $this->exists('student_id', $d['studentId']))
            return ['success'=>false,'message'=>'Student ID already registered'];

        if (in_array($d['role'], ['student','student_rep'])) {
            if (empty($d['year']) || empty($d['section']))
                return ['success'=>false,'message'=>'Year and section are required'];

            if ($d['role'] === 'student_rep' && empty($d['officerRole']))
                return ['success'=>false,'message'=>'Officer position required'];
        }

        $data = [
            'first_name'     => $d['firstName'],
            'middle_name'    => $d['middleName'],
            'surname'        => $d['surname'],
            'email'          => $d['email'],
            'secondary_email'=> $d['secondaryEmail'] ?? null,
            'student_id'     => $d['studentId'] ?? null,
            'password'       => password_hash($d['password'], PASSWORD_BCRYPT),
            'role'           => $d['role'],
            'year_level'     => $d['year'] ?? null,
            'section'        => $d['section'] ?? null,
            'officer_role'   => $d['officerRole'] ?? null
        ];

        $fields = implode(',', array_keys($data));
        $values = ':' . implode(',:', array_keys($data));

        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->table} ({$fields}) VALUES ({$values})"
        );

        return $stmt->execute($data)
            ? ['success'=>true,'message'=>'User registered successfully']
            : ['success'=>false,'message'=>'Registration failed'];
    }

    public function login() {
        $d = $this->input();
        if (empty($d['email']) || empty($d['password']))
            return ['success'=>false,'message'=>'Email and password required'];

        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE email = :email"
        );
        $stmt->execute([':email'=>$d['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($d['password'], $user['password']))
            return ['success'=>false,'message'=>'Invalid email or password'];

        unset($user['password']);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_data'] = $user;

        return [
            'success'=>true,
            'message'=>'Login successful',
            'user'=>$user,
            'role'=>$user['role']
        ];
    }

    public function session() {
        return isset($_SESSION['user_id'])
            ? ['loggedIn'=>true,'user'=>$_SESSION['user_data'],'role'=>$_SESSION['user_role']]
            : ['loggedIn'=>false];
    }

    public function logout() {
        session_unset();
        session_destroy();
        return ['success'=>true,'message'=>'Logged out successfully'];
    }

    public function updateProfile() {
        if (!isset($_SESSION['user_id']))
            return ['success'=>false,'message'=>'Not authenticated'];

        $d = $this->input();
        $role = $_SESSION['user_role'];

        $data = [
            'first_name'=>$d['firstName'],
            'middle_name'=>$d['middleName'],
            'surname'=>$d['surname']
        ];

        if (in_array($role,['student','student_rep'])) {
            $data['year_level'] = (int)$d['year'];
            $data['section'] = $d['section'];
            if ($role === 'student_rep')
                $data['officer_role'] = $d['officerRole'];
        }

        $set = implode(', ', array_map(fn($k)=>"$k=:$k", array_keys($data)));
        $data['id'] = $_SESSION['user_id'];

        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET {$set} WHERE id=:id"
        );

        if (!$stmt->execute($data))
            return ['success'=>false,'message'=>'Update failed'];

        $stmt = $this->conn->prepare(
            "SELECT id, first_name, middle_name, surname, email, secondary_email,
                    student_id, role, year_level, section, officer_role
             FROM {$this->table} WHERE id=:id"
        );
        $stmt->execute([':id'=>$_SESSION['user_id']]);
        $_SESSION['user_data'] = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'success'=>true,
            'message'=>'Profile updated successfully',
            'user'=>$_SESSION['user_data']
        ];
    }
}

$db = (new Database())->getConnection();
$auth = new AuthController($db);

$routes = [
    'signup' => 'signup',
    'login' => 'login',
    'session' => 'session',
    'logout' => 'logout',
    'update_profile' => 'updateProfile'
];

$action = $_GET['action'] ?? '';

echo json_encode(
    isset($routes[$action])
        ? $auth->{$routes[$action]}()
        : ['success'=>false,'message'=>'Invalid action']
);
