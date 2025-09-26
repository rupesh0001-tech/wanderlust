document.addEventListener('DOMContentLoaded', () => {
    const stars = document.querySelectorAll('.starability-slot input[type="radio"]');
    const ratingInput = document.querySelector('.starability-slot input[name="review[rating]"]:checked');

    function highlightStars(rating) {
        stars.forEach(star => {
            if (parseInt(star.value) <= rating) {
                star.nextElementSibling.style.color = '#ffc107'; // Highlight color
            } else {
                star.nextElementSibling.style.color = '#ccc'; // Default color
            }
        });
    }

    // Initial highlight based on pre-selected rating (if any)
    if (ratingInput) {
        highlightStars(parseInt(ratingInput.value));
    }

    stars.forEach(star => {
        star.addEventListener('change', (event) => {
            highlightStars(parseInt(event.target.value));
        });

        star.nextElementSibling.addEventListener('mouseenter', (event) => {
            const hoveredStarValue = parseInt(event.target.previousElementSibling.value);
            highlightStars(hoveredStarValue);
        });

        star.nextElementSibling.addEventListener('mouseleave', () => {
            if (ratingInput) {
                highlightStars(parseInt(ratingInput.value));
            } else {
                highlightStars(0); // No rating selected, clear highlight
            }
        });
    });

    // Form validation for review submission
    const reviewForm = document.querySelector('.review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (event) => {
            if (!reviewForm.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            reviewForm.classList.add('was-validated');
        }, false);
    }

    // Delete confirmation for reviews (optional, can be enhanced with modals)
    const deleteReviewForms = document.querySelectorAll('.delete-review-form');
    deleteReviewForms.forEach(form => {
        form.addEventListener('submit', (event) => {
            if (!confirm('Are you sure you want to delete this review?')) {
                event.preventDefault();
            }
        });
    });
});