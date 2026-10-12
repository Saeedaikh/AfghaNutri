// FOOD DATABASE
let foods = [];
let currentFoodIndex = 0;

let thumbnailPositions = {
    foodThumb1: 1,
    foodThumb2: 2,
    foodThumb3: 3,
    foodThumb4: 4,
    foodThumb5: 5,
    foodThumb6: "incoming"
};

const thumbnailPath = {
    1: { left: "70px", top: "-5%" },
    2: { left: "0px", top: "16%" },
    3: { left: "-25px", top: "42%" },
    4: { left: "-10px", top: "68%" },
    5: { left: "45px", top: "90%" }
};

// LOAD FOOD DATA
function loadFoods() {

    fetch("php/food_data.php")

        .then(response => response.json())
        .then(data => {

            if(data.status === "success") {
                foods = data.foods;

                document.getElementById("mainFoodImage").src = "images/" + foods[currentFoodIndex].food_image;

                // Display the first food
                displayFood(currentFoodIndex);

                // Update the five thumbnails
                updateThumbnails();
            }
            else {
                console.log("Food data error:", data.message); 
            }
        })
        .catch(error => {
            console.log("Food data request error:", error);
        });
}


// DISPLAY FOOD INFORMATION
function displayFood(index) {

    const food = foods[index];

    if(!food) {
        return;
    }

    document.getElementById("foodTitle").textContent = food.food_name_en;
    document.getElementById("foodDescription").textContent = food.description;
    document.getElementById("foodCalories").textContent = food.calories_per_serving + " kcal";
    document.getElementById("foodCarbs").textContent = food.carbohydrate_g_per_serving + " g";
    document.getElementById("foodProtein").textContent = food.protein_g_per_serving + " g";
    document.getElementById("foodFat").textContent = food.fat_g_per_serving + " g";
}


// UPDATE FOOD THUMBNAILS
function updateThumbnails() {

    if(foods.length === 0) {
        return;
    }

    // Positions around the active food
    const incomingIndex = (currentFoodIndex + 3) % foods.length;
    const position1Index = (currentFoodIndex + 2) % foods.length;
    const position2Index = (currentFoodIndex + 1) % foods.length;
    const position3Index = currentFoodIndex;
    const position4Index = (currentFoodIndex - 1 + foods.length) % foods.length;
    const position5Index = (currentFoodIndex - 2 + foods.length) % foods.length;
    
    // Put food images into the five positions
    document.getElementById("thumbImage1").src = "images/" + foods[position1Index].food_image;
    document.getElementById("thumbImage2").src = "images/" + foods[position2Index].food_image;
    document.getElementById("thumbImage3").src = "images/" + foods[position3Index].food_image;
    document.getElementById("thumbImage4").src = "images/" + foods[position4Index].food_image;
    document.getElementById("thumbImage5").src = "images/" + foods[position5Index].food_image;
    document.getElementById("thumbImage6").src = "images/" + foods[incomingIndex].food_image;
}


