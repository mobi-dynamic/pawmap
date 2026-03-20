import { adaptPlaceDetail } from '@/lib/api/adapters';
import { apiGet, apiPost, getDevAdminHeaders } from '@/lib/api/client';
import { AdminReport, DogPolicyStatus, ModerationActionResult, ReportStatus, VerificationSourceType } from '@/lib/types';

type ApiAdminReport = {
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
};

type ApiPlaceDetail = {
  id: string;
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  category: string;
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
    confidenceScore: number | null;
    verificationSourceType: VerificationSourceType | null;
    verificationSourceUrl: string | null;
    verifiedAt: string | null;
  };
};

type AdminReportsResponse = {
  items: ApiAdminReport[];
  nextCursor: string | null;
};

async function enrichAdminReport(report: ApiAdminReport): Promise<AdminReport> {
  let place: AdminReport['place'] = null;

  try {
    const detail = adaptPlaceDetail(await apiGet<ApiPlaceDetail>(`/places/${encodeURIComponent(report.placeId)}`));
    place = {
      placeId: detail.placeId,
      placeSlug: detail.placeSlug,
      name: detail.name,
      formattedAddress: detail.formattedAddress,
      category: detail.category,
    };
  } catch {
    // Keep the moderation queue usable even if place context cannot be loaded.
  }

  return {
    id: report.id,
    placeId: report.placeId,
    status: report.status,
    reporterUserId: report.reporterUserId,
    proposedDogPolicyStatus: report.proposedDogPolicyStatus,
    proposedIndoorAllowed: report.proposedIndoorAllowed,
    proposedOutdoorAllowed: report.proposedOutdoorAllowed,
    proposedLeashRequired: report.proposedLeashRequired,
    proposedSizeRestriction: report.proposedSizeRestriction,
    proposedBreedRestriction: report.proposedBreedRestriction,
    proposedServiceDogOnly: report.proposedServiceDogOnly,
    proposedNotes: report.proposedNotes,
    evidenceUrl: report.evidenceUrl,
    reporterComment: report.reporterComment,
    reviewNotes: report.reviewNotes,
    reviewedByUserId: report.reviewedByUserId,
    createdAt: report.createdAt,
    reviewedAt: report.reviewedAt,
    place,
  };
}

export async function listAdminReports(options?: { status?: ReportStatus; limit?: number }) {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.limit) params.set('limit', String(options.limit));

  const response = await apiGet<AdminReportsResponse>(`/admin/reports${params.size ? `?${params.toString()}` : ''}`, {
    headers: getDevAdminHeaders(),
  });

  return {
    items: await Promise.all(response.items.map(enrichAdminReport)),
    nextCursor: response.nextCursor,
  };
}

export async function approveAdminReport(reportId: string) {
  return apiPost<ModerationActionResult>(`/admin/reports/${encodeURIComponent(reportId)}/approve`, undefined, {
    headers: getDevAdminHeaders(),
  });
}

export async function rejectAdminReport(reportId: string, reviewNotes: string) {
  return apiPost<ModerationActionResult>(`/admin/reports/${encodeURIComponent(reportId)}/reject`, { reviewNotes }, {
    headers: getDevAdminHeaders(),
  });
}
