import { PlaceDetail, PlacePetRules, PlaceSummary, VerificationSourceType } from '@/lib/types';

const sourceLabelMap: Record<VerificationSourceType, string> = {
  official_website: 'Official website',
  direct_contact: 'Direct contact',
  onsite_signage: 'On-site signage',
  user_report: 'User report',
  third_party_listing: 'Third-party listing',
  other: 'Other source',
};

function humanizeCheckedDate(verifiedAt: string | null) {
  if (!verifiedAt) return 'Unknown';

  const verifiedDate = new Date(verifiedAt);
  const today = new Date('2026-03-14T12:00:00Z');
  const diffDays = Math.round((today.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'checked today';
  if (diffDays === 1) return 'checked 1 day ago';
  return `checked ${diffDays} days ago`;
}

export function getConfidenceLabel(confidenceScore: number | null) {
  if (confidenceScore === null) return 'Needs verification';
  if (confidenceScore >= 80) return 'High confidence';
  if (confidenceScore >= 60) return 'Verified';
  return 'Needs verification';
}

export function getSourceLabel(sourceType: VerificationSourceType | null) {
  return sourceType ? sourceLabelMap[sourceType] : 'No reliable evidence yet';
}

export function getVerifiedAtLabel(verifiedAt: string | null) {
  const checkedLabel = humanizeCheckedDate(verifiedAt);
  return checkedLabel === 'Unknown' ? checkedLabel : checkedLabel[0].toUpperCase() + checkedLabel.slice(1);
}

export function getTrustSummary(rules: Pick<PlacePetRules, 'dogPolicyStatus' | 'verificationSourceType' | 'verifiedAt'>) {
  if (rules.dogPolicyStatus === 'unknown') {
    return 'No reliable evidence yet';
  }

  return `${getSourceLabel(rules.verificationSourceType)} · ${humanizeCheckedDate(rules.verifiedAt)}`;
}

export function getVerdictSentence(rules: PlacePetRules) {
  switch (rules.dogPolicyStatus) {
    case 'allowed':
      if (rules.outdoorAllowed && rules.leashRequired === false) return 'Dogs are allowed in the signed outdoor area.';
      if (rules.indoorAllowed) return 'Dogs are allowed here.';
      return 'Dogs are allowed here.';
    case 'restricted':
      if (rules.outdoorAllowed && rules.indoorAllowed === false) return 'Dogs are allowed with restrictions, including outdoor-only access.';
      return 'Dogs are allowed with restrictions.';
    case 'not_allowed':
      if (rules.serviceDogOnly) return 'Dogs are not allowed here, except service dogs.';
      return 'Dogs are not allowed here.';
    case 'unknown':
    default:
      return 'PawMap does not have a trustworthy public answer yet.';
  }
}

export function getRuleBullets(rules: PlacePetRules) {
  if (rules.dogPolicyStatus === 'unknown') return [];

  const bullets: string[] = [];

  if (rules.indoorAllowed !== null) {
    bullets.push(`Indoor seating: ${rules.indoorAllowed ? 'yes' : 'no'}`);
  }

  if (rules.outdoorAllowed !== null) {
    bullets.push(`Outdoor area: ${rules.outdoorAllowed ? 'yes' : 'no'}`);
  }

  if (rules.leashRequired !== null) {
    bullets.push(`Leash required: ${rules.leashRequired ? 'yes' : 'no'}`);
  }

  if (rules.serviceDogOnly) {
    bullets.push('Service dogs only');
  }

  if (rules.sizeRestriction) {
    bullets.push(`Size restriction: ${rules.sizeRestriction}`);
  }

  if (rules.breedRestriction) {
    bullets.push(`Breed restriction: ${rules.breedRestriction}`);
  }

  return bullets.slice(0, 4);
}

export function getResultSummary(place: Pick<PlaceSummary, 'dogPolicyStatus'> & { petRules?: PlacePetRules | null; summary?: string }) {
  const rules = place.petRules;

  if (!rules) {
    if (place.dogPolicyStatus === 'unknown') return 'No trustworthy public policy published yet';
    return place.summary ?? 'Dog policy available';
  }

  if (rules.dogPolicyStatus === 'unknown') {
    return 'No trustworthy public policy published yet';
  }

  if (rules.dogPolicyStatus === 'not_allowed') {
    return rules.serviceDogOnly ? 'Dogs not allowed inside venue · service dogs excepted' : 'Dogs not allowed inside venue';
  }

  const parts: string[] = [];

  if (rules.outdoorAllowed && rules.indoorAllowed === false) {
    parts.push('Courtyard only');
  } else if (rules.outdoorAllowed && rules.leashRequired === false) {
    parts.push('Off-leash area available');
  } else if (rules.indoorAllowed) {
    parts.push('Indoor access available');
  }

  if (rules.leashRequired) {
    parts.push('leash required');
  }

  return parts.slice(0, 2).join(' · ') || place.summary || 'Dog policy available';
}

export function formatRuleValue(value: boolean | string | null, options?: { nullLabel?: string }) {
  if (value === null) return options?.nullLabel ?? 'Unknown';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value;
}

export function toSummaryFromDetail(place: PlaceDetail, distanceLabel = 'Sample result') {
  return {
    placeId: place.placeId,
    placeSlug: place.placeSlug,
    name: place.name,
    formattedAddress: place.formattedAddress,
    category: place.category,
    distanceLabel,
    dogPolicyStatus: place.petRules.dogPolicyStatus,
    confidenceScore: place.petRules.confidenceScore,
    verifiedAt: place.petRules.verifiedAt,
    summary: getResultSummary({ dogPolicyStatus: place.petRules.dogPolicyStatus, petRules: place.petRules }),
  } satisfies PlaceSummary;
}
