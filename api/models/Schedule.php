<?php

class Schedule {
    private PDO $conn;
    private string $table = "schedules";

    public function __construct(PDO $db) {
        $this->conn = $db;
    }

    public function create($course_id, $room_id, $day, $start, $end) {
        $room_id = $this->normalizeRoom($room_id);
        $day = strtolower($day);

        if ($room_id && $this->hasConflict($room_id, $day, $start, $end)) return false;

        return $this->execute(
            "INSERT INTO {$this->table}
             (course_id, room_id, day_of_week, start_time, end_time)
             VALUES (:course_id, :room_id, :day, :start, :end)",
            compact('course_id', 'room_id', 'day', 'start', 'end')
        );
    }

    public function update($id, $room_id, $day, $start, $end, $reason, $changed_by) {
        $room_id = $this->normalizeRoom($room_id);
        $day = strtolower($day);

        $old = $this->getById($id);
        if (!$old) return false;

        if ($room_id && $this->hasConflict($room_id, $day, $start, $end, $id)) return false;

        if (!$this->execute(
            "UPDATE {$this->table}
             SET room_id = :room_id, day_of_week = :day,
                 start_time = :start, end_time = :end
             WHERE id = :id",
            compact('id', 'room_id', 'day', 'start', 'end')
        )) return false;

        return $this->logChange(
            $id,
            $old['start_time'], $old['end_time'],
            $start, $end,
            $reason, $changed_by
        );
    }

    public function cancel($id, $reason, $changed_by) {
        if (!$this->execute(
            "UPDATE {$this->table}
             SET is_cancelled = 1, cancellation_reason = :reason
             WHERE id = :id",
            compact('id', 'reason')
        )) return false;

        return $this->logChange($id, null, null, null, null, $reason, $changed_by);
    }

    public function uncancel($id) {
        return $this->execute(
            "UPDATE {$this->table}
             SET is_cancelled = 0, cancellation_reason = NULL
             WHERE id = :id",
            compact('id')
        );
    }

    public function delete($id) {
        return $this->execute(
            "DELETE FROM {$this->table} WHERE id = :id",
            compact('id')
        );
    }

    public function hasConflict($room_id, $day, $start, $end, $exclude_id = null) {
        if (!$room_id) return false;

        $sql = "SELECT 1 FROM {$this->table}
                WHERE room_id = :room_id
                  AND day_of_week = :day
                  AND is_cancelled = 0
                  AND start_time < :end
                  AND end_time > :start";

        if ($exclude_id) $sql .= " AND id != :exclude_id";

        $params = compact('room_id', 'day', 'start', 'end', 'exclude_id');
        return $this->query($sql, $params)->rowCount() > 0;
    }

    public function getById($id) {
        return $this->query(
            "SELECT s.*, c.course_name, c.course_code,
                    CONCAT(c.year_level,'-',c.section) AS section,
                    r.room_number, r.building,
                    CONCAT(u.first_name,' ',u.surname) AS professor_name
             FROM {$this->table} s
             JOIN courses c ON s.course_id = c.id
             LEFT JOIN rooms r ON s.room_id = r.id
             LEFT JOIN users u ON c.professor_id = u.id
             WHERE s.id = :id",
            compact('id')
        )->fetch(PDO::FETCH_ASSOC);
    }

    public function getByCourse($course_id) {
        return $this->orderedQuery(
            "SELECT s.*, r.room_number, r.building
             FROM {$this->table} s
             LEFT JOIN rooms r ON s.room_id = r.id
             WHERE s.course_id = :course_id",
            compact('course_id')
        );
    }

    public function getByProfessor($professor_id) {
        return $this->orderedQuery(
            "SELECT s.*, c.course_name, c.course_code,
                    CONCAT(c.year_level,'-',c.section) AS section,
                    r.room_number, r.building
             FROM {$this->table} s
             JOIN courses c ON s.course_id = c.id
             LEFT JOIN rooms r ON s.room_id = r.id
             WHERE c.professor_id = :professor_id",
            compact('professor_id')
        );
    }

    public function getByYearSection($year_level, $section) {
        return $this->orderedQuery(
            "SELECT s.*, c.course_name, c.course_code,
                    CONCAT(u.first_name,' ',u.surname) AS professor_name,
                    r.room_number, r.building
             FROM {$this->table} s
             JOIN courses c ON s.course_id = c.id
             LEFT JOIN users u ON c.professor_id = u.id
             LEFT JOIN rooms r ON s.room_id = r.id
             WHERE c.year_level = :year_level AND c.section = :section",
            compact('year_level', 'section')
        );
    }

    public function getByStudentEnrollment($student_id) {
        return $this->orderedQuery(
            "SELECT s.*, c.course_name, c.course_code,
                    CONCAT(u.first_name,' ',u.surname) AS professor_name,
                    r.room_number, r.building
             FROM {$this->table} s
             JOIN courses c ON s.course_id = c.id
             JOIN course_enrollments ce ON c.id = ce.course_id
             LEFT JOIN users u ON c.professor_id = u.id
             LEFT JOIN rooms r ON s.room_id = r.id
             WHERE ce.student_id = :student_id",
            compact('student_id')
        );
    }

    public function getChanges($schedule_id) {
        return $this->query(
            "SELECT sc.*, CONCAT(u.first_name,' ',u.surname) AS changed_by_name
             FROM schedule_changes sc
             LEFT JOIN users u ON sc.changed_by = u.id
             WHERE sc.schedule_id = :schedule_id
             ORDER BY sc.changed_at DESC",
            compact('schedule_id')
        );
    }

    private function normalizeRoom($room_id) {
        return empty($room_id) ? null : $room_id;
    }

    private function orderedQuery($sql, array $params) {
        $sql .= " ORDER BY FIELD(day_of_week,
                    'monday','tuesday','wednesday','thursday','friday','saturday'),
                    start_time";
        return $this->query($sql, $params);
    }

    private function logChange($id, $old_s, $old_e, $new_s, $new_e, $reason, $by) {
        return $this->execute(
            "INSERT INTO schedule_changes
             (schedule_id, old_start_time, old_end_time,
              new_start_time, new_end_time, reason, changed_by)
             VALUES (:id, :old_s, :old_e, :new_s, :new_e, :reason, :by)",
            compact('id', 'old_s', 'old_e', 'new_s', 'new_e', 'reason', 'by')
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
