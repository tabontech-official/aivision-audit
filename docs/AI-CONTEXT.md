# AuditFlow — Complete System Briefing

> **Purpose of this file.** Paste it into a Claude (or any AI) chat as the first
> message when you want help with this codebase. It describes what the product
> is, how every moving part works, the exact vocabulary the audit engine
> understands, and the conventions the code follows — so you can ask for a
> feature, a fix, or a new audit section without explaining the system first.
>
> **Grounded in source**, verified against the live Neon database on
> **2026-07-31**. Where a number appears, it came from the database, not from
> the code's intent. Anything marked *not implemented* really is not.
>
> **Roadmap and spec precedence:** read `docs/BUILD-ROADMAP.md` before starting
> the next phase. It reconciles build-spec v3, the Shopify pivot, and Parts D/E,
> including the progressive-email decision that supersedes the older flow.
> For a single self-contained file to upload to another ChatGPT conversation,
> use `docs/CHATGPT-HANDOFF.md`.

---

## 0. How to use this document

- **Sections 1–6** — what the product is and how a request flows through it.
- **Section 7** — the criteria engine's full vocabulary. This is what you need
  if you are asking an AI to *author a new audit section as JSON*.
- **Sections 8–13** — builder, gating, security, jobs, admin surface.
- **Section 14** — code conventions. Read before asking for new code.
- **Section 15** — live state and known gaps.

If you are asking an AI to generate a new audit section, you can also paste
`src/lib/builder/sample-section.ts` (or the **Sample JSON** modal in Report
Builder) — it is a self-contained brief that repeats §7 in machine-friendly form.

---

## 1. What this product is

A **freemium website-audit SaaS**.

A visitor pastes a URL on the landing page. The site is crawled and scored
while a staged progress animation runs, then they land on a report covering
Page Speed, SEO, Technical SEO, Accessibility, Mobile Usability, Security and
Conversion Optimization.

The report is deliberately gated:

| Viewer | Sees |
|---|---|
| Anonymous | Overall score + section names, everything else locked |
| Free account | Full detail on FREE/BOTH content; PREMIUM content locked |
| Premium account | Everything |

Monetization is a Stripe subscription. Free accounts get a monthly audit
allowance (3 by default, configurable); Premium gets a larger one (50 default).

**The conversion funnel is the product's spine, not a bolt-on.** An anonymous
audit is tied to a hashed cookie token (`af_anon`). On signup, reports created
under that cookie are transferred to the new account and their expiry cleared,
so the user gets the result they were already waiting for without re-running
anything. That "your report is ready, just sign in" moment is the core
acquisition mechanic.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, RSC, server actions), React 19 |
| Language | TypeScript, strict |
| Styling | Tailwind CSS **v3** (`tailwind.config.ts`, `postcss.config.mjs`) |
| Database | PostgreSQL on Neon, via Prisma |
| Auth | Auth.js (NextAuth v5), Credentials provider, JWT sessions |
| Passwords | argon2id (`@node-rs/argon2`) |
| Crawling | `undici` fetch + `cheerio` parsing; Playwright for optional JS render |
| Speed data | Google PageSpeed Insights API |
| Jobs | Upstash QStash → `/api/jobs/run-audit` (with an inline fallback) |
| Rate limit | Upstash Redis, with an in-memory fallback |
| Billing | Stripe (Checkout + Billing Portal + webhooks) |
| Email | Resend |
| Icons | lucide-react |

**121 TS/TSX files** under `src/`, ~950-line Prisma schema.

Design tokens live in `tailwind.config.ts`: `brand` (indigo), `premium`
(purple), `surface`, `ink`, `success`, `warning`, `danger`. Note the semantic
palettes only define shades **50, 100, 500, 600, 700** — `danger-200` does not
exist. A `.card` component class is defined in `src/app/globals.css`.

---

## 3. Repository layout

```
prisma/schema.prisma          ~950 lines, ~34 models

src/app/
  page.tsx                    landing page (URL form)
  layout.tsx                  root layout, Inter font
  (auth)/                     login, signup, verify-email, forgot/reset password
  analyze/[publicId]/         staged progress screen (polls the status API)
  report/[publicId]/          report entry point — requires a session, then
                              redirects into the dashboard (or /analyze while
                              the audit is still running)
  dashboard/                  reports list, report view, websites, profile, billing
  master-admin/               builder, users, reports, settings, logs, dev
  api/
    audits/                     POST — start an audit (requires an account)
    reports/[publicId]/status/  GET  — progress polling
    jobs/run-audit/             POST — QStash worker (signature-verified)
    stripe/webhook/             POST — signature-verified, idempotent
    auth/[...nextauth]/         Auth.js handler
    master-admin/dev/trace/     GET  — dev console log tail (admin + dev gate)

src/services/                 all business logic ("server-only" modules)
  audits/       create.ts (intake), allowance.ts
  jobs/         enqueue.ts (QStash dispatch), run-audit.ts (the 10-stage pipeline)
  inspection/   fetcher.ts, extract-html.ts, renderer.ts, aux-checks.ts,
                screenshot-store.ts, types.ts
  pagespeed/    client.ts
  criteria/     extract-value.ts, evaluate.ts, interpolate.ts, run-check.ts
  reports/      evaluate-report.ts, snapshot.ts, project-report.ts,
                access.ts, evidence.ts
  builder/      draft.ts (version cloning), import-export.ts (bulk JSON)
  billing/      billing.ts (checkout/portal), sync.ts (webhook → DB)
  settings/     get.ts (typed KV with defaults)
  email/        send.ts
  audit-log/    log.ts (AdminActivityLog)
  system-log/   log.ts (SystemExecutionLog)

src/lib/
  auth/         auth.ts, config.ts (edge-safe), rbac.ts, tokens.ts, claim.ts, password.ts
  security/     url.ts, ssrf.ts, rate-limit.ts
  validation/   auth.ts, builder.ts   ← Zod schemas, the source of truth
  builder/      sample-section.ts     ← the "Sample JSON" + AI brief
  dev/          tools.ts              ← dev-tools gate + pipeline stage table
  db/client.ts  Prisma singleton
  stripe/, utils/cn.ts

src/components/               ui/ (button, input, modal, alert, badge),
                              marketing/, dashboard/, admin/, report/, providers/

scripts/                      seed.ts + one-off diagnostic scripts (tsx)
docs/                         SYSTEM-OVERVIEW.md, AI-CONTEXT.md (this file)
```

---

## 4. The central architectural bet

**The audit engine is configuration, not code.**

Not one check is hardcoded. A `MASTER_ADMIN` composes the entire audit through
the builder UI: sections, checks, thresholds, severity, scoring weights,
per-plan visibility, and the exact prose shown for each outcome.

This is why the schema carries **34 `InspectionType` values** and **16
`CriteriaOperator` values** — they are the vocabulary an admin composes from,
not an enumeration of features someone hardcoded.

Consequences:

- New checks ship without a deploy.
- Scoring is retuned per-section by weight, live.
- The free/premium split is a per-section and per-check dropdown, so the
  paywall moves without touching code.
- The same engine powers the admin's "Test this criterion against a URL"
  button, so a check is verified before it reaches a customer.

### The safety consequence

Because admins configure *behavior*, the system must never let them configure
*execution*. It doesn't:

