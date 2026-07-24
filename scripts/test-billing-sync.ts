/**
 * Verify billing sync logic WITHOUT real Stripe keys, by driving
 * syncSubscription / syncInvoice with fabricated Stripe-shaped objects.
 * Confirms: plan upgrade, subscription upsert, invoice+payment rows,
 * downgrade on cancel, and idempotency (re-run = no duplicates).
 *
 * Run: npx tsx --import ./scripts/shims/register.mjs scripts/test-billing-sync.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { syncSubscription, syncInvoice } from "../src/services/billing/sync";
import type Stripe from "stripe";

const db = new PrismaClient();
const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

const CUSTOMER = "cus_test_billing";
const SUB_ID = "sub_test_billing";
const INV_ID = "in_test_billing";

function fakeSubscription(status: string, cancelAtPeriodEnd = false): Stripe.Subscription {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: SUB_ID,
    object: "subscription",
    customer: CUSTOMER,
    status,
    cancel_at_period_end: cancelAtPeriodEnd,
    canceled_at: status === "canceled" ? now : null,
    metadata: {},
    items: {
      object: "list",
      data: [
        {
          id: "si_test",
          current_period_start: now,
          current_period_end: now + 30 * 86400,
        } as unknown,
      ],
    },
  } as unknown as Stripe.Subscription;
}

function fakeInvoice(status: string): Stripe.Invoice {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: INV_ID,
    object: "invoice",
    customer: CUSTOMER,
    status,
    number: "AF-0001",
    amount_paid: status === "paid" ? 2900 : 0,
    amount_due: 2900,
    currency: "usd",
    created: now,
    invoice_pdf: "https://stripe.example/invoice.pdf",
    hosted_invoice_url: "https://stripe.example/invoice",
    payment_intent: "pi_test_billing",
  } as unknown as Stripe.Invoice;
}

let failures = 0;
const check = (cond: boolean, msg: string) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

async function cleanup(userId: string | null) {
  await db.invoice.deleteMany({ where: { stripeInvoiceId: INV_ID } });
  await db.payment.deleteMany({ where: { stripePaymentIntentId: "pi_test_billing" } });
  await db.subscription.deleteMany({ where: { stripeSubscriptionId: SUB_ID } });
  if (userId) {
    await db.notification.deleteMany({ where: { userId } });
    await db.user.deleteMany({ where: { id: userId } });
  }
}

async function main() {
  // Create a fresh FREE user; put the customer id in metadata resolution path
  const passwordHash = await hash("Test@1234", ARGON);
  const user = await db.user.create({
    data: {
      email: "billing-test@example.com",
      name: "Billing Test",
      passwordHash,
      plan: "FREE",
      emailVerifiedAt: new Date(),
    },
  });
  console.log("Created FREE user", user.id);

  try {
    // --- 1. Active subscription with userId in metadata → upgrade to PREMIUM
    const sub = fakeSubscription("active");
    sub.metadata = { userId: user.id };
    await syncSubscription(sub);

    let u = await db.user.findUnique({ where: { id: user.id } });
    check(u?.plan === "PREMIUM", "active subscription upgrades user to PREMIUM");

    const subRow = await db.subscription.findUnique({ where: { stripeSubscriptionId: SUB_ID } });
    check(subRow?.status === "ACTIVE", "subscription row created with ACTIVE status");
    check(subRow?.stripeCustomerId === CUSTOMER, "customer id stored");
    check(subRow?.currentPeriodEnd !== null, "period end stored");

    const notif = await db.notification.findFirst({
      where: { userId: user.id, type: "PLAN_UPGRADED" },
    });
    check(!!notif, "upgrade notification created");

    // --- 2. Idempotency: re-run the SAME active sub → still 1 row, still PREMIUM
    await syncSubscription(sub);
    const subCount = await db.subscription.count({ where: { stripeSubscriptionId: SUB_ID } });
    check(subCount === 1, "re-running active sync does not duplicate subscription");
    const notifCount = await db.notification.count({
      where: { userId: user.id, type: "PLAN_UPGRADED" },
    });
    check(notifCount === 1, "re-running active sync does not duplicate notification (no plan change)");

    // --- 3. Invoice paid → payment + invoice rows
    await syncInvoice(fakeInvoice("paid"));
    const payment = await db.payment.findUnique({
      where: { stripePaymentIntentId: "pi_test_billing" },
    });
    check(payment?.status === "SUCCEEDED", "paid invoice creates SUCCEEDED payment");
    check(payment?.amountCents === 2900, "payment amount correct");
    const invoice = await db.invoice.findUnique({ where: { stripeInvoiceId: INV_ID } });
    check(invoice?.hostedInvoiceUrl === "https://stripe.example/invoice", "invoice row stored");

    // Idempotency: re-run invoice → still one payment/invoice
    await syncInvoice(fakeInvoice("paid"));
    check(
      (await db.payment.count({ where: { stripePaymentIntentId: "pi_test_billing" } })) === 1,
      "re-running invoice sync does not duplicate payment",
    );

    // --- 4. Cancellation → downgrade to FREE
    // resolve userId via existing subscription row (metadata cleared)
    const canceledSub = fakeSubscription("canceled");
    await syncSubscription(canceledSub);
    u = await db.user.findUnique({ where: { id: user.id } });
    check(u?.plan === "FREE", "canceled subscription downgrades user to FREE");
    const subRow2 = await db.subscription.findUnique({ where: { stripeSubscriptionId: SUB_ID } });
    check(subRow2?.status === "CANCELED", "subscription row marked CANCELED");
    const downNotif = await db.notification.findFirst({
      where: { userId: user.id, type: "PLAN_DOWNGRADED" },
    });
    check(!!downNotif, "downgrade notification created");

    // --- 5. userId resolution WITHOUT metadata (via existing customer row)
    const reactivate = fakeSubscription("active"); // no metadata.userId
    await syncSubscription(reactivate);
    u = await db.user.findUnique({ where: { id: user.id } });
    check(u?.plan === "PREMIUM", "resolves userId from existing customer row (no metadata) and re-upgrades");
  } finally {
    await cleanup(user.id);
    console.log("cleaned up test data");
  }

  if (failures) { console.error(`\n${failures} FAILURES`); process.exit(1); }
  console.log("\nAll billing sync checks passed.");
}

main().finally(() => db.$disconnect());
