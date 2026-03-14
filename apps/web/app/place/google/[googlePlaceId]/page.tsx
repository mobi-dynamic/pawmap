import { notFound, redirect } from 'next/navigation';

import { PlaceCacheMissPanel } from '@/components/place-cache-miss-panel';
import { getGooglePlaceResolveViewModel } from '@/lib/google-place-resolve-view';
import { resolveGooglePlacePage } from '@/lib/place-repository';

export default async function GooglePlaceResolvePage({ params }: { params: { googlePlaceId: string } }) {
  const result = await resolveGooglePlacePage(params.googlePlaceId);
  const viewModel = getGooglePlaceResolveViewModel(result);

  if (!viewModel) {
    notFound();
  }

  if (viewModel.kind === 'redirect') {
    redirect(viewModel.href);
  }

  return <PlaceCacheMissPanel content={viewModel.content} />;
}
