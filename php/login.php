<?php

session_start();

require_once "../config/database.php";
header("Content-Type: application/json");


// Check if the request is a POST request
if($_SERVER["REQUEST_METHOD"] == "POST"){

    // Get login data from the request
    $data = json_decode(file_get_contents("php://input"), true);

    $email = $data["email"];
    $password = $data["password"];


    // Find the user by email
    $sql = "SELECT * FROM user WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();

    $result = $stmt->get_result();


    // Check if the email exists
    if($result->num_rows > 0){

        $user = $result->fetch_assoc();


        // Verify the user's password
        if(password_verify($password, $user["password"])){

            // Save logged-in user information in session
            $_SESSION["user_id"] = $user["user_id"];
            $_SESSION["username"] = $user["username"];
            $_SESSION["email"] = $user["email"];

            echo json_encode([
                "status"=>"success",
                "message"=>"Login successful",
            ]);
        }
        else{

            echo json_encode([
                "status"=>"error",
                "message"=>"Incorrect password"
            ]);
        }
    }
    else{

        echo json_encode([
            "status"=>"error",
            "message"=>"Email not found"
        ]);
    }
}

?>