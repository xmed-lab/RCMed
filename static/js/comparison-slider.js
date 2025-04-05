document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.image-compare');
    if (!container) return;

    const handle = container.querySelector('.slider-handle');
    const segmentedImage = container.querySelector('.segmented-image');
    let isDragging = false;

    const updateSliderPosition = (e) => {
        const rect = container.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;

        handle.style.left = `${percentage}%`;
        handle.querySelector('.slider-line').style.left = `${percentage}%`;
        segmentedImage.style.clipPath = `inset(0 0 0 ${percentage}%)`;
    };

    handle.addEventListener('mousedown', () => {
        isDragging = true;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        updateSliderPosition(e);
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch events
    handle.addEventListener('touchstart', (e) => {
        isDragging = true;
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        updateSliderPosition(e.touches[0]);
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });

    const sliders = document.querySelectorAll('.image-compare');
    
    sliders.forEach(slider => {
        const handle = slider.querySelector('.slider-handle');
        const segmentedImage = slider.querySelector('.segmented-image');
        let isDragging = false;

        // Handle mouse events
        handle.addEventListener('mousedown', startDragging);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDragging);

        // Handle touch events
        handle.addEventListener('touchstart', startDragging);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', stopDragging);

        function startDragging(e) {
            isDragging = true;
            handle.style.cursor = 'grabbing';
            e.preventDefault();
        }

        function stopDragging() {
            isDragging = false;
            handle.style.cursor = 'grab';
        }

        function drag(e) {
            if (!isDragging) return;

            const sliderRect = slider.getBoundingClientRect();
            const x = (e.type === 'mousemove' ? e.clientX : e.touches[0].clientX) - sliderRect.left;
            const position = Math.max(0, Math.min(x / sliderRect.width * 100, 100));

            handle.style.left = `${position}%`;
            slider.querySelector('.slider-line').style.left = `${position}%`;
            segmentedImage.style.clipPath = `inset(0 0 0 ${position}%)`;
        }

        // Initial position
        const initialPosition = 50;
        handle.style.left = `${initialPosition}%`;
        slider.querySelector('.slider-line').style.left = `${initialPosition}%`;
        segmentedImage.style.clipPath = `inset(0 0 0 ${initialPosition}%)`;
    });
});
