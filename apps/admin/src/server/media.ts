// Raster image types CUTURA accepts + serves. SVG and HTML are deliberately
// excluded: they can carry script and would otherwise execute in the admin origin
// when served inline (stored XSS). Upload validates against this list and the
// serve route forces a safe content-type for anything else.
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;

export function isAllowedImageType(type: string | null | undefined): boolean {
  return typeof type === "string" && (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}
