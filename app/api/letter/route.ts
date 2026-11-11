import { NextResponse } from "next/server";
import { currentApplicant, fail } from "@/lib/auth";
import { applicationFor } from "@/lib/application";
import { letterPdf } from "@/lib/letter";

/** The signed-in candidate's own letter of admission, while it stands. */
export async function GET() {
  const me = await currentApplicant();
  if (!me) return fail(401, "Please sign in to continue");
  const app = await applicationFor(me.id);
  if (!app) return fail(404, "Not found");
  const pdf = await letterPdf(app.id);
  if (!pdf) return fail(404, "There is no letter of admission on this account");
  return new NextResponse(new Uint8Array(pdf.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdf.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
