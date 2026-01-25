<?php

class Enrollment {
    private PDO $conn;
    private string $table = "course_enrollments";

    public function __construct(PDO $db) {
        $this->conn = $db;
    }

    public function enroll($course_id, $student_id) {
        if ($this->isEnrolled($course_id, $student_id)) return false;

        return $this->execute(
            "INSERT INTO {$this->table} (course_id, student_id)
             VALUES (:course_id, :student_id)",
            compact('course_id', 'student_id')
        );
    }

    public function enrollBatch($course_id, array $student_ids) {
        $count = 0;
        foreach ($student_ids as $student_id) {
            $count += (int) $this->enroll($course_id, $student_id);
        }
        return $count;
    }

    public function unenroll($course_id, $student_id) {
        return $this->execute(
            "DELETE FROM {$this->table}
             WHERE course_id = :course_id AND student_id = :student_id",
            compact('course_id', 'student_id')
        );
    }

    public function isEnrolled($course_id, $student_id) {
        $stmt = $this->query(
            "SELECT 1 FROM {$this->table}
             WHERE course_id = :course_id AND student_id = :student_id",
            compact('course_id', 'student_id')
        );
        return $stmt->rowCount() > 0;
    }

    public function getEnrollmentCount($course_id) {
        return $this->query(
            "SELECT COUNT(*) FROM {$this->table}
             WHERE course_id = :course_id",
            compact('course_id')
        )->fetchColumn();
    }

    public function getStudentsByYearSection($year_level, $section) {
        return $this->query(
            "SELECT id, first_name, middle_name, surname, student_id,
                    role, officer_role
             FROM users
             WHERE role IN ('student', 'student_rep')
               AND year_level = :year_level
               AND section = :section
             ORDER BY role DESC, surname ASC",
            compact('year_level', 'section')
        );
    }

    public function getAllStudents() {
        return $this->query(
            "SELECT id, first_name, middle_name, surname, student_id,
                    role, year_level, section, officer_role
             FROM users
             WHERE role IN ('student', 'student_rep')
             ORDER BY year_level ASC, section ASC, surname ASC"
        );
    }

    private function query($sql, array $params = []) {
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    private function execute($sql, array $params) {
        return $this->query($sql, $params)->rowCount() > 0;
    }
}
