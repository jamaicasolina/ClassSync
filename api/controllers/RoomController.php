<?php
header("Content-Type: application/json");
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Room.php';

$database = new Database();
$db = $database->getConnection();
$room = new Room($db);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$data = json_decode(file_get_contents("php://input"), true);

$action = $_GET['action'] ?? null;

if ($method === 'GET' && $action === 'student-availability') {

    $query = "
        SELECT
            r.id,
            r.room_number,
            r.building,
            r.capacity,
            r.status,

            CONCAT(u.first_name, ' ', u.surname) AS professor,
            CONCAT(c.year_level, '-', c.section) AS section,
            CONCAT(
                TIME_FORMAT(s.start_time, '%h:%i %p'),
                ' - ',
                TIME_FORMAT(s.end_time, '%h:%i %p')
            ) AS schedule_time

        FROM rooms r
        LEFT JOIN schedules s
            ON r.id = s.room_id
            AND s.day_of_week = LOWER(DAYNAME(CURDATE()))
            AND CURTIME() BETWEEN s.start_time AND s.end_time
            AND s.is_cancelled = 0

        LEFT JOIN courses c ON s.course_id = c.id
        LEFT JOIN users u ON c.professor_id = u.id
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();

    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($method === 'GET') {
    $stmt = $room->getAllWithCurrentSchedule();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if ($method === 'PUT') {
    if (!isset($data['id'], $data['status'])) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid input"]);
        exit;
    }

    $room->updateStatus($data['id'], $data['status']);
    echo json_encode(["message" => "Status updated"]);
    exit;
}

if ($method === 'POST') {
    if (!isset($data['room_number'], $data['building'], $data['capacity'])) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid input"]);
        exit;
    }

    $room->create(
        $data['room_number'],
        $data['building'],
        $data['capacity']
    );

    echo json_encode(["message" => "Room created"]);
    exit;
}

if ($method === 'PATCH') {
    if (!isset($data['id'], $data['room_number'], $data['building'], $data['capacity'])) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid input"]);
        exit;
    }

    $room->update(
        $data['id'],
        $data['room_number'],
        $data['building'],
        $data['capacity']
    );

    echo json_encode(["message" => "Room updated"]);
    exit;
}

if ($method === 'DELETE') {
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid input"]);
        exit;
    }

    $room->delete($data['id']);
    echo json_encode(["message" => "Room deleted"]);
    exit;
}

http_response_code(405);
echo json_encode(["message" => "Method not allowed"]);