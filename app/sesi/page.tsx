"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, inputCls, btnCls, btnGhostCls } from "@/lib/client";
import { today } from "@/lib/format";
import { Card, StatusBadge, TableShell } from "../components/ui";
import { STATUS } from "@/lib/bimbel";

interface Sesi {
  id: number; jam_mulai: string; jam_selesai: string;
  nama_mapel: string; nama_tutor: string; nama_siswa: string;
  status: string; materi: string | null;
}

export default function SesiPage() {
  const [tgl, setTgl] = useState(today());
  const [rows, setRows] = useState<Sesi[]>([]);
  const [aktif, setAktif] = useState<{ id: number; judul: string } | null>(null);
  const [materi, setMateri] = useState("");
  const [catatan, setCatatan] = useState("");

  const muat = (t: string) => {
    apiGet<Sesi[]>(`/api/sessions?tanggal=${t}`).then(setRows).catch(() => {});
  };

  useEffect(() => { muat(tgl); }, [tgl]);

  const buka = (id: number, judul: string) => {
    setAktif({ id, judul });
    setMateri("");
    setCatatan("");
  };

  const presensi = async (status: string) => {
    if (!aktif) return;
    try {
      await apiPost(`/api/sessions/${aktif.id}/attend`, { status, materi, catatan });
      setAktif(null);
      muat(tgl);
    } catch (e) { alert((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sesi & Presensi</h1>
      <Card title="Filter tanggal">
        <div className="flex gap-2">
          <input type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} className={inputCls} />
          <button className={btnCls} onClick={() => muat(tgl)}>Lihat</button>
        </div>
      </Card>
      <TableShell head={["Jam", "Mapel", "Tutor", "Siswa", "Status", "Materi", ""]}>
        {rows.map((s) => (
          <tr key={s.id}>
            <td className="px-4 py-2.5">{s.jam_mulai}–{s.jam_selesai}</td>
            <td className="px-4 py-2.5">{s.nama_mapel}</td>
            <td className="px-4 py-2.5">{s.nama_tutor}</td>
            <td className="px-4 py-2.5">{s.nama_siswa}</td>
            <td className="px-4 py-2.5"><StatusBadge status={s.status} /></td>
            <td className="px-4 py-2.5 text-xs text-slate-500">{s.materi || ""}</td>
            <td className="px-4 py-2.5">
              <button className={btnGhostCls} onClick={() => buka(s.id, `${s.nama_siswa} — ${s.nama_mapel}`)}>Presensi</button>
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Tidak ada sesi pada tanggal ini.</td></tr>
        )}
      </TableShell>

      {aktif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">{aktif.judul}</h3>
            <div className="flex justify-center gap-2">
              <button className={btnCls} onClick={() => presensi("hadir")}>Hadir</button>
              <button className={btnGhostCls} onClick={() => presensi("tidak_hadir")}>Tidak hadir</button>
              <button className={btnGhostCls} onClick={() => presensi("batal")}>Batal</button>
            </div>
            <input
              placeholder="Materi yang dibahas" value={materi}
              onChange={(e) => setMateri(e.target.value)} className={`${inputCls} mt-3 w-full`}
            />
            <input
              placeholder="Catatan perkembangan" value={catatan}
              onChange={(e) => setCatatan(e.target.value)} className={`${inputCls} mt-2 w-full`}
            />
            <div className="mt-3">
              <button className={btnGhostCls} onClick={() => setAktif(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
