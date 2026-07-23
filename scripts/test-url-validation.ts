/**
 * Quick manual verification of URL validation edge cases.
 * Run: npx tsx scripts/test-url-validation.ts
 * (Formal test suite arrives in Phase 9.)
 */
import { validateAndNormalizeUrl } from "../src/lib/security/url";

const cases: Array<{ input: string; expectOk: boolean }> = [
  { input: "http://192.168.1.1", expectOk: true }, // passes syntax; ssrf.ts blocks the IP
  { input: "javascript:alert(1)", expectOk: false },
  { input: "ftp://example.com", expectOk: false },
  { input: "notaurl", expectOk: false },
  { input: "https://user:pass@example.com", expectOk: false },
  { input: "example.com:9999", expectOk: false },
  { input: "https://example.com/page?q=1#frag", expectOk: true },
  { input: "www.example.com", expectOk: true },
  { input: "http://localhost", expectOk: false },
  { input: "https://foo.internal", expectOk: false },
  { input: "  https://example.com  ", expectOk: true },
  { input: "data:text/html,<h1>x</h1>", expectOk: false },
];

let failures = 0;
for (const { input, expectOk } of cases) {
  const r = validateAndNormalizeUrl(input);
  const pass = r.ok === expectOk;
  if (!pass) failures++;
  console.log(
    `${pass ? "PASS" : "FAIL"}  ${JSON.stringify(input)} -> ${
      r.ok ? `OK: ${r.value.url} (domain=${r.value.domain})` : `REJECT: ${r.error}`
    }`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} case(s) failed`);
  process.exit(1);
}
console.log("\nAll URL validation cases passed.");
