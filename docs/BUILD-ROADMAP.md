# AuditFlow — Build Roadmap and Specification Precedence

This file is the durable handoff for what has been requested, what is already
built, and what should happen next. Read it with `docs/AI-CONTEXT.md` before
starting another phase.

It reconciles these three source specifications supplied on 2026-07-31:

- `auditflow-build-spec-v3.md` — reliability, lead engine, Fix Loop, report
  depth, and the complete target user flow.
- `auditflow-shopify-pivot-prompt.md` — Shopify positioning, platform
  detection, conditional applicability, and the required Shopify check-library
  coverage.
- `auditflow-part-d-e-prompt.md` — progressive lead capture and the snapshot
  extractors needed by that library.

The original copies were supplied outside the repository. This document records
their decisions so future work does not depend on files in a Downloads folder.

## 1. Precedence when the specifications conflict

Later decisions override earlier ones:

1. The real repository and verified production behaviour are the source of
   truth for what exists.
2. The Part D/E prompt overrides the older Phase 1 email timing. Email is **not
   required on the landing page**; it is requested inline during progress and
   captured again at signup when necessary.
3. The Shopify pivot overrides build-spec v3 where v3 calls platform detection
   and `appliesWhen` out of scope. Both are required and already built.
4. The Shopify pivot's Part C defines the desired check-library coverage. Part
   E only supplies a subset of the extractors needed for that target.
5. Multi-page sampling remains postponed until after the Fix Loop. Do not force
   homepage-only data into false product, collection, policy, or blog verdicts.

## 2. Current delivery status

| Workstream | Status | Durable evidence |
|---|---|---|
| Phase 0 — reliability/configuration | Complete and live-verified | Watchdog, failure taxonomy/refunds, durable dispatch behaviour, unpooled report transaction, score basis, DB-first encrypted secrets, PSI testing |
| B.10 render economics | Complete | `docs/RENDER-STUDY.md`, pre-render decision, safety valve, browser availability warning and Pipeline Console status |
| Part A — platform detection and `appliesWhen` | Complete and live-verified | `detect-platform.ts`, section/check gates, JSON round-trip, platform exclusions, non-Shopify handling |
| Part B — Shopify positioning and lead foundation | Complete, then revised by Part D, then by the auth-first revert | Shopify copy, platform-aware lead/admin/report context |
| Part D — progressive lead capture | Complete and live-verified | URL-only start, 15-second inline ask, ownership-authorized capture endpoint, signup fallback, terminal race handling, six funnel counters |
| Part E — Shopify snapshot extractors | Complete and live-verified | Policies, `llms.txt`, hints, images, product signals, URL signals, absent-path semantics |
| Part C — Shopify check library | **In progress** | `docs/shopify-check-library.json` is a validated first tranche: 5 sections, 33 checks. It has not been imported into the live draft and does not yet cover every C.1 item. |
| Phase 2 — Fix Loop | Not started | No `Finding`, `FindingEvent`, reconciliation, comparison, suppression, or scheduling models/services exist yet |
| Phase 3 — report depth/presentation | Not started | No pillars, customer-facing sub-section headers, Fix List, live finding badges, or comparison UI |
| Phase 4 — AI content analysis | Design only; do not build yet | Preserve the one-call-per-audit, stored-result architecture described below |

## 3. Completed decisions that must not regress

- Landing intake is one URL field and one button on one line. Anonymous audit
  creation does not require email.
- The progress email ask appears after about 15 seconds, is inline and
  skippable, and never delays or holds a report hostage.
- Transactional report/failure email is separate from unticked marketing
  consent. Ownership, not knowledge of a public ID, authorizes lead capture.
- A terminal audit race sends the promised email immediately.
- **Superseded by the auth-first revert:** there is no anonymous audit and no
  teaser. An account is required before a URL is queued, and the lead is written
  at audit completion. `email_captured_progress` and `teaser_viewed` are retired
  — historical rows stay readable, nothing records them. The live counters are
  `audit_started`, `email_captured_signup`, `audit_completed`,
  `signup_completed`, `delta_email_sent`, and `comparison_viewed`; the headline
  is the audit completion rate over 30 days.
