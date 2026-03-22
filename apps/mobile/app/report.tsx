import { useLocalSearchParams, Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { StatusPill } from '@/components/status-pill';
import { getPlaceDetail, getReportValidationMessage, submitReport } from '@/lib/api';
import type { DogPolicyStatus, PlaceDetail, ReportSubmissionInput } from '@/lib/types';

type FormState = {
  proposedDogPolicyStatus: DogPolicyStatus | null;
  proposedIndoorAllowed: boolean | null;
  proposedOutdoorAllowed: boolean | null;
  proposedLeashRequired: boolean | null;
  proposedServiceDogOnly: boolean | null;
  proposedSizeRestriction: string;
  proposedBreedRestriction: string;
  proposedNotes: string;
  evidenceUrl: string;
  reporterComment: string;
};

const INITIAL_FORM: FormState = {
  proposedDogPolicyStatus: null,
  proposedIndoorAllowed: null,
  proposedOutdoorAllowed: null,
  proposedLeashRequired: null,
  proposedServiceDogOnly: null,
  proposedSizeRestriction: '',
  proposedBreedRestriction: '',
  proposedNotes: '',
  evidenceUrl: '',
  reporterComment: '',
};

const POLICY_OPTIONS: Array<{ label: string; value: DogPolicyStatus | null }> = [
  { label: 'Not sure', value: null },
  { label: 'Allowed', value: 'allowed' },
  { label: 'Restricted', value: 'restricted' },
  { label: 'Not allowed', value: 'not_allowed' },
  { label: 'Unknown', value: 'unknown' },
];

const BOOLEAN_OPTIONS: Array<{ label: string; value: boolean | null }> = [
  { label: 'Not sure', value: null },
  { label: 'Yes', value: true },
  { label: 'No', value: false },
];

const QUICK_FACT_FIELDS: Array<{
  label: string;
  key:
    | 'proposedIndoorAllowed'
    | 'proposedOutdoorAllowed'
    | 'proposedLeashRequired'
    | 'proposedServiceDogOnly';
}> = [
  { label: 'Dogs allowed inside', key: 'proposedIndoorAllowed' },
  { label: 'Dogs allowed outside', key: 'proposedOutdoorAllowed' },
  { label: 'Leash required', key: 'proposedLeashRequired' },
  { label: 'Service dogs only', key: 'proposedServiceDogOnly' },
];

export default function ReportScreen() {
  const { placeId } = useLocalSearchParams<{ placeId?: string }>();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isLoadingPlace, setIsLoadingPlace] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const payload = useMemo<ReportSubmissionInput>(
    () => ({
      placeId: placeId ?? '',
      proposedDogPolicyStatus: form.proposedDogPolicyStatus,
      proposedIndoorAllowed: form.proposedIndoorAllowed,
      proposedOutdoorAllowed: form.proposedOutdoorAllowed,
      proposedLeashRequired: form.proposedLeashRequired,
      proposedSizeRestriction: form.proposedSizeRestriction,
      proposedBreedRestriction: form.proposedBreedRestriction,
      proposedServiceDogOnly: form.proposedServiceDogOnly,
      proposedNotes: form.proposedNotes,
      evidenceUrl: form.evidenceUrl,
      reporterComment: form.reporterComment,
    }),
    [form, placeId],
  );
  const validationMessage = useMemo(() => getReportValidationMessage(payload), [payload]);

  const loadPlace = useCallback(async () => {
    if (!placeId) {
      setPlace(null);
      setLoadError('This report needs to start from a place screen.');
      setIsLoadingPlace(false);
      return;
    }

    setIsLoadingPlace(true);
    setLoadError(null);

    try {
      const item = await getPlaceDetail(placeId);
      setPlace(item);
    } catch (error) {
      setPlace(null);
      setLoadError(error instanceof Error ? error.message : 'Place load failed.');
    } finally {
      setIsLoadingPlace(false);
    }
  }, [placeId]);

  useEffect(() => {
    void loadPlace();
  }, [loadPlace]);

  async function handleSubmit() {
    const nextValidation = getReportValidationMessage(payload);
    if (nextValidation) {
      setSubmitError(nextValidation);
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const response = await submitReport(payload);
      setForm(INITIAL_FORM);
      setSuccessMessage(`Thanks — your update was sent for review. Reference ${response.id}.`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit the report right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {isLoadingPlace ? (
        <View style={styles.card}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.body}>Loading place details…</Text>
        </View>
      ) : loadError || !place ? (
        <View style={styles.card}>
          <Text style={styles.title}>Report unavailable</Text>
          <Text style={styles.body}>{loadError ?? 'The place could not be loaded.'}</Text>
          <Pressable onPress={() => void loadPlace()} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={[styles.card, styles.summaryCard]}>
            <StatusPill status={place.petRules.dogPolicyStatus} />
            <Text style={styles.title}>{place.name}</Text>
            <Text style={styles.subtitle}>
              {place.category} · {place.formattedAddress}
            </Text>
            <Text style={styles.summaryHeadline}>Current policy</Text>
            <Text style={styles.body}>{place.summary}</Text>
            <View style={styles.currentPolicyList}>
              <PolicyRow label="Indoor access" value={formatAllowance(place.petRules.indoorAllowed)} />
              <PolicyRow label="Outdoor access" value={formatAllowance(place.petRules.outdoorAllowed)} />
              <PolicyRow label="Leash required" value={formatAllowance(place.petRules.leashRequired)} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Suggest a correction</Text>
            <Text style={styles.body}>
              Share only what changed or what you confirmed. Leave anything you did not check as “Not sure.”
            </Text>
          </View>

          <View style={styles.card}>
            <FieldLabel label="Overall policy today">
              <OptionRow<DogPolicyStatus | null>
                options={POLICY_OPTIONS}
                selectedValue={form.proposedDogPolicyStatus}
                onSelect={(value) => setForm((current) => ({ ...current, proposedDogPolicyStatus: value }))}
              />
            </FieldLabel>

            <FieldLabel label="Quick facts">
              <View style={styles.quickFactsGrid}>
                {QUICK_FACT_FIELDS.map((field) => (
                  <View key={field.key} style={styles.quickFactCard}>
                    <Text style={styles.quickFactLabel}>{field.label}</Text>
                    <OptionRow<boolean | null>
                      compact
                      options={BOOLEAN_OPTIONS}
                      selectedValue={form[field.key]}
                      onSelect={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                    />
                  </View>
                ))}
              </View>
            </FieldLabel>

            <FieldLabel label="What did you see or get told?">
              <TextInput
                multiline
                onChangeText={(value) => setForm((current) => ({ ...current, proposedNotes: value }))}
                placeholder="Example: Staff said dogs are welcome on the patio but not inside."
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.textArea]}
                textAlignVertical="top"
                value={form.proposedNotes}
              />
            </FieldLabel>

            <FieldLabel label="Helpful context (optional)">
              <TextInput
                multiline
                onChangeText={(value) => setForm((current) => ({ ...current, reporterComment: value }))}
                placeholder="When did you check? Was it a sign, staff member, or menu note?"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.textAreaSmall]}
                textAlignVertical="top"
                value={form.reporterComment}
              />
            </FieldLabel>

            <FieldLabel label="Evidence link (optional)">
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                onChangeText={(value) => setForm((current) => ({ ...current, evidenceUrl: value }))}
                placeholder="https://example.com/policy"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={form.evidenceUrl}
              />
            </FieldLabel>

            <FieldLabel label="Size limit (optional)">
              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, proposedSizeRestriction: value }))}
                placeholder="Example: Small dogs only"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={form.proposedSizeRestriction}
              />
            </FieldLabel>

            <FieldLabel label="Breed limit (optional)">
              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, proposedBreedRestriction: value }))}
                placeholder="Leave blank if none mentioned"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={form.proposedBreedRestriction}
              />
            </FieldLabel>

            {submitError ? <Text style={styles.errorBanner}>{submitError}</Text> : null}
            {!submitError && successMessage ? <Text style={styles.successBanner}>{successMessage}</Text> : null}
            {!submitError && !successMessage && validationMessage ? (
              <Text style={styles.helperText}>{validationMessage}</Text>
            ) : null}

            <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={styles.primaryAction}>
              <Text style={styles.primaryActionLabel}>{isSubmitting ? 'Sending…' : 'Send update'}</Text>
            </Pressable>

            <Link href={{ pathname: '/place/[id]', params: { id: place.id } }} asChild>
              <Pressable style={styles.inlineSecondaryAction}>
                <Text style={styles.inlineSecondaryActionLabel}>Back to place details</Text>
              </Pressable>
            </Link>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.policyRow}>
      <Text style={styles.policyLabel}>{label}</Text>
      <Text style={styles.policyValue}>{value}</Text>
    </View>
  );
}

