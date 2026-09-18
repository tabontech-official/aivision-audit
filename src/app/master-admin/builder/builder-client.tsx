"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Copy,
  Trash2,
  Power,
  GripVertical,
  Rocket,
  Lock,
  FileUp,
  FileDown,
  FileCode,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SAMPLE_SECTION_JSON } from "@/lib/builder/sample-section";
import { Button } from "@/components/ui/button";
import { Badge, planBadgeVariant, severityBadgeVariant } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { SectionForm } from "./section-form";
import { FieldEditor } from "./field-editor";
import {
  toggleSectionAction,
  deleteSectionAction,
  duplicateSectionAction,
  reorderSectionsAction,
  toggleFieldAction,
  deleteFieldAction,
  duplicateFieldAction,
  reorderFieldsAction,
  publishDraftAction,
  importSectionJsonAction,
  exportTemplateJsonAction,
} from "./actions";
import type { ImportSectionOutcome } from "@/services/builder/import-export";

/* ---------- serialized types shared with the server page ---------- */

export type BuilderCriteria = {
  inspectionType: string;
  dataSource: string;
  selector: string | null;
  attributeName: string | null;
  operator: string;
  expectedValue: string | null;
  minValue: number | null;
  maxValue: number | null;
  regexPattern: string | null;
  caseSensitive: boolean;
  warnOperator: string | null;
  warnExpectedValue: string | null;
  warnMinValue: number | null;
  warnMaxValue: number | null;
  config: Record<string, unknown>;
};

export type BuilderField = {
  id: string;
  name: string;
  fieldKey: string;
  description: string | null;
  isEnabled: boolean;
  planAccess: string;
  severity: string;
  category: string | null;
  score: number;
  weight: number;
  passLabel: string;
  failLabel: string;
  warningLabel: string;
  helpArticleUrl: string | null;
  appliesWhen: string | null;
  pageType: string;
  adminNotes: string | null;
  criteria: BuilderCriteria | null;
  suggestions: Array<{ forStatus: string; message: string; suggestion: string | null }>;
};

export type BuilderSection = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  detailedDescription: string | null;
  icon: string | null;
  displayOrder: number;
  isEnabled: boolean;
  defaultExpanded: boolean;
  weight: number;
  contributesToScore: boolean;
  planAccess: string;
  visibleInReport: boolean;
  accentColor: string | null;
  isSystem: boolean;
  pillar: string;
  appliesWhen: string | null;
  adminNotes: string | null;
  fields: BuilderField[];
};

export type BuilderData = {
  templateName: string;
  draft: { id: string; versionNumber: number; sections: BuilderSection[] } | null;
  publishedVersion: { versionNumber: number; publishedAt: string | null } | null;
};

/**
 * Checks carry a `category`, which is what an import writes when it merges a
 * re-imported section into an existing one. Consecutive checks sharing a
 * category render under one header, so a merged section reads as a main
 * section with sub-sections inside it. Runs stay contiguous so the header
 * order always matches the stored display order.
 */
type FieldGroup = { label: string | null; items: Array<{ field: BuilderField; index: number }> };

