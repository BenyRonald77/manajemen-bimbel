"""Laporan: honor tutor otomatis dan rapor perkembangan siswa."""
from datetime import date

from flask import Blueprint, jsonify, request

from bimbel.db import get_conn

report_bp = Blueprint("report", __name__, url_prefix="/api")


@report_bp.get("/honor")
def honor():
    """Honor per tutor per bulan = tarif_per_sesi x sesi hadir bulan itu."""
    bulan = request.args.get("bulan", date.today().strftime("%Y-%m"))
    try:
        tahun, bln = (int(x) for x in bulan.split("-"))
        assert 1 <= bln <= 12
    except (ValueError, AssertionError):
        return jsonify({"error": "format bulan salah (YYYY-MM)"}), 400
    prefix = f"{tahun:04d}-{bln:02d}"
    conn = get_conn()
    try:
        out = []
        for t in conn.execute("SELECT * FROM tutors ORDER BY nama").fetchall():
            n = conn.execute(
                """SELECT COUNT(*) AS c FROM sessions s
                   JOIN schedules sc ON sc.id = s.schedule_id
                   WHERE sc.tutor_id = ? AND s.status = 'hadir'
                     AND substr(s.tanggal, 1, 7) = ?""",
                (t["id"], prefix)).fetchone()["c"]
            total = n * t["tarif_per_sesi"]
            out.append({"tutor_id": t["id"], "nama": t["nama"],
                        "tarif_per_sesi": t["tarif_per_sesi"],
                        "sesi_hadir": n, "total_honor": total})
        return jsonify({"bulan": prefix, "honor": out,
                        "grand_total": sum(h["total_honor"] for h in out)})
    finally:
        conn.close()


@report_bp.get("/students/<int:s_id>/rapor")
def rapor(s_id: int):
    """Perkembangan belajar siswa per periode untuk orang tua."""
    hari_ini = date.today()
    dari = request.args.get("dari", hari_ini.replace(day=1).isoformat())
    sampai = request.args.get("sampai", hari_ini.isoformat())
    data, code = get_rapor(s_id, dari, sampai)
    return jsonify(data), code


def get_rapor(s_id: int, dari: str, sampai: str):
    conn = get_conn()
    try:
        st = conn.execute("SELECT * FROM students WHERE id = ?",
                          (s_id,)).fetchone()
        if st is None:
            return {"error": "siswa tidak ditemukan"}, 404
        sesi = conn.execute(
            """SELECT s.tanggal, s.jam_mulai, s.jam_selesai, s.status,
                      s.materi, s.catatan, t.nama AS nama_tutor,
                      sub.nama AS nama_mapel
               FROM sessions s
               JOIN schedules sc ON sc.id = s.schedule_id
               JOIN tutors t ON t.id = sc.tutor_id
               JOIN subjects sub ON sub.id = sc.subject_id
               WHERE sc.student_id = ? AND s.tanggal BETWEEN ? AND ?
               ORDER BY s.tanggal""",
            (s_id, dari, sampai)).fetchall()
        sesi = [dict(r) for r in sesi]
        per_mapel = {}
        for r in sesi:
            m = per_mapel.setdefault(r["nama_mapel"],
                                     {"total": 0, "hadir": 0})
            m["total"] += 1
            if r["status"] == "hadir":
                m["hadir"] += 1
        return {
            "siswa": dict(st), "dari": dari, "sampai": sampai,
            "total_sesi": len(sesi),
            "hadir": sum(1 for r in sesi if r["status"] == "hadir"),
            "tidak_hadir": sum(1 for r in sesi if r["status"] == "tidak_hadir"),
            "batal": sum(1 for r in sesi if r["status"] == "batal"),
            "per_mapel": per_mapel,
            "sesi": sesi,
        }, 200
    finally:
        conn.close()
