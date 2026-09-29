import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertMasterExists, conflictMessage, findConflict,
  getScheduleDetail, toScheduleApi, validateSchedule, err,
} from "@/lib/bimbel";
import { jsonError, readBody } from "@/lib/api";

export async function GET() {
  try {
    const rows = await prisma.schedule.findMany({
      include: { tutor: true, student: true, subject: true },
      orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
    });
    return NextResponse.json(rows.map(toScheduleApi));
  } catch (e) { return jsonError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const data = await readBody(req);
    const msg = validateSchedule(data);
    if (msg) throw err(400, msg);
    await assertMasterExists(data);
    const bentrok = await findConflict({
      tutor_id: Number(data["tutor_id"]),
      student_id: Number(data["student_id"]),
      hari: String(data["hari"]),
      jam_mulai: String(data["jam_mulai"]),
      jam_selesai: String(data["jam_selesai"]),
      tanggal_mulai: String(data["tanggal_mulai"]),
      tanggal_selesai: String(data["tanggal_selesai"]),
    });
    if (bentrok.length > 0) throw err(409, conflictMessage(bentrok[0]));
    const created = await prisma.schedule.create({
      data: {
        tutorId: Number(data["tutor_id"]),
        studentId: Number(data["student_id"]),
        subjectId: Number(data["subject_id"]),
        hari: String(data["hari"]),
        jamMulai: String(data["jam_mulai"]),
        jamSelesai: String(data["jam_selesai"]),
        tanggalMulai: String(data["tanggal_mulai"]),
        tanggalSelesai: String(data["tanggal_selesai"]),
        catatan: data["catatan"] ? String(data["catatan"]) : null,
      },
    });
    return NextResponse.json(await getScheduleDetail(created.id), { status: 201 });
  } catch (e) { return jsonError(e); }
}
