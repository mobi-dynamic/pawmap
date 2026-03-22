import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sanitizeUserReportSubmission, submitUserReport } from '@/lib/report-submission-repository';

describe('report-submission-repository', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.PAWMAP_API_BASE_URL = 'http://127.0.0.1:8000';
    process.env.PAWMAP_DEV_USER_ID = '6d2d3fba-8f38-4b18-bd43-5a1d85fce112';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('sanitizes optional text fields before submission', () => {
    expect(
      sanitizeUserReportSubmission({
        placeId: 'plc_123',
        proposedDogPolicyStatus: 'restricted',
        proposedIndoorAllowed: false,
        proposedOutdoorAllowed: true,
        proposedLeashRequired: true,
        proposedSizeRestriction: '  small dogs only  ',
        proposedBreedRestriction: '   ',
        proposedServiceDogOnly: false,
        proposedNotes: '  Courtyard only.  ',
        evidenceUrl: '  https://example.com/rules  ',
        reporterComment: '  Staff confirmed this today.  ',
      }),
    ).toEqual({
      placeId: 'plc_123',
      proposedDogPolicyStatus: 'restricted',
      proposedIndoorAllowed: false,
      proposedOutdoorAllowed: true,
      proposedLeashRequired: true,
      proposedSizeRestriction: 'small dogs only',
      proposedBreedRestriction: null,
      proposedServiceDogOnly: false,
      proposedNotes: 'Courtyard only.',
      evidenceUrl: 'https://example.com/rules',
      reporterComment: 'Staff confirmed this today.',
    });
  });

  it('submits a user report with the local dev auth header', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'rpt_0003',
          placeId: 'plc_123',
          status: 'pending',
          reporterUserId: '6d2d3fba-8f38-4b18-bd43-5a1d85fce112',
          createdAt: '2026-03-20T07:30:00Z',
        }),
        { status: 201 },
      ),
    );

    const result = await submitUserReport({
      placeId: 'plc_123',
      proposedDogPolicyStatus: 'allowed',
      proposedIndoorAllowed: true,
      proposedOutdoorAllowed: true,
      proposedLeashRequired: false,
      proposedSizeRestriction: null,
      proposedBreedRestriction: null,
      proposedServiceDogOnly: false,
      proposedNotes: 'Dogs were inside during lunch service.',
      evidenceUrl: 'https://example.com/reel',
      reporterComment: 'Checked with the staff member at the counter.',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/reports',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-User-Id': '6d2d3fba-8f38-4b18-bd43-5a1d85fce112',
        }),
        body: JSON.stringify({
          placeId: 'plc_123',
          proposedDogPolicyStatus: 'allowed',
          proposedIndoorAllowed: true,
          proposedOutdoorAllowed: true,
          proposedLeashRequired: false,
          proposedSizeRestriction: null,
          proposedBreedRestriction: null,
          proposedServiceDogOnly: false,
          proposedNotes: 'Dogs were inside during lunch service.',
          evidenceUrl: 'https://example.com/reel',
          reporterComment: 'Checked with the staff member at the counter.',
        }),
      }),
    );
    expect(result.status).toBe('pending');
  });
});
