"""Penjadwalan: CRUD + deteksi bentrok tutor/siswa + generate sesi."""
from datetime import date, timedelta

from flask import Blueprint, jsonify, request

from bimbel.db import get_conn

schedule_bp = Blueprint("schedule", __name__, url_prefix="/api")

HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
FIELDS = ["tutor_id", "student_id", "subject_id", "hari", "jam_mulai",
          "jam_selesai", "tanggal_mulai", "tanggal_selesai", "catatan"]


def find_conflict(conn, tutor_id: int, student_id: int, hari: str,
                  jam_mulai: str, jam_selesai: str,
                  tgl_mulai: str, tgl_selesai: str, exclude_id=None):
    """Jadwal yang bentrok: hari sama, jam tumpang tindih, periode beririsan,
    dan melibatkan tutor atau siswa yang sama."""
    return conn.execute(
        """SELECT s.id, s.hari, s.jam_mulai, s.jam_selesai,
                  s.tanggal_mulai, s.tanggal_selesai,
                  t.nama AS nama_tutor, st.nama AS nama_siswa,
                  sub.nama AS nama_mapel,
                  CASE WHEN s.tutor_id = ? THEN 'tutor' ELSE 'siswa' END AS pihak
           FROM schedules s
           JOIN tutors t ON t.id = s.tutor_id
           JOIN students st ON st.id = s.student_id
           JOIN subjects sub ON sub.id = s.subject_id
           WHERE s.hari = ?
             AND (? IS NULL OR s.id != ?)
             AND (s.tutor_id = ? OR s.student_id = ?)
             AND s.jam_mulai < ? AND s.jam_selesai > ?
             AND s.tanggal_mulai <= ? AND s.tanggal_selesai >= ?""",
        (tutor_id, hari, exclude_id, exclude_id, tutor_id, student_id,
         jam_selesai, jam_mulai, tgl_selesai, tgl_mulai)).fetchall()


def _validasi(data: dict):
    for f in FIELDS[:8]:
        if f not in data or data[f] in (None, ""):
            return {"error": f"field wajib: {f}"}, 400
    if data["hari"] not in HARI:
        return {"error": f"hari harus salah satu: {', '.join(HARI)}"}, 400
    for f in ("jam_mulai", "jam_selesai"):
        try:
            tuple(int(x) for x in data[f].split(":"))
            assert len(data[f]) == 5
        except (ValueError, AssertionError):
            return {"error": f"format {f} salah (HH:MM)"}, 400
    if data["jam_selesai"] <= data["jam_mulai"]:
        return {"error": "jam_selesai harus lebih besar dari jam_mulai"}, 400
    try:
        tm = date.fromisoformat(data["tanggal_mulai"])
        ts = date.fromisoformat(data["tanggal_selesai"])
    except ValueError:
        return {"error": "format tanggal salah (YYYY-MM-DD)"}, 400
    if ts < tm:
        return {"error": "tanggal_selesai >= tanggal_mulai"}, 400
    return None


def _detail(conn, s_id: int):
    return conn.execute(
        """SELECT s.*, t.nama AS nama_tutor, st.nama AS nama_siswa,
                  sub.nama AS nama_mapel
           FROM schedules s
           JOIN tutors t ON t.id = s.tutor_id
           JOIN students st ON st.id = s.student_id
           JOIN subjects sub ON sub.id = s.subject_id
           WHERE s.id = ?""", (s_id,)).fetchone()


@schedule_bp.get("/schedules")
def list_schedules():
    conn = get_conn()
    try:
        cur = conn.execute(
            """SELECT s.*, t.nama AS nama_tutor, st.nama AS nama_siswa,
                      sub.nama AS nama_mapel
               FROM schedules s
               JOIN tutors t ON t.id = s.tutor_id
               JOIN students st ON st.id = s.student_id
               JOIN subjects sub ON sub.id = s.subject_id
               ORDER BY s.hari, s.jam_mulai""")
        return jsonify([dict(r) for r in cur.fetchall()])
    finally:
        conn.close()


