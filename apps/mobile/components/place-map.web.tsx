import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/status-pill';
import { TrustPill } from '@/components/trust-pill';
import { getTrustLevel, getTrustShortNote } from '@/lib/policy-presentations';
import type { PlaceSummary } from '@/lib/types';

export function PlaceMap({
  results,
  selectedPlaceId,
  isLoading,
  onSelectPlace,
  onMapReady,
  heroHeight,
}: {
  results: PlaceSummary[];
  selectedPlaceId: string | null;
  isLoading: boolean;
  onSelectPlace: (place: PlaceSummary) => void;
  onMapReady?: () => void;
  heroHeight: number;
}) {
  const selectedPlace = results.find((place) => place.id === selectedPlaceId) ?? results[0] ?? null;

  return (
    <View style={[styles.heroMap, { minHeight: heroHeight }]}>
      <View style={styles.mapSurface}>
        <View style={styles.webPanel}>
          <Text style={styles.webPanelTitle}>Expo Web preview</Text>
          <Text style={styles.webPanelText}>
            The browser build uses the same API and place details, with a lightweight web map preview instead of native maps.
          </Text>

          <View style={styles.webMarkerRail}>
            {results.slice(0, 6).map((place) => {
              const isSelected = place.id === selectedPlace?.id;

              return (
                <Pressable
                  key={place.id}
                  onPress={() => onSelectPlace(place)}
                  style={[styles.webMarkerChip, isSelected ? styles.webMarkerChipSelected : null]}
                >
                  <Text style={styles.webMarkerEmoji}>{statusEmoji(place.dogPolicyStatus)}</Text>
                  <Text numberOfLines={1} style={styles.webMarkerLabel}>
                    {place.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {isLoading ? (
        <View pointerEvents="none" style={styles.mapMessageOverlay}>
          <Text style={styles.mapMessageTitle}>Loading map</Text>
          <Text style={styles.mapMessageText}>Fetching search results…</Text>
        </View>
      ) : null}

      {!isLoading && results.length === 0 ? (
        <View pointerEvents="none" style={styles.mapMessageOverlay}>
          <Text style={styles.mapMessageTitle}>No search results at the moment</Text>
          <Text style={styles.mapMessageText}>Try a broader suburb, a nearby landmark, or a simpler query.</Text>
        </View>
      ) : null}

      {selectedPlace ? (
        <View style={styles.webLegend}>
          <View style={styles.webLegendHeader}>
            <StatusPill status={selectedPlace.dogPolicyStatus} />
            <TrustPill level={getTrustLevel(selectedPlace)} />
          </View>
          <Text style={styles.webLegendName}>{selectedPlace.name}</Text>
          <Text style={styles.webLegendText}>{selectedPlace.formattedAddress}</Text>
          <Text style={styles.webLegendNote}>{getTrustShortNote(getTrustLevel(selectedPlace))}</Text>
        </View>
      ) : null}
    </View>
  );
}

function statusEmoji(status: PlaceSummary['dogPolicyStatus']) {
  switch (status) {
    case 'allowed':
      return '🐶';
    case 'restricted':
      return '🦮';
    case 'not_allowed':
      return '🚫';
    case 'unknown':
    default:
      return '❓';
  }
}

const styles = StyleSheet.create({
  heroMap: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mapSurface: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    padding: 16,
  },
  webPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 14,
    padding: 16,
  },
  webPanelTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  webPanelText: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  webMarkerRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  webMarkerChip: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#D1D5DB',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  webMarkerChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  webMarkerEmoji: {
    fontSize: 16,
  },
  webMarkerLabel: {
    color: '#111827',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 180,
  },
  mapMessageOverlay: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 22,
    gap: 8,
    maxWidth: 280,
    paddingHorizontal: 20,
    paddingVertical: 18,
    position: 'absolute',
    top: '38%',
    zIndex: 2,
  },
  mapMessageTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  mapMessageText: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  webLegend: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    gap: 8,
    padding: 16,
  },
  webLegendHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  webLegendName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  webLegendText: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  webLegendNote: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
});
