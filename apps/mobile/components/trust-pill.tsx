import { StyleSheet, Text, View } from 'react-native';

import { getTrustLabel, type TrustLevel } from '@/lib/policy-presentations';

const TRUST_COLORS: Record<TrustLevel, { background: string; text: string }> = {
  verified: { background: '#DBEAFE', text: '#1D4ED8' },
  inferred: { background: '#FEF3C7', text: '#B45309' },
  needs_verification: { background: '#E5E7EB', text: '#4B5563' },
};

export function TrustPill({ level }: { level: TrustLevel }) {
  const palette = TRUST_COLORS[level];

  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}> 
      <Text style={[styles.label, { color: palette.text }]}>{getTrustLabel(level)}</Text>
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
    fontSize: 12,
    fontWeight: '700',
  },
});
