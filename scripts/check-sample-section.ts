/**
 * Guards the builder's Sample JSON: it must stay importable as-is even though
 * it carries the `_PROMPT_FOR_AI` / `_REFERENCE` documentation blocks.
 *
 * Run: npx tsx scripts/check-sample-section.ts
 */
import { SAMPLE_SECTION_JSON } from "../src/lib/builder/sample-section";
import { sectionInputSchema, fieldInputSchema } from "../src/lib/validation/builder";

const parsed = JSON.parse(SAMPLE_SECTION_JSON) as Record<string, unknown>;

const section = sectionInputSchema.safeParse(parsed);
if (!section.success) {
  console.error("Section failed validation:", section.error.issues);
  process.exit(1);
}

// The documentation keys must not survive into what gets written to the DB.
const leaked = Object.keys(section.data).filter((k) => k.startsWith("_"));
if (leaked.length) {
  console.error("Doc-only keys leaked into the section payload:", leaked);
  process.exit(1);
}

const rawFields = Array.isArray(parsed.fields) ? (parsed.fields as unknown[]) : [];
if (rawFields.length === 0) {
  console.error("Sample has no fields.");
  process.exit(1);
}

const seenKeys = new Set<string>();
rawFields.forEach((raw, i) => {
  const field = fieldInputSchema.safeParse(raw);
  if (!field.success) {
    console.error(`Field #${i + 1} failed validation:`, field.error.issues);
    process.exit(1);
  }
  const fieldLeaked = Object.keys(field.data).filter((k) => k.startsWith("_"));
  if (fieldLeaked.length) {
    console.error(`Field #${i + 1} leaked doc-only keys:`, fieldLeaked);
    process.exit(1);
  }
  // @@unique([sectionId, fieldKey]) — a duplicate would blow up the import transaction.
  if (seenKeys.has(field.data.fieldKey)) {
    console.error(`Duplicate fieldKey: ${field.data.fieldKey}`);
    process.exit(1);
  }
  seenKeys.add(field.data.fieldKey);
});

console.log(
  `OK — sample section "${section.data.name}" validates with ${rawFields.length} check(s); documentation keys stripped.`,
);
