import click
from flask import Flask
from flask_cors import CORS

from .config import Config


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGIN"]}})

    from .routes import ALL_BLUEPRINTS

    for blueprint in ALL_BLUEPRINTS:
        app.register_blueprint(blueprint)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    register_cli(app)
    return app


def register_cli(app):
    @app.cli.command("reset-db")
    def reset_db():
        """Wipe db.json back to an empty datastore (no users, no data)."""
        from .seed import build_seed_db
        from .store import write_db

        with app.app_context():
            write_db(build_seed_db())
        print(f"Reset {app.config['DB_FILE']} to empty.")

    @app.cli.command("create-admin")
    @click.option("--name", prompt=True)
    @click.option("--email", prompt=True)
    @click.option("--phone", default="", help="Optional.")
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
    def create_admin(name, email, phone, password):
        """Create a real admin account."""
        from .domain import new_user
        from .store import find_user_by_email, mutate_db

        if not password or len(password) < 8:
            click.echo("Password must be at least 8 characters.")
            raise SystemExit(1)

        with app.app_context():
            with mutate_db() as db:
                if find_user_by_email(db, email):
                    click.echo(f"An account with {email} already exists.")
                    raise SystemExit(1)
                user = new_user(
                    name=name, email=email, phone=phone, password=password,
                    role="admin", kyc="verified", status="active",
                )
                db["users"].append(user)

        click.echo(f"Created admin account: {email}")
