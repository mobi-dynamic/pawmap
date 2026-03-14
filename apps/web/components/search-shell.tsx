'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { StatusBadge } from '@/components/status-badge';
import { placeDetailsById } from '@/lib/mock-data';
import { buildGoogleResolvePath } from '@/lib/routes';
import { PlaceSummary } from '@/lib/types';
import { getResultSummary, getTrustSummary } from '@/lib/view-models';

const exampleQueries = ['courtyard cafe', 'off leash park', 'smith st'];

function SearchResultCard({
  place,
  selected,
  onSelect,
}: {
  place: PlaceSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const detail = placeDetailsById[place.placeId];
  const trustSummary = detail ? getTrustSummary(detail.petRules) : place.dogPolicyStatus === 'unknown' ? 'No reliable evidence yet' : 'Trust details unavailable';
  const detailHref = place.googlePlaceId ? buildGoogleResolvePath(place.googlePlaceId) : `/place/${place.placeSlug}`;

  return (
    <article
      className={`rounded-3xl border bg-white p-5 shadow-panel transition ${
        selected ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{place.name}</h3>
          <p className="mt-1 text-sm text-slate-700">{getResultSummary({ dogPolicyStatus: place.dogPolicyStatus, petRules: detail?.petRules, summary: place.summary })}</p>
        </div>
        <StatusBadge status={place.dogPolicyStatus} />
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {place.formattedAddress} · {place.category}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span>{trustSummary}</span>
        {place.distanceLabel ? <span className="text-slate-400">•</span> : null}
        {place.distanceLabel ? <span className="text-slate-500">{place.distanceLabel}</span> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900"
          aria-pressed={selected}
        >
          {selected ? 'Selected on map' : 'Preview on map'}
        </button>
        <Link
          href={detailHref}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          Open details
        </Link>
      </div>
    </article>
  );
}

function SearchLoadingState() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-4" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
            <div className="h-6 w-2/3 rounded-full bg-slate-200" />
            <div className="mt-3 h-4 w-1/3 rounded-full bg-slate-200" />
            <div className="mt-4 h-4 w-3/4 rounded-full bg-slate-100" />
            <div className="mt-4 h-4 w-1/2 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="hidden lg:block">
        <div className="sticky top-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex h-[32rem] animate-pulse flex-col items-center justify-center rounded-[1.5rem] bg-slate-100 text-sm text-slate-500">
            <div className="h-44 w-44 rounded-full bg-slate-200" />
            <p className="mt-4">Loading places…</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapPanel({ results, selectedPlaceId, onSelect }: { results: PlaceSummary[]; selectedPlaceId: string; onSelect: (placeId: string) => void }) {
  const points = results.map((place, index) => ({
    place,
    top: [22, 48, 68, 34, 58, 76][index] ?? 20 + (index % 5) * 12,
    left: [24, 62, 46, 72, 36, 54][index] ?? 25 + (index % 4) * 14,
  }));

  return (
    <div className="sticky top-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Map context</h2>
          <p className="text-sm text-slate-500">Pins mirror the list only. No hidden map filtering in MVP.</p>
        </div>
      </div>

      <div className="relative h-[32rem] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)]">
        <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,#dbe4ee_1px,transparent_1px),linear-gradient(to_bottom,#dbe4ee_1px,transparent_1px)] [background-size:48px_48px]" />
        {points.map(({ place, top, left }) => {
          const selected = place.placeId === selectedPlaceId;
          return (
            <button
              key={place.placeId}
              type="button"
              onClick={() => onSelect(place.placeId)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-2 text-xs font-semibold shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-slate-900 ${
                selected
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
              style={{ top: `${top}%`, left: `${left}%` }}
              aria-pressed={selected}
            >
              {place.name}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-900">Selected place</p>
        <p className="mt-1">{results.find((place) => place.placeId === selectedPlaceId)?.name ?? 'No place selected'}</p>
      </div>
    </div>
  );
}

export function SearchShell({
  initialQuery,
  initialResults,
  resultsSource,
}: {
  initialQuery: string;
  initialResults: PlaceSummary[];
  resultsSource: 'api' | 'mock';
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [selectedPlaceId, setSelectedPlaceId] = useState(initialResults[0]?.placeId ?? '');
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const activeSelectedPlaceId = useMemo(
    () => (initialResults.some((place) => place.placeId === selectedPlaceId) ? selectedPlaceId : (initialResults[0]?.placeId ?? '')),
    [initialResults, selectedPlaceId]
  );

  function submitSearch(nextQuery: string) {
    const params = new URLSearchParams();
    const trimmedQuery = nextQuery.trim();

    if (trimmedQuery) {
      params.set('q', trimmedQuery);
    }

    startTransition(() => {
      router.push(params.size ? `/?${params.toString()}` : '/');
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel md:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Search dog policy</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Search first, then compare places with trust cues.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
            PawMap can read from the live API when configured, with a safe mock fallback during the transition.
          </p>
        </div>

        <form
          className="mt-6 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch(draftQuery);
          }}
        >
          <label htmlFor="place-search" className="block text-sm font-medium text-slate-900">
            Search cafes, parks, or an address
          </label>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              id="place-search"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Search cafes, parks, or an address"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/20"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
            >
              {isPending ? 'Searching…' : 'Search'}
            </button>
          </div>
          <p className="text-sm text-slate-500">Try {exampleQueries.map((query) => `“${query}”`).join(', ')}.</p>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Results</h2>
            <p className="text-sm text-slate-500" aria-live="polite">
              {isPending
                ? 'Loading results'
                : `${initialResults.length} ${initialResults.length === 1 ? 'result' : 'results'}${initialQuery ? ` for “${initialQuery}”` : ' from sample places'} · ${resultsSource === 'api' ? 'live API' : 'mock fallback'}`}
            </p>
          </div>
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 md:hidden">
            {(['list', 'map'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setMobileView(view)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mobileView === view ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
                aria-pressed={mobileView === view}
              >
                {view === 'list' ? 'List' : 'Map'}
              </button>
            ))}
          </div>
        </div>

        {isPending ? (
          <SearchLoadingState />
        ) : initialResults.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
            <h3 className="text-lg font-semibold text-slate-900">No matching places yet</h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Try a broader search. If the API is not configured yet, the mock fallback only includes a small sample dataset.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className={`space-y-4 ${mobileView === 'map' ? 'hidden md:block' : ''}`}>
              {initialResults.map((place) => (
                <SearchResultCard
                  key={place.placeId}
                  place={place}
                  selected={place.placeId === activeSelectedPlaceId}
                  onSelect={() => setSelectedPlaceId(place.placeId)}
                />
              ))}
            </div>
            <div className={`${mobileView === 'list' ? 'hidden md:block' : ''}`}>
              <MapPanel results={initialResults} selectedPlaceId={activeSelectedPlaceId} onSelect={setSelectedPlaceId} />
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-xl font-semibold text-slate-900">Unknown is explicit</h2>
          <p className="mt-2 text-sm text-slate-600">
            Unknown means PawMap has a place record but not enough trustworthy evidence to publish a dog policy yet.
          </p>
          <Link href="/place/market-hall-grocer--plc_market-hall" className="mt-5 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Open unknown example
          </Link>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-panel">
          <h2 className="text-xl font-semibold text-slate-900">Cache miss is different</h2>
          <p className="mt-2 text-sm text-slate-700">
            Cache miss means the upstream place reference exists, but PawMap has not cached a canonical place page yet.
          </p>
          <Link href={buildGoogleResolvePath('google-cache-miss-demo')} className="mt-5 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Open cache-miss example
          </Link>
        </div>
      </section>
    </div>
  );
}
