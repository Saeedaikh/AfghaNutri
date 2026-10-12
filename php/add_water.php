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


// Get water amount
$amount_liters = $data["amount_liters"] ?? null;


// Validate water amount
if ($amount_liters === null ||!is_numeric($amount_liters)) {

    echo json_encode([
        "status" => "error",
        "message" => "Invalid water amount."
    ]);
    exit();
}

$amount_liters = (float)$amount_liters;

// Get today's date
$today = date("Y-m-d");


// Insert waterlog
$insertSQL = "INSERT INTO water_log
              (user_id, amount_liters, water_log_date)
              VALUES (?, ?, ?)";

$insertStmt = $conn->prepare($insertSQL);
$insertStmt->bind_param(
    "ids",
    $user_id,
    $amount_liters,
    $today
);

if (!$insertStmt->execute()) {

    echo json_encode([
        "status" => "error",
        "message" => "Failed to save water intake."
    ]);
    exit();
}


// Success response
echo json_encode([
    "status" => "success",
    "message" => "Water intake added successfully.",
    "amount_liters" => $amount_liters
]);

?>
