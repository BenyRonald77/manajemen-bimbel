"""CRUD master: tutors, students, subjects."""
from flask import Blueprint, jsonify, request

from bimbel.db import get_conn

api_bp = Blueprint("api", __name__, url_prefix="/api")


def _dicts(cur):
    return [dict(r) for r in cur.fetchall()]


def _require(data: dict, fields: list[str]):
    missing = [f for f in fields if f not in data or data[f] in (None, "")]
    if missing:
        return jsonify({"error": f"field wajib: {', '.join(missing)}"}), 400
    return None


def _crud(table: str, fields: list[str], order: str = "id"):
    base = "/" + table

    @api_bp.get(base, endpoint=f"list_{table}")
    def list_():
        conn = get_conn()
        try:
            return jsonify(_dicts(
                conn.execute(f"SELECT * FROM {table} ORDER BY {order}")))
        finally:
            conn.close()

    @api_bp.post(base, endpoint=f"create_{table}")
    def create():
        data = request.get_json(force=True)
        err = _require(data, fields)
        if err:
            return err
        conn = get_conn()
        try:
            cols = ", ".join(fields)
            ph = ", ".join("?" for _ in fields)
            cur = conn.execute(
                f"INSERT INTO {table} ({cols}) VALUES ({ph})",
                [data.get(f) for f in fields])
            conn.commit()
            row = conn.execute(f"SELECT * FROM {table} WHERE id = ?",
                               (cur.lastrowid,)).fetchone()
            return jsonify(dict(row)), 201
        except Exception as e:  # noqa: BLE001
            return jsonify({"error": str(e)}), 400
        finally:
            conn.close()

    @api_bp.put(f"{base}/<int:row_id>", endpoint=f"update_{table}")
    def update(row_id: int):
        data = request.get_json(force=True)
        conn = get_conn()
        try:
            sets = [f"{f} = ?" for f in fields if f in data]
            if not sets:
                return jsonify({"error": "tidak ada field yang diubah"}), 400
            vals = [data[f] for f in fields if f in data] + [row_id]
            cur = conn.execute(
                f"UPDATE {table} SET {', '.join(sets)} WHERE id = ?", vals)
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({"error": "tidak ditemukan"}), 404
            row = conn.execute(f"SELECT * FROM {table} WHERE id = ?",
                               (row_id,)).fetchone()
            return jsonify(dict(row))
        except Exception as e:  # noqa: BLE001
            return jsonify({"error": str(e)}), 400
        finally:
            conn.close()

    @api_bp.delete(f"{base}/<int:row_id>", endpoint=f"delete_{table}")
    def delete(row_id: int):
        conn = get_conn()
        try:
            cur = conn.execute(f"DELETE FROM {table} WHERE id = ?", (row_id,))
            conn.commit()
            if cur.rowcount == 0:
                return jsonify({"error": "tidak ditemukan"}), 404
            return jsonify({"ok": True})
        except Exception as e:  # noqa: BLE001
            return jsonify({"error": str(e)}), 400
        finally:
            conn.close()


_crud("tutors", ["nama", "no_hp", "tarif_per_sesi"], order="nama")
_crud("students", ["nama", "no_hp_ortu", "jenjang"], order="nama")
_crud("subjects", ["nama"], order="nama")
