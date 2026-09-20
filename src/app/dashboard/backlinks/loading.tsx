export default function BacklinksLoading() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-md bg-slate-200" />
          <div className="h-3.5 w-72 rounded-md bg-slate-100" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 rounded-xl bg-slate-200" />
        </div>
      </div>

      {/* 4 Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-slate-200" />
              <div className="h-6 w-6 rounded-full bg-slate-100" />
            </div>
            <div className="h-7 w-20 rounded bg-slate-200" />
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-24 rounded-lg bg-slate-200" />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="h-10 w-full rounded-xl bg-slate-100" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 w-full rounded-xl bg-slate-50" />
        ))}
      </div>
    </div>
  );
}
