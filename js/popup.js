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

// REUSABLE CONFIRMATION POPUP
let confirmationAction = null;
function showConfirmation(title, message, action) {
    document.getElementById("deletePopupTitle").textContent = title;
    document.getElementById("deletePopupMessage").textContent = message;
    confirmationAction = action;
    document.getElementById("deleteConfirmPopup").classList.add("show");

}

// CLOSE DELETE CONFIRMATION POPUP
function closeConfirmation() {
    document.getElementById("deleteConfirmPopup").classList.remove("show");
    confirmationAction = null;
}


// DELETE CONFIRMATION CANCEL BUTTON
document.getElementById("deleteCancelBtn").addEventListener("click", function() {
    closeConfirmation();
});


// DELETE CONFIRMATION OKAY BUTTON
document.getElementById("deleteOkayBtn").addEventListener("click", function() {
    if (confirmationAction) {
        const action = confirmationAction;
        closeConfirmation();
        action();
    }
});