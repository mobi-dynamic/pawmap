import { DogPolicyStatus } from '@/lib/types';

const statusStyles: Record<DogPolicyStatus, string> = {
  allowed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  restricted: 'bg-amber-50 text-amber-700 ring-amber-200',
  not_allowed: 'bg-rose-50 text-rose-700 ring-rose-200',
  unknown: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const statusLabels: Record<DogPolicyStatus, string> = {
  allowed: 'Dogs allowed',
  restricted: 'Rules apply',
  not_allowed: 'Dogs not allowed',
  unknown: 'Policy unknown',
};

export function StatusBadge({ status }: { status: DogPolicyStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
