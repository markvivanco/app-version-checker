/**
 * Version formatting utilities
 * Pure functions for formatting version strings
 */

/**
 * Format a version with optional build number
 * @param platformVersion The platform-specific version (e.g., "1.0.36")
 * @param buildNumber Optional build number (e.g., "349")
 * @returns Formatted version string (e.g., "1.0.36.349")
 */
export function formatVersionWithBuild(
  platformVersion: string,
  buildNumber?: string | number
): string {
  if (buildNumber !== undefined && buildNumber !== null && buildNumber !== '') {
    return `${platformVersion}.${buildNumber}`;
  }
  return platformVersion;
}

/**
 * Extract build number from version string
 * @param version Version string that may contain build number
 * @returns Build number or undefined
 */
export function extractBuildNumber(version: string): string | undefined {
  const parts = version.split('.');
  if (parts.length > 3) {
    return parts[3];
  }
  return undefined;
}

/**
 * Extract base version without build number
 * @param version Version string (e.g., "1.0.36.349")
 * @returns Base version without build (e.g., "1.0.36")
 */
export function extractBaseVersion(version: string): string {
  const parts = version.split('.');
  return parts.slice(0, 3).join('.');
}

/**
 * Normalize version string to ensure consistent format
 * @param version Version string to normalize
 * @param padToLength Minimum number of segments (default: 3)
 * @returns Normalized version string
 */
export function normalizeVersion(version: string, padToLength: number = 3): string {
  const parts = version.split('.');

  // Ensure all parts are valid numbers
  const numericParts = parts
    .map(part => parseInt(part, 10))
    .filter(num => !isNaN(num));

  // Pad with zeros if needed
  while (numericParts.length < padToLength) {
    numericParts.push(0);
  }

  return numericParts.join('.');
}

/**
 * Create a display-friendly version string
 * @param version Version string
 * @param includePrefix Whether to include "v" prefix
 * @returns Display version (e.g., "v1.0.36")
 */
export function formatDisplayVersion(
  version: string,
  includePrefix: boolean = true
): string {
  const normalized = normalizeVersion(version, 3);
  return includePrefix ? `v${normalized}` : normalized;
}

/**
 * Compare version strings for sorting
 * @param versions Array of version strings
 * @param descending Sort in descending order (latest first)
 * @returns Sorted array of versions
 */
export function sortVersions(versions: string[], descending: boolean = true): string[] {
  const sorted = [...versions].sort((a, b) => {
    const aParts = a.split('.').map(num => parseInt(num, 10));
    const bParts = b.split('.').map(num => parseInt(num, 10));

    const maxLength = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < maxLength; i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;

      if (aPart !== bPart) {
        return descending ? bPart - aPart : aPart - bPart;
      }
    }

    return 0;
  });

  return sorted;
}

/**
 * Get the latest version from an array of versions
 * @param versions Array of version strings
 * @returns Latest version string or null if array is empty
 */
export function getLatestVersion(versions: string[]): string | null {
  if (!versions || versions.length === 0) {
    return null;
  }

  const sorted = sortVersions(versions, true);
  return sorted[0];
}