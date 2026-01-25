<?php
/**
 * Diagnostic script to test file structure
 * Place this in: api/controllers/test_setup.php
 * Access via: http://localhost/FINAL_PROJECT/ClassSync/api/controllers/test_setup.php
 */

header("Content-Type: application/json");

$results = [
    "current_directory" => __DIR__,
    "files_checked" => [],
    "database_test" => null,
    "session_test" => null
];

// Check file existence
$files_to_check = [
    "database_config" => __DIR__ . '/../../config/database.php',
    "course_model" => __DIR__ . '/../models/Course.php',
    "enrollment_model" => __DIR__ . '/../models/Enrollment.php',
    "schedule_model" => __DIR__ . '/../models/Schedule.php',
    "course_controller" => __DIR__ . '/CourseController.php',
    "enrollment_controller" => __DIR__ . '/EnrollmentController.php',
    "schedule_controller" => __DIR__ . '/ScheduleController.php'
];

foreach ($files_to_check as $name => $path) {
    $results["files_checked"][$name] = [
        "path" => $path,
        "exists" => file_exists($path),
        "readable" => file_exists($path) ? is_readable($path) : false
    ];
}

// Test database connection
try {
    require_once __DIR__ . '/../../config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        $results["database_test"] = [
            "status" => "success",
            "message" => "Database connection successful"
        ];
        
        // Test query
        $stmt = $db->query("SELECT COUNT(*) as count FROM users");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $results["database_test"]["user_count"] = $row['count'];
    } else {
        $results["database_test"] = [
            "status" => "failed",
            "message" => "Database connection returned null"
        ];
    }
} catch (Exception $e) {
    $results["database_test"] = [
        "status" => "error",
        "message" => $e->getMessage()
    ];
}

// Test session
session_start();
$results["session_test"] = [
    "session_started" => true,
    "user_logged_in" => isset($_SESSION['user_id']),
    "user_id" => $_SESSION['user_id'] ?? null,
    "user_role" => $_SESSION['user_role'] ?? null
];

echo json_encode($results, JSON_PRETTY_PRINT);
?>