function groupFieldsBySubSection(fields: BuilderField[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  fields.forEach((field, index) => {
    const label = field.category?.trim() ? field.category.trim() : null;
    const current = groups[groups.length - 1];
    if (current && current.label === label) current.items.push({ field, index });
    else groups.push({ label, items: [{ field, index }] });
  });
  return groups;
}

/** Browser download of a generated file — used by both JSON exports. */
function downloadJson(fileName: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */

export function BuilderClient({ data }: { data: BuilderData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sectionModal, setSectionModal] = useState<
    { mode: "create" } | { mode: "edit"; section: BuilderSection } | null
  >(null);
  const [fieldModal, setFieldModal] = useState<
    { sectionId: string; sectionName: string; field: BuilderField | null } | null
  >(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [changelog, setChangelog] = useState("");

  // JSON Import States
  const [importOpen, setImportOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importOutcomes, setImportOutcomes] = useState<ImportSectionOutcome[] | null>(null);
  const [updateSectionSettings, setUpdateSectionSettings] = useState(false);
  const [replaceExistingChecks, setReplaceExistingChecks] = useState(true);
  const [exporting, setExporting] = useState(false);

  const closeImport = () => {
    setImportOpen(false);
    setJsonText("");
    setImportError(null);
    setImportOutcomes(null);
  };

  const exportTemplate = async () => {
    setFlash(null);
    setExporting(true);
    try {
      const r = await exportTemplateJsonAction();
      if (r.ok && r.data) {
        downloadJson(r.data.fileName, r.data.json);
        setFlash({ kind: "success", text: r.message ?? "Template exported." });
      } else {
        setFlash({ kind: "error", text: r.ok ? "Nothing to export." : r.error });
      }
    } catch (err) {
      setFlash({
        kind: "error",
        text: err instanceof Error ? err.message : "Network error exporting the template.",
      });
    } finally {
      setExporting(false);
    }
  };

  const sampleSectionJson = SAMPLE_SECTION_JSON;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setJsonText(content);
    };
    reader.readAsText(file);
  };

  const [localSections, setLocalSections] = useState<BuilderSection[]>(data.draft?.sections ?? []);

  useEffect(() => {
    if (data.draft?.sections) {
      setLocalSections(data.draft.sections);
    }
  }, [data.draft?.sections]);

  const sections = localSections;

  const run = (
    fn: () => Promise<{ ok: boolean; message?: string; error?: string }>,
    optimisticUpdate?: (prev: BuilderSection[]) => BuilderSection[],
  ) => {
    setFlash(null);
    if (optimisticUpdate) {
      setLocalSections((prev) => optimisticUpdate(prev));
    }
    startTransition(async () => {
      try {
        const result = await fn();
        if (result.ok) {
          if (result.message) setFlash({ kind: "success", text: result.message });
        } else {
          setFlash({ kind: "error", text: result.error ?? "Something went wrong." });
        }
      } catch (err) {
        setFlash({
          kind: "error",
          text: err instanceof Error ? err.message : "Network error performing action.",
        });
      }
    });
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const moveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const newSections = [...sections];
    [newSections[index], newSections[target]] = [newSections[target]!, newSections[index]!];
    const ids = newSections.map((s) => s.id);
    run(
      () => reorderSectionsAction(ids),
      () => newSections,
    );
  };

  const moveField = (section: BuilderSection, index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= section.fields.length) return;
    const newFields = [...section.fields];
    [newFields[index], newFields[target]] = [newFields[target]!, newFields[index]!];
    const ids = newFields.map((f) => f.id);
    run(
      () => reorderFieldsAction(section.id, ids),
      (prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, fields: newFields } : s)),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Report Builder</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {data.templateName} — configure the sections and checks every audit runs.
          </p>
          <div className="mt-2 flex items-center gap-2">
            {data.draft && <Badge variant="draft">Editing draft v{data.draft.versionNumber}</Badge>}
            {data.publishedVersion && (
              <Badge variant="published">
                Live: v{data.publishedVersion.versionNumber}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setSampleOpen(true)}>
            <FileCode className="h-4 w-4" aria-hidden />
            Sample JSON
          </Button>
          <Button type="button" variant="secondary" onClick={() => setImportOpen(true)}>
            <FileUp className="h-4 w-4" aria-hidden />
            Import JSON
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={exporting}
            disabled={!data.draft}
            onClick={() => void exportTemplate()}
          >
            <FileDown className="h-4 w-4" aria-hidden />
            Export JSON
          </Button>
          <Button type="button" variant="secondary" onClick={() => setSectionModal({ mode: "create" })}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Section
          </Button>
          <Button type="button" onClick={() => setPublishOpen(true)} disabled={!data.draft}>
            <Rocket className="h-4 w-4" aria-hidden />
            Publish
          </Button>
        </div>
      </div>

      {flash && (
        <Alert variant={flash.kind === "success" ? "success" : "error"}>{flash.text}</Alert>
      )}

      {!data.draft && (
        <Alert variant="info">
          No draft exists yet — it will be created automatically on your first edit.
        </Alert>
      )}

      {/* Section list */}
      <div className="space-y-3">
        {sections.map((section, i) => {
          const isOpen = expanded.has(section.id);
          return (
            <div
              key={section.id}
              className={cn("card overflow-hidden", !section.isEnabled && "opacity-70")}
            >
              {/* Section header row */}
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="flex flex-col text-ink-muted">
                  <button
                    aria-label={`Move ${section.name} up`}
                    disabled={i === 0 || pending}
                    onClick={() => moveSection(i, -1)}
                    className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label={`Move ${section.name} down`}
                    disabled={i === sections.length - 1 || pending}
                    onClick={() => moveSection(i, 1)}
                    className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <GripVertical className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />

                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => toggleExpand(section.id)}
                  aria-expanded={isOpen}
                >
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: section.accentColor ?? "#cbd5e1" }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-ink">{section.name}</span>
                      {section.isSystem && <Badge variant="system">System</Badge>}
                      <Badge variant={planBadgeVariant(section.planAccess)}>
                        {section.planAccess === "BOTH" ? "Free + Premium" : section.planAccess.toLowerCase()}
                      </Badge>
                      <Badge variant={section.isEnabled ? "enabled" : "disabled"}>
                        {section.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="truncate text-xs text-ink-muted">
                      {section.fields.length} checks · weight {section.weight}
                      {section.shortDescription ? ` · ${section.shortDescription}` : ""}
                    </div>
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    label={`Edit ${section.name}`}
                    onClick={() => setSectionModal({ mode: "edit", section })}
                  >
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label={section.isEnabled ? `Disable ${section.name}` : `Enable ${section.name}`}
                    onClick={() =>
                      run(
                        () => toggleSectionAction(section.id),
                        (prev) =>
                          prev.map((s) => (s.id === section.id ? { ...s, isEnabled: !s.isEnabled } : s)),
                      )
                    }
                  >
                    <Power className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label={`Duplicate ${section.name}`}
                    onClick={() => run(() => duplicateSectionAction(section.id))}
                  >
                    <Copy className="h-4 w-4" />
                  </IconButton>
                  {section.isSystem ? (
                    <span className="p-1.5 text-slate-300" title="System sections cannot be deleted">
                      <Lock className="h-4 w-4" aria-hidden />
                    </span>
                  ) : (
                    <IconButton
                      label={`Delete ${section.name}`}
                      danger
                      onClick={() => {
                        if (confirm(`Delete section "${section.name}" and all its checks?`)) {
                          run(
                            () => deleteSectionAction(section.id),
                            (prev) => prev.filter((s) => s.id !== section.id),
                          );
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  )}
                  <button
                    onClick={() => toggleExpand(section.id)}
                    aria-label={isOpen ? "Collapse" : "Expand"}
                    className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100"
                  >
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                    />
                  </button>
                </div>
              </div>

              {/* Fields */}
              {isOpen && (
                <div className="border-t border-slate-100 bg-surface-subtle/60">
                  {section.fields.length === 0 && (
                    <p className="px-6 py-4 text-sm text-ink-muted">
                      No checks yet — add the first one.
                    </p>
                  )}
                  {groupFieldsBySubSection(section.fields).map((group, gi) => (
                    <div key={`${section.id}-group-${gi}`}>
                      {group.label && (
                        <div className="flex items-center gap-2 border-y border-slate-200/70 bg-slate-100/70 px-4 py-1.5 first:border-t-0">
                          <Layers className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden />
                          <span className="truncate text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                            {group.label}
                          </span>
                          <span className="text-[11px] text-ink-muted">
                            {group.items.length} check{group.items.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      )}
                      <ul className="divide-y divide-slate-100">
                    {group.items.map(({ field, index: fi }) => (
                      <li
                        key={field.id}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5",
                          !field.isEnabled && "opacity-60",
                        )}
                      >
                        <div className="flex flex-col text-ink-muted">
                          <button
                            aria-label={`Move ${field.name} up`}
                            disabled={fi === 0 || pending}
                            onClick={() => moveField(section, fi, -1)}
                            className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            aria-label={`Move ${field.name} down`}
                            disabled={fi === section.fields.length - 1 || pending}
                            onClick={() => moveField(section, fi, 1)}
                            className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-ink">
                              {field.name}
                            </span>
                            <Badge variant={severityBadgeVariant(field.severity)}>
                              {field.severity.toLowerCase()}
                            </Badge>
                            <Badge variant={planBadgeVariant(field.planAccess)}>
                              {field.planAccess === "BOTH" ? "Free + Premium" : field.planAccess.toLowerCase()}
                            </Badge>
                            {!field.isEnabled && <Badge variant="disabled">Disabled</Badge>}
                          </div>
                          <div className="truncate text-xs text-ink-muted">
                            <code>{field.fieldKey}</code>
                            {field.criteria ? ` · ${field.criteria.inspectionType}` : " · no criteria"}
                            {` · ${field.score} pts`}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <IconButton
                            label={`Edit ${field.name}`}
                            onClick={() =>
                              setFieldModal({ sectionId: section.id, sectionName: section.name, field })
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </IconButton>
                          <IconButton
                            label={field.isEnabled ? `Disable ${field.name}` : `Enable ${field.name}`}
                            onClick={() =>
                              run(
                                () => toggleFieldAction(field.id),
                                (prev) =>
                                  prev.map((s) =>
                                    s.id === section.id
                                      ? {
                                          ...s,
                                          fields: s.fields.map((f) =>
                                            f.id === field.id ? { ...f, isEnabled: !f.isEnabled } : f,
                                          ),
                                        }
                                      : s,
                                  ),
                              )
                            }
                          >
                            <Power className="h-3.5 w-3.5" />
                          </IconButton>
                          <IconButton
                            label={`Duplicate ${field.name}`}
                            onClick={() => run(() => duplicateFieldAction(field.id))}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </IconButton>
                          <IconButton
                            label={`Delete ${field.name}`}
                            danger
                            onClick={() => {
                              if (confirm(`Delete check "${field.name}"?`)) {
                                run(
                                  () => deleteFieldAction(field.id),
                                  (prev) =>
                                    prev.map((s) =>
                                      s.id === section.id
                                        ? { ...s, fields: s.fields.filter((f) => f.id !== field.id) }
                                        : s,
                                    ),
                                );
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </IconButton>
                        </div>
                      </li>
                    ))}
                      </ul>
                    </div>
                  ))}
                  <div className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setFieldModal({ sectionId: section.id, sectionName: section.name, field: null })
                      }
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                      Add Check
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <Modal
        open={sectionModal !== null}
        onClose={() => setSectionModal(null)}
        title={sectionModal?.mode === "edit" ? "Edit section" : "Add section"}
      >
        {sectionModal && (
          <SectionForm
            section={sectionModal.mode === "edit" ? sectionModal.section : null}
            onDone={(msg) => {
              setSectionModal(null);
              setFlash({ kind: "success", text: msg });
              router.refresh();
            }}
          />
        )}
      </Modal>

      <Modal
        open={fieldModal !== null}
        onClose={() => setFieldModal(null)}
        title={
          fieldModal?.field
            ? `Edit check — ${fieldModal.sectionName}`
            : `Add check — ${fieldModal?.sectionName ?? ""}`
        }
        wide
      >
        {fieldModal && (
          <FieldEditor
            sectionId={fieldModal.sectionId}
            field={fieldModal.field}
            onDone={(msg) => {
              setFieldModal(null);
              setFlash({ kind: "success", text: msg });
              router.refresh();
            }}
          />
        )}
      </Modal>

      <Modal open={publishOpen} onClose={() => setPublishOpen(false)} title="Publish draft">
        <div className="space-y-4">
          <p className="text-sm text-ink-secondary">
            Publishing freezes draft v{data.draft?.versionNumber} — new audits will use it
            immediately, existing reports keep the version they ran against, and a fresh
            draft is created for further edits.
          </p>
          <label className="block text-sm font-medium text-ink">
            Changelog (optional)
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="What changed in this version?"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={pending}
              onClick={() =>
                run(async () => {
                  const r = await publishDraftAction(changelog);
                  if (r.ok) {
                    setPublishOpen(false);
                    setChangelog("");
                  }
                  return r;
                })
              }
            >
              <Rocket className="h-4 w-4" aria-hidden />
              Publish version
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Section JSON Modal */}
      <Modal open={importOpen} onClose={closeImport} title="Import Sections from JSON" wide>
        <div className="space-y-4">
          <p className="text-sm text-ink-secondary">
            Upload a <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">.json</code> file or
            paste JSON. One section, an array of sections, or a whole exported template
            (<code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">{"{ \"sections\": [...] }"}</code>)
            all work, so you can create many sections in one go.
          </p>
          <p className="text-sm text-ink-secondary">
            <strong className="font-semibold text-ink">Re-importing an existing section merges it.</strong>{" "}
            A section already in the draft (matched on slug, then on name) keeps its own settings and the
            incoming checks are appended as a sub-section inside it. Name that group with a{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">subSection</code> key, or let it
            default to the incoming section name.
          </p>

          {importError && <Alert variant="error">{importError}</Alert>}

          {importOutcomes && importOutcomes.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-surface-subtle p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                What was applied
              </div>
              <ul className="space-y-1.5 text-sm">
                {importOutcomes.map((o) => (
                  <li key={`${o.slug}-${o.action}`} className="flex flex-wrap items-center gap-2">
                    <Badge variant={o.action === "created" ? "enabled" : "draft"}>
                      {o.action === "created" ? "created" : "merged"}
                    </Badge>
                    <span className="font-medium text-ink">{o.name}</span>
                    {o.subSection && (
                      <span className="text-xs text-ink-secondary">
                        → sub-section “{o.subSection}”
                      </span>
                    )}
                    <span className="text-xs text-ink-muted">
                      {o.createdChecks} added
                      {o.updatedChecks ? `, ${o.updatedChecks} updated` : ""}
                      {o.skippedChecks ? `, ${o.skippedChecks} untouched` : ""}
                      {o.sectionSettingsUpdated ? ", section settings overwritten" : ""}
                      {o.restored ? ", section restored" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <fieldset className="space-y-2 rounded-lg border border-slate-200 p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              When a section already exists
            </legend>
            <label className="flex items-start gap-2 text-sm text-ink-secondary">
              <input
                type="checkbox"
                checked={replaceExistingChecks}
                onChange={(e) => setReplaceExistingChecks(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
              />
              <span>
                Update checks that share a field key
                <span className="block text-xs text-ink-muted">
                  On — a regenerated check replaces the stored one. Off — every stored check is left exactly as it is
                  and only genuinely new checks are added.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm text-ink-secondary">
              <input
                type="checkbox"
                checked={updateSectionSettings}
                onChange={(e) => setUpdateSectionSettings(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
              />
              <span>
                Overwrite the section’s own settings
                <span className="block text-xs text-ink-muted">
                  Off by default — weight, plan access, icon and descriptions of the existing main section stay
                  untouched.
                </span>
              </span>
            </label>
          </fieldset>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Upload JSON File
            </label>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-ink-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-ink hover:file:bg-slate-200 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Or Paste JSON Content
            </label>
            <textarea
              rows={10}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setImportError(null);
              }}
              placeholder="Paste one section, an array of sections, or an exported template here..."
              className="w-full font-mono text-xs rounded-lg border border-slate-300 p-3 text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setJsonText(sampleSectionJson);
                setImportError(null);
              }}
            >
              Load Sample Format
            </Button>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={closeImport}>
                {importOutcomes ? "Close" : "Cancel"}
              </Button>
              <Button
                loading={pending}
                disabled={!jsonText.trim()}
                onClick={() => {
                  setImportError(null);
                  setImportOutcomes(null);
                  run(async () => {
                    const r = await importSectionJsonAction(jsonText, {
                      updateSectionSettings,
                      onExistingCheck: replaceExistingChecks ? "update" : "skip",
                    });
                    if (r.ok) {
                      setImportOutcomes(r.data ?? []);
                      setJsonText("");
                      router.refresh();
                    } else {
                      setImportError(r.error ?? "Failed to import.");
                    }
                    return r;
                  });
                }}
              >
                <FileUp className="h-4 w-4" aria-hidden />
                Import
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Sample JSON Format Modal */}
      <Modal
        open={sampleOpen}
        onClose={() => setSampleOpen(false)}
        title="Sample Section JSON — schema, format & AI prompt"
        wide
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-secondary">
            This file is both a working example and a full brief for an AI assistant. Copy it,
            paste it into any AI chat, replace{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">
              _PROMPT_FOR_AI.yourRequest
            </code>{" "}
            with a plain-English description of the section you want, and import the JSON it
            returns. Every enum, trigger, data path and scoring rule is documented inside, so you
            only have to describe the new functionality.
          </p>
          <p className="text-sm text-ink-secondary">
            The{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">_</code>-prefixed
            keys are documentation — the importer ignores them, so this file can also be imported
            as-is to create the example section.
          </p>

          <div className="relative">
            <pre className="max-h-96 overflow-y-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-emerald-400">
              {sampleSectionJson}
            </pre>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(sampleSectionJson);
                setFlash({ kind: "success", text: "Sample JSON copied — paste it into your AI chat." });
                setSampleOpen(false);
              }}
              className="absolute top-2 right-2 rounded bg-slate-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-600 transition-colors"
            >
              Copy JSON
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                const blob = new Blob([sampleSectionJson], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "section-template.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download .json
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSampleOpen(false);
                setJsonText(sampleSectionJson);
                setImportOpen(true);
              }}
            >
              Use in Import
            </Button>
            <Button onClick={() => setSampleOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "rounded-lg p-1.5 transition-colors",
        danger
          ? "text-ink-muted hover:bg-danger-50 hover:text-danger-600"
          : "text-ink-muted hover:bg-slate-100 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
