<?php

session_start();

require_once "../config/database.php";

header("Content-Type: application/json");

// Make sure the user is logged in
if (!isset($_SESSION["user_id"])) {

    echo json_encode([
        "status" => "error",
        "message" => "User is not logged in."
    ]);
    exit();
}

// Get logged-in user's ID
$userID = $_SESSION["user_id"];

// Get JSON data
$data = json_decode(file_get_contents("php://input"), true);

$goalType = $data["goalType"] ?? "";
$targetWeight = $data["targetWeight"] ?? "";
$timePeriod = $data["timePeriod"] ?? "";

// Check required fields
if (empty($goalType) || empty($targetWeight) || empty($timePeriod)) {

    echo json_encode([
        "status" => "error",
        "message" => "Please complete all goal fields."
    ]);
    exit();
}

// Check valid goal type
if (!in_array($goalType, ["Lose", "Gain", "Maintain"])) {

    echo json_encode([
        "status" => "error",
        "message" => "Invalid goal type."
    ]);
    exit();
}


// GET USER INFORMATION
$userSQL = "SELECT
                gender,
                age,
                height_cm
            FROM `user`
            WHERE user_id = ?";

$userStmt = $conn->prepare($userSQL);
$userStmt->bind_param(
    "i",
    $userID
);

$userStmt->execute();
$userResult = $userStmt->get_result();

if ($userResult->num_rows === 0) {

    echo json_encode([
        "status" => "error",
        "message" => "User not found."
    ]);
    exit();
}

$user = $userResult->fetch_assoc();

$gender = $user["gender"];
$age = (int)$user["age"];
$height = (float)$user["height_cm"];


// GET ACTIVE GOAL
$goalSQL = "SELECT
                goal_id,
                start_weight
            FROM goal
            WHERE user_id = ?
            AND goal_status = 'Active'
            ORDER BY g_created_at DESC
            LIMIT 1";

$goalStmt = $conn->prepare($goalSQL);
$goalStmt->bind_param(
    "i",
    $userID
);

$goalStmt->execute();
$goalResult = $goalStmt->get_result();

if ($goalResult->num_rows === 0) {

    echo json_encode([
        "status" => "error",
        "message" => "No active goal found."
    ]);

    exit();
}

$goal = $goalResult->fetch_assoc();

$goalID = $goal["goal_id"];
$currentWeight = (float)$goal["start_weight"];


// CALCULATE BMR
if (strtolower($gender) === "female") {

    $bmr =
        (10 * $currentWeight) +
        (6.25 * $height) -
        (5 * $age) -
        161;

} else {
    $bmr =
        (10 * $currentWeight) +
        (6.25 * $height) -
        (5 * $age) +
        5;
}


// SEDENTARY CALORIE NEED
// No intentional exercise included
$sedentaryCalories = $bmr * 1.2;


// CALCULATE WEIGHT DIFFERENCE
$weightDifference = abs($currentWeight - $targetWeight);


// CONVERT MONTHS TO DAYS
// 1 month ≈ 30.44 days
$days = $timePeriod * 30.44;


// CALCULATE DAILY CALORIE ADJUSTMENT
// Approximately 7,700 kcal per kg
if ($days > 0) {
    $dailyAdjustment = ($weightDifference * 7700) / $days;
} else {
    $dailyAdjustment = 0;
}


// CALCULATE DAILY CALORIE GOAL
if ($goalType === "Lose") {

    $dailyCalorieGoal = $sedentaryCalories - $dailyAdjustment;
}
elseif ($goalType === "Gain") {

    $dailyCalorieGoal = $sedentaryCalories + $dailyAdjustment;
}
else {

    // Maintain
    $dailyCalorieGoal = $sedentaryCalories;
}


// ROUND CALORIE GOAL
$dailyCalorieGoal = round($dailyCalorieGoal);

// CALCULATE MACRONUTRIENT GOALS

        // Protein = 30% of daily calories
        // 4 calories per gram of protein
        $proteinGoal = ($dailyCalorieGoal * 0.30) / 4;

        // Carbohydrates = 45% of daily calories
        // 4 calories per gram of carbohydrate
        $carbGoal = ($dailyCalorieGoal * 0.45) / 4;

        // Fat = 25% of daily calories
        // 9 calories per gram of fat
        $fatGoal = ($dailyCalorieGoal * 0.25) / 9;


// UPDATE ACTIVE GOAL
$updateSQL = "UPDATE goal
              SET goal_type = ?,
                  target_weight = ?,
                  time_period = ?,
                  daily_calorie_goal = ?,
                  protein_goal_g = ?,
                  carb_goal_g = ?,
                  fat_goal_g = ?
              WHERE goal_id = ?
              AND user_id = ?";

$updateStmt = $conn->prepare($updateSQL);

$updateStmt->bind_param(
    "sddddddii", 
    $goalType, 
    $targetWeight, 
    $timePeriod, 
    $dailyCalorieGoal, 
    $proteinGoal, 
    $carbGoal, 
    $fatGoal, 
    $goalID, 
    $userID
);


if ($updateStmt->execute()) {

    echo json_encode([
        "status" => "success",
        "message" => "Goal updated successfully.",
        "daily_calorie_goal" => $dailyCalorieGoal
    ]);

}
else {

    echo json_encode([
        "status" => "error",
        "message" => "Failed to update goal."
    ]);
}

?>