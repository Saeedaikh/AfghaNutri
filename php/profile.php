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

// Get logged-in user's ID from the session
$userID = $_SESSION["user_id"];

// Get user information
$userSQL = "SELECT 
                user_id,
                username,
                email,
                gender,
                age,
                height_cm,
                profile_picture
            FROM `user`
            WHERE user_id = ?";

$userStmt = $conn->prepare($userSQL);
$userStmt->bind_param("i", $userID);
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


// Get the user's active goal
$goalSQL = "SELECT
                goal_id,
                goal_type,
                start_weight,
                target_weight,
                time_period,
                daily_calorie_goal,
                goal_status
            FROM goal
            WHERE user_id = ?
            AND goal_status = 'Active'
            ORDER BY g_created_at DESC
            LIMIT 1";

$goalStmt = $conn->prepare($goalSQL);
$goalStmt->bind_param("i", $userID);
$goalStmt->execute();

$goalResult = $goalStmt->get_result();

$goal = null;

if ($goalResult->num_rows > 0) {
    $goal = $goalResult->fetch_assoc();
}


// Return all profile information
echo json_encode([
    "status" => "success",
    "user" => $user,
    "goal" => $goal,
]);

?>
