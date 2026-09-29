import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JENJANG, err, studentToApi as toApi } from "@/lib/bimbel";
import { jsonError, readBody, requireFields } from "@/lib/api";

export async function GET() {
  try {
    const rows = await prisma.student.findMany({ orderBy: { nama: "asc" } });
    return NextResponse.json(rows.map(toApi));
  } catch (e) { return jsonError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const data = await readBody(req);
    const missing = requireFields(data, ["nama", "no_hp_ortu", "jenjang"]);
    if (missing) throw err(400, missing);
    if (!JENJANG.includes(String(data["jenjang"]))) {
      throw err(400, `jenjang harus salah satu: ${JENJANG.join(", ")}`);
    }
    const created = await prisma.student.create({
      data: {
        nama: String(data["nama"]),
        noHpOrtu: String(data["no_hp_ortu"]),
        jenjang: String(data["jenjang"]),
      },
    });
    return NextResponse.json(toApi(created), { status: 201 });
  } catch (e) { return jsonError(e); }
}
