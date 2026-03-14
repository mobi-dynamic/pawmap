import { DogPolicyStatus } from '@/lib/types';

const statusStyles: Record<DogPolicyStatus, string> = {
  allowed: 'border border-emerald-200/80 bg-emerald-50/90 text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
  restricted: 'border border-amber-200/80 bg-amber-50/90 text-amber-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  not_allowed: 'border border-rose-200/80 bg-rose-50/90 text-rose-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  unknown: 'border border-[#e5d9ca] bg-[#fbf5ee] text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]',
};

const statusLabels: Record<DogPolicyStatus, string> = {
  allowed: 'Dogs allowed',
  restricted: 'Rules apply',
  not_allowed: 'Dogs not allowed',
  unknown: 'Policy unknown',
};

export function StatusBadge({ status }: { status: DogPolicyStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
