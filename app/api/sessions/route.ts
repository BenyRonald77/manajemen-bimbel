import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toSessionApi } from "@/lib/bimbel";
import { jsonError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams;
    const where: Record<string, unknown> = {};
    const tanggal = q.get("tanggal");
    const dari = q.get("dari");
    const sampai = q.get("sampai");
    if (tanggal) where["tanggal"] = tanggal;
    else {
      const r: Record<string, string> = {};
      if (dari) r["gte"] = dari;
      if (sampai) r["lte"] = sampai;
      if (Object.keys(r).length > 0) where["tanggal"] = r;
    }
    const sid = q.get("schedule_id");
    const stid = q.get("student_id");
    const tid = q.get("tutor_id");
    const schedWhere: Record<string, number> = {};
    if (sid) schedWhere["id"] = Number(sid);
    if (stid) schedWhere["studentId"] = Number(stid);
    if (tid) schedWhere["tutorId"] = Number(tid);
    if (Object.keys(schedWhere).length > 0) where["schedule"] = { is: schedWhere };
    const rows = await prisma.session.findMany({
      where,
      include: { schedule: { include: { tutor: true, student: true, subject: true } } },
      orderBy: [{ tanggal: "asc" }, { jamMulai: "asc" }],
    });
    return NextResponse.json(rows.map(toSessionApi));
  } catch (e) { return jsonError(e); }
}
