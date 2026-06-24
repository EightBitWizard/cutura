// Catalog image served from the public media route. Renders nothing when there is
// no media id, so callers can pass an optional id directly.
export function MediaImage({
  mediaId,
  alt,
  className,
}: {
  mediaId: string | null | undefined;
  alt: string;
  className?: string;
}) {
  if (!mediaId) {
    return <div className={className} aria-hidden="true" />;
  }
  // eslint-disable-next-line @next/next/no-img-element -- served from our R2 route, no loader needed
  return <img src={`/api/media/${mediaId}`} alt={alt} className={className} loading="lazy" />;
}