- Non-Shopify visitors are never rejected. Universal sections run, Shopify
  sections resolve `NOT_APPLICABLE`, and their score excludes those sections.
- Never claim a store is Shopify Plus. `plusLikelihood` is only `unknown` or
  `possible`.
- Section and field applicability use the existing sandboxed JsonLogic
  evaluator. Gate errors fail open and log; there is no second expression
  language.
- An absent snapshot path is not `false`. Generic boolean, numeric, and string
  path checks return `NOT_APPLICABLE` when a path is missing. Stored `false` or
  `null` remains a real observed value.
- Product signals exist only when Product JSON-LD exists. A homepage must not
  fail product checks merely because it is not a product page.
- Added Shopify requests remain bounded to five policy probes plus `llms.txt`,
  all through the guarded fetch path and all best-effort.
- Keep opportunistic screenshots. They are intended for the Phase 3 report/PDF
  and lead surfaces.
- Preserve import/export merging, template pinning, plan stripping before
  serialization, SSRF protection, user/admin tools, and the Pipeline Console.

## 4. Part C coverage audit

The current JSON is useful and importable, but it is not the entire check
library promised by the Shopify pivot. Treat it as tranche 1.

| Pillar | In the current JSON | Still required or only partially represented |
|---|---|---|
| Foundations | Collection-scoped product links; page-local variant/filter/pagination volume; Shopify child-sitemap discovery | Parameter canonical/noindex correctness, deliberate `/collections/all` handling, Shopify-default vs customized `robots.txt.liquid`, explicit presence of all four sitemap child types |
| Speed & vitals | App-host count, blocking app scripts, Shopify CDN hint, responsive widths, dimensions, srcset, eager/lazy image loading | Theme JS bundle weight, font origin, fuller Shopify-CDN coverage; these need additional stored signals before honest checks can be authored |
| On-page content | Policy title/H1 duplication plus the existing universal title/meta/H1 checks | Product and collection description quality, template-default metadata, collection descriptions, blog presence/recency; these are page-type or multi-page checks |
| AI answer engines | `llms.txt`, core Product offers/price/availability/currency, aggregate rating, structured-data presence | Product condition, Review schema, BreadcrumbList, Organization/Store, named AI-bot access, and server-rendering evidence. Some can use existing paths and need JSON; others need extraction work. |
| Trust & compliance | Four core policies, aggregate policy coverage/depth, duplicate policy title/H1 | Individual legal notice/imprint rules, Contact/About discovery, cookie consent, regional applicability. Some weak homepage signals exist; page discovery is still missing. |
| Conversion UX | Product shipping/returns language, product image count, size guidance | Payment/trust badges, visible reviews, add-to-cart above the fold, free-shipping threshold. Current snapshot signals are incomplete or too weak for confident verdicts. |
| Universal fallback | Existing draft sections cover speed, SEO, technical SEO, accessibility, mobile, security, and conversion; the new JSON adds universal AI Discoverability | Thicken thin universal sections during Phase 3 and preserve their lack of a Shopify gate |

Do not disguise a missing capability as a numeric proxy. For example, counting
`?variant=` links is not the same as verifying that each variant URL
canonicalizes correctly. The report copy must state what was actually measured.

## 5. Immediate next sequence

1. **Finish Part C's supported-now checks.** Extend the JSON only where the
   current snapshot can make an honest determination: four explicit Shopify
   sitemap children, AI-bot robots rules, relevant schema types, cookie/contact
   signals, and other paths already documented in `AI-CONTEXT.md`.
2. **Classify the remaining C.1 checks.** For each gap, choose one of:
   additional single-page extraction, deferred multi-page sampling, or remove
   because the signal cannot support a reliable verdict. Document the choice.
