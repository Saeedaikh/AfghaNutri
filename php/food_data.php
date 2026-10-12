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


// Get all food data
$foodSQL = "SELECT 
                food_id,
                food_name_en,
                food_name_da,
                calories_per_serving,
                fat_g_per_serving,
                carbohydrate_g_per_serving,
                protein_g_per_serving,
                description,
                food_image
            FROM food
            ORDER BY food_id ASC";

$foodResult = $conn->query($foodSQL);


// Check if query was successful
if (!$foodResult) {

    echo json_encode([
        "status" => "error",
        "message" => "Failed to fetch food data."
    ]);
    exit();
}


// Store food data
$foods = [];

while ($food = $foodResult->fetch_assoc()) {
    $foods[] = $food;
}


// Return food data
echo json_encode([
    "status" => "success",
    "foods" => $foods
]);

?>