/**
 * Main VersionChecker class
 * Coordinates version checking using pluggable providers
 */

import {
  Platform,
  VersionInfo,
  VersionCheckOptions,
  VersionCheckResult,
  DEFAULT_CHECK_INTERVALS,
} from './types';
import { isUpdateAvailable } from './version-compare';
import { getStoreUrl } from './stores';
import { IVersionDataProvider } from '../providers/data-provider.interface';
import { IStorageProvider } from '../providers/storage-provider.interface';

export class VersionChecker {
  private dataProvider: IVersionDataProvider;
  private storageProvider: IStorageProvider;
  private options: Required<VersionCheckOptions>;
  private initialized: boolean = false;

  constructor(
    dataProvider: IVersionDataProvider,
    storageProvider: IStorageProvider,
    options: VersionCheckOptions = {}
  ) {
    this.dataProvider = dataProvider;
    this.storageProvider = storageProvider;

    // Merge with default options
    this.options = {
      minCheckInterval: options.minCheckInterval ?? DEFAULT_CHECK_INTERVALS.MIN_CHECK_INTERVAL,
      remindLaterDuration: options.remindLaterDuration ?? DEFAULT_CHECK_INTERVALS.REMIND_LATER_DURATION,
      skipWebPlatform: options.skipWebPlatform ?? true,
      getPlatform: options.getPlatform ?? (() => this.detectPlatform()),
    };
  }

  /**
   * Initialize the version checker
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize providers if they have initialization logic
    if (this.dataProvider.initialize) {
      await this.dataProvider.initialize();
    }

    if (this.storageProvider.initialize) {
      await this.storageProvider.initialize();
    }

    this.initialized = true;
  }

  /**
   * Detect the current platform
   */
  private detectPlatform(): Platform {
    // Use provider's platform detection if available
    if (this.dataProvider.getCurrentPlatform) {
      return this.dataProvider.getCurrentPlatform();
    }

    // Basic platform detection
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator?.userAgent || '';

      if (/android/i.test(userAgent)) {
        return 'android';
      }

      if (/iPad|iPhone|iPod/.test(userAgent)) {
        return 'ios';
      }

      return 'web';
    }

