# AuditFlow — QC Test Plan

**Version:** 2026-08-01
**Scope:** everything built through PDF export — Phase 0 reliability, Shopify
pivot (platform detection + conditional applicability), progressive lead
capture (auth-first flow), Shopify extractors, pillars & report presentation, the Fix Loop,
report depth, multi-page sampling, and PDF export.

---

## 0. How to use this document

1. Read **§1 (environment)** and **§2 (behaviours that are NOT bugs)** before
   testing anything. Section 2 exists because several correct behaviours look
   like defects; filing them wastes everyone's time.
2. Run **§3 automated gates** first. If any fail, stop and report — the manual
   suite assumes a green build.
3. Work through **§4–§13** in order. Each case has steps, an expected result,
   and a Pass/Fail box.
4. Log anything that fails using the template in **§15**.
5. Complete the sign-off in **§16**.

**Severity definitions for this round**

| Severity | Meaning |
|---|---|
| **S1 Blocker** | Data loss, a security/permission boundary breach, wrong money, or an audit that cannot complete. Ship-stopper. |
| **S2 Major** | A core flow is broken or reports incorrect information to a customer. |
| **S3 Minor** | Cosmetic, copy, or an edge case with a workaround. |

Anything in **§12 (security boundaries)** that fails is **automatically S1**.

---

## 1. Environment prerequisites

### 1.1 Start the app

```bash
npm install
npx prisma generate
npm run dev            # http://localhost:3000
```

> **Never run a second `npm run dev` against this repo while one is running,
> and do not run `npm run build` while the dev server is up.** Both write to
> `.next` and corrupt each other's manifests — the symptom is a completely
> unstyled site and a 404 on `/_next/static/css/app/layout.css`.
> Recovery: stop all dev servers, delete `.next`, restart.

### 1.2 Test accounts

```bash
npx tsx --conditions=react-server scripts/setup-test-user.ts
```

Creates `testuser@example.com` / `Test@1234`. You will also need:

| Role | How to get it |
|---|---|
| **Free user** | Sign up normally, or set `plan = FREE` in the DB |
| **Premium user** | Master Admin → Users → set plan to Premium |
| **Master admin** | Seeded from `MASTER_ADMIN_EMAIL` (`npm run db:seed`) |

Several cases require **all three**. Set them up before starting.

### 1.3 Optional integrations — and what breaks without them

Check which are configured before testing; missing keys change expected
behaviour and are **not** bugs.

| Secret | If unset |
|---|---|
| `PAGESPEED_API_KEY` *(or the key saved in Master Admin → Settings)* | Speed checks return **Not Applicable**, audits finish **PARTIAL**, and the report shows a coverage notice. Correct behaviour. |
| `RESEND_API_KEY` | No email is sent. The message is logged to the server console as `[email:dev-fallback]`. Verify emails **there**. |
| `CRON_SECRET` | `/api/cron/reap` and `/api/cron/schedule` return **503**. Stuck audits are never reaped and **scheduled re-audits never fire**. §9.4 and §10.5 cannot be tested. |
| `QSTASH_TOKEN` | Local dev runs audits inline, which is correct off-serverless. Only affects deployed behaviour. |
| `STRIPE_SECRET_KEY` | Billing/upgrade flows cannot be exercised. |
| `BROWSER_WS_ENDPOINT` + local Playwright | If **no** browser is available, renders are skipped. The Pipeline Console must say `browser: local — UNAVAILABLE`. Install with `npx playwright install chromium-headless-shell`. |

### 1.4 Test sites to use

| Purpose | URL |
|---|---|
| Shopify (Liquid) | `https://www.deathwishcoffee.com` |
| Shopify product page | `https://www.deathwishcoffee.com/products/death-wish-coffee` |
| Shopify product page **without** schema | `https://www.deathwishcoffee.com/products/death-wish-ground-coffee` |
| Shopify Hydrogen | `https://hydrogen.shop` |
| Non-Shopify (WordPress) | `https://techcrunch.com` |
| Minimal/static | `https://example.com` |

---

## 2. Behaviours that are CORRECT — do not raise these as bugs

