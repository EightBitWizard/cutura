import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import {
  deleteSessionById,
  deleteSessionsForCustomer,
  findCustomerByEmail,
  findOrCreateCustomer,
  listSessionIdsForCustomer,
  recordSession,
} from "./auth";

const db = () => getDb(env.TARGET_TEST_DB);

describe("findOrCreateCustomer", () => {
  it("creates once then finds; normalizes the email", async () => {
    const email = `New_${crypto.randomUUID()}@Example.COM `;
    const a = await findOrCreateCustomer(db(), email, "de");
    expect(a.created).toBe(true);
    expect(a.customer.email).toBe(email.trim().toLowerCase());

    const b = await findOrCreateCustomer(db(), email.trim().toLowerCase(), "en");
    expect(b.created).toBe(false);
    expect(b.customer.id).toBe(a.customer.id);
    expect(await findCustomerByEmail(db(), email.toUpperCase().trim())).toBeDefined();
  });
});

describe("session mirror", () => {
  it("records, lists, and deletes sessions per customer", async () => {
    const { customer } = await findOrCreateCustomer(db(), `s_${crypto.randomUUID()}@x.ch`, "de");
    const s1 = crypto.randomUUID();
    const s2 = crypto.randomUUID();
    const exp = "2099-01-01T00:00:00.000Z";
    await recordSession(db(), { id: s1, customerId: customer.id, expiresAt: exp });
    await recordSession(db(), { id: s2, customerId: customer.id, expiresAt: exp });
    expect((await listSessionIdsForCustomer(db(), customer.id)).sort()).toEqual([s1, s2].sort());

    await deleteSessionById(db(), s1);
    expect(await listSessionIdsForCustomer(db(), customer.id)).toEqual([s2]);

    await deleteSessionsForCustomer(db(), customer.id);
    expect(await listSessionIdsForCustomer(db(), customer.id)).toEqual([]);
  });
});
