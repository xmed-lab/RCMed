document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const casesContainer = document.getElementById('cases-container');

    // Helper function to show ONLY items of selected modality
    function showModalityItems(selectedModality) {
        // Hide all items first
        const allItems = casesContainer.querySelectorAll('.case-item');
        allItems.forEach(item => {
            if (item.getAttribute('data-modality') === selectedModality) {
                item.style.display = 'block';
                // Initialize slider if needed
                const slider = item.querySelector('.image-compare');
                if (slider && !slider.hasAttribute('data-initialized')) {
                    initComparisonSlider(slider);
                    slider.setAttribute('data-initialized', 'true');
                }
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Add click event listeners to filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show ONLY items of selected modality
            const selectedModality = button.getAttribute('data-modality');
            showModalityItems(selectedModality);
        });
    });

    // Initialize all sliders
    casesContainer.querySelectorAll('.image-compare').forEach(slider => {
        if (!slider.hasAttribute('data-initialized')) {
            initComparisonSlider(slider);
            slider.setAttribute('data-initialized', 'true');
        }
    });

    // Initially show only CT items and set CT button as active
    const ctButton = Array.from(filterButtons).find(btn => 
        btn.getAttribute('data-modality') === 'ct'
    );
    if (ctButton) {
        ctButton.classList.add('active');
        showModalityItems('ct');
    }
});
