import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRapor, ApiError, prismaError } from "@/lib/bimbel";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(_req.url);
    const data = await getRapor(
      Number(params.id),
      url.searchParams.get("dari") || undefined,
      url.searchParams.get("sampai") || undefined
    );
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const pe = prismaError(e);
    if (pe) return NextResponse.json({ error: pe.message }, { status: pe.status });
    return NextResponse.json({ error: "gagal" }, { status: 400 });
  }
}
