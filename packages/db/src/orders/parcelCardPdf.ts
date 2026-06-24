// Workers-compatible localized parcel card (FR-930, FR-8E0). pdf-lib is pure JS.
// Reads from the immutable order snapshot (the caller passes the resolved values);
// the sewn-in label stays language-neutral, this card carries localized care text.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { type EmailLocale, parcelCardContent } from "@cutura/core";

export interface ParcelCardInput {
  orderNumber: string;
  garmentType: string;
  locale: EmailLocale;
  /** Optional human-readable fibre composition (e.g. "100% Cotton"). */
  fibreComposition?: string;
}

const MARGIN = 50;
const LINE = 18;

export async function renderParcelCardPdf(input: ParcelCardInput): Promise<Uint8Array> {
  const t = parcelCardContent(input.locale);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage();
  const width = page.getSize().width;
  let y = page.getSize().height - MARGIN;

  const text = (s: string, size = 11, useBold = false): void => {
    page.drawText(s, {
      x: MARGIN,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= LINE;
  };

  text("CUTURA", 20, true);
  y -= 6;
  text(t.greeting, 13, true);
  y -= 6;
  text(`${input.orderNumber} - ${input.garmentType}`, 11);
  if (input.fibreComposition) text(input.fibreComposition, 11);
  y -= 10;

  text(t.careHeading, 12, true);
  // Wrap the care body to the page width.
  for (const line of wrap(t.careBody, font, 11, width - 2 * MARGIN)) text(line, 11);
  y -= 4;
  for (const line of wrap(t.symbolsNote, font, 11, width - 2 * MARGIN)) text(line, 11);
  y -= 10;
  text(t.thanks, 11);

  return doc.save();
}

function wrap(
  s: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  maxWidth: number,
): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}
