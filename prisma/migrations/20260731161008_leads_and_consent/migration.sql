-- AlterTable
ALTER TABLE "users" ADD COLUMN     "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketing_consent_at" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "website_url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "consent_at" TIMESTAMPTZ,
    "consent_ip_hash" TEXT,
    "source" TEXT,
    "platform" TEXT,
    "theme_name" TEXT,
    "app_count" INTEGER,
    "plus_likelihood" TEXT,
    "anonymous_session_id" UUID,
    "first_report_id" UUID,
    "converted_user_id" UUID,
    "converted_at" TIMESTAMPTZ,
    "unsubscribed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_domain_idx" ON "leads"("domain");

-- CreateIndex
CREATE INDEX "leads_converted_user_id_idx" ON "leads"("converted_user_id");

-- CreateIndex
CREATE INDEX "leads_platform_idx" ON "leads"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_domain_key" ON "leads"("email", "domain");
