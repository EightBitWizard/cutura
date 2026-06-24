// Live Shopify Admin GraphQL client (2026-04) implementing the core ShopifyClient
// interface. Used by /api/checkout (createDraftOrder) and the reconcile/refund
// paths. No live calls happen in CI; the credentials come from worker secrets.

import type {
  CreateDraftOrderInput,
  CreateDraftOrderResult,
  RefundInput,
  ShopifyClient,
  ShopifyOrderSummary,
} from "@cutura/core";

import type { StorefrontEnv } from "./env";

const DEFAULT_VERSION = "2026-04";

interface GraphqlResponse<T> {
  data?: T;
  errors?: unknown;
}

async function graphql<T>(
  env: StorefrontEnv,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_ADMIN_API_TOKEN) {
    throw new Error("Shopify is not configured (missing store domain or admin token)");
  }
  const version = env.SHOPIFY_API_VERSION || DEFAULT_VERSION;
  const res = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_API_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
  const json = (await res.json()) as GraphqlResponse<T>;
  if (json.errors) throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`);
  if (!json.data) throw new Error("Shopify: empty response");
  return json.data;
}

const CREATE_DRAFT = `mutation Create($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) {
    draftOrder { id name invoiceUrl totalPriceSet { presentmentMoney { amount currencyCode } } }
    userErrors { field message }
  }
}`;

interface DraftCreateData {
  draftOrderCreate: {
    draftOrder: {
      id: string;
      name: string;
      invoiceUrl: string;
      totalPriceSet: { presentmentMoney: { amount: string; currencyCode: string } };
    } | null;
    userErrors: Array<{ field?: string[] | null; message: string }>;
  };
}

export function createShopifyClient(env: StorefrontEnv): ShopifyClient {
  return {
    async createDraftOrder(input: CreateDraftOrderInput): Promise<CreateDraftOrderResult> {
      const variables = {
        input: {
          email: input.email,
          note: input.note,
          tags: input.tags,
          presentmentCurrencyCode: "CHF",
          lineItems: input.lineItems.map((li) => ({
            quantity: li.quantity,
            title: li.title,
            taxable: li.taxable,
            requiresShipping: false,
            originalUnitPriceWithCurrency: {
              amount: li.unitPrice.amount,
              currencyCode: li.unitPrice.currencyCode,
            },
            customAttributes: li.customAttributes,
          })),
          shippingLine: {
            title: input.shippingLine.title,
            priceWithCurrency: {
              amount: input.shippingLine.price.amount,
              currencyCode: input.shippingLine.price.currencyCode,
            },
          },
          customAttributes: input.attributes,
          ...(input.shippingAddress
            ? {
                shippingAddress: {
                  address1: input.shippingAddress.line1,
                  city: input.shippingAddress.city,
                  zip: input.shippingAddress.zip,
                  countryCode: input.shippingAddress.country,
                },
              }
            : {}),
        },
      };
      const data = await graphql<DraftCreateData>(env, CREATE_DRAFT, variables);
      const dc = data.draftOrderCreate;
      return {
        draftId: dc.draftOrder?.id ?? "",
        name: dc.draftOrder?.name ?? "",
        invoiceUrl: dc.draftOrder?.invoiceUrl ?? "",
        totalPrice: dc.draftOrder?.totalPriceSet.presentmentMoney ?? {
          amount: "0",
          currencyCode: "CHF",
        },
        userErrors: dc.userErrors,
      };
    },

    async getOrder(orderId: string): Promise<ShopifyOrderSummary | null> {
      const query = `query Get($id: ID!) {
        order(id: $id) { id name tags displayFinancialStatus totalPriceSet { presentmentMoney { amount currencyCode } } }
      }`;
      const data = await graphql<{
        order: {
          id: string;
          name: string;
          tags: string[];
          displayFinancialStatus: string;
          totalPriceSet: { presentmentMoney: { amount: string; currencyCode: string } };
        } | null;
      }>(env, query, { id: orderId });
      if (!data.order) return null;
      return {
        orderId: data.order.id,
        name: data.order.name,
        tags: data.order.tags,
        financialStatus: data.order.displayFinancialStatus,
        totalPrice: data.order.totalPriceSet.presentmentMoney,
      };
    },

    async listOrdersByTag(tag: string, sinceISO: string): Promise<ShopifyOrderSummary[]> {
      const query = `query List($q: String!) {
        orders(first: 50, query: $q) {
          edges { node { id name tags displayFinancialStatus totalPriceSet { presentmentMoney { amount currencyCode } } } }
        }
      }`;
      const data = await graphql<{
        orders: {
          edges: Array<{
            node: {
              id: string;
              name: string;
              tags: string[];
              displayFinancialStatus: string;
              totalPriceSet: { presentmentMoney: { amount: string; currencyCode: string } };
            };
          }>;
        };
      }>(env, query, { q: `tag:${tag} created_at:>=${sinceISO}` });
      return data.orders.edges.map((e) => ({
        orderId: e.node.id,
        name: e.node.name,
        tags: e.node.tags,
        financialStatus: e.node.displayFinancialStatus,
        totalPrice: e.node.totalPriceSet.presentmentMoney,
      }));
    },

    async createRefund(
      input: RefundInput,
    ): Promise<{ refundId: string; userErrors: Array<{ message: string }> }> {
      // refundCreate requires an @idempotent key in 2026-04.
      const mutation = `mutation Refund($input: RefundInput!) {
        refundCreate(input: $input) @idempotent(key: $key) { refund { id } userErrors { message } }
      }`.replace("$key", JSON.stringify(input.idempotencyKey));
      const data = await graphql<{
        refundCreate: { refund: { id: string } | null; userErrors: Array<{ message: string }> };
      }>(env, mutation, {
        input: {
          orderId: input.orderId,
          notify: input.notify,
          note: input.reason,
        },
      });
      return {
        refundId: data.refundCreate.refund?.id ?? "",
        userErrors: data.refundCreate.userErrors,
      };
    },
  };
}
