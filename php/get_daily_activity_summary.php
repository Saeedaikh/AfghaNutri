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


// Get total active time and calories burned
$summarySQL = "SELECT
                    COALESCE(SUM(duration_minutes), 0) AS total_active_time,
                    COALESCE(SUM(calories_burned), 0) AS total_burned
               FROM activity_log
               WHERE user_id = ?
               AND activity_date = ?";

$summaryStatement = $conn->prepare($summarySQL);
$summaryStatement->bind_param(
    "is",
    $user_id,
    $activity_date
);

$summaryStatement->execute();
$summaryResult = $summaryStatement->get_result();
$summary = $summaryResult->fetch_assoc();


// Get burn distribution by exercise
$distributionSQL = "SELECT
                        e.exercise_name,
                        SUM(al.calories_burned) AS calories_burned
                    FROM activity_log al
                    INNER JOIN exercise e
                        ON al.exercise_id = e.exercise_id
                    WHERE al.user_id = ?
                    AND al.activity_date = ?
                    GROUP BY e.exercise_name
                    ORDER BY calories_burned DESC";

$distributionStatement = $conn->prepare($distributionSQL);
$distributionStatement->bind_param(
    "is",
    $user_id,
    $activity_date
);

$distributionStatement->execute();
$distributionResult = $distributionStatement->get_result();


// Store distribution
$distribution = [];

while ($row = $distributionResult->fetch_assoc()) {

    $distribution[] = [
        "exercise_name" => $row["exercise_name"],
        "calories_burned" => (int) $row["calories_burned"]
    ];
}


// Get total calories for percentage calculation
$totalBurned = (int) $summary["total_burned"];


// Calculate percentages
foreach ($distribution as &$activity) {

    if ($totalBurned > 0) {
        
        $activity["percentage"] = round(($activity["calories_burned"] / $totalBurned) * 100, 1);
    } else {
        $activity["percentage"] = 0;
    }
}

unset($activity);


// Return summary
echo json_encode([
    "status" => "success",
    "total_active_time" => (int) $summary["total_active_time"],
    "total_burned" => $totalBurned,
    "distribution" => $distribution
]);

?>
