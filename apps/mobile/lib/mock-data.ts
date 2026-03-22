import type { PlaceSummary } from '@/lib/types';

export const samplePlaces: PlaceSummary[] = [
  {
    id: 'plc_demo_royal-park-cafe',
    name: 'Royal Park Cafe',
    formattedAddress: 'Parkville VIC',
    category: 'cafe',
    dogPolicyStatus: 'restricted',
    summary: 'Dogs seem allowed in the outdoor seating zone only.',
  },
  {
    id: 'plc_demo_bayside-brew',
    name: 'Bayside Brew',
    formattedAddress: 'St Kilda VIC',
    category: 'cafe',
    dogPolicyStatus: 'allowed',
    summary: 'Strong early signal for a dog-friendly stop near the beach.',
  },
];
