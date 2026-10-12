// 1. CHART INSTANCES AND PAGE INITIALIZATION
let chartInstances = {};

// Initialize page
window.addEventListener("DOMContentLoaded", function() {
    initCalorieChart();
    initWeightChart();
    initActivityChart();
    initMacroChart();
    loadProgressData("week");
});


// 2. CREATE CALORIE OVERVIEW CHART
function initCalorieChart() {

    const ctxCal = document.getElementById("calorieOverviewChart").getContext("2d");

    chartInstances.calorie = new Chart(ctxCal, {
        type: "doughnut",

        data: {
            labels: ["Consumed", "Remaining"],
            datasets: [{
                data: [0, 0],
                backgroundColor: ["#ea8a14", "#e2e8f0"],
                borderWidth: 0
            }]
        },

        options: {
            cutout: "78%",
            plugins: {legend: {display: false}},
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


// 3. CREATE WEIGHT TRAJECTORY CHART
function initWeightChart() {

    const ctxWeight = document.getElementById("weightProgressChart").getContext("2d");

    chartInstances.weight = new Chart(ctxWeight, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Actual",
                    data: [],
                    borderColor: "maroon",
                    backgroundColor: "rgba(234, 116, 12, 0.08)",
                    fill: true,
                    tension: 0.35,
                    borderWidth: 3,
                    pointBackgroundColor: "maroon"
                },

                {
                    label: "Target",
                    data: [],
                    borderColor: "#94a3b8",
                    borderDash: [6, 6],
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {legend: {display: false}},
            scales: {
                x: {grid: {display: false}},
                y: {grid: {color: "rgba(0,0,0,0.03)"}}

            }
        }
    });
}


// 4. CREATE ACTIVITY AND CALORIE BURN CHART
function initActivityChart() {

    const ctxActivity = document.getElementById("activityTrendChart").getContext("2d");

    chartInstances.activity = new Chart(ctxActivity, {
        type: "bar",
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: "#FF9F1C",
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {legend: {display: false}},
            scales: {
                x: {grid: {display: false}},
                y: {grid: {color: "rgba(0,0,0,0.03)"}}
            }
        }
    });
}


// 5. CREATE MACRONUTRIENT DONUT CHART
function initMacroChart() {

    const ctxMacro = document.getElementById("macroNutrientChart").getContext("2d");

    chartInstances.macro = new Chart(ctxMacro, {
        type: "doughnut",
        data: {
            labels: ["Protein","Carbs","Fats"],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ["maroon","#ea740c","#fbbf24"],
                borderWidth: 0
            }]
        },
        options: {
            cutout: "65%",
            plugins: {legend: {display: false}},
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


// 6. LOAD PROGRESS DATA FROM PHP
function loadProgressData(timeframe) {

    fetch("php/get_progress_data.php", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({timeframe: timeframe})
    })

    .then(response => response.json())
    .then(data => {

        console.log("Progress data:", data);

        if (data.status !== "success") {
            console.log(data.message);
            return;
        }

        updateCalorieCard(data);
        updateCalorieInsight(data);
        updateCalorieBadge(data);
        
        updateWeightCard(data);
        updateWeightInsight(data);
        
        updateActivityCard(data);
        updateActivityInsight(data);
        
        updateMacroCard(data);
        updateMacroInsight(data);
    })

    .catch(error => {
        console.log("Error loading progress data:", error);
    });
}


// 7. UPDATE TIMEFRAME BUTTON
function updateDashboardTimeframe(timeframe, button) {

    document.querySelectorAll(".filter-btn").forEach(function(btn) {
        btn.classList.remove("active");
    });

    button.classList.add("active");
    loadProgressData(timeframe);
}


// 8. UPDATE CALORIE OVERVIEW CARD VALUES
function updateCalorieCard(data) {

    const consumed = data.calories.consumed;
    const burned = data.calories.burned;
    const net = consumed - burned;
    const target = data.calories.target;
    const targetLabel = document.getElementById("targetLimitLabel");

    if (data.timeframe === "week") {
        targetLabel.textContent = "Weekly Target Limit";

    } else if (data.timeframe === "month") {
        targetLabel.textContent = "Monthly Target Limit";

    } else {
        targetLabel.textContent = "All-Time Target Limit";
    }

    document.getElementById("statConsumed").textContent = `${consumed.toFixed(0)} kcal`;
    document.getElementById("statBurned").textContent = `${burned.toFixed(0)} kcal`;
    document.getElementById("statTarget").textContent = `${target.toFixed(0)} kcal`;
    document.getElementById("donutNetVal").textContent = net.toFixed(0);

    // Calculate remaining calories
    const remaining = Math.max(0, target - net);

    chartInstances.calorie.data.datasets[0].data = [net, remaining];
    chartInstances.calorie.update();
}


// 9. UPDATE CALORIE INSIGHT
function updateCalorieInsight(data) {

    const consumed = Number(data.calories.consumed || 0);
    const burned = Number(data.calories.burned || 0);
    const target = Number(data.calories.target || 0);

    const net = consumed - burned;
    const insightText = document.getElementById("calorieInsightText");

    // No calorie data
    if (consumed === 0 && burned === 0) {
        insightText.innerHTML = "<strong>Getting Started:</strong> No calorie activity was recorded for this period.";
        return;
    }

    // Avoid division by zero
    if (target <= 0) {
        insightText.innerHTML = "<strong>Calorie Summary:</strong> Your calorie data has been recorded for this period.";
        return;
    }

    const difference = net - target;
    const percentageDifference = Math.abs(difference / target) * 100;

    // Above target
    if (net > target) {
        insightText.innerHTML = `<strong>Calorie Check:</strong> Your net calorie intake is ${Math.abs(difference).toFixed(0)} kcal above your target for this period.`;
        return;
    }

    // Very far below target
    if (percentageDifference > 20) {
        insightText.innerHTML = `<strong>Calorie Check:</strong> Your net calorie intake is ${Math.abs(difference).toFixed(0)} kcal below your target for this period.`;
        return;
    }

    // Within a reasonable range
    insightText.innerHTML = `<strong>On Track:</strong> Your net calorie intake is within your target range for this period.`;
}



 //10. UPDATE CALORIE BADGE DYNAMICALLY
function updateCalorieBadge(data) {

    const badge = document.getElementById("calorieBadge");

    const consumed = Number(data.calories.consumed || 0);
    const burned = Number(data.calories.burned || 0);
    const target = Number(data.calories.target || 0);

    const net = consumed - burned;

    // Reset the badge classes
    badge.className = "card-badge";

    // No calorie activity recorded
    if (consumed === 0 && burned === 0) {
        badge.textContent = "No Data";
        badge.classList.add("no-data");
        return;
    }

    // No calorie target available
    if (target <= 0) {
        badge.textContent = "No Target";
        badge.classList.add("no-target");
        return;
    }

    // Net calories exceeded the target
    if (net > target) {
        badge.textContent = "Above Target";
        badge.classList.add("above-target");
    }

    // Net calories are close to the target
    else if (net >= target * 0.90) {
        badge.textContent = "Near Target";
        badge.classList.add("near-target");
    }

    // Net calories are below the target
    else {
        badge.textContent = "Within Target";
        badge.classList.add("within-target");
    }
}


// 10. UPDATE WEIGHT TRAJECTORY CARD
function updateWeightCard(data) {

    const weightData = data.weight;

    const labels = [];
    const actualWeights = [];
    const targetWeights = [];


    // Start date of the selected period
    const startDate = new Date(data.target_start_date + "T00:00:00");

    // End date of the selected period
    const endDate = new Date(data.target_end_date + "T00:00:00");

    // Goal information
    const goalStartDate = new Date(weightData.goal_start_date + "T00:00:00");
    const goalEndDate = new Date(weightData.goal_end_date + "T00:00:00");
    const startWeight = weightData.start_weight;
    const targetWeight = weightData.target_weight;

    // Create a map of recorded weights
    const weightMap = {};

    weightData.logs.forEach(function(log) {
        weightMap[log.date] = log.weight;
    });

    // Calculate total days in the complete goal
    const totalGoalDays = Math.round((goalEndDate - goalStartDate) /(1000 * 60 * 60 * 24));

    // Start from the selected period
    let currentDate = new Date(startDate);

    // Create chart data for each day
    while (currentDate <= endDate) {

        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const day = String(currentDate.getDate()).padStart(2, "0");
        const dateString = `${year}-${month}-${day}`;

        // Chart label
        labels.push(currentDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
            })
        );

        // Actual weight
        if (weightMap[dateString] !== undefined) {

            actualWeights.push(weightMap[dateString]);

        } else {
            actualWeights.push(null);
        }

        // Calculate expected target weight
        const elapsedDays =Math.round((currentDate - goalStartDate) /(1000 * 60 * 60 * 24));

        let progress = 0;

        if (totalGoalDays > 0) {
            progress = elapsedDays / totalGoalDays;
        }

        // Keep progress between 0 and 1
        progress = Math.max(0, Math.min(1, progress));

        const expectedWeight = startWeight + (targetWeight - startWeight) * progress;

        targetWeights.push(Number(expectedWeight.toFixed(2)));

        // Move to next day
        currentDate.setDate( currentDate.getDate() + 1);
    }

    // Update chart labels
    chartInstances.weight.data.labels = labels;

    // Update actual weight line
    chartInstances.weight.data.datasets[0].data = actualWeights;

    // Update target weight line
    chartInstances.weight.data.datasets[1].data = targetWeights;

    // Refresh chart
    chartInstances.weight.update();
}


