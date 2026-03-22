'use client';

import { useMemo, useState } from 'react';

import { DogPolicyStatus, PlaceDetail, UserReportSubmission } from '@/lib/types';

type FormState = {
  proposedDogPolicyStatus: DogPolicyStatus | '';
  proposedIndoorAllowed: '' | 'true' | 'false';
  proposedOutdoorAllowed: '' | 'true' | 'false';
  proposedLeashRequired: '' | 'true' | 'false';
  proposedServiceDogOnly: '' | 'true' | 'false';
  proposedSizeRestriction: string;
  proposedBreedRestriction: string;
  proposedNotes: string;
  evidenceUrl: string;
  reporterComment: string;
};

const INITIAL_STATE: FormState = {
  proposedDogPolicyStatus: '',
  proposedIndoorAllowed: '',
  proposedOutdoorAllowed: '',
  proposedLeashRequired: '',
  proposedServiceDogOnly: '',
  proposedSizeRestriction: '',
  proposedBreedRestriction: '',
  proposedNotes: '',
  evidenceUrl: '',
  reporterComment: '',
};

function parseNullableBoolean(value: FormState['proposedIndoorAllowed']) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function buildPayload(placeId: string, state: FormState): UserReportSubmission {
  return {
    placeId,
    proposedDogPolicyStatus: state.proposedDogPolicyStatus || null,
    proposedIndoorAllowed: parseNullableBoolean(state.proposedIndoorAllowed),
    proposedOutdoorAllowed: parseNullableBoolean(state.proposedOutdoorAllowed),
    proposedLeashRequired: parseNullableBoolean(state.proposedLeashRequired),
    proposedServiceDogOnly: parseNullableBoolean(state.proposedServiceDogOnly),
    proposedSizeRestriction: state.proposedSizeRestriction,
    proposedBreedRestriction: state.proposedBreedRestriction,
    proposedNotes: state.proposedNotes,
    evidenceUrl: state.evidenceUrl,
    reporterComment: state.reporterComment,
  };
}

function getValidationMessage(payload: UserReportSubmission) {
  const hasSignal = Object.entries(payload).some(([key, value]) => key !== 'placeId' && value !== null && String(value).trim() !== '');

  if (!hasSignal) {
    return 'Add at least one policy change, note, evidence link, or comment before submitting.';
  }

  if (payload.evidenceUrl) {
    try {
      new URL(payload.evidenceUrl);
    } catch {
      return 'Evidence link must be a valid URL.';
    }
  }

  return null;
}

export function ReportSubmissionForm({ place }: { place: PlaceDetail }) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const payload = useMemo(() => buildPayload(place.placeId, form), [place.placeId, form]);
  const validationMessage = useMemo(() => getValidationMessage(payload), [payload]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextValidation = getValidationMessage(payload);

    if (nextValidation) {
      setError(nextValidation);
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? 'Could not submit the report right now.');
      }

      setForm(INITIAL_STATE);
      setSuccessMessage(`Report submitted. Reference ${data?.id ?? 'pending'} is now waiting for moderation review.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit the report right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectClasses =
    'mt-2 w-full rounded-2xl border border-[#deceb9] bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#6b4f36] focus:ring-2 focus:ring-[#6b4f36]/15';
  const inputClasses =
    'mt-2 w-full rounded-2xl border border-[#deceb9] bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#6b4f36] focus:ring-2 focus:ring-[#6b4f36]/15';

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-[#ecdcc8] bg-[#fcf7f1] px-4 py-3 text-xs text-slate-600">
        MVP auth uses the local dev identity wired through the web server. Submit only changes you would want reviewed by an admin.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Dog policy
          <select className={selectClasses} value={form.proposedDogPolicyStatus} onChange={(event) => setForm((current) => ({ ...current, proposedDogPolicyStatus: event.target.value as FormState['proposedDogPolicyStatus'] }))}>
            <option value="">No change</option>
            <option value="allowed">Dogs allowed</option>
            <option value="restricted">Restricted</option>
            <option value="not_allowed">Not allowed</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Indoor allowed
          <select className={selectClasses} value={form.proposedIndoorAllowed} onChange={(event) => setForm((current) => ({ ...current, proposedIndoorAllowed: event.target.value as FormState['proposedIndoorAllowed'] }))}>
            <option value="">No change</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Outdoor allowed
          <select className={selectClasses} value={form.proposedOutdoorAllowed} onChange={(event) => setForm((current) => ({ ...current, proposedOutdoorAllowed: event.target.value as FormState['proposedOutdoorAllowed'] }))}>
            <option value="">No change</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Leash required
          <select className={selectClasses} value={form.proposedLeashRequired} onChange={(event) => setForm((current) => ({ ...current, proposedLeashRequired: event.target.value as FormState['proposedLeashRequired'] }))}>
            <option value="">No change</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Service dog only
          <select className={selectClasses} value={form.proposedServiceDogOnly} onChange={(event) => setForm((current) => ({ ...current, proposedServiceDogOnly: event.target.value as FormState['proposedServiceDogOnly'] }))}>
            <option value="">No change</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Evidence link
          <input className={inputClasses} type="url" inputMode="url" placeholder="https://example.com/policy" value={form.evidenceUrl} onChange={(event) => setForm((current) => ({ ...current, evidenceUrl: event.target.value }))} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Size restriction
          <input className={inputClasses} type="text" placeholder="Small dogs only" value={form.proposedSizeRestriction} onChange={(event) => setForm((current) => ({ ...current, proposedSizeRestriction: event.target.value }))} />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Breed restriction
          <input className={inputClasses} type="text" placeholder="No listed breed restriction" value={form.proposedBreedRestriction} onChange={(event) => setForm((current) => ({ ...current, proposedBreedRestriction: event.target.value }))} />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Proposed notes
        <textarea className={`${inputClasses} min-h-28`} placeholder="Share the rule as it was explained or displayed on site." value={form.proposedNotes} onChange={(event) => setForm((current) => ({ ...current, proposedNotes: event.target.value }))} />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Reporter comment
        <textarea className={`${inputClasses} min-h-24`} placeholder="Add context for the moderator, like when you checked or who confirmed the policy." value={form.reporterComment} onChange={(event) => setForm((current) => ({ ...current, reporterComment: event.target.value }))} />
      </label>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {!error && successMessage ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMessage}</p> : null}
      {!error && !successMessage && validationMessage ? <p className="text-xs text-slate-500">{validationMessage}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full bg-[#6b4f36] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#5d442f] disabled:cursor-not-allowed disabled:bg-[#b89d80]"
        >
          {isSubmitting ? 'Submitting…' : 'Submit report'}
        </button>
        <p className="text-xs text-slate-500">Reports stay unpublished until an admin reviews them.</p>
      </div>
    </form>
  );
}
