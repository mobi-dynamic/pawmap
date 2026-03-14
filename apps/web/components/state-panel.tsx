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
      ? 'border-amber-200 bg-amber-50/70'
      : 'border-slate-200 bg-white';

  return (
    <section className={`rounded-3xl border p-6 shadow-panel ${toneClasses}`}>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          {action.label}
        </Link>
      ) : null}
    </section>
  );
}
