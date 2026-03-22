import { Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/status-pill';
import { getPlaceDetail } from '@/lib/api';
import type { PlaceDetail } from '@/lib/types';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlace = useCallback(async () => {
    if (!id) {
      setError('Place id is missing.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const item = await getPlaceDetail(id);
      setPlace(item);
    } catch (loadError) {
      setPlace(null);
      setError(loadError instanceof Error ? loadError.message : 'Place load failed.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadPlace();
  }, [loadPlace]);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {isLoading ? (
        <View style={styles.card}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.body}>Loading place details…</Text>
        </View>
      ) : error || !place ? (
        <View style={styles.card}>
          <Text style={styles.title}>Place unavailable</Text>
          <Text style={styles.body}>{error ?? 'The place could not be loaded.'}</Text>
          <Pressable onPress={() => void loadPlace()} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <StatusPill status={place.petRules.dogPolicyStatus} />
            <Text style={styles.title}>{place.name}</Text>
            <Text style={styles.subtitle}>
              {place.category} · {place.formattedAddress}
            </Text>
            <Text style={styles.body}>{place.summary}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Current rule signal</Text>
            <Text style={styles.ruleLine}>Indoor: {formatAllowance(place.petRules.indoorAllowed)}</Text>
            <Text style={styles.ruleLine}>Outdoor: {formatAllowance(place.petRules.outdoorAllowed)}</Text>
            <Text style={styles.ruleLine}>Leash required: {formatAllowance(place.petRules.leashRequired)}</Text>
            <Text style={styles.ruleLine}>Service dog only: {formatAllowance(place.petRules.serviceDogOnly)}</Text>
            {place.petRules.sizeRestriction ? (
              <Text style={styles.body}>Size restriction: {place.petRules.sizeRestriction}</Text>
            ) : null}
            {place.petRules.notes ? <Text style={styles.body}>{place.petRules.notes}</Text> : null}
            {place.websiteUrl ? <Text style={styles.linkText}>Website: {place.websiteUrl}</Text> : null}
            {place.petRules.verificationSourceUrl ? (
              <Text style={styles.linkText}>Evidence: {place.petRules.verificationSourceUrl}</Text>
            ) : null}
          </View>

          <Link href={{ pathname: '/report', params: { placeId: place.id } }} asChild>
            <Pressable style={styles.primaryAction}>
              <Text style={styles.primaryActionLabel}>Open report draft</Text>
            </Pressable>
          </Link>
        </>
      )}
    </ScrollView>
  );
}

function formatAllowance(value: boolean | null) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unknown';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F9FAFB',
    gap: 16,
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 10,
    padding: 18,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 15,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 22,
  },
  ruleLine: {
    color: '#111827',
    fontSize: 15,
  },
  linkText: {
    color: '#2563EB',
    fontSize: 14,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  primaryActionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryAction: {
    alignSelf: 'flex-start',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryActionLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
});
