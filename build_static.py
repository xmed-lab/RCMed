import os
import shutil
import json
import numpy as np
from jinja2 import Environment, FileSystemLoader
from app import get_cases_from_files

def create_3d_data():
    try:
        # Load NIfTI files
        image_path = os.path.join('static', 'images', 'image.nii.gz')
        label_path = os.path.join('static', 'images', 'label.nii.gz')
        
        if not os.path.exists(image_path) or not os.path.exists(label_path):
            raise FileNotFoundError('NIfTI files not found')
        
        import nibabel as nib
        
        # Load image and label data
        image_nii = nib.load(image_path)
        label_nii = nib.load(label_path)
        
        # Get the data arrays
        image_data = image_nii.get_fdata()
        label_data = label_nii.get_fdata()
        
        # Normalize image data to [0, 1]
        image_min = np.min(image_data)
        image_max = np.max(image_data)
        image_data = (image_data - image_min) / (image_max - image_min)
        
        # Convert to float32
        image_data = image_data.astype(np.float32)
        label_data = label_data.astype(np.float32)
        
        # Get dimensions
        width, height, depth = image_data.shape
        
        # Create the data structure
        data = {
            'dimensions': {
                'width': int(width),
                'height': int(height),
                'depth': int(depth)
            },
            'image': np.ascontiguousarray(image_data.transpose(2, 1, 0)).ravel().tolist(),
            'label': np.ascontiguousarray(label_data.transpose(2, 1, 0)).ravel().tolist()
        }
        
        print(f'Successfully loaded 3D data with shape: {image_data.shape}')
        print(f'Image range: [{np.min(image_data)}, {np.max(image_data)}]')
        
        return data
        
    except Exception as e:
        print(f'Error loading 3D data: {str(e)}')
        # Return a small test cube as fallback
        size = 16
        image_data = np.zeros((size, size, size), dtype=np.float32)
        image_data[4:12, 4:12, 4:12] = 1.0
        label_data = image_data.copy()
        
        return {
            'dimensions': {
                'width': size,
                'height': size,
                'depth': size
            },
            'image': np.ascontiguousarray(image_data.transpose(2, 1, 0)).ravel().tolist(),
            'label': np.ascontiguousarray(label_data.transpose(2, 1, 0)).ravel().tolist()
        }

def build_static_site():
    # Create build directory
    if os.path.exists('build'):
        shutil.rmtree('build')
    os.makedirs('build')
    os.makedirs('build/api')
    
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
    data = create_3d_data()
    
    # Save data with pretty printing for debugging
    with open('build/api/get_3d_data', 'w') as f:
        json.dump(data, f, indent=2)
    with open('build/get_3d_data', 'w') as f:
        json.dump(data, f, indent=2)
    
    print("Generated test 3D data with dimensions:", data['dimensions'])
    print("Data ranges - Image:", 
          f"min={min(data['image'])}, max={max(data['image'])}")
    
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
