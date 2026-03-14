import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PlaceCacheMissPanel } from '@/components/place-cache-miss-panel';
import { RuleRow } from '@/components/rule-row';
import { ShellCard } from '@/components/shell-card';
import { StatusBadge } from '@/components/status-badge';
import { getPlacePageData } from '@/lib/place-repository';
import {
  formatRuleValue,
  getRuleBullets,
  getSourceLabel,
  getTrustSummary,
  getVerdictSentence,
  getVerifiedAtLabel,
} from '@/lib/view-models';

export default async function PlaceDetailPage({ params }: { params: { placeSlug: string } }) {
  const { resolveState, place } = await getPlacePageData(params.placeSlug);

  if (resolveState === 'cache_miss') {
    return <PlaceCacheMissPanel />;
  }

  if (!place) {
    notFound();
  }

  const isUnknown = place.petRules.dogPolicyStatus === 'unknown';
  const verdictSentence = getVerdictSentence(place.petRules);
  const trustSummary = getTrustSummary(place.petRules);
  const ruleBullets = getRuleBullets(place.petRules);

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 transition hover:text-slate-900">
        ← Back to results
      </Link>

      <section className="rounded-[2rem] border border-[#e7ddd2] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.92))] p-8 shadow-panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">{place.name}</h1>
            <p className="mt-3 text-base text-slate-600">{place.formattedAddress}</p>
            <p className="mt-3 inline-flex rounded-full border border-[#eadfce] bg-[#faf3e9] px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-slate-600">{place.category}</p>
          </div>
          <StatusBadge status={place.petRules.dogPolicyStatus} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <ShellCard title={isUnknown ? 'No trustworthy public answer yet' : verdictSentence} eyebrow="Primary decision">
          {isUnknown ? (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-700">
                PawMap has not verified this place with a reliable source. Treat dog access as unconfirmed before visiting.
              </p>
              {place.websiteUrl ? (
                <a
                  href={place.websiteUrl}
                  className="inline-flex items-center rounded-full bg-[#6b4f36] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#5d442f]"
                >
                  Check venue website
                </a>
              ) : null}
              <p className="text-sm text-slate-500">User reports may exist but are not published until reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-base font-medium text-slate-900">{trustSummary}</p>
              {ruleBullets.length > 0 ? (
                <ul className="space-y-2 text-sm text-slate-700">
                  {ruleBullets.map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </ShellCard>

        <ShellCard title={isUnknown ? 'Verification snapshot' : 'Verification'} eyebrow="Trust">
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-500">Source</p>
              <p className="mt-1 text-base font-medium text-slate-900">
                {isUnknown ? 'No reliable evidence yet' : getSourceLabel(place.petRules.verificationSourceType)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-500">Last checked</p>
              <p className="mt-1 text-base font-medium text-slate-900">{getVerifiedAtLabel(place.petRules.verifiedAt)}</p>
            </div>
            {!isUnknown ? (
              <p className="text-sm text-slate-600">
                {place.petRules.verificationSourceType === 'user_report'
                  ? 'Based on user-submitted evidence.'
                  : 'Trust details are shown here so the policy answer and evidence stay easy to compare.'}
              </p>
            ) : (
              <p className="text-sm text-slate-600">Treat this as unconfirmed before visiting.</p>
            )}
            {place.petRules.verificationSourceUrl ? (
              <a
                href={place.petRules.verificationSourceUrl}
                className="inline-flex items-center rounded-full bg-[#6b4f36] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#5d442f]"
              >
                View source
              </a>
            ) : null}
          </div>
        </ShellCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <ShellCard title="Rule breakdown" eyebrow="Published policy">
          <dl>
            <RuleRow label="Dog policy" value={place.petRules.dogPolicyStatus.replace('_', ' ')} />
            <RuleRow label="Indoor allowed" value={formatRuleValue(place.petRules.indoorAllowed)} />
            <RuleRow label="Outdoor allowed" value={formatRuleValue(place.petRules.outdoorAllowed)} />
            <RuleRow label="Leash required" value={formatRuleValue(place.petRules.leashRequired)} />
            <RuleRow label="Service dog only" value={formatRuleValue(place.petRules.serviceDogOnly)} />
            <RuleRow label="Size restriction" value={formatRuleValue(place.petRules.sizeRestriction, { nullLabel: 'Not published' })} />
            <RuleRow label="Breed restriction" value={formatRuleValue(place.petRules.breedRestriction, { nullLabel: 'Not published' })} />
            <RuleRow label="Notes" value={formatRuleValue(place.petRules.notes, { nullLabel: 'Not published' })} />
          </dl>
        </ShellCard>

        <ShellCard title="Notes" eyebrow="Extra context">
          <p className="leading-6 text-slate-700">{place.petRules.notes ?? 'No additional notes published yet.'}</p>
        </ShellCard>
      </section>
    </div>
  );
}
