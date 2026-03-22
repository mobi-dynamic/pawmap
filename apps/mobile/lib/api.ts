import { buildApiUrl, devUserId } from '@/lib/config';
import type {
  ApiError,
  DogPolicyStatus,
  PetRules,
  PlaceDetail,
  PlaceSummary,
  ReportSubmissionInput,
  ReportSubmissionResult,
} from '@/lib/types';

type ApiEnvelopeError = {
  error?: ApiError;
};

type ApiSearchItem = {
  id: string;
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  category: string | null;
  dogPolicyStatus: DogPolicyStatus;
  confidenceScore: number | null;
  verifiedAt: string | null;
};

type ApiSearchResponse = {
  items: ApiSearchItem[];
};

type ApiPlaceDetail = ApiSearchItem & {
  websiteUrl: string | null;
  petRules: PetRules;
};

export async function searchPlaces(query: string) {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    return [] satisfies PlaceSummary[];
  }

  const params = new URLSearchParams({ q: trimmedQuery, limit: '20' });
  const response = await fetchJson<ApiSearchResponse>(`/places/search?${params.toString()}`);
  return response.items.map(adaptSearchItem);
}

export async function getPlaceDetail(placeId: string) {
  const response = await fetchJson<ApiPlaceDetail>(`/places/${encodeURIComponent(placeId)}`);
  return adaptPlaceDetail(response);
}

export async function submitReport(input: ReportSubmissionInput) {
  const payload = sanitizeReportSubmission(input);

  return fetchJson<ReportSubmissionResult>('/reports', {
    method: 'POST',
    headers: {
      'X-User-Id': devUserId,
    },
    body: JSON.stringify(payload),
  });
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = (await safeParseJson(response)) as ApiEnvelopeError | null;
    throw new Error(payload?.error?.message ?? `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function safeParseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function sanitizeReportSubmission(input: ReportSubmissionInput): ReportSubmissionInput {
  const cleanText = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  return {
    placeId: input.placeId,
    proposedDogPolicyStatus: input.proposedDogPolicyStatus ?? null,
    proposedIndoorAllowed: input.proposedIndoorAllowed ?? null,
    proposedOutdoorAllowed: input.proposedOutdoorAllowed ?? null,
    proposedLeashRequired: input.proposedLeashRequired ?? null,
    proposedSizeRestriction: cleanText(input.proposedSizeRestriction),
    proposedBreedRestriction: cleanText(input.proposedBreedRestriction),
    proposedServiceDogOnly: input.proposedServiceDogOnly ?? null,
    proposedNotes: cleanText(input.proposedNotes),
    evidenceUrl: cleanText(input.evidenceUrl),
    reporterComment: cleanText(input.reporterComment),
  };
}

export function getReportValidationMessage(payload: ReportSubmissionInput) {
  const hasSignal = Object.entries(payload).some(
    ([key, value]) => key !== 'placeId' && value !== null && String(value).trim() !== '',
  );

  if (!hasSignal) {
    return 'Add at least one policy change, note, evidence link, or comment before submitting.';
  }

  if (payload.evidenceUrl) {
    try {
      new URL(payload.evidenceUrl);
    } catch {
      return 'Evidence link must be a valid URL.';
    }
  }

  return null;
}

function adaptSearchItem(item: ApiSearchItem): PlaceSummary {
  return {
    id: item.id,
    googlePlaceId: item.googlePlaceId,
    name: item.name,
    formattedAddress: item.formattedAddress,
    lat: item.lat,
    lng: item.lng,
    category: normalizeCategory(item.category),
    dogPolicyStatus: item.dogPolicyStatus,
    confidenceScore: item.confidenceScore,
    verifiedAt: item.verifiedAt,
    summary: buildSummary({
      dogPolicyStatus: item.dogPolicyStatus,
      notes: null,
      indoorAllowed: null,
      outdoorAllowed: null,
      serviceDogOnly: null,
    }),
  };
}

function adaptPlaceDetail(item: ApiPlaceDetail): PlaceDetail {
  const petRules = {
    ...item.petRules,
    confidenceScore: item.petRules.confidenceScore ?? item.confidenceScore,
    dogPolicyStatus: item.petRules.dogPolicyStatus ?? item.dogPolicyStatus,
    verifiedAt: item.petRules.verifiedAt ?? item.verifiedAt,
  };

  return {
    id: item.id,
    googlePlaceId: item.googlePlaceId,
    name: item.name,
    formattedAddress: item.formattedAddress,
    lat: item.lat,
    lng: item.lng,
    category: normalizeCategory(item.category),
    dogPolicyStatus: item.dogPolicyStatus,
    confidenceScore: item.confidenceScore,
    verifiedAt: item.verifiedAt,
    summary: buildSummary(petRules),
    websiteUrl: item.websiteUrl,
    petRules,
  };
}

function normalizeCategory(value: string | null) {
  if (!value) return 'Place';

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function buildSummary(rules: {
  dogPolicyStatus: DogPolicyStatus;
  notes: string | null;
  indoorAllowed: boolean | null;
  outdoorAllowed: boolean | null;
  serviceDogOnly: boolean | null;
}) {
  if (rules.notes) return rules.notes;
  if (rules.serviceDogOnly) return 'Service dogs only.';
  if (rules.indoorAllowed === true && rules.outdoorAllowed === true) return 'Dogs allowed indoors and outdoors.';
  if (rules.indoorAllowed === false && rules.outdoorAllowed === true) return 'Dogs allowed outdoors only.';
  if (rules.dogPolicyStatus === 'not_allowed') return 'Dogs are not allowed.';
  if (rules.dogPolicyStatus === 'unknown') return 'No trustworthy public policy published yet.';
  if (rules.dogPolicyStatus === 'allowed') return 'Dog policy available.';
  return 'Dog access may be restricted.';
}
