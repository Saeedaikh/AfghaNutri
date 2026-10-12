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


// Get JSON data
$data = json_decode(file_get_contents("php://input"), true);


// Check activity ID
if (!isset($data["activity_log_id"])) {

    echo json_encode([
        "status" => "error",
        "message" => "Activity ID is missing."
    ]);
    exit();
}


// Get activity ID
$activity_log_id = (int) $data["activity_log_id"];


// Delete activity
$sql = "DELETE FROM activity_log
        WHERE activity_log_id = ?
        AND user_id = ?";

$statement = $conn->prepare($sql);
$statement->bind_param(
    "ii",
    $activity_log_id,
    $user_id
);


// Execute delete
if (!$statement->execute()) {

    echo json_encode([
        "status" => "error",
        "message" => "Failed to delete activity."
    ]);
    exit();
}


// Check whether an activity was actually deleted
if ($statement->affected_rows === 0) {

    echo json_encode([
        "status" => "error",
        "message" => "Activity not found."
    ]);

    exit();
}


// Return success
echo json_encode([
    "status" => "success",
    "message" => "Activity deleted successfully."
]);

?>
