let currentScene = null;
let currentCamera = null;
let currentRenderer = null;
let currentControls = null;
let animationFrameId = null;

document.addEventListener('DOMContentLoaded', function() {
    const loadBtn = document.getElementById('loadBtn');
    if (!loadBtn) return;

    loadBtn.addEventListener('click', async function() {
        const loadContainer = document.getElementById('load-container');
        const viewerContainer = document.getElementById('viewer-container');
        
        if (loadContainer && viewerContainer) {
            loadContainer.style.display = 'none';
            viewerContainer.style.display = 'block';
            await init3DViewer();
        }
    });
});

async function init3DViewer() {
    // Get containers
    const loadContainer = document.getElementById('load-container');
    const container = document.getElementById('viewer-container');
    
    if (!container || !loadContainer) {
        throw new Error('Required containers not found');
    }

    // Show the viewer container
    container.style.display = 'block';
    container.style.height = '600px';  // Set a fixed height
    container.style.position = 'relative';
    
    // Get UI controls
    const controlsContainer = container.querySelector('.controls');
    const volumeBtn = controlsContainer.querySelector('#volumeBtn');
    const maskBtn = controlsContainer.querySelector('#maskBtn');
    const volumeOpacitySlider = controlsContainer.querySelector('#volumeOpacitySlider');
    const maskOpacitySlider = controlsContainer.querySelector('#maskOpacitySlider');

    if (!controlsContainer || !volumeBtn || !maskBtn || !volumeOpacitySlider || !maskOpacitySlider) {
        throw new Error('Required UI controls not found');
    }

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading 3D data...';
    container.insertBefore(loadingDiv, controlsContainer);

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Hide loading indicator function
    const hideLoading = () => {
        const loading = container.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    };

    try {
        // Fetch the 3D data
        let response;
        try {
            response = await fetch('/api/get_3d_data');
        } catch (error) {
            console.log('Trying alternate path...');
            response = await fetch('/get_3d_data');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('Data loaded successfully:', {
            dimensions: data.dimensions,
            imageLength: data.image.length,
            labelLength: data.label.length
        });

        // Validate data structure
        if (!data.dimensions || !data.image || !data.label) {
            throw new Error('Missing required data fields');
        }

        // Create scene
        currentScene = new THREE.Scene();
        currentScene.background = new THREE.Color(0x1a1a1a);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        currentScene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        currentScene.add(directionalLight);

        // Create camera
        currentCamera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        currentCamera.position.set(2, 2, 2);
        currentCamera.lookAt(0, 0, 0);

        // Create renderer
        currentRenderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            canvas: document.createElement('canvas')
        });
        currentRenderer.setSize(container.clientWidth, container.clientHeight);
        currentRenderer.setPixelRatio(window.devicePixelRatio);
        currentRenderer.setClearColor(0x1a1a1a, 1);

        // Create renderer container
        const rendererContainer = document.createElement('div');
        rendererContainer.className = 'renderer-container';
        rendererContainer.style.position = 'absolute';
        rendererContainer.style.top = '0';
        rendererContainer.style.left = '0';
        rendererContainer.style.width = '100%';
        rendererContainer.style.height = '100%';
        rendererContainer.style.zIndex = '1';
        container.insertBefore(rendererContainer, controlsContainer);

        // Add renderer to container
        rendererContainer.appendChild(currentRenderer.domElement);

        // Controls
        currentControls = new THREE.OrbitControls(currentCamera, currentRenderer.domElement);
        currentControls.enableDamping = true;
        currentControls.dampingFactor = 0.05;
        currentControls.rotateSpeed = 0.5;
        currentControls.zoomSpeed = 1.2;
        currentControls.panSpeed = 0.8;
        currentControls.enableZoom = true;
        currentControls.enablePan = true;
        currentControls.enableRotate = true;
        currentControls.update();

        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);

        function onWindowResize() {
            const width = container.clientWidth;
            const height = container.clientHeight;
            currentCamera.aspect = width / height;
            currentCamera.updateProjectionMatrix();
            currentRenderer.setSize(width, height);
            currentRenderer.setPixelRatio(window.devicePixelRatio);
        }

        // Create points for volume visualization
        const { width, height, depth } = data.dimensions;
        console.log(`Processing data of size ${width}x${height}x${depth}`);
        
        const volumeGeometry = new THREE.BufferGeometry();
        const volumePositions = [];
        const volumeColors = [];
        
        // Debug data structure
        console.log('First 5 points:', data.image.slice(0, 5));
        console.log('Data dimensions:', data.dimensions);
        console.log('Total points:', data.image.length);
        
        // Process points
        data.image.forEach(point => {
            // Normalize coordinates to [-1, 1]
            const nx = (point.x / width) * 2 - 1;
            const ny = (point.y / height) * 2 - 1;
            const nz = (point.z / depth) * 2 - 1;
            
            volumePositions.push(nx, ny, nz);
            // Use value directly for color since data is already normalized
            volumeColors.push(point.v, point.v, point.v);
        });
        
        console.log('Volume positions length:', volumePositions.length);
        console.log('Volume colors length:', volumeColors.length);
        
        if (volumePositions.length === 0) {
            console.error('No points were added to the volume geometry');
            // Add more detailed debug info
            console.error('Debug info:', {
                dimensions: {width, height, depth},
                totalPoints: width * height * depth,
                processedPoints: lastIdx + 1,
                threshold: threshold,
                dataRange: {min: minVal, max: maxVal},
                firstValues: data.image.slice(0, 5)
            });
            throw new Error('No points added to volume geometry');
        }

        volumeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(volumePositions, 3));
        volumeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(volumeColors, 3));
        
        // Create volume point cloud
        const volumeMaterial = new THREE.PointsMaterial({
            size: 0.015,  // 减小点的大小
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            alphaTest: 0.5,
            blending: THREE.AdditiveBlending  // 使用叠加混合模式
        });
        
        const volumePoints = new THREE.Points(volumeGeometry, volumeMaterial);
        volumePoints.visible = true;
        currentScene.add(volumePoints);
        
        // Debug geometry
        console.log('Volume geometry attributes:', {
            position: volumeGeometry.attributes.position ? volumeGeometry.attributes.position.array.length : 0,
            color: volumeGeometry.attributes.color ? volumeGeometry.attributes.color.array.length : 0
        });

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            currentControls.update();
            currentRenderer.render(currentScene, currentCamera);
        }
        animate();

        // Hide loading indicator
        hideLoading();

        // Move controls to the top of the container
        controlsContainer.style.position = 'relative';
        controlsContainer.style.zIndex = '2';
        controlsContainer.style.pointerEvents = 'auto';

        // Process label data
        const labelGeometry = new THREE.BufferGeometry();
        const labelPositions = [];
        
        // Process label points
        data.label.forEach(point => {
            // Normalize coordinates to [-1, 1]
            const nx = (point.x / width) * 2 - 1;
            const ny = (point.y / height) * 2 - 1;
            const nz = (point.z / depth) * 2 - 1;
            labelPositions.push(nx, ny, nz);
        });
        
        console.log('Label positions length:', labelPositions.length);

        if (labelPositions.length === 0) {
            console.error('No points were added to the label geometry');
        }

        labelGeometry.setAttribute('position', new THREE.Float32BufferAttribute(labelPositions, 3));
        
        // Create label point cloud
        const labelMaterial = new THREE.PointsMaterial({
            size: 0.015,  // 减小点的大小
            color: 0x00b4d8,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            alphaTest: 0.5,
            blending: THREE.AdditiveBlending  // 使用叠加混合模式
        });
        
        const labelPoints = new THREE.Points(labelGeometry, labelMaterial);
        labelPoints.visible = true;
        currentScene.add(labelPoints);

        // Add event listeners for UI controls
        volumeBtn.addEventListener('click', () => {
            volumeBtn.classList.toggle('active');
            volumePoints.visible = volumeBtn.classList.contains('active');
            currentRenderer.render(currentScene, currentCamera);
        });

        maskBtn.addEventListener('click', () => {
            maskBtn.classList.toggle('active');
            labelPoints.visible = maskBtn.classList.contains('active');
            currentRenderer.render(currentScene, currentCamera);
        });

        volumeOpacitySlider.addEventListener('input', (e) => {
            const opacity = e.target.value / 100;
            volumeMaterial.opacity = opacity;
            volumeMaterial.needsUpdate = true;
            currentRenderer.render(currentScene, currentCamera);
        });

        maskOpacitySlider.addEventListener('input', (e) => {
            const opacity = e.target.value / 100;
            labelMaterial.opacity = opacity;
            labelMaterial.needsUpdate = true;
            currentRenderer.render(currentScene, currentCamera);
        });

    } catch (error) {
        console.error('Error in 3D viewer:', error);
        hideLoading();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-light text-center';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>Failed to load 3D data: ${error.message}`;
        container.appendChild(errorDiv);
        throw error;
    }
}
