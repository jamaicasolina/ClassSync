<?php
// api/config.php
// Database configuration file

define('DB_HOST', 'localhost');
define('DB_NAME', 'classsync_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// API Base URL
define('API_BASE_URL', 'http://localhost/classsync/api');

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Set to 1 if using HTTPS

// Timezone
date_default_timezone_set('Asia/Manila');

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);
?>