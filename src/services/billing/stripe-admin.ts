import "server-only";
import Stripe from "stripe";
import { db } from "@/lib/db/client";
import { getSecretSetting, setSecretSetting, getSecretStatus } from "@/services/settings/secret";

export type StripeSettings = {
  mode: "test" | "live";
  publishableKey: string | null;
  secretKeySet: boolean;
  secretKeyMasked: string | null;
  webhookSecretSet: boolean;
  webhookSecretMasked: string | null;
  currency: string;
  billingEnabled: boolean;
};

/** Fetch public and masked Stripe billing configuration */
export async function getStripeSettings(): Promise<StripeSettings> {
  const modeSetting = await db.systemSetting.findUnique({ where: { key: "stripe_mode" } });
  const mode = (modeSetting?.value as string) === "live" ? "live" : "test";

  const pubKeySetting = await db.systemSetting.findUnique({
    where: { key: `stripe_publishable_key_${mode}` },
  });
  const fallbackPubKey = await db.systemSetting.findUnique({
    where: { key: "stripe_publishable_key" },
  });
  const publishableKey =
    (pubKeySetting?.value as string) ||
    (fallbackPubKey?.value as string) ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "";

  const secretStatus = await getSecretStatus(
    `stripe_secret_key_${mode}`,
    process.env.STRIPE_SECRET_KEY,
  );

  const webhookStatus = await getSecretStatus(
    `stripe_webhook_secret_${mode}`,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  const currencySetting = await db.systemSetting.findUnique({ where: { key: "billing_currency" } });
  const currency = (currencySetting?.value as string) || "usd";

  const billingEnabledSetting = await db.systemSetting.findUnique({
    where: { key: "billing_enabled" },
  });
  const billingEnabled = billingEnabledSetting?.value === true || billingEnabledSetting?.value === "true";

  return {
    mode,
    publishableKey: publishableKey || null,
    secretKeySet: secretStatus.isSet,
    secretKeyMasked: secretStatus.maskedPreview,
    webhookSecretSet: webhookStatus.isSet,
    webhookSecretMasked: webhookStatus.maskedPreview,
    currency,
    billingEnabled,
  };
}

/** Get decrypted Stripe Secret Key for the active mode */
export async function getActiveStripeSecretKey(): Promise<string | null> {
  const modeSetting = await db.systemSetting.findUnique({ where: { key: "stripe_mode" } });
  const mode = (modeSetting?.value as string) === "live" ? "live" : "test";

  // Try mode-specific secret first, then generic, then env
  const secret = await getSecretSetting(
    `stripe_secret_key_${mode}`,
    process.env.STRIPE_SECRET_KEY,
  );
  if (secret) return secret;

  return getSecretSetting("stripe_secret_key", process.env.STRIPE_SECRET_KEY);
}

/** Get decrypted Stripe Webhook Secret for the active mode */
export async function getActiveStripeWebhookSecret(): Promise<string | null> {
  const modeSetting = await db.systemSetting.findUnique({ where: { key: "stripe_mode" } });
  const mode = (modeSetting?.value as string) === "live" ? "live" : "test";

  const secret = await getSecretSetting(
    `stripe_webhook_secret_${mode}`,
    process.env.STRIPE_WEBHOOK_SECRET,
  );
  if (secret) return secret;

  return getSecretSetting("stripe_webhook_secret", process.env.STRIPE_WEBHOOK_SECRET);
}

/** Dynamic Stripe client instantiated with current DB configuration */
export async function getDynamicStripeClient(): Promise<Stripe | null> {
  const secretKey = await getActiveStripeSecretKey();
  if (!secretKey) return null;

  return new Stripe(secretKey, {
    typescript: true,
    appInfo: { name: "The Rank Writers", version: "2.0.0" },
  });
}

/** Require Stripe client or throw */
export async function requireDynamicStripe(): Promise<Stripe> {
  const client = await getDynamicStripeClient();
  if (!client) {
    throw new Error("Stripe is not configured. Please set your Stripe Secret Key in Master Admin > Billing Settings.");
  }
  return client;
}

/** Test Stripe connection by retrieving account / balance details */
export async function testStripeConnection(): Promise<{
  ok: boolean;
  message: string;
  details?: {
    mode: string;
    accountId?: string;
    livemode?: boolean;
    defaultCurrency?: string;
  };
}> {
  try {
    const stripe = await getDynamicStripeClient();
    if (!stripe) {
      return {
        ok: false,
        message: "No Stripe Secret Key found in database settings or environment variables.",
      };
    }

    // Ping Stripe balance API to verify credentials
    const balance = await stripe.balance.retrieve();
    const modeSetting = await db.systemSetting.findUnique({ where: { key: "stripe_mode" } });
    const mode = (modeSetting?.value as string) === "live" ? "live" : "test";

    return {
      ok: true,
      message: `Successfully connected to Stripe in ${mode.toUpperCase()} mode!`,
      details: {
        mode,
        livemode: balance.livemode,
        defaultCurrency: balance.available?.[0]?.currency?.toUpperCase() || "USD",
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown Stripe connection error";
    return {
      ok: false,
      message: `Stripe connection failed: ${errorMsg}`,
    };
  }
}

/** Update Master Admin Stripe & Billing Settings */
export async function updateStripeSettings(
  input: {
    mode?: "test" | "live";
    publishableKey?: string;
    secretKey?: string;
    webhookSecret?: string;
    currency?: string;
    billingEnabled?: boolean;
  },
  actorId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const currentMode = input.mode || "test";

    if (input.mode !== undefined) {
      await db.systemSetting.upsert({
        where: { key: "stripe_mode" },
        update: { value: input.mode, isSecret: false, updatedById: actorId },
        create: { key: "stripe_mode", value: input.mode, isSecret: false, updatedById: actorId },
      });
    }

    if (input.publishableKey !== undefined) {
      const pubKeyToSave = input.publishableKey.trim();
      await db.systemSetting.upsert({
        where: { key: `stripe_publishable_key_${currentMode}` },
        update: { value: pubKeyToSave, isSecret: false, updatedById: actorId },
        create: {
          key: `stripe_publishable_key_${currentMode}`,
          value: pubKeyToSave,
          isSecret: false,
          updatedById: actorId,
        },
      });
    }

    if (input.secretKey && input.secretKey.trim().length > 0) {
      const res = await setSecretSetting(`stripe_secret_key_${currentMode}`, input.secretKey.trim(), actorId);
      if (!res.ok) return { ok: false, error: res.error };
    }

    if (input.webhookSecret && input.webhookSecret.trim().length > 0) {
      const res = await setSecretSetting(
        `stripe_webhook_secret_${currentMode}`,
        input.webhookSecret.trim(),
        actorId,
      );
      if (!res.ok) return { ok: false, error: res.error };
    }

    if (input.currency !== undefined) {
      await db.systemSetting.upsert({
        where: { key: "billing_currency" },
        update: { value: input.currency.toLowerCase(), isSecret: false, updatedById: actorId },
        create: { key: "billing_currency", value: input.currency.toLowerCase(), isSecret: false, updatedById: actorId },
      });
    }

    if (input.billingEnabled !== undefined) {
      await db.systemSetting.upsert({
        where: { key: "billing_enabled" },
        update: { value: input.billingEnabled, isSecret: false, updatedById: actorId },
        create: { key: "billing_enabled", value: input.billingEnabled, isSecret: false, updatedById: actorId },
      });
    }

    // Log admin activity
    await db.billingAuditLog.create({
      data: {
        actorId,
        action: "stripe_settings.updated",
        entityType: "system_settings",
        metadata: {
          mode: input.mode,
          currency: input.currency,
          billingEnabled: input.billingEnabled,
          secretKeyUpdated: Boolean(input.secretKey),
          webhookSecretUpdated: Boolean(input.webhookSecret),
        },
      },
    });

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update Stripe settings",
    };
  }
}
