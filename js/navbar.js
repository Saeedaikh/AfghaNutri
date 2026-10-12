document.addEventListener("DOMContentLoaded", function () {

    // Get the user's profile information
    fetch("php/profile.php")
        .then(response => response.json())
        .then(data => {

            if (data.status === "success") {

                const user = data.user;

                const profilePicture = document.getElementById("sidebarProfilePicture");
                const sidebarUserName = document.getElementById("sidebarUserName");

                // Display the saved profile picture
                if (profilePicture && user.profile_picture) {
                    profilePicture.src = user.profile_picture;
                }

                // Display the user's username
                if (sidebarUserName) {
                    sidebarUserName.textContent = user.username;
                }
            }
        })
        .catch(error => {
            console.log("Navbar profile loading error:", error);
        });

});
