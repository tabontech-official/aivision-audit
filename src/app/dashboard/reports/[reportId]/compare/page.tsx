import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId: publicId } = await params;
  redirect(`/dashboard/reports/${publicId}?tab=compare`);
}
