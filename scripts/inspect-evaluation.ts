/**
 * Print the full evaluated report: overall score/grade, per-section scores,
 * and each check's status/value/message. Verifies the Phase 6 engine output.
 * Run: npx tsx scripts/inspect-evaluation.ts <reportPublicId>
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const publicId = process.argv[2];
  if (!publicId) {
    console.error("Usage: npx tsx scripts/inspect-evaluation.ts <reportPublicId>");
    process.exit(1);
  }

  const report = await db.report.findUnique({
    where: { publicId },
    include: {
      website: { select: { domain: true } },
      sectionResults: {
        include: {
          section: { select: { name: true, planAccess: true, weight: true } },
          results: {
            include: { field: { select: { name: true, planAccess: true } } },
          },
        },
      },
      snapshot: true,
    },
  });
  if (!report) {
    console.error("Report not found");
    process.exit(1);
  }

  console.log("=== REPORT ===");
  console.log({
    status: report.status,
    domain: report.website.domain,
    overallScore: report.overallScore,
    grade: report.grade,
    mobileScore: report.mobileScore,
    desktopScore: report.desktopScore,
    passed: report.passedCount,
    failed: report.failedCount,
    warnings: report.warningCount,
    criticalIssues: report.criticalIssueCount,
    hasSnapshot: !!report.snapshot,
  });

  console.log("\n=== SECTIONS ===");
  for (const sr of report.sectionResults.sort(
    (a, b) => (b.section.weight ?? 0) - (a.section.weight ?? 0),
  )) {
    console.log(
      `\n▸ ${sr.section.name} [${sr.section.planAccess}] — score ${sr.score ?? "—"}/100 · ${sr.status} · ${sr.summary}`,
    );
    for (const r of sr.results) {
      const qw = r.isQuickWin ? " ⚡quickwin" : "";
      const val = r.actualValue !== null ? ` (${String(r.actualValue).slice(0, 40)})` : "";
      console.log(
        `   ${r.status.padEnd(14)} ${r.field.name}${val} [${r.field.planAccess}]${qw}`,
      );
      if (r.renderedMessage) console.log(`       → ${r.renderedMessage.slice(0, 100)}`);
    }
  }

  // Snapshot sanity
  const payload = report.snapshot?.payload as
    | { sections?: Array<{ checks?: unknown[] }> }
    | undefined;
  const snapChecks = payload?.sections?.reduce((n, s) => n + (s.checks?.length ?? 0), 0) ?? 0;
  console.log(`\n=== SNAPSHOT ===\nsections=${payload?.sections?.length ?? 0} checks=${snapChecks}`);
}

main().finally(() => db.$disconnect());
