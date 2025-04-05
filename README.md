# Medical Image Segmentation Demo

A web-based demonstration of medical image segmentation results. This application showcases various medical imaging cases with their corresponding segmentation results in a clean, modern interface.

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Add your medical images to the `static/images` directory:
   - Original images: brain_mri.jpg, lung_ct.jpg
   - Segmented results: brain_mri_seg.jpg, lung_ct_seg.jpg

3. Run the application:
```bash
python app.py
```

4. Open your browser and visit `http://localhost:5000`

## Features

- Responsive design for all screen sizes
- Clean and professional UI
- Side-by-side comparison of original and segmented images
- Bootstrap 5 for modern styling
- Easy to add new cases and images

## Project Structure

```
medical-segmentation-demo/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── static/
│   ├── css/           # Custom CSS styles
│   └── images/        # Medical images
└── templates/         # HTML templates
```
