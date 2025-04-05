import os
import shutil
import json
import nibabel as nib
import numpy as np
from jinja2 import Environment, FileSystemLoader
from app import get_cases_from_files

def get_3d_data():
    image_path = os.path.join('static', 'images', 'image.nii.gz')
    label_path = os.path.join('static', 'images', 'label.nii.gz')
    
    try:
        # Load image and label
        image = nib.load(image_path)
        label = nib.load(label_path)
        
        # Get data and convert to numpy arrays
        image_data = np.array(image.get_fdata(), dtype=np.float32)
        label_data = np.array(label.get_fdata(), dtype=np.float32)
        
        # Normalize image data to [0, 1]
        image_data = (image_data - image_data.min()) / (image_data.max() - image_data.min())
        
        # Ensure label data is binary
        label_data = (label_data > 0).astype(np.float32)
        
        # Convert to Python lists
        return {
            'image': image_data.tolist(),
            'label': label_data.tolist(),
            'dimensions': {
                'width': int(image_data.shape[0]),
                'height': int(image_data.shape[1]),
                'depth': int(image_data.shape[2])
            }
        }
    except Exception as e:
        print(f"Error loading 3D data: {e}")
        # Return a small test cube as fallback
        size = 32
        test_data = np.zeros((size, size, size), dtype=np.float32)
        test_data[size//4:3*size//4, size//4:3*size//4, size//4:3*size//4] = 1.0
        return {
            'image': test_data.tolist(),
            'label': test_data.tolist(),
            'dimensions': {
                'width': size,
                'height': size,
                'depth': size
            }
        }

def build_static_site():
    # Create build directory
    if os.path.exists('build'):
        shutil.rmtree('build')
    os.makedirs('build')
    os.makedirs('build/api')  # Create api directory
    
    # Copy static files
    shutil.copytree('static', 'build/static')
    
    # Setup Jinja2 environment
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('index.html')
    
    # Get cases data
    cases = get_cases_from_files()
    
    # Create a simple url_for replacement
    def url_for(endpoint, filename=None):
        if endpoint == 'static':
            return f'static/{filename}'
        return ''
    
    # Render main template
    html_content = template.render(
        cases=cases,
        url_for=url_for
    )
    
    # Write index.html
    with open('build/index.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    # Generate and write 3D data
    try:
        data = get_3d_data()
        # Save to both locations to ensure it's found
        with open('build/api/get_3d_data', 'w') as f:
            json.dump(data, f)
        with open('build/get_3d_data', 'w') as f:
            json.dump(data, f)
        print("Successfully generated 3D data")
    except Exception as e:
        print(f"Error generating 3D data: {e}")
        # Create test data as fallback
        size = 32
        test_data = np.zeros((size, size, size), dtype=np.float32)
        test_data[size//4:3*size//4, size//4:3*size//4, size//4:3*size//4] = 1.0
        fallback_data = {
            'image': test_data.tolist(),
            'label': test_data.tolist(),
            'dimensions': {
                'width': size,
                'height': size,
                'depth': size
            }
        }
        with open('build/api/get_3d_data', 'w') as f:
            json.dump(fallback_data, f)
        with open('build/get_3d_data', 'w') as f:
            json.dump(fallback_data, f)
        print("Generated fallback 3D data")
    
    # Create 404 page
    with open('build/404.html', 'w', encoding='utf-8') as f:
        f.write('''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>RCMed - Medical Image Analysis</title>
    <script>
        window.location.href = "/RCMed/";
    </script>
</head>
<body>
    <p>Redirecting to <a href="/RCMed/">RCMed</a>...</p>
</body>
</html>
        ''')

if __name__ == '__main__':
    build_static_site()
