import os
import tempfile

from app import create_app
from app.login_throttle import reset as reset_login_throttle


def make_app():
    """A Flask app wired to a fresh, throwaway db.json for one test."""
    reset_login_throttle()
    app = create_app()
    fd, path = tempfile.mkstemp(suffix=".json")
    os.close(fd)
    os.remove(path)  # store.read_db() treats a missing file as "not seeded yet"
    app.config["DB_FILE"] = path
    app.config["TESTING"] = True
    return app, path


def cleanup(path):
    if os.path.exists(path):
        os.remove(path)
