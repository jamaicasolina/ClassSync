<?php

class Database {
    private $host = "localhost";        // Usually localhost
    private $db_name = "classsync_db"; // Database name we created
    private $username = "root";         // Default XAMPP username
    private $password = "";             // Default XAMPP password is empty
    public $conn;

    /**
     * Get database connection
     * @return PDO connection object
     */
    public function getConnection() {
        $this->conn = null;

        try {
            // Create PDO connection
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            
            // Set character encoding
            $this->conn->exec("set names utf8mb4");
            
            // Set error mode
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?>