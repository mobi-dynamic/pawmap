import type { PlaceSummary } from '@/lib/types';

export const samplePlaces: PlaceSummary[] = [
  {
    id: 'plc_demo_royal-park-cafe',
    googlePlaceId: 'ChIJ-demo-royal-park-cafe',
    name: 'Royal Park Cafe',
    formattedAddress: 'Parkville VIC',
    lat: -37.7878,
    lng: 144.9513,
    category: 'Cafe',
    dogPolicyStatus: 'restricted',
    confidenceScore: 68,
    verifiedAt: '2026-03-10T09:00:00Z',
    policyTrustLevel: 'verified',
    summary: 'Dogs seem allowed in the outdoor seating zone only.',
  },
  {
    id: 'plc_demo_bayside-brew',
    googlePlaceId: 'ChIJ-demo-bayside-brew',
    name: 'Bayside Brew',
    formattedAddress: 'St Kilda VIC',
    lat: -37.8676,
    lng: 144.979,
    category: 'Cafe',
    dogPolicyStatus: 'allowed',
    confidenceScore: 74,
    verifiedAt: '2026-03-09T09:00:00Z',
    policyTrustLevel: 'inferred',
    summary: 'Strong early signal for a dog-friendly stop near the beach.',
  },
];
