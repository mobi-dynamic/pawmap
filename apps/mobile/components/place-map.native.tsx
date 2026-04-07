import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import type { PlaceSummary } from '@/lib/types';

const DEFAULT_REGION: Region = {
  latitude: -37.8136,
  longitude: 144.9631,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

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
  const mapRef = useRef<MapView | null>(null);
  const selectedPlace = useMemo(
    () => results.find((place) => place.id === selectedPlaceId) ?? results[0] ?? null,
    [results, selectedPlaceId],
  );

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (results.length === 0) {
      mapRef.current.animateToRegion(DEFAULT_REGION, 300);
      return;
    }

    mapRef.current.fitToCoordinates(
      results.map((place) => ({ latitude: place.lat, longitude: place.lng })),
      {
        animated: true,
        edgePadding: { top: 72, right: 32, bottom: 72, left: 32 },
      },
    );
  }, [results]);

  return (
    <View style={[styles.heroMap, { minHeight: heroHeight }]}>
      <MapView
        initialRegion={DEFAULT_REGION}
        onMapReady={onMapReady}
        ref={mapRef}
        rotateEnabled={false}
        showsCompass={false}
        showsIndoorLevelPicker={false}
        showsPointsOfInterest={false}
        style={styles.mapSurface}
      >
        {results.map((place) => {
          const isSelected = place.id === selectedPlace?.id;

          return (
            <Marker
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              key={place.id}
              onPress={() => onSelectPlace(place)}
              tracksViewChanges={false}
            >
              <View style={[styles.mapMarker, isSelected ? styles.mapMarkerSelected : null]}>
                <Text style={styles.mapMarkerEmoji}>{statusEmoji(place.dogPolicyStatus)}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {isLoading ? <View pointerEvents="none" style={styles.mapLoadingVeil} /> : null}

      {isLoading ? (
        <View pointerEvents="none" style={styles.mapMessageOverlay}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.mapMessageTitle}>Loading map</Text>
        </View>
      ) : null}

      {!isLoading && results.length === 0 ? (
        <View pointerEvents="none" style={styles.mapMessageOverlay}>
          <Text style={styles.mapMessageTitle}>No search results at the moment</Text>
          <Text style={styles.mapMessageText}>Try a broader suburb, a nearby landmark, or a simpler query.</Text>
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
    ...StyleSheet.absoluteFillObject,
  },
  mapMarker: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    width: 44,
  },
  mapMarkerSelected: {
    borderColor: '#2563EB',
    transform: [{ scale: 1.12 }],
  },
  mapMarkerEmoji: {
    fontSize: 17,
  },
  mapLoadingVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.22)',
    zIndex: 1,
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
});
