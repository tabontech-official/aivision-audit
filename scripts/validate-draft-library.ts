/**
 * Part C acceptance harness (roadmap §5.3/§5.4).
 *
 * Runs the REAL pipeline against the DRAFT template version for each required
 * site type — Liquid Shopify homepage, Shopify product page, Hydrogen
 * storefront, non-Shopify — then reports every check's outcome so the publish
 * gate can be judged on evidence rather than hope:
 *
 *   ERROR          → misconfiguration; MUST be zero before publishing
 *   NOT_APPLICABLE → correct on a gated/irrelevant page (never a false FAIL)
 *   PASS/FAIL/WARN → the check actually fired
 *
 * Creates throwaway websites/reports pinned to the draft and deletes them.
 * Run: npx tsx --conditions=react-server scripts/validate-draft-library.ts
 */
import { nanoid } from "nanoid";
import { db } from "../src/lib/db/client";
import { runAudit } from "../src/services/jobs/run-audit";
import { ensureDraftVersion } from "../src/services/builder/draft";
import type { ExtractedData } from "../src/services/inspection/types";

const TARGETS = [
  { label: "Shopify Liquid (home)", url: "https://www.deathwishcoffee.com" },
  { label: "Product page + schema", url: "https://www.deathwishcoffee.com/products/death-wish-coffee" },
  // A real product page that genuinely publishes NO Product JSON-LD — the
  // case that must FAIL rather than resolve silently NOT_APPLICABLE.
  { label: "Product page, no schema", url: "https://www.deathwishcoffee.com/products/death-wish-ground-coffee" },
  { label: "Hydrogen storefront", url: "https://hydrogen.shop" },
  { label: "Non-Shopify (WordPress)", url: "https://techcrunch.com" },
];

type CheckRow = {
  section: string;
  gated: boolean;
  fieldKey: string;
  name: string;
  status: string;
  value: string | null;
  expected: string | null;
};

async function auditAgainstDraft(url: string, draftId: string, userId: string) {
  const website = await db.website.create({
    data: { url, domain: new URL(url).hostname, userId },
  });
  const report = await db.report.create({
    data: {
      publicId: nanoid(21), websiteId: website.id, userId,
      templateVersionId: draftId, status: "QUEUED", currentStage: "CONNECTING",
      planAtGeneration: "PREMIUM",
    },
  });
  await runAudit(report.id);

  const done = await db.report.findUniqueOrThrow({
    where: { id: report.id },
    include: { rawData: { select: { extracted: true } } },
  });
  const results = await db.auditResult.findMany({
    where: { reportId: report.id },
    include: { field: { include: { section: true } } },
  });

  const rows: CheckRow[] = results.map((r) => ({
    section: r.field.section.slug,
    gated: r.field.section.appliesWhen !== null || r.field.appliesWhen !== null,
    fieldKey: r.field.fieldKey,
    name: r.field.name,
    status: r.status,
    value: r.actualValue,
    expected: r.expectedSummary,
  }));

  const site = (done.rawData?.extracted as unknown as ExtractedData | null)?.site ?? null;

  return { website, report: done, rows, site };
}

