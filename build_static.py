import os
import shutil
import json
import numpy as np
from jinja2 import Environment, FileSystemLoader
from app import get_cases_from_files

def create_test_data():
    # Create a simple 3D shape (a sphere)
    size = 32
    center = size // 2
    radius = size // 4
    
    # Create coordinate grids
    x, y, z = np.ogrid[:size, :size, :size]
    
    # Create a sphere
    sphere = (x - center)**2 + (y - center)**2 + (z - center)**2 <= radius**2
    
    # Convert to float32
    image_data = sphere.astype(np.float32)
    label_data = sphere.astype(np.float32)
    
    # Create the data structure
    data = {
        'dimensions': {
            'width': size,
            'height': size,
            'depth': size
        },
        'image': image_data.ravel().tolist(),
        'label': label_data.ravel().tolist()
    }
    
    return data

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
    data = create_test_data()
    
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
