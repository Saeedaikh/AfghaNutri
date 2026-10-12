// 1. DISPLAY AND SELECT DATE
const datePicker = flatpickr("#log-date-picker", {
    dateFormat: "d F Y",
    defaultDate: "today",
    maxDate: "today",
    onChange: function(selectedDates) {
        loadDashboardData(selectedDates[0]);
    }
});


// 2. CLEAR DASHBOARD DATA
function clearDashboardData() {

    document.getElementById("goal-type").textContent = "--";
    document.getElementById("goal-amount").textContent = "--";
    document.getElementById("current-weight").textContent = "--";
    document.getElementById("target-weight").textContent = "--";
    document.getElementById("goal-timeframe").textContent = "--";

    document.getElementById("weight-progress").textContent = "--";
    document.getElementById("weight-progress-label").textContent = "Complete";
    document.getElementById("weight-remaining").textContent = "--";
    document.getElementById("weight-remaining-label").textContent = "remaining";

    document.getElementById("calories-remaining").textContent = "--";
    document.getElementById("calories-consumed").textContent = "--";
    document.getElementById("calories-consumed-percent").textContent = "--";
    document.getElementById("calories-remaining-legend").textContent = "--";
    document.getElementById("calories-remaining-percent").textContent = "--";

    document.getElementById("calorie-goal").textContent = "--";
    document.getElementById("calorie-consumed-breakdown").textContent = "--";
    document.getElementById("calorie-remaining-breakdown").textContent = "--";
    document.getElementById("calorie-burned").textContent = "--";

    document.getElementById("protein-consumed").textContent = "--";
    document.getElementById("protein-goal").textContent = "--";
    document.getElementById("carbs-consumed").textContent = "--";
    document.getElementById("carbs-goal").textContent = "--";
    document.getElementById("fat-consumed").textContent = "--";
    document.getElementById("fat-goal").textContent = "--";

    document.getElementById("water-consumed").textContent = "--";
    document.getElementById("water-goal").textContent = "--";
    document.getElementById("water-percent").textContent = "--";

    document.getElementById("activity-duration").textContent = "--";
    document.getElementById("activity-calories-burned").textContent = "--";

    // Reset progress bars
    document.getElementById("weight-progress-bar").style.width = "0%";
    document.getElementById("weight-progress-bar").style.display = "block";

    document.getElementById("macro-bar-protein").style.width = "0%";
    document.getElementById("macro-bar-carbs").style.width = "0%";
    document.getElementById("macro-bar-fat").style.width = "0%";

    document.getElementById("water-progress").style.height = "0%";

    // Reset calorie overview pie chart
    document.getElementById("calorie-progress-circle").setAttribute("stroke-dasharray", "0, 100");

    // Clear existing insights
    document.getElementById("insights-list").innerHTML = "";
}


