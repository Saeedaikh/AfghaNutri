// USER PROFILE DATA STORAGE
let clientProfileDataset = {
    username: "",
    gender: "",
    age: "",
    height: "",
    weight: "",
    healthGoal: "",
    targetWeight: "",
    timePeriod: "",
    email: "",
    password: ""
};


// SIGNUP CURRENT STEP TRACKER
let currentActiveStep = 1;

// LOGIN & SIGNUP SIDEBAR TOGGLE
function toggleSidebarView(targetMode) {
    const wrapper = document.getElementById('sidebarToggleWrapper');
    const loginBtn = document.getElementById('tab-login');
    const signupBtn = document.getElementById('tab-signup');
    const loginPanel = document.getElementById('loginViewPanel');
    const signupPanel = document.getElementById('signupViewPanel');

    // remove previous active states
    loginBtn.classList.remove('active');
    signupBtn.classList.remove('active');
    loginPanel.classList.remove('active');
    signupPanel.classList.remove('active');

    // show login interface
    if(targetMode === 'login') {
        wrapper.classList.remove('signup-active');
        loginBtn.classList.add('active');
        loginPanel.classList.add('active');
    } 
    // show signup interface
    else {
        wrapper.classList.add('signup-active');
        signupBtn.classList.add('active');
        signupPanel.classList.add('active');
    }
}


// HEALTH GOAL SELECTION
function assignHealthGoal(value, element) {

    // remove previous selected goal
    document.querySelectorAll('.goal-box').forEach(box => box.classList.remove('selected'));

    // highlight selected goal
    element.classList.add('selected');

    // store selected goal
    document.getElementById('selectedGoalField').value = value;
    clientProfileDataset.healthGoal = value;

    // remove validation error
    document.getElementById('goalErrorMsg').parentElement.classList.remove('has-error');
    
    showGoalInsight(value);
}


// GOAL RECOMMENDATION
function showGoalInsight(goal) {
    const bmi = calculateBMI();
    const messageBox = document.getElementById('goalInsightMsg');

    messageBox.style.display = "none";
    messageBox.textContent = "";

    if(!bmi) return;

    if(bmi < 18.5 && goal === "Lose") {
        messageBox.textContent =
        "Your BMI suggests you may be underweight. Consider maintaining or gaining weight instead.";

        messageBox.style.display = "block";
    }

    else if(bmi > 25 && goal === "Gain") {
        messageBox.textContent =
        "Your BMI suggests you may already be above a healthy weight range. Consider maintaining or losing weight instead.";

        messageBox.style.display = "block";
    }
}


// BMI CALCULATION
function calculateBMI() {
    const height = Number(document.getElementById('height').value);
    const weight = Number(document.getElementById('weight').value);

    if(!height || !weight) {
        return null;
    }

    const heightMeter = height / 100;
    return weight / (heightMeter * heightMeter);
}



// REAL-TIME TARGET WEIGHT VALIDATION
function checkTargetWeight() {
    const targetWeight = document.getElementById('targetWeight');
    const targetError = document.getElementById('targetWeightError');

    const currentWeight = Number(clientProfileDataset.weight);
    const goal = clientProfileDataset.healthGoal;

    const formGroup = targetWeight.parentElement.parentElement;

    // remove previous error
    formGroup.classList.remove('has-error');
    targetError.textContent = "";

    // do nothing if empty
    if(!targetWeight.value) {
        return;
    }

    if(goal === "Lose" && Number(targetWeight.value) >= currentWeight) {
        targetError.textContent =
        "Target weight should be lower than your current weight.";

        formGroup.classList.add('has-error');
    }
    else if(goal === "Gain" && Number(targetWeight.value) <= currentWeight) {
        targetError.textContent =
        "Target weight should be higher than your current weight.";

        formGroup.classList.add('has-error');
    }
    else if(goal === "Maintain" && Math.abs(Number(targetWeight.value) - currentWeight) > 2) {
        targetError.textContent =
        "Choose a target close to your current weight.";

        formGroup.classList.add('has-error');
    }
}


