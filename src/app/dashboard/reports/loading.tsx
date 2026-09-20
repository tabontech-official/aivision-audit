export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-36 rounded-md bg-slate-200" />
          <div className="h-3.5 w-60 rounded-md bg-slate-100" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="h-10 w-full rounded-xl bg-slate-100" />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-14 w-full rounded-xl bg-slate-50" />
        ))}
      </div>
    </div>
  );
}
