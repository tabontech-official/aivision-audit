export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* Top Website Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-5 w-44 rounded-md bg-slate-200" />
            <div className="h-3.5 w-28 rounded-md bg-slate-100" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 rounded-xl bg-slate-200" />
          <div className="h-9 w-28 rounded-xl bg-slate-200" />
        </div>
      </div>

      {/* 4 Score Ring Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px]"
          >
            <div className="h-16 w-16 rounded-full bg-slate-200" />
            <div className="h-4 w-24 rounded-md bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Middle Metrics Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 rounded bg-slate-200" />
              <div className="h-6 w-6 rounded bg-slate-100" />
            </div>
            <div className="h-7 w-28 rounded bg-slate-200" />
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Bottom Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-full rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="h-44 w-full rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
