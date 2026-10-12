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

// Get data from JavaScript
$data = json_decode(file_get_contents("php://input"), true); 

// Check that data was received
if (!$data) { 
    echo json_encode([ 
        "status" => "error", 
        "message" => "No data received." 
    ]); 
    exit(); 
} 

// Get profile information
$username = trim($data["username"] ?? ""); 
$email = trim($data["email"] ?? ""); 

$age = (int)($data["age"] ?? 0); 
$height = (float)($data["height"] ?? 0); 
$startWeight = (float)($data["start_weight"] ?? 0); 

// Check required fields
if ( 
    $username === "" || 
    $email === "" || 
    $age <= 0 || 
    $height <= 0 || 
    $startWeight <= 0 
) { 

    echo json_encode([ 
        "status" => "error", 
        "message" => "Please fill in all required fields." 
    ]); 
    exit(); 
} 

// Check if email is already used by another user
$emailSQL = "SELECT user_id 
             FROM `user` 
             WHERE email = ? 
             AND user_id != ?"; 

$emailStmt = $conn->prepare($emailSQL); 
$emailStmt->bind_param("si", $email, $userID); 
$emailStmt->execute(); 

$emailResult = $emailStmt->get_result(); 

if ($emailResult->num_rows > 0) { 
    echo json_encode([ 
        "status" => "error", 
        "message" => "This email is already being used by another account." 
    ]); 
    exit(); 
} 

// Update user information
$userSQL = "UPDATE `user` 
            SET username = ?, 
                email = ?, 
                age = ?, 
                height_cm = ? 
            WHERE user_id = ?"; 

$userStmt = $conn->prepare($userSQL); 
$userStmt->bind_param( 
    "ssidi", 
    $username, 
    $email, 
    $age, 
    $height, 
    $userID 
); 

if (!$userStmt->execute()) { 
    echo json_encode([ 
        "status" => "error", 
        "message" => "Failed to update account details." 
    ]); 
    exit(); 
} 


// Get active goal information
$goalSelectSQL = "SELECT 
                    goal_id, 
                    goal_type, 
                    target_weight, 
                    time_period 
                  FROM goal 
                  WHERE user_id = ? 
                  AND goal_status = 'Active' 
                  ORDER BY g_created_at DESC 
                  LIMIT 1"; 

$goalSelectStmt = $conn->prepare($goalSelectSQL); 
$goalSelectStmt->bind_param("i", $userID); 
$goalSelectStmt->execute(); 

$goalResult = $goalSelectStmt->get_result(); 


// Recalculate calorie and macro goals
if ($goalResult->num_rows > 0) { 

    $goal = $goalResult->fetch_assoc(); 

    $goalID = $goal["goal_id"]; 
    $goalType = $goal["goal_type"]; 
    $targetWeight = (float)$goal["target_weight"]; 
    $timePeriod = (float)$goal["time_period"]; 


    // Get user's gender
    $genderSQL = "SELECT gender 
                  FROM `user` 
                  WHERE user_id = ?"; 

    $genderStmt = $conn->prepare($genderSQL); 
    $genderStmt->bind_param("i", $userID); 
    $genderStmt->execute(); 

    $genderResult = $genderStmt->get_result(); 
    $genderData = $genderResult->fetch_assoc(); 
    $gender = $genderData["gender"]; 


    // Calculate BMR
    if (strtolower($gender) === "female") { 

        $bmr = 
            (10 * $startWeight) + 
            (6.25 * $height) - 
            (5 * $age) - 
            161; 

    } 
    else { 

        $bmr = 
            (10 * $startWeight) + 
            (6.25 * $height) - 
            (5 * $age) + 
            5; 
    } 


    // Calculate sedentary calorie need
    // No intentional exercise included
    $sedentaryCalories = $bmr * 1.2; 

    $weightDifference = abs($startWeight - $targetWeight); 
    $days = $timePeriod * 30.44; 


    // Calculate daily calorie adjustment
    if ($days > 0) { 
        $dailyAdjustment = ($weightDifference * 7700) / $days; 
    } 
    else { 
        $dailyAdjustment = 0; 
    } 


    // Calculate daily calorie goal
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


    // Round calorie goal
    $dailyCalorieGoal = round($dailyCalorieGoal); 


    // Calculate macronutrient goals

    // Protein = 30% of daily calories
    // 4 calories per gram of protein
    $proteinGoal = ($dailyCalorieGoal * 0.30) / 4; 

    // Carbohydrates = 45% of daily calories
    // 4 calories per gram of carbohydrate
    $carbGoal = ($dailyCalorieGoal * 0.45) / 4; 

    // Fat = 25% of daily calories
    // 9 calories per gram of fat
    $fatGoal = ($dailyCalorieGoal * 0.25) / 9; 


    // Update active goal
    $goalUpdateSQL = "UPDATE goal 
                      SET start_weight = ?, 
                          daily_calorie_goal = ?, 
                          protein_goal_g = ?, 
                          carb_goal_g = ?, 
                          fat_goal_g = ?
                      WHERE goal_id = ? 
                      AND user_id = ?"; 

    $goalUpdateStmt = $conn->prepare($goalUpdateSQL); 

    $goalUpdateStmt->bind_param( 
        "didddii", 
        $startWeight, 
        $dailyCalorieGoal, 
        $proteinGoal, 
        $carbGoal, 
        $fatGoal, 
        $goalID, 
        $userID 
    ); 


    if (!$goalUpdateStmt->execute()) { 

        echo json_encode([ 
            "status" => "error", 
            "message" => "Profile updated, but the calorie and macro goals could not be updated." 
        ]); 
        exit(); 
    } 

} 


// Update session information
$_SESSION["username"] = $username; 
$_SESSION["email"] = $email; 


// Return success
echo json_encode([ 
    "status" => "success", 
    "message" => "Profile updated successfully." 
]); 

?>