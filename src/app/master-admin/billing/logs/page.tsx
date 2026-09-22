import type { Metadata } from "next";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { History, Shield, Clock, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Billing Audit Logs",
};

export default async function BillingLogsPage() {
  await requireMasterAdmin();

  const logs = await db.billingAuditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Stripe Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Append-only historical ledger of plan creations, price mutations, manual balance grants, and Stripe synchronizations.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center rounded-md bg-[#dff2ed] px-2 py-0.5 text-[10px] font-bold text-slate-900">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-800">
                    {log.actor?.email || "System / Stripe Webhook"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {log.entityType} {log.entityId ? `(${log.entityId.slice(0, 8)}...)` : ""}
                  </td>
                  <td className="px-5 py-3.5 max-w-md truncate text-[11px] text-slate-500">
                    {log.metadata ? JSON.stringify(log.metadata) : "-"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-slate-500">
                    No billing audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
