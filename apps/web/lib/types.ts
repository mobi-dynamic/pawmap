export type DogPolicyStatus = 'allowed' | 'restricted' | 'not_allowed' | 'unknown';

export type VerificationSourceType =
  | 'official_website'
  | 'direct_contact'
  | 'user_report'
  | 'onsite_signage'
  | 'third_party_listing'
  | 'other';

export type ReportStatus = 'pending' | 'approved' | 'rejected';

export type ResolveState = 'ready' | 'cache_miss' | 'unknown';

export type PlaceRouteRef = {
  placeId: string;
  placeSlug: string;
};

export type PlaceSummary = PlaceRouteRef & {
  googlePlaceId?: string;
  name: string;
  formattedAddress: string;
  category: string;
  distanceLabel: string;
  dogPolicyStatus: DogPolicyStatus;
  confidenceScore: number | null;
  verifiedAt: string | null;
  summary: string;
};

export type PlacePetRules = {
  dogPolicyStatus: DogPolicyStatus;
  indoorAllowed: boolean | null;
  outdoorAllowed: boolean | null;
  leashRequired: boolean | null;
  sizeRestriction: string | null;
  breedRestriction: string | null;
  serviceDogOnly: boolean | null;
  notes: string | null;
  confidenceScore: number | null;
  verificationSourceType: VerificationSourceType | null;
  verificationSourceUrl: string | null;
  verifiedAt: string | null;
};

export type PlaceDetail = PlaceRouteRef & {
  name: string;
  formattedAddress: string;
  category: string;
  summary: string;
  websiteUrl?: string;
  petRules: PlacePetRules;
};