- `RULES_EVALUATOR` is a **sandboxed JsonLogic interpreter**
  (`extract-value.ts` → `evaluateRules`) with a whitelisted operator table, a
  depth-20 recursion guard, and reads restricted to paths inside the extracted
  crawl data. Unknown operators return `null` silently. The whitelist is
  enforced *again* at import time in `src/lib/validation/builder.ts`
  (`validateRuleNode`, depth 15).
- `REGEX_EVALUATOR` patterns are length-capped (300 chars), screened against
  catastrophic-backtracking shapes, and run against a 50 KB-truncated subject.
- **No executable code is ever stored in the database.** JsonLogic is the safe
  replacement for custom JavaScript.

---

## 5. Data model

~34 models in four clusters.

### Builder (the template)

```
ReportTemplate
  └── TemplateVersion        (DRAFT | PUBLISHED | ARCHIVED)
        └── ReportSection    (weight, planAccess, contributesToScore)
              └── AuditField (severity, score, weight, planAccess, category)
                    ├── AuditCriteria    (1:1 — how to inspect + how to judge)
                    └── AuditSuggestion  (1 per outcome status — what to say)
```

Key constraints:

- `@@unique([templateVersionId, slug])` on `ReportSection`
- `@@unique([sectionId, fieldKey])` on `AuditField`
- **Both unique constraints ignore `deletedAt`.** Deletes are soft
  (`deletedAt` timestamp), so a naive "create" against a soft-deleted slug or
  field key violates the constraint. The import engine handles this by matching
  rows *including* soft-deleted ones and restoring them.
- `AuditField.category` is a free-text label. The builder renders each
  contiguous run of checks sharing a category as a **sub-section header** —
  this is how a merged import groups appended checks. It is builder-side only;
  the customer-facing report does not group by it today.

### Execution (the result)

```
Website
  └── Report                 (pins templateVersionId — never "latest")
        ├── WebsiteRawData   (1:1 — full crawl snapshot incl. up to 2 MB HTML)
        ├── PageSpeedResult  (1 per strategy: MOBILE / DESKTOP)
        ├── ReportSectionResult
        │     └── AuditResult (1 per field — status, value, rendered prose)
        └── ReportSnapshot   (1:1 — immutable denormalized payload)
```

### Identity & billing

`User`, `Session` (revocation registry — the JWT is primary), `AnonymousSession`,
`VerificationToken`, `PasswordResetToken`, `Plan`, `PlanFeature`, `Subscription`,
`Payment`, `Invoice`, `StripeWebhookEvent` (idempotency ledger).

`Organization` / `OrganizationMember` exist but are **not surfaced in the v1
UI** — future-proofing for multi-seat.

### System

`SystemSetting` (typed KV), `BrandingSetting`, `EmailTemplate`,
`AdminActivityLog` (before/after diffs), `ApiUsage`, `Notification`,
`SystemExecutionLog` (pipeline tracing).

### Important enums

```
UserRole      USER | MASTER_ADMIN
UserPlan      FREE | PREMIUM
PlanAccess    FREE | PREMIUM | HIDDEN | BOTH
Severity      CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL
CheckStatus   PASS | FAIL | WARNING | INFO | NOT_APPLICABLE | ERROR
ReportStatus  QUEUED | PROCESSING | COMPLETED | FAILED | PARTIAL
TemplateStatus DRAFT | PUBLISHED | ARCHIVED
AuditStage    CONNECTING | FETCHING_HTML | RENDERING | CHECKING_SEO |
              CHECKING_SPEED | INSPECTING_METADATA | REVIEWING_ACCESSIBILITY |
              ANALYZING_MOBILE | CHECKING_CONVERSION |
              PREPARING_RECOMMENDATIONS | GENERATING_REPORT
```

---

## 6. The flows

### 6a. Immutability — three layers

The hardest problem in a configurable audit tool: *an admin edits a check;
what happens to the 10,000 reports already delivered?* This codebase answers it
three times over.

1. **Template versions freeze on publish.** The admin always edits a `DRAFT`.
   Publishing marks it `PUBLISHED` and immediately deep-clones a fresh `DRAFT`
   so editing continues (`publishDraftAction` → `cloneVersionAsDraft`). Every
   report pins its `templateVersionId` at intake.
2. **The crawl is persisted, so re-evaluation never re-crawls.**
   `WebsiteRawData` holds the extracted data *and* the page HTML.
   `evaluateReport()` is explicitly deterministic and idempotent — it deletes
   and rewrites results from stored inputs, producing identical output.
3. **The finished report is snapshotted.** `buildAndStoreSnapshot()` writes a
   denormalized JSON payload. The report UI and any future PDF export read
   *that*, never the live builder tables.

### 6b. Intake → report (the funnel)

```
Landing page URL form
  → POST /api/audits            (URL validated BEFORE the auth check, so a
                                 visitor with an unauditable URL is told so
                                 rather than pushed through a pointless signup)
  → createAudit()
      maintenance_mode gate → 503
      validateAndNormalizeUrl()
      assertPublicHost()        ← SSRF check before any row is written
      resolve requester:
        user      → monthly allowance + one concurrent audit
        anonymous → reuse/mint af_anon cookie, set report expiry
      Website + Report rows, pinning the PUBLISHED template version
      enqueueAuditJob()
  → /analyze/:publicId          progress UI, polls
                                GET /api/reports/:publicId/status
  → /report/:publicId           gated result
  → signup → claimAnonymousReports() transfers reports to the new account
```

Note: `POST /api/audits` currently returns **401** for anonymous visitors and
the client opens a sign-in gate and replays the request. `createAudit()` still
contains the full anonymous path (cookie minting, expiry, per-session
concurrency), so the anonymous funnel is one route change away from live.

### 6c. The audit pipeline — `runAudit(reportId)`

Ten stages, each writing progress to the DB so the progress UI can poll it, and
each writing a line to `SystemExecutionLog` so the dev console can trace it.

| Stage | % | What actually happens |
|---|---|---|
| CONNECTING | 5 | Re-validate URL, re-check SSRF |
| FETCHING_HTML | 12 | `fetchPage()` — static HTML, 15 s timeout, 10 MB body cap, max 5 redirects |
| RENDERING | 22 | **Render decision first** (`render-decision.ts`, static HTML only, scored, threshold via `RENDER_DECISION_THRESHOLD`, default 40) → Playwright render + screenshot **only when warranted**. Skips are logged to `SystemExecutionLog` (category `RENDER`) with the scoring reasons; the stage stays visible either way. **Optional-fail by design.** |
| INSPECTING_METADATA | 32 | `extractFromHtml()` — uses the rendered DOM if >20 % richer. **Safety valve:** if the static snapshot is suspiciously empty (no title + no h1, or <30 words) the pipeline renders after all — a blank report is worse than a wasted render. |
| CHECKING_SEO | 42 | robots.txt, sitemap, broken links (15 sampled, concurrency 5) → **persist raw-data checkpoint** |
| CHECKING_SPEED | 55 | PageSpeed Insights, both strategies, 90 s timeout |
| REVIEWING_ACCESSIBILITY → PREPARING_RECOMMENDATIONS | 68–90 | **Progress-only stages — no work runs here** |
| GENERATING_REPORT | 96 | `evaluateReport()` + `buildAndStoreSnapshot()` |
| — | 100 | `COMPLETED`, or `PARTIAL` if PSI returned nothing |

Rendering failing does **not** fail the audit — static HTML plus PSI covers
most checks. Deliberate resilience call.

