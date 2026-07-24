import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
const db = new PrismaClient();
const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

async function main() {
  const email = "testuser@example.com";
  const password = "Test@1234";
  const passwordHash = await hash(password, ARGON);
  const user = await db.user.upsert({
    where: { email },
    update: { plan: "FREE", passwordHash, emailVerifiedAt: new Date() },
    create: { email, name: "Test User", passwordHash, plan: "FREE", emailVerifiedAt: new Date() },
  });
  // Attach the wikipedia report to this user
  const report = await db.report.findUnique({ where: { publicId: "wvKjR2sHoycPv3BKUtrLW" }, include: { website: true } });
  if (report) {
    await db.report.update({ where: { id: report.id }, data: { userId: user.id, anonymousSessionId: null, expiresAt: null } });
    await db.website.update({ where: { id: report.websiteId }, data: { userId: user.id } });
    console.log("Attached report wvKjR2sHoycPv3BKUtrLW to", email);
  }
  console.log("User ready:", email, "/", password, "plan=FREE");
}
main().finally(() => db.$disconnect());
