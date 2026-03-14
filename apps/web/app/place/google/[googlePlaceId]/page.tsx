import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { StatePanel } from '@/components/state-panel';
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

  return (
    <StatePanel
      tone="warning"
      title={viewModel.content.title}
      description={viewModel.content.description}
      action={viewModel.content.action}
    >
      <div className="space-y-3 rounded-2xl bg-white/70 p-4 text-sm text-slate-700">
        <p className="font-medium text-slate-900">{viewModel.content.explainerTitle}</p>
        <p>{viewModel.content.explainerDescription}</p>
        <Link
          href={viewModel.content.secondaryAction.href}
          className="inline-flex items-center font-medium text-slate-900 underline underline-offset-4"
        >
          {viewModel.content.secondaryAction.label}
        </Link>
      </div>
    </StatePanel>
  );
}