// 3. GET DASHBOARD DATA
function loadDashboardData(selectedDate) {
    clearDashboardData();

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    fetch("php/get_dashboard_data.php", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({date: formattedDate})
    })

    .then(response => response.json())
    .then(data => {

        console.log(data);
        if (data.status === "success") {

            document.getElementById("username").textContent = data.user.username;

            // 1. Display goal information
            const goal = data.goal;
            let goalType = "";

            if (goal.goal_type === "Lose") {
                goalType = "Weight Loss";
            } else if (goal.goal_type === "Gain") {
                goalType = "Weight Gain";
            } else {
                goalType = "Weight Maintenance";
            }

            document.getElementById("goal-type").textContent = goalType;

            const weightDifference = Math.abs(goal.target_weight - goal.start_weight);
            let goalAmount = "";

            if (goal.goal_type === "Lose") {
                goalAmount = "Lose " + weightDifference;
            } else if (goal.goal_type === "Gain") {
                goalAmount = "Gain " + weightDifference;
            } else {
                goalAmount = "Maintain";
            }

            document.getElementById("goal-amount").textContent = goalAmount;
            document.getElementById("current-weight").textContent = goal.current_weight + " kg";
            document.getElementById("target-weight").textContent = goal.target_weight + " kg";
            document.getElementById("goal-timeframe").textContent = goal.time_period + " Months";


            // 2. Display weight progress
            const startWeight = goal.start_weight;
            const currentWeight = goal.current_weight;
            const targetWeight = goal.target_weight;

            let weightProgress = 0;
            let weightRemaining = 0;

            if (goal.goal_type === "Lose") {
                document.getElementById("weight-progress-bar").style.display = "block";
                document.getElementById("weight-progress-label").textContent = "Complete";
                document.getElementById("weight-remaining-label").textContent = "remaining";
                document.getElementById("weight-remaining").style.fontWeight = "bold";

                weightProgress = ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100;
                weightRemaining = currentWeight - targetWeight;

                weightProgress = Math.max(0, Math.min(100, weightProgress));
                weightProgress = Math.round(weightProgress * 10) / 10;
                weightRemaining = Math.round(weightRemaining * 10) / 10;

                document.getElementById("weight-progress").textContent = weightProgress + "%";
                document.getElementById("weight-progress-bar").style.width = weightProgress + "%";
                document.getElementById("weight-remaining").textContent = weightRemaining + " kg";

            } else if (goal.goal_type === "Gain") {
                document.getElementById("weight-progress-bar").style.display = "block";
                document.getElementById("weight-progress-label").textContent = "Complete";
                document.getElementById("weight-remaining-label").textContent = "remaining";
                document.getElementById("weight-remaining").style.fontWeight = "bold";

                weightProgress = ((currentWeight - startWeight) / (targetWeight - startWeight)) * 100;
                weightRemaining = targetWeight - currentWeight;

                weightProgress = Math.max(0, Math.min(100, weightProgress));
                weightProgress = Math.round(weightProgress * 10) / 10;
                weightRemaining = Math.round(weightRemaining * 10) / 10;

                document.getElementById("weight-progress").textContent = weightProgress + "%";
                document.getElementById("weight-progress-bar").style.width = weightProgress + "%";
                document.getElementById("weight-remaining").textContent = weightRemaining + " kg";

            } else {
                const lowerLimit = targetWeight - 1;
                const upperLimit = targetWeight + 1;

                document.getElementById("weight-progress-bar").style.display = "none";
                document.getElementById("weight-progress-label").textContent = "";
                document.getElementById("weight-remaining-label").textContent = "";
                document.getElementById("weight-remaining").style.fontWeight = "normal";

                if (currentWeight < lowerLimit) {

                    const amountBelow = lowerLimit - currentWeight;

                    document.getElementById("weight-progress").textContent = "Below Target";
                    document.getElementById("weight-remaining").textContent = "You are " + amountBelow.toFixed(1) + " kg below your maintenance range.";

                } else if (currentWeight > upperLimit) {
                    const amountAbove = currentWeight - upperLimit;
                    document.getElementById("weight-progress").textContent = "Above Target";
                    document.getElementById("weight-remaining").textContent = "You are " + amountAbove.toFixed(1) + " kg above your maintenance range.";

                } else {
                    document.getElementById("weight-progress").textContent = "On Track";
                    document.getElementById("weight-remaining").textContent = "Your weight is within your maintenance range.";
                }
            }

            // 3. Display calorie information
            const caloriesConsumed = data.food.calories_consumed;
            const calorieGoal = goal.daily_calorie_goal;
            const caloriesBurned = data.activity.calories_burned;

            let caloriesRemaining = calorieGoal - caloriesConsumed + caloriesBurned;

            if (caloriesRemaining < 0) {
                caloriesRemaining = 0;
            }

            let consumedPercent = 0;
            if (calorieGoal > 0) {
                consumedPercent = (caloriesConsumed - caloriesBurned) / calorieGoal * 100;
            }

            let remainingPercent = 100 - consumedPercent;
            if (remainingPercent < 0) {
                remainingPercent = 0;
            }

            consumedPercent = Math.round(consumedPercent * 10) / 10;
            remainingPercent = Math.round(remainingPercent * 10) / 10;

            document.getElementById("calories-consumed").textContent = caloriesConsumed.toLocaleString() + " kcal";
            document.getElementById("calories-consumed-percent").textContent = consumedPercent + "%";
            document.getElementById("calories-remaining").textContent = caloriesRemaining.toLocaleString();
            document.getElementById("calories-remaining-legend").textContent = caloriesRemaining.toLocaleString() + " kcal";
            document.getElementById("calories-remaining-percent").textContent = remainingPercent + "%";

            document.getElementById("calorie-progress-circle").setAttribute("stroke-dasharray", consumedPercent + ", 100");

            // 4. Display calorie matrix
            document.getElementById("calorie-goal").textContent = calorieGoal.toLocaleString();
            document.getElementById("calorie-consumed-breakdown").textContent = caloriesConsumed.toLocaleString();
            document.getElementById("calorie-remaining-breakdown").textContent = caloriesRemaining.toLocaleString();
            document.getElementById("calorie-burned").textContent = caloriesBurned.toLocaleString();

            // 5. Display macronutrients
            const proteinConsumed = data.food.protein_consumed;
            const carbsConsumed = data.food.carbs_consumed;
            const fatConsumed = data.food.fat_consumed;

            const proteinGoal = goal.protein_goal;
            const carbsGoal = goal.carb_goal;
            const fatGoal = goal.fat_goal;

            let proteinPercent = 0;
            let carbsPercent = 0;
            let fatPercent = 0;

            if (proteinGoal > 0) {
                proteinPercent = (proteinConsumed / proteinGoal) * 100;
            }

            if (carbsGoal > 0) {
                carbsPercent = (carbsConsumed / carbsGoal) * 100;
            }

            if (fatGoal > 0) {
                fatPercent = (fatConsumed / fatGoal) * 100;
            }

            proteinPercent = Math.min(100, proteinPercent);
            carbsPercent = Math.min(100, carbsPercent);
            fatPercent = Math.min(100, fatPercent);

            document.getElementById("protein-consumed").textContent = Math.round(proteinConsumed) + "g";
            document.getElementById("protein-goal").textContent = Math.round(proteinGoal) + "g";
            document.getElementById("macro-bar-protein").style.width = proteinPercent + "%";
            document.getElementById("carbs-consumed").textContent = Math.round(carbsConsumed) + "g";
            document.getElementById("carbs-goal").textContent = Math.round(carbsGoal) + "g";
            document.getElementById("macro-bar-carbs").style.width = carbsPercent + "%";
            document.getElementById("fat-consumed").textContent = Math.round(fatConsumed) + "g";
            document.getElementById("fat-goal").textContent = Math.round(fatGoal) + "g";
            document.getElementById("macro-bar-fat").style.width = fatPercent + "%";

            // 6. Display hydration information
            const waterConsumed = data.water.water_consumed;
            const waterGoal = data.water.water_goal;;

            let waterPercent = 0;

            if (waterGoal > 0) {
                waterPercent = (waterConsumed / waterGoal) * 100;
            }

            waterPercent = Math.min(100, waterPercent);
            waterPercent = Math.round(waterPercent * 10) / 10;

            document.getElementById("water-consumed").textContent = waterConsumed;
            document.getElementById("water-goal").textContent = waterGoal;
            document.getElementById("water-percent").textContent = waterPercent + "%";
            document.getElementById("water-progress").style.height = waterPercent + "%";

            // 7. Display today's activity
            const activityDuration = data.activity.duration;
            const activityCaloriesBurned = data.activity.calories_burned;

            document.getElementById("activity-duration").textContent = activityDuration + " min";
            document.getElementById("activity-calories-burned").textContent = activityCaloriesBurned.toLocaleString() + " kcal";

            // 8. Generate daily insights
            generateDailyInsights(data);
        }
        else if(data.status === "error"){

            document.getElementById("username").textContent = data.user.username;
            showPopup("Unable to Load Dashboard", data.message);
        }
        else if (data.status === "no_data") {

            document.getElementById("username").textContent = data.user.username;

            // Nothing to display.
            // clearDashboardData() already changed everything to "--".
        }
    })
    .catch(error => {
        console.log("Error getting dashboard data:", error);
    });
}


