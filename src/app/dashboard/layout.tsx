import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { AuthSessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · AI Vision Audit" },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Query Real Websites and section scores from Database safely for the active user only
  let dbProjects: string[] = [];
  const projectSectionScores: Record<string, Record<string, number | null>> = {};
  try {
    const dbWebsites = await db.website.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        domain: true,
        reports: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            snapshot: {
              select: { payload: true },
            },
          },
        },
      },
    });
    dbProjects = Array.from(
      new Set(dbWebsites.map((w) => w.domain).filter(Boolean))
    );

    dbWebsites.forEach((w) => {
      const latestReport = w.reports[0];
      const payload = latestReport?.snapshot?.payload as { sections?: { slug: string; score: number | null }[] } | null;
      if (payload?.sections && Array.isArray(payload.sections)) {
        const scores: Record<string, number | null> = {};
        payload.sections.forEach((s) => {
          if (s.slug) {
            scores[s.slug] = s.score !== null && s.score !== undefined ? Math.round(s.score) : null;
          }
        });
        projectSectionScores[w.domain] = scores;
      }
    });
  } catch (err) {
    console.error("Layout website query error:", err);
  }

  // Query Real Report Sections from Master Admin Report Builder
  let reportSections: { name: string; slug: string; count: number }[] = [];
  try {
    const templateVersion = await db.templateVersion.findFirst({
      where: {
        status: "PUBLISHED",
        template: { isDefault: true, deletedAt: null },
      },
      orderBy: { versionNumber: "desc" },
      select: {
        sections: {
          where: { deletedAt: null },
          orderBy: { displayOrder: "asc" },
          select: {
            name: true,
            slug: true,
            fields: {
              where: { deletedAt: null, isEnabled: true },
              select: { id: true },
            },
          },
        },
      },
    });

    if (templateVersion?.sections && templateVersion.sections.length > 0) {
      reportSections = templateVersion.sections.map((s) => ({
        name: s.name,
        slug: s.slug,
        count: s.fields.length,
      }));
    } else {
      const dbSections = await db.reportSection.findMany({
        where: { deletedAt: null },
        orderBy: { displayOrder: "asc" },
        select: {
          name: true,
          slug: true,
          fields: {
            where: { deletedAt: null, isEnabled: true },
            select: { id: true },
          },
        },
      });
      const uniqueMap = new Map();
      dbSections.forEach((s) => {
        if (!uniqueMap.has(s.name)) {
          uniqueMap.set(s.name, {
            name: s.name,
            slug: s.slug,
            count: s.fields.length,
          });
        }
      });
      reportSections = Array.from(uniqueMap.values());
    }
  } catch (err) {
    console.error("Layout report sections query error:", err);
  }

  return (
    <AuthSessionProvider>
      <div className="flex min-h-screen font-sans">
        <DashboardSidebar
          email={user.email ?? ""}
          name={user.name ?? null}
          plan={user.plan}
          initialProjects={dbProjects}
          reportSections={reportSections}
          projectSectionScores={projectSectionScores}
        />
        <div className="min-w-0 flex-1 bg-slate-50/60">
          <DashboardTopBar
            email={user.email ?? ""}
            name={user.name ?? null}
            plan={user.plan}
          />
          <main className="mx-auto max-w-[1600px] w-full px-4 py-6 sm:px-8 font-sans">
            {children}
          </main>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
