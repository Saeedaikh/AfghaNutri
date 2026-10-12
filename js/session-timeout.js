// SESSION INACTIVITY TIMEOUT
// Log the user out after 30 minutes of inactivity

const inactivityLimit = 30 * 60 * 1000; // 30 minutes
let inactivityTimer;

// Reset the inactivity timer
function resetInactivityTimer() {

    clearTimeout(inactivityTimer);

    inactivityTimer = setTimeout(function() {

        // Log the user out on the server
        fetch("php/logout.php", {
            method: "POST"
        })
        .then(response => response.json())
        .then(data => {

            if(data.status === "success") {
                window.location.href = "index.html";
            }

        })
        .catch(error => {

            console.log("Automatic logout error:", error);

            // Still send the user to the login page
            window.location.href = "index.html";

        });

    }, inactivityLimit);
}


// User activity that resets the timer
document.addEventListener("mousemove", resetInactivityTimer);
document.addEventListener("mousedown", resetInactivityTimer);
document.addEventListener("keydown", resetInactivityTimer);
document.addEventListener("scroll", resetInactivityTimer);
document.addEventListener("touchstart", resetInactivityTimer);


// Start the timer when the page loads
resetInactivityTimer();

