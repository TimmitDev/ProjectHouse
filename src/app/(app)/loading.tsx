export default function Loading() {
  return (
    <div className="animate-pulse space-y-7">
      <div className="space-y-3">
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="h-9 w-72 max-w-full rounded bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-40 rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-80 rounded-2xl border border-slate-200 bg-white" />
        <div className="h-80 rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
