// Maps the query params that admin action routes redirect with (?saved=1,
// ?error=..., ?approved=1, ?moved=N, ?qc=1) to short banner messages, so a
// failed action never looks like a success. Pure and unit-tested; the
// FeedbackBanner component renders the result.

export interface FeedbackMessage {
  kind: "success" | "error";
  text: string;
}

type SearchParamValue = string | string[] | undefined;

const ERROR_TEXTS: Record<string, string> = {
  no_channel: "No order channel: the supplier has neither an adapter nor a contact email.",
  invalid_price: "Invalid price.",
  invalid_decision: "Invalid decision.",
  invalid_target: "Invalid target status for this transition.",
  required: "Required fields are missing.",
  not_found: "Not found.",
  notfound: "Not found.",
  ship: "Shipping could not be released.",
  publish: "Publish failed: missing entity type or id.",
  unpublish: "Unpublish failed: missing entity type or id.",
  upload: "Upload failed: no file received.",
  filetype: "Upload failed: unsupported file type.",
};

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The banner message for a page's search params, or null when there is nothing to show. */
export function feedbackMessage(params: Record<string, SearchParamValue>): FeedbackMessage | null {
  const error = first(params.error);
  if (error) {
    return { kind: "error", text: ERROR_TEXTS[error] ?? `Action failed (${error}).` };
  }

  const moved = first(params.moved);
  if (moved === "0") {
    return { kind: "error", text: "No items moved: no item was in the required status." };
  }

  const texts: string[] = [];
  if (first(params.saved) === "1") texts.push("Saved.");
  if (first(params.approved) === "1") texts.push("Order approved and sent to the supplier.");
  if (first(params.qc) === "1") texts.push("QC result recorded.");
  if (moved) texts.push(`Moved ${moved} item(s).`);
  if (first(params.removed) === "1") texts.push("Removed.");

  return texts.length > 0 ? { kind: "success", text: texts.join(" ") } : null;
}
