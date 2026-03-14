export const placeCacheMissContent = {
  title: 'This place is not in PawMap yet',
  description:
    'We found the provider reference, but PawMap has not cached this place yet, so we cannot show a trusted policy page.',
  action: { label: 'Back to results', href: '/' },
  explainerTitle: 'This is different from “Policy unknown.”',
  explainerDescription: 'Unknown means the place exists in PawMap, but its dog policy is still unverified.',
  secondaryAction: { label: 'Search again', href: '/' },
} as const;