// DISPLAY TARGET RECOMMENDATION
function showTargetInsight() {

    const currentWeight = Number(clientProfileDataset.weight);
    const targetWeight = Number(document.getElementById('targetWeight').value);
    const timePeriod = Number(document.getElementById('timePeriod').value);
    const goal = clientProfileDataset.healthGoal;

    const messageBox = document.getElementById('targetInsightMsg');

    let insightMessage = "";

    // Clear previous message
    messageBox.style.display = "none";
    messageBox.textContent = "";

    // Wait until both fields have values
    if(!targetWeight || !timePeriod) {
        return;
    }


    // Stop recommendation if target weight is incorrect
    if(
        (goal === "Lose" && targetWeight >= currentWeight) ||
        (goal === "Gain" && targetWeight <= currentWeight) ||
        (goal === "Maintain" && Math.abs(targetWeight - currentWeight) > 2)
    ){
        return;
    }

    const weightDifference = Math.abs(currentWeight - targetWeight);
    const monthlyChange = weightDifference / timePeriod;

    if(goal === "Lose" && monthlyChange > 4) {
        insightMessage =
        "Your weight loss goal may be too fast. Consider choosing a longer time period.";
    }
    else if(goal === "Gain" && monthlyChange > 2) {
        insightMessage =
        "Your weight gain goal may be too fast. Consider choosing a longer time period."
    }

    // Show recommendation
    if(insightMessage !== "") {
        messageBox.textContent = insightMessage;
        messageBox.style.display = "block";
    }
    else {
        messageBox.textContent =
        "Your target looks good for your goal and timeline.";

        messageBox.style.display = "block";
    }
}


