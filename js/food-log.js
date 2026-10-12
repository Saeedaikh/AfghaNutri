// DAILY INSIGHTS DATA
let dailyNutritionData = null;
let waterStatusData = null;
let weightStatusData = null;

//1. DISPLAY TODAYS DATE
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


//2. FOOD PREVIEW SETUP
let selectedFood = null;
document.addEventListener("DOMContentLoaded", () => {

    const foodSelect = document.getElementById("afghan-food-select");
    const previewTitle = document.getElementById("preview-title");
    const previewCalories = document.getElementById("preview-calories");
    const previewProtein = document.getElementById("preview-protein");
    const previewCarbs = document.getElementById("preview-carbs");
    const previewFat = document.getElementById("preview-fat");
    const servingInput = document.getElementById("serving-multiplier");

    let foods = [];

    // Load food data from database
    function loadFoods() {

        fetch("php/food_data.php")

        .then(response => response.json())
        .then(data => {

            if (data.status === "success") {
                foods = data.foods;

                populateFoodDropdown();
            }
            else {
                console.log("Food data error:", data.message);
            }
        })
        .catch(error => {

            console.log("Food data request error:", error);

            foodSelect.innerHTML = `
                <option value="" selected disabled>
                    Failed to load foods
                </option>
            `;
        });
    }

    // Food dropdown
    function populateFoodDropdown() {

        foodSelect.innerHTML = "";

        foods.forEach(food => {

            const option = document.createElement("option");

            option.value = food.food_id;
            option.textContent = food.food_name_en;

            foodSelect.appendChild(option);
        });

        // Show the first food automatically
        if (foods.length > 0) {

            foodSelect.value = foods[0].food_id;
            selectedFood = foods[0];
            updateFoodPreview(foods[0]);
        }
    }

    // Update food preview
    function updateFoodPreview(food) {

        const servings = Number(servingInput.value) || 0;
        const calories = Number(food.calories_per_serving) * servings;
        const protein = Number(food.protein_g_per_serving) * servings;
        const carbs = Number(food.carbohydrate_g_per_serving) * servings;
        const fat = Number(food.fat_g_per_serving) * servings;

        previewTitle.textContent = food.food_name_en;
        previewCalories.textContent = `${Math.round(calories).toLocaleString()} kcal`;
        previewProtein.textContent = `${protein.toFixed(1)}g`;
        previewCarbs.textContent = `${carbs.toFixed(1)}g`;
        previewFat.textContent = `${fat.toFixed(1)}g`;
    }

    // When user selects a food
    foodSelect.addEventListener("change", () => {

        const selectedFoodId = foodSelect.value;

        selectedFood = foods.find(food => food.food_id == selectedFoodId);

        if (selectedFood) {
            updateFoodPreview(selectedFood);
        }
    });

    servingInput.addEventListener("input", () => {

        if (selectedFood) {
            updateFoodPreview(selectedFood);
        }
    });

    // Start
    loadFoods();
});


//3. ADD FOOD TO FOODLOG DATABASE
const foodLogForm = document.getElementById("food-log-form");

foodLogForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const mealType = document.getElementById("meal-category").value;
    const servings = document.getElementById("serving-multiplier").value;

    if (!selectedFood) {
        showPopup("Food Required", "Please select a food before adding it to your daily log.");
        return;
    }

    const foodLogData = {
        food_id: selectedFood.food_id,
        meal_type: mealType,
        servings: Number(servings)
    };

    fetch("php/food_log.php", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(foodLogData)
    })

    .then(response => response.json())
    .then(data => {

        if(data.status === "success") {

            showPopup("Food Added!", "The food has been added to your daily log.");

            console.log("Food Log ID:", data.food_log_id);

            loadDailyNutrition();
            loadDailyFoodLog();
        }
        else {
            showPopup("Unable to Add Food", data.message);
        }
    })

    .catch(error => {
        console.log("Error adding food:", error);
        showPopup("Something Went Wrong", "We could not add the food to your daily log. Please try again.");
    });

});


