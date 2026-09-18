# AuditFlow — Complete ChatGPT Exploration Handoff

**Prepared:** 2026-07-31  
**Repository:** `D:\SoftwareDevelopment\aivision-audit`  
**Purpose:** Give ChatGPT enough verified context to explore product strategy,
architecture, check-library design, scoring, growth, and the next build phases
without guessing what has already been implemented.

This is a self-contained briefing. The repository also contains the deeper
technical reference `docs/AI-CONTEXT.md`, the phase tracker
`docs/BUILD-ROADMAP.md`, and the current importable check library
`docs/shopify-check-library.json`.

---

## 1. Instructions for the ChatGPT reviewing this document

Treat the following as fixed unless you explicitly recommend revisiting a
decision and explain the tradeoff:

1. The real repository and verified live behaviour outrank older prompt text.
2. The product is now a **Shopify store auditor with a useful universal
   fallback**, not a generic website-audit product.
3. The landing form is URL-only. The older plan requiring email before starting
   an audit was superseded by the progressive lead-capture decision in Part D.
4. Shopify platform detection and conditional applicability are implemented
   prerequisites, even though an older build specification called them out of
   scope.
5. Parts D and E are complete. The immediate work is finishing, importing, and
   validating Part C, the Shopify check library.
6. The current 33-check JSON is a first tranche, not the entirety of the
   desired Part C coverage.
7. Multi-page sampling is deliberately deferred until after the Fix Loop. Do
   not solve homepage-only limitations by inventing observations.
8. Recommendations must preserve server-side plan gating, SSRF protection,
   immutable reports, template pinning, builder import/export, and the
   absent-path `NOT_APPLICABLE` rule.

When suggesting next work, separate it into:

- checks possible with existing snapshot data;
- checks needing additional single-page extraction;
- checks requiring multi-page sampling or a data-model change;
- product/marketing experiments rather than engineering requirements.

Do not call a weak proxy an exact measurement. For example, counting links
containing `?variant=` is not the same as proving that every variant URL has the
correct canonical.

---

## 2. Product in one page

AuditFlow is a freemium SaaS that audits a storefront, produces a scored report,
and is intended to evolve into a persistent issue-tracking workflow.

The current positioning is:

> Free Shopify Store Audit — find what is slowing the store down, hurting
> search visibility, weakening product data, or costing conversions, with fixes
> that name the Shopify setting or theme file to change.

The business goals, in order, are:

1. Generate qualified leads: a merchant supplies a store URL and later an email
   after seeing that a real audit is underway.
2. Deliver enough immediate value to earn signup and report unlock.
3. Create retention through the future Fix Loop: persistent findings,
   verification, regressions, comparisons, and scheduled re-audits.
4. Monetize through plan limits and premium report content without degrading
   the usefulness of the free result.

The key differentiation is platform-aware remediation. Generic tools say “add
a meta description.” AuditFlow should say “Products > product > Search engine
listing > Edit,” or identify the responsible Liquid theme file when code is
required.

Non-Shopify sites are not rejected. They receive universal SEO, speed,
accessibility, security, conversion, and AI-readiness checks. Shopify-only
sections are excluded honestly rather than lowering the score.

---

## 3. Technology and architectural boundaries

The application uses:

- Next.js 15 App Router and React 19;
- TypeScript;
- Prisma 6 with PostgreSQL/Neon;
- Auth.js credentials authentication;
- Tailwind CSS;
- QStash-compatible job dispatch with safe failure behaviour;
- Google PageSpeed Insights;
- Playwright Core for selective rendering;
- Resend for transactional email;
- Zod as the configuration/input validation source of truth.

Important boundaries:

- Server business logic lives under `src/services/**` and begins with
  `import "server-only"`.
- Zod schemas in `src/lib/validation/**` define accepted inputs and builder
  configuration.
- Page/server-action files orchestrate; they should not absorb service logic.
- Admin actions re-check authorization and write admin activity logs.
- Pipeline operations write best-effort execution logs.
- Meaningful Prisma transactions use explicit timeouts.
- Deletion is normally soft deletion with `deletedAt`.
- Client-facing server actions return discriminated `{ ok: ... }` results.

Core source areas:

| Area | Primary files |
|---|---|
| Audit intake | `src/app/api/audits/route.ts`, `src/services/audits/create.ts`, `src/services/audits/allowance.ts` |
| Durable execution | `src/services/jobs/enqueue.ts`, `src/services/jobs/run-audit.ts`, `src/services/jobs/reap.ts` |
| Fetch/render security | `src/services/inspection/fetcher.ts`, `src/lib/security/ssrf.ts`, `src/services/inspection/renderer.ts` |
| Extraction | `src/services/inspection/extract-html.ts`, `aux-checks.ts`, `detect-platform.ts`, `types.ts` |
| Criteria engine | `src/services/criteria/extract-value.ts`, `evaluate.ts`, `run-check.ts` |
| Evaluation/snapshot | `src/services/reports/evaluate-report.ts`, `snapshot.ts`, `evidence.ts` |
| Report projection/access | `src/services/reports/project-report.ts`, `access.ts` |
| Builder | `src/app/master-admin/builder/**`, `src/services/builder/import-export.ts`, `src/lib/validation/builder.ts` |
| Leads/funnel | `src/services/leads/**`, `src/app/api/leads/capture/route.ts`, `src/app/master-admin/leads/**` |
| Configuration/logs | `src/services/settings/**`, `src/services/system-log/log.ts`, `src/app/master-admin/dev/**` |

