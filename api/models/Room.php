<?php

class Room {
    private $conn;
    private $table = "rooms";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAllWithCurrentSchedule() {
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
        return $this->conn->query($query);
    }

    public function updateStatus($id, $status) {
        $stmt = $this->conn->prepare("UPDATE rooms SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }

    public function create($room_number, $building, $capacity) {
        $stmt = $this->conn->prepare(
            "INSERT INTO rooms (room_number, building, capacity, status)
             VALUES (?, ?, ?, 'available')"
        );
        return $stmt->execute([$room_number, $building, $capacity]);
    }

    public function update($id, $room_number, $building, $capacity) {
        $stmt = $this->conn->prepare(
            "UPDATE rooms SET room_number=?, building=?, capacity=? WHERE id=?"
        );
        return $stmt->execute([$room_number, $building, $capacity, $id]);
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM rooms WHERE id=?");
        return $stmt->execute([$id]);
    }
}
