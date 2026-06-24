// Workers-compatible supplier PDF (FR-861). pdf-lib is pure JS (no native deps)
// and embeds PNG/JPEG. Images are fetched through an injectable seam over R2, so
// the bucket is chosen by the caller and tests can fake it; a missing image
// renders a placeholder and never throws (graceful media fallback). Generated on
// approval (admin) where there is CPU headroom, not on the webhook.

import { PDFDocument, type PDFFont, StandardFonts, rgb } from "pdf-lib";

import type { SupplierSpec } from "@cutura/core";

export interface PdfImage {
  bytes: Uint8Array;
  contentType: string;
}

export interface PdfImageFetcher {
  get(r2Key: string): Promise<PdfImage | null>;
}

const MARGIN = 50;
const FONT_SIZE = 11;
const LINE = 16;

export async function renderSupplierPdf(
  spec: SupplierSpec,
  images: PdfImageFetcher,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage();
  let y = page.getSize().height - MARGIN;

  const ensureSpace = (needed: number): void => {
    if (y - needed < MARGIN) {
      page = doc.addPage();
      y = page.getSize().height - MARGIN;
    }
  };
  const write = (text: string, f: PDFFont = font, size = FONT_SIZE): void => {
    ensureSpace(LINE);
    page.drawText(text, { x: MARGIN, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
    y -= LINE;
  };
  const gap = (): void => {
    y -= LINE / 2;
  };

  write("CUTURA - Produktionsspezifikation", bold, 16);
  write(`Kleidungstyp: ${spec.garmentType}`);
  write(`Modell: ${spec.baseModelName}`);
  write(`Stoff: ${spec.fabricCode}`);
  gap();

  write("Konfiguration", bold, 13);
  if (spec.configuration.length === 0) write("-");
  for (const c of spec.configuration) write(`${c.key}: ${c.value}`);
  gap();

  write("Veredelungen", bold, 13);
  if (spec.upgrades.length === 0) write("-");
  for (const u of spec.upgrades) write(`${u.code} (${u.placement}) ${u.price}`);
  gap();

  write("Masse (cm)", bold, 13);
  for (const m of spec.measurements) write(`${m.label}: ${m.value}`);
  gap();

  // The one standard, language-neutral sewn-in label (FR-1391): composition + care
  // symbols only. Localized care text goes on the parcel card, not sewn in.
  if (spec.label.composition || spec.label.care) {
    write("Eingenaehtes Etikett (sprachneutral)", bold, 13);
    if (spec.label.composition) write(`Zusammensetzung: ${spec.label.composition}`);
    if (spec.label.care) write(`Pflege: ${spec.label.care}`);
    gap();
  }

  if (spec.images.length > 0) {
    write("Bilder", bold, 13);
    for (const image of spec.images) {
      const fetched = await images.get(image.r2Key);
      if (!fetched) {
        write(`[Bild nicht verfügbar: ${image.caption}]`);
        continue;
      }
      const embedded = fetched.contentType.includes("png")
        ? await doc.embedPng(fetched.bytes)
        : await doc.embedJpg(fetched.bytes);
      const scaled = embedded.scaleToFit(200, 200);
      ensureSpace(scaled.height + LINE);
      write(image.caption);
      page.drawImage(embedded, {
        x: MARGIN,
        y: y - scaled.height,
        width: scaled.width,
        height: scaled.height,
      });
      y -= scaled.height + LINE / 2;
    }
  }

  return doc.save();
}
