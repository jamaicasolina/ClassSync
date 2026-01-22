<?php
/**
 * User Model
 * Handles all user-related database operations
 */

class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $firstName;
    public $middleName;
    public $surname;
    public $email;
    public $secondaryEmail;
    public $studentId;
    public $password;
    public $role;
    public $year;
    public $section;
    public $officerRole;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create new user
     */
    public function create() {
        $query = "INSERT INTO {$this->table_name}
            (id, firstName, middleName, surname, email, secondaryEmail, studentId,
             password, role, year, section, officerRole)
            VALUES
            (:id, :firstName, :middleName, :surname, :email, :secondaryEmail,
             :studentId, :password, :role, :year, :section, :officerRole)";

        $stmt = $this->conn->prepare($query);

        return $stmt->execute([
            ':id' => $this->id,
            ':firstName' => $this->firstName,
            ':middleName' => $this->middleName,
            ':surname' => $this->surname,
            ':email' => $this->email,
            ':secondaryEmail' => $this->secondaryEmail,
            ':studentId' => $this->studentId,
            ':password' => $this->password,
            ':role' => $this->role,
            ':year' => $this->year,
            ':section' => $this->section,
            ':officerRole' => $this->officerRole
        ]);
    }

    /**
     * Check email existence
     */
    public function emailExists() {
        $query = "SELECT id FROM {$this->table_name}
                  WHERE email = :email OR secondaryEmail = :email
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([':email' => $this->email]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Check student ID existence
     */
    public function studentIdExists() {
        $query = "SELECT id FROM {$this->table_name}
                  WHERE studentId = :studentId
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([':studentId' => $this->studentId]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Login using password hash
     */
    public function login() {
        $query = "SELECT * FROM {$this->table_name}
                  WHERE email = :email OR secondaryEmail = :email
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([':email' => $this->email]);

        if ($stmt->rowCount() === 0) {
            return false;
        }

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (password_verify($this->password, $user['password'])) {
            unset($user['password']); // security
            return $user;
        }

        return false;
    }
}
