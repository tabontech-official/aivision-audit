import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const r = await db.report.findUnique({ where: { publicId: process.argv[2] } });
  if (!r) { console.log("not found"); return; }
  const [ar, sr] = await Promise.all([
    db.auditResult.count({ where: { reportId: r.id } }),
    db.reportSectionResult.count({ where: { reportId: r.id } }),
  ]);
  console.log(`auditResults=${ar} (expect 20)  sectionResults=${sr} (expect 7)  score=${r.overallScore} grade=${r.grade}`);
}
main().finally(() => db.$disconnect());
