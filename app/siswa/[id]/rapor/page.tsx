import Link from "next/link";
import { notFound } from "next/navigation";
import { getRapor, ApiError } from "@/lib/bimbel";
import PrintButton from "./PrintButton";

export default async function RaporPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { dari?: string; sampai?: string };
}) {
  let data;
  try {
    data = await getRapor(
      Number(params.id),
      searchParams.dari || undefined,
      searchParams.sampai || undefined
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div className="mx-auto max-w-3xl font-serif text-slate-800">
      <style>{`@media print { .noprint { display: none; } }`}</style>
      <div className="noprint mb-4 flex gap-3">
        <PrintButton />
        <Link href="/siswa" className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
          ← Kembali
        </Link>
      </div>
      <h1 className="border-b-2 border-slate-800 pb-2 text-xl font-bold">Rapor Perkembangan Belajar</h1>
      <div className="my-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <div>Nama: <b>{data.siswa.nama}</b></div>
        <div>Jenjang: {data.siswa.jenjang || "-"}</div>
        <div>Periode: {data.dari} s/d {data.sampai}</div>
        <div>Total sesi: {data.total_sesi} (hadir {data.hadir})</div>
      </div>
      <h3 className="mt-4 font-bold">Rekap per mapel</h3>
      <table className="my-2 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            {["Mapel", "Sesi", "Hadir"].map((h) => (
              <th key={h} className="border border-slate-400 px-2 py-1 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.per_mapel).map(([mapel, r]) => (
            <tr key={mapel}>
              <td className="border border-slate-400 px-2 py-1">{mapel}</td>
              <td className="border border-slate-400 px-2 py-1">{r.total}</td>
              <td className="border border-slate-400 px-2 py-1">{r.hadir}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="mt-4 font-bold">Detail sesi</h3>
      <table className="my-2 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            {["Tanggal", "Mapel", "Tutor", "Status", "Materi", "Catatan"].map((h) => (
              <th key={h} className="border border-slate-400 px-2 py-1 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.sesi.map((s, i) => (
            <tr key={i}>
              <td className="border border-slate-400 px-2 py-1">{s.tanggal}</td>
              <td className="border border-slate-400 px-2 py-1">{s.nama_mapel}</td>
              <td className="border border-slate-400 px-2 py-1">{s.nama_tutor}</td>
              <td className="border border-slate-400 px-2 py-1">{s.status}</td>
              <td className="border border-slate-400 px-2 py-1">{s.materi || ""}</td>
              <td className="border border-slate-400 px-2 py-1">{s.catatan || ""}</td>
            </tr>
          ))}
          {data.sesi.length === 0 && (
            <tr><td colSpan={6} className="border border-slate-400 px-2 py-3 text-center text-slate-400">Tidak ada sesi pada periode ini.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
