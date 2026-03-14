import Link from 'next/link';
import { ReactNode } from 'react';

export function StatePanel({
  tone = 'neutral',
  title,
  description,
  action,
  children,
}: {
  tone?: 'neutral' | 'warning';
  title: string;
  description: string;
  action?: { label: string; href: string };
  children?: ReactNode;
}) {
  const toneClasses =
    tone === 'warning'
      ? 'border-amber-200/90 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,244,214,0.82))]'
      : 'border-[#e8ddd0] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.9))]';

  return (
    <section className={`rounded-3xl border p-6 shadow-panel ${toneClasses}`}>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center rounded-full bg-[#6b4f36] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#5d442f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b4f36]/25"
        >
          {action.label}
        </Link>
      ) : null}
    </section>
  );
}
