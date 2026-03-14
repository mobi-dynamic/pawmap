import { PlaceDetail, ResolveState } from '@/lib/types';
import { buildPlaceSlug } from '@/lib/routes';

export const placeDetailsById: Record<string, PlaceDetail> = {
  'plc_royal-bark': {
    placeId: 'plc_royal-bark',
    placeSlug: buildPlaceSlug('Royal Bark Cafe', 'plc_royal-bark', 'royal-bark-cafe'),
    name: 'Royal Bark Cafe',
    formattedAddress: '12 Napier St, Fitzroy VIC',
    category: 'Cafe',
    summary: 'Neighbourhood cafe with a dog-friendly courtyard and clear leash guidance.',
    websiteUrl: 'https://example.com/royal-bark',
    petRules: {
      dogPolicyStatus: 'restricted',
      indoorAllowed: false,
      outdoorAllowed: true,
      leashRequired: true,
      sizeRestriction: null,
      breedRestriction: null,
      serviceDogOnly: false,
      notes: 'Dogs are welcome in the courtyard. Staff may pause access during busy brunch periods.',
      confidenceScore: 92,
      verificationSourceType: 'official_website',
      verificationSourceUrl: 'https://example.com/royal-bark/policy',
      verifiedAt: '2026-03-12T09:00:00Z',
    },
  },
  'plc_pawsome-park': {
    placeId: 'plc_pawsome-park',
    placeSlug: buildPlaceSlug('Pawsome Park', 'plc_pawsome-park', 'pawsome-park'),
    name: 'Pawsome Park',
    formattedAddress: '88 River Walk, Richmond VIC',
    category: 'Park',
    summary: 'Large green space with an off-leash section and water stations near the oval.',
    websiteUrl: 'https://example.com/pawsome-park',
    petRules: {
      dogPolicyStatus: 'allowed',
      indoorAllowed: null,
      outdoorAllowed: true,
      leashRequired: false,
      sizeRestriction: null,
      breedRestriction: null,
      serviceDogOnly: false,
      notes: 'Off-leash allowed inside the signed exercise area. Leash required on shared paths.',
      confidenceScore: 84,
      verificationSourceType: 'onsite_signage',
      verificationSourceUrl: null,
      verifiedAt: '2026-03-14T09:00:00Z',
    },
  },
  'plc_market-hall': {
    placeId: 'plc_market-hall',
    placeSlug: buildPlaceSlug('Market Hall Grocer', 'plc_market-hall', 'market-hall-grocer'),
    name: 'Market Hall Grocer',
    formattedAddress: '40 Smith St, Collingwood VIC',
    category: 'Retail',
    summary: 'Popular grocery stop with mixed anecdotes but no publishable rule yet.',
    petRules: {
      dogPolicyStatus: 'unknown',
      indoorAllowed: null,
      outdoorAllowed: null,
      leashRequired: null,
      sizeRestriction: null,
      breedRestriction: null,
      serviceDogOnly: null,
      notes: 'We need a stronger source before showing a dog policy.',
      confidenceScore: null,
      verificationSourceType: null,
      verificationSourceUrl: null,
      verifiedAt: null,
    },
  },
};

export const resolveStateByPlaceSlug: Record<string, ResolveState> = {
  [placeDetailsById['plc_royal-bark'].placeSlug]: 'ready',
  [placeDetailsById['plc_pawsome-park'].placeSlug]: 'ready',
  [placeDetailsById['plc_market-hall'].placeSlug]: 'unknown',
  'google-cache-miss-demo': 'cache_miss',
};

export function getPlaceBySlug(placeSlug: string) {
  return Object.values(placeDetailsById).find((place) => place.placeSlug === placeSlug) ?? null;
}
