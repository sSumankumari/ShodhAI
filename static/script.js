document.addEventListener('DOMContentLoaded', function() {
    const slidesContainer = document.getElementById("slides");
    const prevButton = document.getElementById("slide-arrow-prev");
    const nextButton = document.getElementById("slide-arrow-next");

    nextButton.addEventListener("click", () => {
        const slideWidth = slidesContainer.querySelector(".feature-card").offsetWidth + 24; // 24px for gap
        slidesContainer.scrollLeft += slideWidth;
    });

    prevButton.addEventListener("click", () => {
        const slideWidth = slidesContainer.querySelector(".feature-card").offsetWidth + 24; // 24px for gap
        slidesContainer.scrollLeft -= slideWidth;
    });
});