import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const user = await db.user.findUnique({ where: { email: "testuser@example.com" } });
  if (!user) { console.log("no test user"); return; }
  // Detach the wikipedia report back to anonymous-less owned state stays; just delete the test user's link
  // Simplest: soft-delete the test user and null its reports' ownership
  await db.report.updateMany({ where: { userId: user.id }, data: { deletedAt: new Date() } });
  await db.website.updateMany({ where: { userId: user.id }, data: { deletedAt: new Date() } });
  await db.user.delete({ where: { id: user.id } });
  console.log("test user and its data removed");
}
main().finally(() => db.$disconnect());
