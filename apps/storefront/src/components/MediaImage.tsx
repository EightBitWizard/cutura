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
    // Intentional placeholder while photography is still pending: a calm warm panel
    // with a faint monogram, so an empty slot reads as deliberate, not broken.
    return (
      <div className={className} aria-hidden="true">
        <span className="flex h-full w-full items-center justify-center text-eyebrow uppercase tracking-[0.25em] text-ink-subtle/40">
          CUTURA
        </span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- served from our R2 route, no loader needed
  return <img src={`/api/media/${mediaId}`} alt={alt} className={className} loading="lazy" />;
}
