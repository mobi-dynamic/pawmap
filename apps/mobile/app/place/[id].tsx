import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/status-pill';
import { samplePlaces } from '@/lib/mock-data';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = samplePlaces.find((item) => item.id === id) ?? samplePlaces[0];

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <StatusPill status={place.dogPolicyStatus} />
        <Text style={styles.title}>{place.name}</Text>
        <Text style={styles.subtitle}>{place.category} · {place.formattedAddress}</Text>
        <Text style={styles.body}>{place.summary}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>What this shell proves</Text>
        <Text style={styles.body}>1. Search can resolve into a canonical place detail screen.</Text>
        <Text style={styles.body}>2. Detail can highlight the current dog policy signal first.</Text>
        <Text style={styles.body}>3. The next action is a focused report flow, not a giant feature dump.</Text>
      </View>

      <Link href={{ pathname: '/report', params: { placeId: place.id } }} asChild>
        <View style={styles.primaryAction}>
          <Text style={styles.primaryActionLabel}>Open report draft</Text>
        </View>
      </Link>
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
});
