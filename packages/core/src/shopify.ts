// The Shopify payment-rail boundary: types + the client interface only (pure, no
// fetch). The live fetch implementation lives in the storefront worker
// (apps/storefront/src/server/shopify.ts); tests use a fake. Researched against
// the Shopify Admin GraphQL API 2026-04 (draftOrderCreate +
// originalUnitPriceWithCurrency + a 0.00 shippingLine + invoiceUrl).

export interface ShopifyMoney {
  /** Decimal string in major units, e.g. "189.00". */
  amount: string;
  currencyCode: string;
}

export interface ShopifyAttribute {
  key: string;
  value: string;
}

export interface ShopifyAddress {
  line1: string;
  city: string;
  zip: string;
  country: "CH" | "LI";
}

export interface DraftLineItem {
  quantity: number;
  title: string;
  /** Gross, all-inclusive unit price (standard shipping folded in; VAT extracted inside). */
  unitPrice: ShopifyMoney;
  taxable: boolean;
  customAttributes: ShopifyAttribute[];
}

export interface CreateDraftOrderInput {
  orderNumber: string;
  email: string;
  lineItems: DraftLineItem[];
  /** Standard shipping is folded into the item price; this line is 0.00 (FR-710/711/731). */
  shippingLine: { title: string; price: ShopifyMoney };
  shippingAddress?: ShopifyAddress;
  tags: string[];
  note?: string;
  attributes: ShopifyAttribute[];
}

export interface CreateDraftOrderResult {
  draftId: string;
  name: string;
  invoiceUrl: string;
  totalPrice: ShopifyMoney;
  userErrors: Array<{ field?: string[] | null; message: string }>;
}

export interface ShopifyOrderSummary {
  orderId: string;
  name: string;
  tags: string[];
  financialStatus: string;
  totalPrice: ShopifyMoney;
  draftId?: string;
}

export interface RefundInput {
  orderId: string;
  amount?: ShopifyMoney;
  reason?: string;
  notify: boolean;
  /** refundCreate requires an @idempotent key in 2026-04. */
  idempotencyKey: string;
}

export interface ShopifyClient {
  createDraftOrder(input: CreateDraftOrderInput): Promise<CreateDraftOrderResult>;
  getOrder(orderId: string): Promise<ShopifyOrderSummary | null>;
  listOrdersByTag(tag: string, sinceISO: string): Promise<ShopifyOrderSummary[]>;
  createRefund(
    input: RefundInput,
  ): Promise<{ refundId: string; userErrors: Array<{ message: string }> }>;
}

/** Convert integer minor units (Rappen) to a Shopify Decimal string in CHF. */
export function minorToDecimal(minor: number): string {
  return (minor / 100).toFixed(2);
}

/** Convert a Shopify Decimal string back to integer minor units. */
export function decimalToMinor(amount: string): number {
  return Math.round(Number.parseFloat(amount) * 100);
}
