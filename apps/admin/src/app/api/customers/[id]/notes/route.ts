import { setCustomerNotesTags } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

function parseTags(value: string): string[] | null {
  const arr = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return arr.length ? arr : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const form = await request.formData();
  const notes = String(form.get("notes") ?? "").trim() || null;
  const tags = parseTags(String(form.get("tags") ?? ""));
  await setCustomerNotesTags(environmentDb("staging"), id, { notes, tags }, "admin");
  return seeOther(`/customers/${id}?saved=1`);
}
