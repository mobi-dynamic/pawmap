export default function LoadingPlaceDetail() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      <div className="h-5 w-32 rounded-full bg-slate-200" />
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
        <div className="h-10 w-2/3 rounded-2xl bg-slate-200" />
        <div className="mt-4 h-4 w-1/2 rounded-full bg-slate-200" />
        <div className="mt-3 h-4 w-24 rounded-full bg-slate-100" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <div className="h-4 w-28 rounded-full bg-slate-200" />
          <div className="mt-4 h-8 w-3/4 rounded-2xl bg-slate-200" />
          <div className="mt-5 h-4 w-1/2 rounded-full bg-slate-100" />
          <div className="mt-3 h-4 w-2/3 rounded-full bg-slate-100" />
          <div className="mt-3 h-4 w-1/3 rounded-full bg-slate-100" />
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <div className="h-4 w-24 rounded-full bg-slate-200" />
          <div className="mt-4 h-6 w-40 rounded-full bg-slate-200" />
          <div className="mt-3 h-6 w-32 rounded-full bg-slate-100" />
          <div className="mt-5 h-10 w-28 rounded-full bg-slate-200" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <div className="h-4 w-32 rounded-full bg-slate-200" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-4 w-full rounded-full bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <div className="h-4 w-24 rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-full rounded-full bg-slate-100" />
          <div className="mt-3 h-4 w-4/5 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
