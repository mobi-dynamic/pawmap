import { AdminModerationShell } from '@/components/admin-moderation-shell';
import { StatePanel } from '@/components/state-panel';
import { listAdminReports } from '@/lib/admin-moderation-repository';
import { getDevAdminHeaders } from '@/lib/api/client';

export const dynamic = 'force-dynamic';

export default async function AdminModerationPage() {
  try {
    const { items } = await listAdminReports({ limit: 50 });
    const devHeaders = getDevAdminHeaders();

    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-[#e7ddd2] bg-[#fbf6ef] px-5 py-4 text-sm text-slate-600 shadow-panel">
          <p className="font-medium text-slate-900">Local admin identity</p>
          <p className="mt-1">
            Using <code className="rounded bg-white px-2 py-1 text-xs text-slate-700">{devHeaders['X-Role']}</code> as{' '}
            <code className="rounded bg-white px-2 py-1 text-xs text-slate-700">{devHeaders['X-User-Id']}</code>.
          </p>
          <p className="mt-2 text-xs text-slate-500">Set PAWMAP_DEV_ADMIN_USER_ID and PAWMAP_DEV_ADMIN_ROLE in apps/web/.env.local to change this locally.</p>
        </div>
        <AdminModerationShell initialReports={items} />
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load admin moderation reports.';

    return (
      <StatePanel
        tone="warning"
        title="Could not load admin moderation"
        description={`${message} Check PAWMAP_API_BASE_URL and your local dev moderator headers, then refresh.`}
        action={{ label: 'Back to search', href: '/' }}
      />
    );
  }
}
