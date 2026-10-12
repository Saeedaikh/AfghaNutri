// Display a message if the user's session ended because of inactivity
const logoutMessage = sessionStorage.getItem("logoutMessage");

if (logoutMessage) {

    alert(logoutMessage);

    // Remove the message after displaying it
    sessionStorage.removeItem("logoutMessage");
}


// ABOUT SECTION - SCROLL REVEAL ANIMATION
const aboutSection = document.querySelector(".about");
const images = document.querySelectorAll(".about-food");

window.addEventListener("scroll", () => {

    const sectionTop = aboutSection.offsetTop;
    const sectionHeight = aboutSection.offsetHeight;
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    // how far user is inside the section (0 → 1)
    let progress = (scrollY + windowHeight - sectionTop) / sectionHeight;

    // clamp between 0 and 1
    progress = Math.max(0, Math.min(1, progress));

    // each image appears at different scroll thresholds
    const thresholds = [0.4, 0.6, 0.8];

    images.forEach((img, index) => {

        if(progress > thresholds[index]) {
            img.style.opacity = "1";
            img.style.transform = "translateX(0)";
        } else {
            img.style.opacity = "0";
            img.style.transform = "translateX(-120px)";
        }
    });
});


// APP PREVIEW SECTION - CARD REVEAL ANIMATION
const previewSection = document.querySelector('.app-preview');
const cards = document.querySelectorAll('.preview-card');

window.addEventListener('scroll', () => {
    const rect = previewSection.getBoundingClientRect();

    if (
        rect.top < window.innerHeight * 0.5 &&
        rect.bottom > window.innerHeight * 0.2
    ) {
        cards.forEach((card) => {
            card.classList.add('show');
        });
    } else {
        cards.forEach((card) => {
            card.classList.remove('show');
        });
    }
});


// FAQ SECTION - ACCORDION TOGGLE
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");

    question.addEventListener("click", () => {
        item.classList.toggle("active");
    });
});


// AUTH SECTION - LOGIN & SIGN-UP
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');

    if (mode === 'login') {
        toggleSidebarView('login');
    } else {
        toggleSidebarView('signup');
    }
});