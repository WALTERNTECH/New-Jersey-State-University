import { NextResponse } from "next/server";
import { badOrigin, endSession, fail } from "@/lib/auth";

export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  await endSession();
  return NextResponse.json({ ok: true });
}
