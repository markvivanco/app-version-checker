/**
 * Core version comparison utilities
 * Pure functions with no external dependencies
 */

/**
 * Compare two semantic version strings
 * Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(num => parseInt(num, 10));
  const parts2 = v2.split('.').map(num => parseInt(num, 10));

  // Pad arrays to same length
  const maxLength = Math.max(parts1.length, parts2.length);
  while (parts1.length < maxLength) parts1.push(0);
  while (parts2.length < maxLength) parts2.push(0);

  for (let i = 0; i < maxLength; i++) {
    if (parts1[i] < parts2[i]) return -1;
    if (parts1[i] > parts2[i]) return 1;
  }

  return 0;
}

/**
 * Check if an update is available by comparing versions
 */
export function isUpdateAvailable(currentVersion: string, latestVersion: string): boolean {
  return compareVersions(currentVersion, latestVersion) < 0;
}

/**
 * Parse a version string into its components
 */
export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
  build?: number;
} {
  const parts = version.split('.').map(num => parseInt(num, 10));
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
    build: parts[3] // Optional build number
  };
}

/**
 * Format version components back into a string
 */
export function formatVersion(
  major: number,
  minor: number,
  patch: number,
  build?: number
): string {
  const parts = [major, minor, patch];
  if (build !== undefined) {
    parts.push(build);
  }
  return parts.join('.');
}

/**
 * Get the major version from a version string
 */
export function getMajorVersion(version: string): number {
  return parseVersion(version).major;
}

/**
 * Get the minor version from a version string
 */
export function getMinorVersion(version: string): number {
  return parseVersion(version).minor;
}

/**
 * Get the patch version from a version string
 */
export function getPatchVersion(version: string): number {
  return parseVersion(version).patch;
}

/**
 * Check if version is a valid semantic version string
 */
export function isValidVersion(version: string): boolean {
  const regex = /^\d+\.\d+\.\d+(\.\d+)?$/;
  return regex.test(version);
}

/**
 * Get the difference between two versions
 * Returns an object describing what changed
 */
export function getVersionDiff(v1: string, v2: string): {
  type: 'major' | 'minor' | 'patch' | 'build' | 'none';
  fromVersion: string;
  toVersion: string;
} {
  const comparison = compareVersions(v1, v2);

  if (comparison === 0) {
    return { type: 'none', fromVersion: v1, toVersion: v2 };
  }

  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);

  let type: 'major' | 'minor' | 'patch' | 'build' = 'build';

  if (parsed1.major !== parsed2.major) {
    type = 'major';
  } else if (parsed1.minor !== parsed2.minor) {
    type = 'minor';
  } else if (parsed1.patch !== parsed2.patch) {
    type = 'patch';
  }

  return {
    type,
    fromVersion: comparison < 0 ? v1 : v2,
    toVersion: comparison < 0 ? v2 : v1
  };
}