// MAIN FOOD IMAGE ANIMATION
function animateMainFoodImage(newFoodImage, direction) {

    const mainImage = document.getElementById("mainFoodImage");
    const imageContainer = document.querySelector(".main-food-plate-layer");

    // Prevent another animation from starting
    if (imageContainer.dataset.animating === "true") {
        return;
    }

    imageContainer.dataset.animating = "true";

    // Create a temporary copy for the incoming image
    const newImage = mainImage.cloneNode(false);

    newImage.removeAttribute("id");
    newImage.classList.add("food-animation-image");
    newImage.src = "images/" + newFoodImage;

    imageContainer.appendChild(newImage);

    // ==========================================
    // NEXT
    // New image: RIGHT → CENTER
    // Current image: CENTER → RIGHT + Scalesdown
    // ==========================================

    if (direction === "next") {

        newImage.style.zIndex = "4";
        mainImage.style.zIndex = "3";

        newImage.animate(
            [
                {
                    transform: "translateX(250px)",
                    opacity: 0
                },
                {
                    transform: "translateX(0)",
                    opacity: 1
                }
            ],
            {
                duration: 700,
                easing: "ease-in-out",
                fill: "forwards"
            }
        );

        mainImage.animate(
            [
                {
                    transform: "translateX(0) scale(1)",
                    opacity: 1
                },
                {
                    transform: "translateX(100px) scale(0.80)",
                    opacity: 0
                }
            ],
            {
                duration: 700,
                easing: "ease-in-out",
                fill: "forwards"
            }
        );
    }

    // ==========================================
    // PREVIOUS
    // New image: RIGHT + SMALL → CENTER, FULL
    // Current image: CENTER → RIGHT
    // ==========================================

    else if (direction === "previous") {

        newImage.style.zIndex = "3";
        mainImage.style.zIndex = "4";

        newImage.animate(
            [
                {
                    transform: "translateX(100px) scale(0.80)",
                    opacity: 0
                },
                {
                    transform: "translateX(0) scale(1)",
                    opacity: 1
                }
            ],
            {
                duration: 700,
                easing: "ease-in-out",
                fill: "forwards"
            }
        );

        mainImage.animate(
            [
                {
                    transform: "translateX(0)",
                    opacity: 1
                },
                {
                    transform: "translateX(250px)",
                    opacity: 0
                }
            ],
            {
                duration: 700,
                easing: "ease-in-out",
                fill: "forwards"
            }
        );
    }

    // The clean up code
    setTimeout(() => {

        // Stop the old animation so it cannot keep opacity at 0
        mainImage.getAnimations().forEach(animation => {
            animation.cancel();
        });

        mainImage.src = "images/" + newFoodImage;

        mainImage.style.opacity = "1";
        mainImage.style.transform = "none";
        mainImage.style.zIndex = "3";

        newImage.remove();

        imageContainer.dataset.animating = "false";

    }, 700);
}


// SHOW NEXT FOOD
function showNextFood() {

    if (foods.length === 0) {
        return;
    }

    if (document.querySelector(".food-display-showcase").dataset.animating === "true") {
        return;
    }

    document.querySelector(".food-display-showcase").dataset.animating = "true";

    const thumb1 = document.getElementById("foodThumb1");
    const thumb2 = document.getElementById("foodThumb2");
    const thumb3 = document.getElementById("foodThumb3");
    const thumb4 = document.getElementById("foodThumb4");
    const thumb5 = document.getElementById("foodThumb5");
    const thumb6 = document.getElementById("foodThumb6");

    // Current physical positions
    const cards = [
        thumb1,
        thumb2,
        thumb3,
        thumb4,
        thumb5,
        thumb6
    ];

    // Find which physical thumbnail is currently in each position
    const position1 = cards.find(card => thumbnailPositions[card.id] === 1);
    const position2 = cards.find(card => thumbnailPositions[card.id] === 2);
    const position3 = cards.find(card => thumbnailPositions[card.id] === 3);
    const position4 = cards.find(card => thumbnailPositions[card.id] === 4);
    const position5 = cards.find(card => thumbnailPositions[card.id] === 5);
    const incoming = cards.find(card => thumbnailPositions[card.id] === "incoming");

    // Move active styling from position 3 to position 2
    position3.querySelector(".thumb-circle").classList.remove("active-thumb");
    position2.querySelector(".thumb-circle").classList.add("active-thumb");

    // ==========================================
    // NEXT MOVEMENT
    // incoming → 1
    // 1 → 2
    // 2 → 3
    // 3 → 4
    // 4 → 5
    // 5 → OUT
    // ==========================================

    position1.style.top = "16%";
    position1.style.left = "0px";

    position2.style.top = "42%";
    position2.style.left = "-25px";

    position3.style.top = "68%";
    position3.style.left = "-10px";

    position4.style.top = "90%";
    position4.style.left = "45px";

    // Position 5 leaves through the bottom
    position5.style.top = "108%";
    position5.style.left = "120px";
    position5.style.opacity = "0";

    // Incoming enters position 1
    incoming.style.top = "-5%";
    incoming.style.left = "70px";
    incoming.style.opacity = "1";

    // Update physical position tracking
    thumbnailPositions[position1.id] = 2;
    thumbnailPositions[position2.id] = 3;
    thumbnailPositions[position3.id] = 4;
    thumbnailPositions[position4.id] = 5;
    thumbnailPositions[position5.id] = "incoming";
    thumbnailPositions[incoming.id] = 1;

    // Update food
    currentFoodIndex = (currentFoodIndex + 1) % foods.length;

    displayFood(currentFoodIndex);

    animateMainFoodImage(
        foods[currentFoodIndex].food_image,
        "next"
    );

    // Finish after animation
    setTimeout(function() {

        // The card that left position 5 is now the new incoming card
        position5.style.transition = "none";
        position5.style.top = "-18%";
        position5.style.left = "150px";
        position5.style.opacity = "0";

        const nextThumbnailIndex = (currentFoodIndex + 3) % foods.length;

        position5.querySelector("img").src = "images/" + foods[nextThumbnailIndex].food_image;

        void position5.offsetWidth;

        position5.style.transition = "";

        // It becomes the incoming physical card
        thumbnailPositions[position5.id] = "incoming";

        document.querySelector(".food-display-showcase").dataset.animating = "false";

    }, 700);
}


