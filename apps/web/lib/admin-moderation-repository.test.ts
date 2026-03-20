import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { approveAdminReport, listAdminReports, rejectAdminReport } from '@/lib/admin-moderation-repository';

describe('admin-moderation-repository', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.PAWMAP_API_BASE_URL = 'http://127.0.0.1:8000';
    process.env.PAWMAP_DEV_ADMIN_USER_ID = '11111111-1111-4111-8111-111111111111';
    process.env.PAWMAP_DEV_ADMIN_ROLE = 'moderator';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('lists admin reports with moderator headers and enriches place context', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.endsWith('/admin/reports?status=pending&limit=10')) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: 'rpt_0001',
                placeId: 'plc_123',
                status: 'pending',
                reporterUserId: 'reporter-1',
                proposedDogPolicyStatus: 'restricted',
                proposedIndoorAllowed: false,
                proposedOutdoorAllowed: true,
                proposedLeashRequired: true,
                proposedSizeRestriction: null,
                proposedBreedRestriction: null,
                proposedServiceDogOnly: false,
                proposedNotes: 'Courtyard seating only.',
                evidenceUrl: 'https://example.com/policy',
                reporterComment: 'Staff pointed to the sign at the entrance.',
                reviewNotes: null,
                reviewedByUserId: null,
                createdAt: '2026-03-15T02:00:00Z',
                reviewedAt: null
              }
            ],
            nextCursor: null
          }),
          { status: 200 },
        );
      }

      if (url.endsWith('/places/plc_123')) {
        return new Response(
          JSON.stringify({
            id: 'plc_123',
            googlePlaceId: 'g-123',
            name: 'Royal Bark Cafe',
            formattedAddress: '1 Smith St, Fitzroy',
            lat: -37.8,
            lng: 144.9,
            category: 'cafe',
            petRules: {
              dogPolicyStatus: 'restricted',
              indoorAllowed: false,
              outdoorAllowed: true,
              leashRequired: true,
              sizeRestriction: null,
              breedRestriction: null,
              serviceDogOnly: false,
              notes: 'Courtyard seating only.',
              confidenceScore: 72,
              verificationSourceType: 'direct_contact',
              verificationSourceUrl: null,
              verifiedAt: '2026-03-14T02:00:00Z'
            }
          }),
          { status: 200 },
        );
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await listAdminReports({ status: 'pending', limit: 10 });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:8000/admin/reports?status=pending&limit=10',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-User-Id': '11111111-1111-4111-8111-111111111111',
          'X-Role': 'moderator',
        }),
      }),
    );
    expect(result.items[0]).toMatchObject({
      id: 'rpt_0001',
      place: expect.objectContaining({
        name: 'Royal Bark Cafe',
        placeSlug: 'royal-bark-cafe--plc_123',
        category: 'Cafe',
      }),
    });
  });

  it('approves a report through the admin endpoint with dev auth headers', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'rpt_0001',
          status: 'approved',
          reviewedAt: '2026-03-15T03:00:00Z',
          reviewedByUserId: '11111111-1111-4111-8111-111111111111'
        }),
        { status: 200 },
      ),
    );

    const result = await approveAdminReport('rpt_0001');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/admin/reports/rpt_0001/approve',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Role': 'moderator' }),
      }),
    );
    expect(result.status).toBe('approved');
  });

  it('rejects a report with review notes', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'rpt_0002',
          status: 'rejected',
          reviewedAt: '2026-03-15T03:30:00Z',
          reviewedByUserId: '11111111-1111-4111-8111-111111111111'
        }),
        { status: 200 },
      ),
    );

    const result = await rejectAdminReport('rpt_0002', 'Evidence was outdated.');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/admin/reports/rpt_0002/reject',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ reviewNotes: 'Evidence was outdated.' }),
      }),
    );
    expect(result.status).toBe('rejected');
  });
});
