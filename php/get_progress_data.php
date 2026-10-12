<?php

session_start();

require_once "../config/database.php";

header("Content-Type: application/json");


// Check if user is logged in
if (!isset($_SESSION["user_id"])) {
    echo json_encode([
        "status" => "error",
        "message" => "User is not logged in."
    ]);
    exit();
}


// Get user ID
$user_id = $_SESSION["user_id"];


// Get selected timeframe
$data = json_decode(file_get_contents("php://input"), true);
$timeframe = $data["timeframe"] ?? "week";


// Check timeframe
if (!in_array($timeframe, ["week", "month", "all"])) {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid timeframe."
    ]);
    exit();
}


// Get active goal
$goalQuery = "
    SELECT
        daily_calorie_goal,
        g_created_at,
        time_period,
        goal_type,
        start_weight,
        target_weight
    FROM goal
    WHERE user_id = ?
    AND goal_status = 'Active'
    ORDER BY g_created_at DESC
    LIMIT 1
";
$stmt = $conn->prepare($goalQuery);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$goal = $result->fetch_assoc();


// Check if goal exists
if (!$goal) {
    echo json_encode([
        "status" => "error",
        "message" => "No active goal found."
    ]);
    exit();
}


// Get goal start date
$goalStartDate = date("Y-m-d", strtotime($goal["g_created_at"]));


// Get today's date
$today = date("Y-m-d");



// CALCULATE GOAL END DATE
$goalEndDateObject = new DateTime($goalStartDate);
$goalMonths = (int)$goal["time_period"];
$goalEndDateObject->modify("+".$goalMonths." months");
$goalEndDateObject->modify("-1 day");
$goalEndDate = $goalEndDateObject->format("Y-m-d");


// SET DATA AND TARGET DATES
if ($timeframe === "week") {
    $mondayThisWeek = date("Y-m-d", strtotime("monday this week"));
    $sundayThisWeek = date("Y-m-d", strtotime("sunday this week"));

    // Period starts from goal start or Monday
    if ($goalStartDate > $mondayThisWeek) {
        $periodStartDate = $goalStartDate;

    } else {
        $periodStartDate = $mondayThisWeek;
    }

    // Target ends on Sunday or goal end,
    // whichever comes first
    if ($goalEndDate < $sundayThisWeek) {
        $periodEndDate = $goalEndDate;

    } else {
        $periodEndDate = $sundayThisWeek;
    }

} elseif ($timeframe === "month") {
    $firstDayOfMonth = date("Y-m-01");
    $lastDayOfMonth = date("Y-m-t");

    // Period starts from goal start or first day
    if ($goalStartDate > $firstDayOfMonth) {
        $periodStartDate = $goalStartDate;

    } else {
        $periodStartDate = $firstDayOfMonth;
    }

    // Target ends on month end or goal end,
    // whichever comes first
    if ($goalEndDate < $lastDayOfMonth) {
        $periodEndDate = $goalEndDate;

    } else {
        $periodEndDate = $lastDayOfMonth;
    }

} else {

    // All Time starts at goal start
    $periodStartDate = $goalStartDate;

    // All Time ends at goal end
    $periodEndDate = $goalEndDate;
}


// DATA END DATE

// Actual data can never go beyond today
$dataStartDate = $periodStartDate;
$dataEndDate = $today;

// If the selected period has already ended,
// do not request data after the goal end date
if ($dataEndDate > $periodEndDate) {
    $dataEndDate = $periodEndDate;
}


// CARD 1: CALORIE DATA

// Get consumed calories
$foodQuery = "
    SELECT
        SUM(fl.servings * f.calories_per_serving) AS calories_consumed
    FROM food_log fl
    JOIN food f ON fl.food_id = f.food_id
    WHERE fl.user_id = ?
    AND fl.log_date BETWEEN ? AND ?
";
$stmt = $conn->prepare($foodQuery);
$stmt->bind_param(
    "iss",
    $user_id,
    $dataStartDate,
    $dataEndDate
);
$stmt->execute();
$result = $stmt->get_result();
$foodData = $result->fetch_assoc();
$caloriesConsumed = (float)($foodData["calories_consumed"] ?? 0);

// Get burned calories
$activityQuery = "
    SELECT
        SUM(calories_burned) AS calories_burned
    FROM activity_log
    WHERE user_id = ?
    AND activity_date BETWEEN ? AND ?
