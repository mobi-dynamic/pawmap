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

type FastApiValidationDetail = {
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
};

type ApiEnvelopeError = {
  error?: ApiError;
  detail?:
    | ApiError
    | string
    | FastApiValidationDetail[]
    | {
        code?: string;
        message?: string;
      };
  message?: string;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

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

export async function getNearbyPlaces(params: {
  lat: number;
  lng: number;
  radiusMeters?: number;
  limit?: number;
  dogPolicyStatus?: DogPolicyStatus;
}) {
  const searchParams = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radiusMeters: String(params.radiusMeters ?? 2000),
    limit: String(params.limit ?? 6),
  });

  if (params.dogPolicyStatus) {
    searchParams.set('dogPolicyStatus', params.dogPolicyStatus);
  }

  const response = await fetchJson<ApiSearchResponse>(`/places/nearby?${searchParams.toString()}`);
  return response.items.map(adaptSearchItem);
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
    const normalized = normalizeApiError(payload, response.status);
    throw new ApiClientError(normalized.message, response.status, normalized.code);
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

function normalizeApiError(payload: ApiEnvelopeError | null, status: number) {
  const detail = payload?.detail;

  if (payload?.error?.message) {
    return { code: payload.error.code, message: payload.error.message };
  }

  if (typeof detail === 'string' && detail.trim()) {
    return { message: detail.trim() };
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const message = detail
      .map((item) => item.msg?.trim())
      .filter((value): value is string => Boolean(value))
      .join(' ');

    if (message) {
      return { code: 'VALIDATION_ERROR', message };
    }
  }

  if (detail && typeof detail === 'object' && 'message' in detail && typeof detail.message === 'string') {
    return {
      code: 'code' in detail && typeof detail.code === 'string' ? detail.code : undefined,
      message: detail.message,
    };
  }

  if (payload?.message?.trim()) {
    return { message: payload.message.trim() };
  }

  return { message: defaultErrorMessage(status) };
}

function defaultErrorMessage(status: number) {
  switch (status) {
    case 401:
      return 'You need to be signed in before sending a report.';
    case 404:
      return 'That place could not be found.';
    case 422:
      return 'The server rejected this request. Check the fields and try again.';
    case 500:
      return 'PawMap hit a server error. Try again in a moment.';
    default:
      return `Request failed with status ${status}`;
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
