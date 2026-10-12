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


// Get JSON data from JS
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {

    echo json_encode([
        "status" => "error",
        "message" => "Invalid data received."
    ]);

    exit();
}

// Get from values
$food_id = $data["food_id"] ?? null;
$meal_type = $data["meal_type"] ?? null;
$servings = $data["servings"] ?? null;


// Validate data
if (!$food_id || !$meal_type || !$servings) {

    echo json_encode([
        "status" => "error",
        "message" => "All meal information is required."
    ]);

    exit();
}

if (!in_array($meal_type, ["Breakfast", "Lunch", "Dinner"])) {

    echo json_encode([
        "status" => "error",
        "message" => "Invalid meal type."
    ]);

    exit();
}

if (!is_numeric($servings) || $servings <= 0) {

    echo json_encode([
        "status" => "error",
        "message" => "Invalid serving amount."
    ]);

    exit();
}


// Check that food exists
$foodCheckSQL = "SELECT food_id FROM food WHERE food_id = ?";
$foodCheck = $conn->prepare($foodCheckSQL);
$foodCheck->bind_param("i", $food_id);
$foodCheck->execute();
$foodResult = $foodCheck->get_result();

if ($foodResult->num_rows === 0) {

    echo json_encode([
        "status" => "error",
        "message" => "Selected food does not exist."
    ]);

    exit();
}


// Insert foodlog
$log_date = date("Y-m-d");

$insertSQL = "INSERT INTO food_log
              (user_id, food_id, meal_type, servings, log_date)
              VALUES (?, ?, ?, ?, ?)";

$insert = $conn->prepare($insertSQL);

$insert->bind_param(
    "iisds",
    $user_id,
    $food_id,
    $meal_type,
    $servings,
    $log_date
);

if (!$insert->execute()) {

    echo json_encode([
        "status" => "error",
        "message" => "Failed to add food to daily log."
    ]);

    exit();
}


// Success response
echo json_encode([
    "status" => "success",
    "message" => "Food added to daily log successfully.",
    "food_log_id" => $insert->insert_id
]);

?>