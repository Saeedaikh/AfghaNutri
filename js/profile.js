// 1. HORIZONTAL TOGGLE ROUTER
function switchProfileTab(targetId, btnElement) {

    document.querySelectorAll('.profile-section-card').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    btnElement.classList.add('active');
}


// 2. LOAD PROFILE INFORMATION
function loadProfile() {

    fetch("php/profile.php", {
        method: "GET"
    })

    .then(response => response.json())
    .then(data => {

        if(data.status === "success") {

            const user = data.user;
            const goal = data.goal;

            // Load saved profile picture
            if(user.profile_picture) {
                document.getElementById("profilePicture").src = user.profile_picture;
                document.getElementById("sidebarProfilePicture").src = user.profile_picture;
            }

            document.getElementById("profileName").value = user.username;
            document.getElementById("profileEmail").value = user.email;
            document.getElementById("profileGender").value = user.gender;
            document.getElementById("profileAge").value = user.age;
            document.getElementById("profileHeight").value = user.height_cm;

            // Start weight
            if(goal) {
                document.getElementById("profileWeight").value = goal.start_weight;
            }

            // Sidebar username
            document.getElementById("sidebarUserName").textContent = user.username;

            // Active goal
            if(goal) {
                document.getElementById("profileGoal").value = goal.goal_type;
                document.getElementById("profileTargetWeight").value = goal.target_weight;
                document.getElementById("profileTimePeriod").value = goal.time_period;

                // Select the current goal
                document.querySelectorAll(".profile-goal-card").forEach(card => card.classList.remove("selected"));
                const goalCards = document.querySelectorAll(".profile-goal-card");

                if(goal.goal_type === "Lose") {
                    goalCards[0].classList.add("selected");
                }
                else if(goal.goal_type === "Gain") {
                    goalCards[1].classList.add("selected");
                }
                else if(goal.goal_type === "Maintain") {
                    goalCards[2].classList.add("selected");
                }

                // Update quick statistics
                const quickStats = document.querySelectorAll(".quick-stat-info strong");

                if(quickStats.length >= 2) {

                    if(goal.goal_type === "Lose") {
                        quickStats[0].textContent = "Lose Weight";
                    }
                    else if(goal.goal_type === "Gain") {
                        quickStats[0].textContent = "Gain Weight";
                    }
                    else {
                        quickStats[0].textContent = "Maintain Weight";
                    }
                    quickStats[1].textContent = goal.target_weight + " kg";
                }
            }
        }
        else {
            console.log(data.message);
        }
    })
    .catch(error => {
        console.log("Profile loading error:", error);
    });
}


// 2B. PROFILE PICTURE

// OPEN FILE PICKER WHEN CAMERA BUTTON IS CLICKED
document.getElementById("profilePictureEdit").addEventListener("click", function() {
    document.getElementById("profilePictureInput").click();
});