function OptionRow<T extends string | boolean | null>({
  options,
  selectedValue,
  onSelect,
  compact = false,
}: {
  options: Array<{ label: string; value: T }>;
  selectedValue: T;
  onSelect: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((option) => {
        const isSelected = option.value === selectedValue;

        return (
          <Pressable
            key={`${option.label}-${String(option.value)}`}
            onPress={() => onSelect(option.value)}
            style={[
              styles.optionChip,
              compact ? styles.optionChipCompact : null,
              isSelected ? styles.optionChipSelected : null,
            ]}
          >
            <Text style={[styles.optionChipLabel, isSelected ? styles.optionChipLabelSelected : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 14,
    padding: 18,
  },
  summaryCard: {
    gap: 12,
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
    fontSize: 18,
    fontWeight: '700',
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
  currentPolicyList: {
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  policyRow: {
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  policyLabel: {
    color: '#374151',
    fontSize: 15,
  },
  policyValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  quickFactsGrid: {
    gap: 12,
  },
  quickFactCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    gap: 10,
    padding: 12,
  },
  quickFactLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderColor: '#D1D5DB',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionChipCompact: {
    minWidth: 78,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  optionChipSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  optionChipLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  optionChipLabelSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 110,
  },
  textAreaSmall: {
    minHeight: 88,
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
  inlineSecondaryAction: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  inlineSecondaryActionLabel: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
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
  helperText: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 14,
    borderWidth: 1,
    color: '#B91C1C',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: 14,
    borderWidth: 1,
    color: '#047857',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
