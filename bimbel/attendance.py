"""Presensi: daftar sesi + tandai kehadiran per sesi."""
from flask import Blueprint, jsonify, request

from bimbel.db import get_conn

attendance_bp = Blueprint("attendance", __name__, url_prefix="/api")

STATUS = ("terjadwal", "hadir", "tidak_hadir", "batal")

JOIN = """FROM sessions s
          JOIN schedules sc ON sc.id = s.schedule_id
          JOIN tutors t ON t.id = sc.tutor_id
          JOIN students st ON st.id = sc.student_id
          JOIN subjects sub ON sub.id = sc.subject_id"""


@attendance_bp.get("/sessions")
def list_sessions():
    cond, vals = [], []
    for key, col in (("tanggal", "s.tanggal"), ("schedule_id", "s.schedule_id"),
                     ("student_id", "sc.student_id"), ("tutor_id", "sc.tutor_id")):
        v = request.args.get(key)
        if v:
            cond.append(f"{col} = ?")
            vals.append(v)
    for key, op in (("dari", ">="), ("sampai", "<=")):
        v = request.args.get(key)
        if v:
            cond.append(f"s.tanggal {op} ?")
            vals.append(v)
    where = f"WHERE {' AND '.join(cond)}" if cond else ""
    conn = get_conn()
    try:
        cur = conn.execute(
            f"""SELECT s.*, t.nama AS nama_tutor, st.nama AS nama_siswa,
                       sub.nama AS nama_mapel
                {JOIN} {where}
                ORDER BY s.tanggal, s.jam_mulai""", vals)
        return jsonify([dict(r) for r in cur.fetchall()])
    finally:
        conn.close()


@attendance_bp.post("/sessions/<int:s_id>/attend")
def attend(s_id: int):
    data = request.get_json(force=True)
    status = data.get("status", "hadir")
    if status not in STATUS:
        return jsonify({"error": f"status harus salah satu: {', '.join(STATUS)}"}), 400
    conn = get_conn()
    try:
        sets = ["status = ?"]
        vals = [status]
        for f in ("materi", "catatan"):
            if f in data:
                sets.append(f"{f} = ?")
                vals.append(data[f])
        vals.append(s_id)
        cur = conn.execute(f"UPDATE sessions SET {', '.join(sets)} WHERE id = ?",
                           vals)
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "sesi tidak ditemukan"}), 404
        row = conn.execute("SELECT * FROM sessions WHERE id = ?", (s_id,)).fetchone()
        return jsonify(dict(row))
    finally:
        conn.close()