| Observed | Why it is correct |
|---|---|
| Shopify checks show **Not Applicable** on a WordPress site | Conditional applicability. A Shopify check must never *fail* a non-Shopify site. Failing them would be the bug. |
| Report finishes **PARTIAL**, score notice says speed excluded | No PageSpeed key. The score is computed on the remaining model and says so. |
| Most audits show **no screenshot** | Rendering is skipped for ~85% of sites by design (measured). Only JS-heavy storefronts render. |
| Product checks show **Not Applicable** on some stores | That store's sitemap did not expose a product page to sample. Expected and disclosed. |
| A check says **"Not measured"** rather than failing | The data could not be obtained. Missing data must never look like a failure. |
| Findings marked **"not checked lately"** rather than disappearing | Stale findings are retained deliberately — silent disappearance destroys trust in the tracker. |
| Score **changes** after suppressing a finding | Suppressed findings leave the score entirely, by design. Un-suppressing restores the exact previous score. |
| First audit has **no comparison** view | There is nothing to compare to. It shows a "this is your baseline" state. |
| Submitting a URL logged out opens a **sign-in wall before the audit runs** | Auth-first by design. No audit is queued for an anonymous visitor, so there are no orphaned reports and no lead without an account. |
| Free user can still Ctrl+P the report page | Unpreventable in any browser, and not a leak — premium content was already stripped server-side. Premium buys the *designed* PDF. |
| Audit takes 30–150 seconds | Normal. PageSpeed alone can take 90s. |

---

## 3. Automated gates — run first

All five must pass. Run with the dev server **stopped** for the build.

```bash
npm run typecheck
npm run lint
npx tsx scripts/check-sample-section.ts
npm run check:shopify-library
npx tsx --conditions=react-server scripts/test-finding-transitions.ts
npm run build
```

| # | Gate | Expected output | ✅/❌ |
|---|---|---|---|
| 3.1 | `typecheck` | no output (clean) | ☐ |
| 3.2 | `lint` | no errors | ☐ |
| 3.3 | sample-section guard | `OK — sample section … validates` | ☐ |
| 3.4 | shopify library guard | `Shopify check library valid: 5 sections, 34 checks, 34 unique field keys.` | ☐ |
| 3.5 | Fix Loop transition suite | `OK — 60 engine transitions + 54 user-action cases all pass (114 total).` | ☐ |
| 3.6 | `build` | `✓ Compiled successfully` | ☐ |

**Deep gate (optional, ~10 min, hits live sites).** Validates the whole check
library against five real site types:

```bash
npx tsx --conditions=react-server scripts/validate-draft-library.ts
```

Expected: **0 configuration ERRORs**, **0 checks that never fire**, **0 gated
checks failing on the non-Shopify site**. ☐

---

## 4. Auth-first entry funnel

> **Flow under test:** URL submitted → **sign in / sign up wall** → account
> exists → audit is queued and starts automatically for the submitted URL →
> progress screen → full report. There is no anonymous audit and no teaser:
> nothing is analysed until there is an account to own it.

| # | Case | Steps | Expected | ✅/❌ |
|---|---|---|---|---|
| 4.1 | Landing form shape | Open `/` logged out | **One** URL field and one button on a single line. No email field, no consent checkbox. | ☐ |
| 4.2 | Anonymous visitor submits URL | Enter a Shopify URL → submit, logged out | Sign in / sign up wall appears. **The audit has NOT started** — no progress screen, and no new report row. | ☐ |
| 4.3 | Invalid URL | Enter `not a url` → submit, logged out | Inline error shown **immediately**. **No auth gate opened** — the URL is validated before authentication is demanded. | ☐ |
| 4.4 | After sign in / sign up | Complete the gate from 4.2 | Audit starts **automatically for the submitted URL** — it does not have to be retyped — and the user lands on the progress screen. | ☐ |
| 4.5 | Unauthenticated `/report/[id]` | Open a report URL while logged out | Redirected to sign in, then **returned to that report** after authenticating. | ☐ |
| 4.6 | Unauthenticated `/analyze/[id]` | Open a progress URL while logged out | Redirected to sign in. | ☐ |
| 4.7 | Return path is safe | Try `/login?next=https://evil.com` and `/login?next=//evil.com` | Both ignored — lands on `/dashboard`, never on an external host. | ☐ |
| 4.8 | API rejects anonymous directly | `POST /api/audits` with a valid URL and no session cookie | **HTTP 401.** No audit created, nothing queued. | ☐ |
| 4.9 | **No orphaned audits** | After 4.2 and 4.8, check the database / Master Admin → Audits | **No report rows** were created for either attempt. | ☐ |
| 4.10 | Unreachable site | Signed in, enter `https://thisdomaindoesnotexist-xyz.com` | Told the site cannot be audited, in plain language. | ☐ |
| 4.11 | Progress screen is uninterrupted | Watch the whole progress screen from 0→100% | Named stages with a percentage, and **no email block at any point**. Never a bare spinner. | ☐ |
| 4.12 | Report content | Let the audit finish | Overall score, every section with its score, findings at the viewer's plan level. **No teaser screen appears at any point.** | ☐ |
| 4.13 | Non-Shopify site | Audit `techcrunch.com` | Honest banner: "This isn't a Shopify store" + universal checks still shown. **Score must not be dragged down by inapplicable checks.** | ☐ |
| 4.14 | Signup consent | Open the signup form | Marketing checkbox present, **unticked**, separate from anything else, and clear that audit results are sent either way. | ☐ |
| 4.15 | Lead recorded | Master Admin → Leads after a completed audit | A lead exists for that email+domain, marked **converted**, with platform/theme/app columns populated and consent recorded if ticked at signup. | ☐ |
| 4.16 | **No lead without an account** | Attempt 4.2 and abandon at the wall. Check Master Admin → Leads | **No lead row was created.** A visitor who never signed up is not a lead. | ☐ |
| 4.17 | Result email | Complete an audit while signed in (first audit for that site) | Email arrives with the score in the subject and a working report link (check the server log if `RESEND_API_KEY` is unset). | ☐ |
| 4.18 | No double email | Complete a **second** audit of the same site | Exactly **one** email: the delta ("score went X → Y"), not also the plain result email. | ☐ |
| 4.19 | Rate limit | Start 4+ audits quickly from one account/IP | Blocked with a clear message after the configured limit (default 3/hour). | ☐ |