// SHOW PREVIOUS FOOD
function showPreviousFood() {

    if (foods.length === 0) {
        return;
    }

    if (document.querySelector(".food-display-showcase").dataset.animating === "true") {
        return;
    }

    document.querySelector(".food-display-showcase").dataset.animating = "true";

    const thumb1 = document.getElementById("foodThumb1");
    const thumb2 = document.getElementById("foodThumb2");
    const thumb3 = document.getElementById("foodThumb3");
    const thumb4 = document.getElementById("foodThumb4");
    const thumb5 = document.getElementById("foodThumb5");
    const thumb6 = document.getElementById("foodThumb6");

    const cards = [
        thumb1,
        thumb2,
        thumb3,
        thumb4,
        thumb5,
        thumb6
    ];

    // Find which physical thumbnail is currently in each position
    const position1 = cards.find(card => thumbnailPositions[card.id] === 1);
    const position2 = cards.find(card => thumbnailPositions[card.id] === 2);
    const position3 = cards.find(card => thumbnailPositions[card.id] === 3);
    const position4 = cards.find(card => thumbnailPositions[card.id] === 4);
    const position5 = cards.find(card => thumbnailPositions[card.id] === 5);
    const incoming = cards.find(card => thumbnailPositions[card.id] === "incoming");


    // ==========================================
    // PREVIOUS MOVEMENT
    //
    // 1 → OUT
    // 2 → 1
    // 3 → 2
    // 4 → 3
    // 5 → 4
    // incoming → 5
    // ==========================================

    // Move active styling from position 3 → position 4
    position3.querySelector(".thumb-circle").classList.remove("active-thumb");
    position4.querySelector(".thumb-circle").classList.add("active-thumb");


    // Position 1 leaves through the top
    position1.style.top = "-18%";
    position1.style.left = "150px";
    position1.style.opacity = "0";

    // Position 2 → position 1
    position2.style.top = "-5%";
    position2.style.left = "70px";

    // Position 3 → position 2
    position3.style.top = "16%";
    position3.style.left = "0px";

    // Position 4 → position 3
    position4.style.top = "42%";
    position4.style.left = "-25px";

    // Position 5 → position 4
    position5.style.top = "68%";
    position5.style.left = "-10px";

    // Move incoming card to the bottom first
    incoming.style.transition = "none";
    incoming.style.top = "108%";
    incoming.style.left = "120px";
    incoming.style.opacity = "0";

    void incoming.offsetWidth;

    // Now smoothly enter position 5 from the bottom
    incoming.style.transition = "";
    incoming.style.top = "90%";
    incoming.style.left = "45px";
    incoming.style.opacity = "1";

    // Update physical position tracking
    thumbnailPositions[position1.id] = "incoming";
    thumbnailPositions[position2.id] = 1;
    thumbnailPositions[position3.id] = 2;
    thumbnailPositions[position4.id] = 3;
    thumbnailPositions[position5.id] = 4;
    thumbnailPositions[incoming.id] = 5;

    // Update food
    currentFoodIndex = (currentFoodIndex - 1 + foods.length) % foods.length;

    displayFood(currentFoodIndex);

    animateMainFoodImage(
        foods[currentFoodIndex].food_image,
        "previous"
    );

    // Finish after animation
    setTimeout(function() {

        // The card that left position 1 becomes the new incoming card
        position1.style.transition = "none";
        position1.style.top = "-18%";
        position1.style.left = "150px";
        position1.style.opacity = "0";

        // Give the incoming card the next food image
        const previousThumbnailIndex = (currentFoodIndex - 3 + foods.length) % foods.length;

        position1.querySelector("img").src = "images/" + foods[previousThumbnailIndex].food_image;

        void position1.offsetWidth;

        position1.style.transition = "";

        // It becomes the incoming physical card
        thumbnailPositions[position1.id] = "incoming";

        document.querySelector(".food-display-showcase").dataset.animating = "false";
    }, 700);
}


