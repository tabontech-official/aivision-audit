import "dotenv/config";
import { fetchPage } from "../src/services/inspection/fetcher";

async function main() {
  const r = await fetchPage("https://example.com/");
  if (!r.ok) { console.log("FAIL:", r.error); return; }
  console.log({
    status: r.page.httpStatus,
    bytes: r.page.htmlSizeBytes,
    encoding: r.page.responseHeaders["content-encoding"] ?? "(none)",
    htmlStart: JSON.stringify(r.page.html.slice(0, 80)),
    looksLikeHtml: r.page.html.trimStart().startsWith("<"),
  });
}
main();
