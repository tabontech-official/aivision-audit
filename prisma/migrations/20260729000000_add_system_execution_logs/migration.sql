-- History repair: this table and enum were applied to the database with
-- `prisma db push` before a migration existed for them. The SQL below matches
-- the live schema exactly and is recorded as already-applied via
-- `prisma migrate resolve --applied`, so migration history and the database
-- agree again without touching any data.

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'DEBUG');

-- CreateTable
CREATE TABLE "system_execution_logs" (
    "id" UUID NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "report_id" UUID,
    "website_url" TEXT,
    "stage" TEXT,
    "duration_ms" INTEGER,
    "meta" JSONB,
    "stack_trace" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_execution_logs_level_idx" ON "system_execution_logs"("level");
CREATE INDEX "system_execution_logs_category_idx" ON "system_execution_logs"("category");
CREATE INDEX "system_execution_logs_report_id_idx" ON "system_execution_logs"("report_id");
CREATE INDEX "system_execution_logs_created_at_idx" ON "system_execution_logs"("created_at");
