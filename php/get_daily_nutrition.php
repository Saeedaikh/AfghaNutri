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
$log_date = date("Y-m-d");


// Get user's daily calorie goal
$goalSQL = "SELECT daily_calorie_goal, protein_goal_g, carb_goal_g, fat_goal_g
            FROM goal
            WHERE user_id = ?
            AND goal_status = 'Active'
            ORDER BY g_created_at DESC
            LIMIT 1";

$goalStmt = $conn->prepare($goalSQL);
$goalStmt->bind_param(
    "i",
    $user_id
);

$goalStmt->execute();
$goalResult = $goalStmt->get_result();

if ($goalResult->num_rows === 0) {

    echo json_encode([
        "status" => "error",
        "message" => "No active calorie goal found."
    ]);
    exit();
}

$goal = $goalResult->fetch_assoc();

$calorie_goal = (float)$goal["daily_calorie_goal"];
$protein_goal = (float)$goal["protein_goal_g"];
$carb_goal = (float)$goal["carb_goal_g"];
$fat_goal = (float)$goal["fat_goal_g"];


// Get today's nutrition
$sql = "SELECT
            COALESCE(SUM(f.calories_per_serving * fl.servings), 0) AS total_calories,
            COALESCE(SUM(f.protein_g_per_serving * fl.servings), 0) AS total_protein,
            COALESCE(SUM(f.carbohydrate_g_per_serving * fl.servings), 0) AS total_carbs,
            COALESCE(SUM(f.fat_g_per_serving * fl.servings), 0) AS total_fat
        FROM food_log fl
        INNER JOIN food f
            ON fl.food_id = f.food_id
        WHERE fl.user_id = ?
        AND fl.log_date = ?";


$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "is",
    $user_id,
    $log_date
);

$stmt->execute();
$result = $stmt->get_result();
$nutrition = $result->fetch_assoc();


// Convert values to numbers
$total_calories = (float)$nutrition["total_calories"];
$total_protein = (float)$nutrition["total_protein"];
$total_carbs = (float)$nutrition["total_carbs"];
$total_fat = (float)$nutrition["total_fat"];


// Calculate remaining calories
$calorie_difference = $calorie_goal - $total_calories;

if ($calorie_difference >= 0) {
    $remaining_calories = $calorie_difference;
    $over_goal = 0;
} else {
    $remaining_calories = 0;
    $over_goal = abs($calorie_difference);
}


// Return data
echo json_encode([ 
    "status" => "success", 
    
    // Daily calorie goal
    "calorie_goal" => $calorie_goal, 
    
    // Macronutrient goals
    "protein_goal" => $protein_goal,
    "carb_goal" => $carb_goal,
    "fat_goal" => $fat_goal,
    
    // Today's nutrition
    "total_calories" => $total_calories, 
    "remaining_calories" => $remaining_calories, 
    "over_goal" => $over_goal, 
    "total_protein" => $total_protein, 
    "total_carbs" => $total_carbs, 
    "total_fat" => $total_fat 
]);

?>