---

## 4. What has been completed

### 4.1 Original platform foundation

Already working before the Shopify pivot:

- Authentication and role-based admin access.
- User and plan management.
- Report template/version model.
- Builder CRUD for sections, fields, criteria, suggestions, ordering,
  duplication, enable/disable, and soft deletion.
- Publishing freezes one template version and creates a new draft.
- Reports stay pinned to the template version used when the audit started.
- Builder JSON import/export with merge-on-duplicate and lossless round trips.
- Audit intake, staged progress, static page fetch, optional rendering,
  PageSpeed collection, evaluation, snapshotting, and report display.
- Anonymous-session ownership and report claiming after signup.
- Server-side free/premium report projection.
- Master Admin settings, users, logs, and Pipeline Console.

### 4.2 Phase 0 — reliability and configuration

Completed and live-verified:

- Silent fire-and-forget serverless fallback was removed. Dispatch failure is
  terminal, logged, classified, and does not consume an allowance when it is a
  system fault.
- Reports carry a failure category that separates system faults, user-input
  faults, and target-site faults.
- A watchdog reaps processing reports older than 15 minutes and automatically
  retries once.
- The long `GENERATING_REPORT` operation uses an unpooled database connection.
- Report snapshots store `scoreBasis`, including coverage and excluded
  sections, so partial reports disclose when their score omits PageSpeed or
  another unavailable section.
- PageSpeed keys are managed database-first in Master Admin, activate without a
  redeploy, are masked in the browser, testable, and can fall back to the
  environment.
- Secret settings are encrypted at rest with AES-256-GCM.
- The Pipeline Console reports dispatch, PageSpeed, rendering, and operational
  health information.

### 4.3 B.10 — render-cost decision

The original implementation attempted headless rendering too broadly and could
silently have no browser binary available.

The completed design now:

- scores the static response before deciding whether a browser is needed;
- avoids rendering server-rendered pages;
- favors rendering probable shells, Hydrogen/Remix experiences, and pages where
  static extraction is implausibly empty;
- includes a safety valve that renders when the initial extraction would
  otherwise produce a nearly blank report;
- checks browser availability and logs loudly when the executable is missing;
- surfaces browser mode/availability in the Pipeline Console;
- keeps opportunistic screenshots for later report, PDF, and lead surfaces.

The measured study eliminated approximately 85% of launches in the sample.
Details are in `docs/RENDER-STUDY.md`.

### 4.4 Part A — Shopify detection and applicability

Completed and live-verified:

- `detect-platform.ts` detects Shopify, Hydrogen, WordPress, WooCommerce,
  Webflow, Wix, Squarespace, Next.js, or Unknown using existing HTML, headers,
  robots, and sitemap signals.
- Detection is cheap and non-fatal. A failure produces Unknown rather than
  failing the audit.
- Shopify theme name/ID and official-theme status are captured when visible.
- Third-party app script hosts, recognized app names, total host count, and
  parser-blocking app script count are captured.
- Shopify Plus is never asserted. Only weak `possible` or `unknown` likelihood
  is stored.
- `appliesWhen` exists on report sections and individual fields.
- Applicability uses the same sandboxed JsonLogic subset as
  `RULES_EVALUATOR`.
- A false gate produces `NOT_APPLICABLE` and is excluded from score numerator
  and denominator.
- A malformed runtime gate fails open and logs a warning.
- Section/check gates round-trip through builder import/export and appear in the
  live criterion-test tool.
- Platform-specific excluded sections are identified in score-basis data.
- Reports give non-Shopify visitors a useful universal audit and an honest
  explanation.

### 4.5 Part B — Shopify positioning

Completed, with the original lead timing later revised by Part D:

- Landing metadata and customer-facing copy position the product as a Shopify
  store audit.
- Marketing names Shopify-specific problems: app bloat, theme performance,
  product schema, collection URLs, policy pages, and AI readiness.
- The anonymous teaser displays the overall score, all section scores, and
  three real findings.
- Shopify-specific high-value findings are preferred in the teaser when
  applicable.
- Detected platform, theme, and app context appears on relevant report/admin
  surfaces.
- Lead records can carry platform/theme/app context, and Master Admin can filter
  or export the lead data.

### 4.6 Part D — progressive lead capture

This supersedes the older plan to demand email on the landing page.

Completed and live-verified behaviour:

