import { useLocalSearchParams } from 'expo-router';
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
import { buildApiUrl, devUserId } from '@/lib/config';
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
  { label: 'No change', value: null },
  { label: 'Allowed', value: 'allowed' },
  { label: 'Restricted', value: 'restricted' },
  { label: 'Not allowed', value: 'not_allowed' },
  { label: 'Unknown', value: 'unknown' },
];

const BOOLEAN_OPTIONS: Array<{ label: string; value: boolean | null }> = [
  { label: 'No change', value: null },
  { label: 'Yes', value: true },
  { label: 'No', value: false },
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
      setLoadError('Place id is missing. Open this screen from a place detail view.');
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
      setSuccessMessage(`Report submitted. Reference ${response.id} is now waiting for moderation review.`);
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
          <Text style={styles.body}>Loading place for report…</Text>
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
          <View style={styles.card}>
            <StatusPill status={place.petRules.dogPolicyStatus} />
            <Text style={styles.title}>{place.name}</Text>
            <Text style={styles.subtitle}>
              {place.category} · {place.formattedAddress}
            </Text>
            <Text style={styles.body}>{place.summary}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Report submission</Text>
            <Text style={styles.body}>Submit what you saw or were told. Reports stay unpublished until an admin reviews them.</Text>
            <Text style={styles.meta}>POST target: {buildApiUrl('/reports')}</Text>
            <Text style={styles.meta}>Dev reporter header: {devUserId}</Text>
          </View>

          <View style={styles.card}>
            <FieldLabel label="Dog policy">
              <OptionRow<DogPolicyStatus | null>
                options={POLICY_OPTIONS}
                selectedValue={form.proposedDogPolicyStatus}
                onSelect={(value) => setForm((current) => ({ ...current, proposedDogPolicyStatus: value }))}
              />
            </FieldLabel>

            <FieldLabel label="Indoor allowed">
              <OptionRow<boolean | null>
                options={BOOLEAN_OPTIONS}
                selectedValue={form.proposedIndoorAllowed}
                onSelect={(value) => setForm((current) => ({ ...current, proposedIndoorAllowed: value }))}
              />
            </FieldLabel>

            <FieldLabel label="Outdoor allowed">
              <OptionRow<boolean | null>
                options={BOOLEAN_OPTIONS}
                selectedValue={form.proposedOutdoorAllowed}
                onSelect={(value) => setForm((current) => ({ ...current, proposedOutdoorAllowed: value }))}
              />
            </FieldLabel>

            <FieldLabel label="Leash required">
              <OptionRow<boolean | null>
                options={BOOLEAN_OPTIONS}
                selectedValue={form.proposedLeashRequired}
                onSelect={(value) => setForm((current) => ({ ...current, proposedLeashRequired: value }))}
              />
            </FieldLabel>

            <FieldLabel label="Service dog only">
              <OptionRow<boolean | null>
                options={BOOLEAN_OPTIONS}
                selectedValue={form.proposedServiceDogOnly}
                onSelect={(value) => setForm((current) => ({ ...current, proposedServiceDogOnly: value }))}
              />
            </FieldLabel>

            <FieldLabel label="Size restriction">
              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, proposedSizeRestriction: value }))}
                placeholder="Small dogs only"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={form.proposedSizeRestriction}
              />
            </FieldLabel>

            <FieldLabel label="Breed restriction">
              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, proposedBreedRestriction: value }))}
                placeholder="No listed breed restriction"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={form.proposedBreedRestriction}
              />
            </FieldLabel>

            <FieldLabel label="Evidence link">
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

            <FieldLabel label="Proposed notes">
              <TextInput
                multiline
                onChangeText={(value) => setForm((current) => ({ ...current, proposedNotes: value }))}
                placeholder="Share the rule as it was explained or displayed on site."
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.textArea]}
                textAlignVertical="top"
                value={form.proposedNotes}
              />
            </FieldLabel>

            <FieldLabel label="Reporter comment">
              <TextInput
                multiline
                onChangeText={(value) => setForm((current) => ({ ...current, reporterComment: value }))}
                placeholder="Add context for the moderator, like when you checked or who confirmed the policy."
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.textArea]}
                textAlignVertical="top"
                value={form.reporterComment}
              />
            </FieldLabel>

            {submitError ? <Text style={styles.errorBanner}>{submitError}</Text> : null}
            {!submitError && successMessage ? <Text style={styles.successBanner}>{successMessage}</Text> : null}
            {!submitError && !successMessage && validationMessage ? (
              <Text style={styles.helperText}>{validationMessage}</Text>
            ) : null}

            <Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} style={styles.primaryAction}>
              <Text style={styles.primaryActionLabel}>{isSubmitting ? 'Submitting…' : 'Submit report'}</Text>
            </Pressable>
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

function OptionRow<T extends string | boolean | null>({
  options,
  selectedValue,
  onSelect,
}: {
  options: Array<{ label: string; value: T }>;
  selectedValue: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((option) => {
        const isSelected = option.value === selectedValue;

        return (
          <Pressable
            key={`${option.label}-${String(option.value)}`}
            onPress={() => onSelect(option.value)}
            style={[styles.optionChip, isSelected ? styles.optionChipSelected : null]}
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
  meta: {
    color: '#6B7280',
    fontSize: 13,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: '#111827',
    fontSize: 15,
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
