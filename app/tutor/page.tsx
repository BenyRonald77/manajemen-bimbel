"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost, inputCls, btnCls, btnGhostCls } from "@/lib/client";
import { monthKey, rupiah } from "@/lib/format";
import { Card, TableShell } from "../components/ui";

interface Honor {
  nama: string; tarif_per_sesi: number; sesi_hadir: number; total_honor: number;
}

export default function TutorPage() {
  const [rows, setRows] = useState<Honor[]>([]);
  const [grand, setGrand] = useState(0);
  const [bulan, setBulan] = useState(monthKey());
  const [nama, setNama] = useState("");
  const [hp, setHp] = useState("");
  const [tarif, setTarif] = useState("");

  const muat = (b: string) => {
    apiGet<{ honor: Honor[]; grand_total: number }>(`/api/honor?bulan=${b}`)
      .then((d) => { setRows(d.honor); setGrand(d.grand_total); })
      .catch((e) => alert((e as Error).message));
  };

  useEffect(() => { muat(bulan); }, [bulan]);

  const tambah = async () => {
    const t = parseInt(tarif, 10);
    if (!nama.trim() || !(t >= 0)) return alert("Nama dan tarif wajib diisi");
    try {
      await apiPost("/api/tutors", { nama: nama.trim(), no_hp: hp.trim(), tarif_per_sesi: t });
      setNama(""); setHp(""); setTarif("");
      muat(bulan);
    } catch (e) { alert((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tutor & Honor</h1>
      <Card title="Tambah tutor">
        <div className="flex flex-wrap gap-2">
          <input placeholder="Nama" value={nama} onChange={(e) => setNama(e.target.value)} className={inputCls} />
          <input placeholder="No. HP" value={hp} onChange={(e) => setHp(e.target.value)} className={inputCls} />
          <input type="number" placeholder="Tarif per sesi (Rp)" value={tarif} onChange={(e) => setTarif(e.target.value)} className={inputCls} />
          <button className={btnCls} onClick={tambah}>Tambah</button>
        </div>
      </Card>
      <Card title="Honor tutor">
        <div className="mb-3 flex items-center gap-2">
          <label className="text-sm">Honor bulan:{" "}
            <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} className={inputCls} />
          </label>
          <button className={btnGhostCls} onClick={() => muat(bulan)}>Lihat</button>
          <b className="ml-auto">Total: {rupiah(grand)}</b>
        </div>
        <TableShell head={["Tutor", "Tarif/sesi", "Sesi hadir", "Total honor"]}>
          {rows.map((h) => (
            <tr key={h.nama}>
              <td className="px-4 py-2.5">{h.nama}</td>
              <td className="px-4 py-2.5">{rupiah(h.tarif_per_sesi)}</td>
              <td className="px-4 py-2.5">{h.sesi_hadir}</td>
              <td className="px-4 py-2.5"><b>{rupiah(h.total_honor)}</b></td>
            </tr>
          ))}
        </TableShell>
      </Card>
    </div>
  );
}
