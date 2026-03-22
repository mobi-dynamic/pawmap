import { NextResponse } from 'next/server';

import { ApiError } from '@/lib/api/client';
import { submitUserReport } from '@/lib/report-submission-repository';
import { UserReportSubmission } from '@/lib/types';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function coerceNullableBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<UserReportSubmission>;
    const payload: UserReportSubmission = {
      placeId: normalizeText(body.placeId),
      proposedDogPolicyStatus: body.proposedDogPolicyStatus ?? null,
      proposedIndoorAllowed: coerceNullableBoolean(body.proposedIndoorAllowed),
      proposedOutdoorAllowed: coerceNullableBoolean(body.proposedOutdoorAllowed),
      proposedLeashRequired: coerceNullableBoolean(body.proposedLeashRequired),
      proposedSizeRestriction: normalizeText(body.proposedSizeRestriction) || null,
      proposedBreedRestriction: normalizeText(body.proposedBreedRestriction) || null,
      proposedServiceDogOnly: coerceNullableBoolean(body.proposedServiceDogOnly),
      proposedNotes: normalizeText(body.proposedNotes) || null,
      evidenceUrl: normalizeText(body.evidenceUrl) || null,
      reporterComment: normalizeText(body.reporterComment) || null,
    };

    if (!payload.placeId) {
      return NextResponse.json({ error: 'Place ID is required.', code: 'INVALID_PLACE_ID' }, { status: 400 });
    }

    const hasSignal = Object.entries(payload).some(([key, value]) => key !== 'placeId' && value !== null && String(value).trim() !== '');
    if (!hasSignal) {
      return NextResponse.json(
        { error: 'Add at least one policy change, note, evidence link, or comment before submitting.', code: 'EMPTY_REPORT' },
        { status: 400 },
      );
    }

    if (payload.evidenceUrl) {
      try {
        new URL(payload.evidenceUrl);
      } catch {
        return NextResponse.json({ error: 'Evidence link must be a valid URL.', code: 'INVALID_EVIDENCE_URL' }, { status: 400 });
      }
    }

    const result = await submitUserReport(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status || 500 });
    }

    return NextResponse.json({ error: 'Report submission failed.' }, { status: 500 });
  }
}
