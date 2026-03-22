import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusPill } from '@/components/status-pill';
import { searchPlaces } from '@/lib/api';
import type { PlaceSummary } from '@/lib/types';

const INITIAL_QUERY = 'dog friendly cafes';
const MAP_HEIGHT = 320;
const MAP_PADDING = 28;
const DEFAULT_REGION = {
  minLat: -37.88,
  maxLat: -37.76,
  minLng: 144.94,
  maxLng: 145.06,
};

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [results, setResults] = useState<PlaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const runSearch = useCallback(async (nextQuery: string) => {
    const trimmedQuery = nextQuery.trim();
    setIsLoading(true);
    setError(null);

    try {
      const items = await searchPlaces(trimmedQuery);
      setResults(items);
      setSelectedPlaceId(items[0]?.id ?? null);
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

  const mapBounds = useMemo(() => {
    if (results.length === 0) {
      return DEFAULT_REGION;
    }

    const latitudes = results.map((place) => place.lat);
    const longitudes = results.map((place) => place.lng);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latPadding = Math.max((maxLat - minLat) * 0.25, 0.01);
    const lngPadding = Math.max((maxLng - minLng) * 0.25, 0.01);

    return {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding,
    };
  }, [results]);

  const selectedPlace = useMemo(
    () => results.find((place) => place.id === selectedPlaceId) ?? results[0] ?? null,
    [results, selectedPlaceId],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Find dog-friendly places</Text>
          <Text style={styles.subtitle}>Search first, then browse the map and shortlist below.</Text>
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
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <View style={styles.mapHeaderCopy}>
              <Text style={styles.mapTitle}>Map preview</Text>
              <Text style={styles.mapCaption}>
                Tap pins to focus a place. This preview does not pan or zoom yet.
              </Text>
            </View>
            <View style={styles.resultsBadge}>
              <Text style={styles.resultsBadgeText}>{results.length} spots</Text>
            </View>
          </View>

          <View style={styles.mapCanvas}>
            <View style={styles.mapGlowTop} />
            <View style={styles.mapGlowBottom} />
            <View style={styles.mapGridVertical} />
            <View style={styles.mapGridHorizontal} />
            <View style={styles.mapWatermark}>
              <Text style={styles.mapWatermarkText}>Static preview</Text>
            </View>

            <View pointerEvents="none" style={styles.mapHintBadge}>
              <Text style={styles.mapHintBadgeText}>Tap pins · No drag / zoom yet</Text>
            </View>

            {results.map((place) => {
              const left = positionFromRange(place.lng, mapBounds.minLng, mapBounds.maxLng);
              const top = positionFromRange(place.lat, mapBounds.minLat, mapBounds.maxLat);
              const isSelected = place.id === selectedPlace?.id;

              return (
                <Pressable
                  accessibilityHint="Selects this place below"
                  accessibilityLabel={`Select ${place.name} from map preview`}
                  hitSlop={10}
                  key={place.id}
                  onPress={() => setSelectedPlaceId(place.id)}
                  style={[
                    styles.mapMarker,
                    {
                      left: `${MAP_PADDING + left * (100 - MAP_PADDING * 2)}%`,
                      top: `${MAP_PADDING + (1 - top) * (100 - MAP_PADDING * 2)}%`,
                    },
                    isSelected ? styles.mapMarkerSelected : null,
                  ]}
                >
                  <Text style={styles.mapMarkerEmoji}>{statusEmoji(place.dogPolicyStatus)}</Text>
                </Pressable>
              );
            })}

            {isLoading ? (
              <View style={styles.mapMessageOverlay}>
                <ActivityIndicator color="#2563EB" />
                <Text style={styles.mapMessageText}>Refreshing places…</Text>
              </View>
            ) : null}

            {!isLoading && !error && results.length === 0 ? (
              <View style={styles.mapMessageOverlay}>
                <Text style={styles.mapMessageTitle}>No places found</Text>
                <Text style={styles.mapMessageText}>Try a broader suburb or category.</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.mapMessageOverlay}>
                <Text style={styles.mapMessageTitle}>Search failed</Text>
                <Text style={styles.mapMessageText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {selectedPlace ? (
            <Pressable
              accessibilityHint="Opens the place detail screen"
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/place/[id]', params: { id: selectedPlace.id } })}
              style={styles.selectedPlaceCard}
            >
              <View style={styles.selectedPlaceHeader}>
                <StatusPill status={selectedPlace.dogPolicyStatus} />
                <Text style={styles.selectedPlaceCategory}>{selectedPlace.category}</Text>
              </View>
              <Text style={styles.selectedPlaceName}>{selectedPlace.name}</Text>
              <Text style={styles.selectedPlaceAddress}>{selectedPlace.formattedAddress}</Text>
              <Text style={styles.selectedPlaceMeta}>{selectedPlace.summary}</Text>
              <View style={styles.selectedPlaceActionRow}>
                <Text style={styles.selectedPlaceActionLabel}>View place details</Text>
                <Text style={styles.selectedPlaceActionIcon}>→</Text>
              </View>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>Results list</Text>
              <Text style={styles.sheetTitle}>Pick a place to preview</Text>
              <Text style={styles.sheetSubtitle}>Pins and cards both select. Open details from the highlighted place.</Text>
            </View>
          </View>

          <FlatList
            contentContainerStyle={styles.resultsList}
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item.id === selectedPlace?.id;

              return (
                <Pressable
                  accessibilityHint={isSelected ? 'Selected place. Open details from the preview card above.' : 'Selects this place in the preview above.'}
                  accessibilityLabel={`Select ${item.name}`}
                  onPress={() => setSelectedPlaceId(item.id)}
                  style={[styles.placeCard, isSelected ? styles.placeCardSelected : null]}
                >
                  <View style={styles.placeCardHeader}>
                    <StatusPill status={item.dogPolicyStatus} />
                    <Text style={styles.placeCategory}>{item.category}</Text>
                  </View>
                  <Text style={styles.placeName}>{item.name}</Text>
                  <Text style={styles.placeMeta}>{item.formattedAddress}</Text>
                  <Text style={styles.placeSummary}>{item.summary}</Text>
                  <Text style={styles.placeCardAction}>
                    {isSelected ? 'Selected above — tap the preview card for details' : 'Tap to preview'}
                  </Text>
                </Pressable>
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function positionFromRange(value: number, min: number, max: number) {
  if (Number.isNaN(value) || max <= min) {
    return 0.5;
  }

  return Math.min(1, Math.max(0, (value - min) / (max - min)));
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
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topBar: {
    gap: 10,
    paddingTop: 6,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 22,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    color: '#111827',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 16,
    justifyContent: 'center',
    minWidth: 92,
    paddingHorizontal: 18,
  },
  searchButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    gap: 14,
    padding: 16,
  },
  mapHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  mapHeaderCopy: {
    flex: 1,
  },
  mapTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  mapCaption: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
  },
  resultsBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resultsBadgeText: {
    color: '#3730A3',
    fontSize: 13,
    fontWeight: '700',
  },
  mapCanvas: {
    backgroundColor: '#DCFCE7',
    borderRadius: 24,
    height: MAP_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  mapGlowTop: {
    backgroundColor: '#BFDBFE',
    borderRadius: 999,
    height: 140,
    opacity: 0.45,
    position: 'absolute',
    right: -20,
    top: -24,
    width: 140,
  },
  mapGlowBottom: {
    backgroundColor: '#BBF7D0',
    borderRadius: 999,
    bottom: -30,
    height: 180,
    left: -20,
    opacity: 0.65,
    position: 'absolute',
    width: 180,
  },
  mapGridVertical: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(255,255,255,0.45)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    left: '33%',
    right: '33%',
  },
  mapGridHorizontal: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(255,255,255,0.45)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    bottom: '33%',
    top: '33%',
  },
  mapWatermark: {
    left: 16,
    position: 'absolute',
    top: 16,
  },
  mapWatermarkText: {
    color: 'rgba(17,24,39,0.45)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  mapHintBadge: {
    backgroundColor: 'rgba(17,24,39,0.72)',
    borderRadius: 999,
    bottom: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute',
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
    height: 40,
    justifyContent: 'center',
    marginLeft: -20,
    marginTop: -20,
    position: 'absolute',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    width: 40,
  },
  mapMarkerSelected: {
    borderColor: '#2563EB',
    transform: [{ scale: 1.08 }],
  },
  mapMarkerEmoji: {
    fontSize: 16,
  },
  mapMessageOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 20,
    gap: 8,
    left: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    position: 'absolute',
    right: 20,
    top: 110,
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
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  selectedPlaceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  selectedPlaceCategory: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedPlaceName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  selectedPlaceAddress: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  selectedPlaceMeta: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  selectedPlaceActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
  },
  selectedPlaceActionLabel: {
    color: '#1D4ED8',
    fontSize: 15,
    fontWeight: '700',
  },
  selectedPlaceActionIcon: {
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '700',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  sheetHeader: {
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
    marginBottom: 12,
    paddingTop: 12,
  },
  sheetEyebrow: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sheetTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  sheetSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
  },
  resultsList: {
    gap: 12,
    paddingBottom: 12,
  },
  placeCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    minHeight: 124,
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