//4. LOAD DAILY NUTRITION SUMMARY
function loadDailyNutrition() {

    fetch("php/get_daily_nutrition.php")

    .then(response => response.json())
    .then(data => {

        if (data.status !== "success") {
            console.error(data.message);
            return;
        }

        dailyNutritionData = data;

        // Calorie goal
        document.getElementById("summary-calorie-goal").textContent = Math.round(data.calorie_goal).toLocaleString();

        // Total calories
        document.getElementById("summary-total-calories").innerHTML = `${Math.round(data.total_calories).toLocaleString()} <small>kcal</small>`;

        // Remaining calories
        const remainingLabel = document.querySelector( ".highlight-remaining .calc-label");
        const remainingValue = document.getElementById( "summary-remaining-calories");

        if (data.over_goal > 0) {

            remainingLabel.textContent = "Over Goal";
            remainingValue.innerHTML = `${Math.round(data.over_goal).toLocaleString()} <small>kcal</small>`;
            remainingValue.style.color = "#c0392b";

        } else {

            remainingLabel.textContent = "Remaining";
            remainingValue.innerHTML = `${Math.round(data.remaining_calories).toLocaleString()} <small>kcal</small>`;
            remainingValue.style.color = "";
        }

        // Protein
        document.getElementById("summary-protein").textContent = `${data.total_protein.toFixed(1)}g`;
        document.getElementById("protein-goal").textContent = `/ ${data.protein_goal.toFixed(1)}g`;

        // Carbs
        document.getElementById("summary-carbs").textContent = `${data.total_carbs.toFixed(1)}g`;
        document.getElementById("carbs-goal").textContent = `/ ${data.carb_goal.toFixed(1)}g`;

        // Fat
        document.getElementById("summary-fat").textContent = `${data.total_fat.toFixed(1)}g`;
        document.getElementById("fat-goal").textContent = `/ ${data.fat_goal.toFixed(1)}g`;

        generateDailyInsights();
    })

    .catch(error => {
        console.error("Error loading daily nutrition:", error);
    });
}

//5. LOAD TODAY'S LOGGED FOODS
function loadDailyFoodLog() {

    fetch("php/get_daily_food_log.php")

    .then(response => response.json())
    .then(data => {
        if (data.status !== "success") {
            console.error(data.message);
            return;
        }

        // Get meal containers
        const breakfastRoot = document.getElementById("breakfast-items-root");
        const lunchRoot = document.getElementById("lunch-items-root");
        const dinnerRoot = document.getElementById("dinner-items-root");

        // Clear existing content
        breakfastRoot.innerHTML = "";
        lunchRoot.innerHTML = "";
        dinnerRoot.innerHTML = "";

        // Count today's items
        const totalItems = data.foods.length;

        document.querySelector(".counter-badge").textContent = `${totalItems} Item${totalItems !== 1 ? "s" : ""} Active`;

        // Create empty state
        function createEmptyState(mealType) {

            const emptyState = document.createElement("div");

            emptyState.className = "empty-state-card";

            emptyState.innerHTML = `
                <p>
                    <i class="fa-regular fa-folder-open"></i>
                    No food items logged for ${mealType}.
                </p>
            `;

            return emptyState;
        }

        // Create food item
        function createFoodItem(food) {

            const article = document.createElement("article");

            article.className = "logged-food-row-item";

            article.innerHTML = `
                <div class="item-primary-row">

                    <div class="item-identity">
                        <h4>${food.food_name_en}</h4>

                        <p class="item-serving-metric">
                            ${food.servings.toFixed(2)} Serving(s)
                            •
                            <span class="highlight-cal">
                                ${Math.round(food.calories).toLocaleString()} kcal
                            </span>
                        </p>
                    </div>

                    <button type="button" class="log-item-delete-btn" aria-label="Delete entry" data-food-log-id="${food.food_log_id}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>

                </div>

                <div class="item-macro-pill-row">

                    <span class="macro-pill">
                        P: ${food.protein.toFixed(1)}g
                    </span>

                    <span class="macro-pill">
                        C: ${food.carbs.toFixed(1)}g
                    </span>

                    <span class="macro-pill">
                        F: ${food.fat.toFixed(1)}g
                    </span>

                </div>
            `;

            // Delete Button
            const deleteButton = article.querySelector(".log-item-delete-btn");

            deleteButton.addEventListener("click", () => {
                deleteFoodLog(food.food_log_id);
            });

            return article;
        }

        // Group foods by meal
        const breakfastFoods = data.foods.filter(food => food.meal_type === "Breakfast");
        const lunchFoods = data.foods.filter(food => food.meal_type === "Lunch");
        const dinnerFoods = data.foods.filter(food => food.meal_type === "Dinner");

        // Display Breakfast
        if (breakfastFoods.length === 0) {
            breakfastRoot.appendChild(createEmptyState("Breakfast"));
        
        } else {
            breakfastFoods.forEach(food => {
                breakfastRoot.appendChild(createFoodItem(food));
            });
        }

        // Display lunch
        if (lunchFoods.length === 0) {
            lunchRoot.appendChild(createEmptyState("Lunch"));

        } else {
            lunchFoods.forEach(food => {
                lunchRoot.appendChild(createFoodItem(food));
            });
        }

        // Display dinner
        if (dinnerFoods.length === 0) {
            dinnerRoot.appendChild(createEmptyState("Dinner"));

        } else {
            dinnerFoods.forEach(food => {
                dinnerRoot.appendChild(createFoodItem(food));
            });
        }
    })

    .catch(error => {
        console.error("Error loading today's food log:", error);
    });
}