3. **Validate and import Part C.** Run `npm run check:shopify-library`, import
   through Report Builder without overwriting unrelated section settings, and
   test at minimum a Liquid Shopify homepage, a Shopify product page, a
   Hydrogen storefront, and a non-Shopify site.
4. **Acceptance before publish.** Confirm gates yield `NOT_APPLICABLE`, not
   false failures; no check returns configuration `ERROR`; score basis is
   honest; remediation names the correct Shopify admin path or theme file; and
   premium stripping still happens server-side. Publish a new template version
   only after this review.
5. **Then begin Phase 2 — the Fix Loop.** Do not start Phase 3 or multi-page
   sampling first; persistent findings are the retention engine and the next
   major product phase in build-spec v3.

## 6. Phase 2 — Fix Loop requirements

Implement in this dependency order:

1. Add `Finding`, `FindingEvent`, their enums/relations, `AuditResult.suppressed`
   and `findingId`, and report linkage/delta/reconciliation fields.
2. Extract one shared URL-normalization helper. Finding identity is
   `sha256(fieldKey + ':' + normalizedPageUrl)`; intake and reconciliation must
   use exactly the same normalization.
3. Implement deterministic reconciliation after evaluation and before snapshot
   creation. `NOT_APPLICABLE`, `ERROR`, and informational observations never
   create or resolve findings.
4. Resolve `previousReportId` at reconciliation time from the latest completed
   reconciled report, not at intake, so out-of-order jobs cannot corrupt chains.
5. Implement stale findings: a missing observation sets `staleSince`; it never
   silently marks a finding fixed or deletes history.
6. Implement suppression. `WONT_FIX` and `FALSE_POSITIVE` exclude a result from
   both score numerator and denominator without changing its frozen verdict.
7. Add owner-checked, rate-limited user actions and bulk actions. Aggregate
   false-positive counts for tuning the check library.
8. Make reconciliation idempotent with report-scoped event rollback, and
   prevent concurrent reconciliation for the same website.
9. Build deterministic comparison buckets, score-basis mismatch warnings, and
   a like-for-like score over intersecting sections.
10. Send transactional delta email and create an in-app notification.
11. Add plan-aware monthly/weekly scheduled re-audits with allowance handling
    and downgrade correction.
12. Skip findings for anonymous websites. Claiming an anonymous report seeds
    the baseline once; do not backfill older reports.
13. Warn before changing a `fieldKey` that already has findings. Treat
    `fieldKey` as permanent identity.

The exact transition table in build-spec v3 is normative. In particular:

- PASS moves open-family, marked-fixed, still-failing, or regressed findings to
  `VERIFIED_FIXED`.
- FAIL/WARNING creates `OPEN`, changes `MARKED_FIXED` to `STILL_FAILING`, and
  changes `VERIFIED_FIXED` to `REGRESSED`.
- `WONT_FIX` and `FALSE_POSITIVE` remain suppressed on later failures.
- PASS may verify a `WONT_FIX` item, but respects `FALSE_POSITIVE`.
- `NOT_APPLICABLE` and `ERROR` never touch finding state.

Required tests include the complete transition table, reconciliation replay,
URL-normalization parity, suppression restoration, stale behaviour, anonymous
claim seeding, ownership checks, and comparison of partial vs complete reports.

## 7. Phase 3 — report depth and presentation

After the Fix Loop:

- Render `AuditField.category` as customer-facing sub-section headings.
- Add `ReportPillar` with the six values from build-spec v3 and map the existing
  seven published sections explicitly. Include `pillar` in builder editing and
  lossless JSON import/export.
- Build the mobile-capable Fix List as the daily surface; the immutable report
  remains the historical artifact.
- Old reports show frozen verdict/evidence plus the current live finding badge.
- Add the score trend, prioritized five-item action plan, evidence display,
  comparison view, empty states, and opportunistic screenshot surfaces.
- Thicken the library toward roughly 70 reliable checks across the six pillars.

## 8. Deferred architecture and explicit non-goals

