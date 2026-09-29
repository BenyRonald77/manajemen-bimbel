import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
export const STATUS = ["terjadwal", "hadir", "tidak_hadir", "batal"];
export const JENJANG = ["SD", "SMP", "SMA"];

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export const err = (status: number, message: string) => new ApiError(status, message);

/** Bentuk baris jadwal untuk API (snake_case, paritas dengan versi Python). */
export interface ScheduleApi {
  id: number; tutor_id: number; student_id: number; subject_id: number;
  hari: string; jam_mulai: string; jam_selesai: string;
  tanggal_mulai: string; tanggal_selesai: string; catatan: string | null;
  nama_tutor: string; nama_siswa: string; nama_mapel: string;
}

export interface SessionApi {
  id: number; schedule_id: number; tanggal: string; jam_mulai: string;
  jam_selesai: string; status: string; materi: string | null; catatan: string | null;
  nama_tutor: string; nama_siswa: string; nama_mapel: string;
}

type ScheduleWithNames = {
  id: number; tutorId: number; studentId: number; subjectId: number;
  hari: string; jamMulai: string; jamSelesai: string;
  tanggalMulai: string; tanggalSelesai: string; catatan: string | null;
  tutor: { nama: string }; student: { nama: string }; subject: { nama: string };
};

export function toScheduleApi(s: ScheduleWithNames): ScheduleApi {
  return {
    id: s.id, tutor_id: s.tutorId, student_id: s.studentId, subject_id: s.subjectId,
    hari: s.hari, jam_mulai: s.jamMulai, jam_selesai: s.jamSelesai,
    tanggal_mulai: s.tanggalMulai, tanggal_selesai: s.tanggalSelesai, catatan: s.catatan,
    nama_tutor: s.tutor.nama, nama_siswa: s.student.nama, nama_mapel: s.subject.nama,
  };
}

type SessionWithNames = {
  id: number; scheduleId: number; tanggal: string; jamMulai: string; jamSelesai: string;
  status: string; materi: string | null; catatan: string | null;
  schedule: ScheduleWithNames;
};

export function toSessionApi(s: SessionWithNames): SessionApi {
  return {
    id: s.id, schedule_id: s.scheduleId, tanggal: s.tanggal,
    jam_mulai: s.jamMulai, jam_selesai: s.jamSelesai,
    status: s.status, materi: s.materi, catatan: s.catatan,
    nama_tutor: s.schedule.tutor.nama, nama_siswa: s.schedule.student.nama,
    nama_mapel: s.schedule.subject.nama,
  };
}

const SCHEDULE_REQ = ["tutor_id", "student_id", "subject_id", "hari",
  "jam_mulai", "jam_selesai", "tanggal_mulai", "tanggal_selesai"];

const JAM_RE = /^\d{2}:\d{2}$/;
const TGL_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validTanggal(v: unknown): v is string {
  return typeof v === "string" && TGL_RE.test(v) && !isNaN(Date.parse(v + "T00:00:00"));
}

/** Mirror bimbel/schedule.py::_validasi — pesan error sama persis. */
export function validateSchedule(data: Record<string, unknown>): string | null {
  for (const f of SCHEDULE_REQ) {
    if (!(f in data) || data[f] === null || data[f] === undefined || data[f] === "") {
      return `field wajib: ${f}`;
    }
  }
  if (!HARI.includes(String(data["hari"]))) {
    return `hari harus salah satu: ${HARI.join(", ")}`;
  }
  for (const f of ["jam_mulai", "jam_selesai"]) {
    const v = String(data[f]);
    if (!JAM_RE.test(v) || v.split(":").some((x) => !/^\d+$/.test(x))) {
      return `format ${f} salah (HH:MM)`;
    }
  }
  if (String(data["jam_selesai"]) <= String(data["jam_mulai"])) {
    return "jam_selesai harus lebih besar dari jam_mulai";
  }
  if (!validTanggal(data["tanggal_mulai"]) || !validTanggal(data["tanggal_selesai"])) {
    return "format tanggal salah (YYYY-MM-DD)";
  }
  if (String(data["tanggal_selesai"]) < String(data["tanggal_mulai"])) {
    return "tanggal_selesai >= tanggal_mulai";
  }
  return null;
}

export interface ConflictRow {
  id: number; hari: string; jam_mulai: string; jam_selesai: string;
  tanggal_mulai: string; tanggal_selesai: string;
  nama_tutor: string; nama_siswa: string; nama_mapel: string; pihak: string;
}

