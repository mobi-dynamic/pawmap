import { StyleSheet, Text, View } from 'react-native';

import { getPolicyStatusLabel } from '@/lib/policy-presentations';
import type { DogPolicyStatus } from '@/lib/types';

const STATUS_COLORS: Record<DogPolicyStatus, string> = {
  allowed: '#DCFCE7',
  restricted: '#FEF3C7',
  not_allowed: '#FEE2E2',
  unknown: '#E5E7EB',
};

export function StatusPill({ status }: { status: DogPolicyStatus }) {
  return (
    <View style={[styles.pill, { backgroundColor: STATUS_COLORS[status] }]}>
      <Text style={styles.label}>{getPolicyStatusLabel(status)}</Text>
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
