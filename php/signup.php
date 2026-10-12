<?php

require_once "../config/database.php";

header("Content-Type: application/json");

if($_SERVER["REQUEST_METHOD"] == "POST"){

    // Receive JSON data from JavaScript
    $data = json_decode(file_get_contents("php://input"), true);

    $username = $data["username"];
    $email = $data["email"];
    $password = $data["password"];
    $gender = $data["gender"];
    $age = $data["age"];
    $height = $data["height"];
    $weight = $data["weight"];

    $goalType = $data["healthGoal"];
    $targetWeight = $data["targetWeight"];
    $timePeriod = $data["timePeriod"];

    // Encrypt password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Check if email already exists
    $checkSQL = "SELECT user_id FROM `user` WHERE email = ?";
    $checkStml = $conn->prepare($checkSQL);
    $checkStml->bind_param("s", $email);
    $checkStml->execute();
    $result = $checkStml->get_result();

    if($result->num_rows > 0) {
        echo json_encode([
            "status" => "error",
            "message" => "An account with this email already exists."
        ]);
        exit();
    }

    // Insert user
    $sql = "INSERT INTO `user`
            (username, password, email, gender, age, height_cm)
            VALUES (?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        "ssssii",
        $username,
        $hashedPassword,
        $email,
        $gender,
        $age,
        $height
    );

    if($stmt->execute()){

        // Get new user ID
        $userID = $conn->insert_id;


        // CALCULATE BMR
        if(strtolower($gender) === "female"){

            $bmr =
                (10 * $weight) +
                (6.25 * $height) -
                (5 * $age) -
                161;
        }
        else{

            $bmr =
                (10 * $weight) +
                (6.25 * $height) -
                (5 * $age) +
                5;
        }

        // SEDENTARY CALORIE NEED
        // No intentional exercise included
        $sedentaryCalories = $bmr * 1.2;

        // CALCULATE WEIGHT DIFFERENCE
        $weightDifference = abs($weight - $targetWeight);


        // CALCULATE TIME PERIOD IN DAYS, because it was in months
        $days = $timePeriod * 30.44;

        // CALCULATE DAILY CALORIE ADJUSTMENT
        if($days > 0){

            $dailyAdjustment = ($weightDifference * 7700) / $days;
        }
        else{
            $dailyAdjustment = 0;
        }

        // CALCULATE DAILY CALORIE GOAL
        if($goalType === "Lose"){

            $dailyCalorieGoal = $sedentaryCalories - $dailyAdjustment;
        }
        elseif($goalType === "Gain"){

            $dailyCalorieGoal = $sedentaryCalories + $dailyAdjustment;
        }
        else{

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

        // INSERT GOAL

        $goalSQL = "INSERT INTO goal
        (user_id, goal_type, start_weight, target_weight, time_period,
        daily_calorie_goal, protein_goal_g, carb_goal_g, fat_goal_g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $goalStmt = $conn->prepare($goalSQL);

        $goalStmt->bind_param(
            "isddddddd",
            $userID,
            $goalType,
            $weight,
            $targetWeight,
            $timePeriod,
            $dailyCalorieGoal,
            $proteinGoal,
            $carbGoal,
            $fatGoal
        );

        if($goalStmt->execute()){

            echo json_encode([
                "status" => "success",
                "message" => "Account created successfully"
            ]);

        }
        else{

            echo json_encode([
                "status" => "error",
                "message" => "Failed to save health goal."
            ]);

        }
    }
    else{
        echo json_encode([
            "status" => "error",
            "message" => $stmt->error
        ]);
    }
}

?>