import type { DogPolicyStatus, VerificationSourceType } from '@/lib/types';

export type TrustLevel = 'verified' | 'inferred' | 'needs_verification';

const VERIFIED_SOURCES = new Set<VerificationSourceType>(['official_website', 'direct_contact', 'onsite_signage']);
const INFERRED_SOURCES = new Set<VerificationSourceType>(['user_report', 'third_party_listing', 'other']);

export function getPolicyStatusLabel(status: DogPolicyStatus) {
  switch (status) {
    case 'allowed':
      return 'Dogs allowed';
    case 'restricted':
      return 'Rules apply';
    case 'not_allowed':
      return 'Dogs not allowed';
    case 'unknown':
    default:
      return 'Policy unknown';
  }
}

export function getPolicyHeadline(status: DogPolicyStatus) {
  switch (status) {
    case 'allowed':
      return 'Dogs are welcome here.';
    case 'restricted':
      return 'Dogs may be welcome with conditions.';
    case 'not_allowed':
      return 'Dogs are not currently allowed here.';
    case 'unknown':
    default:
      return 'Dog access is not clear yet.';
  }
}

export function getTrustLevel(input: {
  dogPolicyStatus: DogPolicyStatus;
  verifiedAt?: string | null;
  verificationSourceType?: VerificationSourceType | null;
  confidenceScore?: number | null;
}): TrustLevel {
  const { dogPolicyStatus, verifiedAt, verificationSourceType, confidenceScore } = input;

  if (dogPolicyStatus === 'unknown') {
    return 'needs_verification';
  }

  if (verifiedAt || (verificationSourceType && VERIFIED_SOURCES.has(verificationSourceType))) {
    return 'verified';
  }

  if (
    (verificationSourceType && INFERRED_SOURCES.has(verificationSourceType)) ||
    (confidenceScore !== null && confidenceScore !== undefined)
  ) {
    return 'inferred';
  }

  return 'needs_verification';
}

export function getTrustLabel(level: TrustLevel) {
  switch (level) {
    case 'verified':
      return 'Verified';
    case 'inferred':
      return 'Inferred';
    case 'needs_verification':
    default:
      return 'Needs verification';
  }
}

export function getTrustShortNote(level: TrustLevel) {
  switch (level) {
    case 'verified':
      return 'Based on a checked source.';
    case 'inferred':
      return 'Likely based on available signals.';
    case 'needs_verification':
    default:
      return 'No reliable evidence yet.';
  }
}

export function getTrustMessage(level: TrustLevel) {
  switch (level) {
    case 'verified':
      return 'Based on a checked source. Still worth confirming if you are planning a special visit.';
    case 'inferred':
      return 'This is inferred from available signals, so confirm before visiting.';
    case 'needs_verification':
    default:
      return 'Needs verification. We do not have reliable evidence for this policy yet.';
  }
}

export function getConfidenceNote(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return `Internal signal: ${Math.round(value)}%`; 
}

export function buildPolicySummary(rules: {
  dogPolicyStatus: DogPolicyStatus;
  notes: string | null;
  indoorAllowed: boolean | null;
  outdoorAllowed: boolean | null;
  serviceDogOnly: boolean | null;
}) {
  if (rules.notes) return rules.notes;
  if (rules.serviceDogOnly) return 'Service dogs only.';
  if (rules.indoorAllowed === true && rules.outdoorAllowed === true) return 'Dogs are allowed indoors and outdoors.';
  if (rules.indoorAllowed === false && rules.outdoorAllowed === true) return 'Dogs are likely allowed outdoors only.';
  if (rules.dogPolicyStatus === 'not_allowed') return 'Dogs are not allowed here.';
  if (rules.dogPolicyStatus === 'unknown') return 'No reliable dog policy evidence yet.';
  if (rules.dogPolicyStatus === 'allowed') return 'Dog-friendly based on available information.';
  return 'Rules may apply for dogs here.';
}
