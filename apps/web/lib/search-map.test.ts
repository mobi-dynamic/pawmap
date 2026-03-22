import { describe, expect, it } from 'vitest';

import { placeDetailsById } from '@/lib/mock-data';
import { buildSearchMapPoints } from '@/lib/search-map';
import { toSummaryFromDetail } from '@/lib/view-models';

describe('buildSearchMapPoints', () => {
  it('uses real coordinates to spread pins across the map', () => {
    const results = [
      toSummaryFromDetail(placeDetailsById['plc_royal-bark']),
      toSummaryFromDetail(placeDetailsById['plc_pawsome-park']),
      toSummaryFromDetail(placeDetailsById['plc_market-hall']),
    ];

    const points = buildSearchMapPoints(results);

    expect(points).toHaveLength(3);
    expect(points.map((point) => point.place.placeId)).toEqual(['plc_royal-bark', 'plc_pawsome-park', 'plc_market-hall']);
    expect(new Set(points.map((point) => `${point.top}:${point.left}`)).size).toBe(3);
    expect(points.every((point) => point.top >= 14 && point.top <= 84)).toBe(true);
    expect(points.every((point) => point.left >= 14 && point.left <= 86)).toBe(true);
  });

  it('falls back to stable demo placement when coordinates collapse to one point', () => {
    const [first] = buildSearchMapPoints([
      {
        ...toSummaryFromDetail(placeDetailsById['plc_royal-bark']),
        placeId: 'same-1',
        placeSlug: 'same-1',
        lat: -37.8,
        lng: 144.9,
      },
      {
        ...toSummaryFromDetail(placeDetailsById['plc_pawsome-park']),
        placeId: 'same-2',
        placeSlug: 'same-2',
        lat: -37.8,
        lng: 144.9,
      },
    ]);

    expect(first.top).toBe(22);
    expect(first.left).toBe(24);
  });
});