// HANDLE PROFILE PICTURE SELECTION AND UPLOAD
document.getElementById("profilePictureInput").addEventListener("change", function() {

    const file = this.files[0];

    if(!file) {
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    if(!allowedTypes.includes(file.type)) {
        showPopup("Invalid Image", "Please select a JPG, PNG, or WEBP image.");
        this.value = "";
        return;
    }

    if(file.size > 5 * 1024 * 1024) {
        showPopup("Image Too Large", "Please select an image smaller than 5 MB.");
        this.value = "";
        return;
    }

    // Show image preview
    const imageURL = URL.createObjectURL(file);

    document.getElementById("profilePicture").src = imageURL;
    document.getElementById("sidebarProfilePicture").src = imageURL;

    // Create form data
    const formData = new FormData();
    formData.append("profile_picture", file);

    fetch("php/upload_profile_picture.php", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {

        if(data.status === "success") {

            // Use the actual saved image path
            document.getElementById("profilePicture").src = data.profile_picture;
            document.getElementById("sidebarProfilePicture").src = data.profile_picture;
            showPopup("Profile Picture Updated!", data.message);
        }
        else {
            showPopup("Upload Failed", data.message);

            // Reload the original saved picture
            loadProfile();
        }
    })
    .catch(error => {
        console.log("Profile picture upload error:", error);
        showPopup("Upload Failed", "Something went wrong while uploading your profile picture.");
        loadProfile();
    });
});


// 3. UPDATE ACCOUNT DETAILS
document.getElementById("accountDetailsForm").addEventListener("submit", function(event) {

    event.preventDefault();

    const username = document.getElementById("profileName").value.trim();
    const email = document.getElementById("profileEmail").value.trim();
    const age = document.getElementById("profileAge").value;
    const height = document.getElementById("profileHeight").value;
    const startWeight = document.getElementById("profileWeight").value;

    clearFieldError("profileEmail", "profileEmailError");

    const emailFilter = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailFilter.test(email)) {

        showFieldError(
            "profileEmail",
            "profileEmailError",
            "Please enter a valid email address."
        );
        return;
    }

    const profileData = {
        username: username,
        email: email,
        age: age,
        height: height,
        start_weight: startWeight
    };

    fetch("php/update_profile.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(profileData)
    })
    .then(response => response.json())
    .then(data => {

        if(data.status === "success") {

            clearFieldError("profileEmail", "profileEmailError");
            showPopup("Profile Updated!", data.message)
            loadProfile();
        }
        else {
            if(data.message === "This email is already being used by another account.") {
                showFieldError("profileEmail", "profileEmailError", data.message);
            }
            else {
                showPopup("Update Failed", data.message);
            }
        }
    })

    .catch(error => {
        console.log("Profile update error:", error);
    });
});


// 4. CHANGE PASSWORD
document.getElementById("changePasswordForm").addEventListener("submit", function(event) {

    event.preventDefault();

    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("accountPassword").value;
    const confirmPassword = document.getElementById("accountPasswordConfirm").value;

    clearFieldError("oldPassword", "oldPasswordError");
    clearFieldError("accountPassword", "accountPasswordError");
    clearFieldError("accountPasswordConfirm", "accountPasswordConfirmError");

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if(!passwordPattern.test(newPassword)) {
        showFieldError("accountPassword", "accountPasswordError", "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.");
        return;
    }
    if(newPassword !== confirmPassword) {
        showFieldError("accountPasswordConfirm", "accountPasswordConfirmError", "New password and confirm password do not match.");
        return;
    }

    fetch("php/update_password.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            oldPassword: oldPassword,
            newPassword: newPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === "success") {
            clearFieldError("oldPassword", "oldPasswordError");
            clearFieldError("accountPassword", "accountPasswordError");
            clearFieldError("accountPasswordConfirm", "accountPasswordConfirmError");

            // Reset form
            document.getElementById("changePasswordForm").reset();

            showPopup("Password Updated!", data.message);
        }
        else {
            if(
                data.message === "Old password is incorrect.") {
                showFieldError("oldPassword", "oldPasswordError", data.message);
            }
            else {
                showPopup("Password Update Failed", data.message);
            }
        }
    })
    .catch(error => {
        console.log("Password update error:", error);
    });
});


// 5. UPDATE GOAL
document.getElementById("goalForm").addEventListener("submit", function(event) {

    event.preventDefault();
    const goalType = document.getElementById("profileGoal").value;
    const targetWeight = document.getElementById("profileTargetWeight").value;
    const timePeriod= document.getElementById("profileTimePeriod").value;

    clearFieldError("profileTargetWeight", "profileTargetWeightError");
    clearFieldError("profileTimePeriod", "profileTimePeriodError");

    if(!goalType) {
        showPopup("Goal Required", "Please select a health goal before updating your goals.");
        return;
    }

    const currentWeight = Number(document.getElementById("profileWeight").value);

    // Target weight validation
    if(!targetWeight || Number(targetWeight) < 20 || Number(targetWeight) > 300) {
        showFieldError("profileTargetWeight", "profileTargetWeightError", "Please enter a valid target weight.");
        return;
    }

    // Goal-based target validation
    if(goalType === "Lose" && Number(targetWeight) >= currentWeight) {
        showFieldError("profileTargetWeight", "profileTargetWeightError", "Target weight should be lower than your current weight.");
        return;
    }
    if(goalType === "Gain" && Number(targetWeight) <= currentWeight) {
        showFieldError("profileTargetWeight", "profileTargetWeightError", "Target weight should be higher than your current weight.");
        return;
    }
    if(goalType === "Maintain" && Math.abs(Number(targetWeight) - currentWeight) > 2) {
        showFieldError("profileTargetWeight", "profileTargetWeightError", "Choose a target close to your current weight.");
        return;
    }

    // Time period validation
    if(!timePeriod || Number(timePeriod) < 1 || Number(timePeriod) > 60) {
        showFieldError("profileTimePeriod", "profileTimePeriodError", "Please enter a valid time period between 1 and 60 months.");
        return;
    }

    fetch("php/update_goal.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            goalType: goalType,
            targetWeight: targetWeight,
            timePeriod: timePeriod
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);

        if(data.status === "success") {
            clearFieldError("profileTargetWeight", "profileTargetWeightError");
            clearFieldError("profileTimePeriod", "profileTimePeriodError");

            showPopup("Goals Updated!", data.message);

            loadProfile();
        }
        else {
            // Show server-side errors in popup
            showPopup("Goal Update Failed", data.message);
        }
    })
    .catch(error => {
        console.log("Goal update error:", error);
    });
});


