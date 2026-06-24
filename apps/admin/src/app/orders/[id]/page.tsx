import Link from "next/link";

import {
  type OrderSnapshot,
  checkOutliers,
  getDefaultQcChecklist,
  marginMinor,
} from "@cutura/core";
import { getOrderCost, getOrderDetail, readSnapshot } from "@cutura/db";

import { environmentDb } from "@/server/catalog";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = environmentDb("staging");
  const detail = await getOrderDetail(db, id);
  if (!detail) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p>Order not found.</p>
        <Link href="/orders" className="underline">
          Back
        </Link>
      </main>
    );
  }

  const key = getEnv().MEASUREMENT_ENCRYPTION_KEY;
  const items = await Promise.all(
    detail.items.map(async (d) => ({
      ...d,
      snapshot: d.pkg ? await readSnapshot(d.pkg.snapshotEnc, key) : null,
    })),
  );

  const anyInReview = items.some((i) => i.item.status === "in_review");
  const allQcPassed = items.length > 0 && items.every((i) => i.item.status === "qc_passed");
  const cost = await getOrderCost(db, id);
  const margin = cost ? marginMinor(detail.order.totalMinor, cost) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Order <span className="font-mono">{detail.order.orderNumber}</span>
        </h1>
        <Link href="/orders" className="text-sm text-neutral-600 underline">
          Back
        </Link>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Status: {detail.order.status} - {detail.order.guestEmail} - Terms{" "}
        {detail.order.acceptedTermsVersion} / Privacy {detail.order.acceptedPrivacyVersion}
      </p>

      <div className="mt-4 flex gap-2">
        {anyInReview && (
          <form method="post" action={`/api/orders/${id}/approve`}>
            <button type="submit" className="rounded bg-neutral-900 px-3 py-1 text-sm text-white">
              Approve + send to supplier
            </button>
          </form>
        )}
        {allQcPassed && (
          <form method="post" action={`/api/orders/${id}/ship`}>
            <button type="submit" className="rounded bg-neutral-900 px-3 py-1 text-sm text-white">
              Release shipping
            </button>
          </form>
        )}
        <a
          href={`/api/orders/${id}/parcel-card`}
          className="rounded border border-neutral-300 px-3 py-1 text-sm"
        >
          Parcel card (PDF)
        </a>
      </div>

      <form
        method="post"
        action={`/api/orders/${id}/notes`}
        className="mt-6 flex flex-col gap-2 rounded-lg border border-neutral-200 p-4"
      >
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          Internal notes + tags
        </h2>
        <textarea
          name="notes"
          rows={2}
          defaultValue={detail.order.notes ?? ""}
          className="rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <input
          name="tags"
          placeholder="Tags (comma-separated)"
          defaultValue={(detail.order.tags ?? []).join(", ")}
          className="rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          className="self-start rounded border border-neutral-300 px-3 py-1 text-sm"
        >
          Save notes + tags
        </button>
      </form>

      <form
        method="post"
        action={`/api/orders/${id}/cost`}
        className="mt-6 rounded-lg border border-neutral-200 p-4"
      >
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          Cost capture (Rappen)
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["fabricMinor", "Fabric", cost?.fabricMinor],
              ["productionMinor", "Production", cost?.productionMinor],
              ["inboundMinor", "Inbound", cost?.inboundMinor],
              ["feesMinor", "Fees", cost?.feesMinor],
            ] as const
          ).map(([name, label, value]) => (
            <label key={name} className="flex flex-col text-xs">
              {label}
              <input
                name={name}
                type="number"
                min={0}
                defaultValue={value ?? ""}
                className="mt-1 rounded border border-neutral-300 px-2 py-1"
              />
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4">
          <button type="submit" className="rounded border border-neutral-300 px-3 py-1 text-sm">
            Save cost
          </button>
          {margin !== null && (
            <span className="text-sm text-neutral-600">
              Margin: {(margin / 100).toFixed(2)} CHF
            </span>
          )}
        </div>
      </form>

      {items.map(({ item, pkg, qc, snapshot }) => (
        <section key={item.id} className="mt-6 rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">{snapshot?.baseModelName ?? item.baseModelId}</h2>
            <span className="text-sm text-neutral-500">{item.status}</span>
          </div>
          {snapshot && <OutlierWarning snapshot={snapshot} />}
          {snapshot && <SnapshotView snapshot={snapshot} />}
          {qc && (
            <p className="mt-2 text-sm">
              QC: <span className="font-medium">{qc.overallResult}</span>
              {qc.overrideBy ? ` (override by ${qc.overrideBy}: ${qc.overrideReason})` : ""}
            </p>
          )}

          {item.status === "in_review" && (
            <form method="post" action={`/api/orders/${id}/correct`} className="mt-3 flex gap-2">
              <input type="hidden" name="orderItemId" value={item.id} />
              <input
                name="note"
                placeholder="Pre-release correction note (audited)"
                required
                className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm"
              />
              <button type="submit" className="rounded border border-neutral-300 px-2 py-1 text-sm">
                Record correction
              </button>
            </form>
          )}
          {item.status === "arrived_ch" && (
            <QcForm
              orderId={id}
              packageId={pkg?.id}
              garmentType={snapshot?.garmentType ?? "shirt"}
            />
          )}
          {item.status === "qc_failed" && (
            <form method="post" action={`/api/orders/${id}/override`} className="mt-3 flex gap-2">
              <input type="hidden" name="orderItemId" value={item.id} />
              <input
                name="overrideReason"
                placeholder="Override reason"
                required
                className="rounded border border-neutral-300 px-2 py-1 text-sm"
              />
              <button type="submit" className="rounded border border-neutral-300 px-2 py-1 text-sm">
                Override to pass (audited)
              </button>
            </form>
          )}
        </section>
      ))}

      <h2 className="mt-8 text-lg font-medium">Timeline</h2>
      <ul className="mt-2 text-sm text-neutral-600">
        {detail.events.map((e) => (
          <li key={e.id}>
            {e.createdAt.slice(0, 19).replace("T", " ")} - {e.fromStatus ?? "-"} {"->"} {e.toStatus}{" "}
            ({e.actor}
            {e.reason ? `: ${e.reason}` : ""})
          </li>
        ))}
      </ul>
    </main>
  );
}

