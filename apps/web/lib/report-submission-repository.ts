import { apiPost, getDevUserHeaders } from '@/lib/api/client';
import { ReportSubmissionResult, UserReportSubmission } from '@/lib/types';

export function sanitizeUserReportSubmission(input: UserReportSubmission): UserReportSubmission {
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

export async function submitUserReport(input: UserReportSubmission) {
  const payload = sanitizeUserReportSubmission(input);
  return apiPost<ReportSubmissionResult>('/reports', payload, {
    headers: getDevUserHeaders(),
  });
}
