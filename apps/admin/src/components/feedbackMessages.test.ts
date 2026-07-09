import { describe, expect, it } from "vitest";

import { feedbackMessage } from "./feedbackMessages";

describe("feedbackMessage", () => {
  it("returns null when no feedback params are present", () => {
    expect(feedbackMessage({})).toBeNull();
    expect(feedbackMessage({ producer: "kutetailor" })).toBeNull();
  });

  it("maps success params", () => {
    expect(feedbackMessage({ saved: "1" })).toEqual({ kind: "success", text: "Saved." });
    expect(feedbackMessage({ approved: "1" })).toEqual({
      kind: "success",
      text: "Order approved and sent to the supplier.",
    });
    expect(feedbackMessage({ qc: "1" })).toEqual({ kind: "success", text: "QC result recorded." });
    expect(feedbackMessage({ moved: "2" })).toEqual({ kind: "success", text: "Moved 2 item(s)." });
  });

  it("maps the known error tokens to specific texts", () => {
    expect(feedbackMessage({ error: "no_channel" })).toEqual({
      kind: "error",
      text: "No order channel: the supplier has neither an adapter nor a contact email.",
    });
    expect(feedbackMessage({ error: "invalid_price" })).toEqual({
      kind: "error",
      text: "Invalid price.",
    });
    expect(feedbackMessage({ error: "invalid_decision" })).toEqual({
      kind: "error",
      text: "Invalid decision.",
    });
    expect(feedbackMessage({ error: "invalid_target" })).toEqual({
      kind: "error",
      text: "Invalid target status for this transition.",
    });
  });

  it("surfaces unknown error tokens instead of hiding them", () => {
    expect(feedbackMessage({ error: "boom" })).toEqual({
      kind: "error",
      text: "Action failed (boom).",
    });
  });

  it("treats an error as an error even when a success param is also present", () => {
    expect(feedbackMessage({ saved: "1", error: "required" })?.kind).toBe("error");
  });

  it("reports a transition that moved nothing as an error", () => {
    expect(feedbackMessage({ moved: "0" })).toEqual({
      kind: "error",
      text: "No items moved: no item was in the required status.",
    });
  });

  it("takes the first value of a repeated param", () => {
    expect(feedbackMessage({ error: ["no_channel", "required"] })?.text).toContain(
      "No order channel",
    );
  });
});