// NAVIGATION BUTTONS
document.getElementById("nextFood").addEventListener("click", function() {
    showNextFood();
});

document.getElementById("previousFood").addEventListener("click", function() {
    showPreviousFood();
});


// FOOD SEARCH
document.getElementById("foodSearch").addEventListener("keydown", function(event) { 
 
    // Only search when Enter is pressed 
    if (event.key !== "Enter") { 
        return; 
    } 
 
    const searchValue = this.value.trim().toLowerCase(); 
 
    // Don't search an empty input 
    if (searchValue === "") { 
        return; 
    } 
 
    // Find matching food 
    const foundFoodIndex = foods.findIndex(function(food) { 
        return food.food_name_en.toLowerCase().includes(searchValue); 
    }); 
 
    // If no food was found 
    if (foundFoodIndex === -1) { 
        showPopup("Food Not Found", "This food isn't in our database. Please try another food."); 
        return; 
    } 
 
    // Move carousel to the found food 
    currentFoodIndex = foundFoodIndex; 
 
    // Completely reset carousel
    resetThumbnailPositions();
 
    // Update food information 
    displayFood(currentFoodIndex); 

    animateMainFoodImage(
        foods[currentFoodIndex].food_image,"next"
    );
 
    // Update thumbnail images 
    updateThumbnails(); 
});


// RESET THUMBNAIL POSITIONS
function resetThumbnailPositions() {

    thumbnailPositions = {
        foodThumb1: 1,
        foodThumb2: 2,
        foodThumb3: 3,
        foodThumb4: 4,
        foodThumb5: 5,
        foodThumb6: "incoming"
    };

    // Reset active thumbnail
    document.querySelectorAll(".thumb-circle").forEach(function(circle) {
        circle.classList.remove("active-thumb");
    });

    document.querySelector("#foodThumb3 .thumb-circle")
        .classList.add("active-thumb");

    const positions = {
        foodThumb1: { left: "70px", top: "-5%", opacity: "1" },
        foodThumb2: { left: "0px", top: "16%", opacity: "1" },
        foodThumb3: { left: "-25px", top: "42%", opacity: "1" },
        foodThumb4: { left: "-10px", top: "68%", opacity: "1" },
        foodThumb5: { left: "45px", top: "90%", opacity: "1" },
        foodThumb6: { left: "150px", top: "-18%", opacity: "0" }
    };

    Object.keys(positions).forEach(function(id) {

        const thumbnail = document.getElementById(id);

        thumbnail.style.transition = "none";
        thumbnail.style.left = positions[id].left;
        thumbnail.style.top = positions[id].top;
        thumbnail.style.opacity = positions[id].opacity;

    });

    void document.body.offsetWidth;

    Object.keys(positions).forEach(function(id) {
        document.getElementById(id).style.transition = "";
    });
}


// CUSTOM POPUP
function showPopup(title, message) {

    const popup = document.getElementById("customPopup");
    const popupTitle = document.getElementById("popupTitle");
    const popupMessage = document.getElementById("popupMessage");

    popupTitle.textContent = title;
    popupMessage.textContent = message;

    popup.classList.add("show");
}

// CLOSE CUSTOM POPUP
function closePopup() {
    document.getElementById("customPopup").classList.remove("show");
}

// POPUP CLOSE BUTTON
document.getElementById("popupCloseBtn").addEventListener("click", function() {
    closePopup();
});


// START FOOD DATABASE
loadFoods();