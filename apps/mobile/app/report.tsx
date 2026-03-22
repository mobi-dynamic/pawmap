import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { buildApiUrl } from '@/lib/config';

export default function ReportScreen() {
  const { placeId } = useLocalSearchParams<{ placeId?: string }>();

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Report draft</Text>
        <Text style={styles.body}>This is the next vertical slice entry point for POST /reports.</Text>
        <Text style={styles.body}>Place ID: {placeId ?? 'missing'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Planned request target</Text>
        <Text style={styles.endpoint}>{buildApiUrl('/reports')}</Text>
        <Text style={styles.body}>
          Next implementation should replace this placeholder with form fields, auth-aware submission, and
          success/error states.
        </Text>
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
  endpoint: {
    color: '#111827',
    fontFamily: 'Courier',
    fontSize: 14,
  },
});
