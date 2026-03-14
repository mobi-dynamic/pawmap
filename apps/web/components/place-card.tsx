import Link from 'next/link';

import { StatusBadge } from '@/components/status-badge';
import { PlaceSummary } from '@/lib/types';

export function PlaceCard({ place }: { place: PlaceSummary }) {
  return (
    <Link
      href={`/place/${place.placeSlug}`}
      className="block rounded-3xl border border-[#e7ddd2] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.88))] p-5 shadow-panel transition hover:-translate-y-0.5 hover:border-[#d8c7b4] focus-visible:ring-2 focus-visible:ring-[#6b4f36]/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex rounded-full border border-[#eadfce] bg-[#faf3e9] px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-slate-600">{place.category}</p>
          <h3 className="mt-3 text-lg font-semibold text-slate-900">{place.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{place.formattedAddress}</p>
        </div>
        <StatusBadge status={place.dogPolicyStatus} />
      </div>

      <p className="mt-4 text-sm text-slate-700">{place.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full border border-[#ece2d6] bg-[#fbf6f0] px-3 py-1">{place.distanceLabel}</span>
      </div>
    </Link>
  );
}
