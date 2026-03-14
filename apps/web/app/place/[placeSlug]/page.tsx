import Link from 'next/link';
import { notFound } from 'next/navigation';

import { RuleRow } from '@/components/rule-row';
import { ShellCard } from '@/components/shell-card';
import { StatePanel } from '@/components/state-panel';
import { StatusBadge } from '@/components/status-badge';
import { getConfidenceLabel, getPlaceBySlug, getSourceLabel, getVerifiedAtLabel, resolveStateByPlaceSlug } from '@/lib/mock-data';

function formatBoolean(value: boolean | null, unknownLabel = 'Unknown') {
  if (value === null) return unknownLabel;
  return value ? 'Yes' : 'No';
}

export default function PlaceDetailPage({ params }: { params: { placeSlug: string } }) {
  const resolveState = resolveStateByPlaceSlug[params.placeSlug];

  if (!resolveState) {
    notFound();
  }

  if (resolveState === 'cache_miss') {
    return (
      <StatePanel
        tone="warning"
        title="Place not cached yet"
        description="PawMap found this provider reference, but we do not have a canonical place record cached yet. Show a dedicated cache-miss screen rather than pretending the place is unknown."
        action={{ label: 'Back to search', href: '/' }}
      >
        <div className="rounded-2xl bg-white/70 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Suggested API mapping</p>
          <p className="mt-2">`GET /places/resolve/google/:googlePlaceId` → `404 PLACE_CACHE_MISS`</p>
        </div>
      </StatePanel>
    );
  }

  const place = getPlaceBySlug(params.placeSlug);

  if (!place) {
    notFound();
  }

  const isUnknown = place.petRules.dogPolicyStatus === 'unknown';

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500">
        ← Back to search
      </Link>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{place.category}</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900">{place.name}</h1>
              <p className="mt-3 text-base text-slate-600">{place.formattedAddress}</p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700">{place.summary}</p>
            </div>
            <StatusBadge status={place.petRules.dogPolicyStatus} />
          </div>

          {isUnknown ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">No trustworthy public answer yet</p>
              <p className="mt-2 text-sm text-slate-600">
                PawMap keeps this place in an explicit unknown state until a reliable source is confirmed.
              </p>
            </div>
          ) : null}
        </div>

        <ShellCard title="Verification snapshot" eyebrow="Trust">
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Confidence</p>
              <p className="mt-1 text-base font-medium text-slate-900">{getConfidenceLabel(place.petRules.confidenceScore)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Source</p>
              <p className="mt-1 text-base font-medium text-slate-900">{getSourceLabel(place.petRules.verificationSourceType)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last checked</p>
              <p className="mt-1 text-base font-medium text-slate-900">{getVerifiedAtLabel(place.petRules.verifiedAt)}</p>
            </div>
            {place.petRules.verificationSourceUrl ? (
              <a
                href={place.petRules.verificationSourceUrl}
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                View source
              </a>
            ) : null}
          </div>
        </ShellCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <ShellCard title="Dog rules" eyebrow="Published policy">
          <dl>
            <RuleRow label="Dog policy" value={place.petRules.dogPolicyStatus.replace('_', ' ')} />
            <RuleRow label="Indoor allowed" value={formatBoolean(place.petRules.indoorAllowed)} />
            <RuleRow label="Outdoor allowed" value={formatBoolean(place.petRules.outdoorAllowed)} />
            <RuleRow label="Leash required" value={formatBoolean(place.petRules.leashRequired)} />
            <RuleRow label="Service dog only" value={formatBoolean(place.petRules.serviceDogOnly)} />
            <RuleRow label="Size restriction" value={place.petRules.sizeRestriction ?? 'None published'} />
            <RuleRow label="Breed restriction" value={place.petRules.breedRestriction ?? 'None published'} />
          </dl>
        </ShellCard>

        <ShellCard title="Notes" eyebrow="Operational detail">
          <p className="leading-6 text-slate-700">{place.petRules.notes ?? 'No additional notes published yet.'}</p>
          <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Report submission stays out of this slice because MVP reports require auth.
          </div>
        </ShellCard>
      </section>
    </div>
  );
}
