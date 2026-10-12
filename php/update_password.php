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

$oldPassword = $data["oldPassword"] ?? "";
$newPassword = $data["newPassword"] ?? "";

// Check that both passwords were provided
if (empty($oldPassword) || empty($newPassword)) {
    echo json_encode([
        "status" => "error",
        "message" => "Please enter all password fields."
    ]);
    exit();
}

// Get current password from database
$passwordSQL = "SELECT password
                FROM `user`
                WHERE user_id = ?";

$passwordStmt = $conn->prepare($passwordSQL);
$passwordStmt->bind_param("i", $userID);
$passwordStmt->execute();

$passwordResult = $passwordStmt->get_result();

if ($passwordResult->num_rows === 0) {
    echo json_encode([
        "status" => "error",
        "message" => "User not found."
    ]);
    exit();
}

$user = $passwordResult->fetch_assoc();

$storedPassword = $user["password"];

// Check old password
if (!password_verify($oldPassword, $storedPassword)) {
    echo json_encode([
        "status" => "error",
        "message" => "Old password is incorrect."
    ]);
    exit();
}

// Hash new password
$newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);

// Update password
$updateSQL = "UPDATE `user`
              SET password = ?
              WHERE user_id = ?";

$updateStmt = $conn->prepare($updateSQL);
$updateStmt->bind_param("si", $newPasswordHash, $userID);

if ($updateStmt->execute()) {

    echo json_encode([
        "status" => "success",
        "message" => "Password updated successfully."
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to update password."
    ]);
}

?>