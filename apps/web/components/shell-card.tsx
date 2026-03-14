import { ReactNode } from 'react';

export function ShellCard({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#e8ddd0] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.92))] p-6 shadow-panel">
      {eyebrow ? (
        <p className="inline-flex rounded-full border border-[#eadfce] bg-[#faf3e9] px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-slate-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 text-sm text-slate-600">{children}</div>
    </section>
  );
}
