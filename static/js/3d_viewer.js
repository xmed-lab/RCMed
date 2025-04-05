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
    // Get UI controls first
    const container = document.getElementById('viewer-container');
    const controls = document.querySelector('.controls');
    const volumeBtn = document.getElementById('volumeBtn');
    const maskBtn = document.getElementById('maskBtn');
    const volumeOpacitySlider = document.getElementById('volumeOpacitySlider');
    const maskOpacitySlider = document.getElementById('maskOpacitySlider');

    if (!container || !controls || !volumeBtn || !maskBtn || !volumeOpacitySlider || !maskOpacitySlider) {
        throw new Error('Required UI controls not found');
    }

    // Clean up previous scene if it exists
    if (currentRenderer) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        currentRenderer.dispose();
        currentScene = null;
        currentCamera = null;
        currentRenderer = null;
        currentControls = null;
    }

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading 3D data...';
    container.insertBefore(loadingDiv, controls);

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    currentScene = new THREE.Scene();
    currentCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    currentRenderer = new THREE.WebGLRenderer({ antialias: true });
    currentRenderer.setSize(width, height);
    currentRenderer.setClearColor(0x1a1a1a);
    container.insertBefore(currentRenderer.domElement, controls);

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

    // Position camera
    currentCamera.position.set(3, 3, 3);
    currentCamera.lookAt(0, 0, 0);
    currentControls.update();

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
            response = await fetch('/RCMed/api/get_3d_data');
        } catch (error) {
            console.log('Trying alternate path...');
            response = await fetch('/RCMed/get_3d_data');
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data.image || !data.label || !data.dimensions) {
            throw new Error('Invalid data format received from server');
        }
        
        console.log('Received data dimensions:', data.dimensions);
        
        if (!data.dimensions || !data.image || !data.label) {
            throw new Error('Invalid data format received from server');
        }
        
        if (!Array.isArray(data.image) || !Array.isArray(data.label)) {
            throw new Error('Image or label data is not an array');
        }
        
        // Create points for volume visualization
        const { width, height, depth } = data.dimensions;
        console.log(`Processing data of size ${width}x${height}x${depth}`);
        
        console.log('Creating point clouds...');
        console.log('Data dimensions:', dimensions);
        
        const volumeGeometry = new THREE.BufferGeometry();
        const volumePositions = [];
        const volumeColors = [];
        
        // Process volume data with interpolation
        console.log('Processing volume data...');
        const step = 0.5; // Smaller step for smoother interpolation
        for (let z = 0; z < depth; z += step) {
            for (let y = 0; y < height; y += step) {
                for (let x = 0; x < width; x += step) {
                    // Interpolate between grid points
                    const x0 = Math.floor(x);
                    const y0 = Math.floor(y);
                    const z0 = Math.floor(z);
                    const x1 = Math.min(x0 + 1, width - 1);
                    const y1 = Math.min(y0 + 1, height - 1);
                    const z1 = Math.min(z0 + 1, depth - 1);
                    
                    const fx = x - x0;
                    const fy = y - y0;
                    const fz = z - z0;
                    
                    // Get indices for the current position
                    const idx000 = (x0 * height * depth) + (y0 * depth) + z0;
                    const idx001 = (x0 * height * depth) + (y0 * depth) + z1;
                    const idx010 = (x0 * height * depth) + (y1 * depth) + z0;
                    const idx011 = (x0 * height * depth) + (y1 * depth) + z1;
                    const idx100 = (x1 * height * depth) + (y0 * depth) + z0;
                    const idx101 = (x1 * height * depth) + (y0 * depth) + z1;
                    const idx110 = (x1 * height * depth) + (y1 * depth) + z0;
                    const idx111 = (x1 * height * depth) + (y1 * depth) + z1;
                    
                    // Trilinear interpolation
                    const v000 = data.image[idx000] || 0;
                    const v001 = data.image[idx001] || 0;
                    const v010 = data.image[idx010] || 0;
                    const v011 = data.image[idx011] || 0;
                    const v100 = data.image[idx100] || 0;
                    const v101 = data.image[idx101] || 0;
                    const v110 = data.image[idx110] || 0;
                    const v111 = data.image[idx111] || 0;
                    
                    const value = (1 - fx) * (1 - fy) * (1 - fz) * v000 +
                                 fx * (1 - fy) * (1 - fz) * v100 +
                                 (1 - fx) * fy * (1 - fz) * v010 +
                                 fx * fy * (1 - fz) * v110 +
                                 (1 - fx) * (1 - fy) * fz * v001 +
                                 fx * (1 - fy) * fz * v101 +
                                 (1 - fx) * fy * fz * v011 +
                                 fx * fy * fz * v111;
                    if (value > 30) {  // Lower threshold to include more points
                        // Normalize coordinates to [-1, 1]
                        const nx = (x / width) * 2 - 1;
                        const ny = (y / height) * 2 - 1;
                        const nz = (z / depth) * 2 - 1;
                        
                        volumePositions.push(nx, ny, nz);
                        
                        // Normalize value to [0, 1] for color with increased brightness
                        const intensity = Math.min(1.0, (value / 255) * 2.5);
                        volumeColors.push(intensity, intensity, intensity);
                    }
                }
            }
        }
        
        volumeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(volumePositions, 3));
        volumeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(volumeColors, 3));
        
        // Create volume point cloud
        const volumeMaterial = new THREE.PointsMaterial({
            size: 0.025,
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true
        });
        
        const volumePoints = new THREE.Points(volumeGeometry, volumeMaterial);
        
        // Create points for label visualization
        console.log('Processing label data...');
        const labelGeometry = new THREE.BufferGeometry();
        const labelPositions = [];
        
        // Process label data with interpolation
        const labelStep = 0.5; // Same step size as volume for consistency
        for (let z = 0; z < depth; z += labelStep) {
            for (let y = 0; y < height; y += labelStep) {
                for (let x = 0; x < width; x += labelStep) {
                    // Interpolate between grid points
                    const x0 = Math.floor(x);
                    const y0 = Math.floor(y);
                    const z0 = Math.floor(z);
                    const x1 = Math.min(x0 + 1, width - 1);
                    const y1 = Math.min(y0 + 1, height - 1);
                    const z1 = Math.min(z0 + 1, depth - 1);
                    
                    const fx = x - x0;
                    const fy = y - y0;
                    const fz = z - z0;
                    
                    // Trilinear interpolation for labels
                    const v000 = data.label[x0][y0][z0];
                    const v001 = data.label[x0][y0][z1];
                    const v010 = data.label[x0][y1][z0];
                    const v011 = data.label[x0][y1][z1];
                    const v100 = data.label[x1][y0][z0];
                    const v101 = data.label[x1][y0][z1];
                    const v110 = data.label[x1][y1][z0];
                    const v111 = data.label[x1][y1][z1];
                    
                    const value = (1 - fx) * (1 - fy) * (1 - fz) * v000 +
                                 fx * (1 - fy) * (1 - fz) * v100 +
                                 (1 - fx) * fy * (1 - fz) * v010 +
                                 fx * fy * (1 - fz) * v110 +
                                 (1 - fx) * (1 - fy) * fz * v001 +
                                 fx * (1 - fy) * fz * v101 +
                                 (1 - fx) * fy * fz * v011 +
                                 fx * fy * fz * v111;
                    
                    if (value > 0.5) {  // Threshold for interpolated labels
                        const nx = (x / width) * 2 - 1;
                        const ny = (y / height) * 2 - 1;
                        const nz = (z / depth) * 2 - 1;
                        labelPositions.push(nx, ny, nz);
                    }
                }
            }
        }
        
        labelGeometry.setAttribute('position', new THREE.Float32BufferAttribute(labelPositions, 3));
        
        // Create label point cloud
        const labelMaterial = new THREE.PointsMaterial({
            size: 0.025,
            color: 0x00b4d8,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });
        
        const labelPoints = new THREE.Points(labelGeometry, labelMaterial);
        labelPoints.visible = false;
        
        // Add to scene
        currentScene.add(volumePoints);
        currentScene.add(labelPoints);
        
        // Hide loading indicator
        hideLoading();

        // UI Controls
        const volumeBtn = document.getElementById('volumeBtn');
        const maskBtn = document.getElementById('maskBtn');
        const volumeOpacitySlider = document.getElementById('volumeOpacitySlider');
        const maskOpacitySlider = document.getElementById('maskOpacitySlider');

        if (!volumeBtn || !maskBtn || !volumeOpacitySlider || !maskOpacitySlider) {
            throw new Error('Required UI controls not found');
        }

        // Initially show both
        volumePoints.visible = true;
        labelPoints.visible = true;
        
        // Set both buttons as active initially
        volumeBtn.classList.add('active');
        maskBtn.classList.add('active');

        // Volume button click handler
        volumeBtn.addEventListener('click', () => {
            volumeBtn.classList.toggle('active');
            volumePoints.visible = !volumePoints.visible;
            currentRenderer.render(currentScene, currentCamera);
        });

        // Mask button click handler
        maskBtn.addEventListener('click', () => {
            maskBtn.classList.toggle('active');
            labelPoints.visible = !labelPoints.visible;
            currentRenderer.render(currentScene, currentCamera);
        });

        // Volume opacity slider
        volumeOpacitySlider.addEventListener('input', (event) => {
            const opacity = event.target.value / 100;
            volumePoints.material.opacity = opacity;
            currentRenderer.render(currentScene, currentCamera);
        });

        // Mask opacity slider
        maskOpacitySlider.addEventListener('input', (event) => {
            const opacity = event.target.value / 100;
            labelPoints.material.opacity = opacity;
            currentRenderer.render(currentScene, currentCamera);
        });



        // Animation loop
        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            currentControls.update();
            currentRenderer.render(currentScene, currentCamera);
        }
        animate();

        // Handle window resize
        const handleResize = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            currentCamera.aspect = width / height;
            currentCamera.updateProjectionMatrix();
            currentRenderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Clean up function
        const cleanup = () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (currentRenderer) {
                currentRenderer.dispose();
            }
            if (container) {
                container.innerHTML = '';
            }
        };

        // Add cleanup function to container
        container.cleanup = cleanup;

    } catch (error) {
        console.error('Error loading 3D data:', error);
        hideLoading();
        container.innerHTML = '<div class="alert alert-danger m-3">Error loading 3D data: ' + error.message + '</div>';
    }
}
