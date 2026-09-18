-- CreateEnum
CREATE TYPE "ReportPillar" AS ENUM ('FOUNDATIONS', 'SPEED_VITALS', 'ONPAGE_CONTENT', 'AI_ANSWER_ENGINES', 'TRUST_COMPLIANCE', 'CONVERSION_UX');

-- CreateEnum
CREATE TYPE "FindingState" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'MARKED_FIXED', 'VERIFIED_FIXED', 'STILL_FAILING', 'REGRESSED', 'WONT_FIX', 'FALSE_POSITIVE');

-- CreateEnum
CREATE TYPE "FindingActor" AS ENUM ('ENGINE', 'USER');

-- CreateEnum
CREATE TYPE "AuditSchedule" AS ENUM ('NONE', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "audit_results" ADD COLUMN     "finding_id" UUID,
ADD COLUMN     "suppressed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "report_sections" ADD COLUMN     "pillar" "ReportPillar" NOT NULL DEFAULT 'FOUNDATIONS';

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "findings_reconciled_at" TIMESTAMPTZ,
ADD COLUMN     "previous_report_id" UUID,
ADD COLUMN     "score_delta" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "audit_emails_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "websites" ADD COLUMN     "audit_schedule" "AuditSchedule" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "schedule_skip_notified_at" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "findings" (
    "id" UUID NOT NULL,
    "website_id" UUID NOT NULL,
    "identity_hash" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "page_url" TEXT NOT NULL,
    "section_slug" TEXT NOT NULL,
    "section_name" TEXT NOT NULL,
    "check_name" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "pillar" "ReportPillar" NOT NULL DEFAULT 'FOUNDATIONS',
    "state" "FindingState" NOT NULL DEFAULT 'OPEN',
    "user_note" TEXT,
    "first_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,
    "stale_since" TIMESTAMPTZ,
    "last_report_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finding_events" (
    "id" UUID NOT NULL,
    "finding_id" UUID NOT NULL,
    "report_id" UUID,
    "check_status" "CheckStatus",
    "state_before" "FindingState",
    "state_after" "FindingState" NOT NULL,
    "actor" "FindingActor" NOT NULL,
    "user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finding_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "findings_website_id_state_idx" ON "findings"("website_id", "state");

-- CreateIndex
CREATE INDEX "findings_website_id_severity_idx" ON "findings"("website_id", "severity");

-- CreateIndex
CREATE INDEX "findings_website_id_stale_since_idx" ON "findings"("website_id", "stale_since");

-- CreateIndex
CREATE UNIQUE INDEX "findings_website_id_identity_hash_key" ON "findings"("website_id", "identity_hash");

-- CreateIndex
CREATE INDEX "finding_events_finding_id_created_at_idx" ON "finding_events"("finding_id", "created_at");

-- CreateIndex
CREATE INDEX "finding_events_report_id_idx" ON "finding_events"("report_id");

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_events" ADD CONSTRAINT "finding_events_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finding_events" ADD CONSTRAINT "finding_events_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ------------------------------------------------------------------
-- Part F: explicit pillar mapping for existing sections, by slug across
-- every template version (soft-deleted rows included — harmless, and a
-- restored section keeps the right pillar). Only genuinely new sections
-- take the FOUNDATIONS default.
-- ------------------------------------------------------------------
UPDATE "report_sections" SET "pillar" = 'SPEED_VITALS'      WHERE "slug" IN ('page-speed', 'shopify-performance', 'shopify-speed-apps');
UPDATE "report_sections" SET "pillar" = 'ONPAGE_CONTENT'    WHERE "slug" = 'seo';
UPDATE "report_sections" SET "pillar" = 'FOUNDATIONS'       WHERE "slug" IN ('technical-seo', 'shopify-url-hygiene');
UPDATE "report_sections" SET "pillar" = 'CONVERSION_UX'     WHERE "slug" IN ('accessibility', 'mobile', 'cro');
UPDATE "report_sections" SET "pillar" = 'TRUST_COMPLIANCE'  WHERE "slug" IN ('security', 'shopify-policies');
UPDATE "report_sections" SET "pillar" = 'AI_ANSWER_ENGINES' WHERE "slug" IN ('ai-discoverability', 'shopify-product-readiness');