---

## 5. Audit pipeline & reliability

| # | Case | Steps | Expected | ✅/❌ |
|---|---|---|---|---|
| 5.1 | Happy path | Run an audit on a Shopify store | Completes with a score and grade. | ☐ |
| 5.2 | Stage tracing | Master Admin → Pipeline Console → run a URL | Live log; all 11 stages tick over; artefact row fills in (raw data, PSI rows, results, snapshot). | ☐ |
| 5.3 | Render decision | Check the `RENDER` log lines | A server-rendered store logs **"Render SKIPPED"** with reasons; a JS-heavy store renders. | ☐ |
| 5.4 | Missing browser | If no browser installed, audit a JS-heavy site | Loud **ERROR** log saying no browser was available. Console header shows `local — UNAVAILABLE`. | ☐ |
| 5.5 | Multi-page sampling | Audit a Shopify **homepage** | Log line: "Sampled N additional page(s)" listing PRODUCT / COLLECTION / BLOG. | ☐ |
| 5.6 | Product checks fire | Same audit, open the report | Product-readiness checks show real PASS/FAIL — **not** all Not Applicable. | ☐ |
| 5.7 | Concurrency guard | Start a second audit of the same website while one runs | Refused with "already in progress". | ☐ |
| 5.8 | Allowance | Exhaust a Free account's monthly audits | Clear message with the reset date and an upgrade path. Never a silent failure. | ☐ |
| 5.9 | Failure is honest | Audit an unreachable site | Report reaches **FAILED** with a plain-language reason. Never stuck at "processing" forever. | ☐ |
| 5.10 | Allowance refund | After a system-caused failure, check the dashboard allowance | The failed audit did **not** consume a credit. | ☐ |

---

## 6. Platform detection & applicability

| # | Case | Steps | Expected | ✅/❌ |
|---|---|---|---|---|
| 6.1 | Shopify Liquid | Audit `deathwishcoffee.com` | Detected **SHOPIFY**; theme name and app-script count shown. | ☐ |
| 6.2 | Hydrogen | Audit `hydrogen.shop` | Detected **HYDROGEN** (distinct from plain Shopify). | ☐ |
| 6.3 | WordPress | Audit `techcrunch.com` | Detected **WORDPRESS**. | ☐ |
| 6.4 | No false failures | WordPress report → find the Shopify sections | Every Shopify check is **Not Applicable**. **Any FAIL here is S1.** | ☐ |
| 6.5 | Honest score | Same report | Score is computed only over applicable sections; excluded sections are disclosed. | ☐ |
| 6.6 | Skipped disclosure | Expand "checks skipped — not applicable to this platform" | Collapsed group lists them by name. | ☐ |
| 6.7 | Plus never asserted | Any Shopify report and the leads table | Nothing ever claims the store *is* Shopify Plus (only "possible"). | ☐ |
| 6.8 | Product schema missing | Audit the product page **without** schema | `Product schema present` **FAILS** — it must not be silently Not Applicable. | ☐ |

