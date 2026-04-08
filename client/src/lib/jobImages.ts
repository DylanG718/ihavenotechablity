/**
 * jobImages.ts — Runtime image lookup for job art.
 *
 * Images live in /public/assets/jobs/{variant}/
 * The public folder is served at root in production.
 *
 * Variants: base | success | failure | busted
 *
 * Naming convention: IMG_JOB_{ART_KEY_UPPER}_{VARIANT_UPPER}_001.png
 * e.g. /assets/jobs/base/IMG_JOB_PROTECTION_ROUNDS_BASE_001.png
 */

export type JobImageVariant = 'base' | 'success' | 'failure' | 'busted';

/**
 * Returns the public URL for a job image.
 * Returns null if the art_key is empty (no image generated yet).
 */
export function getJobImageUrl(
  artKey: string,
  variant: JobImageVariant,
): string | null {
  if (!artKey) return null;
  const slug = artKey.toUpperCase().replace(/-/g, '_');
  const v    = variant.toUpperCase();
  return `/assets/jobs/${variant}/IMG_JOB_${slug}_${v}_001.png`;
}

/**
 * Returns the base image URL for a job card.
 * Used in the default/browsing state of the card.
 */
export function getJobBaseImage(artKey: string): string | null {
  return getJobImageUrl(artKey, 'base');
}

/**
 * Returns the appropriate result image for a given outcome.
 * Falls back to base if a variant is not available.
 */
export function getJobResultImage(
  artKey: string,
  success: boolean,
  jailed: boolean,
  hasBustedImage: boolean,
): string | null {
  if (!artKey) return null;
  if (jailed && hasBustedImage) return getJobImageUrl(artKey, 'busted');
  if (success)  return getJobImageUrl(artKey, 'success');
  return getJobImageUrl(artKey, 'failure');
}
