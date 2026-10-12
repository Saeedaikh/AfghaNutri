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


// Get exercises from database
$sql = "SELECT exercise_id, exercise_name, met_value, intensity
        FROM exercise
        ORDER BY exercise_name, intensity";

$result = $conn->query($sql);


// Check query
if (!$result) {

    echo json_encode([
        "status" => "error",
        "message" => "Failed to load exercise data."
    ]);
    exit();
}


// Store exercises
$exercises = [];

while ($row = $result->fetch_assoc()) {

    $exercises[] = [
        "exercise_id" => (int) $row["exercise_id"],
        "exercise_name" => $row["exercise_name"],
        "met_value" => (float) $row["met_value"],
        "intensity" => $row["intensity"]
    ];
}


// Return exercise data
echo json_encode([
    "status" => "success",
    "exercises" => $exercises
]);

?>
