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


// Get today's date
$activity_date = date("Y-m-d");


// Get today's activities
$sql = "SELECT
            al.activity_log_id,
            al.exercise_id,
            e.exercise_name,
            al.duration_minutes,
            al.calories_burned,
            al.activity_date,
            al.intensity
        FROM activity_log al
        INNER JOIN exercise e
            ON al.exercise_id = e.exercise_id
        WHERE al.user_id = ?
        AND al.activity_date = ?
        ORDER BY al.activity_log_id DESC";


$statement = $conn->prepare($sql);
$statement->bind_param(
    "is",
    $user_id,
    $activity_date
);

$statement->execute();
$result = $statement->get_result();


// Store activities
$activities = [];

while ($row = $result->fetch_assoc()) {

    $activities[] = [
        "activity_log_id" => (int) $row["activity_log_id"],
        "exercise_id" => (int) $row["exercise_id"],
        "exercise_name" => $row["exercise_name"],
        "duration_minutes" => (int) $row["duration_minutes"],
        "calories_burned" => (int) $row["calories_burned"],
        "activity_date" => $row["activity_date"],
        "intensity" => $row["intensity"]
    ];
}


// Return today's activities
echo json_encode([
    "status" => "success",
    "activities" => $activities
]);

?>
