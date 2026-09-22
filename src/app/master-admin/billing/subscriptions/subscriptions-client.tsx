"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Receipt,
  Users,
  CreditCard,
  Gift,
  RefreshCw,
  XCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MoreVertical,
  X,
  Plus,
} from "lucide-react";
import {
  changeUserPlanAction,
  cancelSubscriptionAction,
  grantBonusCreditsAction,
  resetUserUsageAction,
} from "./actions";

export function SubscriptionsListClient({
  initialData,
  availablePlans,
}: {
  initialData: { items: any[]; totalCount: number; totalPages: number; page: number };
  availablePlans: any[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialData.items);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<"plan" | "credits" | "cancel" | null>(null);

  // Form states for modals
  const [newPlanId, setNewPlanId] = useState(availablePlans[0]?.id || "");
  const [bonusUnits, setBonusUnits] = useState(5);
  const [bonusReason, setBonusReason] = useState("Promotional goodwill grant");
  const [bonusExpiry, setBonusExpiry] = useState("");
  const [cancelImmediately, setCancelImmediately] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleOpenPlanModal = (sub: any) => {
    setSelectedSub(sub);
    setNewPlanId(sub.planId || availablePlans[0]?.id || "");
    setActiveModal("plan");
    setStatusNotice(null);
  };

  const handleOpenCreditsModal = (sub: any) => {
    setSelectedSub(sub);
    setBonusUnits(5);
    setBonusReason("Promotional bonus credits");
    setActiveModal("credits");
    setStatusNotice(null);
  };

  const handleOpenCancelModal = (sub: any) => {
    setSelectedSub(sub);
    setCancelImmediately(false);
    setActiveModal("cancel");
    setStatusNotice(null);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedSub(null);
  };

  const handleSubmitPlanChange = async () => {
    if (!selectedSub) return;
    setLoading(true);
    const res = await changeUserPlanAction(selectedSub.userId, newPlanId);
    setLoading(false);
    if (res.ok) {
      setStatusNotice({ type: "success", text: res.message || "Plan changed successfully!" });
      handleCloseModal();
      router.refresh();
    } else {
      setStatusNotice({ type: "error", text: res.error || "Failed to change plan." });
    }
  };

  const handleSubmitBonusCredits = async () => {
    if (!selectedSub) return;
    setLoading(true);
    const res = await grantBonusCreditsAction(
      selectedSub.userId,
      bonusUnits,
      bonusReason,
      bonusExpiry ? bonusExpiry : null,
    );
    setLoading(false);
    if (res.ok) {
      setStatusNotice({ type: "success", text: `Granted ${bonusUnits} bonus credits!` });
      handleCloseModal();
      router.refresh();
    } else {
      setStatusNotice({ type: "error", text: res.error || "Failed to grant bonus credits." });
    }
  };

  const handleSubmitCancel = async () => {
    if (!selectedSub) return;
    setLoading(true);
    const res = await cancelSubscriptionAction(selectedSub.id, cancelImmediately);
    setLoading(false);
    if (res.ok) {
      setStatusNotice({ type: "success", text: res.message || "Subscription updated." });
      handleCloseModal();
      router.refresh();
    } else {
      setStatusNotice({ type: "error", text: res.error || "Failed to cancel subscription." });
    }
  };

  const handleResetUsage = async (userId: string) => {
    if (!confirm("Are you sure you want to reset this user's current period usage?")) return;
    setLoading(true);
    const res = await resetUserUsageAction(userId);
    setLoading(false);
    if (res.ok) {
      setStatusNotice({ type: "success", text: "User usage reset successfully." });
      router.refresh();
    } else {
      setStatusNotice({ type: "error", text: res.error || "Failed to reset usage." });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Subscriptions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor subscriber usage, grant bonus credits, adjust tiers, and manage customer billing lifecycle.
        </p>
      </div>

      {statusNotice && (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 border text-sm font-medium ${
            statusNotice.type === "success"
              ? "bg-[#dff2ed]/60 border-[#2f7a68]/20 text-[#1b4e42]"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {statusNotice.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2f7a68]" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          )}
          <span>{statusNotice.text}</span>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Plan & Tier</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Audit Usage (Period)</th>
                <th className="px-5 py-3.5">Total Spent</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((sub) => {
                const allowance = sub.allowance;
                const percentUsed = allowance.isUnlimited
                  ? 0
                  : Math.min(100, Math.round((allowance.used / (allowance.limit || 1)) * 100));

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{sub.user?.name || "User"}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{sub.user?.email}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{sub.plan?.name || "Free"}</div>
                      <div className="text-[11px] text-slate-500">
                        ${((sub.plan?.priceMonthlyCents ?? 0) / 100).toFixed(0)}/mo
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : sub.status === "TRIALING"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 min-w-[180px]">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                        <span>
                          {allowance.used} / {allowance.isUnlimited ? "∞" : allowance.limit} credits
                        </span>
                        {allowance.bonusCredits > 0 && (
                          <span className="text-emerald-700 font-bold">
                            +{allowance.bonusCredits} bonus
                          </span>
                        )}
                      </div>
                      {!allowance.isUnlimited && (
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentUsed > 90 ? "bg-rose-500" : percentUsed > 70 ? "bg-amber-500" : "bg-slate-900"
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-900">
                      ${(sub.totalSpendCents / 100).toFixed(2)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenCreditsModal(sub)}
                          title="Grant Bonus Credits"
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          <Gift className="h-3.5 w-3.5 text-emerald-600" />
                          Bonus
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenPlanModal(sub)}
                          title="Change Plan Tier"
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          <CreditCard className="h-3.5 w-3.5 text-slate-600" />
                          Tier
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenCancelModal(sub)}
                          title="Cancel/Pause"
                          className="flex items-center rounded-lg border border-rose-200 bg-rose-50/50 p-1.5 text-rose-600 shadow-sm hover:bg-rose-100"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Change User Plan */}
      {activeModal === "plan" && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Change Subscription Plan</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-600">
                Select a new plan tier for <strong>{selectedSub.user?.email}</strong>.
              </p>
              <div className="mt-3 space-y-2">
                {availablePlans.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                      newPlanId === p.id ? "border-slate-900 bg-[#dff2ed]/30 ring-1 ring-slate-900" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        ${((p.priceMonthlyCents ?? 0) / 100).toFixed(0)}/mo · {p.auditLimitPerMonth} audits
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="plan"
                      checked={newPlanId === p.id}
                      onChange={() => setNewPlanId(p.id)}
                      className="h-4 w-4 text-slate-900 focus:ring-slate-900"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitPlanChange}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-[#dff2ed] shadow hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Grant Bonus Credits */}
      {activeModal === "credits" && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Grant Bonus Audit Credits</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Credits to Grant</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={bonusUnits}
                  onChange={(e) => setBonusUnits(parseInt(e.target.value) || 1)}
                  className="mt-1.5 w-full text-sm font-bold rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Reason / Admin Note</label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder="e.g. Compensation for support ticket #123"
                  className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={bonusExpiry}
                  onChange={(e) => setBonusExpiry(e.target.value)}
                  className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitBonusCredits}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-[#dff2ed] shadow hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Granting..." : "Grant Credits"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Cancel Subscription */}
      {activeModal === "cancel" && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-rose-600">Cancel Subscription</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Are you sure you want to cancel the subscription for{" "}
                <strong>{selectedSub.user?.email}</strong>?
              </p>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 cursor-pointer bg-slate-50">
                <input
                  type="checkbox"
                  checked={cancelImmediately}
                  onChange={(e) => setCancelImmediately(e.target.checked)}
                  className="h-4 w-4 text-rose-600 focus:ring-rose-600 rounded"
                />
                <div>
                  <div className="font-bold text-slate-900">Cancel immediately</div>
                  <div className="text-[11px] text-slate-500">
                    Immediately revert user to Free tier and terminate access.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitCancel}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-rose-700 disabled:opacity-50"
              >
                {loading ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
