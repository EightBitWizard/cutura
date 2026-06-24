import { describe, expect, it } from "vitest";

import { EncryptionError, decryptJson, encryptJson } from "./measurementCrypto";

const SECRET = "test-measurement-encryption-key-please-change";

describe("measurementCrypto", () => {
  it("round-trips a nested object", async () => {
    const value = {
      chest: 102,
      waist: 88,
      nested: { neck: 40.5, notes: "Körpergrösse 182cm" },
      list: [1, 2, 3],
    };
    const cipher = await encryptJson(value, SECRET, "measurement_version");
    const back = await decryptJson<typeof value>(cipher, SECRET, "measurement_version");
    expect(back).toEqual(value);
  });

  it("produces a fresh IV each call (different ciphertext for the same input)", async () => {
    const a = await encryptJson({ x: 1 }, SECRET, "snapshot");
    const b = await encryptJson({ x: 1 }, SECRET, "snapshot");
    expect(a).not.toEqual(b);
  });

  it("rejects the wrong secret", async () => {
    const cipher = await encryptJson({ x: 1 }, SECRET, "snapshot");
    await expect(decryptJson(cipher, "a-different-secret", "snapshot")).rejects.toBeInstanceOf(
      EncryptionError,
    );
  });

  it("rejects a tampered ciphertext", async () => {
    const cipher = await encryptJson({ secretField: 123 }, SECRET, "snapshot");
    const flipped = cipher.slice(0, -2) + (cipher.endsWith("A") ? "B" : "A") + cipher.slice(-1);
    await expect(decryptJson(flipped, SECRET, "snapshot")).rejects.toBeInstanceOf(EncryptionError);
  });

  it("isolates purposes (snapshot blob cannot be read as a measurement version)", async () => {
    const cipher = await encryptJson({ x: 1 }, SECRET, "snapshot");
    await expect(decryptJson(cipher, SECRET, "measurement_version")).rejects.toBeInstanceOf(
      EncryptionError,
    );
  });

  it("never leaks plaintext or key in the error message", async () => {
    const cipher = await encryptJson({ topSecret: "182cm-body-data" }, SECRET, "snapshot");
    try {
      await decryptJson(cipher, "wrong-secret", "snapshot");
      throw new Error("should have thrown");
    } catch (err) {
      const message = (err as Error).message;
      expect(message).not.toContain("182cm-body-data");
      expect(message).not.toContain(SECRET);
    }
  });
});
