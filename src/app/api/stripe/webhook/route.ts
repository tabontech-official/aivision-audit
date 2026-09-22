import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getDynamicStripeClient, getActiveStripeWebhookSecret } from "@/services/billing/stripe-admin";
import { db } from "@/lib/db/client";
import { syncSubscription, syncInvoice } from "@/services/billing/sync";

export const runtime = "nodejs";
// Stripe requires the raw, unparsed body for signature verification.
export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/webhook — Dynamic Stripe event receiver.
 *
 * Security:
 *  - Verifies the Stripe signature against active decrypted webhook secret.
 *  - Idempotency ledger (stripe_webhook_events): an event id already marked
 *    processed is acknowledged and skipped, so Stripe retries are safe.
 */
export async function POST(req: Request) {
  const stripe = await getDynamicStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Billing not configured." }, { status: 503 });
  }

  const webhookSecret = (await getActiveStripeWebhookSecret()) || process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured in Master Admin or environment." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe:webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Idempotency: record-or-skip
  try {
    await db.stripeWebhookEvent.create({
      data: { stripeEventId: event.id, type: event.type },
    });
  } catch {
    // Already recorded → acknowledge without reprocessing
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleEvent(event, stripe);
    await db.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processedAt: new Date() },
    });
  } catch (err) {
    console.error(`[stripe:webhook] handler error for ${event.type}:`, err);
    // Delete the ledger row so Stripe's retry can reprocess this event.
    await db.stripeWebhookEvent
      .delete({ where: { stripeEventId: event.id } })
      .catch(() => undefined);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event, stripe: Stripe): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subId);
        if (session.metadata?.userId && !subscription.metadata?.userId) {
          subscription.metadata = { ...subscription.metadata, userId: session.metadata.userId };
        }
        if (session.metadata?.planId && !subscription.metadata?.planId) {
          subscription.metadata = { ...subscription.metadata, planId: session.metadata.planId };
        }
        await syncSubscription(subscription);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(subscription);
      break;
    }

    case "invoice.paid":
    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await syncInvoice(invoice);
      break;
    }

    default:
      break;
  }
}
