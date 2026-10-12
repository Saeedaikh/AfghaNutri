let activitySummaryData = null;
let activityLogData = null;


// 1. DISPLAY TODAY'S DATE
document.addEventListener("DOMContentLoaded", () => {

    const todayDate = document.getElementById("today-date");

    const today = new Date();

    const formattedDate = today.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    todayDate.append(formattedDate);
});


// 2. ACTIVITY PREVIEW SETUP
let selectedExercise = null;

document.addEventListener("DOMContentLoaded", () => {

    const activitySelect = document.getElementById("activity-select");
    const intensitySelect = document.getElementById("activity-intensity");
    const durationInput = document.getElementById("activity-duration");

    const previewActivityTitle = document.getElementById("preview-activity-title");
    const previewBurnedCalories = document.getElementById("preview-burned-calories");
    const previewEffort = document.getElementById("preview-effort");
    const previewMet = document.getElementById("preview-met");

    let exercises = [];
    let currentWeight = 0;

    // Load exercise data from database
    function loadExercises() {

        fetch("php/exercise_data.php")

        .then(response => response.json())
        .then(data => {

            if (data.status === "success") {
                exercises = data.exercises;

                populateActivityDropdown();
            }
            else {
                console.log("Exercise data error:", data.message);
            }
        })

        .catch(error => {

            console.log("Exercise data request error:", error);

            activitySelect.innerHTML = `
                <option value="" selected disabled>
                    Failed to load activities
                </option>
            `;
        });
    }

    // Load user's current weight
    function loadCurrentWeight() {

        fetch("php/get_current_weight.php")

        .then(response => response.json())
        .then(data => {

            if (data.status === "success") {
                currentWeight = data.weight;

                updateActivityPreview();
            }
            else {
                console.log("Current weight error:", data.message);
            }
        })

        .catch(error => {
            console.log("Weight data request error:", error);
        });
    }

    // Activity dropdown
    function populateActivityDropdown() {

        activitySelect.innerHTML = "";

        const activityNames = [...new Set(exercises.map(exercise => exercise.exercise_name))];
        activityNames.forEach(activityName => {

            const option = document.createElement("option");

            option.value = activityName;
            option.textContent = activityName;

            activitySelect.appendChild(option);
        });


        // Show the first activity automatically
        if (activityNames.length > 0) {

            activitySelect.value = activityNames[0];

            populateIntensityDropdown();
            updateActivityPreview();
        }
    }

    // Intensity dropdown
    function populateIntensityDropdown() {

        const selectedActivity = activitySelect.value;
        const activityExercises = exercises.filter(exercise => exercise.exercise_name === selectedActivity);

        intensitySelect.innerHTML = "";

        activityExercises.forEach(exercise => {
            const option = document.createElement("option");

            option.value = exercise.intensity;
            option.textContent = exercise.intensity.charAt(0).toUpperCase() + exercise.intensity.slice(1);

            intensitySelect.appendChild(option);
        });
    }

    // Update activity preview
    function updateActivityPreview() {

        const selectedActivity = activitySelect.value;
        const selectedIntensity = intensitySelect.value;

        selectedExercise = exercises.find(
            exercise =>
                exercise.exercise_name === selectedActivity &&
                exercise.intensity === selectedIntensity
        );

        if (!selectedExercise) {
            return;
        }

        // Duration
        const duration = Number(durationInput.value) || 0;

        // Activity name
        previewActivityTitle.textContent = selectedExercise.exercise_name;

        // MET value
        previewMet.textContent = selectedExercise.met_value;

        // Intensity
        if (selectedExercise.intensity === "light") {

            previewEffort.textContent = "Low";
        }
        else if (selectedExercise.intensity === "moderate") {

            previewEffort.textContent = "Moderate";
        }
        else if (selectedExercise.intensity === "vigorous") {

            previewEffort.textContent = "High";
        }

        // Calculate calories
        if (duration > 0 && currentWeight > 0) {

            const calories = (selectedExercise.met_value * 3.5 * currentWeight / 200) * duration;
            previewBurnedCalories.textContent = "- " + Math.round(calories) + " kcal";
        }
        else {
            previewBurnedCalories.textContent =
                "- -- kcal";
        }
    }

    // When user selects an activity
    activitySelect.addEventListener("change", () => {
        populateIntensityDropdown();
        updateActivityPreview();
    });

    // When user selects an intensity
    intensitySelect.addEventListener("change", () => {
        updateActivityPreview();
    });

    // When user enters duration
    durationInput.addEventListener("input", () => {
        updateActivityPreview();
    });


    // Start
    loadExercises();
    loadCurrentWeight();
});