// 11. UPDATE WEIGHT INSIGHT
function updateWeightInsight(data) {

    const weightData = data.weight;
    const insightText = document.getElementById("weightInsightText");

    // Check if there are any weight logs
    if (!weightData.logs || weightData.logs.length === 0) {
        insightText.innerHTML = "<strong>Getting Started:</strong> Start recording your weight to track your progress toward your goal.";
        return;
    }

    // Get the most recent weight log
    const latestLog = weightData.logs[weightData.logs.length - 1];

    const latestWeight = Number(latestLog.weight);
    const latestDate = new Date(latestLog.date + "T00:00:00");

    const goalStartDate = new Date(weightData.goal_start_date + "T00:00:00");
    const goalEndDate = new Date(weightData.goal_end_date + "T00:00:00");

    const startWeight = Number(weightData.start_weight);
    const targetWeight = Number(weightData.target_weight);

    // Calculate total goal duration
    const totalGoalDays = Math.round(
        (goalEndDate - goalStartDate) / (1000 * 60 * 60 * 24)
    );

    // Calculate how many days have passed
    const elapsedDays = Math.round(
        (latestDate - goalStartDate) / (1000 * 60 * 60 * 24)
    );

    // Calculate expected progress
    let progress = 0;

    if (totalGoalDays > 0) {
        progress = elapsedDays / totalGoalDays;
    }

    progress = Math.max(0, Math.min(1, progress));

    // Calculate projected weight for the latest logged date
    const expectedWeight = startWeight + (targetWeight - startWeight) * progress;
    const difference = latestWeight - expectedWeight;

    // Weight-loss goal
    if (targetWeight < startWeight) {

        if (difference <= -0.5) {
            insightText.innerHTML = `<strong>Great Progress:</strong> You are ${Math.abs(difference).toFixed(1)} kg ahead of your projected weight goal.`;

        } else if (difference <= 0.5) {
            insightText.innerHTML = "<strong>On Track:</strong> Your current weight is close to your projected goal trajectory.";

        } else {
            insightText.innerHTML = `<strong>Keep Going:</strong> You are ${difference.toFixed(1)} kg above your projected weight for this point in your goal.`;
        }

    // Weight-gain goal
    } else if (targetWeight > startWeight) {
        if (difference >= 0.5) {
            insightText.innerHTML = `<strong>Great Progress:</strong> You are ${difference.toFixed(1)} kg ahead of your projected weight goal.`;

        } else if (difference >= -0.5) {
            insightText.innerHTML = "<strong>On Track:</strong> Your current weight is close to your projected goal trajectory.";

        } else {
            insightText.innerHTML = `<strong>Keep Going:</strong> You are ${Math.abs(difference).toFixed(1)} kg below your projected weight for this point in your goal.`;
        }

    // Maintaining weight
    } else {

        if (Math.abs(difference) <= 0.5) {
            insightText.innerHTML = "<strong>On Track:</strong> Your weight is staying close to your target.";

        } else {
            insightText.innerHTML = `<strong>Progress Update:</strong> Your current weight is ${Math.abs(difference).toFixed(1)} kg from your target.`;
        }
    }
}


