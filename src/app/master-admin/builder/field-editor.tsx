"use client";

import { useState, useTransition } from "react";
import { FlaskConical, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils/cn";
import { saveFieldAction, testCriterionAction, type TestCriterionData } from "./actions";
import type { BuilderField } from "./builder-client";

/* ---------------- option lists ---------------- */

const INSPECTION_TYPES: Array<{ value: string; label: string; group: string }> = [
  { group: "Page elements", value: "ELEMENT_EXISTS", label: "Element exists" },
  { group: "Page elements", value: "ELEMENT_NOT_EXISTS", label: "Element does not exist" },
  { group: "Page elements", value: "ELEMENT_COUNT", label: "Element count" },
  { group: "Page elements", value: "ATTRIBUTE_EXISTS", label: "Attribute exists" },
  { group: "Page elements", value: "ATTRIBUTE_EQUALS", label: "Attribute equals value" },
  { group: "Page elements", value: "ATTRIBUTE_CONTAINS", label: "Attribute contains value" },
  { group: "Page elements", value: "TEXT_EXISTS", label: "Text exists" },
  { group: "Page elements", value: "TEXT_CONTAINS", label: "Text contains value" },
  { group: "Page elements", value: "TEXT_LENGTH", label: "Text length" },
  { group: "SEO", value: "META_TAG", label: "Meta tag" },
  { group: "SEO", value: "CANONICAL_TAG", label: "Canonical tag" },
  { group: "SEO", value: "ROBOTS_META", label: "Robots meta" },
  { group: "SEO", value: "HEADING_HIERARCHY", label: "Heading hierarchy" },
  { group: "SEO", value: "SITEMAP_CHECK", label: "Sitemap check" },
  { group: "SEO", value: "ROBOTS_TXT_CHECK", label: "robots.txt check" },
  { group: "SEO", value: "STRUCTURED_DATA", label: "Structured data" },
  { group: "SEO", value: "SCHEMA_TYPE", label: "Schema type" },
  { group: "Content", value: "IMAGE_ALT_TEXT", label: "Image alt text (missing count)" },
  { group: "Content", value: "BROKEN_LINKS", label: "Broken links (count)" },
  { group: "Content", value: "MOBILE_VIEWPORT", label: "Mobile viewport" },
  { group: "Content", value: "FORM_FIELD", label: "Forms (count)" },
  { group: "Content", value: "CTA_CHECK", label: "CTA elements (count)" },
  { group: "Network", value: "HTTP_STATUS", label: "HTTP status" },
  { group: "Network", value: "REDIRECT_CHECK", label: "Redirect count" },
  { group: "Network", value: "SSL_CHECK", label: "SSL / HTTPS" },
  { group: "Network", value: "RESPONSE_HEADER", label: "Response header" },
  { group: "Speed", value: "PSI_METRIC", label: "PageSpeed metric" },
  { group: "Speed", value: "LIGHTHOUSE_SCORE", label: "Lighthouse score" },
  { group: "Advanced", value: "BOOLEAN_CHECK", label: "Boolean data check" },
  { group: "Advanced", value: "NUMERIC_COMPARISON", label: "Numeric comparison" },
  { group: "Advanced", value: "STRING_COMPARISON", label: "String comparison" },
  { group: "Advanced", value: "RULES_EVALUATOR", label: "Rules evaluator (sandboxed)" },
  { group: "Advanced", value: "REGEX_EVALUATOR", label: "Regex evaluator" },
];

const OPERATORS = [
  "EXISTS", "NOT_EXISTS", "EQUALS", "NOT_EQUALS", "CONTAINS", "NOT_CONTAINS",
  "STARTS_WITH", "ENDS_WITH", "GREATER_THAN", "LESS_THAN",
  "GREATER_THAN_OR_EQUAL", "LESS_THAN_OR_EQUAL", "BETWEEN", "MATCHES_REGEX",
  "IS_TRUE", "IS_FALSE",
];

const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"];
const PLAN_OPTIONS = [
  { value: "BOTH", label: "Free + Premium" },
  { value: "FREE", label: "Free only" },
  { value: "PREMIUM", label: "Premium only" },
  { value: "HIDDEN", label: "Hidden" },
];
const DATA_SOURCES = ["HTML", "RENDERED_DOM", "HEADERS", "PSI", "ROBOTS", "SITEMAP", "NETWORK"];

const PLACEHOLDER_HELP =
  "Placeholders: {{domain}} {{actualValue}} {{expectedValue}} {{count}} {{minimum}} {{maximum}} {{pageTitle}} {{sectionName}}";

/* ---------------- component ---------------- */

export function FieldEditor({
  sectionId,
  field,
  onDone,
}: {
  sectionId: string;
  field: BuilderField | null;
  onDone: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [testPending, startTestTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState<TestCriterionData | { error: string } | null>(null);

  const sug = (status: string) => field?.suggestions.find((s) => s.forStatus === status);

  const [form, setForm] = useState({
    name: field?.name ?? "",
    fieldKey: field?.fieldKey ?? "",
    description: field?.description ?? "",
    planAccess: field?.planAccess ?? "BOTH",
    severity: field?.severity ?? "MEDIUM",
    category: field?.category ?? "",
    score: field?.score ?? 1,
    weight: field?.weight ?? 1,
    passLabel: field?.passLabel ?? "Yes",
    failLabel: field?.failLabel ?? "No",
    warningLabel: field?.warningLabel ?? "Partial",
    helpArticleUrl: field?.helpArticleUrl ?? "",
    isEnabled: field?.isEnabled ?? true,
    appliesWhen: field?.appliesWhen ?? "",
    pageType: field?.pageType ?? "HOME",
    adminNotes: field?.adminNotes ?? "",
    criteria: {
      inspectionType: field?.criteria?.inspectionType ?? "ELEMENT_EXISTS",
      dataSource: field?.criteria?.dataSource ?? "HTML",
      selector: field?.criteria?.selector ?? "",
      attributeName: field?.criteria?.attributeName ?? "",
      operator: field?.criteria?.operator ?? "EXISTS",
      expectedValue: field?.criteria?.expectedValue ?? "",
      minValue: field?.criteria?.minValue ?? ("" as number | ""),
      maxValue: field?.criteria?.maxValue ?? ("" as number | ""),
      regexPattern: field?.criteria?.regexPattern ?? "",
      caseSensitive: field?.criteria?.caseSensitive ?? false,
      warnOperator: field?.criteria?.warnOperator ?? "",
      warnExpectedValue: field?.criteria?.warnExpectedValue ?? "",
      warnMinValue: field?.criteria?.warnMinValue ?? ("" as number | ""),
      warnMaxValue: field?.criteria?.warnMaxValue ?? ("" as number | ""),
      configJson:
        field?.criteria && Object.keys(field.criteria.config).length > 0
          ? JSON.stringify(field.criteria.config, null, 2)
          : "",
    },
    messages: {
      PASS: { message: sug("PASS")?.message ?? "", suggestion: sug("PASS")?.suggestion ?? "" },
      FAIL: { message: sug("FAIL")?.message ?? "", suggestion: sug("FAIL")?.suggestion ?? "" },
      WARNING: {
        message: sug("WARNING")?.message ?? "",
        suggestion: sug("WARNING")?.suggestion ?? "",
      },
    },
  });

  const set = (path: string, value: unknown) =>
    setForm((f) => {
      const next = structuredClone(f);
      const parts = path.split(".");
      let node: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (const p of parts.slice(0, -1)) node = node[p] as Record<string, unknown>;
      node[parts.at(-1)!] = value;
      return next;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await saveFieldAction(sectionId, field?.id ?? null, form);
      if (result.ok) onDone(result.message ?? "Saved.");
      else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  const runTest = () => {
    setTestResult(null);
    startTestTransition(async () => {
      const result = await testCriterionAction({
        url: testUrl,
        criteria: form.criteria,
        appliesWhen: form.appliesWhen,
      });
      if (result.ok && result.data) setTestResult(result.data);
      else if (!result.ok) setTestResult({ error: result.error });
    });
  };

  const selectCls =
    "mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
  const textareaCls =
    "mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

  const groups = [...new Set(INSPECTION_TYPES.map((t) => t.group))];

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      {/* Identity */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-ink">Check identity</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Check name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            error={fieldErrors.name?.[0]}
            placeholder="e.g. Title Tag"
          />
          <Input
            label="Field key"
            value={form.fieldKey}
            onChange={(e) => set("fieldKey", e.target.value)}
            error={fieldErrors.fieldKey?.[0]}
            hint="Stable machine key, e.g. seo.title_tag"
            placeholder="seo.title_tag"
          />
        </div>
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What this check verifies"
        />
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="block text-sm font-medium text-ink">
            Plan access
            <select
              value={form.planAccess}
              onChange={(e) => set("planAccess", e.target.value)}
              className={selectCls}
            >
              {PLAN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            Severity
            <select
              value={form.severity}
              onChange={(e) => set("severity", e.target.value)}
              className={selectCls}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s.toLowerCase()}</option>
              ))}
            </select>
          </label>
          <Input
            label="Score (points)"
            type="number"
            step="0.5"
            min={0}
            value={form.score}
            onChange={(e) => set("score", Number(e.target.value))}
          />
          <Input
            label="Weight"
            type="number"
            step="0.5"
            min={0}
            value={form.weight}
            onChange={(e) => set("weight", Number(e.target.value))}
          />
        </div>
      </fieldset>

      {/* Criteria */}
      <fieldset className="space-y-4 rounded-lg border border-slate-200 bg-surface-subtle/50 p-4">
        <legend className="px-1 text-sm font-semibold text-ink">Evaluation criteria</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            Inspection type
            <select
              value={form.criteria.inspectionType}
              onChange={(e) => set("criteria.inspectionType", e.target.value)}
              className={selectCls}
            >
              {groups.map((g) => (
                <optgroup key={g} label={g}>
                  {INSPECTION_TYPES.filter((t) => t.group === g).map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            Data source
            <select
              value={form.criteria.dataSource}
              onChange={(e) => set("criteria.dataSource", e.target.value)}
              className={selectCls}
            >
              {DATA_SOURCES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="CSS selector / extraction rule"
            value={form.criteria.selector}
            onChange={(e) => set("criteria.selector", e.target.value)}
            placeholder='e.g. h1, meta[name="description"]'
          />
          <Input
            label="Attribute / header name"
            value={form.criteria.attributeName}
            onChange={(e) => set("criteria.attributeName", e.target.value)}
            placeholder="e.g. alt, strict-transport-security"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="block text-sm font-medium text-ink">
            Operator
            <select
              value={form.criteria.operator}
              onChange={(e) => set("criteria.operator", e.target.value)}
              className={selectCls}
            >
              {OPERATORS.map((o) => (
                <option key={o} value={o}>{o.replace(/_/g, " ").toLowerCase()}</option>
              ))}
            </select>
          </label>
          <Input
            label="Expected value"
            value={form.criteria.expectedValue}
            onChange={(e) => set("criteria.expectedValue", e.target.value)}
          />
          <Input
            label="Minimum"
            type="number"
            value={form.criteria.minValue}
            onChange={(e) =>
              set("criteria.minValue", e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <Input
            label="Maximum"
            type="number"
            value={form.criteria.maxValue}
            onChange={(e) =>
              set("criteria.maxValue", e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Regex pattern"
            value={form.criteria.regexPattern}
            onChange={(e) => set("criteria.regexPattern", e.target.value)}
            hint="Used by 'matches regex'"
          />
          <label className="mt-7 flex items-center gap-2 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={form.criteria.caseSensitive}
              onChange={(e) => set("criteria.caseSensitive", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Case sensitive
          </label>
        </div>

        {/* Warning band */}
        <details className="rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-medium text-ink">
            Warning band (optional) — result becomes WARNING instead of FAIL when this matches
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-4">
            <label className="block text-sm font-medium text-ink">
              Warn operator
              <select
                value={form.criteria.warnOperator}
                onChange={(e) => set("criteria.warnOperator", e.target.value)}
                className={selectCls}
              >
                <option value="">— none —</option>
                {OPERATORS.map((o) => (
                  <option key={o} value={o}>{o.replace(/_/g, " ").toLowerCase()}</option>
                ))}
              </select>
            </label>
            <Input
              label="Warn expected"
              value={form.criteria.warnExpectedValue}
              onChange={(e) => set("criteria.warnExpectedValue", e.target.value)}
            />
            <Input
              label="Warn minimum"
              type="number"
              value={form.criteria.warnMinValue}
              onChange={(e) =>
                set("criteria.warnMinValue", e.target.value === "" ? "" : Number(e.target.value))
              }
            />
            <Input
              label="Warn maximum"
              type="number"
              value={form.criteria.warnMaxValue}
              onChange={(e) =>
                set("criteria.warnMaxValue", e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </div>
        </details>

        <label className="block text-sm font-medium text-ink">
          Advanced config (JSON)
          <textarea
            value={form.criteria.configJson}
            onChange={(e) => set("criteria.configJson", e.target.value)}
            rows={3}
            placeholder='e.g. {"strategy":"mobile","metric":"lcp_ms"} or {"rules":{"or":[{"var":"contact.hasEmail"},{"var":"contact.hasPhone"}]}}'
            className={textareaCls}
          />
          {fieldErrors["criteria.configJson"]?.[0] && (
            <p className="mt-1 text-xs text-danger-600">{fieldErrors["criteria.configJson"][0]}</p>
          )}
        </label>

        {/* Test against URL */}
        <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <FlaskConical className="h-4 w-4 text-brand-600" aria-hidden />
            Test this criterion against a live URL
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://example.com"
              aria-label="Test URL"
              className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={testPending}
              onClick={runTest}
              disabled={!testUrl.trim()}
            >
              Run test
            </Button>
          </div>
          {testResult && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
              {"error" in testResult ? (
                <span className="text-danger-600">{testResult.error}</span>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-medium">
                    <TestStatusIcon status={testResult.status} />
                    {testResult.status}
                    <span className="font-normal text-ink-muted">
                      (HTTP {testResult.httpStatus} · {testResult.fetchedUrl})
                    </span>
                  </div>
                  {testResult.appliesWhenPassed !== null && (
                    <div className={testResult.appliesWhenPassed ? "text-ink-secondary" : "text-warning-700"}>
                      Applies-when gate:{" "}
                      {testResult.appliesWhenPassed
                        ? "passed — the check runs on this site"
                        : "did NOT pass — on a real audit this check would resolve Not Applicable here"}
                      {testResult.detectedPlatform ? ` (detected: ${testResult.detectedPlatform})` : ""}
                    </div>
                  )}
                  <div className="text-ink-secondary">
                    Detected: <code className="rounded bg-slate-100 px-1">{testResult.actualValue ?? "—"}</code>
                    {" · "}Expected: {testResult.expectedSummary}
                  </div>
                  <p className="text-xs text-ink-muted">
                    Note: PageSpeed checks report NOT_APPLICABLE in tests (PSI is only fetched
                    during full audits).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </fieldset>

      {/* Messages */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ink">Results, messages & suggestions</legend>
        <p className="text-xs text-ink-muted">{PLACEHOLDER_HELP}</p>
        {(
          [
            ["PASS", "Passed", form.passLabel],
            ["FAIL", "Failed", form.failLabel],
            ["WARNING", "Warning", form.warningLabel],
          ] as const
        ).map(([status, label]) => (
          <details
            key={status}
            open={status !== "WARNING"}
            className="rounded-lg border border-slate-200 p-3"
          >
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
              <TestStatusIcon status={status} />
              {label} message & suggestion
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <Input
                  label="Message"
                  value={form.messages[status].message}
                  onChange={(e) => set(`messages.${status}.message`, e.target.value)}
                  placeholder={
                    status === "PASS"
                      ? "Your page contains a title tag."
                      : "Your page is missing a title tag."
                  }
                />
                <Input
                  label="Result label"
                  value={
                    status === "PASS"
                      ? form.passLabel
                      : status === "FAIL"
                        ? form.failLabel
                        : form.warningLabel
                  }
                  onChange={(e) =>
                    set(
                      status === "PASS"
                        ? "passLabel"
                        : status === "FAIL"
                          ? "failLabel"
                          : "warningLabel",
                      e.target.value,
                    )
                  }
                />
              </div>
              <label className="block text-sm font-medium text-ink">
                Suggestion
                <textarea
                  value={form.messages[status].suggestion}
                  onChange={(e) => set(`messages.${status}.suggestion`, e.target.value)}
                  rows={2}
                  placeholder="Actionable advice shown to the user"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </label>
            </div>
          </details>
        ))}
      </fieldset>

      {/* Misc */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Help article URL"
          value={form.helpArticleUrl}
          onChange={(e) => set("helpArticleUrl", e.target.value)}
          error={fieldErrors.helpArticleUrl?.[0]}
          placeholder="https://…"
        />
        <Input
          label="Category"
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          placeholder="Optional grouping tag"
        />
      </div>

      <label className="block text-sm font-medium text-ink">
        Page inspected
        <select
          value={form.pageType}
          onChange={(e) => set("pageType", e.target.value)}
          className={selectCls}
        >
          <option value="HOME">Home — the audited URL itself</option>
          <option value="PRODUCT">Product page (sampled from the sitemap)</option>
          <option value="COLLECTION">Collection page (sampled)</option>
          <option value="BLOG">Blog post (sampled)</option>
        </select>
        <span className="mt-1 block text-xs font-normal text-ink-muted">
          Non-home types are sampled from the store&apos;s sitemap during the audit. If that page
          type could not be sampled, the check reports Not&nbsp;Applicable — never a failure.
        </span>
      </label>

      <label className="block text-sm font-medium text-ink">
        Applies when <span className="font-normal text-ink-muted">(optional platform gate)</span>
        <textarea
          value={form.appliesWhen}
          onChange={(e) => set("appliesWhen", e.target.value)}
          rows={2}
          placeholder='JsonLogic, e.g. {"var":"site.isShopify"} or {">":[{"var":"site.appCount"},0]} — empty = always applies'
          className={textareaCls}
        />
        {fieldErrors.appliesWhen?.[0] && (
          <p className="mt-1 text-xs text-danger-600">{fieldErrors.appliesWhen[0]}</p>
        )}
        <span className="mt-1 block text-xs font-normal text-ink-muted">
          Falsy → the check resolves Not&nbsp;Applicable (excluded from scoring, never a FAIL).
          Errors fail open. Use the test tool above to see whether the gate passes on a real URL.
        </span>
      </label>

      <div className={cn("flex items-center justify-between border-t border-slate-100 pt-4")}>
        <label className="flex items-center gap-2 text-sm text-ink-secondary">
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={(e) => set("isEnabled", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Enabled
        </label>
        <Button type="submit" loading={pending}>
          {field ? "Save check" : "Create check"}
        </Button>
      </div>
    </form>
  );
}

function TestStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "PASS":
      return <CheckCircle2 className="h-4 w-4 text-success-600" aria-hidden />;
    case "FAIL":
      return <XCircle className="h-4 w-4 text-danger-600" aria-hidden />;
    case "WARNING":
      return <AlertTriangle className="h-4 w-4 text-warning-600" aria-hidden />;
    default:
      return <Info className="h-4 w-4 text-ink-muted" aria-hidden />;
  }
}
