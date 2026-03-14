import Link from 'next/link';

import { StatusBadge } from '@/components/status-badge';
import { PlaceSummary } from '@/lib/types';

export function PlaceCard({ place }: { place: PlaceSummary }) {
  return (
    <Link
      href={`/place/${place.slug}`}
      className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-panel transition hover:-translate-y-0.5 hover:border-slate-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{place.category}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{place.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{place.formattedAddress}</p>
        </div>
        <StatusBadge status={place.dogPolicyStatus} />
      </div>

      <p className="mt-4 text-sm text-slate-700">{place.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">{place.distanceLabel}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{place.confidenceLabel}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1">{place.verifiedAtLabel}</span>
      </div>
    </Link>
  );
}
