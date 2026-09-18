import type { Metadata } from "next";
import {
  ShieldCheck,
  Gauge,
  Award,
  Eye,
  Link as LinkIcon,
  MinusSquare,
  Globe2,
  Car,
  CircleDollarSign,
  CheckSquare,
  Link2,
  Network,
  ShieldAlert,
  Scan,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = { title: "SEO Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
            SEO DASHBOARD
          </h1>
          <span className="text-2xl sm:text-3xl font-bold text-[#4F46E5]">
            laserrevive.com
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Scan className="h-4 w-4 text-slate-500" />
            <span>Re-Scan</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 transition-opacity"
          >
            <Sparkles className="h-4 w-4" />
            <span>Full AI AutoPilot</span>
          </button>
        </div>
      </div>

      {/* Row 1: 3 Top Metric Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Site Health */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="max-w-[65%] space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <span>Site Health</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Your score is based on a formula of 1 to 100. The higher the score the better
            </p>
          </div>

          {/* Donut Score Badge */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-indigo-600 bg-white shadow-inner">
            <span className="text-2xl font-black text-slate-900">86</span>
          </div>
        </div>

        {/* Card 2: Website Speed */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base mb-4">
            <Gauge className="h-5 w-5 text-indigo-600" />
            <span>Website Speed</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-2.5">
              <span className="text-xs font-semibold text-slate-700">
                Desktop Performance
              </span>
              <span className="rounded-md bg-emerald-100/80 px-2.5 py-1 text-xs font-bold text-emerald-700">
                32
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-2.5">
              <span className="text-xs font-semibold text-slate-700">
                Mobile Performance
              </span>
              <span className="rounded-md bg-emerald-100/80 px-2.5 py-1 text-xs font-bold text-emerald-700">
                32
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Rank Authority */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="max-w-[65%] space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
              <Award className="h-5 w-5 text-indigo-600" />
              <span>Rank Authority</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              RA Score is based on a formula of 1 to 100 and only ranks you against your competitors with in your region
            </p>
          </div>

          {/* RA Shield Badge */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#0F224A] text-white p-3.5 h-20 w-20 shadow-md">
            <span className="text-xs font-bold tracking-wider text-indigo-300">RA</span>
            <span className="text-2xl font-black">86</span>
          </div>
        </div>
      </div>

      {/* Row 2: 3 Middle Overview Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Key Metrics Overview */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-block rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
              Last scan: 2025-06-06
            </span>
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <Eye className="h-5 w-5 text-indigo-600" />
            <span>Key Metrics Overview</span>
          </div>

          <div className="space-y-2.5 pt-1">
            <OverviewRow icon={Globe2} iconColor="text-red-500" label="Domain Authority" value={7} />
            <OverviewRow icon={Car} iconColor="text-blue-500" label="Organic traffic" value={0} />
            <OverviewRow icon={CircleDollarSign} iconColor="text-amber-500" label="Organic cost" value={0} />
            <OverviewRow icon={CheckSquare} iconColor="text-emerald-500" label="Organic keywords" value={37} />
          </div>
        </div>

        {/* Card 2: Backlinks Overview */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-block rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
              Last scan: 2025-06-06
            </span>
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <LinkIcon className="h-5 w-5 text-indigo-600" />
            <span>Backlinks Overview</span>
          </div>

          <div className="space-y-2.5 pt-1">
            <OverviewRow icon={Link2} iconColor="text-red-500" label="Total Backlinks" value={733} />
            <OverviewRow icon={Network} iconColor="text-blue-500" label="Referring Domains" value={80} />
            <OverviewRow icon={LinkIcon} iconColor="text-amber-500" label="Dofollow Links" value={720} />
            <OverviewRow icon={ShieldAlert} iconColor="text-emerald-500" label="Nofollow Links" value={13} />
          </div>
        </div>

        {/* Card 3: Top Keywords */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-block rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
              Last scan: 2025-06-06
            </span>
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <MinusSquare className="h-5 w-5 text-indigo-600" />
            <span>Top Keywords</span>
          </div>

          <div className="space-y-2.5 pt-1">
            <KeywordRow label="500 square foot adu" value={46} />
            <KeywordRow label="500 sq ft adu" value={60} />
            <KeywordRow label="Oceanside builders" value={87} />
            <KeywordRow label="Vision adu" value={88} />
            <KeywordRow label="Adu construction company" value={95} />
          </div>
        </div>
      </div>

      {/* Row 3: 2 Big Analytical Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Section 1: Pages Scanned */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Pages Scanned</h2>

          {/* 3 Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-500">Total Pages</span>
              <div className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">341</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> 12 NEW
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-500">Block Pages</span>
              <div className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">14</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-500">
                <TrendingUp className="h-3 w-3" /> 3
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-500">Scanned Pages</span>
              <div className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">327</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> 12
              </div>
            </div>
          </div>

          {/* Line Chart Component */}
          <div className="space-y-4">
            <div className="flex items-center gap-6 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full bg-emerald-800" />
                <span>Total Pages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full bg-blue-500" />
                <span>Block Pages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full bg-amber-500" />
                <span>Scanned Pages</span>
              </div>
            </div>

            <div className="relative h-48 w-full pt-2">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0, 30, 60, 90, 120, 150].map((y, i) => (
                  <line key={i} x1="30" y1={y} x2="490" y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                ))}

                {/* Y-Axis Labels */}
                <text x="5" y="10" fill="#94A3B8" fontSize="10">100</text>
                <text x="10" y="40" fill="#94A3B8" fontSize="10">80</text>
                <text x="10" y="70" fill="#94A3B8" fontSize="10">60</text>
                <text x="10" y="100" fill="#94A3B8" fontSize="10">40</text>
                <text x="10" y="130" fill="#94A3B8" fontSize="10">20</text>
                <text x="15" y="150" fill="#94A3B8" fontSize="10">0</text>

                {/* Line 1: Green (Total Pages) */}
                <path
                  d="M 40,110 L 100,140 L 160,80 L 220,135 L 280,30 L 340,120 L 400,60 L 460,110"
                  fill="none"
                  stroke="#065F46"
                  strokeWidth="2.5"
                />

                {/* Line 2: Blue (Block Pages) */}
                <path
                  d="M 40,140 L 100,120 L 160,140 L 220,90 L 280,145 L 340,90 L 400,140 L 460,80"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                />

                {/* Line 3: Amber (Scanned Pages) */}
                <path
                  d="M 40,125 L 100,110 L 160,95 L 220,110 L 280,15 L 340,135 L 400,95 L 460,120"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Section 2: Critical Error */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Critical Error</h2>

          {/* 3 Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-500">Page Error</span>
              <div className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">1619</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-500">
                <TrendingUp className="h-3 w-3" /> 12 NEW
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-500">Index Issues</span>
              <div className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">76</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-500">
                <TrendingUp className="h-3 w-3" /> 3
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-500">Content Error</span>
              <div className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">8</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> 12
              </div>
            </div>
          </div>

          {/* Line Chart Component */}
          <div className="space-y-4">
            <div className="flex items-center gap-6 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full bg-emerald-800" />
                <span>Total Pages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full bg-blue-500" />
                <span>Block Pages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full bg-amber-500" />
                <span>Scanned Pages</span>
              </div>
            </div>

            <div className="relative h-48 w-full pt-2">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0, 30, 60, 90, 120, 150].map((y, i) => (
                  <line key={i} x1="30" y1={y} x2="490" y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                ))}

                {/* Y-Axis Labels */}
                <text x="5" y="10" fill="#94A3B8" fontSize="10">100</text>
                <text x="10" y="40" fill="#94A3B8" fontSize="10">80</text>
                <text x="10" y="70" fill="#94A3B8" fontSize="10">60</text>
                <text x="10" y="100" fill="#94A3B8" fontSize="10">40</text>
                <text x="10" y="130" fill="#94A3B8" fontSize="10">20</text>
                <text x="15" y="150" fill="#94A3B8" fontSize="10">0</text>

                {/* Line 1: Green (Total Pages) */}
                <path
                  d="M 40,110 L 100,140 L 160,80 L 220,135 L 280,30 L 340,120 L 400,60 L 460,110"
                  fill="none"
                  stroke="#065F46"
                  strokeWidth="2.5"
                />

                {/* Line 2: Blue (Block Pages) */}
                <path
                  d="M 40,140 L 100,120 L 160,140 L 220,90 L 280,145 L 340,90 L 400,140 L 460,80"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                />

                {/* Line 3: Amber (Scanned Pages) */}
                <path
                  d="M 40,125 L 100,110 L 160,95 L 220,110 L 280,15 L 340,135 L 400,95 L 460,120"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewRow({
  icon: Icon,
  iconColor,
  label,
  value,
}: {
  icon: typeof Globe2;
  iconColor: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50/70 px-3 py-2">
      <div className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="text-xs font-semibold text-slate-700">{label}</span>
      </div>
      <span className="rounded-md bg-emerald-100/80 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
        {value}
      </span>
    </div>
  );
}

function KeywordRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50/70 px-3 py-2">
      <span className="text-xs font-semibold text-slate-700 truncate pr-2">
        {label}
      </span>
      <span className="rounded-md bg-emerald-100/80 px-2.5 py-0.5 text-xs font-bold text-emerald-800 shrink-0">
        {value}
      </span>
    </div>
  );
}