// 12. UPDATE ACTIVITY AND CALORIE BURN CHART
function updateActivityCard(data) {

    const activityData = data.activity;

    // Update chart labels
    chartInstances.activity.data.labels = activityData.labels;

    // Update calories burned
    chartInstances.activity.data.datasets[0].data = activityData.values;

    // Refresh chart
    chartInstances.activity.update();
}


// 13. UPDATE ACTIVITY INSIGHT
function updateActivityInsight(data) {

    const activityData = data.activity;
    const insightText = document.getElementById("activityInsightText");

    const labels = activityData.labels || [];
    const values = activityData.values || [];

    // Check if there is no activity
    const totalBurned = values.reduce(function(total, value) {
        return total + Number(value || 0);
    }, 0);

    if (totalBurned === 0) {
        insightText.innerHTML = "<strong>Getting Started:</strong> No activity was recorded for this period. Add an activity to start tracking your progress.";
        return;
    }

    // Find the highest activity day
    let highestValue = 0;
    let highestIndex = -1;

    values.forEach(function(value, index) {

        const burned = Number(value || 0);

        if (burned > highestValue) {
            highestValue = burned;
            highestIndex = index;
        }
    });

    const highestDay = highestIndex >= 0
        ? labels[highestIndex]
        : "";

    // Count active days
    const activeDays = values.filter(function(value) {
        return Number(value || 0) > 0;
    }).length;

    // Get timeframe name
    let timeframeText = "this period";

    if (data.timeframe === "week") {
        timeframeText = "this week";
    } else if (data.timeframe === "month") {
        timeframeText = "this month";
    } else {
        timeframeText = "the selected period";
    }

    // One active day
    if (activeDays === 1) {
        insightText.innerHTML = `<strong>Activity Highlight:</strong> ${highestDay} was your most active day, with ${highestValue.toFixed(0)} kcal burned.`;
        return;
    }

    // Several active days
    if (activeDays >= 4) {
        insightText.innerHTML = `<strong>Great Consistency:</strong> You were active on ${activeDays} days ${timeframeText}, with ${highestDay} as your peak day.`;
        return;
    }

    // Two or three active days
    insightText.innerHTML = `<strong>Good Progress:</strong> You recorded activity on ${activeDays} days ${timeframeText}. Your highest burn was on ${highestDay}.`;
}


