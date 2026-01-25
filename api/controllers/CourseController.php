<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/course_controller_error.log');

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

try {
    session_start();

    /* -------------------- Helpers -------------------- */

    function respond($code, $data) {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }

    function requireFields($source, ...$fields) {
        foreach ($fields as $field) {
            if (!isset($source[$field])) {
                respond(400, ["success" => false, "message" => "Missing required fields"]);
            }
        }
    }

    function requireRole($role) {
        if ($_SESSION['user_role'] !== $role) {
            respond(403, ["success" => false, "message" => "Access denied"]);
        }
    }

    function requireAnyRole(array $roles) {
        if (!in_array($_SESSION['user_role'], $roles)) {
            respond(403, ["success" => false, "message" => "Access denied"]);
        }
    }

    /* -------------------- Bootstrap -------------------- */

    foreach ([
        'database'   => __DIR__ . '/../config/database.php',
        'course'     => __DIR__ . '/../models/Course.php',
        'enrollment' => __DIR__ . '/../models/Enrollment.php'
    ] as $name => $path) {
        if (!file_exists($path)) {
            throw new Exception(ucfirst($name) . " not found at: {$path}");
        }
        require_once $path;
    }

    if (!isset($_SESSION['user_id'])) {
        respond(401, ["success" => false, "message" => "Not authenticated"]);
    }

    $db = (new Database())->getConnection();
    if (!$db) throw new Exception("Database connection failed");

    $course     = new Course($db);
    $enrollment = new Enrollment($db);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;
    $data   = json_decode(file_get_contents("php://input"), true) ?? [];

    $user_id   = $_SESSION['user_id'];
    $user_role = $_SESSION['user_role'];

    /* -------------------- ROUTES -------------------- */

    if ($method === 'POST' && $action === 'create') {
        requireRole('professor');
        requireFields($data, 'course_code', 'course_name', 'year_level', 'section');

        $success = $course->create(
            $data['course_code'],
            $data['course_name'],
            $data['description'] ?? '',
            $user_id,
            $data['year_level'],
            $data['section']
        );

        respond($success ? 200 : 500, [
            "success" => $success,
            "message" => $success
                ? "Course created successfully"
                : "Failed to create course"
        ]);
    }

    if ($method === 'GET' && $action === 'my_courses') {
        requireRole('professor');
        respond(200, [
            "success" => true,
            "courses" => $course->getByProfessor($user_id)->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    if ($method === 'GET' && $action === 'get') {
        requireFields($_GET, 'id');
        $courseData = $course->getById($_GET['id'])->fetch(PDO::FETCH_ASSOC);

        respond($courseData ? 200 : 404, [
            "success" => (bool) $courseData,
            "course"  => $courseData,
            "message" => $courseData ? null : "Course not found"
        ]);
    }

    if ($method === 'GET' && $action === 'enrolled_students') {
        requireFields($_GET, 'course_id');
        respond(200, [
            "success"  => true,
            "students" => $course
                ->getEnrolledStudents($_GET['course_id'])
                ->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    if ($method === 'GET' && $action === 'by_section') {
        requireFields($_GET, 'year_level', 'section');
        respond(200, [
            "success" => true,
            "courses" => $course
                ->getByYearSection($_GET['year_level'], $_GET['section'])
                ->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    if ($method === 'GET' && $action === 'my_enrolled') {
        requireAnyRole(['student', 'student_rep']);
        respond(200, [
            "success" => true,
            "courses" => $course
                ->getByStudent($user_id)
                ->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    if ($method === 'PUT' && $action === 'update') {
        requireRole('professor');
        requireFields($data, 'id', 'course_code', 'course_name', 'year_level', 'section');

        $success = $course->update(
            $data['id'],
            $data['course_code'],
            $data['course_name'],
            $data['description'] ?? '',
            $data['year_level'],
            $data['section']
        );

        respond($success ? 200 : 500, [
            "success" => $success,
            "message" => $success
                ? "Course updated successfully"
                : "Failed to update course"
        ]);
    }

    if ($method === 'DELETE' && $action === 'delete') {
        requireRole('professor');
        requireFields($data, 'id');

        $success = $course->delete($data['id']);
        respond($success ? 200 : 500, [
            "success" => $success,
            "message" => $success
                ? "Course deleted successfully"
                : "Failed to delete course"
        ]);
    }

    respond(400, [
        "success" => false,
        "message" => "Invalid action: {$action}"
    ]);

} catch (Exception $e) {
    respond(500, [
        "success" => false,
        "message" => "Server error: " . $e->getMessage(),
        "file" => $e->getFile(),
        "line" => $e->getLine()
    ]);
}
