/**
 * Table-driven test over EVERY row of the Fix Loop transition table (G.3)
 * plus every user action. This is the corruption-prone core of Phase 2 —
 * it must pass before reconciliation is allowed to touch user data.
 *
 * Run: npx tsx --conditions=react-server scripts/test-finding-transitions.ts
 */
import { applyTransition, applyUserAction, type TransitionResult, type UserAction } from "../src/services/findings/transitions";
import type { CheckStatus, FindingState } from "@prisma/client";

type Row = {
  observed: CheckStatus;
  prior: FindingState | null;
  expect: TransitionResult;
};

const V = (state: FindingState): TransitionResult => ({ action: "set", state });
const KEEP: TransitionResult = { action: "keep" };
const NONE: TransitionResult = { action: "none" };
const CREATE: TransitionResult = { action: "create" };

const ALL_STATES: FindingState[] = [
  "OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "MARKED_FIXED", "VERIFIED_FIXED",
  "STILL_FAILING", "REGRESSED", "WONT_FIX", "FALSE_POSITIVE",
];

/* ---- the G.3 table, row by row, verbatim ---- */
const ROWS: Row[] = [
  // PASS
  { observed: "PASS", prior: null, expect: NONE },
  { observed: "PASS", prior: "OPEN", expect: V("VERIFIED_FIXED") },
  { observed: "PASS", prior: "ACKNOWLEDGED", expect: V("VERIFIED_FIXED") },
  { observed: "PASS", prior: "IN_PROGRESS", expect: V("VERIFIED_FIXED") },
  { observed: "PASS", prior: "MARKED_FIXED", expect: V("VERIFIED_FIXED") },
  { observed: "PASS", prior: "STILL_FAILING", expect: V("VERIFIED_FIXED") },
  { observed: "PASS", prior: "REGRESSED", expect: V("VERIFIED_FIXED") },
  { observed: "PASS", prior: "VERIFIED_FIXED", expect: KEEP },
  { observed: "PASS", prior: "WONT_FIX", expect: V("VERIFIED_FIXED") }, // fixed anyway
  { observed: "PASS", prior: "FALSE_POSITIVE", expect: KEEP }, // respect the user

  // FAIL
  { observed: "FAIL", prior: null, expect: CREATE },
  { observed: "FAIL", prior: "OPEN", expect: KEEP },
  { observed: "FAIL", prior: "ACKNOWLEDGED", expect: KEEP },
  { observed: "FAIL", prior: "IN_PROGRESS", expect: KEEP },
  { observed: "FAIL", prior: "MARKED_FIXED", expect: V("STILL_FAILING") },
  { observed: "FAIL", prior: "VERIFIED_FIXED", expect: V("REGRESSED") },
  { observed: "FAIL", prior: "REGRESSED", expect: KEEP },
  { observed: "FAIL", prior: "STILL_FAILING", expect: KEEP },
  { observed: "FAIL", prior: "WONT_FIX", expect: KEEP },
  { observed: "FAIL", prior: "FALSE_POSITIVE", expect: KEEP },

  // WARNING — identical to FAIL
  { observed: "WARNING", prior: null, expect: CREATE },
  { observed: "WARNING", prior: "OPEN", expect: KEEP },
  { observed: "WARNING", prior: "ACKNOWLEDGED", expect: KEEP },
  { observed: "WARNING", prior: "IN_PROGRESS", expect: KEEP },
  { observed: "WARNING", prior: "MARKED_FIXED", expect: V("STILL_FAILING") },
  { observed: "WARNING", prior: "VERIFIED_FIXED", expect: V("REGRESSED") },
  { observed: "WARNING", prior: "REGRESSED", expect: KEEP },
  { observed: "WARNING", prior: "STILL_FAILING", expect: KEEP },
  { observed: "WARNING", prior: "WONT_FIX", expect: KEEP },
  { observed: "WARNING", prior: "FALSE_POSITIVE", expect: KEEP },
];

// NOT_APPLICABLE / ERROR / INFO: never touch, never create — across EVERY prior state.
for (const observed of ["NOT_APPLICABLE", "ERROR", "INFO"] as CheckStatus[]) {
  ROWS.push({ observed, prior: null, expect: NONE });
  for (const prior of ALL_STATES) ROWS.push({ observed, prior, expect: KEEP });
}

/* ---- user actions (§2.6): allowed moves AND rejections ---- */
type ActionRow = { action: UserAction; from: FindingState; allowed: boolean; to?: FindingState };
const ACTION_ROWS: ActionRow[] = [];
const ALLOWED: Record<UserAction, { from: FindingState[]; to: FindingState }> = {
  acknowledge: { from: ["OPEN"], to: "ACKNOWLEDGED" },
  start_work: { from: ["OPEN", "ACKNOWLEDGED"], to: "IN_PROGRESS" },
  mark_fixed: { from: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "STILL_FAILING", "REGRESSED"], to: "MARKED_FIXED" },
  wont_fix: { from: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "MARKED_FIXED", "STILL_FAILING", "REGRESSED"], to: "WONT_FIX" },
  false_positive: { from: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "MARKED_FIXED", "STILL_FAILING", "REGRESSED"], to: "FALSE_POSITIVE" },
  reopen: { from: ["WONT_FIX", "FALSE_POSITIVE", "VERIFIED_FIXED"], to: "OPEN" },
};
for (const [action, rule] of Object.entries(ALLOWED) as Array<[UserAction, { from: FindingState[]; to: FindingState }]>) {
  for (const state of ALL_STATES) {
    const allowed = rule.from.includes(state);
    ACTION_ROWS.push({ action, from: state, allowed, to: allowed ? rule.to : undefined });
  }
}

/* ---- run ---- */
let failures = 0;

for (const row of ROWS) {
  const got = applyTransition(row.observed, row.prior);
  const pass = JSON.stringify(got) === JSON.stringify(row.expect);
  if (!pass) {
    failures++;
    console.error(
      `FAIL engine: ${row.observed} + ${row.prior ?? "(none)"} → got ${JSON.stringify(got)}, want ${JSON.stringify(row.expect)}`,
    );
  }
}

for (const row of ACTION_ROWS) {
  const got = applyUserAction(row.action, row.from);
  const pass = row.allowed ? got.ok && got.state === row.to : !got.ok;
  if (!pass) {
    failures++;
    console.error(
      `FAIL action: ${row.action} from ${row.from} → got ${JSON.stringify(got)}, want ${row.allowed ? `→ ${row.to}` : "rejection"}`,
    );
  }
}

const total = ROWS.length + ACTION_ROWS.length;
if (failures > 0) {
  console.error(`\n${failures}/${total} transition cases FAILED`);
  process.exit(1);
}
console.log(`OK — ${ROWS.length} engine transitions + ${ACTION_ROWS.length} user-action cases all pass (${total} total).`);
