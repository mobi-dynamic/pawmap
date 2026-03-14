import { ReactNode } from 'react';

export function ShellCard({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
      {eyebrow ? <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p> : null}
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 text-sm text-slate-600">{children}</div>
    </section>
  );
}
