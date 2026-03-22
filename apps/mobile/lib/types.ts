export type DogPolicyStatus = 'allowed' | 'restricted' | 'not_allowed' | 'unknown';

export type VerificationSourceType =
  | 'official_website'
  | 'direct_contact'
  | 'user_report'
  | 'onsite_signage'
  | 'third_party_listing'
  | 'other';

export type ApiError = {
  code: string;
  message: string;
};

export type PlaceSummary = {
  id: string;
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  category: string;
  dogPolicyStatus: DogPolicyStatus;
  confidenceScore: number | null;
  verifiedAt: string | null;
  summary: string;
};

export type PetRules = {
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

export type PlaceDetail = {
  id: string;
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  category: string;
  dogPolicyStatus: DogPolicyStatus;
  confidenceScore: number | null;
  verifiedAt: string | null;
  summary: string;
  websiteUrl: string | null;
  petRules: PetRules;
};
