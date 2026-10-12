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


// Get latest weight
$weightSQL = "SELECT current_weight, record_date
              FROM weight_log
              WHERE user_id = ?
              ORDER BY record_date DESC, weight_id DESC
              LIMIT 1";

$weightStmt = $conn->prepare($weightSQL);
$weightStmt->bind_param(
    "i",
    $user_id
);

$weightStmt->execute();
$weightResult = $weightStmt->get_result();


// Get weight
if ($weightResult->num_rows > 0) {

    // Use the most recent daily weight
    $weightData = $weightResult->fetch_assoc();

    $current_weight = (float)$weightData["current_weight"];
    $weight_date = $weightData["record_date"];

} else {

    // No daily weight
    // Use start weight from goal table

    $startWeightSQL = "SELECT start_weight
                       FROM goal
                       WHERE user_id = ?
                       AND goal_status = 'Active'
                       ORDER BY goal_id DESC
                       LIMIT 1";

    $startWeightStmt = $conn->prepare($startWeightSQL);
    $startWeightStmt->bind_param(
        "i",
        $user_id
    );

    $startWeightStmt->execute();
    $startWeightResult = $startWeightStmt->get_result();


    // Check if start weight exists
    if ($startWeightResult->num_rows === 0) {

        echo json_encode([
            "status" => "error",
            "message" => "No weight information is available to calculate your water goal."
        ]);
        exit();
    }

    $startWeightData = $startWeightResult->fetch_assoc();
    $current_weight = (float)$startWeightData["start_weight"];
    $weight_date = null;
}


// CALCULATE WATER GOAL
// 35 mL of water per kg of body weight
$water_goal = $current_weight * 0.035;


// Get today's date
$today = date("Y-m-d");


// Get today's water consumption
$waterSQL = "SELECT COALESCE(SUM(amount_liters), 0) AS total_water
             FROM water_log
             WHERE user_id = ?
             AND water_log_date = ?";

$waterStmt = $conn->prepare($waterSQL);
$waterStmt->bind_param(
    "is",
    $user_id,
    $today
);

$waterStmt->execute();
$waterResult = $waterStmt->get_result();
$waterData = $waterResult->fetch_assoc();
$water_consumed = (float)$waterData["total_water"];


// Calculate remaining water
$water_remaining = max(0, $water_goal - $water_consumed);


// Success response
echo json_encode([
    "status" => "success",
    "current_weight" => $current_weight,
    "weight_date" => $weight_date,
    "water_goal" => round($water_goal, 2),
    "water_consumed" => round($water_consumed, 2),
    "water_remaining" => round($water_remaining, 2)
]);

?>
