import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { StatePanel } from '@/components/state-panel';
import { resolveGooglePlacePage } from '@/lib/place-repository';

export default async function GooglePlaceResolvePage({ params }: { params: { googlePlaceId: string } }) {
  const result = await resolveGooglePlacePage(params.googlePlaceId);

  if (result.resolveState === 'cache_miss') {
    return (
      <StatePanel
        tone="warning"
        title="This place is not in PawMap yet"
        description="We found the provider reference, but PawMap has not cached this place yet, so we cannot show a trusted policy page."
        action={{ label: 'Back to results', href: '/' }}
      >
        <div className="space-y-3 rounded-2xl bg-white/70 p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">This is different from “Policy unknown.”</p>
          <p>Unknown means the place exists in PawMap, but its dog policy is still unverified.</p>
          <Link href="/" className="inline-flex items-center font-medium text-slate-900 underline underline-offset-4">
            Search again
          </Link>
        </div>
      </StatePanel>
    );
  }

  if (!result.canonicalPlaceSlug) {
    notFound();
  }

  redirect(`/place/${result.canonicalPlaceSlug}`);
}
