import { PlaceCard } from '@/components/place-card';
import { ShellCard } from '@/components/shell-card';
import { StatePanel } from '@/components/state-panel';
import { featuredPlaces } from '@/lib/mock-data';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-[2rem] bg-slate-900 px-8 py-10 text-white shadow-panel lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-300">FE-001 shell</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">Find dog-friendly places with clear rules, not vibes.</h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300">
            This MVP shell focuses on quick search, policy confidence, and explicit fallback states while the API and map integrations are still taking shape.
          </p>
          <div className="mt-6 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
            <label htmlFor="search" className="text-sm font-medium text-slate-200">
              Search places
            </label>
            <div className="mt-3 flex flex-col gap-3 md:flex-row">
              <input
                id="search"
                defaultValue="cafe with courtyard"
                readOnly
                className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-slate-900 outline-none"
              />
              <button className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950">
                Search
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-300">Static shell for now. Wire this to `GET /places/search` next.</p>
          </div>
        </div>

        <div className="grid gap-4">
          <ShellCard title="What this shell proves" eyebrow="MVP slice">
            <ul className="space-y-2">
              <li>• Search landing page structure</li>
              <li>• Canonical API IDs with slug-based web routes</li>
              <li>• Detail shells for known, unknown, and cache-miss states</li>
            </ul>
          </ShellCard>
          <ShellCard title="Map placeholder" eyebrow="Next integration">
            <div className="flex h-44 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
              Interactive map arrives after nearby/search API wiring.
            </div>
          </ShellCard>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {featuredPlaces.map((place) => (
          <PlaceCard key={place.placeId} place={place} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <StatePanel
          title="Unknown state is first-class"
          description="If PawMap cannot support a trustworthy answer yet, the UI stays explicit instead of guessing. That keeps trust intact."
          action={{ label: 'Open unknown example', href: '/place/market-hall-grocer' }}
        />
        <StatePanel
          tone="warning"
          title="Provider cache miss has its own screen"
          description="The API contract calls out provider cache misses explicitly. The web shell exposes that path now so the eventual error UX is not an afterthought."
          action={{ label: 'Open cache-miss example', href: '/place/google-cache-miss-demo' }}
        />
      </section>
    </div>
  );
}