// FORM FIELD VALIDATION
function runFieldValidation(step) {
    let status = true;

    // remove previous errors 
        document.querySelectorAll(`.wizard-step[data-step="${step}"] .form-group`)
        .forEach(group => group.classList.remove('has-error'));


    // STEP 1 - PERSONAL DETAILS VALIDATION
    if(step === 1) {
        const name = document.getElementById('username');
        const gender = document.getElementById('gender');
        const age = document.getElementById('age');
        const height = document.getElementById('height');
        const weight = document.getElementById('weight');

        if(!name.value.trim()) {
            name.parentElement.parentElement.classList.add('has-error');
            status = false;
        }
        if(!gender.value) {
            gender.parentElement.parentElement.classList.add('has-error');
            status = false;
        }
        if(!age.value || age.value < 10 || age.value > 120) {
            age.parentElement.parentElement.classList.add('has-error');
            status = false;
        }
        if(!height.value || height.value < 50 || height.value > 250) {
            height.parentElement.parentElement.classList.add('has-error');
            status = false;
        }
        if(!weight.value || weight.value < 10 || weight.value > 300) {
            weight.parentElement.parentElement.classList.add('has-error');
            status = false;
        }
        // save personal details
        if(status) {
            clientProfileDataset.username = name.value;
            clientProfileDataset.gender = gender.value;
            clientProfileDataset.age = age.value;
            clientProfileDataset.height = height.value;
            clientProfileDataset.weight = weight.value;
        }
    }
    // STEP 2 - HEALTH GOAL VALIDATION
    else if(step === 2) {
        if(!document.getElementById('selectedGoalField').value) {
            document.getElementById('goalErrorMsg').parentElement.classList.add('has-error');
            status = false;
        }
    }
    // STEP 3 - TARGET SETTINGS VALIDATION
    else if(step === 3) {
        const targetWeight = document.getElementById('targetWeight');
        const timePeriod = document.getElementById('timePeriod');

        const currentWeight = Number(clientProfileDataset.weight);
        const goal = clientProfileDataset.healthGoal;

        const targetError = document.getElementById('targetWeightError');

        if(!targetWeight.value || targetWeight.value < 20 || targetWeight.value > 300) {
            targetWeight.parentElement.parentElement.classList.add('has-error');
            targetError.textContent = "Please enter a valid target weight.";
            status = false;
        } else {
            if(goal === "Lose" && Number(targetWeight.value) >= currentWeight) {
                targetWeight.parentElement.parentElement.classList.add('has-error');

                targetError.textContent =
                "Target weight should be lower than your current weight.";

                status = false;
            }
            else if(goal === "Gain" && Number(targetWeight.value) <= currentWeight) {
                targetWeight.parentElement.parentElement.classList.add('has-error');

                targetError.textContent =
                "Target weight should be higher than your current weight.";

                status = false;
            }
            else if(goal === "Maintain" && Math.abs(Number(targetWeight.value) - currentWeight) > 2) {
                targetWeight.parentElement.parentElement.classList.add('has-error');

                targetError.textContent =
                "Choose a target close to your current weight.";

                status = false;
            }
        }
        if(!timePeriod.value || timePeriod.value < 1 || timePeriod.value > 60) {
            timePeriod.parentElement.parentElement.classList.add('has-error');
            status = false;
        } 
        // save target information
        if(status) {
            clientProfileDataset.targetWeight = targetWeight.value;
            clientProfileDataset.timePeriod = timePeriod.value;
        }
    }
    // STEP 4 - ACCOUNT VALIDATION
    else if(step === 4) {
        const email = document.getElementById('accountEmail');
        const password = document.getElementById('accountPassword');
        const confirmPassword = document.getElementById('accountPasswordConfirm');
        const emailFilter = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordFilter = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if(!email.value.trim()) {
            email.parentElement.parentElement.classList.add('has-error');

            document.getElementById('emailError').textContent =
            "Please enter your email address.";

            status = false;
        }
        else if(!emailFilter.test(email.value)) {
            email.parentElement.parentElement.classList.add('has-error');

            document.getElementById('emailError').textContent =
            "Please enter a valid email address.";

            status = false;
        }
        if(!password.value.trim()) {
            password.parentElement.parentElement.classList.add('has-error');

            document.getElementById('passwordError').textContent =
            "Password is required.";

            status = false;
        }
        else if(!passwordFilter.test(password.value)) {
            password.parentElement.parentElement.classList.add('has-error');

            document.getElementById('passwordError').textContent =
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.";

            status = false;
        }
        if(!confirmPassword.value.trim()) {
            confirmPassword.parentElement.parentElement.classList.add('has-error');

            document.getElementById('confirmPasswordError').textContent =
            "Please confirm your password.";

            status = false;
        }
        else if(password.value !== confirmPassword.value) {
            confirmPassword.parentElement.parentElement.classList.add('has-error');

            document.getElementById('confirmPasswordError').textContent =
            "Passwords do not match.";

            status = false;
        }
        // save account information
        if(status) {
            clientProfileDataset.email = email.value;
            clientProfileDataset.password = password.value;
        }
    }
    return status;
}


// SIGNUP STEP NAVIGATION
function stepTransition(dir) {

    // validate before moving forward
    if(dir === 1 && !runFieldValidation(currentActiveStep)) {
        return;
    }
    // update current step
    currentActiveStep += dir;

    // Clear target recommendation when leaving Step 3
    if(currentActiveStep !== 3) {
        const messageBox = document.getElementById('targetInsightMsg');

        messageBox.style.display = "none";
        messageBox.textContent = "";
    }

    // complete signup process
    if(currentActiveStep > 4) {
        console.log(clientProfileDataset);
        fetch("php/signup.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(clientProfileDataset)
        })
        .then(response => response.json())
        .then(data => {
            if(data.status === "success") {
                const popup = document.getElementById("successPopup");
                popup.classList.add("active");
            } else {
                currentActiveStep = 4;

                document.querySelectorAll('.wizard-step')
                .forEach(step => step.classList.remove('active'));

                document.querySelector('.wizard-step[data-step="4"]')
                .classList.add('active');

                if(data.message === "An account with this email already exists."){

                    const emailError = document.getElementById("emailError");

                    emailError.textContent = data.message;

                    emailError.parentElement.classList.add('has-error');
                }
            }
        })
        .catch(error => {
            console.log(error);
        });
        return;
    }

    // hide all wizard steps
    document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));

    // show current wizard step
    document.querySelector(`.wizard-step[data-step="${currentActiveStep}"]`).classList.add('active');

    // Recalculate target recommendation when returning to Step 3
    if(currentActiveStep === 3) {
        showTargetInsight();
    }

    // update buttons
    document.getElementById('wizardBackBtn').style.display = currentActiveStep === 1 ? 'none' : 'flex';
    document.getElementById('wizardNextBtn').innerHTML = currentActiveStep === 4 ?
    'Create Account <i class="fa-solid fa-user-plus"></i>' : 'Next <i class="fa-solid fa-arrow-right"></i>';

    refreshProgressMatrix();
}


