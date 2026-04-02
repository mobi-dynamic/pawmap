import { Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/status-pill';
import { TrustPill } from '@/components/trust-pill';
import { getNearbyPlaces, getPlaceDetail } from '@/lib/api';
import {
  getConfidenceNote,
  getPolicyHeadline,
  getTrustLevel,
  getTrustMessage,
  getTrustShortNote,
} from '@/lib/policy-presentations';
import type { PlaceDetail, PlaceSummary, VerificationSourceType } from '@/lib/types';

const DETAIL_ITEMS: Array<{
  label: string;
  key: 'indoorAllowed' | 'outdoorAllowed' | 'leashRequired' | 'serviceDogOnly';
}> = [
  { label: 'Indoor access', key: 'indoorAllowed' },
  { label: 'Outdoor access', key: 'outdoorAllowed' },
  { label: 'Leash required', key: 'leashRequired' },
  { label: 'Service dogs only', key: 'serviceDogOnly' },
];

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

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
      setIsLoadingNearby(true);
      setNearbyError(null);

      try {
        const items = await getNearbyPlaces({
          lat: item.lat,
          lng: item.lng,
          radiusMeters: 2000,
          limit: 6,
        });
        setNearbyPlaces(items.filter((candidate) => candidate.id !== item.id));
      } catch (nearbyLoadError) {
        setNearbyPlaces([]);
        setNearbyError(
          nearbyLoadError instanceof Error ? nearbyLoadError.message : 'Nearby places failed to load.',
        );
      } finally {
        setIsLoadingNearby(false);
      }
    } catch (loadError) {
      setPlace(null);
      setNearbyPlaces([]);
      setNearbyError(null);
      setError(loadError instanceof Error ? loadError.message : 'Place load failed.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadPlace();
  }, [loadPlace]);

  const trustLevel = useMemo(() => {
    if (!place) return 'needs_verification';

    return getTrustLevel({
      dogPolicyStatus: place.petRules.dogPolicyStatus,
      verifiedAt: place.petRules.verifiedAt ?? place.verifiedAt,
      verificationSourceType: place.petRules.verificationSourceType,
      confidenceScore: place.petRules.confidenceScore ?? place.confidenceScore,
      policyTrustLevel: place.petRules.policyTrustLevel ?? place.policyTrustLevel,
    });
  }, [place]);

  const trustSummary = useMemo(() => {
    if (!place) return [];

    return [
      {
        label: 'Trust',
        value: getTrustMessage(trustLevel),
      },
      {
        label: 'Source',
        value: formatSourceType(place.petRules.verificationSourceType),
      },
      {
        label: 'Last checked',
        value: formatDate(place.petRules.verifiedAt ?? place.verifiedAt),
      },
    ];
  }, [place, trustLevel]);

  const confidenceNote = useMemo(
    () => (place ? getConfidenceNote(place.petRules.confidenceScore ?? place.confidenceScore) : null),
    [place],
  );

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
          <View style={[styles.card, styles.heroCard]}>
            <View style={styles.heroBadgeRow}>
              <StatusPill status={place.petRules.dogPolicyStatus} />
              <TrustPill level={trustLevel} />
            </View>
            <Text style={styles.title}>{place.name}</Text>
            <Text style={styles.subtitle}>
              {place.category} · {place.formattedAddress}
            </Text>
            <Text style={styles.summaryHeadline}>{getPolicyHeadline(place.petRules.dogPolicyStatus)}</Text>
            <Text style={styles.body}>{place.summary}</Text>
            <Text style={styles.trustMessage}>{getTrustShortNote(trustLevel)}</Text>

            <View style={styles.trustGrid}>
              {trustSummary.map((item) => (
                <View key={item.label} style={styles.trustItem}>
                  <Text style={styles.trustLabel}>{item.label}</Text>
                  <Text style={styles.trustValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            {confidenceNote ? <Text style={styles.confidenceNote}>{confidenceNote}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>What to expect</Text>
            <View style={styles.detailList}>
              {DETAIL_ITEMS.map((item) => (
                <View key={item.key} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{formatAllowance(place.petRules[item.key])}</Text>
                </View>
              ))}
            </View>

            {place.petRules.sizeRestriction ? (
              <View style={styles.noteBlock}>
                <Text style={styles.noteTitle}>Size limits</Text>
                <Text style={styles.body}>{place.petRules.sizeRestriction}</Text>
              </View>
            ) : null}

            {place.petRules.breedRestriction ? (
              <View style={styles.noteBlock}>
                <Text style={styles.noteTitle}>Breed limits</Text>
                <Text style={styles.body}>{place.petRules.breedRestriction}</Text>
              </View>
            ) : null}

            {place.petRules.notes ? (
              <View style={styles.noteBlock}>
                <Text style={styles.noteTitle}>Notes</Text>
                <Text style={styles.body}>{place.petRules.notes}</Text>
              </View>
            ) : null}
          </View>

          {(place.websiteUrl || place.petRules.verificationSourceUrl) ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Where this comes from</Text>
              {place.websiteUrl ? (
                <View style={styles.sourceRow}>
                  <Text style={styles.sourceLabel}>Venue website</Text>
                  <Text style={styles.linkText}>{place.websiteUrl}</Text>
                </View>
              ) : null}
              {place.petRules.verificationSourceUrl ? (
                <View style={styles.sourceRow}>
                  <Text style={styles.sourceLabel}>Policy source</Text>
                  <Text style={styles.linkText}>{place.petRules.verificationSourceUrl}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Nearby places</Text>
            <Text style={styles.body}>Real places near this spot from PawMap’s nearby search endpoint.</Text>

            {isLoadingNearby ? (
              <View style={styles.nearbyState}>
                <ActivityIndicator color="#2563EB" />
                <Text style={styles.body}>Loading nearby places…</Text>
              </View>
            ) : nearbyError ? (
              <View style={styles.nearbyState}>
                <Text style={styles.body}>{nearbyError}</Text>
              </View>
            ) : nearbyPlaces.length === 0 ? (
              <View style={styles.nearbyState}>
                <Text style={styles.body}>No other saved places are nearby yet.</Text>
              </View>
            ) : (
              <View style={styles.nearbyList}>
                {nearbyPlaces.map((item) => (
                  <Link href={{ pathname: '/place/[id]', params: { id: item.id } }} asChild key={item.id}>
                    <Pressable style={styles.nearbyCard}>
                      <View style={styles.nearbyCardHeader}>
                        <StatusPill status={item.dogPolicyStatus} />
                        <TrustPill level={getTrustLevel(item)} />
                      </View>
                      <Text numberOfLines={2} style={styles.nearbyName}>
                        {item.name}
                      </Text>
                      <Text numberOfLines={1} style={styles.nearbyCategory}>
                        {item.category}
                      </Text>
                      <Text numberOfLines={2} style={styles.nearbyAddress}>
                        {item.formattedAddress}
                      </Text>
                      <Text numberOfLines={2} style={styles.nearbySummary}>
                        {item.summary}
                      </Text>
                      <Text numberOfLines={2} style={styles.nearbyTrustNote}>
                        {getTrustShortNote(getTrustLevel(item))}
                      </Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.card, styles.reportCard]}>
            <Text style={styles.sectionTitle}>Something look off?</Text>
            <Text style={styles.body}>
              Send a quick correction if the policy has changed or you saw something different.
            </Text>
            <Link href={{ pathname: '/report', params: { placeId: place.id } }} asChild>
              <Pressable style={styles.primaryAction}>
                <Text style={styles.primaryActionLabel}>Suggest an update</Text>
              </Pressable>
            </Link>
          </View>
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

function formatDate(value: string | null) {
  if (!value) return 'Not verified yet';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatSourceType(value: VerificationSourceType | null) {
  if (!value) return 'Community report';

  const labels: Record<VerificationSourceType, string> = {
    official_website: 'Official website',
    direct_contact: 'Direct contact',
    user_report: 'Community report',
    onsite_signage: 'On-site signage',
    third_party_listing: 'Third-party listing',
    other: 'Other source',
  };

  return labels[value];
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F9FAFB',
    gap: 16,
    padding: 20,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 14,
    padding: 18,
  },
  heroCard: {
    gap: 12,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reportCard: {
    marginTop: -4,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
  },
  summaryHeadline: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
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
  trustMessage: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  trustItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    flexGrow: 1,
    gap: 4,
    minWidth: '30%',
    padding: 12,
  },
  trustLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  trustValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  confidenceNote: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  detailList: {
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailRow: {
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  detailLabel: {
    color: '#374151',
    fontSize: 15,
  },
  detailValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  noteBlock: {
    gap: 6,
  },
  noteTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  sourceRow: {
    gap: 4,
  },
  sourceLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  linkText: {
    color: '#2563EB',
    fontSize: 14,
    lineHeight: 20,
  },
  nearbyState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  nearbyList: {
    gap: 10,
  },
  nearbyCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  nearbyCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nearbyCategory: {
    color: '#6B7280',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  nearbyName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  nearbyAddress: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  nearbySummary: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  nearbyTrustNote: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
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
