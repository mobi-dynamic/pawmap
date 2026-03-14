import { placeCacheMissContent } from '@/lib/place-cache-miss-content';

export const googlePlaceCacheMissContent = placeCacheMissContent;

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
