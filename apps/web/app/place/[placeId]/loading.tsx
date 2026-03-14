export default function LoadingPlaceDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-28 rounded-full bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <div className="h-4 w-24 rounded-full bg-slate-200" />
          <div className="mt-4 h-10 w-2/3 rounded-2xl bg-slate-200" />
          <div className="mt-4 h-4 w-1/2 rounded-full bg-slate-200" />
          <div className="mt-6 h-24 rounded-3xl bg-slate-100" />
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <div className="h-4 w-20 rounded-full bg-slate-200" />
          <div className="mt-4 h-6 w-36 rounded-full bg-slate-200" />
          <div className="mt-3 h-6 w-32 rounded-full bg-slate-200" />
          <div className="mt-3 h-6 w-40 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