function OutlierWarning({ snapshot }: { snapshot: OrderSnapshot }) {
  const result = checkOutliers(snapshot.garmentType, snapshot.effectiveMeasurements);
  if (!result.isOutlier) return null;
  return (
    <div className="mt-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
      <p className="font-medium">Outlier - bitte Masse prüfen</p>
      <ul className="mt-1 list-disc pl-5">
        {result.flags.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}

function SnapshotView({ snapshot }: { snapshot: OrderSnapshot }) {
  return (
    <dl className="mt-2 grid grid-cols-2 gap-x-4 text-sm text-neutral-600">
      <div className="col-span-2">Fabric: {snapshot.fabricCode}</div>
      {Object.entries(snapshot.configuration).map(([k, v]) => (
        <div key={k}>
          {k}: {v}
        </div>
      ))}
      {Object.entries(snapshot.effectiveMeasurements as unknown as Record<string, number>).map(
        ([k, v]) => (
          <div key={k}>
            {k}: {v} cm
          </div>
        ),
      )}
    </dl>
  );
}

function QcForm({
  orderId,
  packageId,
  garmentType,
}: {
  orderId: string;
  packageId: string | undefined;
  garmentType: string;
}) {
  if (!packageId) return null;
  const checklist = getDefaultQcChecklist(garmentType === "trouser" ? "trouser" : "shirt");
  return (
    <form method="post" action={`/api/orders/${orderId}/qc`} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="packageId" value={packageId} />
      <input type="hidden" name="garmentType" value={garmentType} />
      {checklist.map((c) => (
        <label key={c.id} className="flex items-center justify-between text-sm">
          <span>{c.label}</span>
          <select name={`result_${c.id}`} defaultValue="ok" className="rounded border px-2 py-1">
            <option value="ok">ok</option>
            <option value="fail">fail</option>
          </select>
        </label>
      ))}
      <input
        name="notes"
        placeholder="Notes (optional)"
        className="rounded border border-neutral-300 px-2 py-1 text-sm"
      />
      <button
        type="submit"
        className="self-start rounded bg-neutral-900 px-3 py-1 text-sm text-white"
      >
        Submit QC
      </button>
    </form>
  );
}
