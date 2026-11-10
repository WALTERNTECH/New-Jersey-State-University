import { NextResponse } from "next/server";
import { badOrigin, fail } from "@/lib/auth";
import { endStaffSession } from "@/lib/staff";

export async function POST(req: Request) {
  if (badOrigin(req)) return fail(403, "Request blocked");
  await endStaffSession();
  return NextResponse.json({ ok: true });
}
