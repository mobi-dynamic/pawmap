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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusPill } from '@/components/status-pill';
import { PlaceMap } from '@/components/place-map';
import { TrustPill } from '@/components/trust-pill';
import { searchPlaces } from '@/lib/api';
import { getTrustLevel, getTrustShortNote } from '@/lib/policy-presentations';
import type { PlaceSummary } from '@/lib/types';

const INITIAL_QUERY = 'park';

type ViewMode = 'list' | 'map';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [results, setResults] = useState<PlaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState(INITIAL_QUERY);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const runSearch = useCallback(async (nextQuery: string) => {
    const trimmedQuery = nextQuery.trim();
    if (!trimmedQuery) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveQuery(trimmedQuery);

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
  const isMapMode = viewMode === 'map';

  const focusPlaceOnMap = useCallback(
    (place: PlaceSummary, nextViewMode: ViewMode = 'map') => {
      setSelectedPlaceId(place.id);
      setViewMode(nextViewMode);
    },
    [],
  );

  const heroHeight = Math.max(windowHeight - insets.top - 220, 360);
  const isSearchDisabled = isLoading;
  const hasQuery = query.trim().length > 0;

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSelectedPlaceId(null);
    setError(null);
    setActiveQuery('');
    setViewMode('list');
    Keyboard.dismiss();
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.fixedHeader}>
        <View style={styles.pageHeader}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputShell}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSearchDisabled}
                onChangeText={setQuery}
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  void runSearch(query);
                }}
                placeholder="Search cafes, parks, beaches…"
                placeholderTextColor="#6B7280"
                returnKeyType="search"
                style={[
                  styles.searchInput,
                  hasQuery ? styles.searchInputWithClear : null,
                  isSearchDisabled ? styles.searchInputDisabled : null,
                ]}
                value={query}
              />
              {hasQuery ? (
                <Pressable
                  accessibilityLabel="Clear search"
                  accessibilityRole="button"
                  onPress={clearSearch}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>×</Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable
              accessibilityState={{ disabled: isSearchDisabled, busy: isLoading }}
              disabled={isSearchDisabled}
              onPress={() => {
                Keyboard.dismiss();
                void runSearch(query);
              }}
              style={[styles.searchButton, isSearchDisabled ? styles.searchButtonDisabled : null]}
            >
              {isLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
              <Text style={styles.searchButtonLabel}>{isLoading ? 'Searching…' : 'Search'}</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingBanner}>
              <ActivityIndicator color="#1D4ED8" size="small" />
              <View style={styles.loadingBannerCopy}>
                <Text numberOfLines={1} style={styles.loadingBannerTitle}>
                  Searching “{activeQuery}”
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.resultsSummaryRow}>
            <View style={styles.resultsBadge}>
              <Text style={styles.resultsBadgeText}>{results.length} spots</Text>
            </View>
            <View style={styles.viewToggle}>
              {(['list', 'map'] as ViewMode[]).map((mode) => {
                const isActive = viewMode === mode;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    key={mode}
                    onPress={() => setViewMode(mode)}
                    style={[styles.viewToggleButton, isActive ? styles.viewToggleButtonActive : null]}
                  >
                    <Text style={[styles.viewToggleText, isActive ? styles.viewToggleTextActive : null]}>
                      {mode === 'list' ? 'List' : 'Map'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.headerDivider} />
      </View>

      {viewMode === 'list' ? (
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sheet}>
            {!isLoading && !error && results.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>No search results at the moment</Text>
                <Text style={styles.emptyStateText}>
                  Try a broader suburb, a nearby landmark, or a simpler query. The map is still here — just less theatrical.
                </Text>
              </View>
            ) : null}

            {results.length > 0 ? (
              <View style={styles.resultsList}>
                {results.map((item) => {
                  const isSelected = item.id === selectedPlace?.id;

                  return (
                    <View key={item.id} style={[styles.placeCard, isSelected ? styles.placeCardSelected : null]}>
                      <Pressable
                        accessibilityHint="Opens the place detail screen"
                        accessibilityLabel={`Open details for ${item.name}`}
                        onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id } })}
                        style={styles.placeCardBody}
                      >
                        <View style={styles.placeCardHeader}>
                          <StatusPill status={item.dogPolicyStatus} />
                          <TrustPill level={getTrustLevel(item)} />
                        </View>
                        <Text style={styles.placeName}>{item.name}</Text>
                        <Text style={styles.placeCategory}>{item.category}</Text>
                        <Text numberOfLines={2} style={styles.placeMeta}>
                          {item.formattedAddress}
                        </Text>
                        <Text numberOfLines={2} style={styles.placeSummary}>
                          {item.summary}
                        </Text>
                        <Text numberOfLines={2} style={styles.placeTrustNote}>
                          {getTrustShortNote(getTrustLevel(item))}
                        </Text>
                      </Pressable>

                      <View style={styles.placeCardFooter}>
                        <Text style={styles.placeCardActionPrimary}>Open details</Text>
                        <Pressable
                          accessibilityHint="Highlights this place on the map"
                          onPress={() => focusPlaceOnMap(item)}
                          style={styles.placeCardMapButton}
                        >
                          <Text style={styles.placeCardMapButtonText}>{isSelected ? 'View on map again' : 'View on map'}</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.mapScreen}>
          <View style={[styles.mapPanel, isMapMode ? styles.mapPanelFullBleed : null]}>
            <View style={[styles.mapFrame, isMapMode ? styles.mapFrameFullBleed : null, { minHeight: heroHeight }]}> 
              <PlaceMap
                heroHeight={heroHeight}
                isLoading={isLoading}
                onMapReady={() => undefined}
                onSelectPlace={(place) => focusPlaceOnMap(place, 'map')}
                results={results}
                selectedPlaceId={selectedPlace?.id ?? null}
              />

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
                  style={[styles.selectedPlaceCard, isLoading ? styles.selectedPlaceCardLoading : null]}
                >
                  <View style={styles.selectedPlaceTopRow}>
                    <View style={styles.selectedPlaceHeader}>
                      <StatusPill status={selectedPlace.dogPolicyStatus} />
                      <TrustPill level={getTrustLevel(selectedPlace)} />
                    </View>
                    <Text style={styles.selectedPlaceActionInline}>Open details →</Text>
                  </View>
                  <Text numberOfLines={2} style={styles.selectedPlaceName}>
                    {selectedPlace.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.selectedPlaceCategory}>
                    {selectedPlace.category}
                  </Text>
                  <Text numberOfLines={2} style={styles.selectedPlaceAddress}>
                    {selectedPlace.formattedAddress}
                  </Text>
                  <Text numberOfLines={2} style={styles.selectedPlaceTrustNote}>
                    {getTrustShortNote(getTrustLevel(selectedPlace))}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
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
  fixedHeader: {
    backgroundColor: '#F3F4F6',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    zIndex: 4,
  },
  headerDivider: {
    backgroundColor: 'rgba(226,232,240,0.95)',
    height: 1,
  },
  pageHeader: {
    backgroundColor: '#F3F4F6',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  mapScreen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  mapPanel: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  mapPanelFullBleed: {
    gap: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  mapFrame: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mapFrameFullBleed: {
    borderRadius: 0,
    borderWidth: 0,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInputShell: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'rgba(229,231,235,0.9)',
    borderRadius: 18,
    borderWidth: 1,
    color: '#111827',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingRight: 48,
    paddingVertical: 15,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  searchInputWithClear: {
    paddingRight: 48,
  },
  clearButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -15 }],
    width: 30,
  },
  clearButtonText: {
    color: '#6B7280',
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '700',
  },
  searchInputDisabled: {
    backgroundColor: 'rgba(248,250,252,0.96)',
    borderColor: 'rgba(191,219,254,0.95)',
    color: '#64748B',
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minWidth: 118,
    paddingHorizontal: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  searchButtonDisabled: {
    backgroundColor: '#1D4ED8',
  },
  searchButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingBanner: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: 'rgba(191,219,254,0.95)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  loadingBannerCopy: {
    flex: 1,
    gap: 2,
  },
  loadingBannerTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  resultsSummaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultsBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  resultsBadgeText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '700',
  },
  viewToggle: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    flexDirection: 'row',
    padding: 4,
  },
  viewToggleButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewToggleButtonActive: {
    backgroundColor: '#111827',
  },
  viewToggleText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  viewToggleTextActive: {
    color: '#FFFFFF',
  },
  emptyStateCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: 'rgba(226,232,240,0.95)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  emptyStateTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyStateText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
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
  selectedPlaceCardLoading: {
    opacity: 0.72,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedPlaceCategory: {
    color: '#6B7280',
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
  selectedPlaceTrustNote: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
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
    marginTop: 4,
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
  sheetTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
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
    gap: 10,
    minHeight: 116,
    padding: 14,
  },
  placeCardSelected: {
    backgroundColor: '#F8FBFF',
    borderColor: '#93C5FD',
  },
  placeCardBody: {
    gap: 7,
  },
  placeCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  placeTrustNote: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  placeCardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  placeCardActionPrimary: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
  placeCardMapButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  placeCardMapButtonText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },
});