---

## 7. Report presentation

| # | Case | Steps | Expected | ✅/❌ |
|---|---|---|---|---|
| 7.1 | Pillar grouping | Open any report | Sections grouped under pillar headings with aggregate scores. | ☐ |
| 7.2 | Excluded pillar | A report where a whole pillar was excluded | Renders collapsed **with the reason** — never a score of zero. | ☐ |
| 7.3 | Sub-sections | Expand a section with categorised checks | Group headers with pass/warn/fail counts per group. | ☐ |
| 7.4 | Action plan | Top of the report | "Fix these first" with up to 5 items, each linking to its section and showing the fix. | ☐ |
| 7.5 | Evidence | Expand "How do we know?" on several checks | Readable label/value rows — **never** a raw JSON dump. Shows what was measured. | ☐ |
| 7.6 | Evidence coverage | Sample 10 checks across pillars | Effectively all scored checks carry evidence. | ☐ |
| 7.7 | Screenshot | A report where a render happened | Store screenshot appears in the header. | ☐ |
| 7.8 | Coverage warning | A PARTIAL report | Warning that the score is not comparable to full audits. | ☐ |
| 7.9 | Old snapshots | Open the **oldest** report in the account | Still renders without error (pre-pillar snapshots use the legacy path). | ☐ |

---

## 8. The Fix Loop — findings

Requires **two audits of the same website**, ideally with a change between them.

| # | Case | Steps | Expected | ✅/❌ |
|---|---|---|---|---|
| 8.1 | Findings created | Audit an owned site once | Website detail → Fix List lists the failing checks. | ☐ |
| 8.2 | Persistence | Re-audit | Findings persist — **not** duplicated. | ☐ |
| 8.3 | Acknowledge / start | Use the row actions | State chip updates; action is recorded. | ☐ |
| 8.4 | Mark fixed (truthfully) | Fix a real issue on the site, mark it fixed, re-audit | Becomes **Verified fixed**. | ☐ |
| 8.5 | Mark fixed (untruthfully) | Mark an unfixed issue as fixed, re-audit | Becomes **Still failing**. | ☐ |
| 8.6 | Regression | Break a previously verified item, re-audit | Becomes **Regressed**. | ☐ |
| 8.7 | Won't fix | Suppress a finding | Removed from the score; report shows it as suppressed. | ☐ |
| 8.8 | Restore | Reopen it | Score returns to **exactly** the previous value. | ☐ |
| 8.9 | False positive | Report one | A reason is **required** before it is accepted. | ☐ |
| 8.10 | Stale | Disable a check in the builder, re-audit | Existing finding is marked **"not checked lately"** — **never** "fixed". **Marking it fixed is S1.** | ☐ |
| 8.11 | Bulk actions | Select several findings → bulk change | All update; a summary is shown. | ☐ |
| 8.12 | Ownership | Log in as a different user and attempt an action on someone else's finding | Refused. **Any success is S1.** | ☐ |
| 8.13 | Comparison | Open "What changed" on a second audit | Buckets: fixed / still failing / new / regressed / still open / suppressed / not checked. Counts match reality. | ☐ |
| 8.14 | Baseline | Open "What changed" on a **first** audit | "This is your baseline" — never an empty comparison. | ☐ |
| 8.15 | Like-for-like | Compare a PARTIAL against a COMPLETED audit | Warns the scores aren't comparable and shows a like-for-like number. | ☐ |
| 8.16 | Delta email | Complete a second audit | Email + in-app notification with the score movement. (Check server log if Resend is unset.) | ☐ |
| 8.17 | Live badge | Fix something, then open the **older** report | Old verdict stays frozen, with a live badge: "✓ verified fixed since this audit". | ☐ |

---

## 9. Fix List UI

| # | Case | Steps | Expected | ✅/❌ |
|---|---|---|---|---|
| 9.1 | Default filter | Open a website's Fix List | Shows only actionable states; resolved/suppressed hidden until toggled. | ☐ |
| 9.2 | Sort & grouping | Inspect the order | Severity first, then oldest; grouped by pillar. | ☐ |
| 9.3 | Empty state | A site with no open findings | Celebratory state naming the next scheduled audit — **not** an empty table. | ☐ |
| 9.4 | Schedule | Settings tab → set Weekly on a Free plan | Refused with an explanation; Monthly is allowed. | ☐ |
| 9.5 | Trend chart | A website with 2+ audits | Score trend renders; partial-coverage points marked and explained. | ☐ |
| 9.6 | **Mobile** | Repeat 9.1–9.3 at 375 px width | Filters collapse into a sheet; rows single-column; actions reachable. | ☐ |

