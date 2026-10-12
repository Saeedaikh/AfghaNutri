<?php

session_start();

require_once "../config/database.php";

header("Content-Type: application/json");


// Check login
if (!isset($_SESSION["user_id"])) {

    echo json_encode([
        "status" => "error",
        "message" => "User is not logged in."
    ]);
    exit();
}


// Only allow post requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    echo json_encode([
        "status" => "error",
        "message" => "Invalid request method."
    ]);
    exit();
}


// Get user ID
$user_id = $_SESSION["user_id"];


// Get Json data
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {

    echo json_encode([
        "status" => "error",
        "message" => "Invalid data received."
    ]);
    exit();
}


// Get foodlog ID
$food_log_id = $data["food_log_id"] ?? null;


// Validate foodlog ID
if (!$food_log_id || !is_numeric($food_log_id)) {

    echo json_encode([
        "status" => "error",
        "message" => "Invalid food log ID."
    ]);
    exit();
}


// Delete foodlog
$deleteSQL = "DELETE FROM food_log
              WHERE food_log_id = ?
              AND user_id = ?";

$deleteStmt = $conn->prepare($deleteSQL);

$deleteStmt->bind_param(
    "ii",
    $food_log_id,
    $user_id
);

if (!$deleteStmt->execute()) {

    echo json_encode([
        "status" => "error",
        "message" => "Failed to delete food log."
    ]);
    exit();
}


// Check if foodlog existed
if ($deleteStmt->affected_rows === 0) {

    echo json_encode([
        "status" => "error",
        "message" => "Food log entry was not found."
    ]);
    exit();
}


// Success response
echo json_encode([
    "status" => "success",
    "message" => "Food log deleted successfully."
]);

?>