1. Landing has one URL input and one button on one line.
2. URL validation and anonymous per-IP throttling run normally.
3. `POST /api/audits` starts an anonymous audit without email and no longer
   returns a `needEmail` response.
4. The progress screen waits about 15 seconds, then shows a skippable inline
   email block. It is never a modal or blocking overlay.
5. Marketing consent is separate and unticked.
6. `POST /api/leads/capture` accepts email, consent, and the report public ID.
7. Authorization is ownership-based. `getReportForViewer` only resolves the
   report for the user or `af_anon` cookie that owns it, preventing a public-ID
   attacker from attaching email to someone else’s report.
8. The capture endpoint is additionally limited to 10 requests/hour/IP.
9. Capture upserts one lead per normalized email/domain and links the anonymous
   session and first report.
10. A returning anonymous visitor with a known lead sees confirmation rather
    than another ask. Signed-in report owners are not asked.
11. If capture arrives after the report reached a terminal state, the promised
    report or failure email is sent immediately rather than waiting for an event
    that already occurred.
12. Signup is the second capture point. When email first becomes available at
    signup, leads are created for every domain the anonymous session audited.
13. Completion email sends for Completed/Partial; failure sends an apology and
    retry route. Transactional delivery does not depend on marketing consent.
14. One-click unsubscribe updates lead and user marketing state.

Funnel instrumentation is append-only through `FunnelEvent` and records:

- `audit_started`;
- `email_captured_progress`;
- `email_captured_signup`;
- `audit_completed`;
- `teaser_viewed`;
- `signup_completed`.

`/master-admin/leads` shows a 30-day funnel and the primary number: emails
captured per 100 audits started.

Live acceptance included a URL-only start, authorized progress capture,
rejection of a capture without the owner cookie, platform data copied to the
lead, correct terminal events, and a delivered result email.

### 4.7 Part E — Shopify snapshot extraction

Completed and live-verified. Every extractor is best-effort and cannot fail the
whole audit.

#### Shopify policy pages

For Shopify only, the pipeline probes these fixed routes sequentially:

- `/policies/refund-policy`;
- `/policies/privacy-policy`;
- `/policies/terms-of-service`;
- `/policies/shipping-policy`;
- `/policies/legal-notice`.

Each records existence, HTTP status, title, H1, and word count. Aggregates
record how many are present, how many are thin, and how many repeat the same
title and H1. Each request has a five-second limit and the group has a
twenty-second budget.

#### llms.txt

Every platform receives one guarded `/llms.txt` request. The snapshot stores
existence, the first 5 KB, and total size. An HTML 200 soft-404 is rejected as
not being a real `llms.txt` file.

#### Resource hints

Static HTML extraction records preconnect hosts, DNS-prefetch hosts, preload
count, and whether Shopify CDN is hinted.

#### Images

Static extraction records:

- total image count;
- Shopify CDN image count;
- width-parameter count;
- lazy-loaded count;
- eager/not-lazy count among the first three images;
- count with explicit width and height;
- average `srcset` entry count.

#### Product-page signals

When Product JSON-LD exists, the snapshot records offers, price, availability,
currency, aggregate rating, schema image count, size-guide language, shipping
language, and returns language.

The entire product object is absent on non-product pages. It is not filled with
false values.

#### Shopify URL and sitemap signals

Without additional requests, extraction records collection-scoped product
links, `?variant=`, `?filter.*`, and `?page=` link counts. Shopify sitemap child
file names are exposed in the Shopify namespace.

The request budget is at most six additions per Shopify audit: five policy
routes and one `llms.txt` route.

### 4.8 First Part C check-library tranche

`docs/shopify-check-library.json` currently contains 5 importable sections and
33 unique checks:

1. Shopify Performance & App Bloat;
2. Shopify Store Policies;
3. Shopify Product Page Readiness;
4. Shopify URL & Indexing Hygiene;
5. AI Discoverability.

Shopify sections carry a section-level `site.isShopify` gate. Every product
check also requires `shopify.product.hasProductSchema`, so a homepage correctly
skips those checks.

The library includes platform-aware Shopify remediation, warning bands where a
meaningful middle state exists, and deliberately modest scoring for emerging or
context-dependent signals such as `llms.txt`, size guidance, and parameter
counts.

The production import parser validates it via:

```text
npm run check:shopify-library
```

