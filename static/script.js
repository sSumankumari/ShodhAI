document.addEventListener('DOMContentLoaded', function() {
    const slidesContainer = document.getElementById("slides");
    const prevButton = document.getElementById("slide-arrow-prev");
    const nextButton = document.getElementById("slide-arrow-next");
    const indicators = document.querySelectorAll(".indicator");
    
    let currentSlide = 0;
    const totalSlides = document.querySelectorAll(".feature-card").length;
    
    // Function to update the slider position
    function updateSlider() {
        slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update indicators
        indicators.forEach((indicator, index) => {
            if (index === currentSlide) {
                indicator.classList.add("active");
            } else {
                indicator.classList.remove("active");
            }
        });
    }
    
    // Next button event listener
    nextButton.addEventListener("click", () => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlider();
    });
    
    // Previous button event listener
    prevButton.addEventListener("click", () => {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateSlider();
    });
    
    // Indicator click events
    indicators.forEach((indicator) => {
        indicator.addEventListener("click", () => {
            currentSlide = parseInt(indicator.getAttribute("data-index"));
            updateSlider();
        });
    });
    
    // Initialize slider
    updateSlider();
    
    // Auto-play the slider (optional)
    const autoplayInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlider();
    }, 7000); // Change slide every 7 seconds (increased to give more reading time)
    
    // Pause autoplay on hover
    slidesContainer.addEventListener("mouseenter", () => {
        clearInterval(autoplayInterval);
    });
    
    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlider();
        } else if (e.key === 'ArrowLeft') {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateSlider();
        }
    });
});