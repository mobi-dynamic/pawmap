export type DogPolicyStatus = 'allowed' | 'restricted' | 'not_allowed' | 'unknown';

export type VerificationSourceType =
  | 'official_website'
  | 'direct_contact'
  | 'user_report'
  | 'onsite_signage'
  | 'third_party_listing'
  | 'other';

export type PlaceSummary = {
  id: string;
  slug: string;
  name: string;
  formattedAddress: string;
  category: string;
  distanceLabel: string;
  dogPolicyStatus: DogPolicyStatus;
  confidenceLabel: string;
  verifiedAtLabel: string;
  summary: string;
};

export type PlaceDetail = {
  id: string;
  slug: string;
  name: string;
  formattedAddress: string;
  category: string;
  summary: string;
  websiteUrl?: string;
  petRules: {
    dogPolicyStatus: DogPolicyStatus;
    indoorAllowed: boolean | null;
    outdoorAllowed: boolean | null;
    leashRequired: boolean | null;
    sizeRestriction: string | null;
    breedRestriction: string | null;
    serviceDogOnly: boolean | null;
    notes: string | null;
    confidenceLabel: string;
    verificationSourceType: VerificationSourceType | null;
    verificationSourceLabel: string;
    verificationSourceUrl: string | null;
    verifiedAtLabel: string;
  };
};

export type ResolveState = 'ready' | 'cache_miss' | 'unknown';
