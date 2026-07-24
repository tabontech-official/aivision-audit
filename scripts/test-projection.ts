/**
 * Verify plan projection: a FREE viewer must never receive premium check
 * detail (value/message/suggestion/evidence), while a PREMIUM viewer gets
 * everything. Runs against a real report's stored snapshot.
 * Run: npx tsx --import ./scripts/shims/register.mjs scripts/test-projection.ts <reportPublicId>
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { projectSnapshot } from "../src/services/reports/project-report";
import type { ReportSnapshotPayload } from "../src/services/reports/snapshot";

const db = new PrismaClient();

async function main() {
  const publicId = process.argv[2];
  if (!publicId) {
    console.error("Usage: ... test-projection.ts <reportPublicId>");
    process.exit(1);
  }
  const report = await db.report.findUnique({ where: { publicId } });
  if (!report) { console.error("Report not found"); process.exit(1); }
  const snap = await db.reportSnapshot.findUnique({ where: { reportId: report.id } });
  if (!snap) { console.error("No snapshot"); process.exit(1); }

  const payload = snap.payload as unknown as ReportSnapshotPayload;
  const free = projectSnapshot(payload, "FREE");
  const premium = projectSnapshot(payload, "PREMIUM");

  let failures = 0;
  const fail = (msg: string) => { console.log("FAIL " + msg); failures++; };
  const pass = (msg: string) => console.log("PASS " + msg);

  // 1. No PREMIUM-only detail leaks to a FREE viewer.
  //    Every locked check/section must carry NO value/message/suggestion/evidence.
  const serialized = JSON.stringify(free);
  for (const section of free.sections) {
    if (section.locked) {
      // locked section stub must not contain any 'checks' array
      if ("checks" in section) fail(`locked section ${section.name} leaked checks`);
      continue;
    }
    for (const check of section.checks) {
      if (check.locked) {
        // stub must only have name/description/severity/status — no detail keys
        const forbidden = ["actualValue", "message", "suggestion", "evidence", "expectedSummary"];
        const leaked = forbidden.filter((k) => k in check);
        if (leaked.length) fail(`locked check ${check.name} leaked: ${leaked.join(",")}`);
      }
    }
  }
  pass("free projection structural check complete");

  // 2. Count premium checks in the raw snapshot; they must all be locked/hidden for FREE
  let premiumChecksInSnapshot = 0;
  let premiumSectionsInSnapshot = 0;
  for (const s of payload.sections) {
    if (s.planAccess === "PREMIUM") premiumSectionsInSnapshot++;
    for (const c of s.checks) if (c.planAccess === "PREMIUM") premiumChecksInSnapshot++;
  }
  console.log(`  snapshot has ${premiumSectionsInSnapshot} premium sections, ${premiumChecksInSnapshot} premium checks`);

  // 3. For a specific premium check, confirm FREE gets a stub but PREMIUM gets the value.
  //    Find a premium check that has a real actualValue in the snapshot.
  //    Pick a DISTINCTIVE value (>= 8 chars, not purely numeric) so the
  //    substring test is meaningful — short values like "0" appear everywhere.
  let sampleName: string | null = null;
  let sampleValue: string | null = null;
  for (const s of payload.sections) {
    for (const c of s.checks) {
      if (
        c.planAccess === "PREMIUM" &&
        c.actualValue &&
        c.actualValue.length >= 8 &&
        !/^[\d.\s]+$/.test(c.actualValue)
      ) {
        sampleName = c.name; sampleValue = c.actualValue; break;
      }
    }
    if (sampleName) break;
  }
  if (sampleName && sampleValue) {
    if (serialized.includes(sampleValue)) {
      fail(`premium value "${sampleValue}" leaked into FREE payload for "${sampleName}"`);
    } else {
      pass(`premium value for "${sampleName}" (${sampleValue.slice(0, 30)}…) absent from FREE payload`);
    }
    const premiumHas = JSON.stringify(premium).includes(sampleValue);
    if (premiumHas) pass(`PREMIUM viewer receives value for "${sampleName}"`);
    else fail(`PREMIUM viewer MISSING value for "${sampleName}"`);
  } else {
    console.log("  (no distinctive premium value to sample — using message-leak check instead)");
  }

  // 3b. No premium check MESSAGE leaks into the FREE payload
  for (const s of payload.sections) {
    for (const c of s.checks) {
      if (c.planAccess === "PREMIUM" && c.message && c.message.length >= 12) {
        if (serialized.includes(c.message)) {
          fail(`premium message leaked into FREE payload: "${c.message.slice(0, 40)}…"`);
        }
      }
    }
  }
  pass("no premium messages present in FREE payload");

  // 4. hasLockedContent true for FREE, false for PREMIUM
  if (!free.hasLockedContent && (premiumChecksInSnapshot > 0 || premiumSectionsInSnapshot > 0))
    fail("FREE should report hasLockedContent=true");
  else pass(`FREE hasLockedContent=${free.hasLockedContent}, lockedSections=${free.lockedSectionCount}, lockedChecks=${free.lockedCheckCount}`);
  if (premium.hasLockedContent) fail("PREMIUM should have no locked content");
  else pass("PREMIUM hasLockedContent=false");

  // 5. Section/check counts sanity
  console.log(`\nFREE: ${free.sections.length} sections visible (${free.visiblePassed}P/${free.visibleWarning}W/${free.visibleFailed}F)`);
  console.log(`PREMIUM: ${premium.sections.length} sections visible (${premium.visiblePassed}P/${premium.visibleWarning}W/${premium.visibleFailed}F)`);

  if (failures) { console.error(`\n${failures} FAILURES`); process.exit(1); }
  console.log("\nAll projection security checks passed.");
}

main().finally(() => db.$disconnect());