**Render economics (B.10, measured 2026-07-31 — `docs/RENDER-STUDY.md`):** a
render costs 8.8 s mean / 16.3 s p95 and 200–400 MB; across a 55-site sample
only ~24 % of renders made the DOM meaningfully richer, and the strongest
predictor of a genuine client-rendered shell is simply `staticWordCount < 30`.
The decision threshold ships at 40; per-audit metrics land on
`WebsiteRawData.renderMetrics` and roll up in the Pipeline Console header
(render rate / benefit rate / durations / browser mode). The screenshot is
captured only when a render runs anyway — `Report.screenshotUrl` is currently
displayed nowhere in the UI, so it never justifies launching a browser. The
remote-browser path (`BROWSER_WS_ENDPOINT` → `connectOverCDP`) installs the
same route-interception SSRF guard as local launch, because the guard is bound
to the browser *context*, not the transport.

---

## 7. The criteria engine — full vocabulary

Three pure stages, shared by the report engine and the admin's live test tool.

```
AuditCriteria + crawl snapshot
        │
        ▼
[1] extract-value.ts   → { kind: string | number | boolean | unavailable }
        │
        ▼
[2] evaluate.ts        → PASS | WARNING | FAIL | ERROR | NOT_APPLICABLE
        │
        ▼
[3] interpolate.ts     → "Your LCP is 3200ms — above the recommended 2.5s."
```

### 7a. The two-band design

Each criterion has a *pass* band and an optional *warn* band:

```
LCP  ≤ 2500ms          → PASS
     ≤ 4000ms (warn)   → WARNING
     otherwise         → FAIL
```

Both bands are just `operator + expectedValue/minValue/maxValue` columns —
fully admin-configurable. **Without a `warnOperator` a check can only PASS or
FAIL**, no matter what the WARNING message says.

### 7b. Status semantics

| Status | Scores as | Meaning |
|---|---|---|
| PASS | 1.0 | The pass band matched |
| WARNING | 0.5 | Pass band missed, warn band matched |
| FAIL | 0.0 | Neither matched |
| NOT_APPLICABLE | excluded | PSI data absent — deliberately not penalized |
| ERROR | excluded | Misconfigured check — never punishes the customer |

`ERROR` means the value could not be extracted (missing/invalid selector,
missing config, unsupported type) or the operator was undecidable.

### 7c. Scoring

```
per check    earned = score × weight × factor      (PASS 1, WARNING 0.5, FAIL 0)
             the max (score × weight) only enters the denominator when the
             status is PASS/WARNING/FAIL — ERROR and NOT_APPLICABLE drop out of
             both sides
per section  sectionPercent = Σ earned / Σ max × 100
overall      weighted average of section PERCENTAGES by section.weight, so a
             section's check count never distorts its influence
grade        from the `score_ranges` system setting — configurable, not hardcoded
```

- Sections with `contributesToScore = false` are shown but excluded from the
  overall score.
- **Critical issue count**: a FAILING check with severity `CRITICAL`.
- **Quick win**: a FAIL/WARNING whose severity is `LOW` or `MEDIUM` — high
  impact-to-effort, drives the "fix these three things first" UX.
- Severity never changes the arithmetic; use `score`/`weight` for that.

### 7d. Inspection types (34)

`yields` is the value kind handed to the operator; `needs` is required config.

