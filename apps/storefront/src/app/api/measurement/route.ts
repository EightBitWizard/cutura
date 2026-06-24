import {
  type GarmentMeasurements,
  type ShirtMeasurements,
  type WizardShortInput,
  checkShirtOutliers,
  createProfileVersion,
  estimate,
} from "@cutura/core";

import {
  measureCookie,
  newMeasureToken,
  readMeasureToken,
  saveMeasurementVersion,
} from "@/server/measurement";

export const dynamic = "force-dynamic";

interface MeasurementRequest {
  op?: "estimate" | "confirm";
  input?: WizardShortInput;
  method?: "wizard" | "detailed";
  originalInputs?: Partial<GarmentMeasurements>;
  derivedValues?: Partial<GarmentMeasurements>;
  confirmedValues?: GarmentMeasurements;
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as MeasurementRequest | null;
  if (!body || typeof body.op !== "string") {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  if (body.op === "estimate") {
    if (!body.input) return Response.json({ error: "missing input" }, { status: 400 });
    try {
      // Wizard estimation runs server-side (FR-521).
      return Response.json(estimate("shirt", body.input));
    } catch {
      // Graceful degradation: route the customer to the detailed path (FR-522/524).
      return Response.json({ fallback: true });
    }
  }

  if (body.op === "confirm") {
    if (!body.confirmedValues) {
      return Response.json({ error: "missing confirmedValues" }, { status: 400 });
    }
    const outlier = checkShirtOutliers(body.confirmedValues as Partial<ShirtMeasurements>);
    const version = createProfileVersion({
      method: body.method === "wizard" ? "wizard" : "detailed",
      originalInputs: body.originalInputs ?? {},
      derivedValues: body.derivedValues ?? {},
      confirmedValues: body.confirmedValues,
      createdAt: new Date().toISOString(),
    });

    let token = readMeasureToken(request.headers.get("cookie"));
    const isNew = !token;
    if (!token) token = newMeasureToken();
    await saveMeasurementVersion(token, version);

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
