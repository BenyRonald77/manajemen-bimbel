"""Aplikasi Flask manajemen bimbel."""
from datetime import date

from flask import Flask, render_template, request

from bimbel.api import api_bp
from bimbel.attendance import attendance_bp
from bimbel.db import init_db
from bimbel.report import get_rapor, report_bp
from bimbel.schedule import schedule_bp


def create_app() -> Flask:
    app = Flask(__name__)
    init_db()
    app.register_blueprint(api_bp)
    app.register_blueprint(schedule_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(report_bp)

    @app.get("/")
    def index():
        return render_template("dashboard.html", aktif="dash")

    @app.get("/jadwal")
    def jadwal():
        return render_template("jadwal.html", aktif="jadwal")

    @app.get("/sesi")
    def sesi():
        return render_template("sesi.html", aktif="sesi")

    @app.get("/tutor")
    def tutor():
        return render_template("tutor.html", aktif="tutor")

    @app.get("/siswa")
    def siswa():
        return render_template("siswa.html", aktif="siswa")

    @app.get("/siswa/<int:s_id>/rapor")
    def rapor_cetak(s_id: int):
        hari_ini = date.today()
        dari = request.args.get("dari", hari_ini.replace(day=1).isoformat())
        sampai = request.args.get("sampai", hari_ini.isoformat())
        data, code = get_rapor(s_id, dari, sampai)
        if code != 200:
            return data["error"], code
        return render_template("rapor.html", **data)

    return app


if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=5001, debug=False)
