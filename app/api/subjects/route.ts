import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { err, subjectToApi as toApi } from "@/lib/bimbel";
import { jsonError, readBody, requireFields } from "@/lib/api";

export async function GET() {
  try {
    const rows = await prisma.subject.findMany({ orderBy: { nama: "asc" } });
    return NextResponse.json(rows.map(toApi));
  } catch (e) { return jsonError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const data = await readBody(req);
    const missing = requireFields(data, ["nama"]);
    if (missing) throw err(400, missing);
    const created = await prisma.subject.create({ data: { nama: String(data["nama"]) } });
    return NextResponse.json(toApi(created), { status: 201 });
  } catch (e) { return jsonError(e); }
}
