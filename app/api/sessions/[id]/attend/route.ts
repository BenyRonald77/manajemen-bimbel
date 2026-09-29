import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUS, err, toSessionApi } from "@/lib/bimbel";
import { jsonError, readBody } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const data = await readBody(req);
    const status = String(data["status"] ?? "hadir");
    if (!STATUS.includes(status)) {
      throw err(400, `status harus salah satu: ${STATUS.join(", ")}`);
    }
    const sets: Record<string, unknown> = { status };
    if ("materi" in data) sets.materi = data["materi"] ? String(data["materi"]) : null;
    if ("catatan" in data) sets.catatan = data["catatan"] ? String(data["catatan"]) : null;
    const updated = await prisma.session.update({
      where: { id },
      data: sets,
      include: { schedule: { include: { tutor: true, student: true, subject: true } } },
    });
    return NextResponse.json(toSessionApi(updated));
  } catch (e) { return jsonError(e); }
}