// 3. ADD ACTIVITY TO ACTIVITY LOG
const activityForm = document.getElementById("activity-log-form");

activityForm.addEventListener("submit", (event) => {

    event.preventDefault();

    if (!selectedExercise) {
        showPopup("Activity Required", "Please select an activity and intensity.");
        return;
    }

    const duration = Number( document.getElementById("activity-duration").value);

    // Check today's weight before adding activity
    fetch("php/get_current_weight.php")

    .then(response => response.json())
    .then(data => {

        if (data.status !== "success") {

            console.log("Today's weight error:", data.message);
            showPopup("Weight Required", "Please enter your current weight for today in the Meal Log page before logging an activity.");

            return;
        }

        const activityData = {
            exercise_id: selectedExercise.exercise_id,
            duration_minutes: duration,
            intensity: selectedExercise.intensity
        };

        fetch("php/activity_log.php", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(activityData)
        })

        .then(response => response.json())
        .then(data => {

            if (data.status === "success") {

                showPopup("Activity Added!", "Your activity has been added successfully.");

                activityForm.reset();

                loadActivitySummary();
                loadActivities();

            }
            else {
                showPopup( "Unable to Add Activity", data.message
                );
            }
        })

        .catch(error => {
            console.log("Activity request error:", error);
            showPopup("Something Went Wrong", "We could not add the activity. Please try again.");
        });
    })

    .catch(error => {
        console.log("Today's weight check error:", error);
        showPopup( "Something Went Wrong", "We could not check your current weight. Please try again.");
    });
});



// 4. LOAD DAILY ACTIVITY SUMMARY
function loadActivitySummary() {

    const summaryActiveTime = document.getElementById("summary-active-time");
    const summaryTotalBurned = document.getElementById("summary-total-burned");
    const chartTotalBurned = document.getElementById("chart-total-burned");

    fetch("php/get_daily_activity_summary.php")

    .then(response => response.json())
    .then(data => {

        if (data.status !== "success") {
            console.log("Activity summary error:", data.message);
            return;
        }

        activitySummaryData = data;

        // Active time
        summaryActiveTime.innerHTML = data.total_active_time + " <small>mins</small>";

        // Total calories burned
        summaryTotalBurned.innerHTML = data.total_burned + " <small>kcal</small>";

        // Chart total
        chartTotalBurned.textContent = data.total_burned + " kcal";

        // Update chart
        updateActivityPieChart(data.distribution);
        updateActivityLegend(data.distribution);

        // Update daily insights
        generateActivityInsights();
    })

    .catch(error => {
        console.log("Activity summary request error:",error);
    });
}


