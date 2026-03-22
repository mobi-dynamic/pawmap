import { PlaceSummary } from '@/lib/types';

type MapPoint = {
  place: PlaceSummary;
  top: number;
  left: number;
};

const FALLBACK_TOPS = [22, 48, 68, 34, 58, 76];
const FALLBACK_LEFTS = [24, 62, 46, 72, 36, 54];

export function buildSearchMapPoints(results: PlaceSummary[]): MapPoint[] {
  if (results.length === 0) return [];

  const hasDistinctCoordinates = new Set(results.map((place) => `${place.lat}:${place.lng}`)).size > 1;
  if (!hasDistinctCoordinates) {
    return results.map((place, index) => ({
      place,
      top: FALLBACK_TOPS[index] ?? 20 + (index % 5) * 12,
      left: FALLBACK_LEFTS[index] ?? 25 + (index % 4) * 14,
    }));
  }

  const lats = results.map((place) => place.lat);
  const lngs = results.map((place) => place.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 0.01;
  const lngSpan = maxLng - minLng || 0.01;

  return results.map((place) => ({
    place,
    top: clamp(16 + ((maxLat - place.lat) / latSpan) * 68, 14, 84),
    left: clamp(14 + ((place.lng - minLng) / lngSpan) * 72, 14, 86),
  }));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
