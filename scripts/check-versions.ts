import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const versions = await db.templateVersion.findMany({
    orderBy: { versionNumber: "asc" },
    include: { _count: { select: { sections: true } } },
  });
  for (const v of versions) {
    const fieldCount = await db.auditField.count({
      where: { section: { templateVersionId: v.id }, deletedAt: null },
    });
    console.log(`v${v.versionNumber} ${v.status} sections=${v._count.sections} fields=${fieldCount}`);
  }
}
main().finally(() => db.$disconnect());
