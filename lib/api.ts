import { NextRequest, NextResponse } from "next/server";
import { ApiError, prismaError } from "./bimbel";

export function jsonError(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  const pe = prismaError(e);
  if (pe) return NextResponse.json({ error: pe.message }, { status: pe.status });
  return NextResponse.json(
    { error: e instanceof Error ? e.message : "gagal" },
    { status: 400 }
  );
}

export async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  const b = await req.json().catch(() => null);
  return (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
}

export function requireFields(data: Record<string, unknown>, fields: string[]): string | null {
  const missing = fields.filter(
    (f) => !(f in data) || data[f] === null || data[f] === undefined || data[f] === ""
  );
  return missing.length > 0 ? `field wajib: ${missing.join(", ")}` : null;
}
