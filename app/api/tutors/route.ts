import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { err, tutorToApi as toApi } from "@/lib/bimbel";
import { jsonError, readBody, requireFields } from "@/lib/api";

export async function GET() {
  try {
    const rows = await prisma.tutor.findMany({ orderBy: { nama: "asc" } });
    return NextResponse.json(rows.map(toApi));
  } catch (e) { return jsonError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const data = await readBody(req);
    const missing = requireFields(data, ["nama", "no_hp", "tarif_per_sesi"]);
    if (missing) throw err(400, missing);
    const tarif = Number(data["tarif_per_sesi"]);
    if (!Number.isInteger(tarif) || tarif < 0) throw err(400, "tarif_per_sesi harus bilangan >= 0");
    const created = await prisma.tutor.create({
      data: { nama: String(data["nama"]), noHp: String(data["no_hp"]), tarifPerSesi: tarif },
    });
    return NextResponse.json(toApi(created), { status: 201 });
  } catch (e) { return jsonError(e); }
}
