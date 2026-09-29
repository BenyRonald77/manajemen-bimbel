"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client";
import { today } from "@/lib/format";
import { StatusBadge, TableShell } from "./components/ui";

interface Sesi {
  id: number; jam_mulai: string; jam_selesai: string;
  nama_mapel: string; nama_tutor: string; nama_siswa: string; status: string;
}

export default function Dashboard() {
  const [sesi, setSesi] = useState<Sesi[]>([]);
  const tgl = today();

  useEffect(() => {
    apiGet<Sesi[]>(`/api/sessions?tanggal=${tgl}`).then(setSesi).catch(() => {});
  }, [tgl]);

  const hadir = sesi.filter((s) => s.status === "hadir").length;
  const todo = sesi.filter((s) => s.status === "terjadwal").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Jadwal Hari Ini <span className="text-sm font-normal text-slate-500">{tgl}</span></h1>
      <div className="grid grid-cols-3 gap-4">
        {[
          { n: sesi.length, l: "Sesi hari ini" },
          { n: hadir, l: "Hadir" },
          { n: todo, l: "Belum presensi" },
        ].map((c) => (
          <div key={c.l} className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-indigo-700">{c.n}</div>
            <div className="text-sm text-slate-500">{c.l}</div>
          </div>
        ))}
      </div>
      <TableShell head={["Jam", "Mapel", "Tutor", "Siswa", "Status", ""]}>
        {sesi.map((s) => (
          <tr key={s.id}>
            <td className="px-4 py-2.5">{s.jam_mulai}–{s.jam_selesai}</td>
            <td className="px-4 py-2.5">{s.nama_mapel}</td>
            <td className="px-4 py-2.5">{s.nama_tutor}</td>
            <td className="px-4 py-2.5">{s.nama_siswa}</td>
            <td className="px-4 py-2.5"><StatusBadge status={s.status} /></td>
            <td className="px-4 py-2.5"><Link href="/sesi" className="text-indigo-600 hover:underline">Presensi →</Link></td>
          </tr>
        ))}
        {sesi.length === 0 && (
          <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Tidak ada sesi hari ini.</td></tr>
        )}
      </TableShell>
    </div>
  );
}
