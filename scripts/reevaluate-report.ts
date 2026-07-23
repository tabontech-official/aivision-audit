/**
 * Re-evaluate an existing report against its pinned template version using
 * stored raw data — no re-crawl, no PSI re-spend.
 * Run: npx tsx --import ./scripts/shims/register.mjs scripts/reevaluate-report.ts <reportPublicId>
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { evaluateReport } from "../src/services/reports/evaluate-report";
import { buildAndStoreSnapshot } from "../src/services/reports/snapshot";

const db = new PrismaClient();

async function main() {
  const publicId = process.argv[2];
  if (!publicId) {
    console.error("Usage: npx tsx --import ./scripts/shims/register.mjs scripts/reevaluate-report.ts <reportPublicId>");
    process.exit(1);
  }

  const report = await db.report.findUnique({ where: { publicId } });
  if (!report) {
    console.error("Report not found");
    process.exit(1);
  }

  const summary = await evaluateReport(report.id);
  await buildAndStoreSnapshot(report.id);

  await db.report.update({
    where: { id: report.id },
    data: {
      overallScore: summary.overallScore,
      grade: summary.grade,
      passedCount: summary.passedCount,
      failedCount: summary.failedCount,
      warningCount: summary.warningCount,
      criticalIssueCount: summary.criticalIssueCount,
    },
  });

  console.log("Re-evaluated:", summary);
}

main().finally(() => db.$disconnect());
