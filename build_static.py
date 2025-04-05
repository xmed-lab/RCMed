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
    
    # Load image and label
    image = nib.load(image_path)
    label = nib.load(label_path)
    
    # Get data
    image_data = image.get_fdata()
    label_data = label.get_fdata()
    
    # Convert to list for JSON serialization
    return {
        'image': image_data.tolist(),
        'label': label_data.tolist()
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
    except Exception as e:
        print(f"Error generating 3D data: {e}")
        # Create empty data as fallback
        empty_data = {'image': [], 'label': []}
        with open('build/api/get_3d_data', 'w') as f:
            json.dump(empty_data, f)
        with open('build/get_3d_data', 'w') as f:
            json.dump(empty_data, f)
    
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
