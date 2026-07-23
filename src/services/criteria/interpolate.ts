import "server-only";

/**
 * Stage 3 of the criteria engine: render admin-authored message/suggestion
 * templates with a strict placeholder whitelist. Values are HTML-escaped;
 * unknown placeholders are left literal (visible to the admin as a typo cue).
 */

export type InterpolationValues = {
  domain?: string;
  actualValue?: string | null;
  expectedValue?: string | null;
  count?: number | null;
  minimum?: number | null;
  maximum?: number | null;
  pageTitle?: string | null;
  sectionName?: string;
};

const PLACEHOLDER_RE = /\{\{\s*(domain|actualValue|expectedValue|count|minimum|maximum|pageTitle|sectionName)\s*\}\}/g;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function interpolate(template: string, values: InterpolationValues): string {
  return template.replace(PLACEHOLDER_RE, (_match, key: string) => {
    const v = values[key as keyof InterpolationValues];
    if (v === undefined || v === null) return "—";
    return escapeHtml(String(v));
  });
}