- Multi-page sitemap sampling and the `WebsiteRawData` 1:many migration come
  after Phase 2. Shopify's deterministic sitemap makes discovery easier, but
  it is still a separate data-model project.
- AI content analysis remains design-only until Phases 2–3 are stable. When
  built, make one cached, structured LLM call per page, persist its result, and
  let criteria read stored paths just as `PSI_METRIC` reads PageSpeed data.
- Do not build a Shopify App Store integration, Admin API/OAuth/App Bridge,
  full crawling, backlinks, keyword rankings, prompt monitoring, screenshot
  diffing, public share links, white-label, or client-side PSI in these phases.

## 9. Phase gates

Every phase closes with proportional live verification plus:

```text
npm run check:shopify-library   # while Part C changes
npx tsx scripts/check-sample-section.ts
npm run typecheck
npm run lint
npm run build
```

Do not claim completion from compilation alone. Verify authorization, scoring,
gating, immutable snapshots, server-side plan stripping, failure paths, and the
relevant live user flow.

---

## 10. Part C gap classification (roadmap §5.2 — resolved 2026-08-01)

Every gap from §4 is now classified. Three outcomes only: **extract** (build
the signal now), **defer** (needs multi-page sampling), **drop** (the signal
cannot support an honest verdict).

### Resolved by extraction in this pass

| Gap | Resolution |
|---|---|
| Product schema invisible on variant products | `ProductGroup` (and its `hasVariant` offers/images) is now recognised alongside `Product`. Allbirds-style stores were previously reported as having no product schema at all. |
| "Product page has no schema" unreportable | New `shopify.product.isProductPage` (URL path `/products/`). `shopify.product` now exists on ANY product page, with `hasProductSchema: false` when schema is absent — so the most valuable product finding FAILS instead of resolving N/A. New check `shopify_product.has_schema`. |
| Text-based product checks blocked by the schema gate | `size_guide`, `shipping_info`, `returns_info`, `schema_images` re-gated to `isProductPage` — they are answerable without schema. |

### Deferred — requires multi-page sampling (post-Phase 2, per §8)

The audit inspects ONE page. A visitor pastes `https://store.com`, so
product/collection/policy-page checks only fire when someone audits that page
type directly. This is the honest constraint, not a bug:

- Product description quality, collection descriptions, template-default
  metadata, blog presence/recency — page-type checks.
- Per-variant canonical correctness, `/collections/all` handling, parameter
  canonical/noindex correctness — need to FETCH the parameterised URL and read
  its canonical. Counting `?variant=` links is **not** the same verdict and
  must never be presented as one.
- Contact/About discovery, individual imprint rules — need page discovery.
- Add-to-cart above the fold, visible reviews, payment badges — need rendered
  geometry, not just DOM presence.

Shopify's deterministic sitemap children (`sitemap_products_*.xml` etc., already
captured in `shopify.sitemapChildren`) make this discovery nearly free when it
comes. Nothing built so far blocks it.

### Dropped — cannot support a reliable verdict

- **Theme JS bundle weight** — theme and app scripts are indistinguishable by
  URL alone on many stores; a number here would be a guess with a decimal point.
- **Font origin quality** — self-hosted vs Google Fonts is a real signal, but
  "correct" depends on the store's CDN and region. No honest threshold.
- **Shopify Plus detection** — no reliable external signal; `plusLikelihood`
  stays `unknown | possible` and is never asserted (Part A rule).

### Publish-gate result (roadmap §5.4)

`scripts/validate-draft-library.ts` runs the real pipeline against the draft
for five site types (Shopify home, product page with schema, product page
WITHOUT schema, Hydrogen, non-Shopify) and reports every check's outcome.

Latest run — **all gates green**:

- configuration `ERROR`: **0**
- checks that never fire on any target: **0** (was 14 before this pass)
- gated checks FAILing/WARNing on the non-Shopify site: **0**
- `shopify_product.has_schema`: PASS with schema, **FAIL without** — the case
  that was previously silent

Re-run it before any future publish.

---

