import {
  normalizeGarmentType,
  type GarmentMeasurements,
  type WizardShortInput,
  checkOutliers,
  createProfileVersion,
  estimate,
} from "@cutura/core";

import { getDb, saveCustomerMeasurement } from "@cutura/db";

import { getEnv } from "@/server/env";
import {
  measureCookie,
  newMeasureToken,
  readMeasureToken,
  saveMeasurementVersion,
} from "@/server/measurement";
import { rateLimit } from "@/server/ratelimit";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

interface MeasurementRequest {
  op?: "estimate" | "confirm";
  garmentType?: string;
  input?: WizardShortInput;
  method?: "wizard" | "detailed";
  originalInputs?: Partial<GarmentMeasurements>;
  derivedValues?: Partial<GarmentMeasurements>;
  confirmedValues?: GarmentMeasurements;
}

export async function POST(request: Request): Promise<Response> {
  // Unauthenticated endpoint: throttle per IP. Generous budget - the wizard
  // legitimately fires several estimate/confirm calls per session (FR-521).
  const env = getEnv();
  const ip = request.headers.get("cf-connecting-ip") ?? "anon";
  if (!(await rateLimit(env.RATE_LIMIT, `measure:${ip}`, 60, 60))) {
    return Response.json({ error: "throttled" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as MeasurementRequest | null;
  if (!body || typeof body.op !== "string") {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const garmentType = normalizeGarmentType(body.garmentType);

  if (body.op === "estimate") {
    if (!body.input) return Response.json({ error: "missing input" }, { status: 400 });
    try {
      // Wizard estimation runs server-side, dispatched by garment type (FR-521/523).
      return Response.json(estimate(garmentType, body.input));
    } catch {
      // Graceful degradation: route the customer to the detailed path (FR-522/524).
      return Response.json({ fallback: true });
    }
  }

  if (body.op === "confirm") {
    if (!body.confirmedValues) {
      return Response.json({ error: "missing confirmedValues" }, { status: 400 });
    }
    const outlier = checkOutliers(garmentType, body.confirmedValues);
    const version = createProfileVersion({
      method: body.method === "wizard" ? "wizard" : "detailed",
      garmentType,
      originalInputs: body.originalInputs ?? {},
      derivedValues: body.derivedValues ?? {},
      confirmedValues: body.confirmedValues,
      createdAt: new Date().toISOString(),
    });

    // Logged-in: persist to the customer's durable D1 profile instead of guest KV.
    const customerId = await getCustomerId();
    if (customerId) {
      const { profileId } = await saveCustomerMeasurement(
        getDb(env.DB),
        customerId,
        version,
        env.MEASUREMENT_ENCRYPTION_KEY,
      );
      return Response.json({
        ref: { profileId, version: version.version },
        isOutlier: outlier.isOutlier,
        flags: outlier.flags,
      });
    }

    let token = readMeasureToken(request.headers.get("cookie"));
    const isNew = !token;
    if (!token) token = newMeasureToken();
    await saveMeasurementVersion(token, garmentType, version);

    const headers = new Headers({ "content-type": "application/json" });
    if (isNew) headers.append("set-cookie", measureCookie(token));
    // Outlier flags are returned for transparency but never block (FR-560).
    return new Response(
      JSON.stringify({
        ref: { token, version: version.version },
        isOutlier: outlier.isOutlier,
        flags: outlier.flags,
      }),
      { headers },
    );
  }

  return Response.json({ error: "bad op" }, { status: 400 });
}
