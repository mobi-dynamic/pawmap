export function slugifyPlaceName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'place';
}

export function buildPlaceSlug(name: string, placeId: string, preferredSlug?: string) {
  const baseSlug = preferredSlug ? slugifyPlaceName(preferredSlug) : slugifyPlaceName(name);
  return `${baseSlug}--${placeId}`;
}

export function buildGoogleResolvePath(googlePlaceId: string) {
  return `/place/google/${encodeURIComponent(googlePlaceId)}`;
}

export function parsePlaceSlug(placeSlug: string) {
  const separatorIndex = placeSlug.lastIndexOf('--plc_');
  if (separatorIndex === -1) {
    return { baseSlug: placeSlug, placeId: null };
  }

  return {
    baseSlug: placeSlug.slice(0, separatorIndex),
    placeId: placeSlug.slice(separatorIndex + 2),
  };
}
