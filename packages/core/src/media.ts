// Raster image types CUTURA accepts + serves inline. SVG and HTML are deliberately
// excluded: they can carry script and would execute in the serving origin (stored
// XSS). Upload validates against this list; the serve routes force a safe
// content-type + nosniff + a locked-down CSP for anything else. Pure, shared by
// both apps.
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;

export function isAllowedImageType(type: string | null | undefined): boolean {
  return typeof type === "string" && (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}
