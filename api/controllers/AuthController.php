<?php
// api/AuthController.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

// Database configuration
class Database {
    private $host = "localhost";
    private $db_name = "classsync_db";
    private $username = "root";
    private $password = "";
    private $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage()
            ]);
            exit;
        }
        return $this->conn;
    }
}

// Auth Controller
class AuthController {
    private $conn;
    private $table = "users";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Signup
    public function signup($data) {
        try {
            // Validate required fields
            if (empty($data['email']) || empty($data['password']) || empty($data['role'])) {
                return [
                    'success' => false,
                    'message' => 'Email, password, and role are required'
                ];
            }

            // Validate first name, middle name, and surname
            if (empty($data['firstName']) || empty($data['middleName']) || empty($data['surname'])) {
                return [
                    'success' => false,
                    'message' => 'First name, middle name, and surname are required'
                ];
            }

            // Check if email already exists
            $query = "SELECT id FROM " . $this->table . " WHERE email = :email";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':email', $data['email']);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return [
                    'success' => false,
                    'message' => 'Email already registered'
                ];
            }

            // Check if student ID already exists (if provided)
            if (!empty($data['studentId'])) {
                $query = "SELECT id FROM " . $this->table . " WHERE student_id = :student_id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':student_id', $data['studentId']);
                $stmt->execute();

                if ($stmt->rowCount() > 0) {
                    return [
                        'success' => false,
                        'message' => 'Student ID already registered'
                    ];
                }
            }

            // Validate student/student_rep specific fields
            if (in_array($data['role'], ['student', 'student_rep'])) {
                if (empty($data['year']) || empty($data['section'])) {
                    return [
                        'success' => false,
                        'message' => 'Year and section are required for students'
                    ];
                }

                if ($data['role'] === 'student_rep' && empty($data['officerRole'])) {
                    return [
                        'success' => false,
                        'message' => 'Officer position is required for student representatives'
                    ];
                }
            }

            // Prepare values
            $firstName = $data['firstName'];
            $middleName = $data['middleName'];
            $surname = $data['surname'];
            $email = $data['email'];
            $secondaryEmail = !empty($data['secondaryEmail']) ? $data['secondaryEmail'] : null;
            $studentId = !empty($data['studentId']) ? $data['studentId'] : null;
            $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
            $role = $data['role'];
            $yearLevel = null;
            $section = null;
            $officerRole = null;

            // Set student-specific fields
            if (in_array($data['role'], ['student', 'student_rep'])) {
                $yearLevel = (int)$data['year'];
                $section = $data['section'];
                
                if ($data['role'] === 'student_rep') {
                    $officerRole = $data['officerRole'];
                }
            }

            // Insert user
            $query = "INSERT INTO " . $this->table . " 
                     (first_name, middle_name, surname, email, secondary_email, student_id, 
                      password, role, year_level, section, officer_role) 
                     VALUES 
                     (:first_name, :middle_name, :surname, :email, :secondary_email, :student_id, 
                      :password, :role, :year_level, :section, :officer_role)";

            $stmt = $this->conn->prepare($query);

            // Bind values
            $stmt->bindParam(':first_name', $firstName);
            $stmt->bindParam(':middle_name', $middleName);
            $stmt->bindParam(':surname', $surname);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':secondary_email', $secondaryEmail);
            $stmt->bindParam(':student_id', $studentId);
            $stmt->bindParam(':password', $hashedPassword);
            $stmt->bindParam(':role', $role);
            $stmt->bindParam(':year_level', $yearLevel);
            $stmt->bindParam(':section', $section);
            $stmt->bindParam(':officer_role', $officerRole);

            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'User registered successfully'
                ];
            }

            return [
                'success' => false,
                'message' => 'Unable to register user'
            ];

        } catch(PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    // Login
    public function login($data) {
        try {
            if (empty($data['email']) || empty($data['password'])) {
                return [
                    'success' => false,
                    'message' => 'Email and password are required'
                ];
            }

            $query = "SELECT id, first_name, middle_name, surname, email, secondary_email, 
                            student_id, password, role, year_level, section, officer_role 
                     FROM " . $this->table . " 
                     WHERE email = :email";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':email', $data['email']);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                return [
                    'success' => false,
                    'message' => 'Invalid email or password'
                ];
            }

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Verify password
            if (!password_verify($data['password'], $user['password'])) {
                return [
                    'success' => false,
                    'message' => 'Invalid email or password'
                ];
            }

            // Remove password from response
            unset($user['password']);

            // Store in session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['user_data'] = $user;

            return [
                'success' => true,
                'message' => 'Login successful',
                'user' => $user,
                'role' => $user['role']
            ];

        } catch(PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    // Get session
    public function getSession() {
        if (isset($_SESSION['user_id']) && isset($_SESSION['user_data'])) {
            return [
                'loggedIn' => true,
                'user' => $_SESSION['user_data'],
                'role' => $_SESSION['user_role']
            ];
        }

        return [
            'loggedIn' => false
        ];
    }

    // Logout
    public function logout() {
        session_unset();
        session_destroy();
        return [
            'success' => true,
            'message' => 'Logged out successfully'
        ];
    }

    // Update profile
    public function updateProfile($data) {
        try {
            if (!isset($_SESSION['user_id'])) {
                return [
                    'success' => false,
                    'message' => 'Not authenticated'
                ];
            }

            $userId = $_SESSION['user_id'];
            $role = $_SESSION['user_role'];

            // Build dynamic update query based on role
            $params = [
                ':first_name' => $data['firstName'],
                ':middle_name' => $data['middleName'],
                ':surname' => $data['surname'],
                ':id' => $userId
            ];

            $setParts = [
                'first_name = :first_name',
                'middle_name = :middle_name',
                'surname = :surname'
            ];

            if (in_array($role, ['student', 'student_rep'])) {
                $setParts[] = 'year_level = :year_level';
                $setParts[] = 'section = :section';
                $params[':year_level'] = (int)$data['year'];
                $params[':section'] = $data['section'];

                if ($role === 'student_rep') {
                    $setParts[] = 'officer_role = :officer_role';
                    $params[':officer_role'] = $data['officerRole'];
                }
            }

            $query = "UPDATE " . $this->table . " SET " . implode(', ', $setParts) . " WHERE id = :id";

            $stmt = $this->conn->prepare($query);
            
            if ($stmt->execute($params)) {
                // Fetch updated user data
                $query = "SELECT id, first_name, middle_name, surname, email, secondary_email, 
                                student_id, role, year_level, section, officer_role 
                         FROM " . $this->table . " WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':id', $userId);
                $stmt->execute();
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                // Update session
                $_SESSION['user_data'] = $user;

                return [
                    'success' => true,
                    'message' => 'Profile updated successfully',
                    'user' => $user
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to update profile'
            ];

        } catch(PDOException $e) {
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
}

// Router
$database = new Database();
$db = $database->getConnection();
$controller = new AuthController($db);

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'signup':
        $data = json_decode(file_get_contents("php://input"), true);
        echo json_encode($controller->signup($data));
        break;

    case 'login':
        $data = json_decode(file_get_contents("php://input"), true);
        echo json_encode($controller->login($data));
        break;

    case 'session':
        echo json_encode($controller->getSession());
        break;

    case 'logout':
        echo json_encode($controller->logout());
        break;

    case 'update_profile':
        $data = json_decode(file_get_contents("php://input"), true);
        echo json_encode($controller->updateProfile($data));
        break;

    default:
        echo json_encode([
            'success' => false,
            'message' => 'Invalid action'
        ]);
        break;
}
?>