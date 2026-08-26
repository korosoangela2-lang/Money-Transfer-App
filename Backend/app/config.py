import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Config:
    DB_FILE = os.environ.get("DB_FILE", os.path.join(BASE_DIR, "db.json"))
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "http://localhost:5173")
