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

export type PlaceCoordinates = {
  lat: number;
  lng: number;
};

export type PlaceSummary = PlaceRouteRef &
  PlaceCoordinates & {
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

export type PlaceDetail = PlaceRouteRef &
  PlaceCoordinates & {
    name: string;
    formattedAddress: string;
    category: string;
    summary: string;
    websiteUrl?: string;
    petRules: PlacePetRules;
  };

export type UserReportSubmission = {
  placeId: string;
  proposedDogPolicyStatus: DogPolicyStatus | null;
  proposedIndoorAllowed: boolean | null;
  proposedOutdoorAllowed: boolean | null;
  proposedLeashRequired: boolean | null;
  proposedSizeRestriction: string | null;
  proposedBreedRestriction: string | null;
  proposedServiceDogOnly: boolean | null;
  proposedNotes: string | null;
  evidenceUrl: string | null;
  reporterComment: string | null;
};

export type ReportSubmissionResult = {
  id: string;
  placeId: string;
  status: ReportStatus;
  reporterUserId: string;
  createdAt: string;
};

export type AdminReport = {
  id: string;
  placeId: string;
  status: ReportStatus;
  reporterUserId: string;
  proposedDogPolicyStatus: DogPolicyStatus | null;
  proposedIndoorAllowed: boolean | null;
  proposedOutdoorAllowed: boolean | null;
  proposedLeashRequired: boolean | null;
  proposedSizeRestriction: string | null;
  proposedBreedRestriction: string | null;
  proposedServiceDogOnly: boolean | null;
  proposedNotes: string | null;
  evidenceUrl: string | null;
  reporterComment: string | null;
  reviewNotes: string | null;
  reviewedByUserId: string | null;
  createdAt: string;
  reviewedAt: string | null;
  place: AdminReportPlaceContext | null;
};

export type AdminReportPlaceContext = PlaceRouteRef & {
  name: string;
  formattedAddress: string;
  category: string;
};

export type ModerationActionResult = {
  id: string;
  status: ReportStatus;
  reviewedAt: string;
  reviewedByUserId: string;
};
