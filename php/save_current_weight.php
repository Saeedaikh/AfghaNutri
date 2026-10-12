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


// Get json data
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {

    echo json_encode([
        "status" => "error",
        "message" => "Invalid data received."
    ]);
    exit();
}


// Get current weight
$current_weight = $data["current_weight"] ?? null;


// Validate weight
if ($current_weight === null ||!is_numeric($current_weight)) {

    echo json_encode([
        "status" => "error",
        "message" => "Please enter a valid weight."
    ]);
    exit();
}

$current_weight = (float)$current_weight;


// Validate weight range
if ($current_weight < 30 || $current_weight > 250) {

    echo json_encode([
        "status" => "error",
        "message" => "Weight must be between 30 and 250 kg."
    ]);
    exit();
}


// Get today's date
$record_date = date("Y-m-d");


// Insert weight
$insertSQL = "INSERT INTO weight_log
              (user_id, current_weight, record_date)
              VALUES (?, ?, ?)";

$insertStmt = $conn->prepare($insertSQL);

$insertStmt->bind_param(
    "ids",
    $user_id,
    $current_weight,
    $record_date
);


if (!$insertStmt->execute()) {

    echo json_encode([
        "status" => "error",
        "message" => "Failed to save weight."
    ]);
    exit();
}


// Success response
echo json_encode([
    "status" => "success",
    "message" => "Weight saved successfully.",
    "weight_id" => $insertStmt->insert_id,
    "current_weight" => $current_weight,
    "record_date" => $record_date
]);

?>