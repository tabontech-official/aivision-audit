import "dotenv/config";
import { fetchBacklinkDataFromMangools } from "../src/services/mangools/client";

async function main() {
  const domain = process.argv[2] || "stripe.com";
  console.log(`\n==============================================`);
  console.log(`Testing Mangools Backlink Fetch for: ${domain}`);
  console.log(`==============================================\n`);

  if (!process.env.MANGOOLS_API_KEY) {
    console.error("❌ ERROR: MANGOOLS_API_KEY is not set in .env file!");
    process.exit(1);
  }

  try {
    const startTime = Date.now();
    const dataset = await fetchBacklinkDataFromMangools(domain, (progress) => {
      console.log(
        `⏳ Progress: Page ${progress.currentPage}/${progress.totalPages} | Fetched: ${progress.fetchedRows} / ${progress.totalAvailable} backlinks`
      );
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const ov = dataset.overview;

    console.log(`\n✅ Fetch Complete in ${elapsed}s!`);
    console.log(`----------------------------------------------`);
    console.log(`Domain:                            ${ov.domain}`);
    console.log(`Status:                            ${ov.status}`);
    console.log(`Total Backlinks (Analyzed):        ${ov.totalBacklinks}`);
    console.log(`Dofollow Backlinks:                ${ov.dofollowCount}`);
    console.log(`Nofollow Backlinks:                ${ov.nofollowCount}`);
    console.log(`Total Referring Domains:           ${ov.referringDomains}`);
    console.log(`Domain Rank (DA/DR):               ${ov.domainRank}`);
    console.log(`Broken Backlinks:                  ${ov.brokenBacklinks}`);
    console.log(`Suspicious Backlinks:              ${ov.suspiciousBacklinks}`);
    console.log(`(Internal) Provider Indexed Count: ${ov.providerIndexedBacklinks || ov.totalIndexedBacklinks}`);
    console.log(`API Calls Made:                    ${ov.costMetrics?.apiCallsCount}`);
    console.log(`Pages Fetched:                     ${ov.costMetrics?.pagesFetched}`);
    console.log(`Top Referring Domains:             ${dataset.referringDomains.length}`);
    console.log(`Top Anchors:                       ${dataset.anchors.length}`);
    console.log(`Top Pages:                         ${dataset.topPages.length}`);
    console.log(`----------------------------------------------\n`);

    if (dataset.backlinks.length > 0) {
      console.log(`Top 5 Sample Backlinks:`);
      dataset.backlinks.slice(0, 5).forEach((b, i) => {
        console.log(`  ${i + 1}. Source: ${b.sourceUrl}`);
        console.log(`     Target: ${b.targetUrl}`);
        console.log(`     Anchor: "${b.anchor}" | Dofollow: ${b.isDofollow} | Domain Rank: ${b.domainRank}`);
      });
    } else {
      console.log(`ℹ️ No individual backlinks returned for this domain.`);
    }

  } catch (error: any) {
    console.error("\n❌ Error fetching from Mangools:", error.message || error);
  }
}

main();