// 14. UPDATE MACRONUTRIENT OVERVIEW CARD
function updateMacroCard(data) {

    const proteinGrams = data.macros.protein.grams;
    const proteinPercentage = data.macros.protein.percentage;
    const carbsGrams = data.macros.carbs.grams;
    const carbsPercentage = data.macros.carbs.percentage;
    const fatsGrams = data.macros.fats.grams;
    const fatsPercentage = data.macros.fats.percentage;

    // Update macro doughnut chart
    chartInstances.macro.data.datasets[0].data = [proteinPercentage, carbsPercentage, fatsPercentage];
    chartInstances.macro.update();

    // Update protein
    document.getElementById("proteinGrams").textContent = `${proteinGrams.toFixed(0)}g (${proteinPercentage.toFixed(0)}%)`;
    document.getElementById("proteinBar").style.width = `${proteinPercentage}%`;

    // Update carbs
    document.getElementById("carbsGrams").textContent = `${carbsGrams.toFixed(0)}g (${carbsPercentage.toFixed(0)}%)`;
    document.getElementById("carbsBar").style.width = `${carbsPercentage}%`;

    // Update fats
    document.getElementById("fatsGrams").textContent = `${fatsGrams.toFixed(0)}g (${fatsPercentage.toFixed(0)}%)`;
    document.getElementById("fatsBar").style.width = `${fatsPercentage}%`;
}


