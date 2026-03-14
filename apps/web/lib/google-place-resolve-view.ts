export const googlePlaceCacheMissContent = {
  title: 'This place is not in PawMap yet',
  description:
    'We found the provider reference, but PawMap has not cached this place yet, so we cannot show a trusted policy page.',
  action: { label: 'Back to results', href: '/' },
  explainerTitle: 'This is different from “Policy unknown.”',
  explainerDescription: 'Unknown means the place exists in PawMap, but its dog policy is still unverified.',
  secondaryAction: { label: 'Search again', href: '/' },
} as const;

export type GooglePlaceResolveViewModel =
  | { kind: 'redirect'; href: string }
  | { kind: 'cache_miss'; content: typeof googlePlaceCacheMissContent };

export function getGooglePlaceResolveViewModel(result: {
  resolveState: 'ready' | 'cache_miss';
  canonicalPlaceSlug: string | null;
}): GooglePlaceResolveViewModel | null {
  if (result.resolveState === 'cache_miss') {
    return { kind: 'cache_miss', content: googlePlaceCacheMissContent };
  }

  if (!result.canonicalPlaceSlug) {
    return null;
  }

  return {
    kind: 'redirect',
    href: `/place/${result.canonicalPlaceSlug}`,
  };
}