**DOM / selector-based**
| Type | Yields | Needs |
|---|---|---|
| `ELEMENT_EXISTS` | boolean (selector matched ≥1) | selector |
| `ELEMENT_NOT_EXISTS` | boolean (matched nothing) | selector |
| `ELEMENT_COUNT` | number | selector |
| `ATTRIBUTE_EXISTS` | string (attr on first match) | selector + attributeName |
| `ATTRIBUTE_EQUALS` | string (same extraction) | selector + attributeName |
| `ATTRIBUTE_CONTAINS` | string (same extraction) | selector + attributeName |
| `TEXT_EXISTS` | string (first match's text, or whole `<body>`) | — |
| `TEXT_CONTAINS` | string (same as above) | — |
| `TEXT_LENGTH` | number (chars; page title when no selector) | — |

**Well-known extracted fields**
| Type | Yields |
|---|---|
| `META_TAG` | string — config `{"tag":"title"}` or `{"name":"description"\|"robots"\|"viewport"\|any}` |
| `CANONICAL_TAG` | string |
| `ROBOTS_META` | string |
| `MOBILE_VIEWPORT` | string |
| `HEADING_HIERARCHY` | boolean (no level skipped) |
| `IMAGE_ALT_TEXT` | number — **count of images MISSING alt**, so 0 is good |
| `BROKEN_LINKS` | number — broken links among probed links |
| `FORM_FIELD` | number — forms on the page |
| `CTA_CHECK` | number — action-oriented buttons/links |
| `STRUCTURED_DATA` | boolean — any JSON-LD |
| `SCHEMA_TYPE` | boolean with `{"schemaType":"Organization"}`; otherwise a comma-joined string of all types |

**Network-level**
| Type | Yields |
|---|---|
| `HTTP_STATUS` | number (final status) |
| `REDIRECT_CHECK` | number (redirects followed) |
| `SSL_CHECK` | boolean (final URL was HTTPS) |
| `RESPONSE_HEADER` | string — header name in `attributeName` or `{"header":"..."}`, lowercase |
| `ROBOTS_TXT_CHECK` | boolean |
| `SITEMAP_CHECK` | boolean |

**Generic evaluators (read the snapshot by path)**
| Type | Yields |
|---|---|
| `BOOLEAN_CHECK` | boolean — `{"path":"trust.hasPrivacyPolicyLink"}` |
| `NUMERIC_COMPARISON` | number — `{"path":"content.wordCount"}` |
| `STRING_COMPARISON` | string — `{"path":"page.title"}` |
| `REGEX_EVALUATOR` | string — `{"path":"robots.content"}`, or the first 200 000 chars of raw HTML when no path. Pair with `MATCHES_REGEX` + `regexPattern` |
| `RULES_EVALUATOR` | whatever the rule returns — `{"rules": …}` |

**PageSpeed**
| Type | Yields |
|---|---|
| `PSI_METRIC` | number — `{"strategy":"mobile"\|"desktop","metric":"fcp_ms"\|"lcp_ms"\|"tbt_ms"\|"cls"\|"speed_index_ms"\|"tti_ms"\|"inp_ms"\|"server_response_ms"}`. Defaults mobile + lcp_ms. `NOT_APPLICABLE` when PSI data is missing |
| `LIGHTHOUSE_SCORE` | number 0–100 — `{"strategy":…,"category":"performance"\|"accessibility"\|"best-practices"\|"seo"}` |

**Not implemented — always ERROR. Never use.**
`HTML_VALIDATION`, `API_CHECK`

### 7e. Operators (16)

| Operator | Meaning |
|---|---|
| `EXISTS` / `NOT_EXISTS` | value present and non-empty / absent or empty |
| `IS_TRUE` / `IS_FALSE` | boolean true/false (non-booleans fall back to non-empty/empty) |
| `EQUALS` / `NOT_EQUALS` | vs `expectedValue`; numeric when both sides are numeric, else string honouring `caseSensitive` |
| `CONTAINS` / `NOT_CONTAINS` | substring of `expectedValue` |
| `STARTS_WITH` / `ENDS_WITH` | string prefix / suffix |
| `GREATER_THAN` / `LESS_THAN` | `> minValue` / `< maxValue` (falls back to `expectedValue` read as a number) |
| `GREATER_THAN_OR_EQUAL` / `LESS_THAN_OR_EQUAL` | `>= minValue` / `<= maxValue` |
| `BETWEEN` | `minValue <= n <= maxValue`, inclusive; an omitted bound is unbounded |
| `MATCHES_REGEX` | vs `regexPattern` (or `expectedValue` if no pattern) |

### 7f. Data paths (the snapshot shape)

Dot paths into the stored inspection snapshot. Used in `configJson.path` and in
`RULES_EVALUATOR` `{"var":"…"}`. **Nothing outside this list exists** — an
unknown path evaluates to empty.

| Namespace | Fields |
|---|---|
| `page` | `title`, `titleLength`, `metaDescription`, `metaDescriptionLength`, `metaRobots`, `canonicalUrl`, `language`, `charset`, `faviconUrl`, `viewport`, `hasViewport` |
| `headings` | `h1` (string[]), `h2`, `h3`, `h1Count`, `h2Count`, `h3Count`, `hierarchyValid` |
| `images` | `count`, `missingAltCount`, `emptyAltCount` |
| `links` | `internalCount`, `externalCount`, `nofollowCount` |
| `social` | `hasOgTitle`, `hasOgImage`, `hasTwitterCard`, `socialProfileLinks` (string[]), `openGraph` (object), `twitterCard` (object) |
| `structuredData` | `jsonLdBlocks`, `schemaTypes` (string[]), `hasStructuredData` |
| `content` | `wordCount`, `textToHtmlRatio` (0–1), `paragraphCount` |
| `conversion` | `formCount`, `buttonCount`, `ctaCount`, `ctaExamples` (string[]) |
| `contact` | `hasEmail`, `hasPhone`, `emails` (string[]), `phones` (string[]) |
| `trust` | `hasPrivacyPolicyLink`, `hasTermsLink`, `hasCookieNotice`, `hasTestimonialSignals`, `hasGuaranteeSignals`, `hasPricingSignals`, `hasShippingSignals`, `hasReturnPolicySignals` — all boolean |
| `resources` | `scriptCount`, `externalScriptCount`, `inlineScriptCount`, `stylesheetCount`, `inlineStyleCount`, `fontLinkCount`, `iframeCount` |
| `network` | `httpStatus`, `finalUrl`, `redirectCount`, `usedHttps`, `htmlSizeBytes`, `hasCompression`, `hasCacheHeaders`, `responseHeaders` (object, lowercase keys), `securityHeaders.strictTransportSecurity` / `.contentSecurityPolicy` / `.xContentTypeOptions` / `.xFrameOptions` / `.referrerPolicy` / `.permissionsPolicy` |
| `robots` | `exists`, `content` (first 5 KB), `referencesSitemap`, `disallowsAll` |
| `llms` | `/llms.txt` (all platforms): `exists`, `content` (first 5 KB), `sizeBytes` |
| `sitemap` | `exists`, `url`, `urlCount`, `childSitemaps` (string[] of index children) |
| `brokenLinks` | `checkedCount`, `brokenCount` |
| `images` (E.4 additions) | `shopifyCdnCount`, `withWidthParamCount` (responsive `?width=` param — the Shopify mobile-LCP check is the ratio of these two), `lazyLoadedCount`, `eagerAboveFoldCount` (first 3 imgs not lazy), `withDimensionsCount` (CLS), `avgSrcsetEntries` |
| `resources` (E.3 additions) | `preconnectHosts` (string[]), `dnsPrefetchHosts` (string[]), `preloadCount`, `hasShopifyCdnHint` |
| `shopify.urls` | `hasCollectionScopedProductLinks` (the `/collections/x/products/y` duplicate-content shape), `variantParamLinkCount`, `filterParamLinkCount`, `paginationLinkCount` |
| `shopify.sitemapChildren` | string[] — `sitemap_products_1.xml`, … |
| `shopify.policies` | **Shopify only** (absent elsewhere): per page (`refund`, `privacy`, `terms`, `shipping`, `legalNotice`): `exists`, `httpStatus`, `title`, `h1`, `wordCount`; aggregates `presentCount` (0–5), `thinCount` (<100 words), `duplicateTitleH1Count` (title === h1, the Shopify default failure). 5 sequential probes, 5 s each, 20 s group budget, best-effort. |
| `shopify.product` | **Only when the audited page carries Product JSON-LD** — absent on a homepage: `hasProductSchema`, `schemaHasOffers`, `schemaHasPrice`, `schemaHasAvailability`, `schemaHasCurrency`, `hasAggregateRating`, `imageCount`, `hasSizeGuide`, `hasShippingInfo`, `hasReturnsInfo` |

**Absent ≠ false.** `BOOLEAN_CHECK` / `NUMERIC_COMPARISON` /
`STRING_COMPARISON` on a path that does not exist in the snapshot resolve
**NOT_APPLICABLE** (excluded from scoring), not `false`/ERROR — a product-page
signal missing on a homepage must never read as a failure. A stored
`null`/`false` is a real negative and evaluates normally.
| `site` | Platform detection (`detect-platform.ts`): `platform` (`SHOPIFY \| HYDROGEN \| WORDPRESS \| WOOCOMMERCE \| WEBFLOW \| WIX \| SQUARESPACE \| NEXTJS \| UNKNOWN`), `platformConfidence` (0–1), `isShopify` (SHOPIFY or HYDROGEN), `plusLikelihood` (`unknown \| possible` — **never assert Plus**, there is no reliable external signal), `themeName`, `themeId`, `isOfficialTheme`, `appCount`, `appNames` (string[]), `appScriptHosts` (string[]), `blockingAppScripts`. Absent on pre-pivot snapshots — paths then resolve null. |

### 7f-bis. `appliesWhen` — conditional applicability (the Shopify pivot)

`ReportSection.appliesWhen` and `AuditField.appliesWhen` hold an optional
STRING of JsonLogic (same sandboxed evaluator and whitelist as
`RULES_EVALUATOR` — one expression language, not two; validated at import by
`appliesWhenSchema`).

| Case | Behaviour |
|---|---|
| Absent/empty | always applies |
| Truthy | check runs normally |
| Falsy | result is **NOT_APPLICABLE** — excluded from scoring both sides, shown collapsed in the report, **never a FAIL** |
| Invalid | **fails OPEN** (check runs) + a WARN in `SystemExecutionLog` |
| Section-level falsy | every check inside NOT_APPLICABLE; section recorded in `scoreBasis.excludedSections` with reason `NOT_APPLICABLE_PLATFORM` |

Every Shopify-specific section must carry
`{"var":"site.isShopify"}` so it can never fail a WordPress site. The builder
edits gates on sections and checks, they round-trip through JSON
import/export, and the criterion test tool reports whether the gate passed on
the tested URL (with the detected platform). Platform-gated exclusions do NOT
trigger the "score not comparable" warning — the report shows the honest
"this isn't a Shopify store" banner instead.

### 7g. RULES_EVALUATOR

A sandboxed JsonLogic-style expression for checks needing more than one value.
Put it in `configJson` as `{"rules": …}` and pair it with `IS_TRUE` (boolean
result) or a numeric operator.

- **Allowed operations only**: `var`, `==`, `===`, `!=`, `>`, `<`, `>=`, `<=`,
  `!`, `and`, `or`, `in`, `length`, `cat`, `substr`. Anything else is rejected
  on import. No arithmetic, no loops, no function calls.
- Max nesting depth 15 (import validation) / 20 (runtime guard).
- `{"var":"page.titleLength"}` reads a data path; a missing path returns `null`.

```jsonc
// boolean
{"rules":{"and":[{"var":"trust.hasPrivacyPolicyLink"},
                 {"var":"trust.hasCookieNotice"},
                 {"!":{"var":"robots.disallowsAll"}}]}}

// numeric comparison — returns a boolean, so pair with IS_TRUE
{"rules":{">":[{"length":[{"var":"headings.h1"}]},0]}}
```

### 7h. Message interpolation

`AuditSuggestion.message` / `.suggestion` support these placeholders, which are
HTML-escaped on render:

`{{domain}}`, `{{actualValue}}`, `{{expectedValue}}`, `{{count}}`,
`{{minimum}}`, `{{maximum}}`, `{{pageTitle}}`, `{{sectionName}}`

### 7i. Common mistakes

- Passing `configJson` as an object. **It must be a JSON string.**
- Using `expectedValue` for numeric comparisons — `GREATER_THAN` / `LESS_THAN`
  / `BETWEEN` read `minValue` / `maxValue`.
- Using `IS_TRUE` on a count. `IMAGE_ALT_TEXT` and `BROKEN_LINKS` yield numbers
  where 0 is good, so the pass band is usually `EQUALS 0` or
  `LESS_THAN_OR_EQUAL` with `maxValue`.
- Forgetting `selector` on an `ELEMENT_*` / `ATTRIBUTE_*` check — the check
  ERRORs instead of failing.
- Writing a WARNING message with no `warnOperator` — unreachable status.
- Expecting `HTML_VALIDATION` or `API_CHECK` to work.

---

## 8. The builder — sections, JSON import/export, merge

`/master-admin/builder`. Server actions live in
`src/app/master-admin/builder/actions.ts`; the merge/bulk engine lives in
`src/services/builder/import-export.ts`.

### 8a. Editing

Sections and checks are CRUD'd against the current DRAFT. Reorder, duplicate,
enable/disable, soft-delete. System sections (`isSystem`) cannot be deleted,
only disabled. **Publish** freezes the draft and clones a new one.

**Test a criterion against a live URL**: rate-limited to 20/hour per admin,
runs the real extract→evaluate path with PSI stubbed out — fast and honest.

### 8b. JSON import — three accepted shapes

1. A single section object
2. An array of sections: `[{…}, {…}]`
3. The export envelope: `{ "sections": [ … ] }`

Up to 50 sections per file. **Validation runs over the whole file first: if any
section or check is invalid, nothing is written.** Errors name the section and
check index.

### 8c. Merge-on-duplicate (the important behaviour)

Importing a section that already exists never creates a second copy and never
silently overwrites it.

| Aspect | Behaviour |
|---|---|
| Matching | `slug` first, then `name` (case-insensitive). Soft-deleted sections are **restored**, not duplicated |
| The main section | Its own settings (name, weight, icon, planAccess, descriptions) are **left exactly as they are**. Opt in with the "Overwrite the section's own settings" checkbox — off by default |
| New checks | Appended as a **sub-section**: they all get the same `category`, and the builder renders one group header for them |
| Existing checks | A check whose `fieldKey` already exists *is* that check, so it is rewritten in place (criteria, messages, labels, scoring) and stays in the group it is in. Untick "Update checks that share a field key" to leave stored checks untouched |
| Group label | `subSection` if set → else the incoming section `name` when it differs → else the incoming `shortDescription` → else `Set N` |
| Per-check override | A check's own `category` always wins over the group label — which is why an exported file re-imports with its groups intact |

The import reports exactly what it did per section: created/merged, group name,
checks added / updated / untouched.

### 8d. JSON export

**Export JSON** downloads the entire draft in the envelope shape —
`configJson` serialized as a string, per-check `category` included — so
export → edit in an AI chat → import back round-trips losslessly. Checks with
no criteria row are omitted (they could not be re-imported) and the count is
reported.

### 8e. Section JSON shape

```jsonc
{
  "name": "Custom Security & Privacy",     // required, 2–80
  "slug": "custom-security",               // required, 2–60, lowercase-dashes
  "subSection": "Consent banner",          // optional, ≤60 — merge group label only
  "shortDescription": "…",                 // ≤200
  "detailedDescription": "…",              // ≤2000
  "icon": "shield",                        // whitelist, see below
  "weight": 1.5,                           // 0–10, default 1
  "contributesToScore": true,
  "planAccess": "BOTH",                    // FREE | PREMIUM | HIDDEN | BOTH
  "isEnabled": true,
  "defaultExpanded": true,
  "visibleInReport": true,
  "accentColor": "#059669",                // exactly 6 hex digits
  "adminNotes": "…",                       // ≤1000, internal only
  "fields": [
    {
      "name": "HTTPS Enforced",            // required, 2–100
      "fieldKey": "custom_security.https", // required, [a-z0-9_.], unique in section
      "description": "…",                  // ≤500
      "category": "Transport",             // ≤60 — the sub-section header
      "planAccess": "BOTH",
      "severity": "HIGH",                  // CRITICAL|HIGH|MEDIUM|LOW|INFORMATIONAL
      "score": 1,                          // 0–100, default 1
      "weight": 1,                         // 0–10, default 1
      "passLabel": "Pass", "failLabel": "Fail", "warningLabel": "Partial",
      "helpArticleUrl": "https://…",       // must be a full URL
      "isEnabled": true,
      "adminNotes": "…",
      "criteria": {                        // required
        "inspectionType": "SSL_CHECK",
        "dataSource": "NETWORK",           // HTML|RENDERED_DOM|HEADERS|PSI|ROBOTS|SITEMAP|NETWORK
        "selector": "", "attributeName": "",
        "operator": "IS_TRUE",
        "expectedValue": "", "minValue": 0, "maxValue": 0,
        "regexPattern": "", "caseSensitive": false,
        "warnOperator": "EXISTS",          // optional — enables the WARNING band
        "warnExpectedValue": "", "warnMinValue": 0, "warnMaxValue": 0,
        "configJson": "{}"                 // ⚠ a STRING containing JSON, ≤5000
      },
      "messages": {                        // required — all three keys
        "PASS":    { "message": "…", "suggestion": "…" },
        "FAIL":    { "message": "…", "suggestion": "…" },
        "WARNING": { "message": "…", "suggestion": "…" }
      }
    }
  ]
}
```

Icon whitelist: `gauge`, `search`, `settings-2`, `accessibility`, `smartphone`,
`shield`, `trending-up`, `layout`, `file-text`, `share-2`, `code-2`, `image`,
`link`, `form-input`, `badge-check`, `shopping-cart`, `sparkles`, `map-pin`,
`zap`, `globe`.

Zod strips unknown keys, so underscore-prefixed documentation keys
(`_README`, `_PROMPT_FOR_AI`, `_REFERENCE`) import cleanly and are discarded.
`scripts/check-sample-section.ts` guards that the sample stays importable.

Imported sections land in the DRAFT and are **not live until you press
Publish**.

---

## 9. Plan gating is a real server boundary

`src/services/reports/project-report.ts` is the security-relevant file.

Locked premium content is reduced to a **title-only stub before
serialization**. Detected values, messages, suggestions and evidence for locked
checks never reach a free viewer's browser. As the code comment puts it: *"the
blur is real absence."*

| planAccess | FREE viewer | PREMIUM viewer |
|---|---|---|
| `BOTH` / `FREE` | full | full |
| `PREMIUM` | locked stub | full |
| `HIDDEN` | omitted | omitted |

Related: the unguessable 21-char `publicId` is deliberately **not** sufficient
by itself. `getReportForViewer()` (`services/reports/access.ts`) requires
session ownership, a matching anonymous cookie (only while unclaimed and
unexpired), or `MASTER_ADMIN`.

---

## 10. Security posture

- **SSRF** — DNS-resolution checks at intake *and* again before fetch; the
  fetcher installs a guarded undici agent; Playwright route-interception aborts
  subresource requests to raw private IPs. Blocked ranges are enumerated in
  `src/lib/security/ssrf.ts` for both IPv4 and IPv6.
- **URL handling** — `validateAndNormalizeUrl()` caps length at 2048, normalizes
  scheme/host, and returns a typed result. No unvalidated string ever reaches
  fetch.
- **Passwords** — argon2id.
- **Tokens** — every token (verification, reset, anonymous session) is stored as
  a SHA-256 hash; the raw value only exists in the email or the cookie.
- **Account protection** — `failedLoginAttempts` + `lockedUntil`.
- **Sessions** — JWT is primary; the `Session` table is a revocation registry.
  The `jwt` callback deliberately does **not** trust client-supplied `update()`
  values — plan/verification are re-read from the DB in `auth.ts`, so a spoofed
  update cannot grant Premium.
- **Stripe** — signature-verified webhooks with a `StripeWebhookEvent`
  idempotency ledger.
- **QStash worker** — refuses to run without signing keys (503) and rejects
  missing/invalid signatures (401).
- **Admin** — middleware is a coarse gate; every admin page, server action and
  route handler re-verifies the role server-side. Every mutation writes to
  `AdminActivityLog` with before/after payloads.
- **Rate limits** — Upstash Redis with an in-memory fallback: 10 audits/hour per
  user (`audit:user:*`), 20 criterion tests/hour per admin (`admin:test:*`),
  and per-IP limits on the auth-gate actions (20 / 15 min for the check,
  10 / 15 min for the gate itself).
- **Headers** — X-Frame-Options DENY, nosniff, Referrer-Policy,
  Permissions-Policy (set in `next.config.ts`).

---

## 11. Admin surface (`/master-admin`)

| Route | Purpose |
|---|---|
| `/` | Overview |
| `/builder` | The heart — sections, checks, criteria, suggestions, reorder, duplicate, **JSON import/export with merge**, publish, **test a criterion against a live URL** |
| `/users` | Role/plan management |
| `/settings` | System settings + PageSpeed API key |
| `/reports` | All reports across users |
| `/logs` | `SystemExecutionLog` + `AdminActivityLog` viewer, filterable |
| `/dev` | **Pipeline Console — development only** (see below) |

### The Pipeline Console (`/master-admin/dev`)

A live trace of what the audit engine is doing. Give it a URL, press **Run &
trace**, and watch:

- **Stage timeline** for all 11 stages with what each one actually does. A run
  killed mid-flight shows the stage it died on as *stopped*, not a spinner.
- **Live console** tailing `SystemExecutionLog` every 1.5 s: timestamp, level,
  category, message, duration; click a line to expand `meta` and the stack
  trace. Level filters, pause/resume, follow-output, download-as-JSON, clear.
- **Artefact row** — raw crawl data, screenshot, PageSpeed rows, section
  results, check results, snapshot. The honest completion check.
- **Actions** — re-queue a stuck report, force-fail it, scope the tail to any
  recent report or system-wide.
- Header shows env, dispatch mode (QStash vs inline), and whether a PSI key is
  configured.

**Gating**: `MASTER_ADMIN` **and** `isDevToolsEnabled()` (`src/lib/dev/tools.ts`)
— on outside production, and in production only with `DEV_TOOLS_ENABLED=true`.
The sidebar link, the page, the trace API and every action check independently.
URL validation and the SSRF check always run; the "bypass limits" checkbox only
skips the monthly allowance and the one-audit-at-a-time rule.

---

## 12. Background jobs, failure taxonomy, and the watchdog

`enqueueAuditJob()` (`services/jobs/enqueue.ts`) publishes to Upstash QStash,
which calls back into `POST /api/jobs/run-audit` with a signed request. QStash
is used only when `QSTASH_TOKEN` and a non-localhost `NEXT_PUBLIC_APP_URL` are
both set. `QSTASH_URL` overrides the publish endpoint — the historical
`404 … user not found in this region (eu-central-1)` failure is a
token/endpoint region mismatch, fixed by pointing `QSTASH_URL` at the token's
regional endpoint.

**There is no silent fallback anymore.** Dispatch resolution
(`getDispatchMode()`, surfaced in the Pipeline Console header):

| Situation | Behaviour |
|---|---|
| QStash configured, publish OK | durable dispatch |
| QStash fails / unconfigured, **long-lived server** (dev, self-hosted) | inline `void runAudit()` — legitimate there |
| QStash fails / unconfigured, **serverless** (`VERCEL` / `AWS_LAMBDA_FUNCTION_NAME`) | report FAILS immediately with `failureCategory: SYSTEM` and a clear log line — never dies silently at 42 % |

**Failure taxonomy** — `Report.failureCategory` (`SYSTEM | USER_INPUT |
TARGET_SITE`). SYSTEM = our fault (dispatch failure, reaped orphan, crash);
the allowance count in `services/audits/allowance.ts` excludes
`FAILED + SYSTEM` reports, which *is* the refund — there is no counter to
decrement. USER_INPUT (bad URL, SSRF-blocked) and TARGET_SITE (unreachable
site) still consume the credit.

**Watchdog** — `reapStuckReports()` (`services/jobs/reap.ts`), driven by
`GET/POST /api/cron/reap` every 5 minutes (`Authorization: Bearer
<CRON_SECRET>`; 503 when unset). A `QUEUED`/`PROCESSING` report idle > 15
minutes is re-queued and re-dispatched **once** (`retryCount` 0 → 1); a second
death goes terminal `FAILED + SYSTEM` with a user-facing message confirming no
credit was charged. Every action logs to `SystemExecutionLog` with
`meta.watchdog: true`.

**Long transactions** — `evaluateReport()`'s persist step runs on `dbLong`
(`src/lib/db/long-client.ts`), a Prisma client on `DATABASE_URL_UNPOOLED`, so
the multi-second transaction owns its connection and can no longer die with
`Transaction not found` at 96 %. Everything else stays on the pooled `db`.

---

## 13. Settings and environment

### System settings (`SystemSetting`, typed KV with defaults in `services/settings/get.ts`)

| Key | Default |
|---|---|
| `product_name` | `AuditFlow` |
| `support_email` | `support@example.com` |
| `free_audit_limit` | `3` |
| `premium_audit_limit` | `50` |
| `anonymous_report_expiration_days` | `7` |
| `anonymous_audits_per_hour_ip` | `3` |
| `maintenance_mode` | `false` |
| `score_ranges` | 90–100 Excellent, 75–89 Good, 50–74 Needs Improvement, 0–49 Poor |
| `pagespeed_api_key` | secret — **database wins over env**, see below |

`getSetting()` falls back to the default on a missing row *or a DB error*, so
the app works before seeding.

**Secret settings** (`isSecret: true`) are AES-256-GCM encrypted at rest via
`src/lib/security/secrets.ts` + `services/settings/secret.ts`, keyed by
`SETTINGS_ENCRYPTION_KEY` (32-byte hex). Writes refuse rather than store
plaintext when the key is missing; reads pass legacy plaintext strings through
(migrate them with `scripts/encrypt-secret-settings.ts`). Only masked previews
(`AIza••••••••3f2`) ever reach a browser or a log. The PSI key resolution is
**database first, env `PAGESPEED_API_KEY` second**, read fresh on every call —
a key saved in Master Admin → Settings applies to the very next audit, and the
Settings page has Test key (rate-limited 10/hour/admin) and Clear key.

Allowance resets on the **1st of the calendar month** and counts every report
created that month **except** `FAILED` reports with `failureCategory: SYSTEM`
— system faults refund the credit (§12).

### Environment variables

```
NEXT_PUBLIC_APP_URL, NODE_ENV
DATABASE_URL, DATABASE_URL_UNPOOLED
AUTH_SECRET, AUTH_TRUST_HOST
MASTER_ADMIN_EMAIL, MASTER_ADMIN_INITIAL_PASSWORD   (seed only)
SETTINGS_ENCRYPTION_KEY        32-byte hex — REQUIRED to save secret settings
PAGESPEED_API_KEY              fallback only; the admin-saved key wins
QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY
QSTASH_URL                     regional publish endpoint (region-mismatch fix)
CRON_SECRET                    protects /api/cron/reap (the watchdog)
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
BROWSER_WS_ENDPOINT            (empty in dev → local Playwright)
RESEND_API_KEY, EMAIL_FROM
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
STRIPE_PRICE_PREMIUM_MONTHLY, STRIPE_PRICE_PREMIUM_YEARLY
BLOB_READ_WRITE_TOKEN
DEV_TOOLS_ENABLED              (opt-in for /master-admin/dev in production)
```

### Commands

```
npm run dev          next dev
npm run build        next build
npm run lint         eslint
npm run typecheck    tsc --noEmit
npm run db:generate  prisma generate
npm run db:migrate   prisma migrate dev
npm run db:push      prisma db push
npm run db:seed      tsx scripts/seed.ts
npx tsx scripts/check-sample-section.ts    guard the builder's Sample JSON
```

> **Never run a second `next dev` against this repo while one is already
> running.** Two dev servers share `.next` and clobber each other's build
> manifests — the symptom is a 404 on `/_next/static/css/app/layout.css` and a
> completely unstyled site. Fix: stop all dev servers, delete `.next`, restart.

> One-off diagnostic scripts import `server-only` modules, which throws under
> plain `tsx`. Run them as
> `npx tsx --conditions=react-server scripts/<name>.ts`.

---

## 14. Code conventions

Follow these when proposing changes; the codebase is consistent about them.

- **Server logic lives in `src/services/**`, each module starting with
  `import "server-only"`.** Pages and server actions orchestrate; they do not
  hold business logic.
- **Zod schemas in `src/lib/validation/` are the single source of truth** for
  what may be configured. Validate at the boundary, then trust the parsed type.
- **Every admin server action re-verifies the role** with its own
  `requireAdmin()` — middleware is never the boundary.
- **Every admin mutation writes `logAdminActivity()`** with before/after.
- **Pipeline steps write `logExecution()`** with a category, and optional
  `durationMs` / `meta` / `error`. Both loggers are best-effort and never throw.
- **Soft deletes** (`deletedAt`) everywhere; queries filter `deletedAt: null`.
  Remember the unique constraints do not.
- **Server actions return a discriminated result**, never throw at the UI:
  `{ ok: true, data?, message? } | { ok: false, error, fieldErrors? }`.
- **Client components** are marked `"use client"`, take serialized props (dates
  as ISO strings, `Json` as plain objects), and use `useTransition` +
  optimistic local state for mutations.
- **UI primitives** live in `src/components/ui/`: `Button` (`variant`:
  primary/secondary/ghost, `size`, `loading`), `Input`, `Modal`
  (`open`/`onClose`/`title`/`wide`), `Alert` (`success`/`error`/`info`),
  `Badge` (`draft`/`published`/`enabled`/`disabled`/`system`/`neutral` +
  `planBadgeVariant()` / `severityBadgeVariant()` helpers).
- **Comments explain *why*, not *what*.** The existing comments are load-bearing
  documentation — match that register rather than narrating syntax.
- **Prisma transactions** that do meaningful work pass an explicit
  `{ timeout: 20_000–30_000 }`; Neon's pooled connections will otherwise drop
  long transactions.

---

## 15. Current state (live DB, 2026-07-31)

```
Users:      11  (1 MASTER_ADMIN/PREMIUM, 2 USER/PREMIUM, 8 USER/FREE)
Plans:       2        Settings: 11        Templates: 1     Subscriptions: 0
Versions:   v1 PUBLISHED — 7 sections, 20 checks — 28 reports
            v2 DRAFT     — 8 sections, 25 checks —  0 reports
Websites:   19
Reports:    28 total → 3 COMPLETED, 16 PARTIAL, 5 FAILED, 4 stuck PROCESSING
Snapshots:  16   RawData: 21   PSI rows: 8
Anon sessions: 12   AdminActivityLog: 24   SystemExecutionLog: 272
```

`PARTIAL` means the audit finished but PageSpeed returned nothing — a usable
report minus speed metrics. So **19 of 28 produced a deliverable report; 9 did
not**, and 4 of those will never resolve on their own.

Published v1 sections:

| # | Section | Weight | Access | Checks |
|---|---|---|---|---|
| 1 | Page Speed | 2.0 | BOTH | 3 |
| 2 | SEO | 2.0 | BOTH | 5 |
| 3 | Technical SEO | 1.5 | BOTH | 4 |
| 4 | Accessibility | 1.5 | BOTH | 3 |
| 5 | Mobile Usability | 1.5 | BOTH | 1 |
| 6 | Security | 1.5 | BOTH | 2 |
| 7 | Conversion Optimization | 1.0 | **PREMIUM** | 2 |

### Known gaps

- **Stages 68–90 do no work.** `REVIEWING_ACCESSIBILITY`, `ANALYZING_MOBILE`,
  `CHECKING_CONVERSION`, `PREPARING_RECOMMENDATIONS` only move the progress
  bar. All real work happens at 42 %, 55 % and 96 %. Fine as UX, but the bar's
  pacing is decorative.
- **Thin sections.** Only 1 check in Mobile Usability, 2 in Security.
- **`HTML_VALIDATION` and `API_CHECK` are unimplemented** — they return a clean
  `unavailable` rather than crashing, but any check using them always ERRORs.
- **Sub-sections are builder-only.** `AuditField.category` groups checks in the
  admin UI but the customer-facing report does not render group headers; that
  would need changes to the snapshot payload and the report view.
- **PSI key unset in the current environment**, which is why so many runs end
  `PARTIAL` rather than `COMPLETED`. Reports now disclose this via
  `ReportSnapshot.scoreBasis` (coverage + excluded sections) and a notice in
  the report view.
- **`fieldKey` is a stable machine identifier.** Rename a check's `name`
  freely; treat `fieldKey` as permanent — future finding-tracking keys off it.

### Fixed in the 2026-07-31 reliability pass (Phase 0)

- Orphan watchdog (`/api/cron/reap`, 15-min threshold, one auto-retry) — the
  4 stuck reports were reaped live and all completed on retry.
- No more silent inline fallback on serverless; dispatch failures are terminal,
  loud, and refunded (`failureCategory`).
- `GENERATING_REPORT` transaction moved to the unpooled connection (`dbLong`).
- Secret settings encrypted at rest; PSI key is admin-managed, DB-first,
  masked, testable.
- `scoreBasis` records score coverage honestly.
- Render decision moved **before** the render (B.10): 85 % of browser
  launches eliminated on the study sample, with a safety valve so a blank
  report cannot result. Study: `docs/RENDER-STUDY.md`.

## 16. Forward design notes (recorded, NOT built)

**Phase 5 — browser-side capabilities.** The main audit cannot move to the
browser: CORS blocks reading a third-party site's HTML, headers, robots.txt
and redirect chain, and iframes are blocked by X-Frame-Options/same-origin.
The server-side architecture is correct as it stands. What a browser CAN add
later:

1. **Extension** (host_permissions bypass CORS legitimately) — audit pages a
   cloud crawler can never reach: checkouts, logged-in dashboards, staging
   behind basic auth. The extension would POST an extracted snapshot to an
   authenticated endpoint and the existing engine evaluates it unchanged.
   **Standing constraint on today's code:** keep `runAudit` and the
   `WebsiteRawData`/extraction contract clean enough that a snapshot can
   arrive from a source other than the server fetcher.
2. **RUM snippet** — first-party `web-vitals` script posting real-user
   LCP/CLS/INP; needs its own ingest endpoint, per-site token, rate limiting.
3. **Client-side PDF export** — report data is already in the browser.

**Explicitly rejected:** client-side PSI calls. The client could fabricate
metrics, and untrusted scores are disqualifying for this product.

## 17. The Shopify pivot (2026-07-31)

The product is a **Shopify store auditor** now — landing, metadata, emails and
the report all say so. The engine is unchanged; detection, gating and the
check library carry the positioning:

- **Platform detection** (`services/inspection/detect-platform.ts`) runs in the
  pipeline after the sitemap check and in the criterion test tool; writes
  `extracted.site` (§7f) and the snapshot's `payload.site`. Cheap, no extra
  requests, never fails an audit (UNKNOWN on error).
- **App-script inventory** — third-party script hosts matched against a
  curated Shopify-app map (Judge.me, Klaviyo, Yotpo, …), with blocking-script
  counts. App bloat is the headline Shopify performance story.
- **Progressive leads** (`Lead` model, `services/leads/`): landing intake is
  URL-only. The progress page shows a skippable inline email ask after 15
  seconds; `POST /api/leads/capture` authorizes by anonymous-session ownership
  and is rate-limited to 10/hour/IP. Consent proof stores `consentAt` and
  `consentIpHash`, with one lead per email+domain. Terminal-report races send
  the promised email immediately.

  **The flow is AUTH-FIRST.** `POST /api/audits` returns **401** to anonymous
  callers; the landing form opens a sign-in gate on that status and replays
  the submitted URL once authenticated. URL validation runs BEFORE the auth
  check, so a malformed URL errors inline without demanding a login. Nothing
  is audited, and no `Lead` exists, without a `User`. The lead row is written
  at audit completion (`notify.ts`) — the first moment both the email and the
  domain are known — and is converted from creation, because signing up IS the
  conversion. Admin surface: `/master-admin/leads` shows platform/theme/app
  data, filters, CSV export, and the funnel counters headed by the audit
  completion rate.

  Anonymous infrastructure (`AnonymousSession`, `claimAnonymousReports()`, the
  anonymous branch of `createAudit()`) is left **dormant, not deleted** — six
  legacy anonymous reports still exist and remain readable.
- **No report teaser.** `/report/[publicId]` requires a session (otherwise it
  redirects to `/login?next=/report/<id>`) and then forwards owners into the
  dashboard. There is no anonymous preview to build, because there is no
  anonymous audit. Non-Shopify sites still get a useful universal audit plus an
  honest banner — never a low score from inapplicable checks.
- **Shopify check library**: `docs/shopify-check-library.json` is an importable
  first tranche with 5 sections and 33 checks (builder → Import JSON). It does
  not yet cover every Part C pillar item; `docs/BUILD-ROADMAP.md` tracks the
  remaining supported-now and extractor-dependent checks. Shopify sections use
  `{"var":"site.isShopify"}`; product checks additionally gate on Product
  JSON-LD. Remediation names exact Shopify admin paths and theme files. Guard
  it with `npm run check:shopify-library` before import.

## 18. Phase 2 — the Fix Loop (2026-07-31)

A persistent `Finding` lives on the **Website**; reports are observations.
This is what makes audit N aware audit N-1 existed.

**Identity:** `sha256(fieldKey + ':' + normalizePageUrlForIdentity(url))` —
the normalizer is the ONE shared helper in `src/lib/security/url.ts`, built on
`validateAndNormalizeUrl` so intake and identity can never drift. Renaming a
`fieldKey` orphans its findings (old goes stale, new OPEN appears) — treat
`fieldKey` as permanent (§15).

**Transitions:** pure table in `services/findings/transitions.ts`, exercised
by `scripts/test-finding-transitions.ts` (60 engine + 54 user-action cases).
The load-bearing rule: NOT_APPLICABLE / ERROR **never touch, never create** —
missing data never marks anything fixed. A site migrating off Shopify leaves
its Shopify findings stale (`staleSince`), not "fixed". INFO is unreachable at
check level (section-rollup only) and absent from the table.

**Reconciliation** (`services/findings/reconcile.ts`): after
`evaluateReport()`, before `buildAndStoreSnapshot()`, unpooled client, owned
websites only (§2.10 — anonymous audits skip; claiming seeds via
`services/findings/seed.ts` from signup AND login). `previousReportId`
resolves at reconciliation time. Idempotent via rollback of this report's own
events. Events are written for every observed finding (keeps included) so the
comparison view is pure set ops. Failure is isolated — the report always
completes; retry via the Pipeline Console's "Re-run findings".

**Suppression** (§2.5): WONT_FIX / FALSE_POSITIVE excluded from both sides of
the score like NOT_APPLICABLE, AFTER `appliesWhen` precedence;
`AuditResult.status` keeps the true verdict, `AuditResult.suppressed` flags
the row; a section emptied this way gets `scoreBasis` reason
`ALL_SUPPRESSED`. Verified live: suppress → score rises, un-suppress →
exact original score.

**Pillars (Part F):** `ReportSection.pillar` (six-value enum), explicit slug
mapping in the migration, lossless import/export round-trip (a merge adopts an
explicitly-provided pillar while preserving tuned settings). Snapshot payload
**version 2** adds pillar/weight per section and category per check; v1
snapshots render the flat path. Report renders pillar → section →
sub-section → check with weighted pillar aggregates honouring `scoreBasis`.

**Surfaces:** `/dashboard/websites/[id]` (Fix List default tab, trend chart
with coverage-marked points, Reports, Settings/schedule),
`/dashboard/reports/[publicId]/compare` (seven buckets, score-basis guard +
like-for-like), live finding badges on old reports (frozen status + "verified
fixed since"), delta email from the editable `audit_delta` EmailTemplate
(sent only with a `previousReportId`, respects `User.auditEmailsEnabled`,
`/unsubscribe?type=audit`), `/api/cron/schedule` (CRON_SECRET, hourly;
FREE→monthly max, PREMIUM→weekly; skip-notify-once on exhausted allowance;
downgrade never leaves weekly running on FREE). Funnel gains
`delta_email_sent` + `comparison_viewed`. One in-flight audit per OWNED
website is enforced at intake.