// 5. LOAD TODAY'S LOGGED ACTIVITIES
function loadActivities() {

    const activityCount = document.getElementById("activity-count");
    const activitiesItemsRoot = document.getElementById("activities-items-root");

    fetch("php/get_daily_activity_log.php")

    .then(response => response.json())
    .then(data => {
        if (data.status !== "success") {
            console.log("Activity list error:", data.message);
            return;
        }

        activityLogData = data;
        const activities = data.activities;

        // Activity count
        const count = activities.length;
        activityCount.textContent = count + (count === 1 ? " Item Active" : " Items Active");

        // Clear existing activities
        activitiesItemsRoot.innerHTML = "";

        // Display each activity
        activities.forEach(activity => {

            const activityItem = document.createElement("article");
            activityItem.className = "logged-exercise-row-item";
            activityItem.innerHTML = `
                <div class="item-primary-row">

                    <div class="item-identity">
                        <h4>${activity.exercise_name}</h4>
                        <p class="time-session-metric">
                            ${activity.duration_minutes} Min Session
                            •
                            <span class="highlight-cal">
                                ${activity.calories_burned} kcal
                            </span>
                        </p>
                    </div>

                    <button
                        type="button"
                        class="log-item-delete-btn"
                        aria-label="Delete entry">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>

                <div class="intensity-pill-row">
                    <span class="intensity-pill ${activity.intensity}">
                        ${
                            activity.intensity.charAt(0).toUpperCase() +
                            activity.intensity.slice(1)
                        }
                        Intensity
                    </span>
                </div>
            `;

            activitiesItemsRoot.appendChild(activityItem);

            // Delete activity
            const deleteButton = activityItem.querySelector(".log-item-delete-btn");

            deleteButton.addEventListener("click", () => {
                deleteActivity(activity.activity_log_id);
            });
        });

        // Update daily insights
        generateActivityInsights();
    })

    .catch(error => {
        console.log("Activity list request error:", error);
    });
}


// 6. DELETE ACTIVITY LOG
function deleteActivity(activityLogId) {

    showConfirmation( "Delete Activity?", "Are you sure you want to delete this activity?",
        function() {

            fetch("php/delete_activity_log.php", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    activity_log_id: activityLogId
                })
            })

            .then(response => response.json())
            .then(data => {

                if (data.status !== "success") {
                    showPopup("Delete Failed", data.message);
                    return;
                }

                showPopup("Activity Deleted!", "The activity has been deleted successfully.");

                // Reload activity list
                loadActivities();

                // Reload activity summary
                loadActivitySummary();
            })
            .catch(error => {

                console.log("Delete activity request error:", error);
                showPopup( "Something Went Wrong", "We could not delete the activity. Please try again."
                );
            });
        }
    );
}


// 7. UPDATE ACTIVITY PIE CHART
function updateActivityPieChart(distribution) {

    const pieChart = document.getElementById("activity-pie-chart");

    if (!distribution || distribution.length === 0) {

        pieChart.style.background = "var(--primary-light)";
        return;
    }

    const chartColors = [
        "#ea740c",
        "#fbbf24",
        "#f59e0b",
        "#ea8a14",
        "#d97706"
    ];

    let gradientParts = [];
    let currentPercentage = 0;


    distribution.forEach((activity, index) => {

        const percentage = Number(activity.percentage);
        const start = currentPercentage;
        const end = currentPercentage + percentage;
        const color = chartColors[index % chartColors.length];
        gradientParts.push( `${color} ${start}% ${end}%`);

        currentPercentage = end;
    });

    pieChart.style.background = `conic-gradient(${gradientParts.join(", ")})`;
}


// 8. UPDATE ACTIVITY LEGEND
function updateActivityLegend(distribution) {

    const legend = document.getElementById("activity-chart-legend");
    legend.innerHTML = "";

    if (!distribution || distribution.length === 0) {
        return;
    }

    const chartColors = [
        "#ea740c",
        "#fbbf24",
        "#f59e0b",
        "#ea8a14",
        "#d97706"
    ];

    distribution.forEach((activity, index) => {

        const legendItem = document.createElement("li");
        legendItem.className = "legend-item";
        const color = chartColors[index % chartColors.length];

        legendItem.innerHTML = `
            <span
                class="legend-indicator"
                style="background-color: ${color};">
            </span>

            <span class="legend-label">
                ${activity.exercise_name}
            </span>

            <strong class="legend-value">
                ${Math.round(
                    Number(activity.percentage)
                )}%
            </strong>`;

        legend.appendChild(legendItem);
    });
}


// 9. GENERATE DAILY ACTIVITY INSIGHTS

