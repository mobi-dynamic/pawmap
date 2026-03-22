import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { StatusPill } from '@/components/status-pill';
import { apiBaseUrl } from '@/lib/config';
import { searchPlaces } from '@/lib/api';
import type { PlaceSummary } from '@/lib/types';

const INITIAL_QUERY = 'dog friendly cafes';

export default function HomeScreen() {
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [results, setResults] = useState<PlaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (nextQuery: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const items = await searchPlaces(nextQuery);
      setResults(items);
    } catch (searchError) {
      setResults([]);
      setError(searchError instanceof Error ? searchError.message : 'Search failed.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void runSearch(INITIAL_QUERY);
  }, [runSearch]);

  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Mobile MVP shell</Text>
        <Text style={styles.title}>Search first. Understand the rule fast. Report when reality differs.</Text>
        <Text style={styles.body}>The mobile shell now hits the real PawMap API for search and detail.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search</Text>
        <View style={styles.searchRow}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            onSubmitEditing={() => void runSearch(query)}
            placeholder="Search cafes, parks, beaches…"
            placeholderTextColor="#6B7280"
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          <Pressable onPress={() => void runSearch(query)} style={styles.searchButton}>
            <Text style={styles.searchButtonLabel}>{isLoading ? 'Loading…' : 'Search'}</Text>
          </Pressable>
        </View>
        <Text style={styles.meta}>API base URL: {apiBaseUrl}</Text>
      </View>

      {error ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>Search failed</Text>
          <Text style={styles.body}>{error}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.messageCard}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.body}>Loading places…</Text>
        </View>
      ) : (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Results</Text>
          {results.length === 0 ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageTitle}>No matching places yet</Text>
              <Text style={styles.body}>Try a broader search or nearby suburb.</Text>
            </View>
          ) : (
            <FlatList
              contentContainerStyle={styles.resultsList}
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Link href={{ pathname: '/place/[id]', params: { id: item.id } }} asChild>
                  <Pressable style={styles.placeCard}>
                    <StatusPill status={item.dogPolicyStatus} />
                    <Text style={styles.placeName}>{item.name}</Text>
                    <Text style={styles.placeMeta}>
                      {item.category} · {item.formattedAddress}
                    </Text>
                    <Text style={styles.body}>{item.summary}</Text>
                  </Pressable>
                </Link>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    gap: 16,
    padding: 20,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 10,
    padding: 18,
  },
  eyebrow: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  body: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 12,
  },
  resultsSection: {
    flex: 1,
    gap: 12,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  searchButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: '#6B7280',
    fontSize: 13,
  },
  resultsList: {
    gap: 12,
    paddingBottom: 12,
  },
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    gap: 10,
    padding: 16,
  },
  placeName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  placeMeta: {
    color: '#6B7280',
    fontSize: 14,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    gap: 10,
    padding: 16,
  },
  messageTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
});
