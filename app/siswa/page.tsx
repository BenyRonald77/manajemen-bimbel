"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, inputCls, btnCls, btnGhostCls } from "@/lib/client";
import { today } from "@/lib/format";
import { Card, TableShell } from "../components/ui";
import { JENJANG } from "@/lib/bimbel";

interface Siswa { id: number; nama: string; jenjang: string | null; no_hp_ortu: string | null }

export default function SiswaPage() {
  const [rows, setRows] = useState<Siswa[]>([]);
  const [nama, setNama] = useState("");
  const [hp, setHp] = useState("");
  const [jenjang, setJenjang] = useState("SD");
  const [rSiswa, setRSiswa] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const muat = () => apiGet<Siswa[]>("/api/students").then(setRows).catch(() => {});

  useEffect(() => {
    const t = today();
    setDari(t.slice(0, 8) + "01");
    setSampai(t);
    muat();
  }, []);

  const tambah = async () => {
    if (!nama.trim()) return alert("Nama wajib diisi");
    try {
      await apiPost("/api/students", { nama: nama.trim(), no_hp_ortu: hp.trim(), jenjang });
      setNama(""); setHp("");
      muat();
    } catch (e) { alert((e as Error).message); }
  };

  const bukaRapor = (id: string | number) => {
    if (!id) return;
    window.open(`/siswa/${id}/rapor?dari=${dari}&sampai=${sampai}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Siswa</h1>
      <Card title="Tambah siswa">
        <div className="flex flex-wrap gap-2">
          <input placeholder="Nama" value={nama} onChange={(e) => setNama(e.target.value)} className={inputCls} />
          <input placeholder="No. HP orang tua" value={hp} onChange={(e) => setHp(e.target.value)} className={inputCls} />
          <select value={jenjang} onChange={(e) => setJenjang(e.target.value)} className={inputCls}>
            {JENJANG.map((j) => <option key={j}>{j}</option>)}
          </select>
          <button className={btnCls} onClick={tambah}>Tambah</button>
        </div>
      </Card>
      <TableShell head={["Nama", "Jenjang", "No. HP Ortu", ""]}>
        {rows.map((s) => (
          <tr key={s.id}>
            <td className="px-4 py-2.5">{s.nama}</td>
            <td className="px-4 py-2.5">{s.jenjang || ""}</td>
            <td className="px-4 py-2.5">{s.no_hp_ortu || ""}</td>
            <td className="px-4 py-2.5">
              <button className={btnGhostCls} onClick={() => bukaRapor(s.id)}>Rapor</button>
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Belum ada siswa.</td></tr>
        )}
      </TableShell>
      <Card title="Rapor perkembangan">
        <div className="flex flex-wrap gap-2">
          <select value={rSiswa} onChange={(e) => setRSiswa(e.target.value)} className={inputCls}>
            <option value="">— Pilih siswa —</option>
            {rows.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
          </select>
          <input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className={inputCls} />
          <input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className={inputCls} />
          <button className={btnCls} onClick={() => bukaRapor(rSiswa)}>Buka rapor</button>
        </div>
      </Card>
    </div>
  );
}