// 6. SELECT GOAL
document.querySelectorAll(".profile-goal-card").forEach(function(card, index) {

    card.addEventListener("click", function() {
        document.querySelectorAll(".profile-goal-card").forEach(card => card.classList.remove("selected"));
        card.classList.add("selected");

        if(index === 0) {
            document.getElementById("profileGoal").value = "Lose";
        }
        else if(index === 1) {
            document.getElementById("profileGoal").value = "Gain";
        }
        else if(index === 2) {
            document.getElementById("profileGoal").value = "Maintain";
        }

        // Show health recommendation
        showProfileGoalRecommendation();

        // Re-check target weight
        checkProfileTargetWeight();
    });
});


// 7. DELETE ACCOUNT
// SHOW DELETE ACCOUNT CONFIRMATION
document.getElementById("deleteAccountBtn").addEventListener("click", function() {
    showConfirmation(
        "Delete Account?",
        "Are you sure you want to permanently delete your account? This action cannot be undone.",
        deleteAccount
    );
});

// DELETE ACCOUNT
function deleteAccount() {

    fetch("php/delete_account.php", {
        method: "POST"
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === "success") {
            showPopup("Account Deleted!", data.message);
            setTimeout(function() {
                window.location.href = "index.html";
            }, 1500);
        }
        else {
            showPopup("Delete Failed", data.message);
        }
    })
    .catch(error => {
        console.log("Delete account error:", error);
        showPopup("Delete Failed", "Something went wrong. Please try again.");
    });
}


// 9. LOGOUT ROUTE
function handleLogout() {

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
        console.log("Logout error:", error);
    });
}


// 10. FIELD ERROR
// SHOW FIELD ERROR
function showFieldError(inputId, errorId, message) {

    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);

    const inputField = input.closest(".input-icon-field");

    inputField.classList.add("has-error");

    error.textContent = message;
    error.classList.add("show");
}

// CLEAR FIELD ERROR
function clearFieldError(inputId, errorId) {

    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);

    const inputField = input.closest(".input-icon-field");

    inputField.classList.remove("has-error");

    error.textContent = "";
    error.classList.remove("show");
}


// 11. SHOW GOAL RECOMMENDATION
function showProfileGoalRecommendation() {

    const goal = document.getElementById("profileGoal").value;
    const height = Number(document.getElementById("profileHeight").value);
    const weight = Number(document.getElementById("profileWeight").value);
    const recommendation = document.getElementById("goalRecommendation");

    // Clear previous recommendation
    recommendation.textContent = "";
    recommendation.style.display = "none";

    // Cannot calculate BMI without height and weight
    if(!height || !weight || !goal) {
        return;
    }

    // BMI calculation
    const heightMeter = height / 100;
    const bmi = weight / (heightMeter * heightMeter);

    // Underweight + Lose
    if(bmi < 18.5 && goal === "Lose") {
        recommendation.textContent = "Your BMI suggests you may be underweight. Consider maintaining or gaining weight instead.";
        recommendation.style.display = "block";
    }

    // Overweight + Gain
    else if(bmi > 25 && goal === "Gain") {
        recommendation.textContent = "Your BMI suggests you may already be above a healthy weight range. Consider maintaining or losing weight instead.";
        recommendation.style.display = "block";
    }
}


