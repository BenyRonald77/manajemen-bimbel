import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { err, subjectToApi as toApi } from "@/lib/bimbel";
import { jsonError, readBody } from "@/lib/api";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await readBody(req);
    if (!("nama" in data) || !data["nama"]) throw err(400, "tidak ada field yang diubah");
    const updated = await prisma.subject.update({
      where: { id: Number(params.id) },
      data: { nama: String(data["nama"]) },
    });
    return NextResponse.json(toApi(updated));
  } catch (e) { return jsonError(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.subject.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ ok: true });
  } catch (e) { return jsonError(e); }
}
