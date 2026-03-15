'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ShellCard } from '@/components/shell-card';
import { StatePanel } from '@/components/state-panel';
import { StatusBadge } from '@/components/status-badge';
import { AdminReport } from '@/lib/types';

type ActionState = {
  type: 'approve' | 'reject';
  loading: boolean;
  error: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) return 'Not reviewed yet';
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatNullableRule(value: boolean | string | null) {
  if (value === null) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value;
}

export function AdminModerationShell({ initialReports }: { initialReports: AdminReport[] }) {
  const [reports, setReports] = useState(initialReports);
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [rejectDrafts, setRejectDrafts] = useState<Record<string, string>>({});
  const [pageError, setPageError] = useState<string | null>(null);

  const pendingReports = useMemo(() => reports.filter((report) => report.status === 'pending'), [reports]);
  const reviewedReports = useMemo(() => reports.filter((report) => report.status !== 'pending'), [reports]);

  async function runAction(reportId: string, type: 'approve' | 'reject') {
    const reviewNotes = rejectDrafts[reportId]?.trim() ?? '';
    if (type === 'reject' && reviewNotes.length < 3) {
      setActionStates((current) => ({
        ...current,
        [reportId]: { type, loading: false, error: 'Add a short rejection reason so the decision is traceable.' },
      }));
      return;
    }

    setPageError(null);
    setActionStates((current) => ({
      ...current,
      [reportId]: { type, loading: true, error: null },
    }));

    try {
      const response = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: type === 'reject' ? JSON.stringify({ reviewNotes }) : undefined,
      });
      const payload = (await response.json()) as { reviewedAt?: string; reviewedByUserId?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Moderation action failed.');
      }

      setReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: type === 'approve' ? 'approved' : 'rejected',
                reviewedAt: payload.reviewedAt ?? new Date().toISOString(),
                reviewedByUserId: payload.reviewedByUserId ?? report.reviewedByUserId,
                reviewNotes: type === 'reject' ? reviewNotes : report.reviewNotes,
              }
            : report,
        ),
      );

      if (type === 'reject') {
        setRejectDrafts((current) => ({ ...current, [reportId]: '' }));
      }

      setActionStates((current) => ({
        ...current,
        [reportId]: { type, loading: false, error: null },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Moderation action failed.';
      setActionStates((current) => ({
        ...current,
        [reportId]: { type, loading: false, error: message },
      }));
      setPageError(message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#e7ddd2] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.92))] p-6 shadow-panel md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-[#eadfce] bg-[#faf3e9] px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-slate-600">
              Admin moderation
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Review incoming dog policy reports</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              Pending reports stay separate from published rules until an admin approves or rejects them.
            </p>
          </div>
          <div className="rounded-3xl border border-[#eadfce] bg-[#fbf6ef] px-4 py-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">{pendingReports.length}</span> pending
            </p>
            <p>
              <span className="font-semibold text-slate-900">{reviewedReports.length}</span> reviewed
            </p>
          </div>
        </div>
      </section>

      {pageError ? <StatePanel tone="warning" title="Could not finish the moderation action" description={pageError} /> : null}

      {pendingReports.length === 0 ? (
        <StatePanel
          title="Queue clear"
          description="No pending reports need review right now. New reports will appear here when users submit policy updates."
          action={{ label: 'Back to search', href: '/' }}
        />
      ) : (
        <section className="space-y-4">
          {pendingReports.map((report) => {
            const actionState = actionStates[report.id];
            const isLoading = actionState?.loading ?? false;

            return (
              <ShellCard key={report.id} title={report.place?.name ?? `Place ${report.placeId}`} eyebrow={`Status · ${report.status}`}>
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-base font-medium text-slate-900">{report.place?.formattedAddress ?? 'Address unavailable'}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {report.place?.category ?? 'Place'} · Submitted {formatDateTime(report.createdAt)} · Reporter {report.reporterUserId}
                      </p>
                      {report.place ? (
                        <Link href={`/place/${report.place.placeSlug}`} className="mt-3 inline-flex text-sm font-medium text-[#6b4f36] transition hover:text-[#5d442f]">
                          Open place page →
                        </Link>
                      ) : null}
                    </div>
                    <StatusBadge status={report.proposedDogPolicyStatus ?? 'unknown'} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[#eadfce] bg-[#fcf8f2] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Proposed changes</p>
                      <dl className="mt-3 space-y-2 text-sm text-slate-700">
                        <div className="flex justify-between gap-4"><dt>Dog policy</dt><dd className="font-medium text-slate-900">{formatNullableRule(report.proposedDogPolicyStatus?.replace('_', ' ') ?? null)}</dd></div>
                        <div className="flex justify-between gap-4"><dt>Indoor allowed</dt><dd>{formatNullableRule(report.proposedIndoorAllowed)}</dd></div>
                        <div className="flex justify-between gap-4"><dt>Outdoor allowed</dt><dd>{formatNullableRule(report.proposedOutdoorAllowed)}</dd></div>
                        <div className="flex justify-between gap-4"><dt>Leash required</dt><dd>{formatNullableRule(report.proposedLeashRequired)}</dd></div>
                        <div className="flex justify-between gap-4"><dt>Service dog only</dt><dd>{formatNullableRule(report.proposedServiceDogOnly)}</dd></div>
                        <div className="flex justify-between gap-4"><dt>Size restriction</dt><dd>{formatNullableRule(report.proposedSizeRestriction)}</dd></div>
                        <div className="flex justify-between gap-4"><dt>Breed restriction</dt><dd>{formatNullableRule(report.proposedBreedRestriction)}</dd></div>
                      </dl>
                      {report.proposedNotes ? <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm text-slate-700">{report.proposedNotes}</p> : null}
                    </div>

                    <div className="rounded-2xl border border-[#eadfce] bg-[#fcf8f2] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Evidence and context</p>
                      <div className="mt-3 space-y-3 text-sm text-slate-700">
                        <div>
                          <p className="font-medium text-slate-900">Reporter comment</p>
                          <p className="mt-1">{report.reporterComment ?? 'No comment provided.'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Evidence link</p>
                          {report.evidenceUrl ? (
                            <a href={report.evidenceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex break-all text-[#6b4f36] underline decoration-[#d9c3ae] underline-offset-4">
                              {report.evidenceUrl}
                            </a>
                          ) : (
                            <p className="mt-1">No evidence link provided.</p>
                          )}
                        </div>
                        <label className="block">
                          <span className="font-medium text-slate-900">Reject notes</span>
                          <textarea
                            value={rejectDrafts[report.id] ?? ''}
                            onChange={(event) => setRejectDrafts((current) => ({ ...current, [report.id]: event.target.value }))}
                            rows={4}
                            disabled={isLoading}
                            placeholder="Explain why this should not be published"
                            className="mt-2 w-full rounded-2xl border border-[#dfd2c4] bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6b4f36] focus-visible:ring-4 focus-visible:ring-[#eadbca] disabled:cursor-wait disabled:bg-slate-50"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {actionState?.error ? <p className="text-sm font-medium text-rose-700">{actionState.error}</p> : null}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => runAction(report.id, 'approve')}
                      disabled={isLoading}
                      className="rounded-full bg-[#6b4f36] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#5d442f] disabled:cursor-wait disabled:bg-[#b7a28d]"
                    >
                      {isLoading && actionState?.type === 'approve' ? 'Approving…' : 'Approve and publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(report.id, 'reject')}
                      disabled={isLoading}
                      className="rounded-full border border-[#dfd2c4] bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#ccb8a3] hover:bg-[#fdf8f1] disabled:cursor-wait disabled:bg-slate-50"
                    >
                      {isLoading && actionState?.type === 'reject' ? 'Rejecting…' : 'Reject report'}
                    </button>
                  </div>
                </div>
              </ShellCard>
            );
          })}
        </section>
      )}

      {reviewedReports.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recently reviewed</h2>
            <p className="text-sm text-slate-500">Updated in this session after approval or rejection.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {reviewedReports.map((report) => (
              <div key={report.id} className="rounded-3xl border border-[#e7ddd2] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,239,0.88))] p-5 shadow-panel">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{report.place?.name ?? report.placeId}</p>
                    <p className="mt-1 text-sm text-slate-500">Reviewed {formatDateTime(report.reviewedAt)}</p>
                  </div>
                  <StatusBadge status={report.proposedDogPolicyStatus ?? 'unknown'} />
                </div>
                <p className="mt-3 text-sm text-slate-700">Report status: <span className="font-medium capitalize text-slate-900">{report.status}</span></p>
                {report.reviewNotes ? <p className="mt-2 text-sm text-slate-600">{report.reviewNotes}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