## 11. Phase 3 — report depth (2026-08-01)

Delivered in this pass; the sub-section and pillar items were already done in
Part F.

| §7 item | Status |
|---|---|
| Render `category` as sub-section headings | Done (Part F) |
| `ReportPillar` + explicit mapping + lossless import/export | Done (Part F) |
| Mobile-capable Fix List as the daily surface | Done (Part H) |
| Old reports: frozen verdict + live finding badge | Done (Part H) |
| Score trend | Done (Part H) |
| **Prioritized five-item action plan** | **Done** — top of every report |
| **Evidence display** | **Done** — see below |
| Comparison view | Done (Part H) |
| Empty states | Done (Part H) |
| **Opportunistic screenshot surface** | **Done** — report header when a render happened |
| Thicken library toward ~70 checks | Met in aggregate: the draft carries **78 checks** across the six pillars (34 Shopify + universal sections) |

### Evidence trail — the trust fix

Before this pass `buildEvidence()` returned `null` for every path-based
inspection type, so **31 of the 34 Shopify checks — the entire
differentiator — shipped with no evidence at all**, and what did exist
rendered as a raw `JSON.stringify` dump.

Now:

- A **generic layer** covers `BOOLEAN_CHECK`, `NUMERIC_COMPARISON`,
  `STRING_COMPARISON`, `REGEX_EVALUATOR`: it reports the path read, the value
  found, and the sibling values from the same data group, so a bare number has
  context ("16 CDN images, 16 with a width parameter").
- `RULES_EVALUATOR` surfaces every path its rule reads — a multi-value verdict
  is explainable instead of a black box.
- `PSI_METRIC` / `LIGHTHOUSE_SCORE` report the strategy and the actual metric
  set, or state plainly that PageSpeed data was unavailable.
- Selector-driven DOM checks name **what was looked for** (the selector),
  which is the whole answer to "how do you know?" for that family.
- The report renders evidence as labelled rows plus optional samples under a
  **"How do we know?"** disclosure, with the measured source named.

**Verified live: 33/33 scored checks on a universal audit and 63/63 on a
Shopify audit now carry evidence.**

### Action plan

Top five by impact-to-effort using the definitions the engine already
computes: critical issues (FAILING + CRITICAL) first, then quick wins
(FAIL/WARNING at LOW/MEDIUM), then remaining HIGH failures. Flat and ordered,
each row linking to its section and carrying the remediation line. Verified on
a live Shopify audit: 5 items selected from 16 issues (0 critical, 10 quick
wins, 4 high).

---

## 12. Multi-page sampling (2026-08-01) — the §8 deferral, now unblocked

Roadmap §8 deferred this until after Phase 2. Phase 2 and Phase 3 are done, and
it was the largest remaining honesty gap: the audit inspects the URL the
visitor pasted, which is always a homepage, so the **product-readiness
pillar — the most valuable Shopify-specific analysis — could never fire in
normal use** (§10 recorded exactly this).

### How it works

- `SampledPage` (1:many per report). `WebsiteRawData` stays **1:1 as the
  primary page** — that contract is relied on throughout, and breaking it
  would have touched the evaluator, snapshot, dev console and lead paths for
  no benefit.
- `AuditField.pageType` (`HOME | PRODUCT | COLLECTION | BLOG`, default HOME)
  declares which page a check inspects. Editable in the builder, Zod-validated,
  round-trips losslessly through export → import.
- Discovery is sitemap-driven (`services/inspection/sample-pages.ts`): one
  representative page per type, at most 3 pages, 25 s group budget, each fetch
  through the guarded fetcher with SSRF re-checked — a sitemap is
  attacker-influenced input on a site we do not control. Every failure is
  silent and partial.
- The evaluator builds one `ExtractionContext` per sampled page. A check whose
  page type was **not** sampled resolves `NOT_APPLICABLE` with the reason
  ("No product page was sampled for this audit") — never a false failure.
  Field-level `appliesWhen` gates evaluate against the check's OWN page;
  section gates stay on HOME because `site.isShopify` is a site-level fact.
