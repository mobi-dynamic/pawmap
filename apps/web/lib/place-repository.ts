import { adaptPlaceDetail, adaptSearchItem } from '@/lib/api/adapters';
import { ApiError, apiGet, getApiBaseUrl } from '@/lib/api/client';
import { getPlaceBySlug, placeDetailsById, resolveStateByPlaceSlug } from '@/lib/mock-data';
import { parsePlaceSlug } from '@/lib/routes';
import { PlaceDetail, PlaceSummary, ResolveState } from '@/lib/types';
import { toSummaryFromDetail } from '@/lib/view-models';

type SearchResult = {
  items: Array<{
    id: string;
    googlePlaceId: string;
    name: string;
    formattedAddress: string;
    lat: number;
    lng: number;
    category: string;
    dogPolicyStatus: PlaceSummary['dogPolicyStatus'];
    confidenceScore: number | null;
    verifiedAt: string | null;
  }>;
};

type ResolveGooglePlaceResult = {
  placeId: string;
  googlePlaceId: string;
  status: 'resolved';
};

export async function searchPlaces(query: string) {
  const trimmedQuery = query.trim();
  const apiEnabled = Boolean(getApiBaseUrl());

  if (apiEnabled && trimmedQuery.length >= 2) {
    try {
      const params = new URLSearchParams({ q: trimmedQuery, limit: '20' });
      const response = await apiGet<SearchResult>(`/places/search?${params.toString()}`);
      return {
        query: trimmedQuery,
        source: 'api' as const,
        items: response.items.map(adaptSearchItem),
      };
    } catch {
      // Fall back to local mock data when the API is unavailable.
    }
  }

  const items = Object.values(placeDetailsById)
    .map((place, index) => toSummaryFromDetail(place, ['6 min away', '14 min away', '18 min away'][index] ?? 'Sample result'))
    .filter((place) => matchesQuery(place, trimmedQuery));

  return {
    query: trimmedQuery,
    source: 'mock' as const,
    items,
  };
}

export async function resolveGooglePlacePage(googlePlaceId: string): Promise<
  | { resolveState: 'ready'; canonicalPlaceSlug: string; source: 'api' | 'mock' }
  | { resolveState: 'cache_miss'; canonicalPlaceSlug: null; source: 'api' | 'mock' }
> {
  if (getApiBaseUrl()) {
    try {
      const resolved = await apiGet<ResolveGooglePlaceResult>(`/places/resolve/google/${encodeURIComponent(googlePlaceId)}`);
      const place = adaptPlaceDetail(await apiGet(`/places/${resolved.placeId}`));
      return {
        resolveState: 'ready',
        canonicalPlaceSlug: place.placeSlug,
        source: 'api',
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && error.code === 'PLACE_CACHE_MISS') {
        return { resolveState: 'cache_miss', canonicalPlaceSlug: null, source: 'api' };
      }

      throw error;
    }
  }

  if (googlePlaceId === 'google-cache-miss-demo') {
    return { resolveState: 'cache_miss', canonicalPlaceSlug: null, source: 'mock' };
  }

  const mockPlace = Object.values(placeDetailsById).find((place) => place.placeSlug === googlePlaceId || place.placeId === googlePlaceId);
  return {
    resolveState: 'ready',
    canonicalPlaceSlug: mockPlace?.placeSlug ?? placeDetailsById['plc_royal-bark'].placeSlug,
    source: 'mock',
  };
}

export async function getPlacePageData(placeSlug: string): Promise<{ resolveState: ResolveState; place: PlaceDetail | null; source: 'api' | 'mock' }> {
  const { placeId } = parsePlaceSlug(placeSlug);

  if (placeId && getApiBaseUrl()) {
    try {
      const place = adaptPlaceDetail(await apiGet(`/places/${placeId}`));
      return { resolveState: place.petRules.dogPolicyStatus === 'unknown' ? 'unknown' : 'ready', place, source: 'api' };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && error.code === 'PLACE_CACHE_MISS') {
        return { resolveState: 'cache_miss', place: null, source: 'api' };
      }
    }
  }

  const resolveState = resolveStateByPlaceSlug[placeSlug];
  if (!resolveState) {
    return { resolveState: 'ready', place: null, source: 'mock' };
  }

  return {
    resolveState,
    place: getPlaceBySlug(placeSlug),
    source: 'mock',
  };
}

function matchesQuery(place: PlaceSummary, query: string) {
  const value = query.trim().toLowerCase();
  if (!value) return true;

  return [place.name, place.formattedAddress, place.category, place.summary].some((field) => field.toLowerCase().includes(value));
}