async function main() {
  const admin = await db.user.findFirstOrThrow({ where: { role: "MASTER_ADMIN" } });
  const draft = await ensureDraftVersion();
  if (!draft) throw new Error("no draft version");
  console.log(`Validating DRAFT v${draft.versionNumber} (${draft.status})\n`);

  const cleanup: string[] = [];
  const all: Array<{ label: string; rows: CheckRow[]; score: number | null; platform: string | null; status: string }> = [];

  try {
    for (const target of TARGETS) {
      process.stdout.write(`→ ${target.label.padEnd(26)} ${target.url}\n`);
      const { website, report, rows, site } = await auditAgainstDraft(target.url, draft.id, admin.id);
      cleanup.push(website.id);
      all.push({
        label: target.label, rows,
        score: report.overallScore, platform: site?.platform ?? null, status: report.status,
      });
      const errors = rows.filter((r) => r.status === "ERROR");
      console.log(
        `   ${report.status} score=${report.overallScore ?? "—"} platform=${site?.platform ?? "?"} ` +
        `checks=${rows.length} ERROR=${errors.length} N/A=${rows.filter((r) => r.status === "NOT_APPLICABLE").length}\n`,
      );
    }

    /* ---------------- report ---------------- */
    console.log("=".repeat(78));
    console.log("PUBLISH GATE — per-check outcomes\n");

    const everyKey = new Map<string, { name: string; section: string; gated: boolean; byTarget: Record<string, string> }>();
    for (const run of all) {
      for (const row of run.rows) {
        const entry = everyKey.get(row.fieldKey) ?? {
          name: row.name, section: row.section, gated: row.gated, byTarget: {},
        };
        entry.byTarget[run.label] = row.status;
        everyKey.set(row.fieldKey, entry);
      }
    }

    const short = (s: string) =>
      ({ PASS: "PASS", FAIL: "FAIL", WARNING: "WARN", NOT_APPLICABLE: "n/a", ERROR: "ERR!" })[s] ?? s;

    let currentSection = "";
    for (const [key, entry] of [...everyKey.entries()].sort((a, b) =>
      a[1].section.localeCompare(b[1].section) || a[0].localeCompare(b[0]),
    )) {
      if (entry.section !== currentSection) {
        currentSection = entry.section;
        console.log(`\n[${currentSection}]${entry.gated ? " (gated)" : ""}`);
      }
      const cells = TARGETS.map((t) => short(entry.byTarget[t.label] ?? "—").padEnd(5)).join("");
      console.log(`  ${cells} ${key}`);
    }
    console.log(`\n  columns: ${TARGETS.map((t) => t.label).join(" | ")}\n`);

    /* ---------------- verdicts ---------------- */
    console.log("=".repeat(78));
    const errorChecks = [...everyKey.entries()].filter(([, e]) =>
      Object.values(e.byTarget).some((s) => s === "ERROR"),
    );
    const neverFired = [...everyKey.entries()].filter(([, e]) =>
      Object.values(e.byTarget).every((s) => s === "NOT_APPLICABLE"),
    );
    const shopifyRun = all.find((r) => r.label === "Shopify Liquid (home)");
    const wpRun = all.find((r) => r.label.startsWith("Non-Shopify"));
    const falseFailuresOnWp = wpRun
      ? wpRun.rows.filter((r) => r.gated && (r.status === "FAIL" || r.status === "WARNING"))
      : [];

    console.log(`ERROR (misconfigured — must be 0 to publish): ${errorChecks.length}`);
    for (const [key, e] of errorChecks) console.log(`   ${key} — ${e.name}`);
    console.log(`\nNever fired on ANY target (always N/A): ${neverFired.length}`);
    for (const [key] of neverFired) console.log(`   ${key}`);
    console.log(`\nGated checks that FAILED/WARNED on the non-Shopify site (must be 0): ${falseFailuresOnWp.length}`);
    for (const r of falseFailuresOnWp) console.log(`   ${r.fieldKey}`);
    console.log(
      `\nShopify homepage fired: ${shopifyRun ? shopifyRun.rows.filter((r) => ["PASS", "FAIL", "WARNING"].includes(r.status)).length : 0}/${shopifyRun?.rows.length ?? 0} checks`,
    );
  } finally {
    for (const id of cleanup) {
      const reports = await db.report.findMany({ where: { websiteId: id }, select: { id: true } });
      await db.funnelEvent.deleteMany({ where: { reportId: { in: reports.map((r) => r.id) } } });
      await db.website.delete({ where: { id } }).catch(() => undefined);
    }
    console.log("\ncleanup: throwaway websites/reports/findings removed");
    await db.$disconnect();
  }
}

main().catch(async (e) => {
  console.error("FAILED:", e);
  await db.$disconnect();
  process.exit(1);
});
