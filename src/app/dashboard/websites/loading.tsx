export default function WebsitesLoading() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      <div className="space-y-2">
        <div className="h-6 w-36 rounded-md bg-slate-200" />
        <div className="h-3.5 w-24 rounded-md bg-slate-100" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4"
          >
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-3 w-48 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