// PROGRESS BAR UPDATE
function refreshProgressMatrix() {
    document.querySelectorAll('.step-node').forEach(node => {
        const stepNumber = parseInt(node.getAttribute('data-node'));
        node.classList.remove('active', 'completed');
        if(stepNumber === currentActiveStep) { 
            node.classList.add('active');
        }
        else if(stepNumber < currentActiveStep) {
            node.classList.add('completed');
        }
    });

    // calculate progress percentage
    document.getElementById('wizardLineFill').style.width = `${((currentActiveStep - 1) / 3) * 100}%`;
}


// LOGIN PROCESS
function executeLoginRoute(e) {
    e.preventDefault();

    const emailInput = document.getElementById('logEmail');
    const passwordInput = document.getElementById('logPassword');

    const emailGroup = emailInput.parentElement.parentElement;
    const passwordGroup = passwordInput.parentElement.parentElement;

    // Remove previous errors
    emailGroup.classList.remove('has-error');
    passwordGroup.classList.remove('has-error');

    const loginData = {
        email: emailInput.value,
        password: passwordInput.value
    };

    fetch("php/login.php", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(loginData)
    })

    .then(response => response.json())
    .then(data => {
        if(data.status === "success"){
            window.location.href="dashboard.html";
        }
        else{
            if(data.message === "Email not found"){
                emailGroup.classList.add('has-error');
            }
            else if(data.message === "Incorrect password"){
                passwordGroup.classList.add('has-error');
            }
        }
    })
    .catch(error=>{
        console.log(error);
    });
}


// REMOVE LOGIN ERROR WHEN USER CLICKS INPUT
document.getElementById('logEmail').addEventListener('focus', function() {
    this.parentElement.parentElement.classList.remove('has-error');
});
document.getElementById('logPassword').addEventListener('focus', function() {
    this.parentElement.parentElement.classList.remove('has-error');
});


// REMOVE TARGET WEIGHT AND TIME PERIOD ERROR WHILE TYPING
document.getElementById('targetWeight').addEventListener('input', checkTargetWeight);
document.getElementById('timePeriod').addEventListener('focus', function() {
    this.parentElement.parentElement.classList.remove('has-error');
});


// REMOVE SIGNUP EMAIL ERROR WHEN USER CLICKS INPUT
document.getElementById('accountEmail').addEventListener('focus', function() {
    this.parentElement.parentElement.classList.remove('has-error');
    document.getElementById('emailError').textContent = "";
});

document.getElementById('accountPassword').addEventListener('focus', function() {
    this.parentElement.parentElement.classList.remove('has-error');
    document.getElementById('passwordError').textContent = "";
});

document.getElementById('accountPasswordConfirm').addEventListener('focus', function() {
    this.parentElement.parentElement.classList.remove('has-error');
    document.getElementById('confirmPasswordError').textContent = "";
});


// SUCCESS POPUP LOGIN REDIRECTION
document.getElementById("continueLoginBtn").addEventListener("click", function(){
    window.location.href = "auth.html?mode=login";
});


// PAGE INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if(mode === 'login') {
        toggleSidebarView('login');
    } 
    else {
        toggleSidebarView('signup');
    }
});


