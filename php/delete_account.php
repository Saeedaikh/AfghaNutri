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


// Delete user account
$deleteSQL = "DELETE FROM `user`
              WHERE user_id = ?";

$deleteStmt = $conn->prepare($deleteSQL);
$deleteStmt->bind_param("i", $userID);

if ($deleteStmt->execute()) {

    // Destroy session
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            "",
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    session_destroy();
    
    echo json_encode([
        "status" => "success",
        "message" => "Account deleted successfully."
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to delete account."
    ]);
}

?>