    // Default to web if we can't determine
    return 'web';
  }

  /**
   * Get the current platform
   */
  getPlatform(): Platform {
    return this.options.getPlatform();
  }

  /**
   * Get version information
   */
  async getVersionInfo(): Promise<VersionInfo> {
    const platform = this.getPlatform();
    const currentVersion = await this.dataProvider.getCurrentVersion();
    const latestVersion = await this.dataProvider.getLatestVersion(platform);
    const appStoreConfig = await this.dataProvider.getAppStoreConfig();

    const updateAvailable = latestVersion
      ? isUpdateAvailable(currentVersion, latestVersion)
      : false;

    const storeUrl = getStoreUrl(platform, appStoreConfig);

    return {
      currentVersion,
      latestVersion,
      updateAvailable,
      storeUrl,
      platform,
    };
  }

  /**
   * Check if an update is available
   */
  async isUpdateAvailable(): Promise<boolean> {
    const platform = this.getPlatform();

    // Skip check for web platform if configured
    if (platform === 'web' && this.options.skipWebPlatform) {
      return false;
    }

    const versionInfo = await this.getVersionInfo();
    return versionInfo.updateAvailable;
  }

  /**
   * Check if we should show the update prompt
   */
  async shouldShowUpdatePrompt(): Promise<VersionCheckResult> {
    const platform = this.getPlatform();

    // Skip for web platform if configured
    if (platform === 'web' && this.options.skipWebPlatform) {
      const versionInfo = await this.getVersionInfo();
      return {
        shouldShowPrompt: false,
        versionInfo,
        skipReason: 'web_platform',
      };
    }

    try {
      const versionInfo = await this.getVersionInfo();

      // No update available
      if (!versionInfo.updateAvailable) {
        return {
          shouldShowPrompt: false,
          versionInfo,
          skipReason: 'no_update',
        };
      }

      // Check if we're in "remind me later" period
      const remindLaterTime = await this.storageProvider.getRemindLaterTime();
      if (remindLaterTime && Date.now() < remindLaterTime) {
        return {
          shouldShowPrompt: false,
          versionInfo,
          skipReason: 'remind_later',
        };
      }

      // Check minimum interval between checks
      const lastCheckTime = await this.storageProvider.getLastCheckTime();
      if (lastCheckTime && Date.now() - lastCheckTime < this.options.minCheckInterval) {
        return {
          shouldShowPrompt: false,
          versionInfo,
          skipReason: 'too_soon',
        };
      }

      // Check if this version was already shown (optional)
      if (this.storageProvider.getLastShownVersion) {
        const lastShownVersion = await this.storageProvider.getLastShownVersion();
        if (lastShownVersion === versionInfo.latestVersion) {
          // Still check mandatory updates
          if (this.dataProvider.isUpdateMandatory) {
            const isMandatory = await this.dataProvider.isUpdateMandatory(
              versionInfo.currentVersion,
              versionInfo.latestVersion!
            );
            if (!isMandatory) {
              return {
                shouldShowPrompt: false,
                versionInfo,
                skipReason: 'remind_later',
              };
            }
          } else {
            return {
              shouldShowPrompt: false,
              versionInfo,
              skipReason: 'remind_later',
            };
          }
        }
      }

      // Update last check time
      await this.storageProvider.setLastCheckTime(Date.now());

      // Record shown version if supported
      if (this.storageProvider.setLastShownVersion && versionInfo.latestVersion) {
        await this.storageProvider.setLastShownVersion(versionInfo.latestVersion);
      }

      return {
        shouldShowPrompt: true,
        versionInfo,
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      const versionInfo = await this.getVersionInfo();
      return {
        shouldShowPrompt: false,
        versionInfo,
        skipReason: 'error',
      };
    }
  }

  /**
   * Set "remind me later" for the update prompt
   */
  async setRemindMeLater(): Promise<void> {
    const remindTime = Date.now() + this.options.remindLaterDuration;
    await this.storageProvider.setRemindLaterTime(remindTime);

    // Increment dismiss count if supported
    if (this.storageProvider.incrementDismissCount) {
      await this.storageProvider.incrementDismissCount();
    }
  }

  /**
   * Clear the "remind me later" setting
   */
  async clearRemindMeLater(): Promise<void> {
    await this.storageProvider.clearRemindLaterTime();
  }

  /**
   * Check if update is mandatory
   */
  async isUpdateMandatory(): Promise<boolean> {
    if (!this.dataProvider.isUpdateMandatory) {
      return false;
    }

    const versionInfo = await this.getVersionInfo();
    if (!versionInfo.latestVersion) {
      return false;
    }

    return await this.dataProvider.isUpdateMandatory(
      versionInfo.currentVersion,
      versionInfo.latestVersion
    );
  }

  /**
   * Get changelog for the latest version
   */
  async getChangeLog(): Promise<string | null> {
    if (!this.dataProvider.getChangeLog) {
      return null;
    }

    const versionInfo = await this.getVersionInfo();
    if (!versionInfo.latestVersion) {
      return null;
    }

    return await this.dataProvider.getChangeLog(versionInfo.latestVersion);
  }

  /**
   * Reset all version check data (useful for testing)
   */
  async resetVersionCheckData(): Promise<void> {
    await this.storageProvider.clearRemindLaterTime();
    await this.storageProvider.setLastCheckTime(0);

    if (this.storageProvider.clearAll) {
      await this.storageProvider.clearAll();
    }
  }

  /**
   * Get formatted version string
   */
  async getFormattedVersion(): Promise<string> {
    if (this.dataProvider.getFormattedVersion) {
      return await this.dataProvider.getFormattedVersion();
    }

    return await this.dataProvider.getCurrentVersion();
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    if (this.dataProvider.dispose) {
      await this.dataProvider.dispose();
    }

    if (this.storageProvider.dispose) {
      await this.storageProvider.dispose();
    }

    this.initialized = false;
  }
}