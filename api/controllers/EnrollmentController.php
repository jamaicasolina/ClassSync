<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

session_start();

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Enrollment.php';
require_once __DIR__ . '/../models/Course.php';

function respond($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function requireFields($source, ...$fields) {
    foreach ($fields as $field) {
        if (!isset($source[$field])) {
            respond(400, ["success" => false, "message" => ucfirst(str_replace('_',' ', $field)) . " required"]);
        }
    }
}

if (!isset($_SESSION['user_id'])) {
    respond(401, ["success" => false, "message" => "Not authenticated"]);
}

$user_id   = $_SESSION['user_id'];
$user_role = $_SESSION['user_role'];

$database   = new Database();
$db         = $database->getConnection();
$enrollment = new Enrollment($db);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$data   = json_decode(file_get_contents("php://input"), true) ?? [];

if ($method === 'POST' && $action === 'enroll') {
    requireFields($data, 'course_id');
    $course_id = $data['course_id'];

    if ($user_role === 'student') {
        $success = $enrollment->enroll($course_id, $user_id);
        respond(200, [
            "success" => $success,
            "message" => $success
                ? "Successfully enrolled in course"
                : "Already enrolled or enrollment failed"
        ]);
    }

    if (in_array($user_role, ['professor', 'student_rep'])) {
        requireFields($data, 'student_ids');
        if (!is_array($data['student_ids'])) {
            respond(400, ["success" => false, "message" => "Student IDs array required"]);
        }

        $count = $enrollment->enrollBatch($course_id, $data['student_ids']);
        respond(200, [
            "success" => true,
            "message" => "Enrolled {$count} student(s) successfully",
            "enrolled_count" => $count
        ]);
    }

    respond(403, ["success" => false, "message" => "Access denied"]);
}

if ($method === 'GET' && $action === 'check') {
    requireFields($_GET, 'course_id', 'student_id');
    respond(200, [
        "success" => true,
        "is_enrolled" => $enrollment->isEnrolled($_GET['course_id'], $_GET['student_id'])
    ]);
}

if ($method === 'GET' && $action === 'students_by_section') {
    requireFields($_GET, 'year_level', 'section');
    $students = $enrollment
        ->getStudentsByYearSection($_GET['year_level'], $_GET['section'])
        ->fetchAll(PDO::FETCH_ASSOC);

    respond(200, ["success" => true, "students" => $students]);
}

if ($method === 'GET' && $action === 'all_students') {
    if ($user_role !== 'professor') {
        respond(403, ["success" => false, "message" => "Access denied"]);
    }

    $students = $enrollment
        ->getAllStudents()
        ->fetchAll(PDO::FETCH_ASSOC);

    respond(200, ["success" => true, "students" => $students]);
}

if ($method === 'GET' && $action === 'count') {
    requireFields($_GET, 'course_id');
    respond(200, [
        "success" => true,
        "count" => $enrollment->getEnrollmentCount($_GET['course_id'])
    ]);
}

if ($method === 'DELETE' && $action === 'unenroll') {
    requireFields($data, 'course_id');

    if ($user_role === 'student') {
        $student_id = $user_id;
    } elseif (in_array($user_role, ['professor', 'student_rep'])) {
        requireFields($data, 'student_id');
        $student_id = $data['student_id'];
    } else {
        respond(403, ["success" => false, "message" => "Access denied"]);
    }

    $success = $enrollment->unenroll($data['course_id'], $student_id);
    respond(
        $success ? 200 : 500,
        [
            "success" => $success,
            "message" => $success ? "Successfully unenrolled" : "Unenrollment failed"
        ]
    );
}

respond(400, ["success" => false, "message" => "Invalid action"]);