// 12. CHECK PROFILE TARGET WEIGHT
function checkProfileTargetWeight() {
    const targetWeight = document.getElementById("profileTargetWeight");
    const goal = document.getElementById("profileGoal").value;
    const currentWeight = Number(document.getElementById("profileWeight").value);

    clearFieldError("profileTargetWeight", "profileTargetWeightError");

    if(!targetWeight.value) {
        return;
    }

    if(goal === "Lose" && Number(targetWeight.value) >= currentWeight) {
        showFieldError("profileTargetWeight", "profileTargetWeightError", "Target weight should be lower than your current weight.");
    }
    else if(goal === "Gain" && Number(targetWeight.value) <= currentWeight) {
        showFieldError("profileTargetWeight", "profileTargetWeightError", "Target weight should be higher than your current weight.");
    }
    else if(goal === "Maintain" && Math.abs(Number(targetWeight.value) - currentWeight) > 2) {
        showFieldError("profileTargetWeight", "profileTargetWeightError", "Choose a target close to your current weight."
        );
    }

    // Update recommendation
    showProfileTargetRecommendation();
}


// 13. SHOW TARGET RECOMMENDATION
function showProfileTargetRecommendation() {
    const currentWeight = Number(document.getElementById("profileWeight").value);
    const targetWeight = Number(document.getElementById("profileTargetWeight").value);
    const timePeriod = Number(document.getElementById("profileTimePeriod").value);
    const goal = document.getElementById("profileGoal").value;
    const recommendation = document.getElementById("goalRecommendation");

    // Clear recommendation
    recommendation.textContent = "";
    recommendation.style.display = "none";

    if(!currentWeight || !targetWeight || !timePeriod || !goal) {
        return;
    }

    // Do not recommend if target itself is invalid
    if(
        (goal === "Lose" && targetWeight >= currentWeight) ||
        (goal === "Gain" && targetWeight <= currentWeight) ||
        (goal === "Maintain" && Math.abs(targetWeight - currentWeight) > 2
        )
    ) {
        return;
    }

    // Calculate monthly weight change
    const weightDifference = Math.abs(currentWeight - targetWeight);
    const monthlyChange = weightDifference / timePeriod;

    if(goal === "Lose" && monthlyChange > 4) {
        recommendation.textContent = "Your weight loss goal may be too fast. Consider choosing a longer time period.";
        recommendation.style.display = "block";
    }
    else if(goal === "Gain" && monthlyChange > 2) {
        recommendation.textContent = "Your weight gain goal may be too fast. Consider choosing a longer time period.";
        recommendation.style.display = "block";
    }
    else {
        recommendation.textContent = "Your target looks good for your goal and timeline.";
        recommendation.style.display = "block";
    }
}


// 14. REAL TIME INPUT VALIDATION
// CLEAR EMAIL ERROR WHILE USER TYPES
document.getElementById("profileEmail").addEventListener("input", function() {
    clearFieldError("profileEmail", "profileEmailError");
});

// CLEAR PASSWORD ERROR WHILE USER TYPES
document.getElementById("oldPassword").addEventListener("input", function() {
    clearFieldError("oldPassword", "oldPasswordError");
});
document.getElementById("accountPassword").addEventListener("input", function() {
    clearFieldError("accountPassword", "accountPasswordError");
});
document.getElementById("accountPasswordConfirm").addEventListener("input", function() {
    clearFieldError("accountPasswordConfirm", "accountPasswordConfirmError");
});

// TARGET WEIGHT REAL-TIME VALIDATION
document.getElementById("profileTargetWeight").addEventListener("input", function() {
    checkProfileTargetWeight();
});

// TIME PERIOD REAL-TIME RECOMMENDATION
document.getElementById("profileTimePeriod").addEventListener("input", function() {
    clearFieldError("profileTimePeriod", "profileTimePeriodError");
    showProfileTargetRecommendation();
});


// 15. LOAD PROFILE WHEN PAGE OPENS
window.addEventListener("DOMContentLoaded", function() {
    loadProfile();
});
