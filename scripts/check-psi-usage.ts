import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const rows = await db.apiUsage.findMany({
    where: { provider: "pagespeed" },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  if (rows.length === 0) console.log("(no pagespeed usage rows)");
  for (const r of rows) {
    console.log(`${r.endpoint} -> status=${r.statusCode} success=${r.success} err=${(r.errorMessage ?? "").slice(0, 160)}`);
  }
}
main().finally(() => db.$disconnect());
