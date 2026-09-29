"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDel, inputCls, btnCls, btnGhostCls } from "@/lib/client";
import { Card, TableShell } from "../components/ui";
import { HARI } from "@/lib/bimbel";

interface Opt { id: number; nama: string }
interface Jadwal {
  id: number; hari: string; jam_mulai: string; jam_selesai: string;
  nama_mapel: string; nama_tutor: string; nama_siswa: string;
  tanggal_mulai: string; tanggal_selesai: string;
}

export default function JadwalPage() {
  const [tutors, setTutors] = useState<Opt[]>([]);
  const [students, setStudents] = useState<Opt[]>([]);
  const [subjects, setSubjects] = useState<Opt[]>([]);
  const [rows, setRows] = useState<Jadwal[]>([]);
  const [msg, setMsg] = useState("");
  const [f, setF] = useState({
    tutor_id: "", student_id: "", subject_id: "", hari: "Senin",
    jam_mulai: "16:00", jam_selesai: "17:30", tanggal_mulai: "", tanggal_selesai: "",
  });

  const muat = () => {
    apiGet<Opt[]>("/api/tutors").then(setTutors).catch(() => {});
    apiGet<Opt[]>("/api/students").then(setStudents).catch(() => {});
    apiGet<Opt[]>("/api/subjects").then(setSubjects).catch(() => {});
    apiGet<Jadwal[]>("/api/schedules").then(setRows).catch(() => {});
  };

  useEffect(() => {
    const t = new Date().toISOString().slice(0, 10);
    const s = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
    setF((p) => ({ ...p, tanggal_mulai: t, tanggal_selesai: s }));
    muat();
  }, []);

  const payload = () => ({
    tutor_id: Number(f.tutor_id), student_id: Number(f.student_id), subject_id: Number(f.subject_id),
    hari: f.hari, jam_mulai: f.jam_mulai, jam_selesai: f.jam_selesai,
    tanggal_mulai: f.tanggal_mulai, tanggal_selesai: f.tanggal_selesai,
  });

  const simpan = async (denganGenerate: boolean) => {
    setMsg("");
    try {
      const j = await apiPost<Jadwal>("/api/schedules", payload());
      if (denganGenerate) {
        const g = await apiPost<{ dibuat: number }>(`/api/schedules/${j.id}/generate`);
        setMsg(`Jadwal tersimpan, ${g.dibuat} sesi dibuat.`);
      } else {
        setMsg("Jadwal tersimpan.");
      }
      muat();
    } catch (e) { setMsg("Gagal: " + (e as Error).message); }
  };

  const gen = async (id: number) => {
    const d = await apiPost<{ dibuat: number }>(`/api/schedules/${id}/generate`).catch((e) => {
      alert((e as Error).message); return null;
    });
    if (d) alert(`${d.dibuat} sesi dibuat.`);
  };

  const hapus = async (id: number) => {
    if (!confirm("Hapus jadwal ini?")) return;
    try { await apiDel(`/api/schedules/${id}`); muat(); }
    catch (e) { alert((e as Error).message); }
  };

  const sel = (v: string, fn: (x: string) => void) => ({
    value: v, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => fn(e.target.value), className: inputCls,
  });
  const inp = (v: string, fn: (x: string) => void, extra: object = {}) => ({
    value: v, onChange: (e: React.ChangeEvent<HTMLInputElement>) => fn(e.target.value), className: inputCls, ...extra,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Jadwal Mingguan</h1>
      <Card title="Tambah jadwal">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <select {...sel(f.tutor_id, (x) => setF({ ...f, tutor_id: x }))}>
            <option value="">— Tutor —</option>
            {tutors.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
          </select>
          <select {...sel(f.student_id, (x) => setF({ ...f, student_id: x }))}>
            <option value="">— Siswa —</option>
            {students.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
          </select>
          <select {...sel(f.subject_id, (x) => setF({ ...f, subject_id: x }))}>
            <option value="">— Mapel —</option>
            {subjects.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
          </select>
          <select {...sel(f.hari, (x) => setF({ ...f, hari: x }))}>
            {HARI.map((h) => <option key={h}>{h}</option>)}
          </select>
          <input type="time" {...inp(f.jam_mulai, (x) => setF({ ...f, jam_mulai: x }))} />
          <input type="time" {...inp(f.jam_selesai, (x) => setF({ ...f, jam_selesai: x }))} />
          <input type="date" {...inp(f.tanggal_mulai, (x) => setF({ ...f, tanggal_mulai: x }))} />
          <input type="date" {...inp(f.tanggal_selesai, (x) => setF({ ...f, tanggal_selesai: x }))} />
        </div>
        <div className="mt-3 flex gap-2">
          <button className={btnCls} onClick={() => simpan(false)}>Simpan jadwal</button>
          <button className={btnGhostCls} onClick={() => simpan(true)}>Generate sesi</button>
        </div>
        {msg && <p className="mt-2 text-sm text-slate-600">{msg}</p>}
      </Card>
      <TableShell head={["Hari", "Jam", "Mapel", "Tutor", "Siswa", "Periode", ""]}>
        {rows.map((j) => (
          <tr key={j.id}>
            <td className="px-4 py-2.5">{j.hari}</td>
            <td className="px-4 py-2.5">{j.jam_mulai}–{j.jam_selesai}</td>
            <td className="px-4 py-2.5">{j.nama_mapel}</td>
            <td className="px-4 py-2.5">{j.nama_tutor}</td>
            <td className="px-4 py-2.5">{j.nama_siswa}</td>
            <td className="px-4 py-2.5 text-xs text-slate-500">{j.tanggal_mulai} → {j.tanggal_selesai}</td>
            <td className="px-4 py-2.5">
              <div className="flex gap-2">
                <button className={btnGhostCls} onClick={() => gen(j.id)}>Generate</button>
                <button className={btnGhostCls} onClick={() => hapus(j.id)}>Hapus</button>
              </div>
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Belum ada jadwal.</td></tr>
        )}
      </TableShell>
    </div>
  );
}
