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


// Get Today's date
$record_date = date("Y-m-d");


// Check if weight exists today
$checkSQL = "SELECT current_weight
             FROM weight_log
             WHERE user_id = ?
             AND record_date = ?
             LIMIT 1";

$checkStmt = $conn->prepare($checkSQL);
$checkStmt->bind_param(
    "is",
    $user_id,
    $record_date
);

$checkStmt->execute();
$checkResult = $checkStmt->get_result();


// Weight already exists
if ($checkResult->num_rows > 0) {

    $weight = $checkResult->fetch_assoc();

    echo json_encode([
        "status" => "success",
        "weight_exists" => true,
        "current_weight" => (float)$weight["current_weight"]
    ]);
    exit();
}


// NO WEIGHT FOR TODAY
echo json_encode([
    "status" => "success",
    "weight_exists" => false
]);

?>
