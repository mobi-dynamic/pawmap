import { StyleSheet, Text, View } from 'react-native';

import type { DogPolicyStatus } from '@/lib/types';

const STATUS_LABELS: Record<DogPolicyStatus, string> = {
  allowed: 'Allowed',
  restricted: 'Restricted',
  not_allowed: 'Not allowed',
  unknown: 'Unknown',
};

const STATUS_COLORS: Record<DogPolicyStatus, string> = {
  allowed: '#DCFCE7',
  restricted: '#FEF3C7',
  not_allowed: '#FEE2E2',
  unknown: '#E5E7EB',
};

export function StatusPill({ status }: { status: DogPolicyStatus }) {
  return (
    <View style={[styles.pill, { backgroundColor: STATUS_COLORS[status] }]}>
      <Text style={styles.label}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
});