---

## 10. Master Admin

| # | Case | Steps | Expected | ✅/❌ |
|---|---|---|---|---|
| 10.1 | Access control | Visit `/master-admin` as a normal user | Redirected away. **Access is S1.** | ☐ |
| 10.2 | Builder CRUD | Create, edit, reorder, duplicate, disable, delete a section/check | All work against the draft. | ☐ |
| 10.3 | Export | Report Builder → Export JSON | Downloads the full draft. | ☐ |
| 10.4 | Round-trip | Re-import the exported file | Merges cleanly; pillar, `appliesWhen`, page type and category all preserved. | ☐ |
| 10.5 | Merge safety | Import a section that already exists | Section's own settings are preserved; new checks appended as a sub-section; report of what changed is accurate. | ☐ |
| 10.6 | Bad import | Import malformed JSON | Rejected with a precise error naming the section/check. **Nothing is written.** | ☐ |
| 10.7 | Criterion test | Use "Test this criterion against a URL" | Returns status, detected value, and whether the applicability gate passed. | ☐ |
| 10.8 | Publish | Publish the draft | Draft freezes as published; a new draft is created; **existing reports are unchanged**. | ☐ |
| 10.9 | Leads | `/master-admin/leads` | Lists leads with platform, theme, apps, consent + timestamp, conversion. Filters and CSV export work. | ☐ |
| 10.10 | Funnel | Same page | Counters populate; headline is the **audit completion rate**. "Teasers viewed" is gone — that event is retired. | ☐ |
| 10.11 | PSI key | Settings → save a PageSpeed key | Never displayed in full again (masked). "Test key" reports validity. Next audit uses it **without a redeploy**. | ☐ |
| 10.12 | Logs | `/master-admin/logs` | System and admin logs filterable. | ☐ |
| 10.13 | Pipeline Console | `/master-admin/dev` | Run a URL, watch the live trace, re-run findings, force-fail, re-queue. | ☐ |
| 10.14 | Watchdog *(needs `CRON_SECRET`)* | `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/reap` | Returns a summary; stuck reports are retried once then failed. | ☐ |
| 10.15 | Scheduler *(needs `CRON_SECRET`)* | Same for `/api/cron/schedule` | Due audits start; allowance exhaustion skips + notifies once. | ☐ |

---

## 11. PDF export

| # | Case | Steps | Expected | ✅/❌ |
|---|---|---|---|---|
| 11.1 | Premium access | As Premium, open a report → "Download PDF" | Print-ready document opens and the print dialog appears. | ☐ |
| 11.2 | Free user | As Free, view a report | Sees a locked "PDF export" affordance linking to billing — not a dead button. | ☐ |
| 11.3 | **Direct URL as Free** | As Free, browse to `/dashboard/reports/<id>/pdf` | Redirected away. **Access is S1.** | ☐ |
| 11.4 | Someone else's report | As any user, use another account's report id | Not found. **Access is S1.** | ☐ |
| 11.5 | Content | Save as PDF and open it | Cover with score/grade/platform, action plan, all pillars/sections/checks expanded with evidence, footer date. | ☐ |
| 11.6 | Colour fidelity | Inspect the PDF | Status and score colours preserved (not stripped to grey). | ☐ |
| 11.7 | Pagination | Multi-page PDF | No check is split across a page break; no dashboard chrome. | ☐ |
| 11.8 | **No premium leak** | Generate as a Free-plan **admin-impersonated** or Free-projection report | Locked checks appear as title-only stubs with **no** value, message, suggestion or evidence. **Any leak is S1.** | ☐ |

---

## 12. Security boundaries — every failure here is S1

