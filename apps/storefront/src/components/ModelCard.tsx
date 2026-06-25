import Link from "next/link";

import { MediaImage } from "./MediaImage";
import { Price } from "./ui/Price";

// The one product card, used by the home page, discovery, collections, occasions,
// search, and recommendations. Borderless and image-forward: the photograph carries
// the card, with a calm hover lift.
export function ModelCard({
  locale,
  model,
  mediaId,
  fromLabel,
  notifyLabel,
}: {
  locale: string;
  model: {
    handle: string;
    name: string;
    basePriceMinor: number;
    status?: "view_only" | "orderable";
  };
  mediaId: string | null;
  fromLabel: string;
  notifyLabel?: string;
}) {
  return (
    <Link href={`/${locale}/products/${model.handle}`} className="group flex flex-col">
      <div className="overflow-hidden bg-sunken">
        <MediaImage
          mediaId={mediaId}
          alt={model.name}
          className="aspect-[3/4] w-full object-cover transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="font-medium text-ink group-hover:underline">{model.name}</span>
        <span className="shrink-0 text-sm text-ink-muted">
          {fromLabel} <Price minor={model.basePriceMinor} />
        </span>
      </div>
      {model.status === "view_only" && notifyLabel ? (
        <span className="mt-1 text-eyebrow uppercase text-ink-subtle">{notifyLabel}</span>
      ) : null}
    </Link>
  );
}
