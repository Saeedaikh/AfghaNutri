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


// Get user ID
$user_id = $_SESSION["user_id"];


// Get JSON data
$data = json_decode(file_get_contents("php://input"), true);


// Check required data
if (
    !isset($data["exercise_id"]) ||
    !isset($data["duration_minutes"]) ||
    !isset($data["intensity"])
) {
    echo json_encode([
        "status" => "error",
        "message" => "Missing activity information."
    ]);
    exit();
}


// Get submitted values
$exercise_id = (int) $data["exercise_id"];
$duration_minutes = (int) $data["duration_minutes"];
$intensity = $data["intensity"];


// Validate duration
if ($duration_minutes <= 0) {

    echo json_encode([
        "status" => "error",
        "message" => "Duration must be greater than 0 minutes."
    ]);
    exit();
}


// Validate intensity
$valid_intensities = ["light", "moderate", "vigorous"];

if (!in_array($intensity, $valid_intensities)) {

    echo json_encode([
        "status" => "error",
        "message" => "Invalid intensity level."
    ]);
    exit();
}


// Get exercise MET value
$exerciseSQL = "SELECT met_value
                FROM exercise
                WHERE exercise_id = ? AND intensity = ?";

$exerciseStatement = $conn->prepare($exerciseSQL);
$exerciseStatement->bind_param(
    "is",
    $exercise_id,
    $intensity
);

$exerciseStatement->execute();
$exerciseResult = $exerciseStatement->get_result();


// Check exercise
if ($exerciseResult->num_rows === 0) {

    echo json_encode([
        "status" => "error",
        "message" => "Selected exercise was not found."
    ]);
    exit();
}

$exercise = $exerciseResult->fetch_assoc();
$met_value = (float) $exercise["met_value"];


// Get user's latest weight
$weightSQL = "SELECT current_weight
              FROM weight_log
              WHERE user_id = ?
              ORDER BY record_date DESC
              LIMIT 1";

$weightStatement = $conn->prepare($weightSQL);
$weightStatement->bind_param(
    "i",
    $user_id
);

$weightStatement->execute();
$weightResult = $weightStatement->get_result();


// Check weight
if ($weightResult->num_rows === 0) {

    echo json_encode([
        "status" => "error",
        "message" => "Please record your current weight before logging an activity."
    ]);
    exit();
}

$weightRow = $weightResult->fetch_assoc();
$weight = (float) $weightRow["current_weight"];


// Calculate calories burned
$calories_burned = ( $met_value * 3.5 * $weight / 200) * $duration_minutes;
$calories_burned = round($calories_burned);


// Get today's date
$activity_date = date("Y-m-d");


// Insert activity
$insertSQL = "INSERT INTO activity_log
              (
                  user_id,
                  exercise_id,
                  duration_minutes,
                  calories_burned,
                  activity_date,
                  intensity
              )
              VALUES (?, ?, ?, ?, ?, ?)";

$insertStatement = $conn->prepare($insertSQL);
$insertStatement->bind_param(
    "iiiiss",
    $user_id,
    $exercise_id,
    $duration_minutes,
    $calories_burned,
    $activity_date,
    $intensity
);


// Save activity
if (!$insertStatement->execute()) {

    echo json_encode([
        "status" => "error",
        "message" => "Failed to save activity."
    ]);
    exit();
}


// Return success
echo json_encode([
    "status" => "success",
    "message" => "Activity added successfully.",
    "activity_log_id" => $conn->insert_id,
    "calories_burned" => $calories_burned
]);

?>