//6. DELETE FOOD LOG ITEM

function deleteFoodLog(foodLogId) {

    showConfirmation(
        "Delete Food Entry?",
        "Are you sure you want to delete this food entry?",
        function() {

            fetch("php/delete_food_log.php", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({food_log_id: foodLogId})
            })
            .then(response => response.json())
            .then(data => {

                if (data.status !== "success") {
                    showPopup("Delete Failed", data.message);
                    return;
                }

                // Reload today's logged foods
                loadDailyFoodLog();

                // Reload nutrition summary
                loadDailyNutrition();

            })
            .catch(error => {
                console.log("Error deleting food log:", error);
                showPopup(
                    "Something Went Wrong", "We could not delete the food entry. Please try again."
                );
            });
        }
    );
}


//7. SAVE DAILY WEIGHT

const weightForm = document.getElementById("weight-form");

weightForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const weightInput = document.getElementById("daily-weight-input");
    const currentWeight = Number(weightInput.value);

    // Validate weight
    if (!currentWeight) {
        showPopup("Weight Required", "Please enter your weight.");
        return;
    }

    // Check if weight already exists today
    fetch("php/check_today_weight.php")

    .then(response => response.json())
    .then(data => {

        if (data.status !== "success") {
            showPopup("Unable to Check Weight", data.message);
            return;
        }

        // Weight already exists
        if (data.weight_exists) {

            showPopup(
                "Weight Already Logged",
                `You have already logged your weight today. Your recorded weight is ${Number(
                    data.current_weight
                ).toFixed(1)} kg. You can enter a new weight tomorrow.`
            );
            return;
        }

        // Confirm weight
        showConfirmation(
            "Save Today's Weight?",
            `You entered ${currentWeight.toFixed(1)} kg. Once you save this weight, you will not be able to enter another weight for the rest of today. Do you want to save it?`,
            function() {

                saveWeight(currentWeight);
            }
        );
    })
    .catch(error => {
        console.log("Error checking today's weight:", error);
        showPopup("Something Went Wrong", "We could not check your weight. Please try again.");
    });
});

// SAVE WEIGHT AFTER CONFIRMATION
function saveWeight(currentWeight) {

    fetch("php/save_current_weight.php", {

        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            current_weight: currentWeight
        })
    })

    .then(response => response.json())
    .then(data => {

        if (data.status !== "success") {
            showPopup("Weight Not Saved", data.message);
            return;
        }

        showPopup("Weight Saved!", "Your weight has been saved successfully.");
        document.getElementById("daily-weight-input").value = "";
        loadWaterStatus();
    })

    .catch(error => {
        console.log("Error saving weight:", error);
        showPopup("Something Went Wrong", "We could not save your weight. Please try again.");
    });
}


//8. LOAD WATER STATUS 
function loadWaterStatus() { 
 
    fetch("php/get_water_status.php") 
 
    .then(response => response.json()) 
    .then(data => { 

        if (data.status !== "success") { 
            console.error(data.message || "Failed to load water status."); 
            return; 
        } 

        waterStatusData = data;
 
        // Get elements
        const waterGoal = document.getElementById("water-goal-val"); 
        const waterConsumed = document.getElementById("water-consumed-val"); 
        const waterRemaining = document.getElementById("water-remaining-val"); 

        // Update water values 
        waterGoal.textContent = `${data.water_goal.toFixed(2)}L`; 
        waterConsumed.textContent = `${data.water_consumed.toFixed(2)}L`; 
        waterRemaining.textContent = `${data.water_remaining.toFixed(2)}L`; 

        generateDailyInsights();
    }) 
 
    .catch(error => { 
        console.error( "Error loading water status:", error); 
    }); 
}


//9. ADD WATER 
const waterButtons = document.querySelectorAll(".water-add-btn"); 

waterButtons.forEach((button) => { 
 
    button.addEventListener("click", () => { 
 
        const amount = Number(button.dataset.amount); 
 
        fetch("php/add_water.php", { 
            method: "POST", 
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({amount_liters: amount}) 
        }) 
 
        .then(response => response.json()) 
        .then(data => { 
 
            if (data.status !== "success") {
                showPopup("Unable to Add Water", data.message);
                return;
            } 
 
            // Refresh water status
            loadWaterStatus(); 
        }) 
 
        .catch(error => {
            console.log("Error adding water:", error);
            showPopup("Something Went Wrong", "We could not update your water intake. Please try again.");
        }); 
    }); 
});

