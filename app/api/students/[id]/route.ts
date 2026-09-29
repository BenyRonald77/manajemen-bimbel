import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JENJANG, err, studentToApi as toApi } from "@/lib/bimbel";
import { jsonError, readBody } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await readBody(req);
    const sets: Record<string, unknown> = {};
    if ("nama" in data) sets.nama = String(data["nama"]);
    if ("no_hp_ortu" in data) sets.noHpOrtu = data["no_hp_ortu"] ? String(data["no_hp_ortu"]) : null;
    if ("jenjang" in data) {
      if (!JENJANG.includes(String(data["jenjang"]))) {
        throw err(400, `jenjang harus salah satu: ${JENJANG.join(", ")}`);
      }
      sets.jenjang = String(data["jenjang"]);
    }
    if (Object.keys(sets).length === 0) throw err(400, "tidak ada field yang diubah");
    const updated = await prisma.student.update({ where: { id: Number(params.id) }, data: sets });
    return NextResponse.json(toApi(updated));
  } catch (e) { return jsonError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.student.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ ok: true });
  } catch (e) { return jsonError(e); }
}
