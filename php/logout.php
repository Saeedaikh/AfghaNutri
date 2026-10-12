<?php

session_start();

// Destroy the session
$_SESSION = [];

session_destroy();

header("Content-Type: application/json");

echo json_encode([
    "status" => "success",
    "message" => "Logged out successfully."
]);

?>