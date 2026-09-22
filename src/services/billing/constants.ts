export const STANDARD_FEATURE_KEYS = [
  { key: "technical_seo", label: "Technical SEO Audit", defaultEnabled: true },
  { key: "onpage_seo", label: "On-Page SEO & Content Checks", defaultEnabled: true },
  { key: "schema_suite", label: "Schema & Structured Data Validation", defaultEnabled: true },
  { key: "page_speed", label: "Page Speed & Core Web Vitals", defaultEnabled: true },
  { key: "ai_answers", label: "AI Search & Answer Engine Optimization", defaultEnabled: true },
  { key: "backlinks", label: "Backlinks & Referring Domains Module", defaultEnabled: false },
  { key: "keywords", label: "Keyword Research & SERP Intelligence", defaultEnabled: false },
  { key: "pdf_export", label: "Branded PDF Export", defaultEnabled: false },
  { key: "custom_branding", label: "White Label / Agency Branding", defaultEnabled: false },
  { key: "shareable_links", label: "Public Shareable Audit Links", defaultEnabled: true },
  { key: "priority_processing", label: "Priority Speed Queue", defaultEnabled: false },
] as const;

export type FeatureKey = (typeof STANDARD_FEATURE_KEYS)[number]["key"];