| # | Case | Steps | Expected | ✅/❌ |
|---|---|---|---|---|
| 12.1 | Premium stripping | As a Free user, open a report with premium content and **view page source / network response** | Locked checks contain no detected values, messages, suggestions or evidence. The blur is real absence. | ☐ |
| 12.2 | Report ownership | Open another user's report by `publicId` | Denied. | ☐ |
| 12.3 | Another user's report | Open a report URL belonging to a different account | Denied — logged out it redirects to sign in, and signed in as the wrong user it 404s. The unguessable id alone is never enough. | ☐ |
| 12.4 | Admin routes | All `/master-admin/*` as a normal user | Denied. | ☐ |
| 12.5 | Admin actions | Call an admin server action as a normal user | Refused server-side. | ☐ |
| 12.6 | SSRF — localhost | Audit `http://localhost:3000` | Refused. | ☐ |
| 12.7 | SSRF — private IP | Audit `http://192.168.1.1` and `http://169.254.169.254` | Refused. | ☐ |
| 12.8 | Scheme | Audit `file:///etc/passwd`, `javascript:alert(1)` | Refused. | ☐ |
| 12.9 | Cron auth | Call `/api/cron/reap` with no/incorrect token | 401 (or 503 if unconfigured). Never runs. | ☐ |
| 12.10 | Job worker | POST `/api/jobs/run-audit` without a valid signature | 401. | ☐ |
| 12.11 | Lead capture | POST `/api/leads/capture` for a report you don't own | Refused. | ☐ |
| 12.12 | Secret exposure | Search page source/network for the PageSpeed key after saving it | Never present — masked preview only. | ☐ |
| 12.13 | Unsubscribe token | Alter the token in an unsubscribe link | Rejected as invalid. | ☐ |
| 12.14 | XSS | Set a check message containing `<script>alert(1)</script>`, run an audit | Rendered as text, never executed. | ☐ |

---

## 13. Cross-browser & responsive

| Area | Chrome | Firefox | Safari | Mobile (375 px) |
|---|---|---|---|---|
| Landing + audit start | ☐ | ☐ | ☐ | ☐ |
| Progress screen + email ask | ☐ | ☐ | ☐ | ☐ |
| Report (pillars, evidence) | ☐ | ☐ | ☐ | ☐ |
| Fix List | ☐ | ☐ | ☐ | ☐ |
| PDF export | ☐ | ☐ | ☐ | n/a |
| Master Admin builder | ☐ | ☐ | ☐ | ☐ |

---

## 14. Data integrity spot-checks

| # | Case | Expected | ✅/❌ |
|---|---|---|---|
| 14.1 | Publish doesn't mutate history | After publishing, old reports show the **same** scores and checks as before | ☐ |
| 14.2 | Re-evaluation is stable | Pipeline Console → "Re-run findings" twice | Finding states identical after the second run | ☐ |
| 14.3 | Deleting a report | Delete a report that has findings | Finding **history survives** (events are not destroyed) | ☐ |
| 14.4 | Account deletion | Delete a test account | Its reports/websites/leads go with it | ☐ |

---

## 15. Bug report template

```
ID:          QC-###
Severity:    S1 / S2 / S3
Area:        §x.y  (e.g. §8.10 stale findings)
Environment: browser + OS, logged-in role (Free / Premium / Admin)
URL audited: (if applicable)
Report id:   (publicId, if applicable)

Steps to reproduce
1.
2.
3.

Expected
Actual
Evidence: screenshot / console output / SystemExecutionLog line
Reproducible: always / intermittent (x of y attempts)
```

For anything pipeline-related, attach the **Pipeline Console** trace: open
`/master-admin/dev`, scope to the report, and use **Download** to export the
log as JSON. That one file usually answers the question.

---

## 16. Sign-off

| Gate | Criterion | Status |
|---|---|---|
| Automated | All six §3 gates green | ☐ |
| Security | **Zero** open S1 findings in §12 | ☐ |
| Core flows | §4, §5, §8 pass | ☐ |
| Commercial | §11 PDF + §10.9–10.11 admin pass | ☐ |
| Known issues | Every S2/S3 logged with an owner and a decision | ☐ |

**Recommendation:** ☐ Ship ☐ Ship with noted issues ☐ Do not ship

```
QC performed by: ______________________   Date: ____________
Build / commit:  ______________________
Environment:     ☐ local  ☐ staging  ☐ production
```

---

## 17. Reference

| Document | Contents |
|---|---|
| `docs/AI-CONTEXT.md` | Full system reference: architecture, criteria vocabulary, data paths, conventions |
| `docs/BUILD-ROADMAP.md` | Phase status and the decisions behind each (§10 gap classification, §11 report depth, §12 multi-page sampling, §13 PDF export) |
| `docs/CHATGPT-HANDOFF.md` | Self-contained product/architecture briefing |
| `docs/RENDER-STUDY.md` | Measured render-cost data behind the skip decision |
| `docs/shopify-check-library.json` | The importable Shopify check library |