Current result: 5 sections, 33 checks, 33 unique keys. The library carries
per-section `pillar` values and **has been imported into the live draft**
(create + merge both verified; a merge adopts an explicitly-provided pillar
while preserving the section's tuned settings).

### 4.9 Part F — report presentation (completed, verified live)

- `ReportPillar` enum (`FOUNDATIONS | SPEED_VITALS | ONPAGE_CONTENT |
  AI_ANSWER_ENGINES | TRUST_COMPLIANCE | CONVERSION_UX`) on `ReportSection`;
  the migration mapped every existing section explicitly by slug — only
  genuinely new sections take the default.
- Pillar is editable in the section editor, validated by Zod (unknown values
  rejected at import, all-or-nothing), and round-trips losslessly through
  JSON export → import.
- Snapshot payload bumped to **version 2**: pillar + weight per section,
  `category` per check. v1 snapshots still render through the old flat path.
- The customer report renders pillar → section → sub-section → check. Pillar
  headers show a weighted aggregate score (same arithmetic as the overall
  score, honouring `scoreBasis` exclusions) plus pass/warn/fail counts. A
  fully-excluded pillar renders collapsed with its reason, never a zero.
- `category` sub-section groups render with per-group counts (contiguous
  runs; uncategorised checks render exactly as before).

### 4.10 Phase 2 — the Fix Loop (completed, verified live)

The retention engine: a persistent `Finding` lives on the **Website**;
reports are observations of ongoing state.

**Data model:** `Finding` (identityHash = sha256(fieldKey + ':' +
normalizedPageUrl), unique per website; denormalized section/check/severity/
pillar refreshed on every reconciliation; `staleSince`; `resolvedAt`),
`FindingEvent` (append-only history; `report onDelete: SetNull` — deleting a
report never destroys finding history), nine `FindingState`s, `Report.
previousReportId/scoreDelta/findingsReconciledAt`, `AuditResult.suppressed/
findingId`, `Website.auditSchedule`, `User.auditEmailsEnabled`.

**Transition table:** pure function in `src/services/findings/transitions.ts`;
`scripts/test-finding-transitions.ts` exercises **every row — 60 engine
transitions + 54 user-action cases, all passing** — and was written before
reconciliation was wired to the pipeline. INFO is unreachable at check level
and removed from the table. NOT_APPLICABLE/ERROR never touch and never create
— the single most important rule, now load-bearing on every mixed-platform
audit.

**Reconciliation** (`src/services/findings/reconcile.ts`): runs after
`evaluateReport()`, before `buildAndStoreSnapshot()`, on the unpooled client.
`previousReportId` resolves at reconciliation time (latest reconciled
COMPLETED/PARTIAL for the website), so out-of-order completion cannot corrupt
the chain. Idempotent by rollback: re-running first deletes findings its own
events created and restores state from `stateBefore`, then reconciles fresh.
Events are written for every observed finding (keeps included) so the
comparison view is pure set operations. Unobserved findings go **stale**,
never "fixed". Failure is isolated: the report always completes; the Pipeline
Console has a "Re-run findings" retry action.

**Suppression:** WONT_FIX/FALSE_POSITIVE findings are excluded from both
sides of the score exactly like NOT_APPLICABLE — after `appliesWhen`
precedence — while `AuditResult.status` records the true verdict
(`suppressed` flags the row). Section emptied by suppression →
`scoreBasis` reason `ALL_SUPPRESSED`. FALSE_POSITIVE requires a reason.

**Guards:** one in-flight audit per **owned website** at intake (anonymous
shared rows stay per-session); claim-time seeding reconciles claimed reports
chronologically on signup *and* login.

**Scheduled re-audits:** `Website.auditSchedule` (FREE → monthly max,
PREMIUM → weekly), `/api/cron/schedule` (CRON_SECRET, hourly) enqueues
through the normal intake path; allowance exhaustion skips and notifies
**once** (`scheduleSkipNotifiedAt`); a downgrade reduces weekly → monthly
with a notification, never leaving a plan-exceeding schedule running.

**Delta email + notification:** sent only when `previousReportId` exists
(first audits keep the Part D result email); subject leads with the score
movement; rendered from the editable `audit_delta` EmailTemplate row;
respects `User.auditEmailsEnabled` with an audit-email preference link
(`/unsubscribe?type=audit`) distinct from marketing unsubscribe; writes a
`Notification` row and the `delta_email_sent` funnel event
(`comparison_viewed` is also recorded; both appear in the admin funnel).

**UI (Part H):** `/dashboard/websites/[id]` — header with platform/theme/app
badges and score-delta arrow, SVG score-trend chart (amber points mark
partial-coverage scores, tooltip shows coverage), tabs **Fix List (default)
| Reports | Settings**. Fix List: default filter shows the open family,
toggle reveals resolved/suppressed; severity-then-age sort grouped by
pillar; per-row and bulk actions (rate-limited ~200/hr, ownership verified
server-side, FindingEvents with `actor: USER`); celebratory empty state;
mobile-collapsing filters. `/dashboard/reports/[publicId]/compare` — the
seven buckets from finding events, score-basis guard with a like-for-like
score over the intersecting sections, "this is your baseline" state. Old
reports show the frozen snapshot status plus a live badge ("FAIL at the time
of this audit — ✓ verified fixed since") fetched live, never rewriting the
snapshot.

**Live verification:** a 25-assertion lifecycle run against the real database
covered create → idempotent re-run → user actions → fix-verify →
still-failing → regression → suppression persistence → **Shopify→WordPress
migration leaving findings stale-not-fixed** → chain/delta/buckets/delta-
email. A separate real-audit run verified suppression scoring end to end:
suppressing one FAIL moved the score 44.6 → 48.9 with the row keeping its
true FAIL status, and un-suppressing restored **exactly** 44.6.

---

## 5. How an audit works end to end

### 5.1 Intake and identity

The public browser submits only a URL to `POST /api/audits`.

The route:

1. validates and normalizes the URL;
2. rejects private/internal targets through SSRF checks;
3. determines signed-in or anonymous identity;
4. applies maintenance, allowance, per-IP, and concurrency controls;
5. creates or reuses the Website/report relationship;
6. creates an anonymous session/cookie when required;
7. pins the report to the current published template version;
8. records `audit_started`;
9. enqueues durable work;
10. returns the public report identifier for the progress route.

Knowing a public ID is not ownership. Protected capture/report operations
resolve the current account or hash the `af_anon` cookie and compare it to the
anonymous session that created the report.

### 5.2 Pipeline stages

`runAudit(reportId)` is the orchestration entry point. The visible stages are:

| Progress | Stage | Actual responsibility |
|---:|---|---|
| 5% | CONNECTING | Load report/config and revalidate target |
| 12% | FETCHING_HTML | Guarded fetch, redirect/size/timeout handling |
| 22% | RENDERING | Decide from static evidence; selectively render; retain screenshot when available |
| 32% | INSPECTING_METADATA | Extract HTML metadata, content, links, resources, images, conversion, trust, and Shopify URL/product signals |
| 42% | CHECKING_SEO | Fetch robots, `llms.txt`, sitemap, broken-link sample; detect platform; fetch Shopify policies |
| 55% | CHECKING_SPEED | Fetch PageSpeed mobile/desktop data |
| 68–90% | Accessibility/mobile/conversion/recommendations labels | Currently progress pacing; no separate expensive collection occurs here |
| 96% | GENERATING_REPORT | Evaluate checks, score sections/report, store results and immutable snapshot |
| 100% | Terminal | Mark Completed or Partial, record funnel event, notify captured lead |

Partial normally means a useful audit was created without PageSpeed data. It is
not treated as a total failure, and score basis discloses the excluded weight.

### 5.3 Guarded fetching and rendering

All target requests must use the existing guarded fetch path. It revalidates
redirects, blocks private IP space, caps response size, limits redirect count,
and applies timeouts. New feature code must not introduce raw unconstrained
fetches.

Rendering is an augmentation, not the primary crawler. Static HTML is preferred
when it contains enough content. A browser may be used for JS shells or when
the safety valve detects a nearly empty extraction. If rendering does not
improve the usable document, the static snapshot remains authoritative.

### 5.4 Stored raw data and immutable snapshots

The pipeline stores the extracted evidence and raw source needed to re-evaluate
criteria without re-crawling. It then stores a report snapshot used for customer
display.

The important immutability contract is:

- the template version is pinned when the report is created;
- the observed check verdicts/evidence in a snapshot are historical;
- later builder edits do not rewrite an already-delivered report;
- the future Fix Loop may show a current live finding state next to the frozen
  observation but must never rewrite the old verdict.

---

## 6. How the criteria engine works

The engine is deliberately data-driven:

```text
stored criterion + stored crawl snapshot
        ↓
extract one typed value
        ↓
evaluate pass band, then optional warning band
        ↓
PASS / WARNING / FAIL / ERROR / NOT_APPLICABLE
        ↓
interpolate the matching message and suggestion
```

### 6.1 Extraction

An `AuditCriteria` row chooses an inspection type such as:

- DOM element/attribute/text inspection;
- HTTP, redirect, SSL, response-header, robots, sitemap, or broken-link checks;
- well-known page metadata and schema checks;
- generic Boolean/number/string reads from a documented snapshot path;
- sandboxed rules over several paths;
- PageSpeed metrics and Lighthouse category scores.

`HTML_VALIDATION` and `API_CHECK` remain unimplemented and should not be used.

### 6.2 Evaluation bands

Every criterion has a pass condition. It may also have a separate warning
condition.

Example:

```text
LCP <= 2500 ms       PASS
LCP <= 4000 ms       WARNING
otherwise            FAIL
```

Without a configured warning operator, the check cannot produce Warning merely
because a Warning message exists.

Supported operator families include existence, Boolean truth, string equality
and containment, numeric thresholds/ranges, and guarded regular expressions.

### 6.3 Status semantics

| Status | Score factor | Meaning |
|---|---:|---|
| PASS | 1.0 | Pass condition matched |
| WARNING | 0.5 | Pass missed, warning band matched |
| FAIL | 0.0 | Neither band matched |
| ERROR | Excluded | Configuration or extraction could not be evaluated |
| NOT_APPLICABLE | Excluded | Data/platform/page type genuinely does not apply |

The absent-path rule is load-bearing. Generic path readers distinguish
`undefined` from `false`:

- missing path → unavailable → `NOT_APPLICABLE`;
- stored false → real Boolean observation and normal evaluation;
- stored null → a real stored negative/empty observation and normal evaluation.

This prevents a Shopify homepage from failing a product schema detail check.

### 6.4 Applicability

`ReportSection.appliesWhen` and `AuditField.appliesWhen` contain a JSON string
holding a sandboxed expression over snapshot paths.

Typical gates:

```json
{"var":"site.isShopify"}
```

```json
{">":[{"var":"site.appCount"},0]}
```

Allowed operations are a restricted subset including `var`, comparisons,
Boolean operations, `in`, `length`, `cat`, and `substr`. There is no arbitrary
code execution.

### 6.5 Scoring

For an applicable check:

```text
maximum = check.score × check.weight
earned  = maximum × status factor
```

Section percent is earned/maximum over scorable checks. Overall score is a
weighted average of section percentages using section weights, so adding more
checks to one section does not accidentally increase that section’s global
importance.

Error, Not Applicable, and future suppressed findings are excluded from both
numerator and denominator. Snapshot `scoreBasis` records model coverage and
excluded sections.

Severity does not change score arithmetic. It affects issue prioritization:

- a failing Critical check is a critical issue;
- failing/warning Low or Medium checks are quick wins;
- teaser/action-plan ordering uses severity and these definitions.

### 6.6 Messages and evidence

Suggestions support safe interpolation such as domain, actual value, expected
value, count, minimum, maximum, title, and section name. Evidence is derived
from the concrete selector, response header, path value, or metric that caused
the verdict.

---

## 7. How the report builder and JSON library work

The Master Admin builder edits the current Draft template. Publishing changes
that version to Published and creates another Draft, preserving report
immutability.

Import accepts:

1. one section object;
2. an array of sections;
3. an envelope containing `sections`.

The entire file is validated before any write. Up to 50 sections may be
imported in one file. One bad section/check aborts the transaction.

Merge behaviour:

- section match is by slug first, then case-insensitive name;
- deleted matching sections/checks can be restored;
- existing section settings remain untouched unless overwrite is explicitly
  requested;
- a new field key appends a check, normally under the incoming sub-section;
- an existing field key updates that check in place unless the operator chooses
  to skip existing checks;
- category survives export/import and drives builder sub-section grouping;
- `fieldKey` is stable machine identity and should be treated as permanent.

Export produces an envelope the importer accepts unchanged. `configJson` is a
JSON **string**, not a nested object. Section/field `appliesWhen` also
round-trips.

The existing universal Draft currently contains sections for Page Speed, SEO,
Technical SEO, Accessibility, Mobile Usability, Security, Conversion
Optimization, and Robots.txt. The current Shopify library uses new section
slugs, so its first import creates sections; re-imports merge/update them.

The read-only database inspection made for this handoff found template v1
Published with 7 sections/20 active checks and template v2 Draft with 9
sections/26 active checks. Those counts are from before importing the 5 new
Shopify-library sections.

---

## 8. Report access, teaser, and plan boundaries

An anonymous owner receives a useful teaser rather than a blank paywall:

- overall score;
- all section names/scores;
- three real findings in full;
- platform/theme/app context;
- an honest count of remaining locked issues;
- signup CTA to claim/unlock.

Premium locking is enforced in the server projection service before data is
serialized. A client component must never receive premium evidence and merely
hide it with CSS.

Anonymous report access and lead capture require the owning anonymous cookie.
Signup claims reports for the user, clears anonymous expiry as appropriate, and
converts/links lead records.

---

## 9. Lead, consent, and email model

A Lead is keyed uniquely by email plus normalized domain. It can link to the
anonymous session, first report, converted user, consent proof, unsubscribe
state, and detected store context.

Consent rules:

- transactional report delivery and marketing consent are separate;
- marketing consent defaults false;
- consent timestamp and a hash of the IP are stored as proof without retaining
  the raw IP;
- a result email may be sent because the visitor explicitly requested the
  audit, regardless of marketing consent;
- marketing unsubscribe updates both lead and registered-user state.

Development can log an email fallback when Resend is unavailable; production
configuration should deliver through the provider without leaking secret keys.

---

## 10. Security and reliability invariants

Any proposal must preserve:

- URL validation before expensive work;
- DNS/IP and redirect-aware SSRF protection;
- bounded response sizes, redirects, and timeouts;
- rate limits on public and admin-sensitive endpoints;
- anonymous-session/account ownership checks;
- role checks inside every admin mutation;
- encrypted secret settings and masked client payloads;
- no secrets in activity logs, execution logs, errors, or responses;
- durable terminal failure rather than silent background loss;
- one retry for reaped system failures and correct allowance refund semantics;
- report/template immutability;
- server-side premium stripping;
- platform/product gating and absent-path semantics.

---

## 11. What is not finished in Part C

The current JSON covers the snapshot work delivered in Part E but does not yet
fulfil every requested Shopify pillar.

### Foundations gaps

- It counts variant, filter, and pagination links but does not prove canonical
  or noindex correctness for every parameterized URL.
- It detects some sitemap children but does not explicitly verify products,
  collections, pages, and blogs individually.
- It does not check deliberate `/collections/all` handling.
- It does not reliably distinguish default from customized
  `robots.txt.liquid`.

### Speed gaps

- No stored theme JavaScript bundle-weight signal.
- No reliable Shopify-versus-external font-origin inventory.
- CDN coverage could be expressed more completely than the current responsive
  width check.

### On-page gaps

- Product/collection description depth and template-default metadata require a
  product or collection page, not just a homepage.
- Collection descriptions and blog presence/recency require page discovery or
  sampling.

### AI-readiness gaps

- Product condition is not extracted.
- Review schema is not separately extracted from AggregateRating.
- BreadcrumbList and Organization/Store can potentially use current generic
  schema types but are not yet represented in this JSON.
- Named bot-access checks could inspect current robots content but have not been
  added.
- Server-rendering evidence is not exposed as a clean criteria path.

### Trust/compliance gaps

- Legal notice exists in extracted policy data but lacks its own
  jurisdiction-aware library check.
- Contact/About page discovery is not implemented.
- Cookie consent has a weak existing homepage text signal but needs careful
  copy and jurisdiction framing.

### Conversion gaps

- Payment/trust badge inventory is incomplete.
- Visible review support is only partial through schema and recognized apps.
- Add-to-cart visibility above the fold is not measured.
- Free-shipping threshold messaging is not extracted precisely.

The next library pass should add only checks that can be defended with existing
evidence. Everything else should be explicitly deferred or accompanied by the
smallest reliable extractor proposal.

---

## 12. Exact recommended next process

### Step 1 — close the supported-now Part C gap

Review all documented snapshot paths and extend the JSON with reliable checks
that require no new crawling, likely including:

- explicit product/collection/page/blog sitemap child checks;
- named AI-crawler directives in robots content, with careful interpretation;
- Organization/Store and BreadcrumbList schema checks where page applicability
  is defensible;
- selected cookie/contact/trust signals with low severity and honest wording;
- any omitted E-path checks that add distinct value rather than duplicate an
  aggregate.

### Step 2 — classify every remaining check

Create a table with one disposition per requested C.1 item:

- implement now from an existing path;
- add a bounded single-page extractor;
- defer to Shopify sitemap-driven multi-page sampling;
- reject as too unreliable or misleading.

### Step 3 — import and live-test the library

Before import:

```text
npm run check:shopify-library
npx tsx scripts/check-sample-section.ts
npm run typecheck
npm run lint
npm run build
```

Then import into the Draft without overwriting unrelated section settings.
Test at least:

1. a normal Shopify Liquid homepage;
2. a Shopify product page with static Product JSON-LD;
3. a Hydrogen or JS-heavy storefront;
4. a non-Shopify site.

Verify:

- every check produces Pass/Warning/Fail or an intentional Not Applicable;
- none produces configuration Error;
- homepage product checks are Not Applicable;
- Shopify sections are Not Applicable on non-Shopify sites;
- score basis and locked counts remain honest;
- remediation refers to a correct Shopify admin route or theme file;
- premium details remain removed server-side;
- the resulting report reads coherently and does not overcount closely related
  observations as separate major failures.

Publish a new template version only after this review.

### Step 4 — begin Phase 2, the Fix Loop

After Part C is stable, the next major product phase is persistent findings:

- `Finding` and `FindingEvent` models;
- identity by field key plus normalized page URL;
- deterministic state transitions;
- stale finding handling;
- user acknowledgement/work/fixed/suppression actions;
- score suppression without falsifying the original result;
- idempotent reconciliation and same-website concurrency protection;
- comparison reports and score-basis mismatch warnings;
- delta emails and in-app notifications;
- scheduled re-audits;
- anonymous claim seeding without historical backfill.

The Fix Loop is the retention engine. The report is an artifact; the future Fix
List is the daily-use workflow.

### Step 5 — Phase 3 report depth

After the Fix Loop:

- render categories as report sub-sections;
- add six explicit report pillars and migrate the seven original sections;
- include pillar in builder JSON round trips;
- build the mobile-capable Fix List;
- show frozen historical verdict plus live current finding state;
- add comparisons, trend chart, evidence, action plan, screenshots, and all
  defined empty states;
- expand toward roughly 70 reliable checks across six pillars.

---

## 13. Deferred work and non-goals

Do not build these during current Part C or Phase 2 work:

- Shopify App Store OAuth, App Bridge, Billing API, or Admin API integration;
- full site crawling;
- the `WebsiteRawData` one-to-many/multi-page migration before Phase 2;
- backlinks or keyword rankings;
- LLM prompt-panel monitoring;
- screenshot diffing;
- white-label;
- public share links;
- client-side PageSpeed calls;
- per-check LLM API calls.

Future AI content analysis should mirror PageSpeed: one structured, cached LLM
call per audited page, persisted once, with criteria reading stored result paths
for free and without violating report immutability.

---

## 14. Questions ChatGPT can productively explore

Useful areas for analysis, grounded in the current system:

1. Which supported-now Part C checks should be added, and what exact thresholds,
   severity, score weight, warning band, gate, and Shopify remediation should
   each use?
2. Which current checks are correlated enough that scoring would double-count
   one root cause?
3. Which C.1 gaps justify a cheap single-page extractor, and which should wait
   for multi-page sampling?
4. What is the smallest credible 50–70 check library across six future pillars
   without manufacturing false precision?
5. Which three findings should an anonymous Shopify teaser prioritize for the
   best demonstration of platform-specific value?
6. How should section weights and free/premium access be calibrated so the free
   report remains trustworthy while premium has meaningful depth?
7. What cohort and thresholds should evaluate progressive email capture after
   enough traffic, using emails per 100 starts as the primary measure?
8. What should the Phase 2 Finding transition tests and reconciliation
   transaction boundaries look like in this exact architecture?
9. How should multi-page sampling select one product, collection, blog post,
   and page from Shopify sitemap children after Phase 2?
10. Which claims in marketing copy are supported by current evidence and which
    overpromise capabilities not yet built?

Recommendations should return an ordered plan with explicit dependencies,
risks, acceptance tests, and a statement of what should **not** be built yet.

---

## 15. Verification commands and current handoff state

Common commands:

```text
npm run dev
npm run check:shopify-library
npx tsx scripts/check-sample-section.ts
npm run typecheck
npm run lint
npm run build
```

Do not start a second `next dev` process while one is running because both
processes share `.next` and can corrupt build manifests.

At this handoff:

- Parts A, B, D, and E are implemented;
- Phase 0 and render optimization are implemented;
- **Part F (pillars + sub-section rendering) is implemented and verified**;
- **Phase 2 — the Fix Loop (Part G) and Fix List UI (Part H) — is implemented
  and live-verified**: transition suite (114 cases), reconciliation
  idempotency, migration-staleness, suppression scoring with exact score
  restoration, delta email, comparison buckets;
- the library tranche (now **34 checks**) carries pillars and **is imported
  into the live draft**;
- **the Part C coverage review and publish gate are complete** — see
  `docs/BUILD-ROADMAP.md` §10. `scripts/validate-draft-library.ts` runs the
  real pipeline against five site types; latest run: 0 configuration ERRORs,
  0 checks that never fire, 0 gated checks failing on a non-Shopify site.
  Two extractor bugs were found and fixed by that gate: `ProductGroup`
  (variant products) was not recognised as product schema, and a product page
  with NO schema produced nine silent N/As instead of one honest FAIL;
- **Phase 3 (report depth) is complete** — evidence trail, prioritized action
  plan, screenshot surface; see `docs/BUILD-ROADMAP.md` §11. Before that pass
  31 of 34 Shopify checks produced **no evidence at all** because
  `buildEvidence()` returned null for every path-based inspection type;
  coverage is now 33/33 on a universal audit and 63/63 on a Shopify audit;
- **multi-page sampling is implemented** (§12) — the §8 deferral, unblocked
  after Phase 2. The audit now samples one representative product, collection
  and blog page from the store's sitemap, so product-readiness checks fire on
  an ordinary homepage audit: **10/10 product checks fired** where previously
  0/10 could. A Shopify homepage now exercises **73/78 checks (was 58/78)**;
- **PDF export is implemented** (§13) — it was listed in the pricing table and
  four other places as a Premium benefit with **no implementation at all**.
  `/dashboard/reports/[publicId]/pdf` is a print-optimised document generated
  by the browser, reusing the same ownership check and plan projection, so it
  inherits the server-side premium boundary instead of re-implementing it;
- **the draft is validated and ready to publish — publishing is the admin's
  call** and is the single remaining step to make the Shopify pivot live;
- **operational secrets are unset in this environment** (`CRON_SECRET`,
  `QSTASH_TOKEN`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`). Consequences worth
  knowing: without `CRON_SECRET` both cron routes refuse to run, so stuck
  audits are never reaped and **scheduled re-audits never fire — the Fix Loop
  does not loop automatically**;
- Phase 3 (evidence depth, action plan) and Phase 4 (AI analysis, design
  only) have not started;
- typecheck, full lint, production build, and both guards pass.

For implementation-level details, consult:

- `docs/AI-CONTEXT.md` — full system and criteria vocabulary;
- `docs/BUILD-ROADMAP.md` — specification precedence and phased requirements;
- `docs/RENDER-STUDY.md` — measured rendering decisions;
- `docs/shopify-check-library.json` — current importable library;
- `src/lib/builder/sample-section.ts` — machine-friendly authoring contract;
- `prisma/schema.prisma` — authoritative persisted model.
