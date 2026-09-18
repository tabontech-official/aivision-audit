"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { SECTION_ICONS } from "@/lib/validation/builder";
import { createSectionAction, updateSectionAction } from "./actions";
import type { BuilderSection } from "./builder-client";

const PILLAR_OPTIONS = [
  { value: "FOUNDATIONS", label: "Foundations" },
  { value: "SPEED_VITALS", label: "Speed & Vitals" },
  { value: "ONPAGE_CONTENT", label: "On-page Content" },
  { value: "AI_ANSWER_ENGINES", label: "AI & Answer Engines" },
  { value: "TRUST_COMPLIANCE", label: "Trust & Compliance" },
  { value: "CONVERSION_UX", label: "Conversion & UX" },
];

const PLAN_OPTIONS = [
  { value: "BOTH", label: "Free + Premium" },
  { value: "FREE", label: "Free only" },
  { value: "PREMIUM", label: "Premium only" },
  { value: "HIDDEN", label: "Hidden" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function SectionForm({
  section,
  onDone,
}: {
  section: BuilderSection | null;
  onDone: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [slugTouched, setSlugTouched] = useState(!!section);

  const [form, setForm] = useState({
    name: section?.name ?? "",
    slug: section?.slug ?? "",
    shortDescription: section?.shortDescription ?? "",
    detailedDescription: section?.detailedDescription ?? "",
    icon: section?.icon ?? "layout",
    weight: section?.weight ?? 1,
    contributesToScore: section?.contributesToScore ?? true,
    planAccess: section?.planAccess ?? "BOTH",
    isEnabled: section?.isEnabled ?? true,
    defaultExpanded: section?.defaultExpanded ?? true,
    visibleInReport: section?.visibleInReport ?? true,
    accentColor: section?.accentColor ?? "#4F46E5",
    pillar: section?.pillar ?? "FOUNDATIONS",
    appliesWhen: section?.appliesWhen ?? "",
    adminNotes: section?.adminNotes ?? "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = section
        ? await updateSectionAction(section.id, form)
        : await createSectionAction(form);
      if (result.ok) {
        onDone(result.message ?? "Saved.");
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Alert variant="error">{error}</Alert>}
      {section?.isSystem && (
        <Alert variant="info">
          This is a system section. It can be renamed and configured, but not deleted.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Section name"
          value={form.name}
          onChange={(e) => {
            set("name", e.target.value);
            if (!slugTouched) set("slug", slugify(e.target.value));
          }}
          error={fieldErrors.name?.[0]}
          placeholder="e.g. Local SEO"
        />
        <Input
          label="Slug"
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
          error={fieldErrors.slug?.[0]}
          hint="Lowercase, dashes only"
          placeholder="local-seo"
        />
      </div>

      <Input
        label="Short description"
        value={form.shortDescription}
        onChange={(e) => set("shortDescription", e.target.value)}
        error={fieldErrors.shortDescription?.[0]}
        placeholder="One line shown under the section title"
      />

      <label className="block text-sm font-medium text-ink">
        Detailed description
        <textarea
          value={form.detailedDescription}
          onChange={(e) => set("detailedDescription", e.target.value)}
          rows={2}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium text-ink">
          Icon
          <select
            value={form.icon}
            onChange={(e) => set("icon", e.target.value)}
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {SECTION_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Weight"
          type="number"
          step="0.5"
          min={0}
          max={10}
          value={form.weight}
          onChange={(e) => set("weight", Number(e.target.value))}
          error={fieldErrors.weight?.[0]}
          hint="Contribution to overall score"
        />
        <label className="block text-sm font-medium text-ink">
          Accent color
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="color"
              value={form.accentColor}
              onChange={(e) => set("accentColor", e.target.value.toUpperCase())}
              aria-label="Accent color"
              className="h-10 w-12 cursor-pointer rounded-lg border border-slate-300"
            />
            <span className="text-sm text-ink-muted">{form.accentColor}</span>
          </div>
        </label>
      </div>

      <label className="block text-sm font-medium text-ink">
        Pillar
        <select
          value={form.pillar}
          onChange={(e) => set("pillar", e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          {PILLAR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs font-normal text-ink-muted">
          The customer-facing group this section renders under in the report.
        </span>
      </label>

      <label className="block text-sm font-medium text-ink">
        Plan access
        <select
          value={form.planAccess}
          onChange={(e) => set("planAccess", e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          {PLAN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["isEnabled", "Enabled"],
            ["defaultExpanded", "Expanded by default"],
            ["visibleInReport", "Visible in report"],
            ["contributesToScore", "Counts toward score"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(e) => set(key, e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {label}
          </label>
        ))}
      </div>

      <label className="block text-sm font-medium text-ink">
        Applies when <span className="font-normal text-ink-muted">(optional platform gate)</span>
        <textarea
          value={form.appliesWhen}
          onChange={(e) => set("appliesWhen", e.target.value)}
          rows={2}
          placeholder='JsonLogic over the snapshot, e.g. {"var":"site.isShopify"} — leave empty to always apply'
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        {fieldErrors.appliesWhen?.[0] && (
          <span className="mt-1 block text-xs font-normal text-danger-600">
            {fieldErrors.appliesWhen[0]}
          </span>
        )}
        <span className="mt-1 block text-xs font-normal text-ink-muted">
          When falsy, every check in this section resolves Not&nbsp;Applicable and the section is
          excluded from the score. Same operations as the rules evaluator.
        </span>
      </label>

      <label className="block text-sm font-medium text-ink">
        Internal admin notes
        <textarea
          value={form.adminNotes}
          onChange={(e) => set("adminNotes", e.target.value)}
          rows={2}
          placeholder="Never shown to users"
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </label>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button type="submit" loading={pending}>
          {section ? "Save section" : "Create section"}
        </Button>
      </div>
    </form>
  );
}
