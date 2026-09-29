import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { err, tutorToApi as toApi } from "@/lib/bimbel";
import { jsonError, readBody } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await readBody(req);
    const sets: Record<string, unknown> = {};
    if ("nama" in data) sets.nama = String(data["nama"]);
    if ("no_hp" in data) sets.noHp = data["no_hp"] ? String(data["no_hp"]) : null;
    if ("tarif_per_sesi" in data) {
      const tarif = Number(data["tarif_per_sesi"]);
      if (!Number.isInteger(tarif) || tarif < 0) throw err(400, "tarif_per_sesi harus bilangan >= 0");
      sets.tarifPerSesi = tarif;
    }
    if (Object.keys(sets).length === 0) throw err(400, "tidak ada field yang diubah");
    const updated = await prisma.tutor.update({ where: { id: Number(params.id) }, data: sets });
    return NextResponse.json(toApi(updated));
  } catch (e) { return jsonError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.tutor.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ ok: true });
  } catch (e) { return jsonError(e); }
}