";
$stmt = $conn->prepare($activityQuery);
$stmt->bind_param(
    "iss",
    $user_id,
    $dataStartDate,
    $dataEndDate
);
$stmt->execute();
$result = $stmt->get_result();
$activityData = $result->fetch_assoc();
$caloriesBurned = (float)($activityData["calories_burned"] ?? 0);

// Calculate net calories
$netCalories = $caloriesConsumed - $caloriesBurned;


// CALCULATE TARGET DAYS
$targetStartDate = $periodStartDate;
$targetEndDate = $periodEndDate;
$targetStartDateObject = new DateTime($targetStartDate);
$targetEndDateObject = new DateTime($targetEndDate);

$numberOfTargetDays = $targetStartDateObject ->diff($targetEndDateObject) ->days + 1;

// Calculate target limit
$targetLimit = (float)$goal["daily_calorie_goal"] * $numberOfTargetDays;


// CARD 2: WEIGHT DATA

// Get weight logs for the selected data period
$weightQuery = "
    SELECT
        record_date,
        current_weight
    FROM weight_log
    WHERE user_id = ?
    AND record_date BETWEEN ? AND ?
    ORDER BY record_date ASC
";
$stmt = $conn->prepare($weightQuery);
$stmt->bind_param(
    "iss",
    $user_id,
    $dataStartDate,
    $dataEndDate
);
$stmt->execute();
$result = $stmt->get_result();

// Store weight records
$weightLogs = [];
while ($row = $result->fetch_assoc()) {

    $weightLogs[] = [
        "date" => $row["record_date"],
        "weight" => (float)$row["current_weight"]
    ];
}


// CARD 3: ACTIVITY DATA

// Get daily activity data
$activityTrendQuery = "
    SELECT
        activity_date,
        SUM(calories_burned) AS calories_burned
    FROM activity_log
    WHERE user_id = ?
    AND activity_date BETWEEN ? AND ?
    GROUP BY activity_date
    ORDER BY activity_date ASC
";
$stmt = $conn->prepare($activityTrendQuery);
$stmt->bind_param(
    "iss",
    $user_id,
    $dataStartDate,
    $dataEndDate
);
$stmt->execute();
$result = $stmt->get_result();

// Store daily activity records
$activityLogs = [];

while ($row = $result->fetch_assoc()) {
    $activityLogs[$row["activity_date"]] = (float)$row["calories_burned"];
}


// PREPARE ACTIVITY CHART DATA
$activityLabels = [];
$activityValues = [];


// WEEK: DAILY CALORIES
if ($timeframe === "week") {
    $currentDate = new DateTime($dataStartDate);
    $endDate = new DateTime($dataEndDate);

    while ($currentDate <= $endDate) {
        $dateString = $currentDate->format("Y-m-d");

        // Day name
        $activityLabels[] = $currentDate->format("D");

        // Calories burned for that day
        $activityValues[] = $activityLogs[$dateString] ?? 0;
        $currentDate->modify("+1 day");
    }

// MONTH: WEEKLY CALORIES
} elseif ($timeframe === "month") {
    $currentDate = new DateTime($dataStartDate);
    $endDate = new DateTime($dataEndDate);
    $weekNumber = 1;
    $weekCalories = 0;

    while ($currentDate <= $endDate) {
        $dateString = $currentDate->format("Y-m-d");
        $weekCalories += $activityLogs[$dateString] ?? 0;

        // End of week
        if ($currentDate->format("N") == 7) {
            $activityLabels[] = "Week " . $weekNumber;
            $activityValues[] = $weekCalories;

            $weekNumber++;
            $weekCalories = 0;
        }

        $currentDate->modify("+1 day");
    }

    // Add final partial week
    if ($weekCalories > 0 || count($activityLabels) == 0) {
        $activityLabels[] = "Week " . $weekNumber;
        $activityValues[] = $weekCalories;
    }


// ALL TIME: MONTHLY CALORIES
} else {

    $currentDate = new DateTime($dataStartDate);
    $endDate = new DateTime($dataEndDate);

    while ($currentDate <= $endDate) {
        $monthStart = new DateTime( $currentDate->format("Y-m-01"));
        $monthEnd = new DateTime($currentDate->format("Y-m-t"));

        // Do not go before the goal/data start
        if ($monthStart < new DateTime($dataStartDate)) {
            $monthStart = new DateTime($dataStartDate);
        }

        // Do not go after today's date or goal end
        if ($monthEnd > $endDate) {
            $monthEnd = new DateTime($dataEndDate);
        }

        // Calculate calories for this month
        $monthCalories = 0;
        $monthDate = clone $monthStart;

        while ($monthDate <= $monthEnd) {
            $dateString = $monthDate->format("Y-m-d");
            $monthCalories += $activityLogs[$dateString] ?? 0;
            $monthDate->modify("+1 day");
        }

        $activityLabels[] = $currentDate->format("M");
        $activityValues[] = $monthCalories;

        // Move to next month
        $currentDate = new DateTime($currentDate->format("Y-m-01"));
        $currentDate->modify("+1 month");
    }
}


