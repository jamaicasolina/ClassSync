<?php

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

    public function create() {
        $query = "INSERT INTO {$this->table_name}
            (id, firstName, middleName, surname, email, secondaryEmail, studentId,
             password, role, year, section, officerRole)
            VALUES
            (:id, :firstName, :middleName, :surname, :email, :secondaryEmail, :studentId,
             :password, :role, :year, :section, :officerRole)";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->id = htmlspecialchars(strip_tags($this->id));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->role = htmlspecialchars(strip_tags($this->role));

        // HASH PASSWORD
        $hashedPassword = password_hash($this->password, PASSWORD_DEFAULT);

        // Bind
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":firstName", $this->firstName);
        $stmt->bindParam(":middleName", $this->middleName);
        $stmt->bindParam(":surname", $this->surname);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":secondaryEmail", $this->secondaryEmail);
        $stmt->bindParam(":studentId", $this->studentId);
        $stmt->bindParam(":password", $hashedPassword);
        $stmt->bindParam(":role", $this->role);
        $stmt->bindParam(":year", $this->year);
        $stmt->bindParam(":section", $this->section);
        $stmt->bindParam(":officerRole", $this->officerRole);

        return $stmt->execute();
    }
}
