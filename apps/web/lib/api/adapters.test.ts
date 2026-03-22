import { describe, expect, it } from 'vitest';

import { adaptPlaceDetail, adaptSearchItem } from '@/lib/api/adapters';

describe('api adapters', () => {
  it('preserves coordinates on search results for map rendering', () => {
    expect(
      adaptSearchItem({
        id: 'plc_123',
        googlePlaceId: 'g-123',
        name: 'Royal Bark Cafe',
        formattedAddress: '1 Smith St, Fitzroy',
        lat: -37.8,
        lng: 144.9,
        category: 'dog_friendly_cafe',
        dogPolicyStatus: 'restricted',
        confidenceScore: 82,
        verifiedAt: '2026-03-14T02:00:00Z',
      }),
    ).toMatchObject({
      placeSlug: 'royal-bark-cafe--plc_123',
      lat: -37.8,
      lng: 144.9,
      category: 'Dog Friendly Cafe',
    });
  });

  it('prefers top-level final-contract fields when adapting place detail', () => {
    const result = adaptPlaceDetail({
      id: 'plc_123',
      googlePlaceId: 'g-123',
      name: 'Royal Bark Cafe',
      formattedAddress: '1 Smith St, Fitzroy',
      lat: -37.8,
      lng: 144.9,
      category: 'cafe',
      dogPolicyStatus: 'unknown',
      confidenceScore: null,
      verifiedAt: null,
      websiteUrl: 'https://example.com',
      petRules: {
        dogPolicyStatus: 'restricted',
        indoorAllowed: false,
        outdoorAllowed: true,
        leashRequired: true,
        sizeRestriction: null,
        breedRestriction: null,
        serviceDogOnly: false,
        notes: 'Courtyard only.',
        confidenceScore: 72,
        verificationSourceType: 'direct_contact',
        verificationSourceUrl: null,
        verifiedAt: '2026-03-14T02:00:00Z',
      },
    });

    expect(result).toMatchObject({
      placeSlug: 'royal-bark-cafe--plc_123',
      lat: -37.8,
      lng: 144.9,
      petRules: {
        dogPolicyStatus: 'unknown',
        confidenceScore: null,
        verifiedAt: null,
        notes: 'Courtyard only.',
      },
    });
  });
});
