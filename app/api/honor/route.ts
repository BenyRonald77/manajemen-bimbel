import { NextRequest, NextResponse } from "next/server";
import { getHonor } from "@/lib/bimbel";
import { jsonError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const bulan = new URL(req.url).searchParams.get("bulan") || undefined;
    return NextResponse.json(await getHonor(bulan));
  } catch (e) { return jsonError(e); }
}