// CARD 4: MACRONUTRIENT DATA

// Get total macronutrients from food logs
$macroQuery = "
    SELECT
        SUM(fl.servings * f.protein_g_per_serving) AS protein_grams,
        SUM(fl.servings * f.carbohydrate_g_per_serving) AS carb_grams,
        SUM(fl.servings * f.fat_g_per_serving) AS fat_grams
    FROM food_log fl
    JOIN food f ON fl.food_id = f.food_id
    WHERE fl.user_id = ?
    AND fl.log_date BETWEEN ? AND ?
";
$stmt = $conn->prepare($macroQuery);
$stmt->bind_param(
    "iss",
    $user_id,
    $dataStartDate,
    $dataEndDate
);
$stmt->execute();
$result = $stmt->get_result();
$macroData = $result->fetch_assoc();

// Get total grams
$totalProtein = (float)($macroData["protein_grams"] ?? 0);
$totalCarbs = (float)($macroData["carb_grams"] ?? 0);
$totalFats = (float)($macroData["fat_grams"] ?? 0);


// CALCULATE AVERAGE DAILY MACROS
$numberOfDataDays = 0;

if ($dataStartDate <= $dataEndDate) {
    $dataStartObject = new DateTime($dataStartDate);
    $dataEndObject = new DateTime($dataEndDate);
    $numberOfDataDays = $dataStartObject ->diff($dataEndObject) ->days + 1;
}

// Avoid division by zero
if ($numberOfDataDays > 0) {
    $averageProtein = $totalProtein / $numberOfDataDays;
    $averageCarbs = $totalCarbs / $numberOfDataDays;
    $averageFats = $totalFats / $numberOfDataDays;

} else {
    $averageProtein = 0;
    $averageCarbs = 0;
    $averageFats = 0;
}


// CALCULATE MACRONUTRIENT PERCENTAGES

// Protein = 4 calories per gram
$proteinCalories = $averageProtein * 4;

// Carbohydrates = 4 calories per gram
$carbCalories = $averageCarbs * 4;

// Fat = 9 calories per gram
$fatCalories = $averageFats * 9;

// Total calories from macros
$totalMacroCalories =$proteinCalories + $carbCalories + $fatCalories;

// Calculate percentages
if ($totalMacroCalories > 0) {
    $proteinPercentage = ($proteinCalories / $totalMacroCalories) * 100;
    $carbPercentage = ($carbCalories / $totalMacroCalories) * 100;
    $fatPercentage = ($fatCalories / $totalMacroCalories) * 100;

} else {
    $proteinPercentage = 0;
    $carbPercentage = 0;
    $fatPercentage = 0;
}


// SEND DATA
echo json_encode([

    "status" => "success",
    "timeframe" => $timeframe,
    "start_date" => $dataStartDate,
    "end_date" => $dataEndDate,
    "target_start_date" => $targetStartDate,
    "target_end_date" => $targetEndDate,
    "target_days" => $numberOfTargetDays,

    // Actual goal dates
    "goal_start_date" => $goalStartDate,
    "goal_end_date" => $goalEndDate,


    // Card 1
    "calories" => [
        "consumed" => $caloriesConsumed,
        "burned" => $caloriesBurned,
        "net" => $netCalories,
        "target" => $targetLimit
    ],

    // Card 2
    "weight" => [
        "goal_type" => $goal["goal_type"],
        "start_weight" => (float)$goal["start_weight"],
        "target_weight" => (float)$goal["target_weight"],
        "goal_start_date" => $goalStartDate,
        "goal_end_date" => $goalEndDate,
        "logs" => $weightLogs
    ],

    // Card 3
    "activity" => [
        "labels" => $activityLabels,
        "values" => $activityValues
    ],

    // Card 4
    "macros" => [
        "protein" => [
            "grams" => $averageProtein,
            "percentage" => $proteinPercentage
        ],
        "carbs" => [
            "grams" => $averageCarbs,
            "percentage" => $carbPercentage
        ],
        "fats" => [
            "grams" => $averageFats,
            "percentage" => $fatPercentage
        ]
    ]
]);

?>