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


// Get today's foodlog
$sql = "SELECT
            fl.food_log_id,
            fl.meal_type,
            fl.servings,
            f.food_name_en,
            f.calories_per_serving,
            f.protein_g_per_serving,
            f.carbohydrate_g_per_serving,
            f.fat_g_per_serving
        FROM food_log fl
        INNER JOIN food f
            ON fl.food_id = f.food_id
        WHERE fl.user_id = ?
        AND fl.log_date = ?

        ORDER BY fl.food_log_id ASC";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "is",
    $user_id,
    $log_date
);

$stmt->execute();
$result = $stmt->get_result();


// Store foodlog data
$foods = [];

while ($food = $result->fetch_assoc()) {

    $servings = (float)$food["servings"];

    $foods[] = [
        "food_log_id" => (int)$food["food_log_id"],
        "meal_type" => $food["meal_type"],
        "food_name_en" => $food["food_name_en"],
        "servings" => $servings,

        "calories" => (float)$food["calories_per_serving"] * $servings,
        "protein" => (float)$food["protein_g_per_serving"] * $servings,
        "carbs" => (float)$food["carbohydrate_g_per_serving"] * $servings,
        "fat" => (float)$food["fat_g_per_serving"] * $servings
    ];
}


// Return data
echo json_encode([
    "status" => "success",
    "foods" => $foods
]);

?>