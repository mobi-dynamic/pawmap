import { PlaceDetail, PlaceSummary, ResolveState, VerificationSourceType } from '@/lib/types';

function formatConfidenceLabel(confidenceScore: number | null) {
  if (confidenceScore === null) return 'Needs verification';
  if (confidenceScore >= 80) return 'High confidence';
  if (confidenceScore >= 60) return 'Verified';
  return 'Needs verification';
}

function formatVerifiedAtLabel(verifiedAt: string | null) {
  if (!verifiedAt) return 'Unknown';

  const verifiedDate = new Date(verifiedAt);
  const today = new Date('2026-03-14T12:00:00Z');
  const diffDays = Math.round((today.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Checked today';
  if (diffDays === 1) return 'Checked 1 day ago';
  return `Checked ${diffDays} days ago`;
}

function formatSourceLabel(sourceType: VerificationSourceType | null) {
  switch (sourceType) {
    case 'official_website':
      return 'Official website';
    case 'direct_contact':
      return 'Direct contact';
    case 'user_report':
      return 'User report';
    case 'onsite_signage':
      return 'On-site signage';
    case 'third_party_listing':
      return 'Third-party listing';
    case 'other':
      return 'Other source';
    default:
      return 'No reliable evidence yet';
  }
}

export const featuredPlaces: PlaceSummary[] = [
  {
    placeId: 'plc_royal-bark',
    placeSlug: 'royal-bark-cafe',
    name: 'Royal Bark Cafe',
    formattedAddress: '12 Napier St, Fitzroy VIC',
    category: 'Cafe',
    distanceLabel: '6 min away',
    dogPolicyStatus: 'restricted',
    confidenceScore: 92,
    verifiedAt: '2026-03-12T09:00:00Z',
    summary: 'Courtyard-friendly with leash-on entry rules.',
  },
  {
    placeId: 'plc_pawsome-park',
    placeSlug: 'pawsome-park',
    name: 'Pawsome Park',
    formattedAddress: '88 River Walk, Richmond VIC',
    category: 'Park',
    distanceLabel: '14 min away',
    dogPolicyStatus: 'allowed',
    confidenceScore: 84,
    verifiedAt: '2026-03-14T09:00:00Z',
    summary: 'Off-leash area with fenced community lawn.',
  },
  {
    placeId: 'plc_market-hall',
    placeSlug: 'market-hall-grocer',
    name: 'Market Hall Grocer',
    formattedAddress: '40 Smith St, Collingwood VIC',
    category: 'Retail',
    distanceLabel: '18 min away',
    dogPolicyStatus: 'unknown',
    confidenceScore: null,
    verifiedAt: null,
    summary: 'Looks promising, but published policy is still unknown.',
  },
];

export const placeDetailsById: Record<string, PlaceDetail> = {
  'plc_royal-bark': {
    placeId: 'plc_royal-bark',
    placeSlug: 'royal-bark-cafe',
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
    placeSlug: 'pawsome-park',
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
    placeSlug: 'market-hall-grocer',
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
  'royal-bark-cafe': 'ready',
  'pawsome-park': 'ready',
  'market-hall-grocer': 'unknown',
  'google-cache-miss-demo': 'cache_miss',
};

export function getPlaceBySlug(placeSlug: string) {
  return Object.values(placeDetailsById).find((place) => place.placeSlug === placeSlug) ?? null;
}

export function getConfidenceLabel(confidenceScore: number | null) {
  return formatConfidenceLabel(confidenceScore);
}

export function getVerifiedAtLabel(verifiedAt: string | null) {
  return formatVerifiedAtLabel(verifiedAt);
}

export function getSourceLabel(sourceType: VerificationSourceType | null) {
  return formatSourceLabel(sourceType);
}
