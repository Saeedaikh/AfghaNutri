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

$userID = $_SESSION["user_id"];

// Check if image was uploaded
if (!isset($_FILES["profile_picture"])) {

    echo json_encode([
        "status" => "error",
        "message" => "No profile picture was uploaded."
    ]);
    exit();
}

$file = $_FILES["profile_picture"];


// Check for upload errors
if ($file["error"] !== UPLOAD_ERR_OK) {

    echo json_encode([
        "status" => "error",
        "message" => "There was a problem uploading the image."
    ]);
    exit();
}

// Check files size (Maximum: 5 MB)
$maxFileSize = 5 * 1024 * 1024;

if ($file["size"] > $maxFileSize) {

    echo json_encode([
        "status" => "error",
        "message" => "The image must be smaller than 5 MB."
    ]);
    exit();
}

// Check image type
$allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

$imageInfo = getimagesize($file["tmp_name"]);

if ($imageInfo === false) {

    echo json_encode([
        "status" => "error",
        "message" => "The uploaded file is not a valid image."
    ]);
    exit();
}

$fileType = $imageInfo["mime"];

if (!in_array($fileType, $allowedTypes)) {

    echo json_encode([
        "status" => "error",
        "message" => "Only JPG, PNG, and WEBP images are allowed."
    ]);
    exit();
}

// Create upload directory
$uploadDirectory = "../uploads/profile_pictures/";

if (!is_dir($uploadDirectory)) {
    mkdir($uploadDirectory, 0755, true);
}

// Create unique file name
$extension = "";

if ($fileType === "image/jpeg") {
    $extension = "jpg";
}
else if ($fileType === "image/png") {
    $extension = "png";
}
else if ($fileType === "image/webp") {
    $extension = "webp";
}

$fileName = "user_" . $userID . "_" . time() . "." . $extension;

$filePath = $uploadDirectory . $fileName;

// Move image to upload directory
if (!move_uploaded_file($file["tmp_name"], $filePath)) {

    echo json_encode([
        "status" => "error",
        "message" => "Failed to save the profile picture."
    ]);
    exit();
}

// Save image path in database
$databasePath = "uploads/profile_pictures/" . $fileName;

$updateSQL = "UPDATE `user`
              SET profile_picture = ?
              WHERE user_id = ?";

$updateStmt = $conn->prepare($updateSQL);

$updateStmt->bind_param(
    "si",
    $databasePath,
    $userID
);

if (!$updateStmt->execute()) {

    // Delete uploaded file if database update fails
    if (file_exists($filePath)) {
        unlink($filePath);
    }
    echo json_encode([
        "status" => "error",
        "message" => "The image was uploaded, but the database could not be updated."
    ]);
    exit();
}

// Return success
echo json_encode([
    "status" => "success",
    "message" => "Profile picture updated successfully.",
    "profile_picture" => $databasePath
]);

?>