@schedule_bp.post("/schedules")
def create_schedule():
    data = request.get_json(force=True)
    err = _validasi(data)
    if err:
        return err
    conn = get_conn()
    try:
        for tbl, fid in (("tutors", "tutor_id"), ("students", "student_id"),
                         ("subjects", "subject_id")):
            if conn.execute(f"SELECT id FROM {tbl} WHERE id = ?",
                            (data[fid],)).fetchone() is None:
                return jsonify({"error": f"{fid} tidak ditemukan"}), 404
        bentrok = find_conflict(
            conn, data["tutor_id"], data["student_id"], data["hari"],
            data["jam_mulai"], data["jam_selesai"],
            data["tanggal_mulai"], data["tanggal_selesai"])
        if bentrok:
            b = dict(bentrok[0])
            return jsonify({"error":
                            f"bentrok dengan jadwal #{b['id']} ({b['nama_mapel']}, "
                            f"{b['nama_tutor']} – {b['nama_siswa']}, "
                            f"{b['hari']} {b['jam_mulai']}-{b['jam_selesai']}) "
                            f"pada pihak: {b['pihak']}"}), 409
        cur = conn.execute(
            f"INSERT INTO schedules ({', '.join(FIELDS)})"
            f" VALUES ({', '.join('?' for _ in FIELDS)})",
            [data.get(f) for f in FIELDS])
        conn.commit()
        return jsonify(dict(_detail(conn, cur.lastrowid))), 201
    finally:
        conn.close()


@schedule_bp.put("/schedules/<int:s_id>")
def update_schedule(s_id: int):
    data = request.get_json(force=True)
    conn = get_conn()
    try:
        lama = conn.execute("SELECT * FROM schedules WHERE id = ?",
                            (s_id,)).fetchone()
        if lama is None:
            return jsonify({"error": "jadwal tidak ditemukan"}), 404
        gabung = {**dict(lama), **data}
        err = _validasi(gabung)
        if err:
            return err
        bentrok = find_conflict(
            conn, gabung["tutor_id"], gabung["student_id"], gabung["hari"],
            gabung["jam_mulai"], gabung["jam_selesai"],
            gabung["tanggal_mulai"], gabung["tanggal_selesai"],
            exclude_id=s_id)
        if bentrok:
            b = dict(bentrok[0])
            return jsonify({"error": f"bentrok dengan jadwal #{b['id']}"}), 409
        sets = [f"{f} = ?" for f in FIELDS if f in data]
        if sets:
            conn.execute(f"UPDATE schedules SET {', '.join(sets)} WHERE id = ?",
                         [data[f] for f in FIELDS if f in data] + [s_id])
            conn.commit()
        return jsonify(dict(_detail(conn, s_id)))
    finally:
        conn.close()


@schedule_bp.delete("/schedules/<int:s_id>")
def delete_schedule(s_id: int):
    conn = get_conn()
    try:
        ada = conn.execute(
            "SELECT COUNT(*) AS n FROM sessions WHERE schedule_id = ?"
            " AND status != 'terjadwal'", (s_id,)).fetchone()["n"]
        if ada:
            return jsonify({"error":
                            "jadwal sudah punya sesi yang tercatat, tidak bisa dihapus"}), 400
        conn.execute("DELETE FROM sessions WHERE schedule_id = ?", (s_id,))
        cur = conn.execute("DELETE FROM schedules WHERE id = ?", (s_id,))
        conn.commit()
        if cur.rowcount == 0:
            return jsonify({"error": "jadwal tidak ditemukan"}), 404
        return jsonify({"ok": True})
    finally:
        conn.close()


@schedule_bp.post("/schedules/<int:s_id>/generate")
def generate(s_id: int):
    """Buat sesi konkret dari jadwal mingguan untuk rentang tanggal."""
    data = request.get_json(force=True, silent=True) or {}
    conn = get_conn()
    try:
        s = conn.execute("SELECT * FROM schedules WHERE id = ?",
                         (s_id,)).fetchone()
        if s is None:
            return jsonify({"error": "jadwal tidak ditemukan"}), 404
        dari = date.fromisoformat(data.get("dari", s["tanggal_mulai"]))
        sampai = date.fromisoformat(data.get("sampai", s["tanggal_selesai"]))
        dari = max(dari, date.fromisoformat(s["tanggal_mulai"]))
        sampai = min(sampai, date.fromisoformat(s["tanggal_selesai"]))
        target_idx = HARI.index(s["hari"])
        dibuat = 0
        t = dari
        while t <= sampai:
            if t.weekday() == target_idx:
                cur = conn.execute(
                    "INSERT OR IGNORE INTO sessions"
                    " (schedule_id, tanggal, jam_mulai, jam_selesai)"
                    " VALUES (?, ?, ?, ?)",
                    (s_id, t.isoformat(), s["jam_mulai"], s["jam_selesai"]))
                dibuat += cur.rowcount
            t += timedelta(days=1)
        conn.commit()
        return jsonify({"dibuat": dibuat})
    except ValueError:
        return jsonify({"error": "format tanggal salah (YYYY-MM-DD)"}), 400
    finally:
        conn.close()
