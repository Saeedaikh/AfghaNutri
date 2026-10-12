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


// Get selected date
$data = json_decode(file_get_contents("php://input"), true);

if (isset($data["date"]) && !empty($data["date"])) {
    $selected_date = $data["date"];
} else {
    $selected_date = date("Y-m-d");
}


// Get user information
$userSQL = "SELECT username
            FROM user
            WHERE user_id = ?";
$userStatement = $conn->prepare($userSQL);
$userStatement->bind_param(
    "i",
    $user_id
);

$userStatement->execute();
$userResult = $userStatement->get_result();


// Check user
if ($userResult->num_rows === 0) {
    echo json_encode([
        "status" => "error",
        "message" => "User was not found."
    ]);
    exit();
}

$user = $userResult->fetch_assoc();


// Get active goal
$goalSQL = "SELECT goal_type,
                   start_weight,
                   target_weight,
                   time_period,
                   daily_calorie_goal,
                   protein_goal_g,
                   carb_goal_g,
                   fat_goal_g
            FROM goal
            WHERE user_id = ?
            AND goal_status = 'Active'
            ORDER BY g_created_at DESC
            LIMIT 1";
$goalStatement = $conn->prepare($goalSQL);
$goalStatement->bind_param(
    "i",
    $user_id
);

$goalStatement->execute();
$goalResult = $goalStatement->get_result();


// Check goal
if ($goalResult->num_rows === 0) {
    echo json_encode([
        "status" => "error",
        "message" => "No active goal was found."
    ]);
    exit();
}

$goal = $goalResult->fetch_assoc();


// Get current weight for the exact selected date
$weightSQL = "SELECT current_weight
              FROM weight_log
              WHERE user_id = ?
              AND record_date = ?
              LIMIT 1";
$weightStatement = $conn->prepare($weightSQL);
$weightStatement->bind_param(
    "is",
    $user_id,
    $selected_date
);
$weightStatement->execute();
$weightResult = $weightStatement->get_result();


// Check weight
if ($weightResult->num_rows === 0) {

    $today = date("Y-m-d");

    if ($selected_date === $today) {
        echo json_encode([
            "status" => "error",
            "user" => [
                "username" => $user["username"]
            ],
            "message" => "Please enter your weight for today in the Meal Log page to view your dashboard."
        ]);

    } else {
        echo json_encode([
            "status" => "no_data",
            "user" => [
                "username" => $user["username"]
            ]
        ]);
    }
    exit();
}

$weightRow = $weightResult->fetch_assoc();
$current_weight = (float) $weightRow["current_weight"];

// Calculate water goal
// 35 mL of water per kg of body weight
$water_goal = $current_weight * 0.035;


// Get today's food information
$foodSQL = "SELECT
                COALESCE(SUM(f.calories_per_serving * fl.servings), 0) AS calories,
                COALESCE(SUM(f.protein_g_per_serving * fl.servings), 0) AS protein,
                COALESCE(SUM(f.carbohydrate_g_per_serving * fl.servings), 0) AS carbs,
                COALESCE(SUM(f.fat_g_per_serving * fl.servings), 0) AS fat
            FROM food_log fl
            JOIN food f ON fl.food_id = f.food_id
            WHERE fl.user_id = ?
            AND fl.log_date = ?";
$foodStatement = $conn->prepare($foodSQL);
$foodStatement->bind_param(
    "is",
    $user_id,
    $selected_date
);

$foodStatement->execute();
$foodResult = $foodStatement->get_result();
$food = $foodResult->fetch_assoc();

$calories_consumed = (int) $food["calories"];
$protein_consumed = (float) $food["protein"];
$carbs_consumed = (float) $food["carbs"];
$fat_consumed = (float) $food["fat"];


// Get today's activity information
$activitySQL = "SELECT
                    COALESCE(SUM(duration_minutes), 0) AS duration,
                    COALESCE(SUM(calories_burned), 0) AS calories_burned
                FROM activity_log
                WHERE user_id = ?
                AND activity_date = ?";
$activityStatement = $conn->prepare($activitySQL);
$activityStatement->bind_param(
    "is",
    $user_id,
    $selected_date
);

$activityStatement->execute();
$activityResult = $activityStatement->get_result();
$activity = $activityResult->fetch_assoc();

$activity_duration = (int) $activity["duration"];
$calories_burned = (int) $activity["calories_burned"];


// Get today's water information
$waterSQL = "SELECT
                 COALESCE(SUM(amount_liters), 0) AS water
             FROM water_log
             WHERE user_id = ?
             AND water_log_date = ?";
$waterStatement = $conn->prepare($waterSQL);
$waterStatement->bind_param(
    "is",
    $user_id,
    $selected_date
);

$waterStatement->execute();
$waterResult = $waterStatement->get_result();
$water = $waterResult->fetch_assoc();

$water_consumed = (float) $water["water"];


// Return dashboard data
echo json_encode([
    "status" => "success",

    "user" => [
        "username" => $user["username"]
    ],

    "goal" => [
        "goal_type" => $goal["goal_type"],
        "start_weight" => (float) $goal["start_weight"],
        "target_weight" => (float) $goal["target_weight"],
        "current_weight" => $current_weight,
        "time_period" => (float) $goal["time_period"],
        "daily_calorie_goal" => (int) $goal["daily_calorie_goal"],
        "protein_goal" => (float) $goal["protein_goal_g"],
        "carb_goal" => (float) $goal["carb_goal_g"],
        "fat_goal" => (float) $goal["fat_goal_g"]
    ],

    "food" => [
        "calories_consumed" => $calories_consumed,
        "protein_consumed" => $protein_consumed,
        "carbs_consumed" => $carbs_consumed,
        "fat_consumed" => $fat_consumed
    ],

    "activity" => [
        "duration" => $activity_duration,
        "calories_burned" => $calories_burned
    ],

    "water" => [ 
        "water_goal" => round($water_goal, 2),
        "water_consumed" => $water_consumed
    ],

    "selected_date" => $selected_date
]);

?>