export interface ConflictInput {
  tutor_id: number; student_id: number; hari: string;
  jam_mulai: string; jam_selesai: string; tanggal_mulai: string; tanggal_selesai: string;
}

/** Mirror find_conflict: hari sama, jam tumpang tindih, periode beririsan,
    melibatkan tutor atau siswa yang sama. */
export async function findConflict(p: ConflictInput, excludeId: number | null = null): Promise<ConflictRow[]> {
  return prisma.$queryRaw<ConflictRow[]>`
    SELECT s.id, s.hari,
           s."jamMulai" AS jam_mulai, s."jamSelesai" AS jam_selesai,
           s."tanggalMulai" AS tanggal_mulai, s."tanggalSelesai" AS tanggal_selesai,
           t.nama AS nama_tutor, st.nama AS nama_siswa, sub.nama AS nama_mapel,
           CASE WHEN s."tutorId" = ${p.tutor_id} THEN 'tutor' ELSE 'siswa' END AS pihak
    FROM "Schedule" s
    JOIN "Tutor" t ON t.id = s."tutorId"
    JOIN "Student" st ON st.id = s."studentId"
    JOIN "Subject" sub ON sub.id = s."subjectId"
    WHERE s.hari = ${p.hari}
      AND (${excludeId} IS NULL OR s.id != ${excludeId})
      AND (s."tutorId" = ${p.tutor_id} OR s."studentId" = ${p.student_id})
      AND s."jamMulai" < ${p.jam_selesai} AND s."jamSelesai" > ${p.jam_mulai}
      AND s."tanggalMulai" <= ${p.tanggal_selesai} AND s."tanggalSelesai" >= ${p.tanggal_mulai}`;
}

export function conflictMessage(b: ConflictRow): string {
  return `bentrok dengan jadwal #${b.id} (${b.nama_mapel}, ${b.nama_tutor} – ${b.nama_siswa}, ` +
    `${b.hari} ${b.jam_mulai}-${b.jam_selesai}) pada pihak: ${b.pihak}`;
}

export async function getScheduleDetail(id: number): Promise<ScheduleApi> {
  const s = await prisma.schedule.findUnique({
    where: { id },
    include: { tutor: true, student: true, subject: true },
  });
  if (!s) throw err(404, "jadwal tidak ditemukan");
  return toScheduleApi(s as ScheduleWithNames);
}

export async function assertMasterExists(data: Record<string, unknown>) {
  for (const [tbl, fid] of [["tutor", "tutor_id"], ["student", "student_id"], ["subject", "subject_id"]] as const) {
    const found = await (prisma[tbl] as { findUnique: (a: unknown) => Promise<unknown> })
      .findUnique({ where: { id: Number(data[fid]) } });
    if (!found) throw err(404, `${fid} tidak ditemukan`);
  }
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Mirror generate(): sesi konkret dari jadwal mingguan, tanpa duplikat. */
export async function generateSessions(scheduleId: number, dari?: string, sampai?: string): Promise<{ dibuat: number }> {
  const s = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!s) throw err(404, "jadwal tidak ditemukan");
  let d0 = dari || s.tanggalMulai;
  let d1 = sampai || s.tanggalSelesai;
  if (!validTanggal(d0) || !validTanggal(d1)) {
    throw err(400, "format tanggal salah (YYYY-MM-DD)");
  }
  if (d0 < s.tanggalMulai) d0 = s.tanggalMulai;
  if (d1 > s.tanggalSelesai) d1 = s.tanggalSelesai;
  const targetIdx = HARI.indexOf(s.hari);
  const rows: { scheduleId: number; tanggal: string; jamMulai: string; jamSelesai: string }[] = [];
  const t = parseLocalDate(d0);
  const end = parseLocalDate(d1);
  while (t <= end) {
    if ((t.getDay() + 6) % 7 === targetIdx) {
      const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
      rows.push({ scheduleId, tanggal: iso, jamMulai: s.jamMulai, jamSelesai: s.jamSelesai });
    }
    t.setDate(t.getDate() + 1);
  }
  let dibuat = 0;
  if (rows.length > 0) {
    // idempoten: lewati tanggal yang sudah punya sesi (paritas INSERT OR IGNORE)
    const sudahAda = new Set(
      (await prisma.session.findMany({
        where: { scheduleId, tanggal: { gte: d0, lte: d1 } },
        select: { tanggal: true },
      })).map((s) => s.tanggal)
    );
    const baru = rows.filter((r) => !sudahAda.has(r.tanggal));
    if (baru.length > 0) {
      const r = await prisma.session.createMany({ data: baru });
      dibuat = r.count;
    }
  }
  return { dibuat };
}

