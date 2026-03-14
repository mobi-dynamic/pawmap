import { describe, expect, it } from 'vitest';

import {
  getGooglePlaceResolveViewModel,
  googlePlaceCacheMissContent,
} from '@/lib/google-place-resolve-view';

describe('getGooglePlaceResolveViewModel', () => {
  it('builds the canonical redirect target for a resolved Google place', () => {
    expect(
      getGooglePlaceResolveViewModel({
        resolveState: 'ready',
        canonicalPlaceSlug: 'royal-bark--plc_royal-bark',
      }),
    ).toEqual({
      kind: 'redirect',
      href: '/place/royal-bark--plc_royal-bark',
    });
  });

  it('returns the dedicated cache-miss warning state for PLACE_CACHE_MISS results', () => {
    expect(
      getGooglePlaceResolveViewModel({
        resolveState: 'cache_miss',
        canonicalPlaceSlug: null,
      }),
    ).toEqual({
      kind: 'cache_miss',
      content: googlePlaceCacheMissContent,
    });

    expect(googlePlaceCacheMissContent.title).toBe('This place is not in PawMap yet');
    expect(googlePlaceCacheMissContent.description).toContain('PawMap has not cached this place yet');
    expect(googlePlaceCacheMissContent.explainerTitle).toBe('This is different from “Policy unknown.”');
    expect(googlePlaceCacheMissContent.action).toEqual({ label: 'Back to results', href: '/' });
    expect(googlePlaceCacheMissContent.secondaryAction).toEqual({ label: 'Search again', href: '/' });
  });

  it('signals not-found when a ready result is missing a canonical slug', () => {
    expect(
      getGooglePlaceResolveViewModel({
        resolveState: 'ready',
        canonicalPlaceSlug: null,
      }),
    ).toBeNull();
  });
});
