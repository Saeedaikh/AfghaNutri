<?php

session_start();

require "../config/database.php";

header("Content-Type: application/json");


// Check login
if (!isset($_SESSION["user_id"])) {
    echo json_encode([
        "status" => "error",
        "message" => "User not logged in"
    ]);
    exit;
}


// Get user ID
$user_id = $_SESSION["user_id"];


// Get the user's latest weight
$sql = "SELECT current_weight 
        FROM weight_log 
        WHERE user_id = ? 
        AND record_date = CURDATE()
        LIMIT 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();


// Check if a weight record was found
if ($result->num_rows > 0) {

    $row = $result->fetch_assoc();

    echo json_encode([
        "status" => "success",
        "weight" => (float)$row["current_weight"]
    ]);
}
else {

    echo json_encode([
        "status" => "error",
        "message" => "No weight record found!"
    ]);
}

$stmt->close();
$conn->close();

?>