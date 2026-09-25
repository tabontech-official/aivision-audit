import { db } from "@/lib/db/client";

/**
 * Completely and permanently purges a user and all data belonging to them
 * from the database, allowing the email address to be cleanly reused for signup.
 */
export async function hardDeleteUserAndAllData(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) return false;

  const email = user.email;

  // 1. Find all websites owned by the user
  const websites = await db.website.findMany({
    where: { userId },
    select: { id: true },
  });
  const websiteIds = websites.map((w) => w.id);

  // 2. Find all reports owned by the user or associated with their websites
  const reports = await db.report.findMany({
    where: {
      OR: [
        { userId },
        ...(websiteIds.length > 0 ? [{ websiteId: { in: websiteIds } }] : []),
      ],
    },
    select: { id: true },
  });
  const reportIds = reports.map((r) => r.id);

  // Disassociate leads referencing these reports
  if (reportIds.length > 0) {
    await db.lead.updateMany({
      where: { firstReportId: { in: reportIds } },
      data: { firstReportId: null },
    });
  }

  // 3. Delete report child records
  if (reportIds.length > 0) {
    await db.findingEvent.deleteMany({ where: { reportId: { in: reportIds } } });
    await db.auditResult.deleteMany({ where: { reportId: { in: reportIds } } });
    await db.reportSectionResult.deleteMany({ where: { reportId: { in: reportIds } } });
    await db.pageSpeedResult.deleteMany({ where: { reportId: { in: reportIds } } });
    await db.websiteRawData.deleteMany({ where: { reportId: { in: reportIds } } });
    await db.sampledPage.deleteMany({ where: { reportId: { in: reportIds } } });
    await db.reportSnapshot.deleteMany({ where: { reportId: { in: reportIds } } });
  }

  // 4. Delete website child records
  if (websiteIds.length > 0) {
    const findings = await db.finding.findMany({
      where: { websiteId: { in: websiteIds } },
      select: { id: true },
    });
    const findingIds = findings.map((f) => f.id);
    if (findingIds.length > 0) {
      await db.findingEvent.deleteMany({ where: { findingId: { in: findingIds } } });
      await db.finding.deleteMany({ where: { id: { in: findingIds } } });
    }

    await db.trackedKeyword.deleteMany({ where: { websiteId: { in: websiteIds } } });
    await db.backlinkAudit.deleteMany({ where: { websiteId: { in: websiteIds } } });
    await db.schemaAudit.deleteMany({ where: { websiteId: { in: websiteIds } } });
    await db.keywordSearch.deleteMany({ where: { websiteId: { in: websiteIds } } });
  }

  // Delete all reports
  if (reportIds.length > 0) {
    await db.report.deleteMany({ where: { id: { in: reportIds } } });
  }

  // Delete websites
  if (websiteIds.length > 0) {
    await db.website.deleteMany({ where: { id: { in: websiteIds } } });
  }

  // 5. Delete all user-associated records across auth, billing, and logs
  await db.session.deleteMany({ where: { userId } });
  await db.account.deleteMany({ where: { userId } });
  await db.verificationToken.deleteMany({ where: { userId } });
  await db.passwordResetToken.deleteMany({ where: { userId } });
  await db.notification.deleteMany({ where: { userId } });
  await db.bonusCredit.deleteMany({ where: { userId } });
  await db.usageEvent.deleteMany({ where: { userId } });
  await db.apiUsage.deleteMany({ where: { userId } });
  await db.generatedSchema.deleteMany({ where: { userId } });
  await db.invoice.deleteMany({ where: { userId } });
  await db.payment.deleteMany({ where: { userId } });
  await db.subscription.deleteMany({ where: { userId } });
  await db.billingAuditLog.deleteMany({ where: { actorId: userId } });
  await db.organizationMember.deleteMany({ where: { userId } });
  await db.organization.deleteMany({ where: { ownerId: userId } });
  await db.templateVersion.deleteMany({ where: { publishedById: userId } });
  await db.reportTemplate.deleteMany({ where: { createdById: userId } });
  await db.adminActivityLog.deleteMany({ where: { actorId: userId } });

  await db.systemSetting.updateMany({ where: { updatedById: userId }, data: { updatedById: null } });
  await db.brandingSetting.updateMany({ where: { updatedById: userId }, data: { updatedById: null } });
  await db.emailTemplate.updateMany({ where: { updatedById: userId }, data: { updatedById: null } });
  await db.anonymousSession.updateMany({ where: { claimedByUserId: userId }, data: { claimedByUserId: null } });

  if (email) {
    await db.lead.deleteMany({ where: { email } });
  }

  // 6. Delete User record itself
  await db.user.delete({ where: { id: userId } });

  return true;
}
