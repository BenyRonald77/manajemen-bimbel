import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findConflict, getScheduleDetail, validateSchedule, err } from "@/lib/bimbel";
import { jsonError, readBody } from "@/lib/api";

const MAP: Record<string, string> = {
  tutor_id: "tutorId", student_id: "studentId", subject_id: "subjectId",
  hari: "hari", jam_mulai: "jamMulai", jam_selesai: "jamSelesai",
  tanggal_mulai: "tanggalMulai", tanggal_selesai: "tanggalSelesai", catatan: "catatan",
};

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const data = await readBody(req);
    const lama = await prisma.schedule.findUnique({ where: { id } });
    if (!lama) throw err(404, "jadwal tidak ditemukan");
    const gabung: Record<string, unknown> = {
      tutor_id: lama.tutorId, student_id: lama.studentId, subject_id: lama.subjectId,
      hari: lama.hari, jam_mulai: lama.jamMulai, jam_selesai: lama.jamSelesai,
      tanggal_mulai: lama.tanggalMulai, tanggal_selesai: lama.tanggalSelesai,
      catatan: lama.catatan, ...data,
    };
    const msg = validateSchedule(gabung);
    if (msg) throw err(400, msg);
    const bentrok = await findConflict({
      tutor_id: Number(gabung["tutor_id"]),
      student_id: Number(gabung["student_id"]),
      hari: String(gabung["hari"]),
      jam_mulai: String(gabung["jam_mulai"]),
      jam_selesai: String(gabung["jam_selesai"]),
      tanggal_mulai: String(gabung["tanggal_mulai"]),
      tanggal_selesai: String(gabung["tanggal_selesai"]),
    }, id);
    if (bentrok.length > 0) throw err(409, `bentrok dengan jadwal #${bentrok[0].id}`);
    const sets: Record<string, unknown> = {};
    for (const k of Object.keys(MAP)) {
      if (k in data) sets[MAP[k]] = data[k];
    }
    if (Object.keys(sets).length > 0) {
      await prisma.schedule.update({ where: { id }, data: sets });
    }
    return NextResponse.json(await getScheduleDetail(id));
  } catch (e) { return jsonError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const ada = await prisma.session.count({
      where: { scheduleId: id, status: { not: "terjadwal" } },
    });
    if (ada > 0) {
      throw err(400, "jadwal sudah punya sesi yang tercatat, tidak bisa dihapus");
    }
    await prisma.session.deleteMany({ where: { scheduleId: id } });
    await prisma.schedule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) { return jsonError(e); }
}