/** Mirror report.py::honor — tarif_per_sesi x sesi hadir dalam bulan itu. */
export async function getHonor(bulan?: string) {
  const def = new Date();
  const raw = bulan || `${def.getFullYear()}-${String(def.getMonth() + 1).padStart(2, "0")}`;
  const m = /^(\d{4})-(\d{2})$/.exec(raw);
  const bln = m ? Number(m[2]) : NaN;
  if (!m || !(bln >= 1 && bln <= 12)) throw err(400, "format bulan salah (YYYY-MM)");
  const prefix = `${m[1]}-${m[2]}`;
  const tutors = await prisma.tutor.findMany({ orderBy: { nama: "asc" } });
  const honor = await Promise.all(tutors.map(async (t) => {
    const n = await prisma.session.count({
      where: {
        status: "hadir",
        tanggal: { startsWith: prefix },
        schedule: { tutorId: t.id },
      },
    });
    return {
      tutor_id: t.id, nama: t.nama, tarif_per_sesi: t.tarifPerSesi,
      sesi_hadir: n, total_honor: n * t.tarifPerSesi,
    };
  }));
  return { bulan: prefix, honor, grand_total: honor.reduce((a, h) => a + h.total_honor, 0) };
}

/** Mirror report.py::get_rapor. */
export async function getRapor(studentId: number, dari?: string, sampai?: string) {
  const st = await prisma.student.findUnique({ where: { id: studentId } });
  if (!st) throw err(404, "siswa tidak ditemukan");
  const hariIni = new Date();
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const d0 = dari || iso(new Date(hariIni.getFullYear(), hariIni.getMonth(), 1));
  const d1 = sampai || iso(hariIni);
  const rows = await prisma.session.findMany({
    where: { schedule: { studentId }, tanggal: { gte: d0, lte: d1 } },
    include: { schedule: { include: { tutor: true, subject: true, student: true } } },
    orderBy: { tanggal: "asc" },
  });
  const sesi = rows.map((r) => ({
    tanggal: r.tanggal, jam_mulai: r.jamMulai, jam_selesai: r.jamSelesai,
    status: r.status, materi: r.materi, catatan: r.catatan,
    nama_tutor: r.schedule.tutor.nama, nama_mapel: r.schedule.subject.nama,
  }));
  const perMapel: Record<string, { total: number; hadir: number }> = {};
  for (const r of sesi) {
    const mm = (perMapel[r.nama_mapel] ||= { total: 0, hadir: 0 });
    mm.total += 1;
    if (r.status === "hadir") mm.hadir += 1;
  }
  return {
    siswa: { id: st.id, nama: st.nama, no_hp_ortu: st.noHpOrtu, jenjang: st.jenjang },
    dari: d0, sampai: d1,
    total_sesi: sesi.length,
    hadir: sesi.filter((r) => r.status === "hadir").length,
    tidak_hadir: sesi.filter((r) => r.status === "tidak_hadir").length,
    batal: sesi.filter((r) => r.status === "batal").length,
    per_mapel: perMapel,
    sesi,
  };
}

/** Petakan error Prisma ke status HTTP (paritas: 400/404 versi Python). */
export function prismaError(e: unknown) {  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return err(400, "data duplikat (sudah ada)");
    if (e.code === "P2003") return err(400, "data masih dipakai data lain");
    if (e.code === "P2025") return err(404, "tidak ditemukan");
  }
  return null;
}

/** Mapper baris master ke JSON snake_case (paritas API Python). */
export const tutorToApi = (t: { id: number; nama: string; noHp: string | null; tarifPerSesi: number }) => ({
  id: t.id, nama: t.nama, no_hp: t.noHp, tarif_per_sesi: t.tarifPerSesi,
});
export const studentToApi = (s: { id: number; nama: string; noHpOrtu: string | null; jenjang: string | null }) => ({
  id: s.id, nama: s.nama, no_hp_ortu: s.noHpOrtu, jenjang: s.jenjang,
});
export const subjectToApi = (s: { id: number; nama: string }) => ({ id: s.id, nama: s.nama });
