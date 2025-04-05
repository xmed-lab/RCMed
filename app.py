from flask import Flask, render_template, jsonify
import nibabel as nib
import numpy as np
import os
from PIL import Image

app = Flask(__name__, static_url_path='/RCMed/static')

# Configure for GitHub Pages
app.config['FREEZER_DESTINATION'] = 'build'
app.config['FREEZER_RELATIVE_URLS'] = True

def resize_image(image_path, target_size=1024):
    with Image.open(image_path) as img:
        # Get original dimensions
        width, height = img.size
        
        # Calculate new dimensions
        if width > height:
            new_width = target_size
            new_height = int(height * (target_size / width))
        else:
            new_height = target_size
            new_width = int(width * (target_size / height))
        
        # Resize image
        resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Save resized image
        resized_img.save(image_path)

def get_cases_from_files():
    cases = []
    image_dir = os.path.join('static', 'images', 'images_2d')
    files = os.listdir(image_dir)
    image_files = [f for f in files if f.endswith('--image.png')]
    
    modality_descriptions = {
        'ct': 'Computed Tomography',
        'mr': 'Magnetic Resonance',
        'x_ray': 'X-Ray',
        'ultrasound': 'Ultrasound',
        'pet': 'Positron Emission Tomography',
        'pathology': 'Pathology',
        'dermoscopy': 'Dermoscopy',
        'endoscopy': 'Endoscopy',
        'fundus': 'Fundus Photography'
    }
    
    class_descriptions = {
        'aorta': 'Segmentation of the aorta for cardiovascular analysis',
        'pelvic': 'Pelvic structure segmentation for surgical planning',
        'spine': 'Spine segmentation for orthopedic assessment',
        'skin_lesion': 'Skin lesion analysis for dermatological diagnosis',
        'polyp': 'Polyp detection and segmentation in colonoscopy',
        'lesion': 'Lesion detection and analysis',
        'brain_tumor': 'Brain tumor segmentation for treatment planning',
        'arterioles': 'Arteriole analysis in pathological samples',
        'gland': 'Glandular structure segmentation in histology',
        'brachial_plexus': 'Brachial plexus nerve identification',
        'breast_cancer': 'Breast cancer detection and analysis',
        'pneumothorax': 'Pneumothorax detection in chest X-rays'
    }
    
    # Process and sort files
    cases_data = []
    for image_file in sorted(image_files):
        # Get full paths
        image_path = os.path.join(image_dir, image_file)
        mask_file = image_file.replace('--image.png', '--mask.png')
        mask_path = os.path.join(image_dir, mask_file)
        
        # Resize images if needed
        resize_image(image_path)
        resize_image(mask_path)
        
        # Parse filename components
        modality, class_name, _ = image_file.split('--')
        
        # Create the case title
        title = f"{modality_descriptions.get(modality, modality.title())} {class_name.replace('_', ' ').title()}"
        
        # Create description
        description = class_descriptions.get(class_name, f"AI-powered segmentation of {class_name.replace('_', ' ')}")
        
        # Get corresponding mask file
        mask_file = image_file.replace('--image.png', '--mask.png')
        
        cases_data.append({
            'title': title,
            'description': description,
            'modality': modality,
            'class_name': class_name,
            'original': os.path.join('images_2d', image_file),
            'segmented': os.path.join('images_2d', mask_file)
        })
    
    # Sort cases: method first, then others
    method_cases = [case for case in cases_data if case['class_name'] == 'method']
    other_cases = [case for case in cases_data if case['class_name'] != 'method']
    
    # Add IDs to sorted cases
    for idx, case in enumerate(method_cases + other_cases):
        case['id'] = idx + 1
        cases.append(case)
    
    return cases

# Get cases from files
SAMPLE_CASES = get_cases_from_files()

@app.route('/')
def index():
    return render_template('index.html', cases=SAMPLE_CASES)

@app.route('/api/get_3d_data')
def get_3d_data():
    try:
        # Load the NIfTI files
        image_path = os.path.join('static', 'images', 'image.nii.gz')
        label_path = os.path.join('static', 'images', 'label.nii.gz')
        
        print(f'Loading image from: {os.path.abspath(image_path)}')
        print(f'Loading label from: {os.path.abspath(label_path)}')
        
        if not os.path.exists(image_path) or not os.path.exists(label_path):
            return jsonify({
                'error': 'NIfTI files not found',
                'image_exists': os.path.exists(image_path),
                'label_exists': os.path.exists(label_path)
            }), 404
        
        image_nii = nib.load(image_path)
        label_nii = nib.load(label_path)
        
        # Get the data arrays
        image_data = np.array(image_nii.get_fdata())
        label_data = np.array(label_nii.get_fdata())
        
        print(f'Image data shape: {image_data.shape}')
        print(f'Image data type: {image_data.dtype}')
        print(f'Image data range: {image_data.min()} to {image_data.max()}')
        print(f'Label data shape: {label_data.shape}')
        print(f'Label data type: {label_data.dtype}')
        print(f'Label data range: {label_data.min()} to {label_data.max()}')
        
        # Convert to uint8 (0-255)
        image_data = np.clip(image_data, 0, None)  # Ensure non-negative
        if image_data.max() > 0:
            image_data = (image_data / image_data.max() * 255).astype(np.uint8)
        else:
            image_data = np.zeros_like(image_data, dtype=np.uint8)
            
        # Convert label to binary mask
        label_data = (label_data > 0).astype(np.uint8)
        
        # Convert to list for JSON serialization
        image_data_list = image_data.tolist()
        label_data_list = label_data.tolist()
        
        return jsonify({
            'image': image_data_list,
            'label': label_data_list,
            'dimensions': image_data.shape
        })
    except Exception as e:
        print(f'Error in get_3d_data: {str(e)}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)
