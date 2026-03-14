import Link from 'next/link';

import { StatePanel } from '@/components/state-panel';
import { placeCacheMissContent } from '@/lib/place-cache-miss-content';

export function PlaceCacheMissPanel({ content = placeCacheMissContent }: { content?: typeof placeCacheMissContent }) {
  return (
    <StatePanel tone="warning" title={content.title} description={content.description} action={content.action}>
      <div className="space-y-3 rounded-2xl bg-white/70 p-4 text-sm text-slate-700">
        <p className="font-medium text-slate-900">{content.explainerTitle}</p>
        <p>{content.explainerDescription}</p>
        <Link
          href={content.secondaryAction.href}
          className="inline-flex items-center font-medium text-slate-900 underline underline-offset-4"
        >
          {content.secondaryAction.label}
        </Link>
      </div>
    </StatePanel>
  );
}