function generateActivityInsights() {

    // Wait until both data sources are loaded
    if (!activitySummaryData || !activityLogData) {
        return;
    }

    const insightsList = document.getElementById("activity-insights-list");

    if (!insightsList) {
        return;
    }

    const activities = activityLogData.activities || [];
    const totalActiveTime = Number(activitySummaryData.total_active_time) || 0;
    const totalBurned = Number(activitySummaryData.total_burned) || 0;
    const insights = [];


    // NO ACTIVITY LOGGED
    if (activities.length === 0) {
        insights.push({
            priority: 3,
            type: "info",
            icon: "fa-circle-info",
            message: "You haven't logged any physical activity today. Start with a short activity when you're ready."
        });

    }
    else {
        // ACTIVE TIME
        if (totalActiveTime < 15) {
            insights.push({
                priority: 3,
                type: "warning",
                icon: "fa-triangle-exclamation",
                message: "You've been active for less than 15 minutes today. A little more movement can help you stay active."
            });

        }
        else if (totalActiveTime < 30) {
            insights.push({
                priority: 2,
                type: "info",
                icon: "fa-circle-info",
                message: "You've already added some movement to your day. Consider a little more activity if you can."
            });
        }
        else {
            insights.push({
                priority: 1,
                type: "success",
                icon: "fa-circle-check",
                message:
                    "Great job! You've accumulated 30 or more active minutes today."
            });
        }


        // CALORIES BURNED
        if (totalBurned > 0 && totalBurned < 100) {
            insights.push({
                priority: 2,
                type: "info",
                icon: "fa-circle-info",
                message: `You've burned ${Math.round(totalBurned)} kcal through logged activity today. Every bit of movement counts.`
            });
        }
        else if (totalBurned >= 100) {
            insights.push({
                priority: 1,
                type: "success",
                icon: "fa-circle-check",
                message: `You've burned ${Math.round(totalBurned)} kcal through physical activity today. Great work staying active.`
            });
        }


        // INTENSITY
        const intensities = activities.map(activity =>
            String(activity.intensity).toLowerCase()
        );

        const hasLight = intensities.includes("light");
        const hasModerate = intensities.includes("moderate");
        const hasVigorous = intensities.includes("vigorous");

        if (hasLight && !hasModerate && !hasVigorous) {

            insights.push({
                priority: 2,
                type: "info",
                icon: "fa-circle-info",
                message: "Most of your activity today has been at a light intensity. Consider adding some moderate activity when appropriate."
            });
        }
        else if (hasModerate) {
            insights.push({
                priority: 1,
                type: "success",
                icon: "fa-circle-check",
                message: "You've included moderate-intensity activity today. Keep it up!"
            });
        }
        else if (hasVigorous) {
            insights.push({
                priority: 1,
                type: "success",
                icon: "fa-circle-check",
                message: "You've included vigorous activity today. Remember to give your body enough time to recover."
            });
        }

        // ACTIVITY VARIETY
        const activityTypes = new Set(
            activities.map(activity => activity.exercise_name)
        );

        if (activityTypes.size >= 2) {
            insights.push({
                priority: 1,
                type: "success",
                icon: "fa-circle-check",
                message: `You've included ${activityTypes.size} different activities today, adding variety to your movement.`
            });
        }
    }


    // SORT BY PRIORITY
    insights.sort((a, b) => b.priority - a.priority);

    // SHOW ONLY TOP 3
    const topInsights = insights.slice(0, 3);

    // DISPLAY INSIGHTS
    insightsList.innerHTML = "";

    topInsights.forEach(insight => {

        const li = document.createElement("li");

        li.className = `insight-item insight-${insight.type}`;
        li.innerHTML = `
            <i class="fa-solid ${insight.icon}"></i>
            <p>${insight.message}</p>
        `;
        insightsList.appendChild(li);
    });
}

// 10. LOAD DATA WHEN PAGE LOADS
document.addEventListener("DOMContentLoaded", () => {
    loadActivitySummary();
    loadActivities();

});