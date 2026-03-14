import { StatePanel } from '@/components/state-panel';

export default function NotFound() {
  return (
    <StatePanel
      title="Place page not found"
      description="That PawMap page does not exist or is no longer available."
      action={{ label: 'Back to search', href: '/' }}
    >
      <p className="text-sm text-slate-500">This is different from a cache miss. A cache miss means the upstream place exists, but PawMap has not cached it yet.</p>
    </StatePanel>
  );
}
