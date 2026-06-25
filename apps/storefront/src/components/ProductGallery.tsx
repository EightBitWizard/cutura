"use client";

import { useState } from "react";

import { MediaImage } from "./MediaImage";

// Product image gallery: a main image plus a thumbnail strip the customer can click
// through. Images arrive ordered (primary first); the thumbnail strip only appears when
// there is more than one. Falls back to the branded placeholder when there are none.
export function ProductGallery({
  images,
  name,
}: {
  images: Array<{ id: string; alt: string | null }>;
  name: string;
}) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden bg-sunken">
        <MediaImage
          mediaId={current?.id ?? null}
          alt={current?.alt || name}
          className="aspect-[4/5] w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <ul className="flex flex-wrap gap-2">
          {images.map((img, i) => {
            const active = i === selected;
            return (
              <li key={img.id}>
                <button
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => setSelected(i)}
                  className={`overflow-hidden rounded-sm border transition-colors ${
                    active
                      ? "border-accent ring-1 ring-accent"
                      : "border-line hover:border-line-strong"
                  }`}
                >
                  <MediaImage
                    mediaId={img.id}
                    alt=""
                    className="h-16 w-16 bg-sunken object-cover"
                  />
                  <span className="sr-only">
                    {name} image {i + 1}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