// 4. LOAD TODAY'S DATA WHEN PAGE OPENS
document.addEventListener("DOMContentLoaded", () => {
    loadDashboardData(datePicker.selectedDates[0]);
});


// 5. GENERATE DAILY INSIGHTS
function generateDailyInsights(data) {

    const insightsList = document.getElementById("insights-list");

    // Clear existing insights
    insightsList.innerHTML = "";

    // Get dashboard data
    const goal = data.goal;
    const food = data.food;
    const water = data.water;
    const activity = data.activity;

    // Convert values to numbers
    const calorieGoal = Number(goal.daily_calorie_goal);
    const caloriesConsumed = Number(food.calories_consumed);

    const proteinGoal = Number(goal.protein_goal);
    const proteinConsumed = Number(food.protein_consumed);

    const carbsGoal = Number(goal.carb_goal);
    const carbsConsumed = Number(food.carbs_consumed);

    const fatGoal = Number(goal.fat_goal);
    const fatConsumed = Number(food.fat_consumed);

    const waterGoal = Number(water.water_goal);
    const waterConsumed = Number(water.water_consumed);

    const activityDuration = Number(activity.duration);

    const currentWeight = Number(goal.current_weight);
    const targetWeight = Number(goal.target_weight);
    const goalType = goal.goal_type;

    const insights = [];

    // CALORIE RULES
    if (caloriesConsumed === 0) {

        insights.push({
            priority: 3,
            type: "info",
            icon: "fa-circle-info",
            message: "You haven't logged any food today. Start by adding your first meal."
        });

    } else if (calorieGoal > 0 && caloriesConsumed > calorieGoal) {
        const caloriesOver = caloriesConsumed - calorieGoal;

        insights.push({
            priority: 3,
            type: "warning",
            icon: "fa-triangle-exclamation",
            message: `You have exceeded your daily calorie target by ${Math.round(caloriesOver).toLocaleString()} kcal.`
        });

    } else if (calorieGoal > 0 && caloriesConsumed < calorieGoal * 0.80) {

        insights.push({
            priority: 2,
            type: "info",
            icon: "fa-circle-info",
            message: "You are currently below your calorie target. Keep logging your meals throughout the day."
        });

    } else if (calorieGoal > 0) {

        insights.push({
            priority: 1,
            type: "success",
            icon: "fa-circle-check",
            message: "Your calorie intake is within your daily target."
        });
    }

    // WEIGHT GOAL RULES
    if (goalType === "Lose" && currentWeight <= targetWeight) {

        insights.push({
            priority: 3,
            type: "success",
            icon: "fa-circle-check",
            message: "You have reached your weight-loss target. Keep maintaining healthy habits."
        });

    } else if (goalType === "Gain" && currentWeight >= targetWeight) {

        insights.push({
            priority: 3,
            type: "success",
            icon: "fa-circle-check",
            message: "You have reached your weight-gain target. Keep maintaining healthy habits."
        });

    } else if (goalType === "Maintain" &&
        Math.abs(currentWeight - targetWeight) <= 1) {

        insights.push({
            priority: 2,
            type: "success",
            icon: "fa-circle-check",
            message: "Your weight is within your maintenance range."
        });

    } else if (goalType === "Lose" || goalType === "Gain") {

        insights.push({
            priority: 1,
            type: "info",
            icon: "fa-circle-info",
            message: "Keep tracking your weight regularly to monitor your progress toward your goal."
        });
    }

    // PROTEIN RULES
    if (proteinGoal > 0 && proteinConsumed < proteinGoal * 0.80) {

        insights.push({
            priority: 3,
            type: "warning",
            icon: "fa-triangle-exclamation",
            message: `Your protein intake is below your daily target. You have consumed ${proteinConsumed.toFixed(1)}g out of ${proteinGoal.toFixed(1)}g.`
        });

    } else if (proteinGoal > 0) {

        insights.push({
            priority: 1,
            type: "success",
            icon: "fa-circle-check",
            message: "Your protein intake is on track with your daily target."
        });
    }

    // CARBOHYDRATE RULES
    if (carbsGoal > 0 && carbsConsumed < carbsGoal * 0.80) {

        insights.push({
            priority: 1,
            type: "info",
            icon: "fa-circle-info",
            message: "Your carbohydrate intake is below your daily target."
        });

    } else if (carbsGoal > 0 && carbsConsumed > carbsGoal * 1.20) {

        insights.push({
            priority: 2,
            type: "warning",
            icon: "fa-triangle-exclamation",
            message: "Your carbohydrate intake is above your daily target."
        });
    }

    // FAT RULES
    if (fatGoal > 0 && fatConsumed < fatGoal * 0.80) {

        insights.push({
            priority: 1,
            type: "info",
            icon: "fa-circle-info",
            message: "Your fat intake is below your daily target."
        });

    } else if (fatGoal > 0 && fatConsumed > fatGoal * 1.20) {

        insights.push({
            priority: 2,
            type: "warning",
            icon: "fa-triangle-exclamation",
            message: "Your fat intake is above your daily target."
        });
    }

    // HYDRATION RULES
    if (waterConsumed === 0) {

        insights.push({
            priority: 2,
            type: "info",
            icon: "fa-circle-info",
            message: "You haven't logged any water today. Start tracking your water intake."
        });

    } else if (waterGoal > 0 && waterConsumed < waterGoal * 0.50) {

        insights.push({
            priority: 3,
            type: "warning",
            icon: "fa-triangle-exclamation",
            message: "Your water intake is below half of today's hydration goal. Try drinking some water."
        });

    } else if (waterGoal > 0 && waterConsumed < waterGoal) {
        const remainingWater = waterGoal - waterConsumed;

        insights.push({
            priority: 2,
            type: "info",
            icon: "fa-circle-info",
            message: `You have ${remainingWater.toFixed(2)}L of water remaining to reach today's hydration goal.`
        });

    } else if (waterGoal > 0 && waterConsumed >= waterGoal) {

        insights.push({
            priority: 1,
            type: "success",
            icon: "fa-circle-check",
            message: "Great job! You've reached today's hydration goal."
        });
    }

    // ACTIVITY RULES
    if (activityDuration === 0) {

        insights.push({
            priority: 2,
            type: "info",
            icon: "fa-circle-info",
            message: "You haven't logged any physical activity today. Record your activity to track your progress."
        });

    } else {

        insights.push({
            priority: 1,
            type: "success",
            icon: "fa-circle-check",
            message: `You have logged ${activityDuration} minutes of physical activity today.`
        });
    }

    // SORT BY PRIORITY
    insights.sort((a, b) => b.priority - a.priority);

    // DISPLAY TOP 3 INSIGHTS
    const selectedInsights = insights.slice(0, 3);

    selectedInsights.forEach(insight => {
        const listItem = document.createElement("li");
        listItem.className = `insight-item insight-${insight.type}`;
        listItem.innerHTML = `
            <i class="fa-solid ${insight.icon}"></i>
            <p>${insight.message}</p>
        `;
        insightsList.appendChild(listItem);
    });
}

