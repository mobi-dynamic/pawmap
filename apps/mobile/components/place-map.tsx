import type { PlaceSummary } from '@/lib/types';

export type PlaceMapProps = {
  results: PlaceSummary[];
  selectedPlaceId: string | null;
  isLoading: boolean;
  onSelectPlace: (place: PlaceSummary) => void;
  onMapReady?: () => void;
  heroHeight: number;
};

// This file exists to satisfy TypeScript module resolution.
// Expo/Metro will pick `place-map.native.tsx` or `place-map.web.tsx` at runtime.
export function PlaceMap(_: PlaceMapProps) {
  return null;
}
