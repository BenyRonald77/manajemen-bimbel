"""Aplikasi Flask manajemen bimbel."""
from flask import Flask

from bimbel.api import api_bp
from bimbel.attendance import attendance_bp
from bimbel.db import init_db
from bimbel.schedule import schedule_bp


def create_app() -> Flask:
    app = Flask(__name__)
    init_db()
    app.register_blueprint(api_bp)
    app.register_blueprint(schedule_bp)
    app.register_blueprint(attendance_bp)

    @app.get("/")
    def index():
        return "Manajemen Bimbel API — UI menyusul di F4"

    return app


if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=5001, debug=False)
