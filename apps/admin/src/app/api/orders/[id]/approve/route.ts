import { type EmailAttachment, buildSupplierSpec, parseSupplierCapabilities } from "@cutura/core";
import {
  ResendEmailProvider,
  approveOrderItem,
  getFabricSewnInLabel,
  getOrderDetail,
  getRow,
  listMedia,
  readSnapshot,
  renderSupplierEmail,
  renderSupplierPdf,
  sendEmailAndLog,
  supplier,
  writeAudit,
} from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { getEnv } from "@/server/env";
import { seeOther } from "@/server/http";

export const dynamic = "force-dynamic";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function supplierEmail(contact: unknown): string | null {
  if (contact && typeof contact === "object" && "email" in contact) {
    const email = (contact as { email?: unknown }).email;
    if (typeof email === "string" && email.includes("@")) return email;
  }
  return null;
}

// Approve every in-review garment, then send the per-garment supplier spec + PDF
// (FR-830/860/862). The supplier email is sent after the transition commits; a
// send failure does not roll back the approval.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const env = getEnv();
  const db = environmentDb("staging");
  const detail = await getOrderDetail(db, id);
  if (!detail) return seeOther("/orders");

  // Pre-flight, before ANY transition (all-or-nothing): every in-review garment
  // must have a channel to its producer - a supplier with an adapter, or a
  // supplier contact email for the spec. Otherwise approval would strand the
  // order in "approved" with nobody notified and no order sheet; approve nothing.
  for (const d of detail.items) {
    if (d.item.status !== "in_review" || !d.pkg) continue;
    const sup = d.pkg.supplierId ? await getRow(db, supplier, d.pkg.supplierId) : undefined;
    if (!sup) return seeOther(`/orders/${id}?error=no_channel`);
    const caps = parseSupplierCapabilities(sup.capabilities);
    if (!caps.adapter && !supplierEmail(sup.contact)) {
      return seeOther(`/orders/${id}?error=no_channel`);
    }
  }

  const provider = new ResendEmailProvider(env.EMAIL_PROVIDER_KEY);
  const fetcher = {
    async get(r2Key: string) {
      const object = await env.MEDIA_STAGING.get(r2Key);
      if (!object) return null;
      return {
        bytes: new Uint8Array(await object.arrayBuffer()),
        contentType: object.httpMetadata?.contentType ?? "image/png",
      };
    },
  };

  for (const d of detail.items) {
    if (d.item.status !== "in_review" || !d.pkg) continue;
    await approveOrderItem(db, d.item.id, "admin");

    // Producer adapter dispatch: suppliers with an adapter (e.g. Kutetailor) get
    // no spec email. In "manual" mode the founder enters the order in the
    // producer portal from the order sheet shown on the order page; "api" mode
    // will submit the same payload automatically once the producer API is
    // confirmed (payload builder exists, endpoint pending).
    const sup = d.pkg.supplierId ? await getRow(db, supplier, d.pkg.supplierId) : undefined;
    const caps = parseSupplierCapabilities(sup?.capabilities);
    if (caps.adapter) continue;

    const snapshot = await readSnapshot(d.pkg.snapshotEnc, env.MEASUREMENT_ENCRYPTION_KEY);
    const media = await listMedia(db, "model", d.item.baseModelId);
    const images = media
      .filter((m) => m.isPrimary)
      .map((m) => ({ r2Key: m.r2Key, caption: "Modell" }));
    const label = await getFabricSewnInLabel(db, snapshot.fabricCode);
    const spec = buildSupplierSpec(snapshot, { images, label });
    const pdfBytes = await renderSupplierPdf(spec, fetcher);
    const pdf: EmailAttachment = {
      filename: `${detail.order.orderNumber}-${d.item.id}.pdf`,
      contentBase64: toBase64(pdfBytes),
      contentType: "application/pdf",
    };

    const to = supplierEmail(sup?.contact);
    if (to) {
      await sendEmailAndLog(
        db,
        provider,
        renderSupplierEmail({ to, orderNumber: detail.order.orderNumber, spec, pdf }),
        { orderId: id, template: "supplier_production" },
      );
    }
  }

  await writeAudit(db, {
    actor: "admin",
    action: "order.approved",
    entityType: "order",
    entityId: id,
  });
  return seeOther(`/orders/${id}?approved=1`);
}
