import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import MapView, { Marker, type MapMarker, type Region } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusPill } from '@/components/status-pill';
import { searchPlaces } from '@/lib/api';
import type { PlaceSummary } from '@/lib/types';

const INITIAL_QUERY = 'dog friendly cafes';
const DEFAULT_REGION: Region = {
  latitude: -37.8136,
  longitude: 144.9631,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const mapRef = useRef<MapView | null>(null);
  const markerRefs = useRef<Record<string, MapMarker | null>>({});
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [results, setResults] = useState<PlaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const runSearch = useCallback(async (nextQuery: string) => {
    const trimmedQuery = nextQuery.trim();
    setIsLoading(true);
    setError(null);

    try {
      const items = await searchPlaces(trimmedQuery);
      setResults(items);
      setSelectedPlaceId((currentSelectedId) => {
        if (currentSelectedId && items.some((item) => item.id === currentSelectedId)) {
          return currentSelectedId;
        }

        return items[0]?.id ?? null;
      });
    } catch (searchError) {
      setResults([]);
      setSelectedPlaceId(null);
      setError(searchError instanceof Error ? searchError.message : 'Search failed.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void runSearch(INITIAL_QUERY);
  }, [runSearch]);

  const selectedPlace = useMemo(
    () => results.find((place) => place.id === selectedPlaceId) ?? results[0] ?? null,
    [results, selectedPlaceId],
  );

  useEffect(() => {
    if (!isMapReady || !mapRef.current) {
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
        edgePadding: { top: 132, right: 44, bottom: 196, left: 44 },
      },
    );
  }, [isMapReady, results]);

  useEffect(() => {
    if (!isMapReady || !selectedPlace || !mapRef.current) {
      return;
    }

    markerRefs.current[selectedPlace.id]?.showCallout();
    mapRef.current.animateCamera(
      {
        center: {
          latitude: selectedPlace.lat,
          longitude: selectedPlace.lng,
        },
        zoom: 14,
      },
      { duration: 300 },
    );
  }, [isMapReady, selectedPlace]);

  const heroHeight = Math.max(windowHeight - insets.top - 120, 560);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroMap, { minHeight: heroHeight }]}>
          <MapView
            initialRegion={DEFAULT_REGION}
            mapPadding={{ top: 132, right: 0, bottom: 196, left: 0 }}
            onMapReady={() => setIsMapReady(true)}
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
                  onPress={() => setSelectedPlaceId(place.id)}
                  ref={(marker) => {
                    markerRefs.current[place.id] = marker;
                  }}
                  tracksViewChanges={false}
                >
                  <View style={[styles.mapMarker, isSelected ? styles.mapMarkerSelected : null]}>
                    <Text style={styles.mapMarkerEmoji}>{statusEmoji(place.dogPolicyStatus)}</Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>

          <View pointerEvents="none" style={styles.mapScrimTop} />
          <View pointerEvents="none" style={styles.mapScrimBottom} />

          <View pointerEvents="box-none" style={styles.mapChrome}>
            <View style={styles.searchRow}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setQuery}
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  void runSearch(query);
                }}
                placeholder="Search cafes, parks, beaches…"
                placeholderTextColor="#6B7280"
                returnKeyType="search"
                style={styles.searchInput}
                value={query}
              />
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  void runSearch(query);
                }}
                style={styles.searchButton}
              >
                <Text style={styles.searchButtonLabel}>{isLoading ? 'Loading…' : 'Search'}</Text>
              </Pressable>
            </View>

            <View style={styles.heroTopRow}>
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsBadgeText}>{results.length} spots</Text>
              </View>
              <View style={styles.mapWatermark}>
                <Text style={styles.mapWatermarkText}>Live map</Text>
              </View>
            </View>
          </View>

          <View pointerEvents="none" style={styles.mapHintBadge}>
            <Text style={styles.mapHintBadgeText}>Tap pins or pan map</Text>
          </View>

          {isLoading ? (
            <View pointerEvents="none" style={styles.mapMessageOverlay}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.mapMessageText}>Refreshing places…</Text>
            </View>
          ) : null}

          {!isLoading && !error && results.length === 0 ? (
            <View pointerEvents="none" style={styles.mapMessageOverlay}>
              <Text style={styles.mapMessageTitle}>No places found</Text>
              <Text style={styles.mapMessageText}>Try a broader suburb or category.</Text>
            </View>
          ) : null}

          {error ? (
            <View pointerEvents="none" style={styles.mapMessageOverlay}>
              <Text style={styles.mapMessageTitle}>Search failed</Text>
              <Text style={styles.mapMessageText}>{error}</Text>
            </View>
          ) : null}

          {selectedPlace ? (
            <Pressable
              accessibilityHint="Opens the place detail screen"
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/place/[id]', params: { id: selectedPlace.id } })}
              style={styles.selectedPlaceCard}
            >
              <View style={styles.selectedPlaceTopRow}>
                <View style={styles.selectedPlaceHeader}>
                  <StatusPill status={selectedPlace.dogPolicyStatus} />
                  <Text numberOfLines={1} style={styles.selectedPlaceCategory}>
                    {selectedPlace.category}
                  </Text>
                </View>
                <Text style={styles.selectedPlaceActionInline}>Details →</Text>
              </View>
              <Text numberOfLines={2} style={styles.selectedPlaceName}>
                {selectedPlace.name}
              </Text>
              <Text numberOfLines={2} style={styles.selectedPlaceAddress}>
                {selectedPlace.formattedAddress}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sheet}>
          <View style={styles.sheetGrabber} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>More results</Text>
              <Text style={styles.sheetTitle}>Keep browsing below the map</Text>
              <Text style={styles.sheetSubtitle}>
                The selected place stays anchored on the map. Tap any result to move the overlay.
              </Text>
            </View>
          </View>

          <View style={styles.resultsList}>
            {results.map((item) => {
              const isSelected = item.id === selectedPlace?.id;

              return (
                <Pressable
                  accessibilityHint={
                    isSelected
                      ? 'Selected place. Open details from the map card above.'
                      : 'Selects this place on the map above.'
                  }
                  accessibilityLabel={`Select ${item.name}`}
                  key={item.id}
                  onPress={() => setSelectedPlaceId(item.id)}
                  style={[styles.placeCard, isSelected ? styles.placeCardSelected : null]}
                >
                  <View style={styles.placeCardHeader}>
                    <StatusPill status={item.dogPolicyStatus} />
                    <Text style={styles.placeCategory}>{item.category}</Text>
                  </View>
                  <Text style={styles.placeName}>{item.name}</Text>
                  <Text numberOfLines={2} style={styles.placeMeta}>
                    {item.formattedAddress}
                  </Text>
                  <Text numberOfLines={2} style={styles.placeSummary}>
                    {item.summary}
                  </Text>
                  <Text style={styles.placeCardAction}>
                    {isSelected ? 'Pinned on map above' : 'Tap to pin on map'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    backgroundColor: '#F3F4F6',
    paddingBottom: 24,
  },
  heroMap: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    position: 'relative',
  },
  mapSurface: {
    ...StyleSheet.absoluteFillObject,
  },
  mapScrimTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 74, 110, 0.06)',
    bottom: '68%',
  },
  mapScrimBottom: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.82)',
    top: '74%',
  },
  mapChrome: {
    gap: 14,
    zIndex: 2,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'rgba(229,231,235,0.9)',
    borderRadius: 18,
    borderWidth: 1,
    color: '#111827',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 18,
    justifyContent: 'center',
    minWidth: 96,
    paddingHorizontal: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  searchButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultsBadge: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  resultsBadgeText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '700',
  },
  mapWatermark: {
    backgroundColor: 'rgba(17,24,39,0.62)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapWatermarkText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  mapHintBadge: {
    backgroundColor: 'rgba(17,24,39,0.72)',
    borderRadius: 999,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute',
    top: 126,
    zIndex: 2,
  },
  mapHintBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  selectedPlaceCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 24,
    borderWidth: 1,
    bottom: 24,
    gap: 8,
    left: 16,
    padding: 16,
    position: 'absolute',
    right: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    zIndex: 2,
  },
  selectedPlaceTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  selectedPlaceHeader: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  selectedPlaceCategory: {
    color: '#6B7280',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  selectedPlaceName: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  selectedPlaceAddress: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  selectedPlaceActionInline: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '700',
  },
  sheet: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sheetGrabber: {
    alignSelf: 'center',
    backgroundColor: '#CBD5E1',
    borderRadius: 999,
    height: 5,
    marginBottom: 14,
    width: 48,
  },
  sheetHeader: {
    marginBottom: 14,
  },
  sheetEyebrow: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sheetTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  sheetSubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  resultsList: {
    gap: 10,
    paddingBottom: 12,
  },
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    gap: 7,
    minHeight: 116,
    padding: 14,
  },
  placeCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  placeCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  placeCategory: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  placeName: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  placeMeta: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  placeSummary: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  placeCardAction: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
});
