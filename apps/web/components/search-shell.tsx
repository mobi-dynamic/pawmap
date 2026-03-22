'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { StatusBadge } from '@/components/status-badge';
import { placeDetailsById } from '@/lib/mock-data';
import { buildGoogleResolvePath } from '@/lib/routes';
import { buildSearchMapPoints } from '@/lib/search-map';
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
      className={`rounded-3xl border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.88))] p-5 shadow-panel transition ${
        selected
          ? 'border-[#cfb79e] ring-2 ring-[#e8d5c0]'
          : 'border-[#e7ddd2] hover:border-[#d8c7b4]'
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
        {place.distanceLabel ? <span className="text-[#c8b8a8]">•</span> : null}
        {place.distanceLabel ? <span className="text-slate-500">{place.distanceLabel}</span> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={detailHref}
          className="rounded-full bg-[#6b4f36] px-4 py-2 text-sm font-medium text-white outline-none shadow-sm transition hover:bg-[#5d442f] focus-visible:ring-2 focus-visible:ring-[#6b4f36]/25"
        >
          View policy details
        </Link>
        <button
          type="button"
          onClick={onSelect}
          className={`rounded-full border px-4 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[#6b4f36]/20 ${
            selected
              ? 'border-[#d9c6b2] bg-[#fbf4eb] text-slate-800'
              : 'border-[#dfd2c4] bg-white/80 text-slate-700 hover:border-[#ccb8a3] hover:bg-[#fdf8f1]'
          }`}
          aria-pressed={selected}
        >
          {selected ? 'Highlighted on map' : 'Show on map'}
        </button>
      </div>
    </article>
  );
}

function SearchLoadingState() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-4" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-3xl border border-[#e7ddd2] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.86))] p-5 shadow-panel">
            <div className="h-6 w-2/3 rounded-full bg-[#e7ddd2]" />
            <div className="mt-3 h-4 w-1/3 rounded-full bg-[#efe5da]" />
            <div className="mt-4 h-4 w-3/4 rounded-full bg-[#f5ede4]" />
            <div className="mt-4 h-4 w-1/2 rounded-full bg-[#f7f0e8]" />
          </div>
        ))}
      </div>
      <div className="hidden lg:block">
        <div className="sticky top-6 rounded-[2rem] border border-[#e7ddd2] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.9))] p-5 shadow-panel">
          <div className="flex h-[32rem] animate-pulse flex-col items-center justify-center rounded-[1.5rem] bg-[linear-gradient(180deg,#fffaf4_0%,#f5efe7_100%)] text-sm text-slate-500">
            <div className="h-44 w-44 rounded-full bg-[#eadfce]" />
            <p className="mt-4">Loading places…</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapPanel({ results, selectedPlaceId, onSelect }: { results: PlaceSummary[]; selectedPlaceId: string; onSelect: (placeId: string) => void }) {
  const points = buildSearchMapPoints(results);

  return (
    <div className="sticky top-6 rounded-[2rem] border border-[#e7ddd2] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.9))] p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Map</h2>
          <p className="text-sm text-slate-500">Pins mirror the current results.</p>
        </div>
      </div>

      <div className="relative h-[32rem] overflow-hidden rounded-[1.5rem] border border-[#e4d8cb] bg-[linear-gradient(180deg,#fff9f2_0%,#f5eee5_52%,#edf4fb_100%)]">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,#e7d8c9_1px,transparent_1px),linear-gradient(to_bottom,#dbe6f0_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute inset-x-8 top-8 h-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.6)_0%,transparent_70%)]" />
        {points.map(({ place, top, left }) => {
          const selected = place.placeId === selectedPlaceId;
          return (
            <button
              key={place.placeId}
              type="button"
              onClick={() => onSelect(place.placeId)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-2 text-xs font-semibold shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#6b4f36]/25 ${
                selected
                  ? 'border-[#6b4f36] bg-[#6b4f36] text-white'
                  : 'border-[#ddcfbf] bg-[rgba(255,250,244,0.94)] text-slate-700 hover:border-[#c9b39b] hover:bg-white'
              }`}
              style={{ top: `${top}%`, left: `${left}%` }}
              aria-pressed={selected}
            >
              {place.name}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-[#eadfce] bg-[#fbf6ef] p-4 text-sm text-slate-600">
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
      <section className="rounded-[2rem] border border-[#e7ddd2] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.92))] p-6 shadow-panel md:p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Find dog policy before you go</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
            Search for a place, compare the policy summary, and open the detail page for the full rules and verification.
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
              className="w-full rounded-2xl border border-[#dfd2c4] bg-white/95 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6b4f36] focus-visible:ring-4 focus-visible:ring-[#eadbca]"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-2xl bg-[#6b4f36] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5d442f] disabled:cursor-wait disabled:bg-[#b7a28d]"
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
                : `${initialResults.length} ${initialResults.length === 1 ? 'result' : 'results'}${initialQuery ? ` for “${initialQuery}”` : resultsSource === 'mock' ? ' from sample places' : ''}`}
            </p>
          </div>
          <div className="inline-flex rounded-full border border-[#e7ddd2] bg-[rgba(255,255,255,0.92)] p-1 md:hidden">
            {(['list', 'map'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setMobileView(view)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mobileView === view ? 'bg-[#6b4f36] text-white' : 'text-slate-600'
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
          <div className="rounded-3xl border border-[#e7ddd2] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.9))] p-6 shadow-panel">
            <h3 className="text-lg font-semibold text-slate-900">No matching places yet</h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Try a broader search or a nearby suburb name.
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

      {resultsSource === 'mock' && !initialQuery ? (
        <section className="rounded-3xl border border-[#e7ddd2] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.9))] p-5 text-sm text-slate-600 shadow-panel">
          Sample places are shown to demonstrate the search flow.
        </section>
      ) : null}
    </div>
  );
}
