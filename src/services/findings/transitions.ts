import "server-only";
import type { CheckStatus, FindingState } from "@prisma/client";

/**
 * The Fix Loop transition table (Phase 2, G.3 — final, INFO removed).
 *
 * Pure function: given what the engine observed this run and the finding's
 * prior state, return what happens. This is the single most corruption-prone
 * spot in the feature — a subtle bug here silently rots user data over weeks —
 * so it is a table, it is pure, and `scripts/test-finding-transitions.ts`
 * exercises every row before anything wires it to the pipeline.
 *
 * The most important rule: NOT_APPLICABLE and ERROR mean *we could not
 * measure this*, not *this is fine*. Missing data never touches a finding and
 * never creates one — a Shopify check on a site that migrated to WordPress
 * goes stale (§2.4), it does not go "fixed".
 *
 * INFO does not appear: it is unreachable at check level (it exists only as a
 * section-rollup default), so reconciliation never sees it. `applyTransition`
 * treats it like missing data if it ever arrives — the conservative reading.
 */

export type TransitionResult =
  | { action: "none" } // no finding exists and none should be created
  | { action: "create" } // FAIL/WARNING with no prior finding → OPEN
  | { action: "keep" } // finding exists; state unchanged (lastSeen refreshes)
  | { action: "set"; state: FindingState }; // finding exists; state moves

const OPEN_FAMILY: ReadonlySet<FindingState> = new Set([
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
] as FindingState[]);

export function applyTransition(
  observed: CheckStatus,
  prior: FindingState | null,
): TransitionResult {
  /* ---- missing data: never touch, never create ---- */
  if (observed === "NOT_APPLICABLE" || observed === "ERROR" || observed === "INFO") {
    return prior === null ? { action: "none" } : { action: "keep" };
  }

  /* ---- PASS ---- */
  if (observed === "PASS") {
    if (prior === null) return { action: "none" };
    // Respect the user's dispute — a FALSE_POSITIVE stays theirs to reopen.
    if (prior === "FALSE_POSITIVE") return { action: "keep" };
    if (prior === "VERIFIED_FIXED") return { action: "keep" };
    // OPEN/ACKNOWLEDGED/IN_PROGRESS/MARKED_FIXED/STILL_FAILING/REGRESSED/WONT_FIX
    // all verify as fixed — including WONT_FIX (fixed anyway).
    return { action: "set", state: "VERIFIED_FIXED" };
  }

  /* ---- FAIL / WARNING ---- */
  if (prior === null) return { action: "create" };
  if (OPEN_FAMILY.has(prior)) return { action: "keep" };
  if (prior === "MARKED_FIXED") return { action: "set", state: "STILL_FAILING" };
  if (prior === "VERIFIED_FIXED") return { action: "set", state: "REGRESSED" };
  // REGRESSED / STILL_FAILING / WONT_FIX / FALSE_POSITIVE stay put.
  return { action: "keep" };
}

/* ------------------------------------------------------------------ */
/* User actions (§2.6) — which state moves a user may perform          */
/* ------------------------------------------------------------------ */

export type UserAction =
  | "acknowledge"
  | "start_work"
  | "mark_fixed"
  | "wont_fix"
  | "false_positive"
  | "reopen";

const USER_TRANSITIONS: Record<UserAction, { from: ReadonlySet<FindingState>; to: FindingState }> = {
  acknowledge: { from: new Set(["OPEN"] as FindingState[]), to: "ACKNOWLEDGED" },
  start_work: { from: new Set(["OPEN", "ACKNOWLEDGED"] as FindingState[]), to: "IN_PROGRESS" },
  mark_fixed: {
    from: new Set(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "STILL_FAILING", "REGRESSED"] as FindingState[]),
    to: "MARKED_FIXED",
  },
  wont_fix: {
    from: new Set(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "MARKED_FIXED", "STILL_FAILING", "REGRESSED"] as FindingState[]),
    to: "WONT_FIX",
  },
  false_positive: {
    from: new Set(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "MARKED_FIXED", "STILL_FAILING", "REGRESSED"] as FindingState[]),
    to: "FALSE_POSITIVE",
  },
  reopen: {
    from: new Set(["WONT_FIX", "FALSE_POSITIVE", "VERIFIED_FIXED"] as FindingState[]),
    to: "OPEN",
  },
};

export function applyUserAction(
  action: UserAction,
  prior: FindingState,
): { ok: true; state: FindingState } | { ok: false; error: string } {
  const rule = USER_TRANSITIONS[action];
  if (!rule.from.has(prior)) {
    return { ok: false, error: `Cannot ${action.replace("_", " ")} a finding in state ${prior}.` };
  }
  return { ok: true, state: rule.to };
}

/** States a user may still act on — the Fix List's default filter. */
export const OPEN_FILTER_STATES: FindingState[] = [
  "OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "STILL_FAILING", "REGRESSED",
];

/** Suppressed states — excluded from scoring like NOT_APPLICABLE. */
export const SUPPRESSED_STATES: FindingState[] = ["WONT_FIX", "FALSE_POSITIVE"];
