-- CreateEnum
CREATE TYPE "ReportPageType" AS ENUM ('HOME', 'PRODUCT', 'COLLECTION', 'BLOG');

-- AlterTable
ALTER TABLE "audit_fields" ADD COLUMN     "page_type" "ReportPageType" NOT NULL DEFAULT 'HOME';

-- CreateTable
CREATE TABLE "sampled_pages" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "page_type" "ReportPageType" NOT NULL,
    "url" TEXT NOT NULL,
    "http_status" INTEGER,
    "extracted" JSONB NOT NULL DEFAULT '{}',
    "html" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sampled_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sampled_pages_report_id_idx" ON "sampled_pages"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "sampled_pages_report_id_page_type_key" ON "sampled_pages"("report_id", "page_type");

-- AddForeignKey
ALTER TABLE "sampled_pages" ADD CONSTRAINT "sampled_pages_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
