import os
import shutil
from flask_frozen import Freezer
from app import app, get_cases_from_files

# Configure app for GitHub Pages
app.config['FREEZER_BASE_URL'] = 'https://xmed-lab.github.io/RCMed/'

# Create the freezer
freezer = Freezer(app)

@freezer.register_generator
def default_url_generator():
    yield {'path': '/'}

if __name__ == '__main__':
    # Clean build directory
    if os.path.exists('build'):
        shutil.rmtree('build')
    
    # Generate static files
    freezer.freeze()
    
    # Copy static files
    shutil.copytree('static', 'build/static', dirs_exist_ok=True)
