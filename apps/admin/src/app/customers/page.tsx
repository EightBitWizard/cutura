import Link from "next/link";

import { listCustomersAdmin } from "@cutura/db";

import { environmentDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await listCustomersAdmin(environmentDb("staging"));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <Link href="/" className="text-sm text-neutral-600 underline">
          Dashboard
        </Link>
      </div>
      <p className="mt-1 text-sm text-neutral-500">{customers.length} customers</p>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2">Email</th>
            <th>Orders</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2">
                <Link href={`/customers/${c.id}`} className="underline">
                  {c.email}
                </Link>
              </td>
              <td>{c.orderCount}</td>
              <td className="text-neutral-500">{c.deletionState}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