- **PSI is deliberately not copied onto sampled contexts.** PageSpeed measured
  the primary URL; presenting a homepage metric as a product page's would be a
  fabrication.
- Finding identity folds in `pageType` for sampled pages only, so the same
  check on a product page and the home page are distinct findings. HOME keeps
  its original two-part hash so no existing finding is orphaned. (A URL
  fragment cannot carry this — `normalizePageUrlForIdentity` strips fragments
  by design.)

### Bug this surfaced

Shopify's product and collection child sitemaps **400 without their
`?from=&to=` query parameters**. `checkSitemap` stored only the bare file name
(all platform detection needed), so the first sampling run fetched
`/sitemap_products_1.xml` and got a 400 — blogs happened to work because they
need no params. `sitemap.childSitemapUrls` now preserves the full URLs for
anything that actually fetches a child.

### Result — verified live on a HOMEPAGE audit

`https://www.deathwishcoffee.com` (a plain homepage, exactly what a visitor
submits):

- sampled PRODUCT, COLLECTION and BLOG pages, all HTTP 200
- **10/10 product-readiness checks fired** (previously 0/10), including a real
  `FAIL` on missing aggregate rating and a `WARNING` on a single product image
- product-page findings created as distinct entries in the Fix Loop

Publish gate re-run across all five site types: **0 ERRORs, 0 never-firing
checks, 0 gated checks failing on the non-Shopify site**, and the Shopify
homepage now fires **73/78 checks (was 58/78)** — homepage N/A fell from 20 to 5.

### Still deferred

Per-variant canonical correctness and parameter noindex behaviour still need a
fetch of the parameterised URL itself; page-count-based checks (e.g. "most
products have descriptions") need many pages, not one representative. Those
remain in §10's deferred list.

---

## 13. PDF export (2026-08-01) — closing a sold-but-unbuilt promise

**Why this was next.** The pricing table listed "Downloadable PDF reports" as a
Premium benefit, and the upgrade CTA, sidebar and FAQ all repeated it — five
places in total — while **no implementation existed anywhere in the
codebase**. A Premium subscriber was paying for something that could not be
delivered. That outranked every missing capability, because it is the only
place the product made a claim it could not honour.

### Approach

`/dashboard/reports/[publicId]/pdf` — a print-optimised server-rendered
document, generated by the browser's own print-to-PDF.

Rejected the PDF-library route (jsPDF/pdfmake) deliberately: hand-laying a
report with dozens of checks, evidence rows and page-break control is more
code and produces worse output than the styled document, and it would add a
~350 KB dependency. Browser generation also costs no server render, which is
consistent with the B.10 render-cost work and the Phase 5.3 design note.

### Security and correctness

- Same ownership check as the interactive report (`requireUser` + owner-or-
  admin), so the route cannot be used to read someone else's report.
- **Same `getProjectedReport` projection**, so locked premium content is
  stripped server-side *before* it reaches the page. The PDF renders exactly
  the projected data and therefore inherits the plan boundary rather than
  re-implementing it. Verified: on a real report a FREE projection exposes 8
  locked checks with **0 bytes of detail** (no message, value, suggestion or
  evidence) leaking through the stubs.
- PDF export is itself Premium-gated (matching the pricing table); a FREE
  viewer is redirected, and the report shows a locked "PDF export" affordance
  linking to billing rather than a dead button.
- Unauthenticated access redirects to login (verified, 307).

### The document

Cover (domain, score, grade, platform/theme/app context, counts) · score-basis
notice when coverage is partial · the five-item action plan · then pillar →
section → check with status, message, remediation and one-line evidence.
Everything is expanded — a PDF that hides half its content behind accordions is
not a report.

The print stylesheet is the renderer: A4 with margins, `print-color-adjust:
exact` so the status and score colours survive (they are load-bearing, not
decoration), app chrome hidden, and page-break rules that keep a check from
splitting across pages.
