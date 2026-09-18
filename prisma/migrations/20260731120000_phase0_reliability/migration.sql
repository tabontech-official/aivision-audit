-- CreateEnum
CREATE TYPE "FailureCategory" AS ENUM ('SYSTEM', 'USER_INPUT', 'TARGET_SITE');

-- AlterTable
ALTER TABLE "report_snapshots" ADD COLUMN     "score_basis" JSONB;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "failure_category" "FailureCategory",
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0;

