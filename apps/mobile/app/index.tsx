import { Link } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { StatusPill } from '@/components/status-pill';
import { samplePlaces } from '@/lib/mock-data';
import { apiBaseUrl } from '@/lib/config';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Mobile MVP shell</Text>
        <Text style={styles.title}>Search first. Understand the rule fast. Report when reality differs.</Text>
        <Text style={styles.body}>
          This screen is intentionally thin: it anchors the first vertical slice for search → detail → report
          without pretending the whole product is done.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search</Text>
        <TextInput
          editable={false}
          placeholder="Search cafes, parks, beaches…"
          placeholderTextColor="#6B7280"
          style={styles.searchInput}
          value="Melbourne dog-friendly cafes"
        />
        <Text style={styles.meta}>API base URL: {apiBaseUrl}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggested first slice</Text>
        {samplePlaces.map((place) => (
          <Link href={{ pathname: '/place/[id]', params: { id: place.id } }} key={place.id} asChild>
            <View style={styles.placeCard}>
              <StatusPill status={place.dogPolicyStatus} />
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placeMeta}>{place.category} · {place.formattedAddress}</Text>
              <Text style={styles.body}>{place.summary}</Text>
            </View>
          </Link>
        ))}
      </View>
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
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  meta: {
    color: '#6B7280',
    fontSize: 13,
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
});
