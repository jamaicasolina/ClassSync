<?php

class Course {
    private $conn;
    private string $table = "courses";

    public function __construct($db) {
        $this->conn = $db;
    }

    private function sanitize(...$fields): array {
        return array_map(fn($v) => htmlspecialchars(strip_tags($v)), $fields);
    }

    private function execute(string $query, array $params = []) {
        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        return $stmt;
    }

    public function create($course_code, $course_name, $description, $professor_id, $year_level, $section) {
        [$course_code, $course_name, $description] = $this->sanitize(
            $course_code, $course_name, $description
        );

        return $this->execute(
            "INSERT INTO {$this->table}
             (course_code, course_name, description, professor_id, year_level, section)
             VALUES (:course_code, :course_name, :description, :professor_id, :year_level, :section)",
            compact(
                'course_code',
                'course_name',
                'description',
                'professor_id',
                'year_level',
                'section'
            )
        )->rowCount() > 0;
    }

    public function update($id, $course_code, $course_name, $description, $year_level, $section) {
        [$course_code, $course_name, $description] = $this->sanitize(
            $course_code, $course_name, $description
        );

        return $this->execute(
            "UPDATE {$this->table}
             SET course_code = :course_code,
                 course_name = :course_name,
                 description = :description,
                 year_level = :year_level,
                 section = :section
             WHERE id = :id",
            compact(
                'id',
                'course_code',
                'course_name',
                'description',
                'year_level',
                'section'
            )
        )->rowCount() > 0;
    }

    public function delete($id) {
        return $this->execute(
            "DELETE FROM {$this->table} WHERE id = :id",
            [':id' => $id]
        )->rowCount() > 0;
    }

    public function getByProfessor($professor_id) {
        return $this->execute(
            "SELECT c.*, COUNT(DISTINCT ce.student_id) AS enrolled_count
             FROM {$this->table} c
             LEFT JOIN course_enrollments ce ON c.id = ce.course_id
             WHERE c.professor_id = :professor_id
             GROUP BY c.id
             ORDER BY c.created_at DESC",
            [':professor_id' => $professor_id]
        );
    }

    public function getById($id) {
        return $this->execute(
            "SELECT c.*,
                    CONCAT(u.first_name, ' ', u.surname) AS professor_name,
                    COUNT(DISTINCT ce.student_id) AS enrolled_count
             FROM {$this->table} c
             LEFT JOIN users u ON c.professor_id = u.id
             LEFT JOIN course_enrollments ce ON c.id = ce.course_id
             WHERE c.id = :id
             GROUP BY c.id",
            [':id' => $id]
        );
    }

    public function getEnrolledStudents($course_id) {
        return $this->execute(
            "SELECT u.id, u.first_name, u.middle_name, u.surname,
                    u.student_id, u.role, u.year_level, u.section, u.officer_role,
                    ce.enrolled_at
             FROM users u
             INNER JOIN course_enrollments ce ON u.id = ce.student_id
             WHERE ce.course_id = :course_id
             ORDER BY u.role DESC, u.surname ASC",
            [':course_id' => $course_id]
        );
    }

    public function getByYearSection($year_level, $section) {
        return $this->execute(
            "SELECT c.*,
                    CONCAT(u.first_name, ' ', u.surname) AS professor_name,
                    COUNT(DISTINCT ce.student_id) AS enrolled_count
             FROM {$this->table} c
             LEFT JOIN users u ON c.professor_id = u.id
             LEFT JOIN course_enrollments ce ON c.id = ce.course_id
             WHERE c.year_level = :year_level AND c.section = :section
             GROUP BY c.id
             ORDER BY c.course_code ASC",
            compact('year_level', 'section')
        );
    }

    public function getByStudent($student_id) {
        return $this->execute(
            "SELECT c.*,
                    CONCAT(u.first_name, ' ', u.surname) AS professor_name,
                    ce.enrolled_at
             FROM {$this->table} c
             INNER JOIN course_enrollments ce ON c.id = ce.course_id
             LEFT JOIN users u ON c.professor_id = u.id
             WHERE ce.student_id = :student_id
             ORDER BY c.course_code ASC",
            [':student_id' => $student_id]
        );
    }
}
