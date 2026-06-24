// Whether a fit-review request falls within the guarantee window (FR-8A3). Pure;
// the window is measured from the order's shipped timestamp. Bounds the remake-
// first guarantee in time (the per-garment-type / once bounding is enforced in the
// data layer where the order history is known).
export function isWithinFitReviewWindow(
  shippedAtIso: string | null,
  nowIso: string,
  windowDays: number,
): boolean {
  if (!shippedAtIso) return false;
  const shipped = Date.parse(shippedAtIso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(shipped) || Number.isNaN(now)) return false;
  return now >= shipped && now - shipped <= windowDays * 24 * 60 * 60 * 1000;
}
