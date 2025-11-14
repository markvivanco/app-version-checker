/**
 * Core types for version checking
 */

export type Platform = 'ios' | 'android' | 'web';

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  storeUrl: string | null;
  platform: Platform;
}

export interface VersionCheckOptions {
  /** Minimum time between version checks in milliseconds */
  minCheckInterval?: number;
  /** Duration to wait after user selects "Remind Me Later" in milliseconds */
  remindLaterDuration?: number;
  /** Whether to skip version checking on web platform */
  skipWebPlatform?: boolean;
  /** Custom platform detection function */
  getPlatform?: () => Platform;
}

export interface VersionCheckTimestamps {
  lastCheckTime: number | null;
  remindLaterTime: number | null;
}

export interface AppStoreConfig {
  /** iOS App Store ID */
  iosAppStoreId?: string;
  /** Android package name */
  androidPackageName?: string;
  /** Custom iOS App Store URL */
  iosStoreUrl?: string;
  /** Custom Android Play Store URL */
  androidStoreUrl?: string;
}

export interface VersionCheckResult {
  /** Whether an update is available */
  shouldShowPrompt: boolean;
  /** Version information */
  versionInfo: VersionInfo;
  /** Reason for not showing prompt (if applicable) */
  skipReason?: 'no_update' | 'web_platform' | 'remind_later' | 'too_soon' | 'error';
}

/** Version check intervals (in milliseconds) */
export const DEFAULT_CHECK_INTERVALS = {
  MIN_CHECK_INTERVAL: 60 * 60 * 1000, // 1 hour minimum between checks
  REMIND_LATER_DURATION: 24 * 60 * 60 * 1000, // 24 hours for "remind me later"
} as const;