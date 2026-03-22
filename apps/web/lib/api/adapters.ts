import { buildPlaceSlug } from '@/lib/routes';
import { DogPolicyStatus, PlaceDetail, PlacePetRules, PlaceSummary } from '@/lib/types';

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
  dogPolicyStatus?: DogPolicyStatus;
  confidenceScore?: number | null;
  verifiedAt?: string | null;
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
    lat: item.lat,
    lng: item.lng,
    category: normalizeCategory(item.category),
    distanceLabel: 'API result',
    dogPolicyStatus: item.dogPolicyStatus,
    confidenceScore: item.confidenceScore,
    verifiedAt: item.verifiedAt,
    summary: item.dogPolicyStatus === 'unknown' ? 'No trustworthy public policy published yet' : 'Dog policy available',
  };
}

export function adaptPlaceDetail(place: ApiPlaceDetail): PlaceDetail {
  const petRules: PlacePetRules = {
    ...place.petRules,
    dogPolicyStatus: place.dogPolicyStatus ?? place.petRules.dogPolicyStatus,
    confidenceScore: place.confidenceScore !== undefined ? place.confidenceScore : place.petRules.confidenceScore,
    verifiedAt: place.verifiedAt !== undefined ? place.verifiedAt : place.petRules.verifiedAt,
  };

  return {
    placeId: place.id,
    placeSlug: buildPlaceSlug(place.name, place.id),
    name: place.name,
    formattedAddress: place.formattedAddress,
    lat: place.lat,
    lng: place.lng,
    category: normalizeCategory(place.category),
    summary: petRules.notes ?? 'Dog policy available',
    websiteUrl: place.websiteUrl,
    petRules,
  };
}

function normalizeCategory(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}
