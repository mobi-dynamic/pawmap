import { buildPlaceSlug } from '@/lib/routes';
import { PlaceDetail, PlacePetRules, PlaceSummary } from '@/lib/types';

type ApiSearchItem = {
  id: string;
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  category: string;
  dogPolicyStatus: PlacePetRules['dogPolicyStatus'];
  confidenceScore: number | null;
  verifiedAt: string | null;
};

type ApiPlaceDetail = {
  id: string;
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  category: string;
  websiteUrl?: string;
  petRules: PlacePetRules;
};

export function adaptSearchItem(item: ApiSearchItem): PlaceSummary {
  return {
    placeId: item.id,
    placeSlug: buildPlaceSlug(item.name, item.id),
    googlePlaceId: item.googlePlaceId,
    name: item.name,
    formattedAddress: item.formattedAddress,
    category: normalizeCategory(item.category),
    distanceLabel: 'API result',
    dogPolicyStatus: item.dogPolicyStatus,
    confidenceScore: item.confidenceScore,
    verifiedAt: item.verifiedAt,
    summary: 'Dog policy available',
  };
}

export function adaptPlaceDetail(place: ApiPlaceDetail): PlaceDetail {
  return {
    placeId: place.id,
    placeSlug: buildPlaceSlug(place.name, place.id),
    name: place.name,
    formattedAddress: place.formattedAddress,
    category: normalizeCategory(place.category),
    summary: place.petRules.notes ?? 'Dog policy available',
    websiteUrl: place.websiteUrl,
    petRules: place.petRules,
  };
}

function normalizeCategory(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}
