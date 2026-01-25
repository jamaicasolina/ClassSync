<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

session_start();

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Schedule.php';

$db = (new Database())->getConnection();
$schedule = new Schedule($db);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$data   = json_decode(file_get_contents("php://input"), true) ?? [];

$fail = function ($code, $msg) {
    http_response_code($code);
    echo json_encode(["success"=>false,"message"=>$msg]);
    exit;
};

if (!isset($_SESSION['user_id'])) $fail(401,'Not authenticated');

$userId   = $_SESSION['user_id'];
$userRole = $_SESSION['user_role'];
$userData = $_SESSION['user_data'];

$require = fn($fields) =>
    array_filter($fields, fn($f)=>!isset($data[$f])) ? $fail(400,'Missing required fields') : null;

$room = fn() => !empty($data['room_id']) ? $data['room_id'] : null;

if ($method === 'POST' && $action === 'create') {
    if ($userRole !== 'professor') $fail(403,'Only professors can create schedules');
    $require(['course_id','day_of_week','start_time','end_time']);

    echo json_encode([
        "success"=>$schedule->create(
            $data['course_id'],
            $room(),
            $data['day_of_week'],
            $data['start_time'],
            $data['end_time']
        ),
        "message"=>"Schedule created successfully"
    ]);
    exit;
}

if ($method === 'POST' && $action === 'create_batch') {
    if ($userRole !== 'professor') $fail(403,'Only professors can create schedules');
    $require(['course_id','days','start_time','end_time']);

    $created = 0; $failed = [];
    foreach ($data['days'] as $day) {
        $schedule->create(
            $data['course_id'],
            $room(),
            $day,
            $data['start_time'],
            $data['end_time']
        ) ? $created++ : $failed[] = $day;
    }

    echo json_encode([
        "success"=>$created > 0,
        "message"=>"Created {$created} schedule(s)",
        "created_count"=>$created,
        "failed_days"=>$failed
    ]);
    exit;
}

if ($method === 'GET' && $action === 'get') {
    if (!isset($_GET['id'])) $fail(400,'Schedule ID required');
    $s = $schedule->getById($_GET['id']);
    $s ? print json_encode(["success"=>true,"schedule"=>$s])
       : $fail(404,'Schedule not found');
    exit;
}

if ($method === 'GET' && $action === 'by_course') {
    if (!isset($_GET['course_id'])) $fail(400,'Course ID required');
    echo json_encode([
        "success"=>true,
        "schedules"=>$schedule->getByCourse($_GET['course_id'])
            ->fetchAll(PDO::FETCH_ASSOC)
    ]);
    exit;
}

if ($method === 'GET' && $action === 'my_schedules') {
    if ($userRole !== 'professor') $fail(403,'Access denied');
    echo json_encode([
        "success"=>true,
        "schedules"=>$schedule->getByProfessor($userId)
            ->fetchAll(PDO::FETCH_ASSOC)
    ]);
    exit;
}

if ($method === 'GET' && $action === 'by_section') {
    if (in_array($userRole,['student','student_rep'])) {
        [$year,$section] = [$userData['year_level'],$userData['section']];
    } else {
        if (!isset($_GET['year_level'],$_GET['section']))
            $fail(400,'Year level and section required');
        [$year,$section] = [$_GET['year_level'],$_GET['section']];
    }

    echo json_encode([
        "success"=>true,
        "schedules"=>$schedule->getByYearSection($year,$section)
            ->fetchAll(PDO::FETCH_ASSOC)
    ]);
    exit;
}

if ($method === 'GET' && $action === 'my_student_schedules') {
    if (!in_array($userRole,['student','student_rep'])) $fail(403,'Access denied');
    echo json_encode([
        "success"=>true,
        "schedules"=>$schedule->getByStudentEnrollment($userId)
            ->fetchAll(PDO::FETCH_ASSOC)
    ]);
    exit;
}

if ($method === 'PUT' && $action === 'update') {
    if ($userRole !== 'professor') $fail(403,'Only professors can update schedules');
    $require(['id','day_of_week','start_time','end_time','reason']);

    echo json_encode([
        "success"=>$schedule->update(
            $data['id'],
            $room(),
            $data['day_of_week'],
            $data['start_time'],
            $data['end_time'],
            $data['reason'],
            $userId
        ),
        "message"=>"Schedule updated successfully"
    ]);
    exit;
}

if ($method === 'PUT' && $action === 'cancel') {
    if ($userRole !== 'professor') $fail(403,'Only professors can cancel schedules');
    $require(['id','reason']);

    echo json_encode([
        "success"=>$schedule->cancel($data['id'],$data['reason'],$userId),
        "message"=>"Schedule cancelled successfully"
    ]);
    exit;
}

if ($method === 'PUT' && $action === 'uncancel') {
    if ($userRole !== 'professor') $fail(403,'Only professors can uncancel schedules');
    $require(['id']);

    echo json_encode([
        "success"=>$schedule->uncancel($data['id']),
        "message"=>"Schedule uncancelled successfully"
    ]);
    exit;
}

if ($method === 'GET' && $action === 'changes') {
    if (!isset($_GET['schedule_id'])) $fail(400,'Schedule ID required');
    echo json_encode([
        "success"=>true,
        "changes"=>$schedule->getChanges($_GET['schedule_id'])
            ->fetchAll(PDO::FETCH_ASSOC)
    ]);
    exit;
}

if ($method === 'DELETE' && $action === 'delete') {
    if ($userRole !== 'professor') $fail(403,'Only professors can delete schedules');
    $require(['id']);

    echo json_encode([
        "success"=>$schedule->delete($data['id']),
        "message"=>"Schedule deleted successfully"
    ]);
    exit;
}

$fail(400,'Invalid action');
