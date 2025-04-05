from flask_frozen import Freezer
from app import app, get_cases_from_files

# Configure app for GitHub Pages
app.config['FREEZER_BASE_URL'] = 'https://xmed-lab.github.io/RCMed/'
app.config['FREEZER_RELATIVE_URLS'] = True

# Create the freezer
freezer = Freezer(app)

if __name__ == '__main__':
    # Generate static files
    freezer.freeze()
