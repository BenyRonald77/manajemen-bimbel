import { NextRequest, NextResponse } from "next/server";
import { generateSessions } from "@/lib/bimbel";
import { jsonError, readBody } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await readBody(req);
    const out = await generateSessions(
      Number(params.id),
      typeof data["dari"] === "string" ? data["dari"] : undefined,
      typeof data["sampai"] === "string" ? data["sampai"] : undefined
    );
    return NextResponse.json(out);
  } catch (e) { return jsonError(e); }
}
