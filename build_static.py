from flask_frozen import Freezer
from app import app, get_cases_from_files

# Create the freezer
freezer = Freezer(app)

if __name__ == '__main__':
    # Generate static files
    freezer.freeze()