loadDailyNutrition();
loadDailyFoodLog();
loadWaterStatus();

//10. GENERATE DAILY INSIGHTS

function generateDailyInsights() {

    const insightsList = document.getElementById("insights-list");

    // Clear existing insights
    insightsList.innerHTML = "";

    // We need nutrition and water data
    if (!dailyNutritionData || !waterStatusData) {
        return;
    }

    const insights = [];

    // Get nutrition values
    const calorieGoal = Number(dailyNutritionData.calorie_goal);
    const totalCalories = Number(dailyNutritionData.total_calories);

    const proteinGoal = Number(dailyNutritionData.protein_goal);
    const totalProtein = Number(dailyNutritionData.total_protein);

    const carbGoal = Number(dailyNutritionData.carb_goal);
    const totalCarbs = Number(dailyNutritionData.total_carbs);

    const fatGoal = Number(dailyNutritionData.fat_goal);
    const totalFat = Number(dailyNutritionData.total_fat);

    // Get water values
    const waterGoal = Number(waterStatusData.water_goal);
    const waterConsumed = Number(waterStatusData.water_consumed);


    // CALORIE RULES
    if (totalCalories === 0) {

        insights.push({
            priority: 3,
            type: "info",
            icon: "fa-circle-info",
            message: "You haven't logged any food yet today. Start by adding your first meal."
        });

    }
    else if (totalCalories > calorieGoal) {

        const caloriesOver = totalCalories - calorieGoal;

        insights.push({
            priority: 3,
            type: "warning",
            icon: "fa-triangle-exclamation",
            message: `You have exceeded your daily calorie target by ${Math.round(caloriesOver).toLocaleString()} kcal.`
        });

    }
    else if (totalCalories <= calorieGoal * 0.80) {

        insights.push({
            priority: 2,
            type: "info",
            icon: "fa-circle-info",
            message: "You are currently below your calorie target. Keep logging your meals throughout the day."
        });

    }
    else {

        insights.push({
            priority: 1,
            type: "success",
            icon: "fa-circle-check",
            message: "You are within your daily calorie target."
        });
    }


    // PROTEIN RULES
    if (proteinGoal > 0 && totalProtein < proteinGoal * 0.80) {

        insights.push({
            priority: 3,
            type: "warning",
            icon: "fa-triangle-exclamation",
            message: "Your protein intake is below your daily target. Consider adding a protein-rich food."
        });

    }
    else if (proteinGoal > 0) {

        insights.push({
            priority: 1,
            type: "success",
            icon: "fa-circle-check",
            message: "Your protein intake is on track with your daily target."
        });
    }



    // CARBOHYDRATE RULES
    if (carbGoal > 0 && totalCarbs < carbGoal * 0.80) {

        insights.push({
            priority: 1,
            type: "info",
            icon: "fa-circle-info",
            message: "Your carbohydrate intake is below your daily target."
        });

    }
    else if (carbGoal > 0 && totalCarbs > carbGoal * 1.20) {

        insights.push({
            priority: 2,
            type: "warning",
            icon: "fa-triangle-exclamation",
            message: "Your carbohydrate intake is above your daily target."
        });
    }



    // FAT RULES
    if (fatGoal > 0 && totalFat < fatGoal * 0.80) {

        insights.push({
            priority: 1,
            type: "info",
            icon: "fa-circle-info",
            message: "Your fat intake is below your daily target."
        });

    }
    else if (fatGoal > 0 && totalFat > fatGoal * 1.20) {

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
            message: "You haven't logged any water yet today. Start tracking your water intake."
        });

    }
    else if (waterGoal > 0 && waterConsumed < waterGoal * 0.50) {

        insights.push({
            priority: 3,
            type: "warning",
            icon: "fa-triangle-exclamation",
            message: "Your water intake is below half of today's hydration goal. Try to drink some water soon."
        });

    }
    else if (waterGoal > 0 && waterConsumed < waterGoal) {

        const remainingWater = waterGoal - waterConsumed;

        insights.push({
            priority: 2,
            type: "info",
            icon: "fa-circle-info",
            message: `You have ${remainingWater.toFixed(2)}L of water remaining to reach today's hydration goal.`
        });

    }
    else if (waterGoal > 0 && waterConsumed >= waterGoal) {

        insights.push({
            priority: 1,
            type: "success",
            icon: "fa-circle-check",
            message: "Great job! You've reached today's hydration goal."
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