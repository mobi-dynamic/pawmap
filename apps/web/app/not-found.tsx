import Link from 'next/link';

import { StatePanel } from '@/components/state-panel';

export default function NotFound() {
  return (
    <StatePanel
      title="Place not found"
      description="That PawMap page does not exist yet, or the mock dataset does not include it in this FE-001 shell."
      action={{ label: 'Return home', href: '/' }}
    >
      <p className="text-sm text-slate-500">Use known examples like Royal Bark Cafe, Pawsome Park, or the cache-miss demo from the home screen.</p>
    </StatePanel>
  );
}