// 15. UPDATE MACRONUTRIENT INSIGHT
function updateMacroInsight(data) {

    const macroData = data.macros;
    const insightText = document.getElementById("macroInsightText");

    const protein = Number(macroData.protein.percentage || 0);
    const carbs = Number(macroData.carbs.percentage || 0);
    const fats = Number(macroData.fats.percentage || 0);

    // Target percentages
    const proteinTarget = 30;
    const carbsTarget = 45;
    const fatsTarget = 25;

    // Check if there is no nutrition data
    if (protein === 0 && carbs === 0 && fats === 0) {
        insightText.innerHTML = "<strong>Getting Started:</strong> Log some meals to see how your macronutrient intake compares with your targets.";
        return;
    }

    // Calculate differences from the targets
    const proteinDifference = protein - proteinTarget;
    const carbsDifference = carbs - carbsTarget;
    const fatsDifference = fats - fatsTarget;

    // Find the largest difference
    const differences = [
        {
            name: "protein",
            difference: proteinDifference,
            absolute: Math.abs(proteinDifference)
        },
        {
            name: "carbohydrates",
            difference: carbsDifference,
            absolute: Math.abs(carbsDifference)
        },
        {
            name: "fats",
            difference: fatsDifference,
            absolute: Math.abs(fatsDifference)
        }
    ];

    differences.sort(function(a, b) {
        return b.absolute - a.absolute;
    });

    const largestDifference = differences[0];

    // If all macros are close to their targets
    if (largestDifference.absolute <= 5) {
        insightText.innerHTML = "<strong>Well Balanced:</strong> Your macronutrient intake is close to your 30/45/25 target distribution.";
        return;
    }

    // Protein is the largest difference
    if (largestDifference.name === "protein") {

        if (largestDifference.difference < 0) {
            insightText.innerHTML = `<strong>Tip:</strong> Your protein intake is ${Math.abs(proteinDifference).toFixed(0)}% below your target. Consider adding more protein-rich foods.`;

        } else {
            insightText.innerHTML = `<strong>Tip:</strong> Your protein intake is ${proteinDifference.toFixed(0)}% above your target. Consider balancing it with more carbohydrates and healthy fats.`;
        }
        return;
    }

    // Carbohydrates are the largest difference
    if (largestDifference.name === "carbohydrates") {

        if (largestDifference.difference < 0) {
            insightText.innerHTML = `<strong>Tip:</strong> Your carbohydrate intake is ${Math.abs(carbsDifference).toFixed(0)}% below your target. Consider adding more carbohydrate-rich foods.`;

        } else {
            insightText.innerHTML = `<strong>Tip:</strong> Your carbohydrate intake is ${carbsDifference.toFixed(0)}% above your target. Consider balancing your meals with more protein and healthy fats.`;
        }
        return;
    }

    // Fats are the largest difference
    if (largestDifference.name === "fats") {

        if (largestDifference.difference < 0) {
            insightText.innerHTML = `<strong>Tip:</strong> Your fat intake is ${Math.abs(fatsDifference).toFixed(0)}% below your target. Consider adding healthy sources of fats to your meals.`;

        } else {
            insightText.innerHTML = `<strong>Tip:</strong> Your fat intake is ${fatsDifference.toFixed(0)}% above your target. Consider balancing your meals with more protein and carbohydrates.`;
        }
    }
}